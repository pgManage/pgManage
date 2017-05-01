var bolAutocompleteLogicLoaded = true;
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
};

var curr_run_down = 0, curr_run_up = 0, curr_run_complete = 0;

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


function isAlpha(testStr) {
    var bolAlphaNumeric = (/^[a-z0-9]+$/i).test(testStr);
    return bolAlphaNumeric;
}


function autocompleteBindEditor(tabElement, editor) {
    var autocompleteKeyEvent;
    editor.standardGoLineDownExec = editor.commands.commands.golinedown.exec;
    editor.standardGoLineUpExec   = editor.commands.commands.golineup.exec;
    editor.standardIndentExec     = editor.commands.commands.indent.exec;
    editor.standardgotoright      = editor.commands.commands.gotoright.exec;
    editor.standardgotoleft       = editor.commands.commands.gotoleft.exec;
    editor.standardReturn         = editor.commands.commands.inserttext.exec;
    
    
    editor.commands.commands.golinedown.exec = function () {
        if (autocompleteGlobals.bolBound) {
            var intCurrentLine = autocompleteGlobals.popupAce.getSelectionRange().start.row
              , intLastLine = autocompleteGlobals.arrValues.length - 1;
            if (editor.currentSelections.length > 1) {
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
            editor.standardGoLineDownExec.apply(this, arguments)
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
            editor.standardGoLineUpExec.apply(this, arguments)
        }
    };
    

    editor.commands.commands.indent.exec = function () {
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
                        closePopup();
                        editor.env.document.insert(insertObj, '\t');
                    }
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
    
    
    
    editor.addEventListener('change', function (event) {
        //console.log(event.lines.length, autocompleteGlobals.ignoreNext);
        if (autocompleteGlobals.ignoreNext === 0) {
            if (event.action === 'insert') {
                if (event.lines[0].length === 1) {
                    if (!editor.currentQueryRange === false) {
                        if (isAlpha(event.lines)) {
                            
                            //console.log('alpha_numeric');
                            autocompleteKeyEvent = 'alpha_numeric';
                            
                        } else if (event.lines[0] === '"' || event.lines[0] === "'") {
                            
                            //console.log('quote');
                            autocompleteKeyEvent = 'quote';
                            
                        } else if (event.lines[0] === '/' || event.lines[0] === '\\') {
                            
                            //console.log('slash');
                            autocompleteKeyEvent = 'slash';
                            
                        } else if (event.lines[0] === ',') {
                            
                            //console.log('comma');
                            autocompleteKeyEvent = 'comma';
                            
                        } else if (event.lines[0] === '.') {
                            
                            //console.log('period');
                            autocompleteKeyEvent = 'period';
                            
                        } else if (event.lines[0] === ':') {
                            
                            //console.log('colon');
                            autocompleteKeyEvent = 'colon';
                            
                        } else if (event.lines[0] === '(' || event.lines[0] === ')') {
                            
                            //console.log('parenthesis');
                            autocompleteKeyEvent = 'parenthesis';
                            
                        } else if (event.lines[0] === ' ') {
                            
                            //console.log('space');
                            autocompleteKeyEvent = 'space';
                            
                        } else if (event.lines[0] === ';') {
                            
                            //console.log('semi-colon');
                            autocompleteKeyEvent = 'semi-colon';
                            
                        }
                    } else {
                        //console.log('snippets');
                        
                        var strScript, intCursorPosition, intStartCursorPosition;
                    
                        // get full script
                        strScript = editor.getValue();
                        
                        // get event cursor position start/end
                        intStartCursorPosition = rowAndColumnToIndex(strScript, event.start.row, event.start.column);
                        intCursorPosition = intStartCursorPosition;
                        
                        var currWord = [];
                        for (var i = 0, len = intCursorPosition; i <= len; i++) {
                            if (isAlpha(strScript[intCursorPosition - i]) || strScript[intCursorPosition - i] === '_') {
                                if (currWord === []) {
                                    currWord = strScript[intCursorPosition - i].toLowerCase()
                                } else {
                                    currWord.push(strScript[intCursorPosition - i].toLowerCase());
                                }
                            } else if (currWord !== []) {
                                break;
                            }
                        }
                    
                        currWord = currWord.reverse();
                        currWord = currWord.join('');
                        
                        autocompleteGlobals.searchLength = currWord.length;
                        
                        if (currWord && (isAlpha(event.lines) || event.lines === '_') && autocompleteGlobals.popupOpen) {
                            autocompleteKeyEvent = 'snippets_filter';
                        } else if (event.lines[0] === '"' || event.lines[0] === "'") {
                            
                            //console.log('quote');
                            autocompleteKeyEvent = 'quote';
                            
                        } else if (event.lines[0] === '/' || event.lines[0] === '\\') {
                            
                            //console.log('slash');
                            autocompleteKeyEvent = 'slash';
                            
                        } else if (event.lines[0] === ',') {
                            
                            //console.log('comma');
                            autocompleteKeyEvent = 'comma';
                            
                        } else if (event.lines[0] === '.') {
                            
                            //console.log('comma');
                            autocompleteKeyEvent = 'comma';
                            
                        } else if (event.lines[0] === ':') {
                            
                            //console.log('colon');
                            autocompleteKeyEvent = 'colon';
                            
                        } else if (event.lines[0] === ' ') {
                            
                            //console.log('space');
                            autocompleteKeyEvent = 'space';
                            
                        } else if (event.lines[0] === ';') {
                            
                            //console.log('semi-colon');
                            autocompleteKeyEvent = 'semi-colon';
                            
                        } else if (event.lines[0] === '(' || event.lines[0] === ')') {
                            
                            //console.log('parenthesis');
                            autocompleteKeyEvent = 'parenthesis';
                            
                        } else {
                            autocompleteKeyEvent = 'snippets';
                        }
                    }
                } else {
                    //console.log('paste');
                    autocompleteKeyEvent = 'paste';
                }
            } else {
                //console.log('delete');
                autocompleteKeyEvent = 'delete';
            }
            
            if (editor.currentSelections) {
            var selectionRanges = editor.currentSelections[0];
            
            }
            
            if (autocompleteGlobals.popupOpen && autocompleteKeyEvent === 'alpha_numeric' || autocompleteKeyEvent === 'snippets_filter') {
                var strScript, intCursorPosition, intStartCursorPosition;
            
                // get full script
                strScript = editor.getValue();
                
                // get event cursor position start/end
                intStartCursorPosition = rowAndColumnToIndex(strScript, event.start.row, event.start.column);
                intCursorPosition = intStartCursorPosition;
                
                var currWord = [];
                for (var i = 0, len = intCursorPosition; i <= len; i++) {
                    if (isAlpha(strScript[intCursorPosition - i]) || strScript[intCursorPosition - i] === '_') {
                        if (currWord === []) {
                            currWord = strScript[intCursorPosition - i].toLowerCase()
                        } else {
                            currWord.push(strScript[intCursorPosition - i].toLowerCase());
                        }
                    } else if (currWord !== []) {
                        break;
                    }
                }
            
                currWord = currWord.reverse();
                currWord = currWord.join('');
                
                autocompleteGlobals.searchLength = currWord.length;
                
                if (editor.currentSelections && editor.currentSelections.length > 1) {
                    if (
                        selectionRanges.start.row === event.start.row &&
                        selectionRanges.start.column === event.start.column &&
                        selectionRanges.end.row === event.end.row &&
                        selectionRanges.end.column + 1 === event.end.column
                    ) {
                        autocompleteFilterList(autocompleteGlobals.arrValues, currWord, editor);
                        //console.log('running');
                    }
                } else {
                    autocompleteFilterList(autocompleteGlobals.arrValues, currWord, editor);
                }
                
                //autocompleteFilterList(autocompleteGlobals.arrValues, currWord, editor);
            } else {
                if (editor.currentSelections && editor.currentSelections.length > 1) {
                    if (
                        selectionRanges.start.row === event.start.row &&
                        selectionRanges.start.column === event.start.column &&
                        selectionRanges.end.row === event.end.row &&
                        selectionRanges.end.column + 1 === event.end.column
                    ) {
                        autocompleteLogic(editor, autocompleteKeyEvent, event);
                    }
                } else {
                    autocompleteLogic(editor, autocompleteKeyEvent, event);
                }
                //autocompleteLogic(editor, autocompleteKeyEvent, event);
            }
        }
        
        if (autocompleteKeyEvent !== 'delete' && autocompleteKeyEvent && autocompleteGlobals.ignoreNext > 0 || autocompleteGlobals.ignoreNext > 0) {
            autocompleteGlobals.ignoreNext -= 1;
        }
        
        
    });
}

function autocompleteLogic(editor, autocompleteKeyEvent, event) {
    "use strict";
     queryVars = {
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
    };
    
    var strScript, intCursorPosition, currentQueryRange, i, len
      , intStart, intEnd, strChar, strSearchQuery, jsnPrefix, strPreviousWord
      , strList, intPreviousWordEnd, arrQueries = []
      , intEndCursorPosition, strPreviousKeyWord, arrPreviousKeyWords
      , arrContextLists, strQueryType, arrPrefix, strSearch, intParenLevel
      , arrPreviousWords, intStartCursorPosition, arrFirstWords
      , strCurrentWord, strCurrentLine, bolAfterComma
      , intOpenParen, intCloseParen, intVersion = parseFloat(contextData.minorVersionNumber, 10);

    // get current query range
    currentQueryRange = editor.currentQueryRange;

    // get full script
    strScript = editor.getValue();
    
    // get event cursor position start/end
    intStartCursorPosition = rowAndColumnToIndex(strScript, event.start.row, event.start.column);
    intEndCursorPosition = rowAndColumnToIndex(strScript, event.end.row, event.end.column);
    intCursorPosition = intStartCursorPosition;
    
    if (autocompleteKeyEvent !== 'delete') {
        var currWord = [];
        for (var i = 0, len = intCursorPosition; i <= len; i++) {
            //console.log(strScript[0]);
            if (isAlpha(strScript[intCursorPosition - i]) || strScript[intCursorPosition - i] === '_') {
                if (currWord === []) {
                    currWord = strScript[intCursorPosition - i].toLowerCase()
                } else {
                    currWord.push(strScript[intCursorPosition - i].toLowerCase());
                }
            } else if (currWord !== []) {
                break;
            }
        }
        
        currWord = currWord.reverse();
        currWord = currWord.join('');
        
        autocompleteGlobals.searchLength = currWord.length;
    }
    
    autocompleteGlobals.bolAlpha = false;
    
    if (autocompleteKeyEvent === 'alpha_numeric') {

        autocompleteGlobals.bolAlpha = true;

        // extract the current query and subtract from intCursorPosition (because the script will get smaller)
        intStart           = rowAndColumnToIndex(strScript, currentQueryRange.start.row, currentQueryRange.start.column);
        strScript          = strScript.substring(intStart, intEndCursorPosition + 1); //intCursorPosition + 1
        intCursorPosition -= intStart;


        // remove comments from the current query
        strScript = consumeComments(strScript);
    
        // make a search query by trimming it the current query and uppercasing it
        strSearchQuery = strScript.trim().toUpperCase();
    
        // get parenthesis level of cursor
        intParenLevel = currentQueryRange.intParenLevel;
    
        // get number of parenthesis
        intOpenParen = (strScript.match(/\(/gi) || []).length;
        intCloseParen = (strScript.match(/\)/gi) || []).length;
    
        // get from cursor to beginning of current line
        i = ((intEndCursorPosition - intStart) - 1);
        strCurrentLine = '';
    
        // get the current line text
        while (i > -1) {
            if (strScript[i] === '\n') { break; }
            strCurrentLine = (strScript[i] + strCurrentLine);
            i -= 1;
        }
    
        // get the previous keywords and the previous word
        i = (intCursorPosition - 1);
        intStart = null;
        intEnd = null;
        arrPreviousWords = [];
        arrPreviousKeyWords = [];
    
        // while we don't have 5 previous keywords and i is greater than the current query start
        while (arrPreviousKeyWords.length < 6 && i > -1) {
            strChar = strScript[i] || '';
    
            // if we havn't found the previous word end yet and the current character is not whitespace or null
            if (intEnd === null && strChar.trim() !== '') {
                // we've found the previous word end: save it
                intEnd = i + 1;
    
            // if we've found the previous word end but not the start and the current character is whitespace or null
            } else if (intStart === null && intEnd !== null && (strChar.trim() === '' || strScript[i] === '(')) {
                // we've found the previous word start: save it
                intStart = i + 1;
                
            // if we've found the previous word end but not the start and we've reached the first character of the query
            } else if (intStart === null && intEnd !== null && i === 0) {
                // we've found the previous word start: save it
                intStart = i;
            }
            
            if (intStart !== null && intEnd !== null) {
                strCurrentWord = strScript.substring(intStart, intEnd).toUpperCase();
                
                arrPreviousWords.push(strCurrentWord);
                
                strCurrentWord = strCurrentWord.replace(/[\,\(]/gi, '');
                
                // if the current word is in the keyword list: add to keyword array
                if (autocompleteGlobals.jsnKeywords.all.indexOf(strCurrentWord.toLowerCase()) !== -1) {
                    arrPreviousKeyWords.push(strCurrentWord);
                }
                
                // clear variables for next cycle
                intStart = null;
                intEnd = null;
            }

            i -= 1;
        }

        // get first 5 words
        i = 0;
        len = strScript.length;
        intStart = null;
        intEnd = null;
        arrFirstWords = [];

        while (arrFirstWords.length < 6 && i <= len) {
            strChar = strScript[i] || '';

            // if we havn't found the previous word start yet and the current character is not whitespace or null
            if (intStart === null && strChar.trim() !== '') {
                intStart = i;

            // if we've found the previous word start but not the end and the current character is whitespace or null
            } else if (intEnd === null && intStart !== null && (strChar.trim() === '' || strScript[i] === '(')) {
                intEnd = i;

            // if we've found the previous word start but not the end and we've reached the last character of the query
            } else if (intEnd === null && intStart !== null && i === len) {
                intEnd = i;
            }

            if (intEnd !== null && intStart !== null) {
                strCurrentWord = strScript.substring(intEnd, intStart).toUpperCase();
                arrFirstWords.push(strCurrentWord);

                // clear variables for next cycle
                intEnd = null;
                intStart = null;
            }

            i += 1;
        }
        strPreviousKeyWord = arrPreviousKeyWords[0];
        strPreviousWord = arrPreviousWords[0];
        
        if (strPreviousWord) {
            bolAfterComma = (strPreviousWord[strPreviousWord.length - 1] === ',');
        }

        if (arrPreviousKeyWords[1] === 'INSERT' && strPreviousKeyWord === 'INTO') {
            //console.log('schema');
            queryVars.bolSchemas = true;
        } else if ((/^INSERT/gi).test(strSearchQuery) && strPreviousKeyWord === 'TO') {
            //console.log('schema');
            queryVars.bolSchemas = true;
        } else if ((/(UPDATE|VIEW|SEQUENCE|FUNCTION|AGGREGATE|COLLATION|CONVERSION|DOMAIN|INDEX|CLASS|FAMILY|OPERATOR|CONFIGURATION|DICTIONARY|PARSER|TEMPLATE|TYPE|ANALYZE|VACUUM|WHEN|SCHEMA|HANDLER|VALIDATOR|ABORT|CHECKPOINT|CLOSE|CLUSTER|COMMENT|COMMIT|COPY|CREATE|DEALLOCATE|DELETE|DISCARD|DO|DROP|EXECUTE|EXPLAIN|FETCH|INSERT|LISTEN|LOAD|LOCK|MOVE|NOTIFY|PREPARE|REASSIGN|REFRESH|REINDEX|RELEASE|RESET|ROLLBACK|SAVEPOINT|SECURITY|SHOW|START|TRUNCATE|UNLISTEN)/i).test(strPreviousKeyWord)) {
            //console.log('schemas');
            queryVars.bolSchemas = true;
        } else if (arrPreviousKeyWords[4] === 'REVOKE' && strPreviousKeyWord === 'FROM') {
            //console.log('groups, users');
            queryVars.bolGroups = true;
            queryVars.bolUsers = true;
        } else if (arrPreviousKeyWords[1] === 'ALTER') {
            //console.log('schemas');
            queryVars.bolSchemas = true;
        } else if (strPreviousKeyWord === 'REVOKE') {
            //console.log('groups');
            queryVars.bolGroups = true;
        } else if (strPreviousKeyWord === 'FROM') {
            if (strScript.indexOf('.') > strScript.indexOf('FROM')) {
                queryVars.bolTables = true;
            } else {
                //console.log('schemas');
                queryVars.bolSchemas = true;
            }
        } else if (arrPreviousKeyWords[4] === 'REVOKE' && strPreviousKeyWord === 'ON') {
            //console.log('schema');
            queryVars.bolSchemas = true;
        } else if (arrPreviousKeyWords[1] === 'UPDATE' || arrPreviousKeyWords[1] === 'DELETE' && strPreviousKeyWord === 'TO') {
            //console.log('schemas');
            queryVars.bolSchemas = true;
        } else if (strPreviousKeyWord === 'TABLESPACE') {
            //console.log('tablespace');
            queryVars.bolTablespace = true;
        } else if (arrPreviousKeyWords[1] === 'ORDER' && strPreviousKeyWord === 'BY') {
            //console.log('tables');
            queryVars.bolTables = true;
        } else if (arrPreviousKeyWords[1] === 'OWNER' && strPreviousKeyWord === 'TO') {
            //console.log('groups, users');
            queryVars.bolGroups = true;
            queryVars.bolUsers = true;
        } else if (arrPreviousKeyWords[2] === 'ON' && strPreviousKeyWord === 'TO') {
            //console.log('groups, users');
            queryVars.bolGroups = true;
            queryVars.bolUsers = true;
        } else if (strPreviousKeyWord === 'JOIN' && !bolAfterComma && strScript[intCursorPosition - (strPreviousWord.length + 2)] !== ',') {
            //console.log('schemas');
            queryVars.bolSchemas = true;
        } else if (strPreviousKeyWord === 'SET') {
            //console.log('columns');
            queryVars.bolCols = true;
        } else if (strScript[intCursorPosition - (strPreviousWord.length + 2)] === ',' || bolAfterComma && strPreviousKeyWord === 'VALUES') {
            queryVars.bolCols = true;
            queryVars.bolBuiltins = true;
        } else if (strScript[intCursorPosition - (strPreviousWord.length + 2)] === ',' || bolAfterComma && strPreviousKeyWord === 'SET') {
            queryVars.bolCols = true;
        } else if (strScript[intCursorPosition - (strPreviousWord.length + 2)] === ',' || bolAfterComma && strPreviousKeyWord === 'SELECT') {
            queryVars.bolCols = true;
            queryVars.bolTables = true;
            queryVars.bolBuiltins = true;
        } else if (strScript[intCursorPosition - (strPreviousWord.length + 2)] === ',' || bolAfterComma) {
            queryVars.bolSchemas = true;
        } else if (arrPreviousKeyWords[2] === 'ALL' && arrPreviousKeyWords[1] === 'ON' && strPreviousKeyWord === 'FUNCTION') {
            //console.log('schemas');
            queryVars.bolSchemas = true;
        } else if (arrPreviousKeyWords[1] === 'ALL' && strPreviousKeyWord === 'ON') {
            //console.log('schemas');
            queryVars.bolSchemas = true;
        } else if (strPreviousKeyWord === 'ON') {
            //console.log('tables, table-functions');
            queryVars.bolTables = true;
            queryVars.bolTableFuncs = true;
        } else if ((/^SELECT/gi).test(strSearchQuery)) {
            //console.log('columns, tables, builtins');
            queryVars.bolCols = true;
            queryVars.bolTables = true;
            queryVars.bolBuiltins = true;
            //console.log(arrQueries);
        } else if (strPreviousKeyWord === 'TABLE') {
            //console.log('schemas');
            queryVars.bolSchemas = true;
        } else if (strPreviousKeyWord === 'RULE') {
            //console.log('rules');
            queryVars.bolRules = true;
            //arrQueries = [autocompleteQuery.rules];
        } else if (strPreviousKeyWord === 'GRANT') {
            //console.log('groups');
            queryVars.bolGroups = true;
        } else if (strPreviousKeyWord === 'WHERE') {
            //console.log('tables, columns, builtins');
            queryVars.bolTables = true;
            queryVars.bolCols = true;
            queryVars.bolBuiltins = true;
        } else if (strPreviousKeyWord === 'RETURNS') {
            //console.log('returntypes');
            queryVars.bolReturnTypes = true;
        } else if (strPreviousKeyWord === 'LANGUAGE') {
            //console.log('language');
            queryVars.bolLanguages =true;
        } else if (strPreviousKeyWord === 'CAST') {
            //console.log('types');
            queryVars.bolTypes = true;
        } else if (arrPreviousKeyWords[1] === 'CAST' && strPreviousKeyWord === 'AS') {
            //console.log('types');
            queryVars.bolTypes = true;
        } else if (strPreviousKeyWord === 'VALUES') {
            //console.log('columns, functions');
            queryVars.bolCols = true;
            queryVars.bolBuiltins = true;
        } else {
            queryVars.bolSchemas = true;
        }
        
        if (queryVars.bolCols) {
           arrQueries = [autocompleteQuery.allcolumns];
        } if (queryVars.bolTables) {
            arrQueries.push(autocompleteQuery.tables.replace(/\{\{CATALOG}\}/gi, CATALOG_id).replace(/\{\{TOAST}\}/gi, TOAST_id), autocompleteQuery.views.replace(/\{\{CATALOG}\}/gi, CATALOG_id).replace(/\{\{TOAST}\}/gi, TOAST_id));
        } if (queryVars.bolSchemas) {
            arrQueries.push(autocompleteQuery.schemas);
        } if (queryVars.bolTableFuncs) {
            arrQueries.push(autocompleteQuery.tableFunctions);
        } if (queryVars.bolBuiltins) {
            arrQueries.push(autocompleteQuery.funcSnippets);//builtIns);
        } if (queryVars.bolGroups) {
            arrQueries.push(autocompleteQuery.groups);
        } if (queryVars.bolUsers) {
            arrQueries.push(autocompleteQuery.logins);
        } if (queryVars.bolReturnTypes) {
            arrQueries.push(autocompleteQuery.returnTypes);
        } if (queryVars.bolTypes) {
            arrQueries.push(autocompleteQuery.types2); 
        } if (queryVars.bolLanguages) {
            arrQueries.push(autocompleteQuery.language); 
        } if (queryVars.bolRules) {
            arrQueries.push(autocompleteQuery.rules);
        } if (queryVars.bolTablespace) {
            arrQueries.push(autocompleteQuery.tablespace);
        }
        
        for (var i = 0, len = arrQueries.length; i < len; i++) {
            arrQueries[i] = arrQueries[i].replace((/\{\{searchStr}\}/gi), currWord.toLowerCase() + '%');
        }
        //console.log(currWord);
        autocompleteMakeList(arrQueries, currWord, editor);
    } else if (autocompleteKeyEvent === 'quote') {
        closePopup();
    } else if (autocompleteKeyEvent === 'slash') {
        closePopup();
    } else if (autocompleteKeyEvent === 'comma') {
        closePopup();
    } else if (autocompleteKeyEvent === 'period') {
        closePopup();

        // get current query range
        currentQueryRange = editor.currentQueryRange;
    
        // get full script
        strScript = editor.getValue();
        
        // get event cursor position start/end
        intStartCursorPosition = rowAndColumnToIndex(strScript, event.start.row, event.start.column);
        intEndCursorPosition = rowAndColumnToIndex(strScript, event.end.row, event.end.column);
        intCursorPosition = intStartCursorPosition;        
        
        autocompleteGlobals.bolAlpha = false;
        
        autocompleteGlobals.bolSnippets = false;
        // get prefixes
        jsnPrefix = autocompleteGetPrefix(strScript, intCursorPosition + 1);
        arrPrefix = jsnPrefix.arrStrings;
        
        // remove comments from the current query
        var strSearchQuery = consumeComments(strScript);

        // make a search query by trimming it the current query and uppercasing it
        strSearchQuery = strScript.trim().toUpperCase();

        // extract the current query and subtract from intCursorPosition (because the script will get smaller)
        intStart           = rowAndColumnToIndex(strScript, currentQueryRange.start.row, currentQueryRange.start.column);
        strScript          = strScript.substring(intStart, intEndCursorPosition + 1); //intCursorPosition + 1
        intCursorPosition -= intStart;


        // remove comments from the current query
        strScript = consumeComments(strScript);
    
        // make a search query by trimming it the current query and uppercasing it
        strSearchQuery = strScript.trim().toUpperCase();
    
        // get parenthesis level of cursor
        intParenLevel = currentQueryRange.intParenLevel;
    
        // get number of parenthesis
        intOpenParen = (strScript.match(/\(/gi) || []).length;
        intCloseParen = (strScript.match(/\)/gi) || []).length;
    
        // get from cursor to beginning of current line
        i = ((intEndCursorPosition - intStart) - 1);
        strCurrentLine = '';
    
        // get the current line text
        while (i > -1) {
            if (strScript[i] === '\n') { break; }
            strCurrentLine = (strScript[i] + strCurrentLine);
            i -= 1;
        }
    
        // get the previous keywords and the previous word
        i = (intCursorPosition - 1);
        intStart = null;
        intEnd = null;
        arrPreviousWords = [];
        arrPreviousKeyWords = [];
    
        // while we don't have 5 previous keywords and i is greater than the current query start
        while (arrPreviousKeyWords.length < 6 && i > -1) {
            strChar = strScript[i] || '';
    
            // if we havn't found the previous word end yet and the current character is not whitespace or null
            if (intEnd === null && strChar.trim() !== '') {
                // we've found the previous word end: save it
                intEnd = i + 1;
    
            // if we've found the previous word end but not the start and the current character is whitespace or null
            } else if (intStart === null && intEnd !== null && (strChar.trim() === '' || strScript[i] === '(')) {
                // we've found the previous word start: save it
                intStart = i + 1;
                
            // if we've found the previous word end but not the start and we've reached the first character of the query
            } else if (intStart === null && intEnd !== null && i === 0) {
                // we've found the previous word start: save it
                intStart = i;
            }
            
            if (intStart !== null && intEnd !== null) {
                strCurrentWord = strScript.substring(intStart, intEnd).toUpperCase();
                
                arrPreviousWords.push(strCurrentWord);
                
                strCurrentWord = strCurrentWord.replace(/[\,\(]/gi, '');
                
                // if the current word is in the keyword list: add to keyword array
                if (autocompleteGlobals.jsnKeywords.all.indexOf(strCurrentWord.toLowerCase()) !== -1) {
                    arrPreviousKeyWords.push(strCurrentWord);
                }
                
                // clear variables for next cycle
                intStart = null;
                intEnd = null;
            }

            i -= 1;
        }

        // get first 5 words
        i = 0;
        len = strScript.length;
        intStart = null;
        intEnd = null;
        arrFirstWords = [];

        while (arrFirstWords.length < 6 && i <= len) {
            strChar = strScript[i] || '';

            // if we havn't found the previous word start yet and the current character is not whitespace or null
            if (intStart === null && strChar.trim() !== '') {
                intStart = i;

            // if we've found the previous word start but not the end and the current character is whitespace or null
            } else if (intEnd === null && intStart !== null && (strChar.trim() === '' || strScript[i] === '(')) {
                intEnd = i;

            // if we've found the previous word start but not the end and we've reached the last character of the query
            } else if (intEnd === null && intStart !== null && i === len) {
                intEnd = i;
            }

            if (intEnd !== null && intStart !== null) {
                strCurrentWord = strScript.substring(intEnd, intStart).toUpperCase();
                arrFirstWords.push(strCurrentWord);

                // clear variables for next cycle
                intEnd = null;
                intStart = null;
            }

            i += 1;
        }
        strPreviousKeyWord = arrPreviousKeyWords[0];
        strPreviousWord = arrPreviousWords[0];
        
        
        
        //console.log('1***', JSON.stringify(arrPrefix));
        
        // if we have more than zero prefix elements
        if (arrPrefix.length > 0) {
            // these are set outside the websocket call because they might
            //      be overridden during the wait for the socket response
            autocompleteGlobals.intSearchStart = intStartCursorPosition;
            autocompleteGlobals.intSearchEnd = intEndCursorPosition;
            autocompleteGlobals.intSearchOffset = 1;
            
            // if there's only one prefix element: it could be a schema, table or view name
            if (arrPrefix.length === 1) {
                // we need to handle aliases
                autocompleteGetObjectType(arrPrefix[0]
                                        , [
                                              autocompleteSearchQuery.schema
                                            , autocompleteSearchQuery.table
                                            , autocompleteSearchQuery.view
                                          ]
                                        , function (arrResults) {
                    var currentChoice, i, len, arrQueries;
                    
                    if (arrResults.length > 0) {
                        // search through choices, stop if we find a schema
                        for (i = 0, len = arrResults.length; i < len; i += 1) {
                            currentChoice = arrResults[i];
                            if (currentChoice[2] === 'schema') { break; }
                        }
                        
                        // if we found a schema: waterfall for queries
                        if (currentChoice[2] === 'schema') {
                            // insert query
                            if ((/^INSERT/gi).test(strSearchQuery)) {
                                if (strPreviousKeyWord === 'RETURNING') {
                                    arrQueries = [autocompleteQuery.qualified_functions
                                                , autocompleteQuery.qualified_tables
                                                , autocompleteQuery.qualified_views];
                                } else if (strPreviousKeyWord === 'FROM' || strPreviousKeyWord === 'SELECT') {
                                    arrQueries = [autocompleteQuery.qualified_tables, autocompleteQuery.qualified_views];
                                } else if (strPreviousKeyWord === 'VALUES') {
                                    arrQueries = [autocompleteQuery.qualified_functions];
                                } else if (strPreviousKeyWord === 'INTO') {
                                    arrQueries = [autocompleteQuery.qualified_tables, autocompleteQuery.qualified_views];
                                }
                                
                            // table query
                            } else if ((/^TABLE/gi).test(strSearchQuery)) {
                                arrQueries = [autocompleteQuery.qualified_tables];
                                
                            // select query
                            } else if ((/^SELECT|VALUES/gi).test(strSearchQuery)) {
                                // after ORDER BY or PARTITION BY: functions, aggregates, tables and views
                                if ((arrPreviousKeyWords[1] === 'ORDER' && strPreviousKeyWord === 'BY') ||
                                    (arrPreviousKeyWords[1] === 'PARTITION' && strPreviousKeyWord === 'BY')) {
                                    arrQueries = [autocompleteQuery.qualified_functions
                                                , autocompleteQuery.qualified_aggregates
                                                , autocompleteQuery.qualified_tables
                                                , autocompleteQuery.qualified_views];
                                    
                                // after HAVING or GROUP BY: functions and aggregates
                                } else if (strPreviousKeyWord === 'HAVING'
                                        || (arrPreviousKeyWords[1] === 'GROUP' && strPreviousKeyWord === 'BY')) {
                                    arrQueries = [autocompleteQuery.qualified_functions
                                                , autocompleteQuery.qualified_aggregates];
                                    
                                // after WHERE: functions, aggregates, tables and views
                                } else if (strPreviousKeyWord === 'WHERE') {
                                    arrQueries = [autocompleteQuery.qualified_functions
                                                , autocompleteQuery.qualified_aggregates
                                                , autocompleteQuery.qualified_tables
                                                , autocompleteQuery.qualified_views];
                                    
                                // after ON: functions, tables and views
                                } else if (strPreviousKeyWord === 'ON') {
                                    arrQueries = [autocompleteQuery.qualified_functions
                                                , autocompleteQuery.qualified_tables
                                                , autocompleteQuery.qualified_views];
                                    
                                // after FROM or JOIN: tables, views and functions
                                } else if (strPreviousKeyWord === 'FROM' || strPreviousKeyWord === 'JOIN') {
                                    arrQueries = [autocompleteQuery.qualified_tables
                                                , autocompleteQuery.qualified_views
                                                , autocompleteQuery.qualified_functions];
                                    
                                // after SELECT, ALL or DISTINCT: functions, aggregates, tables and views
                                } else if ((/(SELECT|ALL|DISTINCT)/gi).test(strPreviousKeyWord)) {
                                    arrQueries = [autocompleteQuery.qualified_functions
                                                , autocompleteQuery.qualified_aggregates
                                                , autocompleteQuery.qualified_tables
                                                , autocompleteQuery.qualified_views];
                                }
                                
                            // update query
                            } else if ((/^UPDATE/gi).test(strSearchQuery)) {
                                // after RETURNING or WHERE: functions, tables and views
                                if (strPreviousKeyWord === 'RETURNING' || strPreviousKeyWord === 'WHERE') {
                                    arrQueries = [autocompleteQuery.qualified_functions
                                                , autocompleteQuery.qualified_tables
                                                , autocompleteQuery.qualified_views];
                                    
                                // after FROM: tables, views and functions
                                } else if (strPreviousKeyWord === 'FROM') {
                                    arrQueries = [autocompleteQuery.qualified_tables
                                                , autocompleteQuery.qualified_views
                                                , autocompleteQuery.qualified_functions];
                                    
                                // after SET: functions
                                } else if (strPreviousKeyWord === 'SET') {
                                    arrQueries = [autocompleteQuery.qualified_functions];
                                    
                                // after UPDATE or ONLY: tables and views
                                } else if ((/(UPDATE|ONLY)/gi).test(strPreviousKeyWord)) {
                                    arrQueries = [autocompleteQuery.qualified_tables
                                                , autocompleteQuery.qualified_views];
                                }
                                
                            // delete query
                            } else if ((/^DELETE/gi).test(strSearchQuery)) {
                                // after RETURNING: functions, tables and views
                                if (strPreviousKeyWord === 'RETURNING') {
                                    arrQueries = [autocompleteQuery.qualified_functions
                                                , autocompleteQuery.qualified_tables
                                                , autocompleteQuery.qualified_views];
                                    
                                // after WHERE: functions, aggregates, tables and views
                                } else if (strPreviousKeyWord === 'WHERE') {
                                    arrQueries = [autocompleteQuery.qualified_functions
                                                , autocompleteQuery.qualified_aggregates
                                                , autocompleteQuery.qualified_tables
                                                , autocompleteQuery.qualified_views];
                                    
                                // after USING, FROM or ONLY: tables, views and functions
                                } else if (strPreviousKeyWord === 'USING'
                                        || strPreviousKeyWord === 'FROM'
                                        || strPreviousKeyWord === 'ONLY') {
                                    arrQueries = [autocompleteQuery.qualified_tables
                                                , autocompleteQuery.qualified_views
                                                , autocompleteQuery.qualified_functions];
                                }
                                
                            } else if ((/^(CREATE\s*AGGREGATE)/gi).test(strSearchQuery)) {
                                if ((/FUNC\=$/gi).test(arrPreviousWords[2] + arrPreviousWords[1])) {
                                    arrQueries = [autocompleteQuery.qualified_functions];
                                }
                                
                            } else if ((/^(CREATE\s*CONVERSION|CREATE\s*DEFAULT\s*CONVERSION)/gi).test(strSearchQuery)) {
                                if (strPreviousKeyWord === 'FROM') {
                                    arrQueries = [autocompleteQuery.qualified_functions];
                                }
                                
                            } else if ((/^(CREATE\s*EVENT\s*TRIGGER)/gi).test(strSearchQuery)) {
                                if (strPreviousKeyWord === 'PROCEDURE') {
                                    arrQueries = [autocompleteQuery.qualified_functions];
                                }
                                
                            } else if ((/^(CREATE\s*FOREIGN\s*DATA\s*WRAPPER)/gi).test(strSearchQuery)) {
                                arrQueries = [autocompleteQuery.qualified_functions];
                                
                            } else if ((/^(CREATE\s*INDEX|CREATE\s*UNIQUE\s*INDEX)/gi).test(strSearchQuery)) {
                                if (strPreviousKeyWord === 'ON') {
                                    arrQueries = [autocompleteQuery.qualified_tables];
                                }
                                
                            } else if ((/^(CREATE[\sa-z]*LANGUAGE)/gi).test(strSearchQuery)) {
                                arrQueries = [autocompleteQuery.qualified_functions];
                                
                            } else if ((/^(CREATE\s*POLICY)/gi).test(strSearchQuery)) {
                                if (strPreviousKeyWord === 'ON') {
                                    arrQueries = [autocompleteQuery.qualified_tables];
                                }
                                
                            } else if ((/^(CREATE\s*RULE|CREATE\s*OR\s*REPLACE\s*RULE)/gi).test(strSearchQuery)) {
                                if (strPreviousKeyWord === 'TO') {
                                    arrQueries = [autocompleteQuery.qualified_tables];
                                }
                                
                            } else if ((/^(CREATE\s*SEQUENCE|CREATE\s*TEMP\s*SEQUENCE|CREATE\s*TEMPORARY\s*SEQUENCE)/gi).test(strSearchQuery)) {
                                if (strPreviousKeyWord === 'BY') {
                                    arrQueries = [autocompleteQuery.qualified_tables];
                                }
                                
                            } else if ((/^(CREATE[\sa-z]*TABLE)/gi).test(strSearchQuery)) {
                                if (strPreviousKeyWord === 'LIKE'
                                    || strPreviousKeyWord === 'INHERITS'
                                    || strPreviousKeyWord === 'REFERENCES') {
                                    arrQueries = [autocompleteQuery.qualified_tables];
                                }
                                
                            } else if ((/^(CREATE\s*TEXT\s*SEARCH\s*CONFIGURATION)/gi).test(strSearchQuery)) {
                                if (strPreviousKeyWord === 'PARSER') {
                                    arrQueries = [autocompleteQuery.qualified_text_search_parsers];
                                    
                                } else if (strPreviousKeyWord === 'COPY') {
                                    arrQueries = [autocompleteQuery.qualified_text_search_configurations];
                                }
                                
                            } else if ((/^(CREATE\s*TEXT\s*SEARCH\s*DICTIONARY)/gi).test(strSearchQuery)) {
                                if (strPreviousKeyWord === 'TEMPLATE') {
                                    arrQueries = [autocompleteQuery.qualified_text_search_templates];
                                }
                                
                            } else if ((/^(CREATE\s*TEXT\s*SEARCH\s*PARSER)/gi).test(strSearchQuery)) {
                                if ((/(START|GETTOKEN|END|LEXTYPES|HEADLINE)\=$/gi).test(arrPreviousWords[2] + arrPreviousWords[1])) {
                                    arrQueries = [autocompleteQuery.qualified_functions];
                                }
                                
                            } else if ((/^(CREATE\s*TEXT\s*SEARCH\s*TEMPLATE)/gi).test(strSearchQuery)) {
                                if ((/(INIT|LEXIZE)\=$/gi).test(arrPreviousWords[2] + arrPreviousWords[1])) {
                                    arrQueries = [autocompleteQuery.qualified_functions];
                                }
                                
                            } else if ((/^(CREATE\s*TRANSFORM|CREATE\s*OR\s*REPLACE\s*TRANSFORM)/gi).test(strSearchQuery)) {
                                if (strPreviousKeyWord === 'FUNCTION') {
                                    arrQueries = [autocompleteQuery.qualified_functions];
                                }
                                
                            } else if ((/^(CREATE\s*TRIGGER|CREATE\s*CONSTRAINT\s*TRIGGER)/gi).test(strSearchQuery)) {
                                if (strPreviousKeyWord === 'ON' || strPreviousKeyWord === 'FROM') {
                                    arrQueries = [autocompleteQuery.qualified_tables];
                                    
                                } else if (strPreviousKeyWord === 'PROCEDURE') {
                                    arrQueries = [autocompleteQuery.qualified_functions];
                                }
                                
                            } else if ((/^(CREATE\s*TYPE)/gi).test(strSearchQuery)) {
                                if ((/(SUBTYPE_OPCLASS)\=$/gi).test(arrPreviousWords[2] + arrPreviousWords[1])) {
                                    arrQueries = [autocompleteQuery.qualified_operator_classes];
                                    
                                } else if ((/(CANONICAL|SUBTYPE_DIFF|INPUT|OUTPUT|RECEIVE|SEND|TYPMOD_IN|TYPMOD_OUT|ANALYZE)\=$/gi)
                                                .test(arrPreviousWords[2] + arrPreviousWords[1])) {
                                    arrQueries = [autocompleteQuery.qualified_functions];
                                }
                                
                            // drop or alter query
                            } else if ((/^(ALTER\s*TEXT\s*SEARCH\s*CONFIGURATION)/gi).test(strSearchQuery)) {
                                if (arrPreviousKeyWords[1] === 'SEARCH' && strPreviousKeyWord === 'CONFIGURATION') {
                                    arrQueries = [autocompleteQuery.qualified_text_search_configurations];
                                    
                                } else if (strPreviousKeyWord === 'REPLACE') {
                                    arrQueries = [autocompleteQuery.qualified_text_search_dictionaries];
                                    
                                } else if (autocompleteSearchBackForWord(strScript, intCursorPosition, 'WITH')) {
                                    arrQueries = [autocompleteQuery.qualified_text_search_dictionaries];
                                }
                                
                            } else if ((/^(CREATE\s*OPERATOR\s*CLASS)/gi).test(strSearchQuery)) {
                                if (arrPreviousWords.indexOf('OPERATOR') < 5 && arrPreviousWords.indexOf('OPERATOR') > -1
                                    && autocompleteSearchBackForWord(strScript, intCursorPosition, 'TYPE')) {
                                    arrQueries = [autocompleteQuery.qualified_operators];
                                } else if (arrPreviousWords.indexOf('FUNCTION') < 5 && arrPreviousWords.indexOf('FUNCTION') > -1
                                    && autocompleteSearchBackForWord(strScript, intCursorPosition, 'TYPE')) {
                                    arrQueries = [autocompleteQuery.qualified_functions];
                                }
                                
                            } else if ((/^(CREATE\s*OPERATOR)/gi).test(strSearchQuery)) {
                                if ((/(PROCEDURE|JOIN|RESTRICT)\=$/gi).test(arrPreviousWords[2] + arrPreviousWords[1])) {
                                    arrQueries = [autocompleteQuery.qualified_functions];
                                } else if ((/(COMMUTATOR|NEGATOR)\=$/gi).test(arrPreviousWords[2] + arrPreviousWords[1])) {
                                    arrQueries = [autocompleteQuery.qualified_operators];
                                }
                                
                            // drop or alter query
                            } else if ((/^(DROP|ALTER|COMMENT|SECURITY\s*LABEL|CREATE)/gi).test(strSearchQuery)) {
                                if (strPreviousKeyWord === 'AGGREGATE') {
                                    arrQueries = [autocompleteQuery.qualified_aggregates];
                                } else if (strPreviousKeyWord === 'CONVERSION') {
                                    arrQueries = [autocompleteQuery.qualified_conversions];
                                } else if (strPreviousKeyWord === 'CONSTRAINT') {
                                    arrQueries = [autocompleteQuery.qualified_constraints];
                                } else if (strPreviousKeyWord === 'COLLATION') {
                                    arrQueries = [autocompleteQuery.qualified_collations];
                                } else if (strPreviousKeyWord === 'COLUMN') {
                                    arrQueries = [autocompleteQuery.qualified_tables];
                                } else if (strPreviousKeyWord === 'DOMAIN') {
                                    arrQueries = [autocompleteQuery.qualified_domains];
                                } else if (arrPreviousKeyWords[1] === 'FOREIGN' && arrPreviousKeyWords[0] === 'TABLE') {
                                    arrQueries = [autocompleteQuery.qualified_foreign_tables];
                                } else if (strPreviousKeyWord === 'FUNCTION'
                                        || strPreviousKeyWord === 'HANDLER'
                                        || strPreviousKeyWord === 'VALIDATOR') {
                                    arrQueries = [autocompleteQuery.qualified_functions];
                                } else if (strPreviousKeyWord === 'INDEX' || arrPreviousKeyWords[2] === 'INDEX' ||
                                            ((arrPreviousKeyWords[1] + arrPreviousKeyWords[0]) === 'CLUSTERON')) {
                                    arrQueries = [autocompleteQuery.qualified_indexes];
                                } else if ((arrPreviousKeyWords[1] === 'MATERIALIZED' && arrPreviousKeyWords[0] === 'VIEW') ||
                                           (arrPreviousKeyWords[3] === 'MATERIALIZED' && arrPreviousKeyWords[2] === 'VIEW')) {
                                    if (parseFloat(contextData.minorVersionNumber, 10) >= 9.3) {
                                        arrQueries = [autocompleteQuery.qualified_materialized_views];
                                    }
                                } else if (strPreviousKeyWord === 'OPERATOR') {
                                    arrQueries = [autocompleteQuery.qualified_operators];
                                } else if (strPreviousKeyWord === 'TYPE' || arrPreviousKeyWords[1] === 'FOR') {
                                    arrQueries = [autocompleteQuery.qualified_types];
                                } else if (arrPreviousKeyWords[1] === 'OPERATOR' && arrPreviousKeyWords[0] === 'CLASS') {
                                    arrQueries = [autocompleteQuery.qualified_operator_classes];
                                } else if (arrPreviousKeyWords[1] === 'OPERATOR' && arrPreviousKeyWords[0] === 'FAMILY') {
                                    arrQueries = [autocompleteQuery.qualified_operator_families];
                                } else if (strPreviousKeyWord === 'SEQUENCE'
                                        || (arrPreviousKeyWords[2] === 'SEQUENCE' && strPreviousKeyWord !== 'BY')) {
                                    arrQueries = [autocompleteQuery.qualified_sequences];
                                } else if (strPreviousKeyWord === 'TABLE'
                                        || arrPreviousKeyWords[1] === 'TRIGGER'
                                        || arrPreviousKeyWords[1] === 'CONSTRAINT'
                                        || strPreviousKeyWord === 'INHERIT'
                                        || ((/^(ALTER\s*POLICY)/gi).test(strSearchQuery) && strPreviousKeyWord === 'ON')
                                        || ((/^(ALTER\s*SEQUENCE)/gi).test(strSearchQuery) && strPreviousKeyWord === 'BY')
                                        || ((/^(ALTER\s*TABLE)/gi).test(strSearchQuery) && (/(TABLE|EXISTS|ONLY)/gi).test(strPreviousKeyWord))) {
                                    arrQueries = [autocompleteQuery.qualified_tables];
                                } else if (((/^(ALTER\s*RULE)/gi).test(strSearchQuery) && strPreviousKeyWord === 'ON')) {
                                    arrQueries = [autocompleteQuery.qualified_tables, autocompleteQuery.qualified_views];
                                } else if (strPreviousKeyWord === 'VIEW'
                                        || arrPreviousKeyWords[2] === 'VIEW'
                                        || arrPreviousKeyWords[1] === 'RULE') {
                                    
                                    arrQueries = [autocompleteQuery.qualified_views];
                                } else if (arrPreviousKeyWords[1] === 'SEARCH' && strPreviousKeyWord === 'CONFIGURATION') {
                                    arrQueries = [autocompleteQuery.qualified_text_search_configurations];
                                } else if (arrPreviousKeyWords[1] === 'SEARCH' && strPreviousKeyWord === 'DICTIONARY') {
                                    arrQueries = [autocompleteQuery.qualified_text_search_dictionaries];
                                } else if (arrPreviousKeyWords[1] === 'SEARCH' && strPreviousKeyWord === 'PARSER') {
                                    arrQueries = [autocompleteQuery.qualified_text_search_parsers];
                                } else if (arrPreviousKeyWords[1] === 'SEARCH' && strPreviousKeyWord === 'TEMPLATE') {
                                    arrQueries = [autocompleteQuery.qualified_text_search_templates];
                                }
                                
                            // grant or revoke query
                            } else if ((/^(GRANT|REVOKE)/gi).test(strSearchQuery)) {
                                if (strPreviousKeyWord === 'TABLE') {
                                    arrQueries = [autocompleteQuery.qualified_tables];
                                } else if (strPreviousKeyWord === 'SEQUENCE') {
                                    arrQueries = [autocompleteQuery.qualified_sequences];
                                } else if (strPreviousKeyWord === 'DOMAIN') {
                                    arrQueries = [autocompleteQuery.qualified_domains];
                                } else if (strPreviousKeyWord === 'FUNCTION') {
                                    arrQueries = [autocompleteQuery.qualified_functions];
                                } else if (strPreviousKeyWord === 'TYPE') {
                                    arrQueries = [autocompleteQuery.qualified_types];
                                }
                                
                            // EXECUTE
                            } else if ((/^(EXECUTE)/gi).test(strSearchQuery)) {
                                arrQueries = [autocompleteQuery.qualified_functions];
                                
                            // VACUUM, TRUNCATE or LOCK
                            } else if ((/^(VACUUM|TRUNCATE|LOCK|ANALYZE)/gi).test(strSearchQuery)) {
                                arrQueries = [autocompleteQuery.qualified_tables];
                                
                            // REFRESH MATERIALIZED VIEW
                            } else if ((/^(REFRESH\s*MATERIALIZED\s*VIEW)/gi).test(strSearchQuery)) {
                                if (parseFloat(contextData.minorVersionNumber, 10) >= 9.3) {
                                    arrQueries = [autocompleteQuery.qualified_materialized_views];
                                }
                                
                            // REINDEX
                            } else if ((/^(REINDEX)/gi).test(strSearchQuery)) {
                                if (strPreviousKeyWord === 'INDEX') {
                                    arrQueries = [autocompleteQuery.qualified_indexes];
                                    
                                } else if (strPreviousKeyWord === 'TABLE') {
                                    arrQueries = [autocompleteQuery.qualified_tables];
                                }
                                
                            // SET CONSTRAINTS
                            } else if ((/^(SET\s*CONSTRAINTS)/gi).test(strSearchQuery)) {
                                arrQueries = [autocompleteQuery.qualified_constraints];
                                
                            // COPY
                            } else if ((/^(COPY)/gi).test(strSearchQuery)) {
                                arrQueries = [autocompleteQuery.qualified_tables, autocompleteQuery.qualified_views];
                                
                            // CLUSTER
                            } else if ((/^(CLUSTER)/gi).test(strSearchQuery)) {
                                arrQueries = [autocompleteQuery.qualified_tables];
                            }
                            
                            if (arrQueries) {
                                // replace {{SCHEMAOID}} in all the queries
                                for (i = 0, len = arrQueries.length; i < len; i += 1) {
                                    arrQueries[i] = arrQueries[i].replace(/\{\{SCHEMAOID\}\}/gi, currentChoice[0]);
                                }
                            }
                        
                            
                        // else if we found a table or view: use columns query
                        } else if (currentChoice[2] === 'table' || currentChoice[2] === 'view') {
                            // we need some logic to choose between mutiple table or view choices
                            
                            for (i = 0, len = arrResults.length, arrQueries = []; i < len; i += 1) {
                                arrQueries.push(autocompleteQuery.columns.replace(/\{\{PARENTOID\}\}/gi, arrResults[i][0]));
                            }
                            
                        
                        }
                        
                        
                        // if we have queries: open popup
                        if (arrQueries && arrQueries.length > 0) {
                            autocompleteMakeList(arrQueries, '', editor);
                        }
                    }
                });
                
            // if there's two prefix elements: it could be: SCHEMA.TABLE or SCHEMA.VIEW
            } else if (arrPrefix.length === 2) {
                
                // these are set outside the websocket call because they might
                //      be overridden during the wait for the socket response
                autocompleteGlobals.intSearchStart = intStartCursorPosition;
                autocompleteGlobals.intSearchEnd = intEndCursorPosition;
                autocompleteGlobals.intSearchOffset = 1;
                
                for (var i = 0, len = treeGlobals.shownObjects.length; i < len; i++) {
                    if (treeGlobals.shownObjects[i].name === arrPrefix[0]) {
                        autocompleteGetObjectType(''
                                        , ['SELECT \'\', $notTObeMATCHEDtoken$' + arrPrefix.join('.') + '$notTObeMATCHEDtoken$::regclass::oid']
                                        , function (arrResults) {
                            // if we found an oid: open autocomplete with column list
                            if (arrResults) {
                                autocompleteMakeList([
                                    autocompleteQuery.columns.replace(/\{\{PARENTOID\}\}/gi, arrResults[0][1])], '', xtag.query(document.body, '.current-tab')[0].relatedEditor);
                            }
                        });
                        break;
                    }
                }
                
            }
        }
    } else if (autocompleteKeyEvent === 'colon') {
        if (strScript[intCursorPosition - 1] === ':') {
            arrQueries = [autocompleteQuery.types];
            
            autocompleteMakeList(arrQueries, currWord, editor);
        } else {
            closePopup();
        }
    } else if (autocompleteKeyEvent === 'semi-colon') {
        closePopup();
    } else if (autocompleteKeyEvent === 'space') {
        closePopup();
    } else if (autocompleteKeyEvent === 'snippets') {
        var currSnippet, strCurrent, strCurrentName;
        
        for (var i = 0, len = snippets.length; i < len; i++) {
            currSnippet = snippets[i];
            if (currSnippet[0].substring(0,1).toLowerCase().indexOf(currWord.toLowerCase()) !== -1) {
                strCurrent = currSnippet;
                strCurrentName = currSnippet[0];
                strSearch = (strCurrentName[0] === '"' ? strCurrentName.toLowerCase() : '"' + strCurrentName.toLowerCase() + '"');
                autocompleteGlobals.arrSearch.push(strSearch);
                autocompleteGlobals.arrValues.push(strCurrent);
                autocompleteGlobals.arrSearchMaster.push(strSearch);
                autocompleteGlobals.arrValuesMaster.push(strCurrent);
            }
        }
        
        if (autocompleteGlobals.arrValues.length >= 1) {
            openPopup(editor, autocompleteGlobals.arrValues);
        }
        
    } else if (autocompleteKeyEvent === 'paste') {
        closePopup();
    } else if (autocompleteKeyEvent === 'delete') {
        closePopup();
    } else if (autocompleteKeyEvent === 'parenthesis') {
        closePopup();
    }
}


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

function autocompleteMakeList(arrQueries, searchWord, editor) {
    'use strict';
    if (autocompleteGlobals.bolQueryRunning) {
        autocompleteGlobals.bolSpecialFilter = true;
    }
    //queryVars
    var optionList = ['hidden'];
    autocompleteGlobals.popupLoading = true;
    autocompleteGlobals.arrSearch = ['hidden'];
    autocompleteGlobals.arrSearchMaster = ['hidden'];
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
    //    //console.log(strQuery);
    // if the autocomplete query is still running: cancel it
    if (autocompleteGlobals.strQueryID && autocompleteGlobals.bolQueryRunning) {
        GS.requestFromSocket(GS.envSocket, 'CANCEL', '', autocompleteGlobals.strQueryID);
    }
    
    if (autocompleteGlobals.bolAlpha) {
        var strDeclare = editor.getValue(), substrEnd, arrFuncVariables = [];
        // if there is a declare statement: get variable names;
        if (strDeclare.toLowerCase().indexOf('declare') !== -1) {
            // if there is a begin: substring to that;
            if (strDeclare.toLowerCase().indexOf('begin') !== -1) {
                substrEnd = strDeclare.toLowerCase().indexOf('begin');
                strDeclare = strDeclare.substring(strDeclare.toLowerCase().indexOf('declare'), substrEnd);
                // get variable names
                arrFuncVariables = strDeclare.match(/([A-Za-z_0-9]+\ )+/ig);
                // trim variable names
                if (arrFuncVariables) {
                    for (var i = 0, len = arrFuncVariables.length; i < len; i++) {
                        arrFuncVariables[i] = arrFuncVariables[i].trim();
                        // if arrFuncVariables[i] has a space in it still: substring it off
                        if (arrFuncVariables[i].indexOf(' ') !== -1) {
                            arrFuncVariables[i].substring(0, arrFuncVariables[i].indexOf(' '));
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
        }
    
    }
    
    
    autocompleteGlobals.bolQueryRunning = true;
    // make the request
    autocompleteGlobals.strQueryID = GS.requestRawFromSocket(GS.envSocket, strQuery, function (data, error) {
        var arrRows, i, len;
        if (!error) {
            if (data.strMessage !== '\\.' && data.strMessage !== '') {
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
            } else if (data.strMessage === '') {
                optionList.shift();
                autocompleteGlobals.arrSearch.shift()
                autocompleteGlobals.arrValues = optionList;
                autocompleteGlobals.arrSearchMaster.shift();
                autocompleteGlobals.arrValuesMaster = optionList;
                
                //console.log('bolSpecialFilter: ' + autocompleteGlobals.bolSpecialFilter);
                if (autocompleteGlobals.bolSpecialFilter) {
                    autocompleteGlobals.bolSpecialFilter = false;
                    if ((optionList.length === 1 && searchWord && optionList[0][0].substring(0, searchWord.length).toLowerCase() === searchWord.toLowerCase()) || optionList.length === 0) {
                        closePopup();
                    } else {
                        var strScript, intCursorPosition, intStartCursorPosition;
                    
                        // get full script
                        strScript = editor.getValue();
                        
                        // get event cursor position start/end
                        intStartCursorPosition = rowAndColumnToIndex(strScript, editor.currentSelections[0].start.row, editor.currentSelections[0].start.column);
                        intCursorPosition = intStartCursorPosition;
                        
                        var currWord = [];
                        for (var i = 0, len = intCursorPosition; i <= len; i++) {
                            if (isAlpha(strScript[intCursorPosition - i]) || strScript[intCursorPosition - i] === '_') {
                                if (currWord === []) {
                                    currWord = strScript[intCursorPosition - i].toLowerCase()
                                } else {
                                    currWord.push(strScript[intCursorPosition - i].toLowerCase());
                                }
                            } else if (currWord !== []) {
                                break;
                            }
                        }
                    
                        currWord = currWord.reverse();
                        currWord = currWord.join('');
                        
                        autocompleteGlobals.searchLength = currWord.length;
                        
                        autocompleteFilterList(optionList, currWord, editor)
                    }
                } else {
                    if ((optionList.length === 1 && searchWord && optionList[0][0].substring(0, searchWord.length).toLowerCase() === searchWord.toLowerCase()) || optionList.length === 0) {
                        closePopup();
                    } else if (autocompleteGlobals.popupOpen === false) {
                        openPopup(editor, optionList);
                    } else if (autocompleteGlobals.popupOpen === true) {
                        loadPopuplist(editor, optionList);
                    }
                }
                
                autocompleteGlobals.bolQueryRunning = false;
            }
        }// else {
        //    GS.webSocketErrorDialog(data);
        //}
    });
}

function autocompleteFilterList(list, searchWord, editor) {
    if (autocompleteGlobals.bolQueryRunning) {
        autocompleteGlobals.bolSpecialFilter = true;
    } else {
        autocompleteGlobals.popupLoading = true;
        var arrNewValue = [], strSearch;
        autocompleteGlobals.popupAce.setValue('');
        
        
        if (searchWord[0] === '"') {
            strSearch = searchWord.toLowerCase();
        } else {
            strSearch = '"' + searchWord.toLowerCase();
        }
        
        for (i = 0, len = autocompleteGlobals.arrSearch.length, strNewValue = ''; i < len; i += 1) {
            // if the current item doesn't match: remove from ace, arrSearch and arrValues
            //console.log(autocompleteGlobals.arrSearch);
            if (autocompleteGlobals.arrSearch[i]) {
                //console.log(strSearch, autocompleteGlobals.arrSearch[i].indexOf(strSearch) === -1);
                if (autocompleteGlobals.arrSearch[i].indexOf(strSearch) === -1) {
                    //console.log(autocompleteGlobals.arrSearch[i].indexOf(strSearch), autocompleteGlobals.arrSearch[i], strSearch);
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
        if (autocompleteGlobals.arrSearch.length === 0 || autocompleteGlobals.arrValues.length === 0 || (autocompleteGlobals.arrSearch.length === 1 && autocompleteGlobals.arrSearch[0] === (strSearch + '"'))) {
            closePopup();
        } else {
            openPopup(editor, autocompleteGlobals.arrValues, true);
        }
    }
}

function closePopup() {
    if (autocompleteGlobals.popupOpen === true) {
        autocompleteGlobals.popupOpen = false;
        //console.log('closed');
        autocompleteUnbind();
        // if the autocomplete query is still running: cancel it
        if (autocompleteGlobals.strQueryID && autocompleteGlobals.bolQueryRunning) {
            GS.requestFromSocket(GS.envSocket, 'CANCEL', '', autocompleteGlobals.strQueryID);
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

//bolKeepOpen allows autocompleteFilterList to not close the popup which emptys the variables
function openPopup(editor, optionlist, bolKeepOpen) {
'use strict';
    //console.log(optionlist.join('\n'));
    var //jsnSearchStart = indexToRowAndColumn(editor.getValue(), editor.selection.getRange().start.column)
      jsnPosition = editor.renderer.textToScreenCoordinates(editor.selection.getRange().start.row, editor.selection.getRange().start.column + 1)
      , intLeft = jsnPosition.pageX
      , intTop = jsnPosition.pageY
      , intLineHeight = editor.renderer.$textLayer.getLineHeight();

    // if autocomplete is open: close it first
    if (autocompleteGlobals.popupOpen === true && !bolKeepOpen) {
        closePopup();
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
    var strNewValue = '';
    for (var i = 0, len = optionlist.length; i < len; i++) {
        strNewValue += '\n';
        strNewValue += optionlist[i][0];
    }
    
    autocompleteBind(editor);
    
    autocompleteGlobals.popupAce.setValue(strNewValue.substring(1));
    autocompleteGlobals.popupAce.resize();

    document.getElementById('autocomplete-popup').removeAttribute('hidden');
    autocompletePopupHeightRefresh(optionlist);
    autocompleteGlobals.popupAce.selection.setSelectionRange(new Range(0, 0, 0, 0));
    autocompleteGlobals.popupAce.scrollToLine(0);
    
    if (document.getElementById('autocomplete-popup')) {
        popup_instruct_top = document.getElementById('autocomplete-popup').style.height +
                             document.getElementById('autocomplete-popup-instruction').style.height;
        document.getElementById('autocomplete-popup-instruction').style.top = popup_instruct_top;
    }
    
    autocompleteGlobals.popupLoading = false;
}


function autocompletePopupHeightRefresh(optionlist) {
    'use strict';
    var intHeight;

    // calculate popup height
    intHeight = autocompleteGlobals.popupAce.renderer.$textLayer.getLineHeight() * optionlist.length;
    if (intHeight > 150) {
        intHeight = 150;
    }

    // set popup height
    autocompleteGlobals.popupElement.style.height = intHeight + 'px';
}


function autocompleteComplete(editor) {
    var intFocusedLine = autocompleteGlobals.popupAce.getSelectionRange().start.row;
    var currentValue = autocompleteGlobals.arrValues[intFocusedLine];
    
    var strScript, intCursorPosition, intStartCursorPosition;
    strScript = editor.getValue();
    intStartCursorPosition = rowAndColumnToIndex(strScript, editor.currentSelections[0].start.row, editor.currentSelections[0].start.column);
    intCursorPosition = intStartCursorPosition;
    var wordLength = 0;
    for (var i = 0, len = intCursorPosition; i <= len; i++) {
        if (isAlpha(strScript[intCursorPosition - i]) || strScript[intCursorPosition - i] === '_') {
            wordLength += 1;
        } else if (wordLength >= 1) {
            break;
        }
    }
    autocompleteGlobals.searchLength = wordLength;
    
    closePopup();
    var currSelectionRange = editor.selection.getRange();
    autocompleteGlobals.ignoreNext = 1;
    
    if (currentValue && currentValue[0].indexOf(' (Snippet)') !== -1) {
        var currSearchSnippet;
        for (var i = 0, len = snippets.length; i < len; i++) {
            currSearchSnippet = snippets[i];        
            
            if (currSearchSnippet[0] === currentValue[0]) {
            
                
                editor.getSelection().setSelectionRange(new Range(
                    currSelectionRange.start.row,
                    ((currSelectionRange.start.column === 1)? 0 : currSelectionRange.start.column - autocompleteGlobals.searchLength),
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
        autocompleteGlobals.ignoreNext = 2;
        //autocompleteGlobals
        if (editor.currentSelections.length > 1) {
            var currSelections = editor.currentSelections;
            
            for (var i = 0, len = editor.currentSelections.length; i < len; i += 1) {
                if (autocompleteGlobals.searchLength !== 1) {
                    insertText = currentValue[0].trim().substring(autocompleteGlobals.searchLength - 1, currentValue[0].trim().length);
                } else {
                    insertText = currentValue[0].trim().substring(autocompleteGlobals.searchLength, currentValue[0].trim().length);
                }
                insertObj = {
                    row: editor.currentSelections[i].start.row,
                    column: editor.currentSelections[i].start.column
                };
                //editor.moveCursorToPosition(insertObj);

                editor.env.document.insert(insertObj, insertText);
            }
        } else {
            editor.getSelection().setSelectionRange(new Range(
                currSelectionRange.start.row,
                ((currSelectionRange.start.column === 1)? 0 : currSelectionRange.start.column - autocompleteGlobals.searchLength),
                currSelectionRange.end.row,
                currSelectionRange.end.column
            ));
            editor.insert(currentValue[0]);
        }
    }
}

function autocompleteUnbind(editor) {
    'use strict';
    autocompleteGlobals.bolBound = false;
}


function autocompleteBind(editor) {
    'use strict';
    autocompleteGlobals.bolBound = true
}














































































