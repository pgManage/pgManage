/*jslint browser:true, white:true, multivar:true, for:true*/
/*global window, document, GS, console, evt*/
var bolAutocompleteLogicLoaded = true;

function autocompleteStart() {
    'use strict';
    autocompleteLoadTypes();
    autocompleteLoadKeywords();
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
}

var queryVars = {
      'bolCols': false
    , 'bolTables': false
    , 'bolSchemas': false
    , 'bolTableFuncs': false
    , 'bolBuiltins': false
    , 'bolGroups': false
    , 'bolUsers': false
    , 'bolReturnTypes': false
    , 'bolTypes': false
    , 'bolLanguages': false
    , 'bolRules': false
    , 'bolTablespace': false
    , 'bolSelect': false
};
var curr_run_down = 0, curr_run_up = 0, curr_run_complete = 0;

var searchPath;

getListData(ml(function () {/*SELECT current_schemas(true);*/}), '', function (arrRecords) {
    searchPath = arrRecords[1][0];
    searchPath = searchPath.substring(1, searchPath.length);
    searchPath = searchPath.substring(0, searchPath.length - 1);
    searchPath = searchPath.split(',');
    for (var i = 0, len = searchPath.length; i < len; i++) {
        getListData(ml(function () {/*
            SELECT * FROM (
                SELECT quote_ident(pg_class.relname) AS obj_name, 'Table'::text AS obj_meta
                    FROM pg_class
              LEFT JOIN pg_namespace ON pg_namespace.oid = pg_class.relnamespace
                WHERE relkind IN ('r','s','t')
                    AND pg_namespace.nspname = '{{SCHEMA}}'
            ORDER BY pg_namespace.nspname ASC, pg_class.relname ASC
            ) list_tables
            UNION
            SELECT * FROM (
                SELECT quote_ident(c.relname) AS obj_name, 'View'::text AS obj_meta
                    FROM pg_class c
            LEFT JOIN pg_namespace ON pg_namespace.oid = c.relnamespace
                WHERE ((c.relhasrules AND
                    (EXISTS (SELECT r.rulename
                        FROM pg_rewrite r
                        WHERE ((r.ev_class = c.oid)
                            AND (bpchar(r.ev_type) = '1'::bpchar)) ))) OR (c.relkind = 'v'::char))
                    AND pg_namespace.nspname = '{{SCHEMA}}'
            ORDER BY pg_namespace.nspname ASC, c.relname ASC
            ) list_views
            ORDER BY obj_name
            */}).replace(/\{\{SCHEMA\}\}/g, searchPath[i]).replace(/\{\{SCHEMA\}\}/g, searchPath[i]), '', function (arrRecords) {
            if (arrRecords.length > 1) {
                autocompleteGlobals.arrSearchPath = arrRecords;
            }
        });
    }

});

var TOAST_id, CATALOG_id;

getListData(ml(function () {/*SELECT DISTINCT c.relnamespace
        FROM pg_class c
        LEFT JOIN pg_namespace ON pg_namespace.oid = c.relnamespace
        WHERE pg_namespace.nspname = 'pg_toast'*/}), '', function (arrRecords) {
    TOAST_id = arrRecords[1][0];
});


getListData(ml(function () {/*SELECT DISTINCT c.relnamespace
        FROM pg_class c
        LEFT JOIN pg_namespace ON pg_namespace.oid = c.relnamespace
        WHERE pg_namespace.nspname = 'pg_catalog'*/}), '', function (arrRecords) {
    CATALOG_id = arrRecords[1][0];
});


function autocompleteBindEditor(tabElement, editor) {
    var autocompleteKeyEvent;
    editor.standardGoLineDownExec = editor.commands.commands.golinedown.exec;
    editor.standardGoLineUpExec   = editor.commands.commands.golineup.exec;
    editor.standardIndentExec     = editor.commands.commands.indent.exec;
    editor.standardgotoright      = editor.commands.commands.gotoright.exec;
    editor.standardgotoleft       = editor.commands.commands.gotoleft.exec;
    editor.standardReturn         = editor.commands.commands.inserttext.exec;
    editor.standardgotowordright  = editor.commands.commands.gotowordright.exec;
    editor.standardgotowordleft   = editor.commands.commands.gotowordleft.exec;
    editor.standardgotolinestart  = editor.commands.commands.gotolinestart.exec;
    editor.standardgotolineend    = editor.commands.commands.gotolineend.exec;






    editor.standardSelectdown     = editor.commands.commands.selectdown.exec
    editor.standardSelectup       = editor.commands.commands.selectup.exec
    // editor.standardSelectright    = editor.commands.commands.selectright.exec
    // editor.standardSelectleft     = editor.commands.commands.selectleft.exec



    editor.commands.commands.selectdown.exec = function () {
        //console.log('if: ' + autocompleteGlobals.bolBound);
        if (autocompleteGlobals.bolBound) {
            closePopup();
            editor.standardSelectdown.apply(this, arguments);
        } else {
            editor.standardSelectdown.apply(this, arguments);
        }
    }

    editor.commands.commands.selectup.exec = function () {
        //console.log('if: ' + autocompleteGlobals.bolBound);
        if (autocompleteGlobals.bolBound) {
            closePopup();
            editor.standardSelectup.apply(this, arguments);
        } else {
            editor.standardSelectup.apply(this, arguments);
        }
    }

    // editor.commands.commands.selectright.exec = function () {
    //     //console.log('if: ' + autocompleteGlobals.bolBound);
    //     if (autocompleteGlobals.bolBound) {
    //         closePopup();
    //         editor.standardSelectright.apply(this, arguments);
    //     } else {
    //         editor.standardSelectright.apply(this, arguments);
    //     }
    // }

    // editor.commands.commands.selectleft.exec = function () {
    //     //console.log('if: ' + autocompleteGlobals.bolBound);
    //     if (autocompleteGlobals.bolBound) {
    //         closePopup();
    //         editor.standardSelectleft.apply(this, arguments);
    //     } else {
    //         editor.standardSelectleft.apply(this, arguments);
    //     }
    // }



    editor.commands.commands.golinedown.exec = function () {
        if (autocompleteGlobals.bolBound) {
            var intCurrentLine = autocompleteGlobals.popupAce.getSelectionRange().start.row
              , intLastLine = autocompleteGlobals.arrValues.length - 1;

            if (
                editor.currentSelections &&
                editor.currentSelections.length > 1
            ) {
                if (curr_run_down > 0) {
                    curr_run_down += 1;
                } else {
                    if (intCurrentLine !== intLastLine) {
                        autocompleteGlobals.popupAce.selection.setSelectionRange(new Range((intCurrentLine + 1), 0, (intCurrentLine + 1), 0));
                    } else {
                        autocompleteGlobals.popupAce.selection.setSelectionRange(new Range(0, 0, 0, 0));
                    }
                    curr_run_down = 1;
                }
                if (curr_run_down === editor.currentSelections.length) {
                    curr_run_down = 0;
                }
            } else {
                if (intCurrentLine !== intLastLine) {
                    autocompleteGlobals.popupAce.selection.setSelectionRange(new Range((intCurrentLine + 1), 0, (intCurrentLine + 1), 0));
                } else {
                    autocompleteGlobals.popupAce.selection.setSelectionRange(new Range(0, 0, 0, 0));
                }
            }

            autocompleteGlobals.popupAce.scrollToLine(autocompleteGlobals.popupAce.getSelectionRange().start.row);
        } else {
            editor.standardGoLineDownExec.apply(this, arguments);
        }
    };

    editor.commands.commands.golineup.exec = function () {
        if (autocompleteGlobals.bolBound) {
            var intCurrentLine = autocompleteGlobals.popupAce.getSelectionRange().start.row
              , intLastLine = autocompleteGlobals.arrValues.length - 1;
            if (editor.currentSelections.length > 1) {
                if (curr_run_up > 0) {
                    curr_run_up += 1;
                } else {
                    if (intCurrentLine !== 0) {
                        autocompleteGlobals.popupAce.selection.setSelectionRange(new Range((intCurrentLine - 1), 0, (intCurrentLine - 1), 0));
                    } else {
                        autocompleteGlobals.popupAce.selection.setSelectionRange(new Range(intLastLine, 0, intLastLine, 0));
                    }
                    curr_run_up = 1;
                }
                if (curr_run_up === editor.currentSelections.length) {
                    curr_run_up = 0;
                }
            } else {
            //console.log(intCurrentLine);
                if (intCurrentLine !== 0) {
                    autocompleteGlobals.popupAce.selection.setSelectionRange(new Range((intCurrentLine - 1), 0, (intCurrentLine - 1), 0));
                } else {
                    autocompleteGlobals.popupAce.selection.setSelectionRange(new Range(intLastLine, 0, intLastLine, 0));
                }
            }

            autocompleteGlobals.popupAce.scrollToLine(autocompleteGlobals.popupAce.getSelectionRange().start.row);
        } else {
            editor.standardGoLineUpExec.apply(this, arguments);
        }
    };


    editor.commands.commands.indent.exec = function () {
        //console.log('test', autocompleteGlobals.bolBound, curr_run_complete);
        if (xtag.query(document.body, '.current-tab')[0].relatedEditor.currentSelections.length > 1) {
            curr_run_complete += 1;
            if (curr_run_complete === xtag.query(document.body, '.current-tab')[0].relatedEditor.currentSelections.length) {
                curr_run_complete = 0;
                if (autocompleteGlobals.bolBound) {
                    autocompleteComplete(xtag.query(document.body, '.current-tab')[0].relatedEditor);
                    return;
                } else {
                    var currSelections = editor.currentSelections;
                    for (var i = 0, len = editor.currentSelections.length; i < len; i += 1) {
                        insertObj = {
                            row: editor.currentSelections[i].start.row,
                            column: editor.currentSelections[i].start.column
                        };
                        editor.env.document.insert(insertObj, '\t');
                    }
                    closePopup();
                }
            }
        } else {
            if (autocompleteGlobals.bolBound) {
                autocompleteComplete(xtag.query(document.body, '.current-tab')[0].relatedEditor);
                return;
            } else {
                closePopup();
                editor.standardIndentExec.apply(this, arguments)
            }
        }
    };

    editor.commands.commands.gotoright.exec = function () {
        if (autocompleteGlobals.bolBound) {
            closePopup(editor);
            editor.standardgotoright.apply(this, arguments);
        } else {
            editor.standardgotoright.apply(this, arguments);
        }
    };

    editor.commands.commands.gotoleft.exec = function () {
        if (autocompleteGlobals.bolBound) {
            closePopup(editor);
            editor.standardgotoleft.apply(this, arguments);
        } else {
            editor.standardgotoleft.apply(this, arguments);
        }
    };

    editor.commands.commands.gotowordright.exec = function () {
        if (autocompleteGlobals.bolBound) {
            closePopup(editor);
            editor.standardgotowordright.apply(this, arguments);
        } else {
            editor.standardgotowordright.apply(this, arguments);
        }
    };

    editor.commands.commands.gotowordleft.exec = function () {
        if (autocompleteGlobals.bolBound) {
            closePopup(editor);
            editor.standardgotowordleft.apply(this, arguments);
        } else {
            editor.standardgotowordleft.apply(this, arguments);
        }
    };

    editor.commands.commands.gotolinestart.exec = function () {
        if (autocompleteGlobals.bolBound) {
            closePopup(editor);
            editor.standardgotolinestart.apply(this, arguments);
        } else {
            editor.standardgotolinestart.apply(this, arguments);
        }
    };

    editor.commands.commands.gotolineend.exec = function () {
        if (autocompleteGlobals.bolBound) {
            closePopup(editor);
            editor.standardgotolineend.apply(this, arguments);
        } else {
            editor.standardgotolineend.apply(this, arguments);
        }
    };



    // //gotoright, gotoleft

    editor.commands.addCommand({
        name: 'autocomplete',
        bindKey: 'Return',
        exec: function () {
            closePopup(editor);
            if (editor.currentSelections.length > 1) {
                var currSelections = editor.currentSelections;
                for (var i = 0, len = editor.currentSelections.length; i < len; i += 1) {
                    insertObj = {
                        row: editor.currentSelections[i].start.row,
                        column: editor.currentSelections[i].start.column
                    };
                    editor.env.document.insert(insertObj, '\n');
                }
            } else {
                editor.insert('\n');
            }
        }
    });

    // bind mousedown
    editor.mousedownFunction = function (event) {
        closePopup(editor);
    };
    editor.container.addEventListener('mousedown', editor.mousedownFunction);

    // bind focusout
    editor.focusoutFunction = function (event) {
        // if the element that stole the focus is not the popup ace: close the popup
        if (event.relatedTarget !== autocompleteGlobals.popupAce.focusElement) {
            //closePopup(editor);
        }
    };

    editor.container.addEventListener('focusout', editor.focusoutFunction);

    autocompleteGlobals.popupAce.focusElement = xtag.query(autocompleteGlobals.popupAce.container, '.ace_text-input')[0];
    autocompleteGlobals.popupAce.focusFunction = function (event) {
        autocompleteComplete(xtag.query(document.body, '.current-tab')[0].relatedEditor);
        closePopup(xtag.query(document.body, '.current-tab')[0].relatedEditor);
        editor.focus();
    };
    // autocompleteGlobals.bolBound = true;
    autocompleteGlobals.popupAce.focusElement.addEventListener('focus', autocompleteGlobals.popupAce.focusFunction);
    //console.log(editor.onSelectionChange);

    // This closes the popup if you select while the popup is open
    editor.textInput.getElement().addEventListener('keyup', function (event) {
        var bolArrow = (event.which >= 37 && event.which <= 40);
        if (bolArrow && event.shiftKey) {
            closePopup();
        }
    });

    // editor.textInput.getElement().addEventListener('keydown', function (event) {
    //     if (event.shiftKey && event.keyCode === 38) {
    //         closePopup();
    //     }
    // });

    editor.session.addEventListener('changeScrollTop', function (event) {
        autocompleteLogic(editor, 'scroll', event);
    });

    editor.session.addEventListener('changeScrollLeft', function (event) {
        autocompleteLogic(editor, 'scroll', event);
    });
    
    editor.addEventListener('change', function (event) {
        //console.log(event);
        
        if (event.action === 'insert') {
            //we we typed a key (four spaces is a tab from the indent action (tab key))
            if (event.lines[0] === '    ') {
                /*
                editor.selection.moveCursorTo(
                    editor.selection.getRange().start.row
                    , editor.selection.getRange().start.column + 4
                );
                */
                
                autocompleteKeyEvent = 'indent';
            } else if (event.lines[0].length === 1
                || event.lines[0].length === 0) {
                autocompleteKeyEvent = 'key';
            } else {
                autocompleteKeyEvent = 'paste';
            }
        } else {
            autocompleteKeyEvent = 'delete';
        }
        
        if (autocompleteKeyEvent !== 'delete'
            && autocompleteKeyEvent !== 'paste'
            && editor.currentSelections && editor.currentSelections.length > 1
            && (editor.currentSelections[0].start.column !== event.start.column
                || editor.currentSelections[0].start.row !== event.start.row)) {
            autocompleteKeyEvent = 'other_cursor';
        }
        
        autocompleteLogic(editor, autocompleteKeyEvent, event);
    });
}

function autocompleteLogic(editor, autocompleteKeyEvent, event) {
    // If we deleted a character or pasted in more than one, then close the popup
    if (autocompleteKeyEvent === 'delete'
        || autocompleteKeyEvent === 'paste'
        || autocompleteKeyEvent === 'scroll') {
        closePopup();
        return;

    // Else determine context and open popup
    }
    
    if (autocompleteKeyEvent === 'other_cursor') {
        return;
    }
    
    // get full script
    var strScript = editor.getValue();
    var objContext;
    
    // get event cursor position start/end
    var intStartCursorPosition = rowAndColumnToIndex(strScript, event.start.row, event.start.column);
    var intEndCursorPosition = rowAndColumnToIndex(strScript, event.end.row, event.end.column);
    var intCursorPosition = intStartCursorPosition;

    if (autocompleteKeyEvent === 'indent') {
        intCursorPosition += 3; //fix four spaces issue
    }
    
    /*
    editor.currentQueryRange = {
        'start': jsnQueryStart,
        'end':  jsnQueryEnd,
        'startIndex': jsnQuery.intQueryStart,
        'endIndex': jsnQuery.intQueryEnd,
        'text': strScript.substring(jsnQuery.intQueryStart, jsnQuery.intQueryEnd),
        'intParenLevel': jsnQuery.intParenLevelAtCursor
    };
    */
    
    if (! editor.currentQueryRange) {
       // console.log()('There was no context detected by Michael\'s code, so ignore.');
        return;
    }
    
    /*
     console.log(
        'Joseph\'s Code>' + strScript.substring(editor.currentQueryRange.startIndex,
        (
            editor.currentQueryRange.endIndex + 15) + '|' +
            (intCursorPosition - editor.currentQueryRange.startIndex) + '|' +
            strScript.substring(editor.currentQueryRange.startIndex,
            intCursorPosition + 1
        ) + '<'
    );
    */
    
    if (!(editor.currentQueryRange.startIndex <= intCursorPosition
        && intCursorPosition <= editor.currentQueryRange.endIndex)) {
        //console.log()('Cursor out of range by Michael\'s context, so ignore.');
        return;
    }
    
    objContext = getContext(
        strScript.substring(editor.currentQueryRange.startIndex
            , editor.currentQueryRange.endIndex + 15)
        , intCursorPosition - editor.currentQueryRange.startIndex);
    //objContext = getContext(strScript, intCursorPosition);
    //console.log('typeof', typeof objContext);
    //console.log('objContext', objContext);
    if (typeof objContext !== 'undefined' && objContext !== null) {
        objContext.intContextPosition = objContext.intContextPosition + editor.currentQueryRange.startIndex;
        
        //if we are at a different context position, then close current popup
        if (autocompleteGlobals.intContextPosition !== objContext.intContextPosition) {
            //console.log('close popup for different context position');
            autocompleteGlobals.intContextPosition = objContext.intContextPosition;
            closePopup();
        }
        
        if (autocompleteGlobals.startRow !== editor.selection.getRange().start.row
            || autocompleteGlobals.startColumnSearch !== editor.selection.getRange().start.column - objContext.strContext.length) {
            //console.log('close popup for different search position');
            autocompleteGlobals.startRow = editor.selection.getRange().start.row;
            autocompleteGlobals.startColumnSearch = editor.selection.getRange().start.column - objContext.strContext.length;
            closePopup();
        }
        
        //open popup using context
        //console.log('told to open');
        autocompleteGlobals.searchLength = objContext.searchLength;
        autocompleteMakeList(objContext.arrQueries, objContext.strContext, editor);
        

    } else {
        //console.log('told to close');
        closePopup();
    }
}

function closePopup() {
    //console.trace('closePopup');
    if (autocompleteGlobals.popupOpen === true || autocompleteGlobals.bolQueryRunning) {
        autocompleteGlobals.popupOpen = false;
        //console.log('closed');
        autocompleteGlobals.bolBound = false;
        // if the autocomplete query is still running: cancel it
        //console.log('2 autocompleteGlobals.strQueryID', autocompleteGlobals.strQueryID);
        //console.log('2 autocompleteGlobals.bolQueryRunning', autocompleteGlobals.bolQueryRunning);
        //console.log('2 autocompleteGlobals.bolQueryCancelled', autocompleteGlobals.bolQueryCancelled);
        if (autocompleteGlobals.strQueryID && autocompleteGlobals.bolQueryRunning && !autocompleteGlobals.bolQueryCancelled) {
            //console.log('2 CANCEL');
            //console.log(autocompleteGlobals.strQueryID);
            GS.requestFromSocket(GS.envSocket, 'CANCEL', '', autocompleteGlobals.strQueryID);
            autocompleteGlobals.bolQueryCancelled = true;
            autocompleteGlobals.popupLoading = false;
        }

        if (autocompleteGlobals.popupElement.parentNode === document.body) {
            // remove the popup from the dom
            document.body.removeChild(autocompleteGlobals.popupElement);
        }

        autocompleteGlobals.popupAce.setValue('');

        autocompleteGlobals.popupLoading = false;
        autocompleteGlobals.arrSearch = [];
        autocompleteGlobals.arrValues = [];
        autocompleteGlobals.arrSearchMaster = [];
        autocompleteGlobals.arrValuesMaster = [];
    }
}

function autocompleteComplete(editor) {
    //console.trace('autocompleteComplete');
    //console.log('autocompleteGlobals.searchLength', autocompleteGlobals.searchLength);
    var intFocusedLine = autocompleteGlobals.popupAce.getSelectionRange().start.row;
    var currentValue = autocompleteGlobals.arrValues[intFocusedLine];
    //console.log('popupOpen', autocompleteGlobals.popupOpen);
    //console.log('currentValue', currentValue);
    //console.log('arrValues', autocompleteGlobals.arrValues);
    //console.log('arrValuesMaster', autocompleteGlobals.arrValuesMaster);
    //console.log('intFocusedLine', intFocusedLine);
    //var strScript, intCursorPosition, intStartCursorPosition;
    //strScript = editor.getValue();
    //intStartCursorPosition = rowAndColumnToIndex(strScript, editor.currentSelections[0].start.row, editor.currentSelections[0].start.column);
    //intCursorPosition = intStartCursorPosition;
    //var wordLength = 0;
    //for (var i = 0, len = intCursorPosition; i <= len; i++) {
    //    if (isAlpha(strScript[intCursorPosition - i]) || strScript[intCursorPosition - i] === '_') {
    //        wordLength += 1;
    //    } else if (wordLength >= 1 || strScript[intCursorPosition - i].trim() !== '') {
    //        break;
    //    }
    //}
    //autocompleteGlobals.searchLength = wordLength;
    //console.log(autocompleteGlobals.searchLength);


    closePopup();
    var currSelectionRange = editor.selection.getRange();
    //console.log(currentValue);
    if (currentValue && currentValue[0].indexOf(' (Snippet)') !== -1) {
        var currSearchSnippet;
        for (var i = 0, len = snippets.length; i < len; i++) {
            currSearchSnippet = snippets[i];
            //console.log(currSearchSnippet[0].toLowerCase(), currentValue[0].toLowerCase());
            if (currSearchSnippet[0].toLowerCase() === currentValue[0].toLowerCase()) {

                //console.log(currSearchSnippet[2])
                editor.getSelection().setSelectionRange(new Range(
                    currSelectionRange.start.row,
                    ((currSelectionRange.start.column === 1) ? 0 : currSelectionRange.start.column - autocompleteGlobals.searchLength),
                    currSelectionRange.end.row,
                    currSelectionRange.end.column
                ));

                ace.config.loadModule('ace/ext/language_tools', function () {
                    editor.insertSnippet(currSearchSnippet[2]);
                });
                break;
            }
        }
    } else if (currentValue) {
        //autocompleteGlobals
        //console.log(currentValue[0], autocompleteGlobals.searchLength);
        //if (editor.currentSelections.length > 1) {
            var currSelections = editor.currentSelections;
            var replaceText = currentValue[0].trim();
            for (var i = 0, len = currSelections.length; i < len; i += 1) {
                rangeObj = new Range(
                    currSelections[i].start.row,
                    currSelections[i].start.column - autocompleteGlobals.searchLength,
                    currSelections[i].start.row,
                    currSelections[i].start.column
                );
                editor.env.document.replace(rangeObj, replaceText);
            }
            /*
            var currSelections = editor.currentSelections;
            var insertText = currentValue[0].trim().substring(autocompleteGlobals.searchLength, currentValue[0].trim().length);
            for (var i = 0, len = currSelections.length; i < len; i += 1) {
                insertObj = {
                    row: currSelections[i].start.row,
                    column: currSelections[i].start.column
                };
                //editor.moveCursorToPosition(insertObj);
                editor.env.document.insert(insertObj, insertText);
            }
        } else {
            editor.insert(currentValue[0].trim().substring(autocompleteGlobals.searchLength, currentValue[0].trim().length));
        }
        */
    }
}

function autocompleteMakeList(arrQueries, searchWord, editor) {
    'use strict';
    //console.log('autocompleteGlobals.bolQueryRunning', autocompleteGlobals.bolQueryRunning);
    if (autocompleteGlobals.bolQueryRunning) {
        //console.log('autocompleteGlobals.strSpecialFilter := ' + searchWord);
        autocompleteGlobals.strSpecialFilter = searchWord;
    } else {
        //queryVars

        var optionList = ['hidden'];
        autocompleteGlobals.popupLoading = true;
        autocompleteGlobals.arrSearch = ['hidden'];
        autocompleteGlobals.arrSearchMaster = ['hidden'];
        var strQuery = '';
        var i;
        var len;
        var arrSuggestion;
        var suggestion_i;
        var suggestion_len;

        for (i = 0, len = arrQueries.length; i < len; i += 1) {
            if (typeof arrQueries[i] !== 'string') {
                for (suggestion_i = 0, suggestion_len = arrQueries[i].length; suggestion_i < suggestion_len; suggestion_i += 1) {
                    arrQueries[i][suggestion_i] = 'SELECT $token$' + arrQueries[i][suggestion_i] + '$token$::text AS obj_name, \'\'::text AS obj_meta';
                }

                arrQueries[i] = 'SELECT * FROM (' + arrQueries[i].join('\nUNION ALL\n') + ') list_suggestions_' + i;
            }
        }

        strQuery = 'SELECT DISTINCT * FROM (\n' + arrQueries.join('\n     UNION ALL\n') + '\n' + ') em ORDER BY obj_name;';
        //console.log(strQuery);
        // if the autocomplete query is still running: cancel it
        //console.log('1 autocompleteGlobals.strQueryID', autocompleteGlobals.strQueryID);
        //console.log('1 autocompleteGlobals.bolQueryRunning', autocompleteGlobals.bolQueryRunning);
        if (autocompleteGlobals.strQueryID && autocompleteGlobals.bolQueryRunning) {
            //console.log('1 CANCEL');
            GS.requestFromSocket(GS.envSocket, 'CANCEL', '', autocompleteGlobals.strQueryID);
        }
        //console.log('autocompleteGlobals.bolAlpha:' + autocompleteGlobals.bolAlpha);
        if (autocompleteGlobals.bolAlpha) {
            var strDeclare = editor.getValue();
            var substrEnd;
            var arrFuncVariables = [];
            
            // we need to autocomplete for variables when inside a DECLARE...BEGIN...END
            //      block. we will do this in several steps:
            //          - determine what and how many BEGIN blocks the cursor is inside
            //          - find the DECLARE blocks for each BEGIN block we are inside
            //          - extract the variable names from each DECLARE block
            //
            // some things to pay attention to:
            //      we need high performance, we should not have to parse the entire script
            //          accomplish this task. to do this we'll start our parsing from the
            //          position of the cursor.
            //
            // not every BEGIN has a DECLARE preceding it. we could be within two BEGIN
            //      statements, we should get the variables from all BEGINs that we are
            //      within.
            //
            // EXAMPLE #1:
            //      DECLARE
            //          var_one integer;
            //          var_two integer;
            //      BEGIN
            //
            //          | <------ should autocomplete with var_one,var_two
            //
            //          DECLARE
            //              var_three integer;
            //              var_four integer;
            //          BEGIN
            //
            //              | <------ should autocomplete with var_one,var_two,var_three,var_four
            //
            //          END;
            //
            //          | <------ should autocomplete with var_one,var_two
            //
            //      END;
            //
            // To implement this, 
            //
            //
            //
            //
            //
            
            
            var bolContinue = false;
            var strStart = strDeclare.toLowerCase().substring(0, autocompleteGlobals.intContextPosition);
            
            var intLastDollarQuoting = Math.max(strStart.lastIndexOf('$body$'), strStart.lastIndexOf('$sql$'));
            var intEmptyQuoting = strStart.lastIndexOf('$$');
           // console.log()('intLastDollarQuoting', intLastDollarQuoting);
           // console.log()('str intLastDollarQuoting', strStart.substr(intLastDollarQuoting, 20));
           // console.log()('intEmptyQuoting', intEmptyQuoting);
           // console.log()('str intEmptyQuoting', strStart.substr(intEmptyQuoting, 20));
            if (intLastDollarQuoting > 0 && strStart.substring(intLastDollarQuoting).match(/[\t\n\r ]*DECLARE/i)) {
               // console.log()('$body$ or $sql$ matched');
                bolContinue = true;
            } else if (intEmptyQuoting > 0 && strStart.substring(intEmptyQuoting).match(/[\t\n\r ]*DECLARE/i)) {
               // console.log()('$$ matched');
                bolContinue = true;
            }
            
           // console.log()('bolContinue', bolContinue);
            if (bolContinue) {
                substrEnd = strStart.toLowerCase().lastIndexOf('begin');
                strDeclare = strDeclare.substring(strStart.toLowerCase().lastIndexOf('declare'), substrEnd);
                // get variable names
                arrFuncVariables = strDeclare.match(/([A-Za-z_0-9]+\ )+/ig);
               // console.log()('arrFuncVariables: ' + arrFuncVariables);
                // trim variable names
                if (arrFuncVariables) {
                    for (var i = 0, len = arrFuncVariables.length; i < len; i++) {
                        arrFuncVariables[i] = arrFuncVariables[i].trim();
                       // console.log()(arrFuncVariables[i] + ' : ' + arrFuncVariables[i].indexOf(' '));
                        // if arrFuncVariables[i] has a space in it still: substring it off
                        if (arrFuncVariables[i].indexOf(' ') !== -1) {
                            arrFuncVariables[i] = arrFuncVariables[i].substring(0, arrFuncVariables[i].indexOf(' '));
                        }
                        if (arrFuncVariables[i].substring(0, searchWord.length).toLowerCase() === searchWord.toLowerCase()) {
                            optionList.push(['' + arrFuncVariables[i] + '', 'funcVar']);
                            if (arrFuncVariables[i].substring(0, 1) === '"') {
                                autocompleteGlobals.arrSearch.push(arrFuncVariables[i].toLowerCase());
                            } else {
                                autocompleteGlobals.arrSearch.push('"' + arrFuncVariables[i].toLowerCase() + '"');
                            }
                        }
                    }
                }
            }
            
            // We need to determine if any variables are available in our current context
            
            
            
            //if (arrFuncVariables) {
            //    for (var i = 0, len = arrFuncVariables.length; i < len; i++) {
            //        arrFuncVariables[i] = arrFuncVariables[i].trim();
            //        //console.log(arrFuncVariables[i] + ' : ' + arrFuncVariables[i].indexOf(' '));
            //        // if arrFuncVariables[i] has a space in it still: substring it off
            //        if (arrFuncVariables[i].indexOf(' ') !== -1) {
            //            arrFuncVariables[i] = arrFuncVariables[i].substring(0, arrFuncVariables[i].indexOf(' '));
            //        }
            //        if (arrFuncVariables[i].substring(0, searchWord.length).toLowerCase() === searchWord.toLowerCase()) {
            //            optionList.push(['' + arrFuncVariables[i] + '', 'funcVar']);
            //            if (arrFuncVariables[i].substring(0, 1) === '"') {
            //                autocompleteGlobals.arrSearch.push(arrFuncVariables[i].toLowerCase());
            //            } else {
            //                autocompleteGlobals.arrSearch.push('"' + arrFuncVariables[i].toLowerCase() + '"');
            //            }
            //        }
            //    }
            //}
            
            
            
            //var strDeclare = editor.getValue(), substrEnd, arrFuncVariables = [];
            //// if there is a $body$ statement: get variable names;
            //if (strDeclare.toLowerCase().indexOf('$body$') !== -1) {
            //    // if there is a declare statement: get variable names;
            //    if (strDeclare.toLowerCase().indexOf('declare') !== -1) {
            //        // if there is a begin: substring to that;
            //        if (strDeclare.toLowerCase().indexOf('begin') !== -1) {
            //            //TODO: is there a $body$ afterwords and before the cursor, then stop
            //            if (strDeclare.substring(strDeclare.toLowerCase().indexOf('begin')).indexOf('$body$') === -1) { 
            //                substrEnd = strDeclare.toLowerCase().indexOf('begin');
            //                strDeclare = strDeclare.substring(strDeclare.toLowerCase().indexOf('declare'), substrEnd);
            //                // get variable names
            //                arrFuncVariables = strDeclare.match(/([A-Za-z_0-9]+\ )+/ig);
            //                //console.log('arrFuncVariables: ' + arrFuncVariables);
            //                // trim variable names
            //                if (arrFuncVariables) {
            //                    for (var i = 0, len = arrFuncVariables.length; i < len; i++) {
            //                        arrFuncVariables[i] = arrFuncVariables[i].trim();
            //                        //console.log(arrFuncVariables[i] + ' : ' + arrFuncVariables[i].indexOf(' '));
            //                        // if arrFuncVariables[i] has a space in it still: substring it off
            //                        if (arrFuncVariables[i].indexOf(' ') !== -1) {
            //                            arrFuncVariables[i] = arrFuncVariables[i].substring(0, arrFuncVariables[i].indexOf(' '));
            //                        }
            //                        if (arrFuncVariables[i].substring(0, searchWord.length).toLowerCase() === searchWord.toLowerCase()) {
            //                            optionList.push(['' + arrFuncVariables[i] + '', 'funcVar']);
            //                            if (arrFuncVariables[i].substring(0, 1) === '"') {
            //                                autocompleteGlobals.arrSearch.push(arrFuncVariables[i].toLowerCase());
            //                            } else {
            //                                autocompleteGlobals.arrSearch.push('"' + arrFuncVariables[i].toLowerCase() + '"');
            //                            }
            //                        }
            //                    }
            //                }
            //            }
            //        }
            //    }
            //}
        }
        // //console.log(autocompleteGlobals.arrSearchPath, queryVars.bolSearchPath);
        if (autocompleteGlobals.arrSearchPath && queryVars.bolSchemas) {
            for (var i = 0, len = autocompleteGlobals.arrSearchPath.length; i < len; i++) {
                //TODO: searchWord might be empty
                if (autocompleteGlobals.arrSearchPath[i][0].substring(0, searchWord.length).toLowerCase() === searchWord.toLowerCase()) {
                    optionList.push(autocompleteGlobals.arrSearchPath[i]);
                    if (autocompleteGlobals.arrSearchPath[i][0].substring(0, 1) === '"') {
                        autocompleteGlobals.arrSearch.push(autocompleteGlobals.arrSearchPath[i][0].toLowerCase());
                    } else {
                        autocompleteGlobals.arrSearch.push('"' + autocompleteGlobals.arrSearchPath[i][0].toLowerCase() + '"');
                    }
                }
            }
        }

        if (autocompleteGlobals.bolSnippets) {
            var currSnippet;
            for (var i = 0, len = snippets.length; i < len; i++) {
                currSnippet = snippets[i];
                //console.log(currSnippet);
                //console.log(searchWord);
                if (!searchWord || currSnippet[0].substring(0, searchWord.length).toLowerCase().indexOf(searchWord.toLowerCase()) !== -1) {
                    //console.log('push');
                    optionList.push(currSnippet);
                    autocompleteGlobals.arrSearch.push('"' + currSnippet[0].toLowerCase() + '"');
                    autocompleteGlobals.arrSearchMaster.push('"' + currSnippet[0].toLowerCase() + '"');
                }
            }
        }

        if (arrQueries.length === 0) {
            autoCompleteTryOpen(optionList, searchWord, editor);
            return;
        }

        //autocompleteGlobals.arrSearchPath
        
        //console.log('autocompleteGlobals.bolQueryRunning := true');
        autocompleteGlobals.bolQueryRunning = true;
        // make the request
        var getlist = function () {
            //console.log('autocompleteGlobals.strQueryID := ');
            autocompleteGlobals.strQueryID = GS.requestRawFromSocket(GS.envSocket, strQuery, function (data, error) {
                var arrRows, i, len;
                if (!error) {
                    //console.log(data.strMessage);
                    if (data.strMessage !== '\\.' && !data.bolLastMessage) {
                        arrRows = data.strMessage.split('\n');
                        for (i = 0, len = arrRows.length; i < len; i += 1) {
                            arrRows[i] = arrRows[i].split('\t');
                            arrRows[i][0] = GS.decodeFromTabDelimited(arrRows[i][0]);
                            optionList.push(arrRows[i]);
                            if (arrRows[i][0].substring(0, 1) === '"') {
                                autocompleteGlobals.arrSearch.push(arrRows[i][0].toLowerCase());
                            } else {
                                autocompleteGlobals.arrSearch.push('"' + arrRows[i][0].toLowerCase() + '"');
                            }
                            if (arrRows[i][0].substring(0, 1) === '"') {
                                autocompleteGlobals.arrSearchMaster.push(arrRows[i][0].toLowerCase());
                            } else {
                                autocompleteGlobals.arrSearchMaster.push('"' + arrRows[i][0].toLowerCase() + '"');
                            }
                            //console.log(optionList);
                        }
                    } else if (data.strMessage === '\\.') {
                        autocompleteGlobals.strQueryID = null;
                    } else if (data.bolLastMessage) {
                        autocompleteGlobals.strQueryID = null;
                        //console.log('arrValues', autocompleteGlobals.arrValues);

                        //console.log('autocompleteGlobals.bolQueryRunning := false');
                        autocompleteGlobals.bolQueryRunning = false;
                        //console.log('autocompleteGlobals.bolQueryCancelled := false');
                        autocompleteGlobals.bolQueryCancelled = false;
                        //console.log('ending the query');
                        //console.log('strQuery', strQuery);

                        autoCompleteTryOpen(optionList, searchWord, editor);

                    }
                } else {
                    //console.log('autocompleteGlobals.bolQueryRunning := false');
                    autocompleteGlobals.bolQueryRunning = false;
                    //console.log('autocompleteGlobals.strQueryID := null');
                    autocompleteGlobals.strQueryID = null;
                    //console.warn('websocket error', error, data);
                }
            });
        }

        if (autocompleteGlobals.bolTestSlowDown) {
            setTimeout(function(){
                getlist();
            }, 2000);
            //console.log('autocompleteGlobals.bolQueryRunning := false');
            autocompleteGlobals.bolQueryRunning = false;
            //console.log('autocompleteGlobals.bolQueryCancelled := false');
            autocompleteGlobals.bolQueryCancelled = false;
            //autocompleteGlobals.bolTestSlowDown = false;
        } else {
            getlist();
        }

    }
}

function autoCompleteTryOpen(optionList, searchWord, editor) {
    optionList.shift();
    autocompleteGlobals.arrSearch.shift()
    autocompleteGlobals.arrSearchMaster.shift();

    autocompleteGlobals.arrValues = optionList;
    autocompleteGlobals.arrValuesMaster = optionList;
    
    if (autocompleteGlobals.strSpecialFilter) {
        if (optionList.length === 0) {
            closePopup();
        } else {
            //closePopup();
            
            autocompleteFilterList(optionList, autocompleteGlobals.strSpecialFilter, editor);
        }
        autocompleteGlobals.strSpecialFilter = "";

    } else {
        if (optionList.length === 0) {
            closePopup();
        } else if (autocompleteGlobals.popupOpen === false) {
            openPopup(editor, optionList, false, searchWord);
            
            autocompleteFilterList(optionList, searchWord, editor);
        } else if (autocompleteGlobals.popupOpen === true) {
            loadPopuplist(editor, optionList);
            
            autocompleteFilterList(optionList, searchWord, editor);
        }
    }
}

function autocompleteFilterList(list, searchWord, editor) {
    //console.trace('autocompleteFilterList');
    
    //console.log('searchWord', searchWord, autocompleteGlobals.searchLength);
    //console.log(autocompleteGlobals.bolQueryRunning);
    if (autocompleteGlobals.bolQueryRunning) {
        autocompleteGlobals.strSpecialFilter = searchWord;
    } else if (!searchWord || searchWord.length === 0) {
        //closePopup();
        if (!autocompleteGlobals.popupOpen) {
            openPopup(editor, list, false, searchWord);
        }
    } else {
        autocompleteGlobals.popupLoading = true;
        var arrNewValue = [];
        autocompleteGlobals.popupAce.setValue('');

        //console.log('autocompleteGlobals.arrValues before filter', autocompleteGlobals.arrValues);
        for (i = 0, len = autocompleteGlobals.arrValues.length, strNewValue = ''; i < len; i += 1) {
            // if the current item doesn't match: remove from ace, arrSearch and arrValues
            //console.log('autocompleteGlobals.arrSearch', autocompleteGlobals.arrSearch);
            if (autocompleteGlobals.arrValues[i][0]) {
                strSearch = searchWord.toLowerCase();
                //console.log('strSearch', strSearch);
                //console.log('autocompleteGlobals.arrValues[' + i + '][0]', autocompleteGlobals.arrValues[i][0]);
                //console.log('potential filter', ((autocompleteGlobals.arrValues[i][0].toLowerCase().indexOf(strSearch.toLowerCase) === -1) ? 'splice' : 'keep'));
                if (autocompleteGlobals.arrValues[i][0].toLowerCase().indexOf(strSearch) === -1) {
                    //console.log('splice', autocompleteGlobals.arrSearch[i].indexOf(strSearch), autocompleteGlobals.arrSearch[i], strSearch);
                    autocompleteGlobals.arrSearch.splice(i, 1);
                    autocompleteGlobals.arrValues.splice(i, 1);
                    //console.log(autocompleteGlobals.arrValues[i]);
                    i -= 1;
                    len -= 1;
                }
            } else {
                break;
            }
        }
        //console.log('autocompleteGlobals.arrValues after filter', autocompleteGlobals.arrValues);

        if (autocompleteGlobals.arrSearch.length === 0 || autocompleteGlobals.arrValues.length === 0 || (autocompleteGlobals.arrValues.length === 1 && autocompleteGlobals.arrValues[0][0] === (searchWord))) {
            closePopup();
        } else {
            openPopup(editor, autocompleteGlobals.arrValues, true, searchWord);
        }
    }
}

//bolKeepOpen allows autocompleteFilterList to not close the popup which emptys the variables
function openPopup(editor, optionlist, bolKeepOpen, searchWord) {
    'use strict';
    //console.trace('openPopup');
    //console.log('optionlist', optionlist);

    // if (autocompleteGlobals.searchLength !==  getCurrWord(editor).length) {
    //     autocompleteFilterList(optionlist, getCurrWord(editor), editor)
    // }

    //console.log(autocompleteGlobals.bolQueryRunning);
    //console.log(editor.selection.getRange().start.column - searchWord.length);
    
    var //jsnSearchStart = indexToRowAndColumn(editor.getValue(), editor.selection.getRange().start.column)
      jsnPosition = editor.renderer.textToScreenCoordinates(editor.selection.getRange().start.row, editor.selection.getRange().start.column - searchWord.length)
      , intLeft = jsnPosition.pageX
      , intTop = jsnPosition.pageY
      , intLineHeight = editor.renderer.$textLayer.getLineHeight();

    //intLeft -= 4; //I tried to get it right -joseph

    // if autocomplete is open: filter it
    if (autocompleteGlobals.popupOpen === true && !bolKeepOpen) {
        //TODO: filter the current popup
        //autocompleteFilterList(list, searchWord, editor);
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

    loadPopuplist(editor, optionlist);
}

function loadPopuplist(editor, optionlist) {
    'use strict';
    var intHeight;

    //console.log(optionlist);

    var strNewValue = '';
    for (var i = 0, len = optionlist.length; i < len; i++) {
        strNewValue += '\n';
        strNewValue += optionlist[i][0];
    }

    autocompleteGlobals.bolBound = true;

    autocompleteGlobals.popupAce.setValue(strNewValue.substring(1));
    autocompleteGlobals.popupAce.resize();

    document.getElementById('autocomplete-popup').removeAttribute('hidden');
    
    
    
    // calculate popup height
    intHeight = autocompleteGlobals.popupAce.renderer.$textLayer.getLineHeight() * (optionlist.length + 1);
    if (intHeight > 150) {
        intHeight = 150;
    }

    // set popup height
    autocompleteGlobals.popupElement.style.height = intHeight + 'px';
    
    
    
    autocompleteGlobals.popupAce.selection.setSelectionRange(new Range(0, 0, 0, 0));
    autocompleteGlobals.popupAce.scrollToLine(0);

    if (document.getElementById('autocomplete-popup')) {
        document.getElementById('autocomplete-popup-instruction').style.top =
                            document.getElementById('autocomplete-popup').style.height +
                            document.getElementById('autocomplete-popup-instruction').style.height;
    }

    autocompleteGlobals.popupLoading = false;
}