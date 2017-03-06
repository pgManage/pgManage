var elemPos = GS.getElementPositionData(document.getElementById('left-panel-body'));
var bolTreeFunctionsLoaded = true
  , treeGlobals = {
        'ace':          null
      , 'aceSession':   null
      , 'data':         []
      , 'folderPlus':   '▶' //(window.navigator.userAgent.indexOf('CrOS') === -1 ? '▶' : '►')
      , 'folderMinus':  '▼'
      , 'scriptMarker': '•' // sometimes not used for a script in favor of a 2 character object-type specific code
      , 'padString':    ' '
      , 'shownItems':   []
      , 'shownObjects': []
      , 'whiteRows':    0
      , 'rolesMarker':  null
      , 'moreMarker':   null
      , 'schemaMarker': null
      , 'rolesMarkerMaster':  null
      , 'moreMarkerMaster':   null
      , 'schemaMarkerMaster': null
    };

//   ⊞ | + | > | ▶ | □ |
//   ⊟ | - | v | ▼ | ■ |
//   » | • | → | • | ▬ | ◗


// initalize tree
function treeStart() {
    'use strict';
    // create and configure tree ace
    treeGlobals.ace = ace.edit('object-list-ace');
    treeGlobals.aceSession = treeGlobals.ace.getSession();

    if (!evt.touchDevice) {
        // get and save state
        var dragstartcursorX, dragstartcursorY;
        var strName;
        var ghost;
        var bolMousedown = false;
        var intSelectionTriggered = 0;
        var intSelectionRow;
        var bolSelectionTriggered;
        var mouseMoveFunction;
        var bolOptionPressed;
        var strNameOpt;
        var cursorX, cursorY;

        document.addEventListener('keydown', function (event) {
            if (event.keyCode === 18) {
                bolOptionPressed = true;
                if (ghost) {
                    ghost.innerHTML = strNameOpt;
                    ghost.style.left = (cursorX - ((ghost.innerHTML.length * 3) + 5)) + 'px';
                }
            }
        });

        document.addEventListener('keyup', function (event) {
            if (bolOptionPressed) {
                bolOptionPressed = false;
                if (ghost) {
                    ghost.innerHTML = strName;
                    ghost.style.left = (cursorX - ((ghost.innerHTML.length * 3) + 5)) + 'px';
                }
            }
        });

        treeGlobals.ace.addEventListener('mousedown', function (event) {
            var stateMoveFunction;
            var stateEndFunction;
            var currentcursorX;
            var currentcursorY;
            var startcursorX;
            var startcursorY;
            var currentTab = xtag.query(document.body, '.current-tab')[0];

            bolMousedown = true;
            intSelectionTriggered = 0;

            // save origin point so you can cancel if it doesn't move enough
            startcursorX = event.clientX;
            startcursorY = event.clientY;

            // save origin point so you can cancel selection of tree view
            dragstartcursorX = event.clientX;
            dragstartcursorY = event.clientY;

            mouseMoveFunction = function (event) {
                // get cursor position (x/y)
                cursorX = event.clientX;
                cursorY = event.clientY;

                if (currentTab !== undefined){
                    // move ace cursor
                    currentTab.relatedEditor.selection.moveToPosition(
                        currentTab.relatedEditor.renderer.screenToTextCoordinates(cursorX, cursorY)
                    );
                }

                // set ghost position to cursor position (x/y) with changes to center it
                ghost.style.left = (cursorX - ((ghost.innerHTML.length * 3) + 5)) + 'px';
                ghost.style.top = (cursorY - 15) + 'px';

                //console.log(cursorX, cursorX, dragstartcursorX, dragstartcursorY);

                // after moving ten pixels:
                if (
                    cursorX <= (dragstartcursorX - 10) ||
                    cursorX >= (dragstartcursorX + 10) ||
                    cursorY <= (dragstartcursorY - 10) ||
                    cursorY >= (dragstartcursorY + 10)
                ) {
                    // clear selection
                    treeGlobals.ace.getSession().selection.clearSelection();
                }
            };

            // this handles mouseup out of the window by running
            //      the end function if the mouse moves while it is up
            stateMoveFunction = function (event) {
                // if there is a editor tab open:
                if (currentTab !== undefined){
                    // focus to editor
                    currentTab.relatedEditor.focus();
                }

                // IF mouse is up AND we're not on a touch device
                if (event.which === 0 && !evt.touchDevice) {
                    stateEndFunction(event);
                }
            };

            stateEndFunction = function (event) {
                // get current cursor position
                currentcursorX = (
                    (window.Event)
                        ? event.pageX
                        : event.clientX + (
                                document.documentElement.scrollLeft
                                    ? document.documentElement.scrollLeft
                                    : document.body.scrollLeft
                        )
                );
                currentcursorY = (
                    (window.Event)
                        ? event.pageY
                        : event.clientY + (
                                document.documentElement.scrollTop
                                    ? document.documentElement.scrollTop
                                    : document.body.scrollTop
                        )
                );
                bolMousedown = false;
                bolSelectionTriggered = 0;

                // if cursor has moved off of treeview to the editor ace
                if (currentcursorX > (elemPos.intElementWidth + 60)) {
                    // if there is a editor tab open:
                    if (currentTab !== undefined){
                        // insert snippet text
                        currentTab.relatedEditor.insert(ghost.innerHTML);
                    }
                }

                // remove ghost if appended
                if (ghost && ghost.parentNode && ghost.parentNode.nodeName === 'BODY') {
                    ghost.parentNode.removeChild(ghost);
                }

                strName = '';

                // unbind mousemove and mouseup
                document.body.removeEventListener(evt.mousemove, stateMoveFunction);
                document.body.removeEventListener(evt.mouseup, stateEndFunction);
                document.body.removeEventListener(evt.mousemove, mouseMoveFunction);
            };

            document.body.addEventListener(evt.mousemove, stateMoveFunction);
            document.body.addEventListener(evt.mouseup, stateEndFunction);
        });

        // start drag on changeSelection
        treeGlobals.ace.addEventListener('changeSelection', function (event) {
            var jsnSelection;
            var jsnData;
            var subStrEnd;
            var intI;

            // only listen to selection change on the second trigger
            if (intSelectionTriggered === 0) {
                intSelectionTriggered += 1;

            } else if (bolMousedown && intSelectionTriggered === 1) {
                intSelectionTriggered += 1;
                jsnSelection = treeGlobals.ace.getSelectionRange();
                intSelectionRow = jsnSelection.start.row;
                jsnData = treeGlobals.data[intSelectionRow];

                if (jsnData) {
                    // tables
                    if (jsnData.query === 'objectTable') {
                        strName = jsnData.name;
                        strNameOpt = jsnData.schemaName + '.' + jsnData.name

                    // views
                    } else if (jsnData.query === 'objectView') {
                        strName = jsnData.name;
                        strNameOpt = jsnData.schemaName + '.' + jsnData.name;

                    // non-schema objects (functions, sequences, etc...)
                    } else if (jsnData.schemaName && jsnData.schemaOID && jsnData.oid !== jsnData.schemaOID) {
                        strName = jsnData.name;
                        strNameOpt = jsnData.schemaName + '.' + jsnData.name;

                    // schemas
                    } else if (!jsnData.schemaName && jsnData.oid) { // schemas use .name for their name, not .schemaName
                        strName = jsnData.name;
                        strNameOpt = jsnData.name;
                    }

                    // columns
                    if (jsnData.type === '') {
                        // substring column type off of column name
                        subStrEnd = strName.lastIndexOf(' (');
                        strName = strName.substring(0, subStrEnd);

                        // go up a record until you find a table/view
                        for (intI = intSelectionRow; intI >= 0; intI -= 1) {
                            if (treeGlobals.data[intI].query === 'objectTable') {
                                strNameOpt = treeGlobals.data[intI].name + '.' + strName.substring(0, subStrEnd);
                                //set intI to  0 to cancel the loop
                                intI = 0;

                            } else if (treeGlobals.data[intI].query === 'objectView') {
                                strNameOpt = treeGlobals.data[intI].name + '.' + strName.substring(0, subStrEnd);
                                //set intI to  0 to cancel the loop
                                intI = 0;
                            }
                        }
                    }

                    if (strName) {
                        document.body.addEventListener('mousemove', mouseMoveFunction);
                    }
                }

                if (strName) {
                    ghost = document.createElement('div')
                    ghost.style.minHeight = '0px';
                    ghost.style.padding = '0.25em';
                    ghost.style.position = 'absolute';
                    ghost.style.zIndex = '999999999999';
                    ghost.style.opacity = '0.5';
                    ghost.style.width = strName.length + '.99em';
                    ghost.style.height =  '1.5em';
                    ghost.innerHTML += '' + strName + '';
                    ghost.style.pointerEvents = 'none';
                    ghost.style.top = '-500px';
                    ghost.style.left = '-500px';

                    // if ghost is not appended yet: append to body
                    if (!ghost.parentNode || ghost.parentNode.nodeName !== 'BODY') {
                        document.body.appendChild(ghost);
                    }
                }
            }
        });
    }



    treeGlobals.aceSession.setMode('ace/mode/text');
    //treeGlobals.aceSession.setUseWrapMode('free');

    treeGlobals.ace.setTheme('ace/theme/pgpanel');
    treeGlobals.ace.getSession().setMode('ace/mode/pgpanel');
    treeGlobals.ace.setShowPrintMargin(false);
    treeGlobals.ace.setDisplayIndentGuides(false);
    treeGlobals.ace.setShowFoldWidgets(false);
    treeGlobals.ace.setBehavioursEnabled(false);
    treeGlobals.ace.setHighlightActiveLine(true);
    treeGlobals.ace.$blockScrolling = Infinity; // <== blocks a warning
    treeGlobals.ace.setValue('');
    treeGlobals.ace.setReadOnly(true);
    treeGlobals.ace.renderer.setShowGutter(false);
    treeGlobals.ace.renderer.hideCursor();
    treeGlobals.ace.renderer.$cursorLayer.element.style.display = 'none';

    // When we are on a touch device, clicking into an ace editor brings up the
    //      keyboard. We don't want that to happen in the tree, so if we're on
    //      a touch device, we disable the ace editor's internal textarea to
    //      prevent it from getting focus.
    if (evt.touchDevice) {
        treeGlobals.ace.renderer.textarea.setAttribute('disabled', '');
        //treeGlobals.ace.renderer.textarea.addEventListener('focus', function (event) {
        //    event.preventDefault();
        //    document.body.focus();
        //});
    }
    
    //treeGlobals.ace.renderer.setStyle("disabled", true);
    
    //treeGlobals.ace.getSession().selection.on('changeSelection', function (e) {
    //    treeGlobals.ace.getSession().selection.clearSelection();
    //});
    

    // allow the user to scroll past the bottom of the ace so that when they are
    //      scrolled to the bottom and they close a folder they don't get scrolled
    //      to a different position
    treeGlobals.ace.setOption('scrollPastEnd', true);

    // this code has been replaced with the line above
    //// add whitespace to the end of the tree so that when you close a folder the tree does not scroll unexpectedly
    //treeRefreshWhitespace();
    //
    //// on window resize: re-adjust the number of whitespace at the end of the tree
    //window.addEventListener('resize', function () {
    //    treeRefreshWhitespace();
    //});

    // set ace inital value and selection in the ace
    //treeGlobals.ace.setValue('Schemas\n');
    //treeGlobals.ace.selection.setSelectionRange(new Range(0, 0, 0, 0));

    // make nothing initially selected - didn't work
    treeGlobals.ace.setHighlightActiveLine(false);

    // create "Roles" and "More" markers
    treeGlobals.rolesMarkerMaster = {
        'level':     0
      , 'open':      false
      , 'type':      'button'
      , 'name':      'Roles'
      , 'real_text': 'Roles'
      , 'action':    function () {}
    };
    treeGlobals.moreMarkerMaster = {
        'level':     0
      , 'open':      false
      , 'type':      'button'
      , 'name':      'More'
      , 'real_text': 'More'
      , 'action':    function () {}
    };

    // create "Schemas" marker and add it to the tree data
    treeGlobals.schemaMarkerMaster = {
        'level':     0
      , 'open':      false
      , 'type':      'button'
      , 'name':      'Schemas'
      , 'real_text': 'Schemas'
      , 'action':    function (data, index) {
            if (data.open === false) {
                data.open = true;

                //treeGlobals.shownItems = [];
                //treeGlobals.shownObjects = [];

                //treeListLoad(data, listQuery.schemas, function (arrRow) {
                //    var jsnData;
                //
                //    if (arrRow[1] !== 'pg_catalog' && arrRow[1] !== 'information_schema') {
                //        jsnData = {'name': arrRow[1], 'truename': arrRow[1], 'oid': arrRow[0], 'type': 'folder', 'action': treeLoadSchema};
                //        treeGlobals.shownItems.push(arrRow[1]);
                //        treeGlobals.shownObjects.push(jsnData);
                //
                //        return jsnData;
                //    }
                //});
            }
        }
    };
    //treeGlobals.schemaMarker = treeGlobals.schemaMarkerMaster;
    //treeGlobals.data.push(treeGlobals.schemaMarker);
    //
    //// open "Schemas"
    //treeGlobals.schemaMarker.action(treeGlobals.schemaMarker, 0);

    // prevent double/triple/quad clicks from expanding the selection
    //      double click one of these words to see the effect I am disabling
    //      one of these selects the whole ace, which makes it so that I
    //      don't know which line was clicked
    treeGlobals.ace.on('dblclick',    function (e) { e.stop() });
    treeGlobals.ace.on('tripleclick', function (e) { e.stop() });
    treeGlobals.ace.on('quadclick',   function (e) { e.stop() });

    //treeGlobals.ace.on('all',   function (e) { console.log('test'); });
    //treeGlobals.ace.on('startSelect', function (e) { console.log('1***'); });
    //treeGlobals.ace.on('startDrag',   function (e) { console.log('2***'); });
    //treeGlobals.ace.on('selectstart', function (e) { console.log('3***'); });
    //treeGlobals.ace.on('dragstart',   function (e) { console.log('4***'); });
    //treeGlobals.ace.on('cursorEnter',   function (e) { console.log('4***'); });
    //treeGlobals.ace.onDragStart = function () { console.log('5***'); };
    //treeGlobals.ace.cancelDrag = true;
    //treeGlobals.ace.onCursorChange = function () { console.log('6***'); };
    //treeGlobals.ace.onSelectionChange = function () { console.log('7***'); };


    // bind click
    treeGlobals.ace.addEventListener('click', function () {
        var intStartRow = treeGlobals.ace.getSelectionRange().start.row
          , intEndRow = treeGlobals.ace.getSelectionRange().end.row
          , intStartColumn = treeGlobals.ace.getSelectionRange().start.column
          , intEndColumn = treeGlobals.ace.getSelectionRange().end.column
          , rowData = treeGlobals.data[intStartRow]
          , arrType;

        // allow highlight color
        treeGlobals.ace.setHighlightActiveLine(true);

        // if we found a row
        if (intStartRow === intEndRow && intStartColumn === intEndColumn && rowData) {
            /*
            // if the current line has an action function
            if (rowData.action) {
                arrType = rowData.type.split(',');
            */
            treeHandleLineTrigger(intStartRow, intStartColumn);
        }
    });

    // on scroll: if we scroll past the last line:
    //      scroll to last line, this way we always have something on the screen
    treeGlobals.ace.session.addEventListener('changeScrollTop', function () {
        if (treeGlobals.ace.renderer.scrollTop === (treeGlobals.data.length * treeGlobals.ace.renderer.lineHeight)) {
            treeGlobals.ace.renderer.scrollToLine(treeGlobals.data.length);
        }
    });

    // if we're on a touch device: bind focus prevention
    if (evt.touchDevice) {
        treeGlobals.ace.keyListenerElement = xtag.query(treeGlobals.ace.container, '.ace_text-input')[0];
        treeGlobals.ace.keyListenerElement.addEventListener('focus', function (event) {
            event.preventDefault();
            //treeGlobals.ace.keyListenerElement.blur();
            // ^- removing this line doesn't appear to change the focus
            //       behavior but it may have been the cause of a crash
            //       in iPhone Safari version 9.0 similar to this:
            //          https://github.com/jquery/jquery-mobile/issues/7685
        });
        
    // else (not a touch device): bind key event
    } else {
        treeGlobals.ace.keyListenerElement = xtag.query(treeGlobals.ace.container, '.ace_text-input')[0];
        treeGlobals.ace.keyListenerElement.addEventListener('keydown', function (event) {
            var intRow, rowData;
            
            // 37 -> left arrow
            // 39 -> right arrow
            // 32 -> space
            // 13 -> return
            if (event.keyCode === 39 || event.keyCode === 32 || event.keyCode === 13) {
                intRow = treeGlobals.ace.getSelectionRange().start.row;
                rowData = treeGlobals.data[intRow];
                
                // if we found a row
                if (rowData) {
                    treeHandleLineTrigger(intRow);
                }
            }
        });
    }
}



// ##############################################################
// ############## TREE FOLDER OPEN/CLOSE FUNCTIONS ##############
// ##############################################################

function treeHandleLineTrigger(intRow, intColumn) {
    'use strict';
    var rowData = treeGlobals.data[intRow], arrType;
    
    // if we found a row
    if (rowData) {
        // if the current line has a reload function: run it
        if (rowData.reload) {
            rowData.reload(rowData, intRow);
        }
        
        // if the current line has an action function
        if (rowData.action) {
            arrType = rowData.type.split(',');
            
            if (arrType.indexOf('refresh') !== -1) {
                treeReloadLine(titleRefreshQuery[rowData.query].replace(/{{INTOID}}/gi, rowData.schemaOID), rowData, intRow);
            }
            
            // V---- the .action function deals with all of this now
            //// if the current line is a folder
            //if (arrType.indexOf('folder') !== -1) {
            //    // if the folder is closed
            //    if (rowData.open === false) {
            //        // run the action
            //        rowData.action(rowData, intRow, intColumn);
            //        
            //    // else (folder is already open)
            //    } else {
            //        rowData.action(rowData, intRow, intColumn);
            //        
            //    }
            //    
            //// else (the current line is not a folder): run the action
            //} else {
            rowData.action(rowData, intRow, intColumn);
            //}
        }
        
        // set the selected line in the ace to the row that was clicked
        treeGlobals.ace.selection.setSelectionRange(new Range(intRow, 0, intRow, 0));
    }
}


// load a list of objects into the object list
// if something can change while a tree is loading: send the parent data instead of the parent line so that the line will be dynamically calculated.
function treeListLoad(parent, strQuery, functionData) {
    'use strict';

    getListData(strQuery, document.getElementById('left-panel-body'), function (arrList) {
        var intParentLine;
        
        if (typeof parent === 'number') {
            intParentLine = parent;
        } else {
            intParentLine = treeGlobals.data.indexOf(parent);
        }
        
        var intLevel = (treeGlobals.data[intParentLine].level + 1)
          , strPadding = treePaddingForLevel(intLevel)
          , arrNewData = []
          , i, len, strText, strLineText, jsnData;
        
        // append every line from before the first inserted line to the new tree data array
        for (i = 0, len = (intParentLine + 1); i < len; i += 1) {
            arrNewData.push(treeGlobals.data[i]);
        }
        
        // build up treeData and strText
        for (i = 1, len = arrList.length, strText = ''; i < len; i += 1) {
            jsnData = functionData(arrList[i]);
            
            if (jsnData) {
                // build line text
                strLineText = strPadding;
                
                if (jsnData.bullet) {
                    strLineText += jsnData.bullet + ' ';
                } else {
                    if (jsnData.type.indexOf('folder') !== -1) {
                        strLineText += treeGlobals.folderPlus + ' ';
                    } else if (jsnData.type.indexOf('script') !== -1) {
                        strLineText += treeGlobals.scriptMarker + ' ';
                    }
                    //else if (jsnData.type.indexOf('note') !== -1) {
                    //} else if (jsnData.type.indexOf('button') !== -1) { }
                }
                
                //console.log(jsnData);
                
                if (jsnData.separate_bullet) {
                    //console.log(strLineText, jsnData);
                    strLineText += jsnData.separate_bullet + ' ';
                }
                
                strLineText += jsnData.name;
                
                // append line to ace text
                strText += strLineText;
                strText += '\n';
                
                // set level, open and real_text
                jsnData.level = intLevel;
                jsnData.open = false;
                jsnData.real_text = strLineText;
                
                // we no longer do .splice because it's super slow
                //treeGlobals.data.splice(intParentLine + insertNumber, 0, jsnData);
                
                // append new line to new tree data array
                arrNewData.push(jsnData);
            }
        }
        
        // append every line from after the last inserted line
        for (i = (intParentLine + 1), len = treeGlobals.data.length; i < len; i += 1) {
            arrNewData.push(treeGlobals.data[i]);
        }
        
        // set tree data with new data array
        treeGlobals.data = arrNewData;
        
        // append text to ace
        treeGlobals.aceSession.insert({
            'row': intParentLine + 1,
            'column': 0
        }, strText);
        
        // select parent line
        treeGlobals.ace.selection.setSelectionRange(new Range(intParentLine, 0, intParentLine, 0));
    });
}

// close a folder in the object browser
function treeListClose(intRow) {
    'use strict';
    var treeData          = treeGlobals.data
      , intTargetLevel    = treeData[intRow].level
      , intDeleteStartRow = (intRow + 1)
      , intDeleteEndRow   = intDeleteStartRow
      , i, len, arrNewData;
    
    // loop from start until the level is less than or equal to the closing folder's level
    for (i = intDeleteStartRow, len = treeData.length; i < len; i += 1) {
        if (treeData[i].level <= intTargetLevel || treeData[i].name === 'WHitErOw') {
            intDeleteEndRow = i;
            break;
        } else if (i === (len - 1)) {
            intDeleteEndRow = i + 1;
        }
    }
    
    // build new tree data array (using .splice to remove array elements was super slow)
    arrNewData = [];
    
    // append every line that was before the first removed row
    for (i = 0, len = intDeleteStartRow; i < len; i += 1) {
        arrNewData.push(treeData[i]);
    }
    // append every line that was after the last removed row
    for (i = intDeleteEndRow, len = treeData.length; i < len; i += 1) {
        arrNewData.push(treeData[i]);
    }
    
    treeGlobals.data = arrNewData;
    
    // set selection to encapsulate delete rows
    treeGlobals.ace.selection.setSelectionRange(new Range(intDeleteStartRow, 0, intDeleteEndRow, 0));
    
    // insert empty string to remove selected rows
    treeGlobals.ace.insert('');
}


// #############################################################
// #################### TREE MISC FUNCTIONS ####################
// #############################################################

// this just logs the tree data so that it can easily be compared to the ace
function treeDataLog() {
    'use strict';
    var i, len;
    
    console.log('************************************************************');
    for (i = 0, len = treeGlobals.data.length; i < len; i += 1) {
        console.log(treeGlobals.data[i].name, treeGlobals.data[i]);
    }
    console.log('************************************************************');
}

// this function returns the padding text depending on the level
function treePaddingForLevel(intLevel) {
    var i, len, strRet = '';
    
    for (i = 0, len = (intLevel); i < len; i += 1) {
        strRet += treeGlobals.padString;
    }
    
    return strRet;
}

// this inserts a single line into the tree
function treeInsertSingleLine(index, intLevel, jsnRow) {
    'use strict';
    var strLineText = treePaddingForLevel(intLevel);
    
    if (jsnRow.type.indexOf('folder') !== -1) {
        strLineText += treeGlobals.folderPlus + ' ';
    } else if (jsnRow.type.indexOf('script') !== -1) {
        strLineText += treeGlobals.scriptMarker + ' ';
    } else if (jsnRow.type.indexOf('note') !== -1) {
    } else if (jsnRow.type.indexOf('button') !== -1) { }
    
    strLineText += jsnRow.name;
    
    // set level, open and real_text
    jsnRow.level = intLevel;
    jsnRow.open = false;
    jsnRow.real_text = strLineText;
    
    // insert to tree data
    treeGlobals.data.splice(index, 0, jsnRow);
    
    // insert to ace
    treeGlobals.aceSession.insert({'row': index, 'column': 0}, strLineText + '\n');
}

// replace the text of one line in the object browser ace
function treeReplaceLine(intRow, strNewText) {
    'use strict';
    treeGlobals.ace.selection.setSelectionRange(new Range(intRow, 0, intRow + 1, 0));
    treeGlobals.ace.insert(strNewText + '\n');
}

// remove one line from the object browser ace
function treeRemoveLine(intRow) {
    'use strict';
    treeGlobals.ace.selection.setSelectionRange(new Range(intRow, 0, intRow + 1, 0));
    treeGlobals.ace.insert('');
}

// this function replaces tokens in the sql queries
function treePrepareQuery(strQuery, oid, strName, sqlSafeName) {
    'use strict';
    return strQuery
                .replace(/{{INTOID}}/gi, oid)
                .replace(/{{STRNAME}}/gi, strName)
                .replace(/{{STRSQLSAFENAME}}/gi, sqlSafeName);
}

//// this function adds or removes blank lines to/from the tree
//function treeRefreshWhitespace() {
//    'use strict';
//    var intLineHeight = GS.getTextHeight(treeGlobals.ace.container, true) //treeGlobals.ace.renderer.$textLayer.getLineHeight()
//      , intAceHeight = treeGlobals.ace.container.offsetHeight             // ^-- this would be zero if the panel was closed when the page loaded
//      , intNumber = Math.floor(intAceHeight / intLineHeight) - 2          //         which would cause an infinity, which would crash the page
//      , intLineToInsertAt = treeGlobals.data.length
//      , intLineDifference = (intNumber - treeGlobals.whiteRows)
//      , intAceWidth = treeGlobals.ace.container.offsetWidth
//      , i, strText, arrLines;
//    
//    //console.log('intLineHeight:     ' + intLineHeight + '\n' +
//    //            'intAceHeight:      ' + intAceHeight + '\n' +
//    //            'intNumber:         ' + intNumber + '\n' +
//    //            'intLineToInsertAt: ' + intLineToInsertAt + '\n' +
//    //            'intLineDifference: ' + intLineDifference + '\n' +
//    //            'intAceWidth:       ' + intAceWidth);
//    
//    if (intAceWidth > 0 && !isNaN(intLineDifference) && Math.abs(intLineDifference) < 1000) {
//        if (intLineDifference > 0) {
//            for (i = 0, strText = ''; i < intLineDifference; i += 1) {
//                strText += '\n';
//                treeGlobals.whiteRows += 1;
//                treeGlobals.data.push({'name': 'WHitErOw', 'real_text': ''});
//            }
//            treeGlobals.aceSession.insert({'row': intLineToInsertAt, 'column': 0}, strText);
//            
//        } else if (intLineDifference < 0) {
//            intLineDifference = -intLineDifference;
//            for (i = 0, strText = ''; i < intLineDifference; i += 1) {
//                treeGlobals.whiteRows -= 1;
//                treeRemoveLine(treeGlobals.data.length - 1);
//                treeGlobals.data.splice(treeGlobals.data.length - 1, 1);
//            }
//        }
//    }
//}


// ##############################################################
// ####################### TREE SHOW/HIDE #######################
// ##############################################################

(function () {
    'use strict';
    var strShownCache, strSchemasCache, strSchemaAllCache;
    
    window.qsLoadShowHide = function (strQueryString) {
        var loadMore = function (schemaData) {
                var strShown = GS.qryGetVal(strQueryString, 'show')
                  , strSchemas = GS.qryGetVal(strQueryString, 'schemas')
                  , strSchemaAll = GS.qryGetVal(strQueryString, 'schemas-all') || 'true'
                  , arrSchema, pgCatalogOID, arrDatabaseSchema
                  , arrShown = (strShown === '' ? [] : strShown.split(','))
                  , arrHidden = []
                  , arrAll = [
                        'G' // Group Roles
                      , 'U' // Login Roles
                      , 'C' // Casts
                      , 'D' // Database Script
                      , 'E' // Extensions
                      , 'F' // Foreign Data Wrappers
                      , 'I' // Information Schema
                      , 'L' // Languages
                      , 'P' // PG Catalog Schema
                      , 'S' // Servers
                      , 'T' // Tablespaces
                    ]
                  , arrNames = [
                        'Group Roles'            // G
                      , 'Login Roles'            // U
                      , 'Casts'                  // C
                      , 'Database Script'        // D
                      , 'Extensions'             // E
                      , 'Foreign Data Wrappers'  // F
                      , 'Information Schema'     // I
                      , 'Languages'              // L
                      , 'PG Catalog Schema'      // P
                      , 'Servers'                // S
                      , 'Tablespaces'            // T
                    ];
                
                var arrAnswerParts, strOid, strName, divElement, arrElements, i, len
                  , strHTML, objectElement, objectIndex, objectListContainer, jsnRow
                  , sortShowItems, sortShowObjects, insertOffset, intMarker, strSection
                  , arrMoreObjects, arrRoleObjects, arrSchemaObjects
                  , arrNewMoreObjects, arrNewRoleObjects, arrNewSchemaObjects
                  , referenceObject, intIndex;
                
                //if (strShown !== strShownCache || strSchemas !== strSchemasCache || strSchemaAll !== strSchemaAllCache) {
                strShownCache = strShown;
                strSchemasCache = strSchemas;
                strSchemaAllCache = strSchemaAll;
                
                // create sort functions
                sortShowItems = function (a, b) {
                    a = a.toLowerCase();
                    b = b.toLowerCase();
                    if (a < b) return -1;
                    if (a > b) return 1;
                    return 0;
                };
                sortShowObjects = function (a, b) {
                    var a_level = a.level;
                    var b_level = b.level;
                    if (a_level < b_level) return -1;
                    if (a_level > b_level) return 1;
                    
                    a = a.name.toLowerCase();
                    b = b.name.toLowerCase();
                    if (a < b) return -1;
                    if (a > b) return 1;
                    return 0;
                };
                
                // fill "hidden" array
                for (i = 0, len = arrAll.length; i < len; i += 1) {
                    if (arrShown.indexOf(arrAll[i]) === -1) {
                        arrHidden.push(arrAll[i]);
                    }
                }
                
                // get schemas into arrShown
                arrSchema = strSchemas.split(',');
                arrDatabaseSchema = [];
                for (i = 0, len = schemaData.length; i < len; i += 1) {
                    if (schemaData[i][0] === 'pg_catalog') {
                        pgCatalogOID = schemaData[i][1];
                        
                    } else if (arrSchema.indexOf(schemaData[i][0]) !== -1 || strSchemaAll === 'true') {
                        arrShown.push(schemaData[i]);
                    } else {
                        arrHidden.push(schemaData[i]);
                    }
                    
                    arrDatabaseSchema.push(schemaData[i][0]);
                }
                
                // remove newly unchecked items
                for (i = 0, len = arrHidden.length; i < len; i += 1) {
                    strName = arrNames[arrAll.indexOf(arrHidden[i])] || arrHidden[i][0];
                    objectIndex = treeGlobals.shownItems.indexOf(strName);
                    
                    // if this object was checked before
                    if (objectIndex > -1) {
                        objectElement = treeGlobals.shownObjects[objectIndex];
                        
                        treeGlobals.shownItems.splice(objectIndex, 1);
                        treeGlobals.shownObjects.splice(objectIndex, 1);
                        
                        objectIndex = treeGlobals.data.indexOf(objectElement);
                        
                        if (objectElement && objectIndex >= 0) {
                            treeListClose(objectIndex);
                            treeGlobals.data.splice(objectIndex, 1);
                            treeRemoveLine(objectIndex);
                        }
                    }
                }
                
                // remove dropped schemas
                for (i = 0, len = treeGlobals.data.length; i < len; i += 1) {
                    if (treeGlobals.data[i].level === 0) {
                        strSection = treeGlobals.data[i].name;
                        
                    } else if (treeGlobals.data[i].level === 1
                            && treeGlobals.data[i].real_text
                            && strSection === 'Schemas') {
                        if (arrDatabaseSchema.indexOf(treeGlobals.data[i].name) === -1) {
                            if (treeGlobals.shownItems.indexOf(treeGlobals.data[i].name) !== -1) {
                                treeGlobals.shownItems.splice(treeGlobals.shownItems.indexOf(treeGlobals.data[i].name), 1);
                            }
                            
                            treeListClose(i);
                            treeGlobals.data.splice(i, 1);
                            treeRemoveLine(i);
                            
                            i -= 1;
                            len -= 1;
                        }
                    }
                }
                
                // gather the children of each of the top-level sections into arrays
                arrRoleObjects = [];
                arrMoreObjects = [];
                arrSchemaObjects = [];
                
                for (i = 0, len = treeGlobals.data.length; i < len; i += 1) {
                    if (treeGlobals.data[i].level === 0) {
                        strSection = treeGlobals.data[i].name;
                    } else if (treeGlobals.data[i].real_text) {
                        if (strSection === 'Roles') {
                            arrRoleObjects.push(treeGlobals.data[i]);
                        } else if (strSection === 'More') {
                            arrMoreObjects.push(treeGlobals.data[i]);
                        } else if (strSection === 'Schemas') {
                            arrSchemaObjects.push(treeGlobals.data[i]);
                        }
                    }
                }
                
                // insert any new children into the arrays
                arrNewMoreObjects = [];
                arrNewRoleObjects = [];
                arrNewSchemaObjects = [];
                
                for (i = 0, len = arrShown.length; i < len; i += 1) {
                    jsnRow = {
                        'type': 'folder',
                        'name': arrNames[arrAll.indexOf(arrShown[i])],
                        'action': treeLoad,
                        'level': 1
                    };
                    strSection = 'More';
                    
                    if (arrShown[i] === 'P') {
                        //jsnRow.action = treeLoadSchema;
                        jsnRow.query = 'objectSchema';
                        jsnRow.type = 'folder,script';
                        jsnRow.truename = 'pg_catalog';
                        jsnRow.oid = pgCatalogOID;
                        
                    } else if (arrShown[i] === 'U') {
                        jsnRow.query = 'objectLogin';
                        strSection = 'Roles';
                        
                    } else if (arrShown[i] === 'G') {
                        jsnRow.query = 'objectGroup';
                        strSection = 'Roles';
                        
                    } else if (arrShown[i] === 'D') {
                        jsnRow.type = 'script';
                        jsnRow.query = 'objectDatabase';
                        
                    } else if (arrShown[i] === 'I') {
                        jsnRow.query = 'informationSchemaView';
                        
                    } else if (arrShown[i] === 'E') {
                        jsnRow.query = 'objectExtension';
                        
                    } else if (arrShown[i] === 'L') {
                        jsnRow.query = 'objectLanguage';
                        
                    } else if (arrShown[i] === 'C') {
                        jsnRow.query = 'objectCast';
                        
                    } else if (arrShown[i] === 'S') {
                        jsnRow.query = 'objectForeignServer';
                        
                    } else if (arrShown[i] === 'T') {
                        jsnRow.query = 'objectTablespace';
                        
                    } else if (arrShown[i] === 'F') {
                        jsnRow.query = 'objectForeignDataWrapper';
                        
                    } else {
                        //jsnRow.action = treeLoadSchema;
                        jsnRow.query = 'objectSchema';
                        jsnRow.type = 'folder,script';
                        jsnRow.name = arrShown[i][0];
                        jsnRow.oid = arrShown[i][1];
                        strSection = 'Schemas';
                    }
                    
                    // if this object was not checked before
                    if (treeGlobals.shownItems.indexOf(jsnRow.name) === -1) {
                        // update shown lists
                        treeGlobals.shownItems.push(jsnRow.name);
                        treeGlobals.shownObjects.push(jsnRow);
                        
                        // insert into arrays
                        jsnRow.inserted = false;
                        if (strSection === 'Roles') {
                            arrNewRoleObjects.push(jsnRow);
                        } else if (strSection === 'More') {
                            arrNewMoreObjects.push(jsnRow);
                        } else if (strSection === 'Schemas') {
                            arrNewSchemaObjects.push(jsnRow);
                        }
                    }
                }
                
                // add or remove any necessary markers
                
                // roles marker
                if (!treeGlobals.rolesMarker && arrNewRoleObjects.length > 0) {
                    treeGlobals.rolesMarker = treeGlobals.rolesMarkerMaster;
                    treeInsertSingleLine(0, 0, treeGlobals.rolesMarker);
                    
                } else if (treeGlobals.rolesMarker && arrNewRoleObjects.length === 0 && arrRoleObjects.length === 0) {
                    treeRemoveLine(treeGlobals.data.indexOf(treeGlobals.rolesMarker));
                    treeGlobals.data.splice(treeGlobals.data.indexOf(treeGlobals.rolesMarker), 1);
                    treeGlobals.rolesMarker = null;
                }
                
                // more marker
                if (!treeGlobals.moreMarker && arrNewMoreObjects.length > 0) {
                    treeGlobals.moreMarker = treeGlobals.moreMarkerMaster;
                    
                    if (arrRoleObjects.length > 0) {
                        intIndex = treeGlobals.data.indexOf(arrRoleObjects[arrRoleObjects.length - 1]) + 1;
                    } else if (treeGlobals.rolesMarker) {
                        intIndex = treeGlobals.data.indexOf(treeGlobals.rolesMarker) + 1;
                    } else {
                        intIndex = 0;
                    }
                    
                    treeInsertSingleLine(intIndex, 0, treeGlobals.moreMarker);
                    
                } else if (treeGlobals.moreMarker && arrNewMoreObjects.length === 0 && arrMoreObjects.length === 0) {
                    treeRemoveLine(treeGlobals.data.indexOf(treeGlobals.moreMarker));
                    treeGlobals.data.splice(treeGlobals.data.indexOf(treeGlobals.moreMarker), 1);
                    treeGlobals.moreMarker = null;
                }
                
                // schema marker
                if (!treeGlobals.schemaMarker && arrNewSchemaObjects.length > 0) {
                    treeGlobals.schemaMarker = treeGlobals.schemaMarkerMaster;
                    
                    if (arrMoreObjects.length > 0) {
                        intIndex = treeGlobals.data.indexOf(arrMoreObjects[arrMoreObjects.length - 1]) + 1;
                    } else if (treeGlobals.moreMarker) {
                        intIndex = treeGlobals.data.indexOf(treeGlobals.moreMarker) + 1;
                        
                    } else if (arrRoleObjects.length > 0) {
                        intIndex = treeGlobals.data.indexOf(arrRoleObjects[arrRoleObjects.length - 1]) + 1;
                    } else if (treeGlobals.rolesMarker) {
                        intIndex = treeGlobals.data.indexOf(treeGlobals.rolesMarker) + 1;
                        
                    } else {
                        intIndex = 0;
                    }
                    
                    treeInsertSingleLine(intIndex, 0, treeGlobals.schemaMarker);
                    
                } else if (treeGlobals.schemaMarker && arrNewSchemaObjects.length === 0 && arrSchemaObjects.length === 0) {
                    treeRemoveLine(treeGlobals.data.indexOf(treeGlobals.schemaMarker));
                    treeGlobals.data.splice(treeGlobals.data.indexOf(treeGlobals.schemaMarker), 1);
                    treeGlobals.schemaMarker = null;
                }
                
                // concatinate arrays
                arrRoleObjects = arrRoleObjects.concat(arrNewRoleObjects);
                arrMoreObjects = arrMoreObjects.concat(arrNewMoreObjects);
                arrSchemaObjects = arrSchemaObjects.concat(arrNewSchemaObjects);
                
                // sort the arrays
                arrRoleObjects.sort(sortShowObjects);
                arrMoreObjects.sort(sortShowObjects);
                arrSchemaObjects.sort(sortShowObjects);
                
                // insert the new objects into the tree data (and the ace)
                var skip_i, skip_len, bolSkip, prevFolder;
                
                // get level of first-children of markers
                var intSearchLevel = treeGlobals.padString.length;
                
                intIndex = treeGlobals.data.indexOf(treeGlobals.rolesMarker) + 1;
                for (i = 0, len = arrRoleObjects.length; i < len; i += 1) {
                    if (arrRoleObjects[i].inserted === false) {
                        // if the previous folder is open: skip past contents
                        if (arrRoleObjects[prevFolder] && arrRoleObjects[prevFolder].open === true) {
                            // find out if there is a folder already in the list
                            for (skip_i = i + 1, skip_len = len, bolSkip = false; skip_i < skip_len; skip_i += 1) {
                                if (arrRoleObjects[skip_i] &&
                                    arrRoleObjects[skip_i].level === intSearchLevel &&
                                    arrRoleObjects[skip_i].inserted !== false) {
                                    bolSkip = true;
                                    intIndex = treeGlobals.data.indexOf(arrRoleObjects[skip_i]);
                                    break;
                                }
                            }
                            
                            // if no folder is in the list and below the current folder: skip to the end
                            if (bolSkip !== true) {
                                if (treeGlobals.data.indexOf(treeGlobals.schemaMarker) !== -1) {
                                    intIndex = treeGlobals.data.indexOf(treeGlobals.schemaMarker);
                                } else if (treeGlobals.data.indexOf(treeGlobals.moreMarker) !== -1) {
                                    intIndex = treeGlobals.data.indexOf(treeGlobals.moreMarker);
                                } else {
                                    intIndex = treeGlobals.data.length;
                                }
                            }
                        }
                        
                        treeInsertSingleLine(intIndex, 1, arrRoleObjects[i]);
                        arrRoleObjects[i].inserted = null;
                        intIndex += 1;
                    } else {
                        if (arrRoleObjects[i].open === true) {
                            prevFolder = i;
                        }
                        intIndex = treeGlobals.data.indexOf(arrRoleObjects[i]) + 1;
                    }
                }
                
                intIndex = treeGlobals.data.indexOf(treeGlobals.moreMarker) + 1;
                for (i = 0, len = arrMoreObjects.length; i < len; i += 1) {
                    if (arrMoreObjects[i].inserted === false) {
                        
                        // if the previous folder is open: skip past contents
                        if (arrMoreObjects[prevFolder] && arrMoreObjects[prevFolder].open === true) {
                            // find out if there is a folder already in the list
                            for (skip_i = i + 1, skip_len = len, bolSkip = false; skip_i < skip_len; skip_i += 1) {
                                if (arrMoreObjects[skip_i] &&
                                    arrMoreObjects[skip_i].level === intSearchLevel &&
                                    arrMoreObjects[skip_i].inserted !== false) {
                                    bolSkip = true;
                                    intIndex = treeGlobals.data.indexOf(arrMoreObjects[skip_i]);
                                    break;
                                }
                            }
                            
                            // if no folder is in the list and below the current folder: skip to the end
                            if (bolSkip !== true) {
                                if (treeGlobals.data.indexOf(treeGlobals.schemaMarker) !== -1) {
                                    intIndex = treeGlobals.data.indexOf(treeGlobals.schemaMarker);
                                } else {
                                    intIndex = treeGlobals.data.length;
                                }
                            }
                        }
                        
                        treeInsertSingleLine(intIndex, 1, arrMoreObjects[i]);
                        arrMoreObjects[i].inserted = null;
                        intIndex += 1;
                    } else {
                        if (arrMoreObjects[i].open === true) {
                            prevFolder = i;
                        }
                        intIndex = treeGlobals.data.indexOf(arrMoreObjects[i]) + 1;
                    }
                }
                
                intIndex = treeGlobals.data.indexOf(treeGlobals.schemaMarker) + 1;
                for (i = 0, len = arrSchemaObjects.length; i < len; i += 1) {
                    if (arrSchemaObjects[i].inserted === false) {
                        
                        // if the previous folder is open: skip past contents
                        if (arrSchemaObjects[prevFolder] && arrSchemaObjects[prevFolder].open === true) {
                            // find out if there is a folder already in the list
                            for (skip_i = i + 1, skip_len = len, bolSkip = false; skip_i < skip_len; skip_i += 1) {
                                if (arrSchemaObjects[skip_i] &&
                                    arrSchemaObjects[skip_i].level === intSearchLevel &&
                                    arrSchemaObjects[skip_i].inserted !== false) {
                                    bolSkip = true;
                                    intIndex = treeGlobals.data.indexOf(arrSchemaObjects[skip_i]);
                                    break;
                                }
                            }
                            
                            // if no folder is in the list and below the current folder: skip to the end
                            if (bolSkip !== true) {
                                intIndex = treeGlobals.data.length;
                            }
                        }
                        
                        // insert line
                        treeInsertSingleLine(intIndex, 1, arrSchemaObjects[i]);
                        arrSchemaObjects[i].inserted = null;
                        intIndex += 1;
                    } else {
                        if (arrSchemaObjects[i].open === true) {
                            prevFolder = i;
                        }
                        intIndex = treeGlobals.data.indexOf(arrSchemaObjects[i]) + 1;
                    }
                }
                //}
            };
        
        // we'll need schemas and oids
        getListData(' SELECT nspname, oid'
                    + ' FROM pg_namespace'
                   + ' WHERE nspname NOT ILIKE \'pg_toast%\''
                     + ' AND nspname NOT ILIKE \'pg_temp%\''
                     + ' AND nspname <> \'information_schema\''
                + ' ORDER BY nspname ASC', 'asdf', function (data) {
            //console.log(data);
            data.splice(0, 1);
            loadMore(data);
        });
    };
})();

function dialogAddSchema(target) {
    'use strict';
    var templateElement = document.createElement('template'), afterOpen, beforeClose;
    
    templateElement.innerHTML = ml(function () {/*
        <gs-page>
            <gs-body id="showhide-loader-container" style="min-height: 8em;" padded>
                <div id="showhide-list-container"></div>
            </gs-body>
            <gs-footer><gs-button dialogclose>Done</gs-button></gs-footer>
        </gs-page>
    */});
    
    afterOpen = function () {
        getListData(listQuery.schemas, document.getElementById('showhide-loader-container'), function (arrList) {
            var i, len, strHTML, htmlFunction, strMoreHTML, bolAllSchemasVisible;
            
            htmlFunction = function (strClass, strAttributes, buttonContent, value) {
                return '<gs-checkbox class="text-left checkbox-list ' + strClass + '" ' + strAttributes + ' ' +
                                    'data-name="' + encodeHTML(buttonContent) + '" value="' + (value || 'false') + '">' +
                            '&nbsp;' + encodeHTML(buttonContent) +
                        '</gs-checkbox>';
            };
            
            strHTML = '';
            strMoreHTML = '';
            
            strMoreHTML += '<center><h5>Roles</h5></center>';
            strMoreHTML += '<div class="div-checkbox-section">';
            strMoreHTML += '<gs-checkbox class="text-left select-all-none" style="margin-bottom: 0.25em;" ' +
                                'value="' + (
                                        (treeGlobals.shownItems.indexOf('Login Roles') > -1) &&
                                        (treeGlobals.shownItems.indexOf('Group Roles') > -1)
                                    ) + '">' +
                                '&nbsp;Select All/None</gs-checkbox>';
            strMoreHTML += htmlFunction('checkbox-groups', '', 'Group Roles', (treeGlobals.shownItems.indexOf('Group Roles') > -1));
            strMoreHTML += htmlFunction('checkbox-users',  '', 'Login Roles', (treeGlobals.shownItems.indexOf('Login Roles') > -1));
            strMoreHTML += '</div>';
            
            strMoreHTML += '<center><h5>More</h5></center>';
            strMoreHTML += '<div class="div-checkbox-section">';
            strMoreHTML += '<gs-checkbox class="text-left select-all-none" style="margin-bottom: 0.25em;" ' +
                                'value="' + (
                                        (treeGlobals.shownItems.indexOf('Database Script') > -1) &&
                                        (treeGlobals.shownItems.indexOf('Information Schema') > -1) &&
                                        (treeGlobals.shownItems.indexOf('Extensions') > -1) &&
                                        (treeGlobals.shownItems.indexOf('Languages') > -1) &&
                                        (treeGlobals.shownItems.indexOf('Casts') > -1) &&
                                        (treeGlobals.shownItems.indexOf('Servers') > -1) &&
                                        (treeGlobals.shownItems.indexOf('Tablespaces') > -1) &&
                                        (treeGlobals.shownItems.indexOf('Foreign Data Wrappers') > -1)
                                    ) + '">' +
                                '&nbsp;Select All/None</gs-checkbox>';
                                
            strMoreHTML += htmlFunction('checkbox-casts', '', 'Casts', (treeGlobals.shownItems.indexOf('Casts') > -1));
            strMoreHTML += htmlFunction('checkbox-database', '', 'Database Script', (treeGlobals.shownItems.indexOf('Database Script') > -1));
            strMoreHTML += htmlFunction('checkbox-extensions', '', 'Extensions', (treeGlobals.shownItems.indexOf('Extensions') > -1));
            strMoreHTML += htmlFunction('checkbox-fdw', '', 'Foreign Data Wrappers', (treeGlobals.shownItems.indexOf('Foreign Data Wrappers') > -1));
            strMoreHTML += htmlFunction('checkbox-info-schema', '', 'Information Schema', (treeGlobals.shownItems.indexOf('Information Schema') > -1));
            strMoreHTML += htmlFunction('checkbox-languages', '', 'Languages', (treeGlobals.shownItems.indexOf('Languages') > -1));
            
            bolAllSchemasVisible = true;
            for (i = 1, len = arrList.length; i < len; i += 1) {
                if (arrList[i][1] === 'pg_catalog') {
                    strMoreHTML += htmlFunction('checkbox-pg-schema',
                                                'data-oid="' + arrList[i][0] + '"',
                                                'PG Catalog Schema',
                                                (treeGlobals.shownItems.indexOf('PG Catalog Schema') > -1));
                } else {
                    strHTML += htmlFunction('checkbox-schema',
                                            'data-oid="' + arrList[i][0] + '" ',
                                            arrList[i][1],
                                            (treeGlobals.shownItems.indexOf(arrList[i][1]) > -1));
                    
                    if (bolAllSchemasVisible === true && (treeGlobals.shownItems.indexOf(arrList[i][1]) === -1)) {
                        bolAllSchemasVisible = false;
                    }
                }
            }
            
            strMoreHTML += htmlFunction('checkbox-servers',     '', 'Servers', (treeGlobals.shownItems.indexOf('Servers') > -1));
            strMoreHTML += htmlFunction('checkbox-tablespaces', '', 'Tablespaces', (treeGlobals.shownItems.indexOf('Tablespaces') > -1));
            strMoreHTML += '</div>';
            
            strHTML = strMoreHTML +
                        '<center><h5>Schemas</h5></center>' +
                        '<div id="showhide-schema-section" class="div-checkbox-section">' +
                            '<gs-checkbox class="text-left select-all-none" style="margin-bottom: 0.25em;" ' +
                                    'value="' + bolAllSchemasVisible + '">' +
                                    '&nbsp;Select All/None</gs-checkbox>' +
                            strHTML +
                        '</div>';
            
            document.getElementById('showhide-list-container').innerHTML = strHTML;
            
            document.getElementById('showhide-list-container').addEventListener('change', function (event) {
                var arrElement, i, len;
                
                if (event.target.classList.contains('select-all-none')) {
                    arrElement = xtag.query(event.target.parentNode, '.checkbox-list');
                    
                    //console.log(arrElement);
                    for (i = 0, len = arrElement.length; i < len; i += 1) {
                        arrElement[i].value = event.target.value;
                    }
                }
            });
        });
    };
    
    beforeClose = function (event, strAnswer) {
        var allListContainer = document.getElementById('showhide-list-container')
          , schemaListContainer = document.getElementById('showhide-schema-section')
          , arrCheckbox, i, len, strSchema, strSchemaAll
          , arrSchema = []
          , arrShown = []
          , arrAll = [
                'G' // Group Roles
              , 'U' // Login Roles
              , 'C' // Casts
              , 'D' // Database Script
              , 'E' // Extensions
              , 'F' // Foreign Data Wrappers
              , 'I' // Information Schema
              , 'L' // Languages
              , 'P' // PG Catalog Schema
              , 'S' // Servers
              , 'T' // Tablespaces
            ];
        
        if (strAnswer !== 'Cancel') {
            // handle "roles"
            if (xtag.query(allListContainer, '.checkbox-groups')[0].value === 'true') { arrShown.push('G'); }
            if (xtag.query(allListContainer, '.checkbox-users')[0].value === 'true') { arrShown.push('U'); }
            
            // handle "more"
            if (xtag.query(allListContainer, '.checkbox-casts')[0].value === 'true') { arrShown.push('C'); }
            if (xtag.query(allListContainer, '.checkbox-database')[0].value === 'true') { arrShown.push('D'); }
            if (xtag.query(allListContainer, '.checkbox-extensions')[0].value === 'true') { arrShown.push('E'); }
            if (xtag.query(allListContainer, '.checkbox-fdw')[0].value === 'true') { arrShown.push('F'); }
            if (xtag.query(allListContainer, '.checkbox-info-schema')[0].value === 'true') { arrShown.push('I'); }
            if (xtag.query(allListContainer, '.checkbox-languages')[0].value === 'true') { arrShown.push('L'); }
            if (xtag.query(allListContainer, '.checkbox-pg-schema')[0].value === 'true') { arrShown.push('P'); }
            if (xtag.query(allListContainer, '.checkbox-servers')[0].value === 'true') { arrShown.push('S'); }
            if (xtag.query(allListContainer, '.checkbox-tablespaces')[0].value === 'true') { arrShown.push('T'); }
            
            // handle "schemas"
            arrCheckbox = xtag.query(schemaListContainer, '.checkbox-schema');
            
            for (i = 0, len = arrCheckbox.length; i < len; i += 1) {
                if (arrCheckbox[i].value === 'true') {
                    arrSchema.push(arrCheckbox[i].getAttribute('data-name'));
                }
            }
            
            if (arrCheckbox.length === arrSchema.length) {
                strSchemaAll = 'true';
            } else {
                strSchemaAll = 'false';
                strSchema = arrSchema.join(',');
            }
            
            // save to querystring
            GS.pushQueryString('schemas=' + (strSchema || '') +
                              '&schemas-all=' + strSchemaAll +
                              '&show=' + arrShown.join(','));
        }
    };
    
    // if we are not on a touch device: dialog attached to the "Object Lists/Scripts" button
    if (!evt.touchDevice) {
        templateElement.setAttribute('data-max-width', '210px');
        templateElement.setAttribute('data-overlay-close', 'true');
        GS.openDialogToElement(target, templateElement, 'down', afterOpen, beforeClose);
        
    // else: full screen dialog
    } else {
        templateElement.setAttribute('data-mode', 'full');
        GS.openDialog(templateElement, afterOpen, beforeClose);
    }
}


// ################################################################
// ############# TREE FOLDER NUMBER REFRESH FUNCTIONS #############
// ################################################################

function treeReloadLine(strQuery, jsnRow, intRow) {
    'use strict';
    getSingleCellData(strQuery, function (strNewCount) {
        jsnRow.name      = jsnRow.name     .replace(/\([0-9]*\)/gi, '(' + strNewCount + ')');
        jsnRow.real_text = jsnRow.real_text.replace(/\([0-9]*\)/gi, '(' + strNewCount + ')');
        
        treeReplaceLine(intRow, jsnRow.real_text);
        treeGlobals.ace.selection.setSelectionRange(new Range(intRow, 0, intRow, 0));
    });
}

// ###############################################################
// ############## TREE OBJECT FOLDER LOAD FUNCTIONS ##############
// ###############################################################

function treeGetLineFromData(data) {
    'use strict';
    var i, len, intLine, intLevel, strQuery
      , intCurrentLevel = data.level, strCurrentQuery = data.query;
    
    for (i = 0, len = treeStructure.length; i < len; i += 1) {
        intLevel = treeStructure[i][0];
        strQuery = treeStructure[i][2];
        
        if (intLevel === intCurrentLevel && strQuery === strCurrentQuery) {
            intLine = i;
            break;
        }
    }
    
    return intLine;
}

function treeGetLineChildren(index) {
    var i, len, arrChildren = [], intParentLevel = treeStructure[index][0];
    
    for (i = index + 1, len = treeStructure.length; i < len; i += 1) {
        if (treeStructure[i][0] <= intParentLevel) {
            break;
        } else if (treeStructure[i][0] === intParentLevel + 1) {
            arrChildren.push(treeStructure[i]);
        }
    }
    
    return arrChildren;
}

function treeLoad(data, index, intColumn) {
    'use strict';
    var arrType = data.type.split(','), intLine, arrLine, strName, strSqlSafeName, arrChildren;
    
    if (arrType.indexOf('folder') !== -1 &&
        (
            (
                arrType.indexOf('script') !== -1 && (
                    ////If object is not a schema folder or a table folder then continue
                    //(data.query !== 'objectSchema' && data.query !== 'objectTable') ||
                    //If its not a mouse event then continue
                    (!intColumn) ||
                    //If object is a schema folder, and the position of the click is before the arrow, then continue
                    data.real_text.search(/[^ ]/) + 2 >= intColumn
                )
            ) ||
            (arrType.indexOf('script') === -1)
        )) {
        if (data.open === false) {
            intLine = treeGetLineFromData(data);
            arrChildren = treeGetLineChildren(intLine);
            
            // mark as open
            data.open = true;
            
            // replace the folderplus with the folderminus
            data.real_text = data.real_text.replace(treeGlobals.folderPlus, treeGlobals.folderMinus);
            treeReplaceLine(treeGlobals.data.indexOf(data), data.real_text);
            
            // get name and SQL safe name
            if (data.name && data.schemaName) {
                strName = data.schemaName + '.' + data.name;
                strSqlSafeName = quote_ident(data.schemaName) + '.' + quote_ident(data.name);
            } else {
                strName = data.name;
                strSqlSafeName = quote_ident(data.name);
            }
            
            // if there's only one child: all of the loaded children are of that type
            if (arrChildren.length === 1) {
                arrLine = arrChildren[0];
                
                treeListLoad(index, treePrepareQuery(listQuery[data.query], data.oid, strName, strSqlSafeName), function (arrRow) {
                    var jsnRow = {'name': arrRow[1], 'oid': arrRow[0], 'type': arrLine[1], 'query': arrLine[2], 'action': treeLoad};
                    
                    if (jsnRow.name === 'Nothing In This Folder') {
                        jsnRow.action = undefined;
                        jsnRow.query = undefined;
                        jsnRow.type = '';
                    }
                    
                    if (arrRow[3]) {
                        jsnRow.bullet = arrRow[3];
                    }
                    if (arrRow[4]) {
                        jsnRow.separate_bullet = arrRow[4];
                    }
                    
                    if (data.query === 'objectSchema') {
                        jsnRow.schemaName = (data.truename || data.name);
                        jsnRow.schemaOID = (data.oid);
                    } else if (data.schemaName) {
                        jsnRow.schemaName = data.schemaName;
                        jsnRow.schemaOID = data.schemaOID;
                    }
                    
                    //console.log(jsnRow);
                    
                    return jsnRow;
                });
                
            // else: children must match up on queryname
            } else {
                treeListLoad(index, treePrepareQuery(listQuery[data.query], data.oid, strName, strSqlSafeName), function (arrRow) {
                    var i, len, jsnRow = {'name': arrRow[1], 'oid': arrRow[0], 'query': arrRow[2], 'action': treeLoad};
                    
                    for (i = 0, len = arrChildren.length; i < len; i += 1) {
                        if (arrChildren[i][2] === arrRow[2]) {
                            jsnRow.type = arrChildren[i][1];
                        }
                    }
                    
                    if (jsnRow.name === 'Nothing In This Folder') {
                        jsnRow.action = undefined;
                        jsnRow.query = undefined;
                        jsnRow.type = '';
                    }
                    
                    if (arrRow[3]) {
                        jsnRow.bullet = arrRow[3];
                    }
                    if (arrRow[4]) {
                        jsnRow.separate_bullet = arrRow[4];
                    }
                    
                    if (data.query === 'objectSchema') {
                        jsnRow.schemaName = (data.truename || data.name);
                        jsnRow.schemaOID = (data.oid);
                    } else if (data.schemaName) {
                        jsnRow.schemaName = data.schemaName;
                        jsnRow.schemaOID = data.schemaOID;
                    }
                    
                    //console.log(jsnRow);
                    
                    return jsnRow;
                });
            }
        } else {
            // mark as closed
            data.open = false;
            
            // replace the folderminus with the folderplus
            data.real_text = data.real_text.replace(treeGlobals.folderMinus, treeGlobals.folderPlus);
            treeReplaceLine(index, data.real_text);
            
            // close the folder
            treeListClose(index);
        }
    }
    
    if (data.bullet == 'CL' && data.name !== '' && data.name.indexOf(' ') !== -1) {
        data.name = data.name.substring(0, data.name.indexOf(' '));
    }
    console.log(data);
    if (arrType.indexOf('script') !== -1 &&
        (
            //If object is not a schema folder or a table folder then continue
            (data.query !== 'objectSchema' && data.query !== 'objectTable') ||
            //If its not a mouse event then continue
            (!intColumn) ||
            //If object is a schema folder, and the position of the click is before the arrow, then continue
            data.real_text.search(/[^ ]/) + 2 < intColumn
        )) {
        
        GS.pushQueryString('view=' + encodeURIComponent(data.query + ':' + data.oid + ':' + (data.schemaName || '') + ':' + (data.truename || data.name)));
        strPreviousScript = encodeURIComponent(
                                data.query + ':' +
                                data.oid + ':' +
                                (data.schemaName || '') + ':' +
                                (data.truename || data.name));
    }
    
    // MOVED TO "treeHandleLineTrigger" FUNCTION
    //if (arrType.indexOf('refresh') !== -1) {
    //    treeReloadLine(titleRefreshQuery[data.query].replace(/{{INTOID}}/gi, data.schemaOID), data, index);
    //}
}

// ########################################################################################################################
// ########################################################################################################################
// ########################################################################################################################
// ########################################################################################################################
// ########################################################################################################################
// ########################################################################################################################
// ########################################################################################################################
// ############################################ CODE TO BE CLEANED OR REPLACED ############################################
// ########################################################################################################################
// ########################################################################################################################
// ########################################################################################################################
// ########################################################################################################################
// ########################################################################################################################
// ########################################################################################################################
// ########################################################################################################################



function singleQuoteSafe(strValue) {
    'use strict';
    return strValue.replace(/\'/gim, '\\\'');
}

function dependButton(intOid) {
    'use strict';
    return '<gs-button icononly icon="link" no-focus title="Dependencies and dependents" onclick="dependDialog(' + intOid + ')"></gs-button>' +
            '<gs-button icononly icon="cubes" no-focus title="Dependencies and dependents, graph display" ' +
                            'href="/postage/' + contextData.connectionID + '/dep_viewer.html?oid=' + intOid + '" target="_blank"></gs-button>';
}

function dependDialog(intOid) {
    'use strict';
    var templateElement = document.createElement('template'), strName;
    
    //console.log(intOid);
    
    templateElement.setAttribute('data-overlay-close', 'true');
    if (evt.touchDevice) {
        templateElement.setAttribute('data-mode', 'full');
    }
    templateElement.innerHTML = ml(function () {/*
        <gs-page>
            <gs-header><center><h3>Dependencies & Dependents</h3></center></gs-header>
            <gs-body padded>
                <label for="dependencies-container">Dependencies:</label>
                <div id="dependencies-container" style="min-height: 2em;"></div><br />
                
                <label for="dependents-container">Dependents:</label>
                <div id="dependents-container" style="min-height: 2em;"></div>
            </gs-body>
            <gs-footer><gs-button dialogclose>Done</gs-button></gs-footer>
        </gs-page>
    */});
    
    GS.openDialog(templateElement, function () {
        getListData(infoQuery.dependencies.replace(/\{\{INTOID\}\}/g, intOid),
                    document.getElementById('dependencies-container'),
                    function (arrRecords) {
            var i, len, strHTML = '';
            
            for (i = 1, len = arrRecords.length; i < len; i += 1) {
                strHTML +=  '<tr>' +
                                '<td>' + encodeHTML(GS.decodeFromTabDelimited(arrRecords[i][3])) + '</td>' +
                                '<td>' + encodeHTML(GS.decodeFromTabDelimited(arrRecords[i][4])) + '</td>' +
                                '<td>' + encodeHTML(GS.decodeFromTabDelimited(arrRecords[i][6])) + '</td>' +
                                //'<td>' + encodeHTML(GS.decodeFromTabDelimited(arrRecords[i][5])) + '</td>' +
                            '</tr>';
            }
            
            document.getElementById('dependencies-container').innerHTML =
                '<table class="table-dep">' +
                    '<thead>' +
                        '<tr>' +
                            '<th>Object Type</th>' +
                            '<th>Object Name</th>' +
                            '<th>Dependence Type</th>' +
                            //'<th>OID</th>' +
                        '</tr>' +
                    '</thead>' +
                    strHTML +
                '</table>';
        });
        
        getListData(infoQuery.dependents.replace(/\{\{INTOID\}\}/g, intOid),
                    document.getElementById('dependents-container'),
                    function (arrRecords) {
            var i, len, strHTML = '';
            
            for (i = 1, len = arrRecords.length; i < len; i += 1) {
                strHTML +=  '<tr>' +
                                '<td>' + encodeHTML(GS.decodeFromTabDelimited(arrRecords[i][0])) + '</td>' +
                                '<td>' + encodeHTML(GS.decodeFromTabDelimited(arrRecords[i][1])) + '</td>' +
                                '<td>' + encodeHTML(GS.decodeFromTabDelimited(arrRecords[i][6])) + '</td>' +
                                //'<td>' + encodeHTML(GS.decodeFromTabDelimited(arrRecords[i][2])) + '</td>' +
                            '</tr>';
            }
            
            document.getElementById('dependents-container').innerHTML =
                '<table class="table-dep">' +
                    '<thead>' +
                        '<tr>' +
                            '<th>Object Type</th>' +
                            '<th>Object Name</th>' +
                            '<th>Dependence Type</th>' +
                            //'<th>OID</th>' +
                        '</tr>' +
                    '</thead>' +
                    strHTML +
                '</table>';
        });
    });
}


function propertyButton(strPropName, intOid, strNamePartOne, strNamePartTwo) {
    'use strict';
    return '<gs-button icononly icon="list" no-focus title="Object properties" ' +
                'onclick="' +
                    'propertyDialog(propQuery.' + strPropName + ',' +
                                    intOid + ',' +
                                    '\'' + singleQuoteSafe(strNamePartOne || '') + '\',' +
                                    '\'' + singleQuoteSafe(strNamePartTwo || '') + '\');' +
                '"></gs-button>';
}

function propertyDialog(strQuery, intOid, strNamePartOne, strNamePartTwo) {
    'use strict';
    var templateElement = document.createElement('template'), strSafeName, strName;
    
    if (strNamePartOne && strNamePartTwo) {
        strSafeName = quote_ident(strNamePartOne) + '.' + quote_ident(strNamePartTwo);
        strName = strNamePartOne + '.' + strNamePartTwo;
        
    } else if (strNamePartOne) {
        strSafeName = quote_ident(strNamePartOne);
        strName = strNamePartOne;
        
    } else if (strNamePartTwo) {
        strSafeName = quote_ident(strNamePartTwo);
        strName = strNamePartTwo;
    }
    
    //console.log(strQuery, intOid, strSafeName);
    templateElement.setAttribute('data-overlay-close', 'true');
    if (evt.touchDevice) {
        templateElement.setAttribute('data-mode', 'full');
    }
    templateElement.innerHTML = ml(function () {/*
        <gs-page>
            <gs-header><center><h3>Properties</h3></center></gs-header>
            <gs-body padded>
                <b>Properties For:</b> {{STRNAME}}<br /><br />
                <div id="properties-container" style="min-height: 6em;"></div>
            </gs-body>
            <gs-footer><gs-button dialogclose>Done</gs-button></gs-footer>
        </gs-page>
    */}).replace(/\{\{STRNAME\}\}/g, strName);
    
    GS.openDialog(templateElement, function () {
        getListData(strQuery.replace(/\{\{INTOID\}\}/g, intOid)
                            .replace(/\{\{STRNAME\}\}/g, strSafeName)
                            .replace(/\{\{SQLSAFENAME\}\}/g, strSafeName),
                    document.getElementById('properties-container'),
                    function (arrRecords) {
            var i, len, col_i, col_len, strHTML = '';
            
            for (col_i = 1, col_len = arrRecords[0].length; col_i < col_len; col_i += 1) {
                strHTML +=  '<tr>' +
                                '<th>' + encodeHTML(GS.decodeFromTabDelimited(arrRecords[1][col_i])) + '</th>' +
                                '<td>' + encodeHTML(GS.decodeFromTabDelimited(arrRecords[2][col_i])) + '</td>' +
                            '</tr>';
            }
            
            document.getElementById('properties-container').innerHTML =
                '<table class="table-stats">' + strHTML + '</table>';
        });
    });
}


function statButton(strStatName, intOid, strNamePartOne, strNamePartTwo) {
    'use strict';
    return '<gs-button icononly icon="bar-chart-o" no-focus title="Object statistics" ' +
                'onclick="' +
                    'statDialog(statQuery.' + encodeHTML(strStatName) + ',' +
                                    encodeHTML(intOid) + ',' +
                                    '\'' + singleQuoteSafe(encodeHTML(strNamePartOne || '')) + '\',' +
                                    '\'' + singleQuoteSafe(encodeHTML(strNamePartTwo || '')) + '\');' +
                '"></gs-button>';
}

function statDialog(strQuery, intOid, strNamePartOne, strNamePartTwo) {
    'use strict';
    var templateElement = document.createElement('template'), strSafeName, strName;
    
    if (strNamePartOne && strNamePartTwo) {
        strSafeName = quote_ident(strNamePartOne) + '.' + quote_ident(strNamePartTwo);
        strName = strNamePartOne + '.' + strNamePartTwo;
        
    } else if (strNamePartOne) {
        strSafeName = quote_ident(strNamePartOne);
        strName = strNamePartOne;
        
    } else if (strNamePartTwo) {
        strSafeName = quote_ident(strNamePartTwo);
        strName = strNamePartTwo;
    }
    
    //console.log(strQuery, intOid, strSafeName);
    templateElement.setAttribute('data-overlay-close', 'true');
    if (evt.touchDevice) {
        templateElement.setAttribute('data-mode', 'full');
    }
    templateElement.innerHTML = ml(function () {/*
        <gs-page>
            <gs-header><center><h3>Statistics</h3></center></gs-header>
            <gs-body padded>
                <b>Statistics For:</b> {{STRNAME}}<br /><br />
                <div id="stats-container" style="min-height: 6em;"></div>
            </gs-body>
            <gs-footer><gs-button dialogclose>Done</gs-button></gs-footer>
        </gs-page>
    */}).replace(/\{\{STRNAME\}\}/g, strName);
    
    GS.openDialog(templateElement, function () {
        getListData(strQuery.replace(/\{\{INTOID\}\}/g, intOid)
                            .replace(/\{\{STRNAME\}\}/g, strSafeName)
                            .replace(/\{\{SQLSAFENAME\}\}/g, strSafeName),
                    document.getElementById('stats-container'),
                    function (arrRecords) {
            var i, len, col_i, col_len, strHTML = '';
            
            if (arrRecords[2]) {
                for (col_i = 1, col_len = arrRecords[0].length; col_i < col_len; col_i += 1) {
                    strHTML +=  '<tr>' +
                                    '<th>' + encodeHTML(GS.decodeFromTabDelimited(arrRecords[1][col_i])) + '</th>' +
                                    '<td>' + encodeHTML(GS.decodeFromTabDelimited(arrRecords[2][col_i])) + '</td>' +
                                '</tr>';
                }
                
                document.getElementById('stats-container').innerHTML =
                    '<table class="table-stats">' + strHTML + '</table>';
            } else {
                document.getElementById('stats-container').innerHTML = '<center><h4>No Statistics Found</h4></center>';
            }
        });
    });
}



function quote_ident(strName) {
    'use strict';
    var bolQuote = !Boolean(strName.match(/^[a-z_]{1,}[a-z_0-9]*$/));
    
    //_ is safe
    //0-9 is safe (except when first char)
    //a-z is safe
    
    // if we need to quote: double up double quotes
    if (bolQuote) {
        return '"' + strName.replace(/\"/g, '""') + '"';
    }
    
    return strName;
}










function dataObjectButtons(strType, intOID, strSchema, strName) {
    'use strict';
    var strHTML = '', templateElement = document.createElement('template');
    
    // de-quote_ident strName because the datasheet page doesn't want it idented
    if (strName[0] === '"') {
        strName = strName.substring(1, strName.length - 1).replace(/\"\"/gi, '"');
    }
    
    if (strType === 'table' || strType === 'objectTable') {
        strHTML += '<gs-button icononly icon="wrench" title="Design table" ' +
                        'onclick="newTab(\'design-table\', \'' + encodeHTML(strSchema) + '.' + encodeHTML(strName) + '\', '+
                                '{\'oid\': ' + intOID + '});"></gs-button>';
        
        strType = 'table';
    } else {
        strType = 'view';
    }
    
    //console.trace(intOID, strSchema, strName, strType);
    
    strHTML += '<gs-button icononly icon="table" title="Edit the data in this object" ' +
                    'onclick="newTab(\'datasheet\', \'' + encodeHTML(strSchema) + '.' + encodeHTML(strName) + '\', ' +
                        '{\'queryString\': \'type=' + strType + '&schema=' + encodeHTML(strSchema) + '&object=' + encodeHTML(strName) + '\'})"></gs-button>';
    
    return strHTML;
}


function dumpButton(strOid, strName) {
    return '<gs-button icononly icon="edit" no-focus title="Dump schema to script"'
                    + ' onclick="dialogSchemaSurgery(\'' + strOid + '\', \'' + strName + '\')"></gs-button>';
}






// custom surgery/dump
function dialogSchemaSurgery(intSchemaOid, strSchemaName) {
    'use strict';
    var templateElement = document.createElement('template');
    
    /*
    listQuery.objectAggregate
    listQuery.objectCollation
    listQuery.objectConversion
    listQuery.objectDomain
    listQuery.objectForeignTable
    listQuery.objectFunction
    listQuery.objectIndex
    listQuery.objectOperatorClass
    listQuery.objectOperatorFamily
    listQuery.objectOperator
    listQuery.objectSequence
    listQuery.objectTable
    listQuery.objectTriggerFunction
    listQuery.objectTextSearchConfiguration
    listQuery.objectTextSearchDictionary
    listQuery.objectTextSearchParser
    listQuery.objectTextSearchTemplate
    listQuery.objectType
    listQuery.objectView
    
    
    bolAggregate
    bolCollation
    bolConversion
    bolDomain
    bolForeignTable
    bolFunction
    bolIndex
    bolOperatorClass
    bolOperatorFamily
    bolOperator
    bolSequence
    bolTable
    bolTriggerFunction
    bolTextSearchConfiguration
    bolTextSearchDictionary
    bolTextSearchParser
    bolTextSearchTemplate
    bolType
    bolView
    
    checkbox-schema-dump-aggregate
    checkbox-schema-dump-collation
    checkbox-schema-dump-conversion
    checkbox-schema-dump-domain
    checkbox-schema-dump-foreign-table
    checkbox-schema-dump-function
    checkbox-schema-dump-index
    checkbox-schema-dump-operator-class
    checkbox-schema-dump-operator-family
    checkbox-schema-dump-operator
    checkbox-schema-dump-sequence
    checkbox-schema-dump-table
    checkbox-schema-dump-trigger-function
    checkbox-schema-dump-text-search-configuration
    checkbox-schema-dump-text-search-dictionary
    checkbox-schema-dump-text-search-parser
    checkbox-schema-dump-text-search-template
    checkbox-schema-dump-type
    checkbox-schema-dump-view
    */

    
    templateElement.innerHTML = ml(function () {/*
        <gs-page>
            <gs-header>
                <center><h3>Dump schema to script</h3></center>
            </gs-header>
            <gs-body padded>
                <center>What code do you want for the schema: "<span id="dialog-sql-dump-schema"></span>"?</center>
                <div id="schema-dump-change-event-catcher">
                    <gs-checkbox remove-bottom flex-horizontal value="true" id="checkbox-all">
                        <label style="text-align: left;" flex>&nbsp;All</label>
                    </gs-checkbox>
                    <gs-checkbox flex-horizontal value="true" id="checkbox-schema-dump-drop-statements" remove-all>
                        <label style="text-align: left;" flex>&nbsp;Drop Statements</label>
                    </gs-checkbox>
                    <gs-checkbox remove-all flex-horizontal value="true" id="checkbox-schema-dump-schema">
                        <label style="text-align: left;" flex>&nbsp;Schema</label>
                    </gs-checkbox>
                    <gs-checkbox remove-all flex-horizontal value="true" id="checkbox-schema-dump-aggregate">
                        <label style="text-align: left;" flex>&nbsp;Aggregates</label>
                    </gs-checkbox>
                    <gs-checkbox remove-all flex-horizontal value="true" id="checkbox-schema-dump-collation">
                        <label style="text-align: left;" flex>&nbsp;Collations</label>
                    </gs-checkbox>
                    <gs-checkbox remove-all flex-horizontal value="true" id="checkbox-schema-dump-conversion">
                        <label style="text-align: left;" flex>&nbsp;Conversions</label>
                    </gs-checkbox>
                    <gs-checkbox remove-all flex-horizontal value="true" id="checkbox-schema-dump-domain">
                        <label style="text-align: left;" flex>&nbsp;Domains</label>
                    </gs-checkbox>
                    <gs-checkbox remove-all flex-horizontal value="true" id="checkbox-schema-dump-foreign-table">
                        <label style="text-align: left;" flex>&nbsp;Foreign Tables</label>
                    </gs-checkbox>
                    <gs-checkbox remove-all flex-horizontal value="true" id="checkbox-schema-dump-function">
                        <label style="text-align: left;" flex>&nbsp;Functions</label>
                    </gs-checkbox>
                    <gs-checkbox remove-all flex-horizontal value="true" id="checkbox-schema-dump-index">
                        <label style="text-align: left;" flex>&nbsp;Indexes</label>
                    </gs-checkbox>
                    <gs-checkbox remove-all flex-horizontal value="true" id="checkbox-schema-dump-operator-class">
                        <label style="text-align: left;" flex>&nbsp;Operator Classes</label>
                    </gs-checkbox>
                    <gs-checkbox remove-all flex-horizontal value="true" id="checkbox-schema-dump-operator-family">
                        <label style="text-align: left;" flex>&nbsp;Operator Families</label>
                    </gs-checkbox>
                    <gs-checkbox remove-all flex-horizontal value="true" id="checkbox-schema-dump-operator">
                        <label style="text-align: left;" flex>&nbsp;Operators</label>
                    </gs-checkbox>
                    <gs-checkbox remove-all flex-horizontal value="true" id="checkbox-schema-dump-sequence">
                        <label style="text-align: left;" flex>&nbsp;Sequences</label>
                    </gs-checkbox>
                    <gs-checkbox remove-all flex-horizontal value="true" id="checkbox-schema-dump-table">
                        <label style="text-align: left;" flex>&nbsp;Tables</label>
                    </gs-checkbox>
                    <gs-checkbox remove-all flex-horizontal value="true" id="checkbox-schema-dump-trigger-function">
                        <label style="text-align: left;" flex>&nbsp;Trigger Functions</label>
                    </gs-checkbox>
                    <gs-checkbox remove-all flex-horizontal value="true" id="checkbox-schema-dump-text-search-configuration">
                        <label style="text-align: left;" flex>&nbsp;Text Search Configurations</label>
                    </gs-checkbox>
                    <gs-checkbox remove-all flex-horizontal value="true" id="checkbox-schema-dump-text-search-dictionary">
                        <label style="text-align: left;" flex>&nbsp;Text Search Dictionarys</label>
                    </gs-checkbox>
                    <gs-checkbox remove-all flex-horizontal value="true" id="checkbox-schema-dump-text-search-parser">
                        <label style="text-align: left;" flex>&nbsp;Text Search Parsers</label>
                    </gs-checkbox>
                    <gs-checkbox remove-all flex-horizontal value="true" id="checkbox-schema-dump-text-search-template">
                        <label style="text-align: left;" flex>&nbsp;Text Search Template</label>
                    </gs-checkbox>
                    <gs-checkbox remove-all flex-horizontal value="true" id="checkbox-schema-dump-type">
                        <label style="text-align: left;" flex>&nbsp;Types</label>
                    </gs-checkbox>
                    <gs-checkbox remove-top flex-horizontal value="true" id="checkbox-schema-dump-view">
                        <label style="text-align: left;" flex>&nbsp;Views</label>
                    </gs-checkbox>
                </div>
            </gs-body>
            <gs-footer>
                <gs-grid>
                    <gs-block><gs-button remove-all dialogclose>Cancel</gs-button></gs-block>
                    <gs-block><gs-button remove-all id="button-schema-dump" dialogclose>Open Script</gs-button></gs-block>
                </gs-grid>
            </gs-footer>
        </gs-page>
    */});
    
    // find out what objects the schema has
    // display a checkbox for each applicable object type
    
    // drop statements
    // for tables: include data
    
    
    
    GS.openDialog(templateElement, function () {
        document.getElementById('dialog-sql-dump-schema').textContent = strSchemaName;
        document.getElementById('checkbox-all').addEventListener('change', function () {
            document.getElementById('checkbox-schema-dump-drop-statements').value = document.getElementById('checkbox-all').value;
            document.getElementById('checkbox-schema-dump-schema').value = document.getElementById('checkbox-all').value;
            document.getElementById('checkbox-schema-dump-aggregate').value = document.getElementById('checkbox-all').value;
            document.getElementById('checkbox-schema-dump-collation').value = document.getElementById('checkbox-all').value;
            document.getElementById('checkbox-schema-dump-conversion').value = document.getElementById('checkbox-all').value;
            document.getElementById('checkbox-schema-dump-domain').value = document.getElementById('checkbox-all').value;
            document.getElementById('checkbox-schema-dump-foreign-table').value = document.getElementById('checkbox-all').value;
            document.getElementById('checkbox-schema-dump-function').value = document.getElementById('checkbox-all').value;
            document.getElementById('checkbox-schema-dump-index').value = document.getElementById('checkbox-all').value;
            document.getElementById('checkbox-schema-dump-operator-class').value = document.getElementById('checkbox-all').value;
            document.getElementById('checkbox-schema-dump-operator-family').value = document.getElementById('checkbox-all').value;
            document.getElementById('checkbox-schema-dump-operator').value = document.getElementById('checkbox-all').value;
            document.getElementById('checkbox-schema-dump-sequence').value = document.getElementById('checkbox-all').value;
            document.getElementById('checkbox-schema-dump-table').value = document.getElementById('checkbox-all').value;
            document.getElementById('checkbox-schema-dump-trigger-function').value = document.getElementById('checkbox-all').value;
            document.getElementById('checkbox-schema-dump-text-search-configuration').value = document.getElementById('checkbox-all').value;
            document.getElementById('checkbox-schema-dump-text-search-dictionary').value = document.getElementById('checkbox-all').value;
            document.getElementById('checkbox-schema-dump-text-search-parser').value = document.getElementById('checkbox-all').value;
            document.getElementById('checkbox-schema-dump-text-search-template').value = document.getElementById('checkbox-all').value;
            document.getElementById('checkbox-schema-dump-type').value = document.getElementById('checkbox-all').value;
            document.getElementById('checkbox-schema-dump-view').value = document.getElementById('checkbox-all').value;
        });
        
        document.getElementById('schema-dump-change-event-catcher').addEventListener('change', function () {
            var bolSchema, bolAggregate, bolCollation, bolConversion,
                bolDomain, bolForeignTable, bolFunction, bolIndex,
                bolOperatorClass, bolOperatorFamily, bolOperator,
                bolSequence, bolTable, bolTriggerFunction,
                bolTextSearchConfiguration, bolTextSearchDictionary,
                bolTextSearchParser, bolTextSearchTemplate, bolType,
                bolView;
            
            bolSchema                       = document.getElementById('checkbox-schema-dump-schema').value                      === 'true';
            bolAggregate                    = document.getElementById('checkbox-schema-dump-aggregate').value                   === 'true';
            bolCollation                    = document.getElementById('checkbox-schema-dump-collation').value                   === 'true';
            bolConversion                   = document.getElementById('checkbox-schema-dump-conversion').value                  === 'true';
            bolDomain                       = document.getElementById('checkbox-schema-dump-domain').value                      === 'true';
            bolForeignTable                 = document.getElementById('checkbox-schema-dump-foreign-table').value               === 'true';
            bolFunction                     = document.getElementById('checkbox-schema-dump-function').value                    === 'true';
            bolIndex                        = document.getElementById('checkbox-schema-dump-index').value                       === 'true';
            bolOperatorClass                = document.getElementById('checkbox-schema-dump-operator-class').value              === 'true';
            bolOperatorFamily               = document.getElementById('checkbox-schema-dump-operator-family').value             === 'true';
            bolOperator                     = document.getElementById('checkbox-schema-dump-operator').value                    === 'true';
            bolSequence                     = document.getElementById('checkbox-schema-dump-sequence').value                    === 'true';
            bolTable                        = document.getElementById('checkbox-schema-dump-table').value                       === 'true';
            bolTriggerFunction              = document.getElementById('checkbox-schema-dump-trigger-function').value            === 'true';
            bolTextSearchConfiguration      = document.getElementById('checkbox-schema-dump-text-search-configuration').value   === 'true';
            bolTextSearchDictionary         = document.getElementById('checkbox-schema-dump-text-search-dictionary').value      === 'true';
            bolTextSearchParser             = document.getElementById('checkbox-schema-dump-text-search-parser').value          === 'true';
            bolTextSearchTemplate           = document.getElementById('checkbox-schema-dump-text-search-template').value        === 'true';
            bolType                         = document.getElementById('checkbox-schema-dump-type').value                        === 'true';
            bolView                         = document.getElementById('checkbox-schema-dump-view').value                        === 'true';
            
            if (   !bolschema && !bolAggregate && !bolCollation && !bolConversion && !bolDomain
                && !bolForeignTable && !bolFunction && !bolIndex && !bolOperatorClass
                && !bolOperatorFamily && !bolOperator && !bolSequence && !bolTable
                && !bolTriggerFunction && !bolTextSearchConfiguration && !bolTextSearchDictionary
                && !bolTextSearchParser && !bolTextSearchTemplate && !bolType && !bolView) {
                document.getElementById('button-schema-dump').setAttribute('disabled', '');
            } else {
                document.getElementById('button-schema-dump').removeAttribute('disabled');
            }
        });
    }, function (event, strAnswer) {
        var bolDropStatments, bolSchema, bolAggregate, bolCollation, bolConversion,
            bolDomain, bolForeignTable, bolFunction, bolIndex,
            bolOperatorClass, bolOperatorFamily, bolOperator,
            bolSequence, bolTable, bolTriggerFunction,
            bolTextSearchConfiguration, bolTextSearchDictionary,
            bolTextSearchParser, bolTextSearchTemplate, bolType,
            bolView, strQuery, arrQuery, handleListResults;
        
        if (strAnswer === 'Open Script') {
            bolDropStatments                = document.getElementById('checkbox-schema-dump-drop-statements').value             === 'true';
            bolSchema                       = document.getElementById('checkbox-schema-dump-schema').value                      === 'true';
            bolAggregate                    = document.getElementById('checkbox-schema-dump-aggregate').value                   === 'true';
            bolCollation                    = document.getElementById('checkbox-schema-dump-collation').value                   === 'true';
            bolConversion                   = document.getElementById('checkbox-schema-dump-conversion').value                  === 'true';
            bolDomain                       = document.getElementById('checkbox-schema-dump-domain').value                      === 'true';
            bolForeignTable                 = document.getElementById('checkbox-schema-dump-foreign-table').value               === 'true';
            bolFunction                     = document.getElementById('checkbox-schema-dump-function').value                    === 'true';
            bolIndex                        = document.getElementById('checkbox-schema-dump-index').value                       === 'true';
            bolOperatorClass                = document.getElementById('checkbox-schema-dump-operator-class').value              === 'true';
            bolOperatorFamily               = document.getElementById('checkbox-schema-dump-operator-family').value             === 'true';
            bolOperator                     = document.getElementById('checkbox-schema-dump-operator').value                    === 'true';
            bolSequence                     = document.getElementById('checkbox-schema-dump-sequence').value                    === 'true';
            bolTable                        = document.getElementById('checkbox-schema-dump-table').value                       === 'true';
            bolTriggerFunction              = document.getElementById('checkbox-schema-dump-trigger-function').value            === 'true';
            bolTextSearchConfiguration      = document.getElementById('checkbox-schema-dump-text-search-configuration').value   === 'true';
            bolTextSearchDictionary         = document.getElementById('checkbox-schema-dump-text-search-dictionary').value      === 'true';
            bolTextSearchParser             = document.getElementById('checkbox-schema-dump-text-search-parser').value          === 'true';
            bolTextSearchTemplate           = document.getElementById('checkbox-schema-dump-text-search-template').value        === 'true';
            bolType                         = document.getElementById('checkbox-schema-dump-type').value                        === 'true';
            bolView                         = document.getElementById('checkbox-schema-dump-view').value                        === 'true';
            
            // build query for getting all of the lists of objects
            strQuery = '';
            arrQuery = [];
            
            if (bolAggregate) {
                arrQuery.push('\n\n SELECT oid, name, schema_name, \'Aggregate\' AS objType FROM (' +
                    listQuery.objectAggregate.replace(/\{\{INTOID\}\}/gim, intSchemaOid).replace(';', '') +
                ') em ');
            }
            if (bolCollation) {
                arrQuery.push('\n\n SELECT oid, name, schema_name, \'Collation\' AS objType FROM (' +
                    listQuery.objectCollation.replace(/\{\{INTOID\}\}/gim, intSchemaOid).replace(';', '') +
                ') em ');
            }
            if (bolConversion) {
                arrQuery.push('\n\n SELECT oid, name, schema_name, \'Conversion\' AS objType FROM (' +
                    listQuery.objectConversion.replace(/\{\{INTOID\}\}/gim, intSchemaOid).replace(';', '') +
                ') em ');
            }
            if (bolDomain) {
                arrQuery.push('\n\n SELECT oid, name, schema_name, \'Domain\' AS objType FROM (' +
                    listQuery.objectDomain.replace(/\{\{INTOID\}\}/gim, intSchemaOid).replace(';', '') +
                ') em ');
            }
            if (bolForeignTable) {
                arrQuery.push('\n\n SELECT oid, name, schema_name, \'ForeignTable\' AS objType FROM (' +
                    listQuery.objectForeignTable.replace(/\{\{INTOID\}\}/gim, intSchemaOid).replace(';', '') +
                ') em ');
            }
            if (bolFunction) {
                arrQuery.push('\n\n SELECT oid, name, schema_name, \'Function\' AS objType FROM (' +
                    listQuery.objectFunction.replace(/\{\{INTOID\}\}/gim, intSchemaOid).replace(';', '') +
                ') em ');
            }
            if (bolIndex) {
                arrQuery.push('\n\n SELECT oid, name, schema_name, \'Index\' AS objType FROM (' +
                    listQuery.objectIndex.replace(/\{\{INTOID\}\}/gim, intSchemaOid).replace(';', '') +
                ') em ');
            }
            if (bolOperatorClass) {
                arrQuery.push('\n\n SELECT oid, name, schema_name, \'OperatorClass\' AS objType FROM (' +
                    listQuery.objectOperatorClass.replace(/\{\{INTOID\}\}/gim, intSchemaOid).replace(';', '') +
                ') em ');
            }
            if (bolOperatorFamily) {
                arrQuery.push('\n\n SELECT oid, name, schema_name, \'OperatorFamily\' AS objType FROM (' +
                    listQuery.objectOperatorFamily.replace(/\{\{INTOID\}\}/gim, intSchemaOid).replace(';', '') +
                ') em ');
            }
            if (bolOperator) {
                arrQuery.push('\n\n SELECT oid, name, schema_name, \'Operator\' AS objType FROM (' +
                    listQuery.objectOperator.replace(/\{\{INTOID\}\}/gim, intSchemaOid).replace(';', '') +
                ') em ');
            }
            if (bolSequence) {
                arrQuery.push('\n\n SELECT oid, name, schema_name, \'Sequence\' AS objType FROM (' +
                    listQuery.objectSequence.replace(/\{\{INTOID\}\}/gim, intSchemaOid).replace(';', '') +
                ') em ');
            }
            if (bolTable) {
                arrQuery.push('\n\n SELECT oid, name, schema_name, \'Table\' AS objType FROM (' +
                    listQuery.objectTableList.replace(/\{\{INTOID\}\}/gim, intSchemaOid).replace(';', '') +
                ') em ');
            }
            if (bolTriggerFunction) {
                arrQuery.push('\n\n SELECT oid, name, schema_name, \'TriggerFunction\' AS objType FROM (' +
                    listQuery.objectTriggerFunction.replace(/\{\{INTOID\}\}/gim, intSchemaOid).replace(';', '') +
                ') em ');
            }
            if (bolTextSearchConfiguration) {
                arrQuery.push('\n\n SELECT oid, name, schema_name, \'TextSearchConfiguration\' AS objType FROM (' +
                    listQuery.objectTextSearchConfiguration.replace(/\{\{INTOID\}\}/gim, intSchemaOid).replace(';', '') +
                ') em ');
            }
            if (bolTextSearchDictionary) {
                arrQuery.push('\n\n SELECT oid, name, schema_name, \'TextSearchDictionary\' AS objType FROM (' +
                    listQuery.objectTextSearchDictionary.replace(/\{\{INTOID\}\}/gim, intSchemaOid).replace(';', '') +
                ') em ');
            }
            if (bolTextSearchParser) {
                arrQuery.push('\n\n SELECT oid, name, schema_name, \'TextSearchParser\' AS objType FROM (' +
                    listQuery.objectTextSearchParser.replace(/\{\{INTOID\}\}/gim, intSchemaOid).replace(';', '') +
                ') em ');
            }
            if (bolTextSearchTemplate) {
                arrQuery.push('\n\n SELECT oid, name, schema_name, \'TextSearchTemplate\' AS objType FROM (' +
                    listQuery.objectTextSearchTemplate.replace(/\{\{INTOID\}\}/gim, intSchemaOid).replace(';', '') +
                ') em ');
            }
            if (bolType) {
                arrQuery.push('\n\n SELECT oid, name, schema_name, \'Type\' AS objType FROM (' +
                    listQuery.objectType.replace(/\{\{INTOID\}\}/gim, intSchemaOid).replace(';', '') +
                ') em ');
            }
            if (bolView) {
                arrQuery.push('\n\n SELECT oid, name, schema_name, \'View\' AS objType FROM (' +
                    listQuery.objectViewList.replace(/\{\{INTOID\}\}/gim, intSchemaOid).replace(';', '') +
                ') em ');
            }
            
            if (   bolAggregate || bolCollation || bolConversion || bolDomain || bolForeignTable || bolFunction
                || bolIndex || bolOperatorClass || bolOperatorFamily || bolOperator || bolSequence || bolTable
                || bolTriggerFunction || bolTextSearchConfiguration || bolTextSearchDictionary
                || bolTextSearchParser || bolTextSearchTemplate || bolType || bolView) {
                strQuery = arrQuery.join(' UNION ALL ') + '\n\nORDER BY 1';
            }
            
            // function to handle the query results
            handleListResults = function (arrResult) {
                var strDumpQuery = '', strQuery, i, len, tempFunction, handleScriptResults;
                
                // drop statements (reverse order of schema then listed objects)
                if (bolDropStatments) {
                    GS.addLoader('loader-drop', 'Creating DROP Statements');
                    for (i = arrResult.length - 1; i >= 0; i -= 1) {
                        //strDumpQuery += 'DROP ' + arrResult[i][3].toUpperCase() + ' ' + quote_ident(strSchemaName) + '.' + quote_ident(arrResult[i][1]) + ';\n';
                        //console.log(arrResult[i][3].toUpperCase() === 'FUNCTION');
                        
                        if (arrResult[i][3].toUpperCase() === 'FUNCTION' || arrResult[i][1].indexOf('"') !== -1) {
                            strDumpQuery += 'DROP ' + arrResult[i][3].toUpperCase().replace('TRIGGERFUNCTION', 'FUNCTION') + ' ' + quote_ident(strSchemaName) + '.' + arrResult[i][1] + ';\n';
                        } else {
                            strDumpQuery += 'DROP ' + arrResult[i][3].toUpperCase().replace('TRIGGERFUNCTION', 'FUNCTION') + ' ' + quote_ident(strSchemaName) + '.' + quote_ident(arrResult[i][1]) + ';\n';
                        }
                    }
                    
                    if (bolSchema) {
                        strDumpQuery += 'DROP SCHEMA ' + strSchemaName + ';\n\n\n';
                    }
                    GS.removeLoader('loader-drop');
                }
                
                // load querys for:
                //      schema
                //      listed objects
                strQuery = '';
                if (bolSchema) { strQuery += '\n\n' + scriptQuery.objectSchema.replace(/\{\{INTOID\}\}/gim, intSchemaOid); }
                
                // For some there is an extra result at the beginning?
                // I'm not sure why, but I get back (bolSchema ? 2 : 1) more script results than list results
                var j = 0, len1 = arrResult.length + (bolSchema ? 2 : 1);
                var resName;
                
                for (i = 0, len = arrResult.length; i < len; i += 1) {
                    if (arrResult[i][1].indexOf('"') === -1) {
                        resName = quote_ident(arrResult[i][1]);
                    } else {
                        resName = arrResult[i][1];
                    }
                    
                    strQuery += '\n\n' +
                        (
                            scriptQuery['object' + GS.strToTitle(arrResult[i][3])]
                        )
                        .replace(/\{\{INTOID\}\}/gim, arrResult[i][0])
                        .replace(/\{\{STRSQLSAFENAME\}\}/gim, quote_ident(strSchemaName) + '.' + resName);
                }
                
                handleScriptResults = function (arrResult) {
                    var i, len;
                    
                    
                    arrResult.splice(0, 1);
                    
                    for (i = 0, len = arrResult.length; i < len; i += 1) {
                        //console.log(GS.decodeFromTabDelimited(arrResult[i][0]).substring(0, 35));
                        strDumpQuery += GS.decodeFromTabDelimited(arrResult[i][0]) + '\n\n';
                    }
                    j += len;
                    
                    //console.log((j + 1), len1, arrResult.length, (bolSchema ? 2 : 1)); //, strDumpQuery
                    
                    if ((j + 1) === len1) {
                        newTab('sql', strSchemaName, {'strContent': strDumpQuery});
                        GS.removeLoader('loader-script');
                    }
                };
                
                
                GS.addLoader('loader-script', 'Creating Script');
                if (strQuery) {
                    getListsForDump(strQuery, handleScriptResults);
                } else {
                    handleScriptResults([]);
                }
            };
            
            // load lists of objects to dump
            if (strQuery) {
                getListsForDump(strQuery, function (arrResults) {
                    arrResults.splice(0, 1);
                    
                    handleListResults(arrResults);
                });
            } else {
                handleListResults([]);
            }
        }
    });
}










