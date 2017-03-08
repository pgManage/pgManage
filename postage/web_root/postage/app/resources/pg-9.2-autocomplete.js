var popup_instruct_top;
var autocompleteLoaded = true
  , autocompleteGlobals = {
        'popupOpen':       false
      , 'popupAsleep':     false
      , 'popupElement':    null
      , 'intSearchStart':  null
      , 'intSearchEnd':    null
      , 'intSearchOffset': null
      , 'arrSearch':       []
      , 'arrValues':       []
      , 'arrSearchMaster': []
      , 'arrValuesMaster': []
      , 'bolInserting':    false
      , 'strQueryID':      null
      , 'jsnKeywords':     {} // <-- filled in by the "autocompleteLoadKeywords" function
      , 'arrTypes':        [] // <-- filled in by the "autocompleteLoadTypes" function
      , 'loadId':          0
      //, 'currentLoadId':   0
      , 'arrCancelledIds': []
      , 'bolSnippets':     false
      , 'bolBound':        false
    };
var strSearchFixed;
function autocompleteStart() { 'use strict'; }

// this is called on every code tab's editor
function autocompleteBindEditor(tabElement, editor) {
    'use strict';
    if (!evt.touch_device) {
        if (!autocompleteGlobals.popupElement) {
            // create popup element
            autocompleteGlobals.popupElement = document.createElement('div');
            autocompleteGlobals.popupElement.setAttribute('id', 'autocomplete-popup');
            autocompleteGlobals.popupElement.innerHTML = '<div id="autocomplete-popup-instruction">Press Tab to Autocomplete&nbsp;</div><div id="autocomplete-popup-ace"></div>';

            // create and configure popup ace
            autocompleteGlobals.popupAce = ace.edit(autocompleteGlobals.popupElement.children[1]);
            autocompleteGlobals.popupAce.setTheme('ace/theme/clouds'); //eclipse
            autocompleteGlobals.popupAce.getSession().setMode('ace/mode/text');
            autocompleteGlobals.popupAce.setShowPrintMargin(false);
            autocompleteGlobals.popupAce.setDisplayIndentGuides(false);
            autocompleteGlobals.popupAce.setShowFoldWidgets(false);
            autocompleteGlobals.popupAce.setBehavioursEnabled(false);
            autocompleteGlobals.popupAce.setHighlightActiveLine(true);
            autocompleteGlobals.popupAce.$blockScrolling = Infinity; // <== blocks a warning
            autocompleteGlobals.popupAce.setValue('');
            autocompleteGlobals.popupAce.setReadOnly(true);
            autocompleteGlobals.popupAce.renderer.setShowGutter(false);
            autocompleteGlobals.popupAce.renderer.hideCursor();
            autocompleteGlobals.popupAce.renderer.$cursorLayer.element.style.display = 'none';
            autocompleteGlobals.popupAceSession = autocompleteGlobals.popupAce.getSession();

            // hide the popup and append it to the DOM (fixes first load problem)
            autocompleteGlobals.popupElement.style.left = '-500px';
            autocompleteGlobals.popupElement.style.top = '-500px';
            document.body.appendChild(autocompleteGlobals.popupElement);
            autocompleteGlobals.popupAce.setValue('test');
            autocompleteGlobals.popupAce.resize();

            // load autocomplete keywords and types
            autocompleteLoadKeywords();
            autocompleteLoadTypes();
        }

        // bind change event
        editor.addEventListener('change', function (event) {
            var tabString = editor.session.getTabString();
            //console.log(editor.currentQueryRange);//editor.getSelectionRange !== (null || undefined || '' || [] || {}));
            if (autocompleteGlobals.popupLoading === true &&
                    (event.lines[0] === tabString ||
                     event.lines[0] === ' ' ||
                     event.lines[0] === ',' ||
                     event.lines[0] === '"' ||
                     event.lines[0] === "'" ||
                     event.lines[0] === '.' ||
                     event.lines[0] === '/')) {
                autocompleteGlobals.arrCancelledIds.push(autocompleteGlobals.loadId);
                autocompletePopupClose(editor);
            } else {
                if (event.lines[0].length !== 0 && event.lines[0].length === 1) {
                    if (editor.ignoreChange !== true
                            && event.action === 'insert'
                            && autocompleteGlobals.bolInserting === false
                            && editor.currentQueryRange) {
                                
                        
                        try {
                            // this function is in pg-9.2-autocomplete-logic.js
                            
                            var selectionRanges = editor.currentSelections[0];
                            
                            if (editor.currentSelections.length > 1) {
                                if (
                                    selectionRanges.start.row === event.start.row &&
                                    selectionRanges.start.column === event.start.column &&
                                    selectionRanges.end.row === event.end.row &&
                                    selectionRanges.end.column + 1 === event.end.column
                                ) {
                                    autocompleteChangeHandler(tabElement, editor, event);
                                }
                            } else {
                                autocompleteChangeHandler(tabElement, editor, event);
                            }
                            
                        } catch (e) {
                            console.error('Caught Autocomplete Error:', e);
                        }
                    } else if (editor.ignoreChange !== true
                            && event.action === 'insert'
                            && autocompleteGlobals.bolInserting === false) {
                        var selectionRanges = editor.currentSelections[0];
                        if (editor.currentSelections.length > 1) {
                            if (
                                selectionRanges.start.row === event.start.row &&
                                selectionRanges.start.column === event.start.column &&
                                selectionRanges.end.row === event.end.row &&
                                selectionRanges.end.column + 1 === event.end.column
                            ) {
                                snippetHandler(event.lines[0], event, editor);
                            }
                        } else {
                            snippetHandler(event.lines[0], event, editor);
                        }
                        
                    } else if (editor.ignoreChange !== true
                            && event.action === 'remove'
                            && autocompleteGlobals.bolInserting === false
                            && editor.currentQueryRange) {
                                
                        
                        try {
                            // this function is in pg-9.2-autocomplete-logic.js
                            
                            var selectionRanges = editor.currentSelections[0];
                            
                            if (editor.currentSelections.length > 1) {
                                if (
                                    selectionRanges.start.row === event.start.row &&
                                    selectionRanges.start.column === event.start.column &&
                                    selectionRanges.end.row === event.end.row &&
                                    selectionRanges.end.column + 1 === event.end.column
                                ) {
                                    autocompleteChangeHandler(tabElement, editor, event);
                                }
                            } else {
                                autocompleteChangeHandler(tabElement, editor, event);
                            }
                            
                            
                            
                        } catch (e) {
                            console.error('Caught Autocomplete Error:', e);
                        }
                    }
                }
            }
        });
        
        
        //editor.container.addEventListener('range-update', function (event) {
        //    console.log('test 2', editor.currentQueryRange, event);
        //});
        //editor.container.addEventListener('keyup', function (event) {
        //    //console.log('test 2', editor.currentQueryRange, event);
        //    if (autocompleteGlobals.popupOpen === false
        //     && (event.code !== 'Backspace' && event.code !== 'Delete')
        //     && editor.currentQueryRange) {
        //        
        //        event.action = 'insert';
        //        event.selection = editor.getSelectionRange();
        //        event.start = event.selection.start;
        //        event.end = event.selection.end;
        //        
        //        autocompleteChangeHandler(tabElement, editor, event);
        //    }
        //});
        
        // bind search
        editor.addEventListener('change', function (event) {
            if (event.action === 'insert') {
                autocompleteGlobals.intSearchEnd = rowAndColumnToIndex(editor.getValue(), event.end.row, event.end.column);
            } else if (event.action === 'remove') {
                //autocompleteGlobals.intSearchEnd = rowAndColumnToIndex(editor.getValue(), event.start.row, event.start.column);
                autocompleteGlobals.intSearchEnd = rowAndColumnToIndex(editor.getValue(), event.start.row, event.start.column);
            }
            
            if (autocompleteGlobals.bolInserting === false) {
                if (autocompleteGlobals.popupOpen === true && autocompleteGlobals.popupLoading === false) {
                    // if the search text start is less than the search text end: search else: close
                    if (autocompleteGlobals.intSearchStart < autocompleteGlobals.intSearchEnd) {
                        autocompletePopupSearch(editor, (event.action === 'insert' ? 'filter' : 'expand'));
                    } else {
                        autocompletePopupClose(editor);
                    }
                }
            }
        });
        
        // bind scroll
        editor.session.addEventListener('changeScrollTop', function (event) {
            if (autocompleteGlobals.popupOpen === true && autocompleteGlobals.popupLoading === false) {
                autocompletePopupClose(editor);
            }
        });
        
        //editor.container.addEventListener('range-update', function () { });
        //editor.addEventListener('change', function () { });
    }
}



// ##############################################################################
// ######################### POPUP OPEN/CLOSE/LOAD CODE #########################
// ##############################################################################

// this function loads data into the autocomplete popup
function autocompletePopupLoad(editor, arrQueries) {
    'use strict';
    var bolResults = false, intResult = 0;
    var intLoadId;
    
    autocompleteGlobals.loadId += 1;
    intLoadId = autocompleteGlobals.loadId;
    //autocompleteGlobals.currentLoadId = intLoadId;
    autocompleteGlobals.popupAce.setValue('');
    autocompleteGlobals.arrSearch = [];
    autocompleteGlobals.arrValues = [];
    autocompleteGlobals.arrSearchMaster = [];
    autocompleteGlobals.arrValuesMaster = [];
    
    var strText = '', autocompleteTempList = [];
    
    autocompleteGetList(arrQueries, function (bolLast, arrRows) {
        var i, len, strSearch, element, strCurrent, strNext, strNextMeta, strCurrentMeta;
        if (autocompleteGlobals.arrCancelledIds.indexOf(intLoadId) === -1) {
            if (bolLast === true) {
                // set state variable
                autocompleteGlobals.popupLoading = false;
                
                // refresh popup height
                autocompletePopupHeightRefresh();
                //// select first line
                //autocompleteGlobals.popupAce.selection.setSelectionRange(new Range(0, 0, 0, 0));
                //autocompleteGlobals.popupAce.scrollToLine(0);
                
                var nextItem;
                var bolIsFunction = false;
                var bolFinalRecord = false;
                //console.log(autocompleteTempList);
                if (autocompleteTempList.length === 1) {
                    strCurrent = autocompleteTempList[0][0];
                    // create a search string (normalize to double quoted and lowercase)
                    strSearch = (strCurrent[0] === '"' ? strCurrent.toLowerCase() : '"' + strCurrent.toLowerCase() + '"');
                    
                    strText += '\n' + strCurrent;
                    autocompleteGlobals.arrSearch.push(strSearch);
                    autocompleteGlobals.arrValues.push(strCurrent);
                    autocompleteGlobals.arrSearchMaster.push(strSearch);
                    autocompleteGlobals.arrValuesMaster.push(strCurrent);
                } else {
                    
                    
                    for (var i = 0, len = autocompleteTempList.length; i < len; i++) {
                        strCurrent = autocompleteTempList[i][0]
                        strCurrentMeta = autocompleteTempList[i][1];
                        if (i + 1 < autocompleteTempList.length) {
                            strNext = autocompleteTempList[i + 1][0];
                            strNextMeta = autocompleteTempList[i + 1][1];
                            i += 1;
                        }
                        nextItem = '' + strCurrent.substring(0, strCurrent.lastIndexOf('(')) + '{';
                        nextItem = nextItem + '(' + strCurrent.substring(parseInt(strCurrent.indexOf('('), 10) + 1, strCurrent.lastIndexOf(')')) + ')';
                        while ((strNext && strNextMeta === 'funcSnippet' && strCurrentMeta === 'funcSnippet') && nextItem.substring(0, nextItem.lastIndexOf('{')) === strNext.substring(0, strNext.lastIndexOf('('))) {
                            bolIsFunction = true;
                            nextItem = nextItem + ', ' + strNext.substring(strNext.lastIndexOf('('), strNext.lastIndexOf(')')) + ')';
                            if (i + 1 < autocompleteTempList.length) {
                                i += 1;
                                strNext = autocompleteTempList[i][0];
                                strNextMeta = autocompleteTempList[i][1];
                            } else {
                                break;
                            }
                        }
                        nextItem += '}';
                        
                        if (i + 1 === len) {
                        } else {
                            i -= 1;
                        }
                        
                        if (bolIsFunction) {
                            nextItem = nextItem.replace('{', '(').replace('}',  ')');
                            // create a search string (normalize to double quoted and lowercase)
                            strSearch = (nextItem[0] === '"' ? nextItem.toLowerCase() : '"' + nextItem.toLowerCase() + '"');
                            
                            strText += '\n' + nextItem;
                            autocompleteGlobals.arrSearch.push(strSearch);
                            autocompleteGlobals.arrValues.push(nextItem);
                            autocompleteGlobals.arrSearchMaster.push(strSearch);
                            autocompleteGlobals.arrValuesMaster.push(nextItem);
                            bolIsFunction = false;
                        } else {
                            if (autocompleteTempList[i + 1]) {
                                //i -= 1;
                            } else {
                                if (bolFinalRecord === false) {
                                    i -= 1;
                                }
                                bolFinalRecord = true
                            }
                            // create a search string (normalize to double quoted and lowercase)
                            strSearch = (strCurrent[0] === '"' ? strCurrent.toLowerCase() : '"' + strCurrent.toLowerCase() + '"');
                            
                            strText += '\n' + strCurrent;
                            autocompleteGlobals.arrSearch.push(strSearch);
                            autocompleteGlobals.arrValues.push(strCurrent);
                            autocompleteGlobals.arrSearchMaster.push(strSearch);
                            autocompleteGlobals.arrValuesMaster.push(strCurrent);
                        }
                        
                        
                        //console.log(strText);
                        
                        if ((i % 20) === 0) {
                            autocompleteGlobals.popupAceSession.insert({
                                'row': autocompleteGlobals.popupAceSession.getLength(),
                                'column': 0
                            }, (intResult === 1 ? strText.substring(1) : strText));
                            strText = '';
                        }
                    }
                }
                
                var currSnippet;
                if (autocompleteGlobals.bolSnippets) {
                    for (var i = 0, len = snippets.length; i < len; i++) {
                        currSnippet = snippets[i];
                        strCurrent = currSnippet[2] + ' (Snippet)';
                        
                        // create a search string (normalize to double quoted and lowercase)
                        strSearch = (strCurrent[0] === '"' ? strCurrent.toLowerCase() : '"' + strCurrent.toLowerCase() + '"');
                        
                        strText += '\n' + strCurrent;
                        autocompleteGlobals.arrSearch.push(strSearch);
                        autocompleteGlobals.arrValues.push(strCurrent);
                        autocompleteGlobals.arrSearchMaster.push(strSearch);
                        autocompleteGlobals.arrValuesMaster.push(strCurrent);
                        
                    }
                }

                
                // append text (the substring is to remove the trailing \n)
                autocompleteGlobals.popupAceSession.insert({
                    'row': autocompleteGlobals.popupAceSession.getLength(),
                    'column': 0
                }, (intResult === 1 ? strText.substring(1) : strText));
                
                // if there was no results: close the popup
                if (!bolResults) {
                    autocompletePopupClose(editor);
                    
                // else: search the popup
                } else {
                    // bind popup
                    autocompleteBind(editor);
                    
                    autocompletePopupSearch(editor, 'filter');
                }
            } else {
                intResult += 1;
                if (!bolResults) {
                    bolResults = true;
                    
                    // unhide the popup
                    autocompleteGlobals.popupElement.removeAttribute('hidden');
                    autocompleteGlobals.popupAce.resize();
                }
                
                for (i = 0, len = arrRows.length, strText = ''; i < len; i += 1) {
                    autocompleteTempList.push(arrRows[i]);
                    //if (arrRows[i][1] === 'funcSnippet') {
                    //    console.log(arrRows[i][0]);
                    //}
                    
                    /*// create a search string (normalize to double quoted and lowercase)
                    strSearch = (strCurrent[0] === '"' ? strCurrent.toLowerCase() : '"' + strCurrent.toLowerCase() + '"');
                    
                    strText += '\n' + strCurrent;
                    autocompleteGlobals.arrSearch.push(strSearch);
                    autocompleteGlobals.arrValues.push(strCurrent);
                    autocompleteGlobals.arrSearchMaster.push(strSearch);
                    autocompleteGlobals.arrValuesMaster.push(strCurrent);
                    strNext = '';*/
                }
            }
        }
    });
    
}

// this function appends, positions and binds the autocomplete popup
function autocompletePopupOpen(editor, arrQueries) {
    'use strict';
    var jsnSearchStart = indexToRowAndColumn(editor.getValue(), autocompleteGlobals.intSearchStart + autocompleteGlobals.intSearchOffset)
      , jsnPosition = editor.renderer.textToScreenCoordinates(jsnSearchStart.row, jsnSearchStart.column)
      , intLeft = jsnPosition.pageX
      , intTop = jsnPosition.pageY
      , intLineHeight = editor.renderer.$textLayer.getLineHeight();

    // if autocomplete is open: close it first
    if (autocompleteGlobals.popupOpen === true) {
        if (autocompleteGlobals.popupAsleep === true) {
            autocompletePopupWake(editor);
        }
        autocompletePopupClose(editor);
    }

    // hide and append the popup
    autocompleteGlobals.popupElement.setAttribute('hidden', '');
    document.body.appendChild(autocompleteGlobals.popupElement);

    // set state variables
    autocompleteGlobals.popupLoading = true;
    autocompleteGlobals.popupOpen = true;

    // position the autocomplete popup

    // handle horizontal window collision (302 -> popup width)
    if ((intLeft + 302) > window.innerWidth) {
        autocompleteGlobals.popupElement.style.right = '1px';
        autocompleteGlobals.popupElement.style.left = '';
    } else {
        autocompleteGlobals.popupElement.style.right = '';
        autocompleteGlobals.popupElement.style.left = intLeft + 'px';
    }
    
    // handle vertical window collision (152 -> max popup height)
    if ((intTop + intLineHeight + 152) > window.innerHeight) {
        autocompleteGlobals.popupElement.style.bottom = (window.innerHeight - intTop) + 'px';
        autocompleteGlobals.popupElement.style.top = '';
    } else {
        autocompleteGlobals.popupElement.style.bottom = '';
        autocompleteGlobals.popupElement.style.top = (intLineHeight + intTop) + 'px';
    }
    
    // default the height of the popup to 150px
    autocompleteGlobals.popupElement.style.height = '150px';
    
    // set scroll to top
    autocompleteGlobals.popupAce.scrollToLine(0);
    
    // load the autocomplete data
    autocompletePopupLoad(editor, arrQueries);
}

// this function removes, empties and unbinds the autocomplete popup
function autocompletePopupClose(editor) {
    'use strict';
    strSearchFixed = false;
    // if the autocomplete query is still running: cancel it
    if (autocompleteGlobals.strQueryID) {
        GS.requestFromSocket(GS.envSocket, 'CANCEL', '', autocompleteGlobals.strQueryID);
        autocompleteGlobals.popupLoading = false;
    }
    
    // if popup is asleep: wake up
    if (autocompleteGlobals.popupAsleep === true) {
        autocompletePopupWake(editor);
    }
    
    if (autocompleteGlobals.popupElement.parentNode === document.body) {
        // remove the popup from the dom
        document.body.removeChild(autocompleteGlobals.popupElement);
    }
    
    // empty the popup
    //autocompleteGlobals.popupElement.innerHTML = '';
    autocompleteGlobals.popupAce.setValue('');
    
    // bind function only unbinds the editor if popup is currently bound
    autocompleteUnbind(editor);
    
    // set popupOpen to false
    autocompleteGlobals.popupOpen = false;
    
    autocompleteGlobals.arrSearch = [];
    autocompleteGlobals.arrValues = [];
    autocompleteGlobals.arrSearchMaster = [];
    autocompleteGlobals.arrValuesMaster = [];
}

// complete using the selected choice in the autocomplete popup
function autocompleteComplete(editor) {
    'use strict';
    var intSearchStringStart = (autocompleteGlobals.intSearchStart + autocompleteGlobals.intSearchOffset)
      , intSearchStringEnd = (autocompleteGlobals.intSearchEnd)
      , jsnSearchStringRange, strScript
      , intFocusedLine = autocompleteGlobals.popupAce.getSelectionRange().start.row;
    // if there is a selected choice
    //console.log(intSearchStringStart, intSearchStringEnd);
    if (intFocusedLine !== undefined && intFocusedLine !== null && intSearchStringStart !== null && intSearchStringEnd) {//selectedChoice
        strScript = editor.getValue();
        
        if (autocompleteGlobals.arrValues[intFocusedLine]) {
            // get autocomplete replace range
            jsnSearchStringRange = {
                'start': indexToRowAndColumn(strScript, intSearchStringStart)
              , 'end': indexToRowAndColumn(strScript, intSearchStringEnd)
            };
            
            if (strSearchFixed === true) {
                editor.getSelection().setSelectionRange(new Range(
                    jsnSearchStringRange.start.row,
                    jsnSearchStringRange.start.column - 1,
                    jsnSearchStringRange.end.row,
                    jsnSearchStringRange.end.column
                ));
            } else {
                // set selection using replace range
                editor.getSelection().setSelectionRange(new Range(
                    jsnSearchStringRange.start.row,
                    jsnSearchStringRange.start.column,
                    jsnSearchStringRange.end.row,
                    jsnSearchStringRange.end.column
                ));
            }
            
            // replace the range with the selected choice's text
            autocompleteGlobals.bolInserting = true;
            if (autocompleteGlobals.arrValues[intFocusedLine].indexOf('Snippet') !== -1) {
                var strInsertSnippet;
                strInsertSnippet = autocompleteGlobals.arrValues[intFocusedLine].substring(0, autocompleteGlobals.arrValues[intFocusedLine].length - 10);
                var currSearchSnippet;
                for (var i = 0, len = snippets.length; i < len; i++) {
                    currSearchSnippet = snippets[i];
                    if (currSearchSnippet[2] === strInsertSnippet) {
                        ace.config.loadModule('ace/ext/language_tools', function () {
                            editor.insertSnippet(currSearchSnippet[0]);
                        });
                        break;
                    }
                }
            } else {
                
                //insertToMultipleCursors(editor, editor.currentSelections, autocompleteGlobals.arrValues[intFocusedLine]);
                editor.insert(autocompleteGlobals.arrValues[intFocusedLine]);
                
                
            }
            if (autocompleteGlobals.arrValues[intFocusedLine].indexOf('(') !== -1 && autocompleteGlobals.arrValues[intFocusedLine].lastIndexOf(')') !== -1 && autocompleteGlobals.arrValues[intFocusedLine].indexOf('Snippet') === -1) {
                editor.getSelection().setSelectionRange(new Range(
                    jsnSearchStringRange.start.row,
                    jsnSearchStringRange.start.column + autocompleteGlobals.arrValues[intFocusedLine].indexOf('(') + 1,
                    jsnSearchStringRange.start.row,
                    jsnSearchStringRange.start.column + autocompleteGlobals.arrValues[intFocusedLine].lastIndexOf(')')
                ));
            }
            
            autocompleteGlobals.bolInserting = false;
        }
        //console.log(autocompleteGlobals.arrValues[intFocusedLine]);
    }
    
    // close the autocomplete popup
    autocompletePopupClose(editor);
}


// ##############################################################################
// ############################## POPUP EVENT CODE ##############################
// ##############################################################################

// this function searches through the autocompletePopup on change
function autocompletePopupSearch(editor, strMode) {
    'use strict';
    var strScript = editor.getValue()
      , intSearchStringStart = (autocompleteGlobals.intSearchStart + autocompleteGlobals.intSearchOffset)
      , intSearchStringEnd = autocompleteGlobals.intSearchEnd
      , strSearch = strScript.substring(intSearchStringStart, intSearchStringEnd)
      , choices, match, i, len, strCurrentMasterSearch, strCurrentMasterValue, strNewValue, strAdded;
    
    if (autocompleteGlobals.popupOpen === true) {
        //console.log(autocompleteGlobals.intSearchStart + autocompleteGlobals.intSearchOffset);
        //console.log(autocompleteGlobals.intSearchEnd);
        // normalize strSearch
        //strSearch = (strSearch[0] === '"' ? strSearch.toLowerCase() : '"' + strSearch.toLowerCase());
        if (strSearch[0] === '"') {
            strSearch = strSearch.toLowerCase();
            strAdded = false;
        } else {
            strSearch = '"' + strSearch.toLowerCase();
            strAdded = true;
        }
        
        if (strSearch === '"' && (strScript.substring(intSearchStringStart - 1, intSearchStringEnd) !== '.') || strSearchFixed === true) {
            strSearchFixed = true;
            //console.log(strSearchFixed);
            strSearch = strScript.substring(intSearchStringStart - 1, intSearchStringEnd);
            if (strSearch[0] === '"') {
                strSearch = strSearch.toLowerCase();
                strAdded = false;
            } else {
                strSearch = '"' + strSearch.toLowerCase();
                strAdded = true;
            }
        } else {
            strSearchFixed = false;
            //console.log(strSearchFixed);
        }

        if (strSearch === ':') {
            strSearch = '';
        } else if (strSearch === '":') {
            strSearch = '"';
            strSearchFixed = false;
        }
        
        
        // default strMode to 'filter', the only other option is 'expand'
        strMode = strMode || 'filter';

        // if mode is filter: take the current autocompleteGlobals.arrSearch and remove
        //      any items that don't match
        if (strMode === 'filter') {
            autocompleteGlobals.popupAce.setValue('');
            //console.log(autocompleteGlobals.arrSearch);
            //console.log(strSearch);
            // console.log(autocompleteGlobals.arrSearch);
            // console.log(autocompleteGlobals.arrValues);
            // console.log(strSearch);
            for (i = 0, len = autocompleteGlobals.arrSearch.length, strNewValue = ''; i < len; i += 1) {
                
                
                // if the current item doesn't match: remove from ace, arrSearch and arrValues
                if (autocompleteGlobals.arrSearch[i].indexOf(strSearch) === -1) {
                    autocompleteGlobals.arrSearch.splice(i, 1);
                    autocompleteGlobals.arrValues.splice(i, 1);
                    // console.log('reject', i);
                    
                    
                    i -= 1;
                    len -= 1;
                } else {
                    // console.log('match', i);
                    strNewValue += '\n';
                    strNewValue += autocompleteGlobals.arrValues[i];
                }
            }
    
            autocompleteGlobals.popupAce.setValue(strNewValue.substring(1));
            
        // else if mode is expand: take the autocompleteGlobals.arrSearchMaster and fill
        //      autocompleteGlobals.arrSearch with all matching items
        } else if (strMode === 'expand') {
            autocompleteGlobals.popupAce.setValue('');
            autocompleteGlobals.arrSearch = [];
            autocompleteGlobals.arrValues = [];
            
            for (i = 0, len = autocompleteGlobals.arrSearchMaster.length, strNewValue = ''; i < len; i += 1) {
                strCurrentMasterSearch = autocompleteGlobals.arrSearchMaster[i];
                // if the current item doesn't match: remove from ace, arrSearch and arrValues
                if (strCurrentMasterSearch.indexOf(strSearch) === 0) {
                    strCurrentMasterValue = autocompleteGlobals.arrValuesMaster[i];
                    
                    autocompleteGlobals.arrSearch.push(strCurrentMasterSearch);
                    autocompleteGlobals.arrValues.push(strCurrentMasterValue);
                    strNewValue += '\n';
                    strNewValue += strCurrentMasterValue;
                }
            }
            
            autocompleteGlobals.popupAce.setValue(strNewValue.substring(1));
        }
        
            //console.log(autocompleteGlobals.arrValues.length, autocompleteGlobals.arrValues[0], strSearch);
            //console.log(autocompleteGlobals.arrValues.length, autocompleteGlobals.arrValues[0] === strSearch);
        
        if (strAdded === true) {
            strSearch = strSearch.substring(1, strSearch.length);
            //console.log(strSearch);
            // if no items are left after the filter or expand AND the popup is not already asleep: put popup to sleep
            // console.log(autocompleteGlobals.arrValues);
            if ((autocompleteGlobals.arrValues.length === 0 && autocompleteGlobals.popupAsleep === false) || (autocompleteGlobals.arrValues.length === 1 && autocompleteGlobals.arrValues[0] === strSearch)) {
                //autocompletePopupSleep(editor);  this may have been causing a bug where the list would only have one option and then would put the popup to sleep but still had the keys bound
                autocompletePopupClose(editor);
            // else if items are in the popup AND the popup is asleep: wake up the popup
            } else if (autocompleteGlobals.arrValues.length > 0 && autocompleteGlobals.popupAsleep === true) {
                autocompletePopupWake(editor);
            }
            strSearch = '"' + strSearch.toLowerCase();
        }

        // select first line
        autocompleteGlobals.popupAce.selection.setSelectionRange(new Range(0, 0, 0, 0));
        autocompleteGlobals.popupAce.scrollToLine(0);

        // refresh popup height
        autocompletePopupHeightRefresh();

        if (document.getElementById('autocomplete-popup')) {
            popup_instruct_top = document.getElementById('autocomplete-popup').style.height +
                                 document.getElementById('autocomplete-popup-instruction').style.height;
            document.getElementById('autocomplete-popup-instruction').style.top = popup_instruct_top;
        }
        //console.log(strSearch);
    }
    //console.log(document.getElementById('autocomplete-popup-instruction').style.top, popup_instruct_top);

    //// search to select
    //for (i = 0, len = autocompleteGlobals.arrSearch.length; i < len; i += 1) {
    //    if (autocompleteGlobals.arrSearch[i].indexOf(strSearch) === 0) {
    //        // we found a choice: focus that line
    //        autocompleteGlobals.popupAce.selection.setSelectionRange(new Range(i, 0, i, 0));
    //        autocompleteGlobals.popupAce.scrollToLine(autocompleteGlobals.popupAce.getSelectionRange().start.row);
    //        //match = autocompleteGlobals.arrElements[i];
    //        break;
    //    }
    //}
}

// put popup to sleep
function autocompletePopupSleep(editor) {
    'use strict';
    // hide the popup and set state
    autocompleteGlobals.popupElement.setAttribute('hidden', '');
    autocompleteGlobals.popupAsleep = true;
    
    // unbind the popup
    autocompleteUnbind(editor);
    
    // bind keydown
    editor.keyListenerElementSleep = xtag.query(editor.container, '.ace_text-input')[0];
    editor.keyListenerFunctionSleep = function (event) {
        if (   event.keyCode === 37  // left arrow
            || event.keyCode === 38  // up arrow
            || event.keyCode === 39  // right arrow
            || event.keyCode === 40  // down arrow
            || event.keyCode === 110 // .
            || event.keyCode === 27  // esc
            || event.keyCode === 190 // decimal point
            || event.keyCode === 32  // space
            || event.keyCode === 13  // return
            ) {
            autocompletePopupClose(editor);
        }
    };
    
    editor.keyListenerElementSleep.addEventListener('keydown', editor.keyListenerFunctionSleep);
}

// wake popup up
function autocompletePopupWake(editor) {
    'use strict';
    // show the popup and set state
    autocompleteGlobals.popupElement.removeAttribute('hidden');
    autocompleteGlobals.popupAsleep = false;
    
    // unbind keydown
    if (editor.keyListenerElementSleep) {
        editor.keyListenerElementSleep.removeEventListener('keydown', editor.keyListenerFunctionSleep);
    }
    
    // bind the popup
    autocompleteBind(editor);
}

// bind keyboard (temporary. binds to sql editor, not autocomplete popup)
function autocompleteBind(editor) {
    'use strict';
    editor.standardGoLineDownExec = editor.commands.commands.golinedown.exec;
    editor.standardGoLineUpExec   = editor.commands.commands.golineup.exec;
    editor.standardIndentExec     = editor.commands.commands.indent.exec;


    if (!autocompleteGlobals.bolBound) {
    
        editor.commands.commands.golinedown.exec = function () {
            var intCurrentLine = autocompleteGlobals.popupAce.getSelectionRange().start.row
              , intLastLine = autocompleteGlobals.arrValues.length - 1;
    
            if (intCurrentLine !== intLastLine) {
                autocompleteGlobals.popupAce.selection.setSelectionRange(new Range((intCurrentLine + 1), 0, (intCurrentLine + 1), 0));
            } else {
                autocompleteGlobals.popupAce.selection.setSelectionRange(new Range(0, 0, 0, 0));
            }
    
            autocompleteGlobals.popupAce.scrollToLine(autocompleteGlobals.popupAce.getSelectionRange().start.row);
        };
        editor.commands.commands.golineup.exec = function () {
            var intCurrentLine = autocompleteGlobals.popupAce.getSelectionRange().start.row
              , intLastLine = autocompleteGlobals.arrValues.length - 1;
    
            if (intCurrentLine !== 0) {
                autocompleteGlobals.popupAce.selection.setSelectionRange(new Range((intCurrentLine - 1), 0, (intCurrentLine - 1), 0));
            } else {
                autocompleteGlobals.popupAce.selection.setSelectionRange(new Range(intLastLine, 0, intLastLine, 0));
            }
    
            autocompleteGlobals.popupAce.scrollToLine(autocompleteGlobals.popupAce.getSelectionRange().start.row);
        };
    
        editor.commands.commands.indent.exec = function () {
            autocompleteComplete(editor);
            return;
        };
    
        editor.commands.addCommand({
            name: 'hideautocomplete',
            bindKey: 'Esc',
            exec: function () {
                autocompletePopupClose(editor);
            }
        });
    
        editor.commands.addCommand({
            name: 'autocomplete',
            bindKey: 'Return',
            exec: function () {
                autocompletePopupClose(editor);
                editor.insert('\n');
                //autocompleteComplete(editor);
                //return;
            }
        });
        
        // bind keydown
        editor.keyListenerElement = xtag.query(editor.container, '.ace_text-input')[0];
        editor.keyListenerFunction = function (event) {
            if (   event.keyCode === 37  // left arrow
                || event.keyCode === 39  // right arrow
                || event.keyCode === 110 // .
                || event.keyCode === 190 // decimal point
                || event.keyCode === 32  // space
                || (event.shiftKey && (event.keyCode === 38 || event.keyCode === 40))) {
                autocompletePopupClose(editor);
            }
        };
        
        editor.keyListenerElement.addEventListener('keydown', editor.keyListenerFunction);
        
        // bind mousedown
        editor.mousedownFunction = function (event) {
            autocompletePopupClose(editor);
        };
        
        editor.container.addEventListener('mousedown', editor.mousedownFunction);
        
        // bind focusout
        editor.focusoutFunction = function (event) {
            // if the element that stole the focus is not the popup ace: close the popup
            if (event.relatedTarget !== autocompleteGlobals.popupAce.focusElement) {
                //autocompletePopupClose(editor);
            }
        };
        
        editor.container.addEventListener('focusout', editor.focusoutFunction);
        
        autocompleteGlobals.popupAce.focusElement = xtag.query(autocompleteGlobals.popupAce.container, '.ace_text-input')[0];
        autocompleteGlobals.popupAce.focusFunction = function (event) {
            autocompleteComplete(editor);
            autocompletePopupClose(editor);
            editor.focus();
        };
        
    }
    autocompleteGlobals.bolBound = true;
    autocompleteGlobals.popupAce.focusElement.addEventListener('focus', autocompleteGlobals.popupAce.focusFunction);
    
}

// unbind keyboard
function autocompleteUnbind(editor) {
    'use strict';
    if (autocompleteGlobals.bolBound) {
        editor.commands.commands.golinedown.exec = editor.standardGoLineDownExec;
        editor.commands.commands.golineup.exec = editor.standardGoLineUpExec;
        editor.commands.commands.indent.exec = editor.standardIndentExec;
        editor.commands.removeCommand('hideautocomplete');
        editor.commands.removeCommand('autocomplete');
        autocompleteGlobals.popupElement.removeEventListener('change', autocompleteGlobals.popupElement.clickFunction);
    
        if (editor.keyListenerElement) {
            editor.keyListenerElement.removeEventListener('keydown', editor.keyListenerFunction);
        }
    
        editor.container.removeEventListener('mousedown', editor.mousedownFunction);
        editor.container.removeEventListener('focusout', editor.focusoutFunction);
        autocompleteGlobals.popupAce.focusElement.removeEventListener('focus', autocompleteGlobals.popupAce.focusFunction);
    }
    
    autocompleteGlobals.bolBound = false;
    
    
    
    
}


// #############################################################################
// ################################# MISC CODE #################################
// #############################################################################

function autocompleteLoadTypes() {
    'use strict';
    var strQuery = ml(function () {/*
            SELECT string_agg(pg_type.typname, ',')
              FROM pg_catalog.pg_type
             WHERE (pg_type.typrelid = 0 OR (SELECT pg_class.relkind = 'c' FROM pg_catalog.pg_class WHERE pg_class.oid = pg_type.typrelid))
               AND (NOT EXISTS (SELECT TRUE FROM pg_catalog.pg_type elem WHERE elem.oid = pg_type.typelem AND elem.typarray = pg_type.oid))
               AND (pg_type.typtype <> 'd')
    */});
    
    GS.requestRawFromSocket(GS.envSocket, strQuery, function (data, error) {
        var arrRows, i, len;
        
        if (!error) {
            if (data.strMessage !== '\\.' && data.strMessage !== '') {
                arrRows = data.strMessage.split('\n');
                
                autocompleteGlobals.arrTypes = GS.decodeFromTabDelimited(arrRows[0]).split(',');
            }
        } else {
            GS.webSocketErrorDialog(data);
        }
    });
}

function autocompleteLoadKeywords() {
    'use strict';
                    // ROW #1: "C": unreserved (cannot be function or type name)
                    // ROW #2: "R": reserved
                    // ROW #3: "T": reserved (can be function or type name)
                    // ROW #4: "U": unreserved
    var strQuery = ml(function () {/*
            SELECT string_agg(word, ',')
              FROM pg_catalog.pg_get_keywords()
          GROUP BY catcode
          ORDER BY catcode
    */});
    
    GS.requestRawFromSocket(GS.envSocket, strQuery, function (data, error) {
        var arrRows, i, len;
        
        if (!error) {
            if (data.strMessage !== '\\.' && data.strMessage !== '') {
                arrRows = data.strMessage.split('\n');
                
                autocompleteGlobals.jsnKeywords.c = GS.decodeFromTabDelimited(arrRows[0]).split(',');
                autocompleteGlobals.jsnKeywords.c.desc = 'unreserved but cannot be the name of a FUNCTION or TYPE';
                
                autocompleteGlobals.jsnKeywords.r = GS.decodeFromTabDelimited(arrRows[1]).split(',');
                autocompleteGlobals.jsnKeywords.r.desc = 'reserved';
                
                autocompleteGlobals.jsnKeywords.t = GS.decodeFromTabDelimited(arrRows[2]).split(',');
                autocompleteGlobals.jsnKeywords.t.desc = 'reserved but can be the name of a FUNCTION or TYPE)';
                
                autocompleteGlobals.jsnKeywords.u = GS.decodeFromTabDelimited(arrRows[3]).split(',');
                autocompleteGlobals.jsnKeywords.u.desc = 'unreserved';
                
                autocompleteGlobals.jsnKeywords.all = [];
                autocompleteGlobals.jsnKeywords.all = autocompleteGlobals.jsnKeywords.all.concat(autocompleteGlobals.jsnKeywords.c);
                autocompleteGlobals.jsnKeywords.all = autocompleteGlobals.jsnKeywords.all.concat(autocompleteGlobals.jsnKeywords.r);
                autocompleteGlobals.jsnKeywords.all = autocompleteGlobals.jsnKeywords.all.concat(autocompleteGlobals.jsnKeywords.t);
                autocompleteGlobals.jsnKeywords.all = autocompleteGlobals.jsnKeywords.all.concat(autocompleteGlobals.jsnKeywords.u);
            }
        } else {
            GS.webSocketErrorDialog(data);
        }
    });
}

function autocompletePopupHeightRefresh() {
    'use strict';
    var intHeight;
    
    // calculate popup height
    intHeight = autocompleteGlobals.popupAce.renderer.$textLayer.getLineHeight() * autocompleteGlobals.arrValues.length;
    if (intHeight > 150) { intHeight = 150; }
    
    // set popup height
    autocompleteGlobals.popupElement.style.height = intHeight + 'px';
}

function autocompleteGetObjectType(strName, arrQueries, callback, schemaOID) {
    'use strict';
    var strQuery, arrResults = [], i, len;
    
    // normailize name
    strName = GS.trim(strName.trim(), '"');
    
    // loop through array of queries
    for (i = 0, len = arrQueries.length; i < len; i += 1) {
        arrQueries[i] = arrQueries[i].replace(/\{\{NAME\}\}/gi, strName);
        
        // if schemaOID has a value: schema qualify the query
        if (schemaOID) {
            arrQueries[i] = arrQueries[i].replace(/\{\{ADDITIONALWHERE\}\}/gi, 'AND pg_namespace.oid = ' + schemaOID);
        } else {
            arrQueries[i] = arrQueries[i].replace(/\{\{ADDITIONALWHERE\}\}/gi, '');
        }
    }
    
    // join array into a query
    strQuery =  'SELECT * FROM (\n' +
                    arrQueries.join('\n     UNION ALL\n') + '\n' +
                ') em;';
    
    GS.requestRawFromSocket(GS.envSocket, strQuery, function (data, error) {
        var arrRows, i, len;
        
        if (!error) {
            if (data.strMessage !== '\\.' && data.strMessage !== '') {
                arrRows = data.strMessage.split('\n');
                
                for (i = 0, len = arrRows.length; i < len; i += 1) {
                    arrRows[i] = arrRows[i].split('\t');
                    arrRows[i][1] = GS.decodeFromTabDelimited(arrRows[i][1]);
                    
                    arrResults.push(arrRows[i]);
                }
                
            } else if (data.strMessage === '\\.') {
                callback(arrResults);
            }
        }// else {
        //    GS.webSocketErrorDialog(data);
        //}
    });
}

function autocompleteGetList(arrQueries, callback) {
    'use strict';
    var strQuery, i, len, arrSuggestion, suggestion_i, suggestion_len;
    
    for (i = 0, len = arrQueries.length; i < len; i += 1) {
        if (typeof arrQueries[i] !== 'string') {
            for (suggestion_i = 0, suggestion_len = arrQueries[i].length; suggestion_i < suggestion_len; suggestion_i += 1) {
                arrQueries[i][suggestion_i] = 'SELECT $token$' + arrQueries[i][suggestion_i] + '$token$::text AS obj_name, \'\'::text AS obj_meta';
            }
            
            arrQueries[i] = 'SELECT * FROM (' + arrQueries[i].join('\nUNION ALL\n') + ') list_suggestions_' + i;
        }
    }
    
    strQuery = 'SELECT * FROM (\n' + arrQueries.join('\n     UNION ALL\n') + '\n' + ') em;';
//    console.log(strQuery);
    // if the autocomplete query is still running: cancel it
    if (autocompleteGlobals.strQueryID) {
        GS.requestFromSocket(GS.envSocket, 'CANCEL', '', autocompleteGlobals.strQueryID);
    }
    
    // make the request
    autocompleteGlobals.strQueryID = GS.requestRawFromSocket(GS.envSocket, strQuery, function (data, error) {
        var arrRows, i, len;
        if (!error) {
            //console.log(data);
            if (data.strMessage !== '\\.' && data.strMessage !== '') {
                arrRows = data.strMessage.split('\n');
                for (i = 0, len = arrRows.length; i < len; i += 1) {
                    arrRows[i] = arrRows[i].split('\t');
                    arrRows[i][0] = GS.decodeFromTabDelimited(arrRows[i][0]);
                    //console.log(arrRows[i]);
                }
                
                callback(false, arrRows);
            } else if (data.strMessage === '\\.') {
                callback(true, arrRows);
                autocompleteGlobals.strQueryID = null;
            }
        }// else {
        //    GS.webSocketErrorDialog(data);
        //}
    });
}


// #############################################################################
// ################################ PREFIX CODE ################################
// #############################################################################

function autocompleteGetPrefix(strScript, cursorPosition) {
    'use strict';
    var int_qs = 0 // quote status
      , int_ps = 0 // parenthesis level
      , int_element_len = 0
      , int_tag = 0
      , str_tag = ''
      , arr_str_list = []
      , str_form_data = strScript.substring(0, cursorPosition)
      , int_form_data_length = str_form_data.length
      , int_inputstring_len = str_form_data.length
      , str_trailing, ptr_loop = 0, ptr_start = 0, int_chunk_len
      , int_query_start, int_query_end, int_query_length
      , arr_int_open_paren_indexes = [], str_srch_string
      , str_function_quote, int_function_quote_len, ptr_quote_loop
      , bol_function = false
      , i, arrFinds
      , int_chunk_start = 0, intLastChunkType, arrStrings
      , current_chunk_type, calculated_chunk_type, arrChunks = [];
    // quote status (int_qs) values:
    //      0 => no quotes
    //      2 => dollar tag
    //      3 => single quote
    //      4 => double quote
    //      5 => multiline comment
    //      6 => line comment
    // special mention:
    //      int_ps is the number of parenthesis we are deep
    // chunk types:
    //      0 => whitespace group
    //      1 => equals / comma
    //      2 => quote / character / parenthesis group
    //      3 => .
    
    //console.log('1***', str_form_data);
    while (int_inputstring_len > 0) {
        int_element_len += 1;
        
        // FOUND MULTILINE COMMENT:
        if (int_qs === 0 && str_form_data.substr(ptr_loop, 2) === "/*") {
            int_qs = 5;
            str_form_data = str_form_data.substring(0, ptr_loop) + ' ' + str_form_data.substring(ptr_loop + 1);
            //console.log("found multiline comment");
            
        // ENDING MULTILINE COMMENT
        } else if (int_qs === 5 && str_form_data.substr(ptr_loop, 2) === "*/") {
            int_qs = 0;
            str_form_data = str_form_data.substring(0, ptr_loop) + ' ' + str_form_data.substring(ptr_loop + 1);
            str_form_data = str_form_data.substring(0, ptr_loop + 1) + ' ' + str_form_data.substring(ptr_loop + 2);
            //console.log("found end of multiline comment");
            
        // FOUND DASH COMMENT:
        } else if (int_qs === 0 && str_form_data.substr(ptr_loop, 2) === "--") {
            int_qs = 6;
            str_form_data = str_form_data.substring(0, ptr_loop) + ' ' + str_form_data.substring(ptr_loop + 1);
            //console.log("found dash comment");
            
        // ENDING DASH COMMENT
        } else if (int_qs === 6 && (str_form_data.substr(ptr_loop, 1) === "\n" || str_form_data.substr(ptr_loop, 1) === "\r")) {
            int_qs = 0;
            //console.log("found end of dash comment");
            
        // CONSUME COMMENT
        } else if (int_qs === 6 || int_qs === 5) {
            str_form_data =
                str_form_data.substring(0, ptr_loop) +
                (str_form_data[ptr_loop] === '\t' || str_form_data[ptr_loop] === '\n' ? str_form_data[ptr_loop] : ' ') +
                str_form_data.substring(ptr_loop + 1);
            
            //console.log(str_form_data[ptr_loop], ptr_loop);
            
        // FOUND SLASH:  we don't skip slashed chars within dollar tags, double quotes and comments.
        } else if (str_form_data.substr(ptr_loop, 1) === "\\" && int_qs !== 4 && int_qs !== 2 && int_qs !== 5 && int_qs !== 6) {
            // skip next character
            ptr_loop += 1;
            int_chunk_len = 1;
            int_inputstring_len -= int_chunk_len;
            int_element_len += int_chunk_len;
            //console.log("found slash ptr_loop: " + ptr_loop, ptr_loop, int_inputstring_len, int_chunk_len, int_element_len);
            
        // FOUND SINGLE QUOTE:
        } else if (int_qs === 0 && str_form_data.substr(ptr_loop, 1) === "'") {
            int_qs = 3;
            //console.log("found single quote");
            
        // ENDING SINGLE QUOTE
        } else if (int_qs === 3 && str_form_data.substr(ptr_loop, 1) === "'") {
            int_qs = 0;
            //console.log("found end of single quote");
            
        // FOUND DOUBLE QUOTE:
        } else if (int_qs === 0 && str_form_data.substr(ptr_loop, 1) === "\"") {
            int_qs = 4;
            //console.log("found double quote");
            
        // ENDING DOUBLE QUOTE 
        } else if (int_qs === 4 && str_form_data.substr(ptr_loop, 1) === "\"") {
            int_qs = 0;
            //console.log("found end of double quote");
        
        // FOUND OPEN PARENTHESIS:
        } else if (int_qs === 0 && str_form_data.substr(ptr_loop, 1) === "(") {
            int_ps = int_ps + 1;
            arr_int_open_paren_indexes.push(ptr_loop);
            //console.log(' OPEN: ', arr_int_open_paren_indexes);
            //console.log("found open parenthesis");
        
        // FOUND CLOSE PARENTHESIS
        } else if (int_qs === 0 && str_form_data.substr(ptr_loop, 1) === ")" && int_ps > 0) {
            int_ps = int_ps - 1;
            
            arr_int_open_paren_indexes.splice(arr_int_open_paren_indexes.length - 1, 1);
            //console.log('CLOSE: ', arr_int_open_paren_indexes);
            //console.log("found close parenthesis");
            
        // FOUND DOLLAR TAG START:
        } else if (int_qs === 0 && str_form_data.substr(ptr_loop, 1) === "$") {
            // we should be looking ahead here. get the tag or if false start then just continue
            ptr_quote_loop = ptr_loop + 1;
            //console.log("found start dollar");
            
            while (ptr_quote_loop < int_form_data_length && str_form_data.substr(ptr_quote_loop, 1).match("^[a-zA-Z0-9_]$")) {
                ptr_quote_loop += 1;
            }
            
            if (str_form_data.substring(ptr_quote_loop, ptr_quote_loop + 1) === "$") {
                int_tag = ptr_quote_loop - (ptr_loop - 1);
                str_tag = str_form_data.substr(ptr_loop, int_tag);
                
                // we found the end of the tag, now look for the close tag
                ptr_loop += int_tag;
                int_inputstring_len -= int_tag;
                int_element_len += int_tag;
                int_qs = 2;
                
            } else {
                // false alarm, do nothing
            }
            
            //console.log(str_tag);
            
        // END DOLLAR TAG
        } else if (int_qs === 2 && str_form_data.substr(ptr_loop, int_tag) === str_tag) {
            //console.log("found end of dollar", str_tag);
            int_qs = 0;
            // move pointer to end of end dollar tag
            int_tag -= 1;
            int_element_len += int_tag;
            ptr_loop += int_tag;
            int_inputstring_len -= int_tag;
            
        // FOUND AN UNQUOTED SEMICOLON:
        } else if (int_ps === 0 && int_qs === 0 && str_form_data.substr(ptr_loop, 1) === ";") {
            //console.log("found semicolon >" + ptr_start + "|" + ptr_loop + "<");
            //console.log("found block >" + (str_form_data.substring(ptr_start, ptr_loop)) + "<");
            
            ptr_start = ptr_loop + 1;
            int_element_len = 0;
        }
        
        // calculate type
        if (
                (
                    (
                        str_form_data.substr(ptr_loop, 1).match(/\s/gi)
                    ) || (
                        int_qs === 5 ||
                        int_qs === 6 ||
                        str_form_data.substr(ptr_loop, 2) === '*/'
                    )
                ) &&
                int_ps === 0 &&
                int_qs !== 2 &&
                int_qs !== 3 &&
                int_qs !== 4) {
            calculated_chunk_type = 0;
        } else if (str_form_data.substr(ptr_loop, 1) === ',' || str_form_data.substr(ptr_loop, 1) === '=') {
            calculated_chunk_type = 1;
        } else if (str_form_data.substr(ptr_loop, 1) === '.') {
            calculated_chunk_type = 3;
        } else if (int_ps > 0 || str_form_data.substr(ptr_loop, 1) === ')') {
            calculated_chunk_type = 2;
        } else if (str_form_data.substr(ptr_loop, 1) !== '.') {
            calculated_chunk_type = 2;
        }
        //console.log(calculated_chunk_type, current_chunk_type, str_form_data.substr(ptr_loop, 1));
        
        if (current_chunk_type !== undefined) {
            // if current type is different from calculated type: seperate chunk
            if (current_chunk_type !== calculated_chunk_type) {
                if (current_chunk_type !== 0 && current_chunk_type !== 1) {
                    arrChunks.push({
                        'chunkText': str_form_data.substring(int_chunk_start, ptr_loop),
                        'chunkStart': int_chunk_start,
                        'chunkEnd': ptr_loop,
                        'chunkType': current_chunk_type
                    });
                }
                int_chunk_start = ptr_loop;
                current_chunk_type = calculated_chunk_type;
            }
        } else {
            current_chunk_type = calculated_chunk_type;
        }
        
        ptr_loop += 1;
        int_inputstring_len -= 1;
    }
    
    // seperate last chunk
    arrChunks.push({
        'chunkText': strScript.substring(int_chunk_start, ptr_loop),
        'chunkStart': int_chunk_start,
        'chunkEnd': ptr_loop,
        'chunkType': current_chunk_type
    });
    int_chunk_start = ptr_loop;
    current_chunk_type = calculated_chunk_type;
    
    //console.log('2***', str_form_data, arrChunks);
    
    i = arrChunks.length - 1;
    intLastChunkType = null;
    arrFinds = [];
    arrStrings = [];
    
    while (i >= 0) {
        //console.log('2.5*', arrChunks[i], intLastChunkType);
        if (arrChunks[i].chunkType === 2) {
            if (arrChunks[i].chunkText[0] === '(') {
                arrChunks[i].chunkStart += 1;
                arrChunks[i].chunkText = arrChunks[i].chunkText.substring(1);
            }
            
            arrFinds.push(arrChunks[i]);
            arrStrings.push(arrChunks[i].chunkText);
            
            if ((!arrChunks[i - 1] || arrChunks[i - 1].chunkType === 2)) {
                break;
            }
        } else if (arrChunks[i].chunkType === 3 && (intLastChunkType === 3 || arrChunks[i].chunkText.length > 1)) {
            break;
        }
        
        intLastChunkType = arrChunks[i].chunkType;
        i -= 1;
    }
    
    arrFinds.reverse();
    arrStrings.reverse();
    
    //console.log('3***', arrFinds, arrChunks);
    
    if (arrFinds.length === 0) {
        return {'start': 0, 'end': 0, 'arrStrings': []};
    }
    
    return {'start': arrFinds[0].chunkStart, 'end': arrFinds[arrFinds.length - 1].chunkEnd, 'arrStrings': arrStrings};
}

/*function insertToMultipleCursors(editor, arrRanges, strText, type) {
    var session = editor.getSession();
    window.Range = require('ace/range').Range;
    arrRanges.sort(function (a, b) {
        return (
            b.end.row - a.end.row || b.end.column - a.end.column
        );
    });

    editor.session.selection.clearSelection();

    for (var i = arrRanges.length - 1; i >= 0; i -= 1) {
        session.insert(arrRanges[i].end, strText);
        //arrRanges[i].end.row
        arrRanges[i].end.column += strText.length;
        editor.getSelection().addRange(new Range(arrRanges[i].end.row, arrRanges[i].end.column, arrRanges[i].end.row, arrRanges[i].end.column));
    }
    
}*/






















