var bolAutocompleteLogicLoaded = true;
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



// What follows is the kitchen sink testing queries:
/*
INSERT INTO --<schema> SELECT  <-- we don't need this detector
SELECT --<cols> <tables> <builtins>
LEFT JOIN --<schemas>
RIGHT JOIN --<schemas>
, --<schemas>
INNER JOIN --<schemas>
JOIN --<schemas>
OUTER JOIN --<schemas>
FULL OUTER JOIN --<schemas>
ON --<tables><table-func>
FROM --<schemas>
WHERE --<tables> <cols> <builtins>
VALUES (--<col>, <func>); -- bolCols = true;
UPDATE --<schemas>
VIEW --<schemas>
SEQUENCE --<schemas>
FUNCTION --<schemas>
AGGREGATE --<schemas>
COLLATION --<schemas>
CONVERSION --<schemas>
DOMAIN --<schemas>
INDEX --<schemas>
CLASS --<schemas>
FAMILY --<schemas>
OPERATOR --<schemas>
CONFIGURATION --<schemas>
DICTIONARY --<schemas>
PARSER --<schemas>
TEMPLATE --<schemas>
TYPE --<schemas>
WHEN --<schemas>
SCHEMA --<schemas>
HANDLER --<schemas>
VALIDATOR --<schemas>
ORDER BY --<tables>
TABLE --<schemas>
ALTER FUNCTION <schemas> OWNER TO --<users, groups>;
OWNER TO --<users, groups>;
RULE --<rules>
GRANT --<groups>
GRANT ALL ON --<schemas>
REVOKE ALL ON FUNCTION <schemas> FROM --<users, groups>
ON DELETE TO --<schemas>
ON INSERT TO --<schemas>
ON UPDATE TO --<schemas>
GRANT EXECUTE ON FUNCTION <schemas> TO --<groups, users>;
TABLESPACE --<tablespaces>
RETURNS --<returntypes>
LANGUAGE --<languages>
CAST (--<types> AS <types>
SET --<cols> , <cols>
VACUUM --<schemas>
ANALYZE --<schemas>
ABORT --<schemas>
CHECKPOINT --<schemas>
CLOSE --<schemas>
CLUSTER --<schemas>
COMMENT --<schemas>
COMMIT --<schemas>
COPY --<schemas>
CREATE --<schemas>
DEALLOCATE --<schemas>
DELETE --<schemas>
DISCARD --<schemas>
DO --<schemas>
DROP --<schemas>
EXECUTE --<schemas>
EXPLAIN --<schemas>
FETCH --<schemas>
INSERT --<schemas>
LISTEN --<schemas>
LOAD --<schemas>
LOCK --<schemas>
MOVE --<schemas>
NOTIFY --<schemas>
PREPARE --<schemas>
REASSIGN --<schemas>
REFRESH --<schemas>
REINDEX --<schemas>
RELEASE --<schemas>
RESET --<schemas>
ROLLBACK --<schemas>
SAVEPOINT --<schemas>
SECURITY --<schemas>
SHOW --<schemas>
START --<schemas>
TRUNCATE --<schemas>
UNLISTEN --<schemas>
REVOKE --<schemas>
ALTER --<schemas>
*/


// this function opens the autocomplete popup if it's time
function autocompleteChangeHandler(tabElement, editor, event) {
    'use strict';
    var strScript, intCursorPosition, currentQueryRange, i, len
      , intStart, intEnd, strChar, strSearchQuery, jsnPrefix, strPreviousWord
      , strList, intPreviousWordEnd, bolPreviousCharWhitespace, bolCurrentCharPeriod
      , bolCurrentCharWhitespace, arrQueries, intEndCursorPosition
      , bolCurrentCharValidStart, bolAfterComma, bolCurrentCharOpenParen
      , bolPreviousCharOpenParen, strPreviousKeyWord, arrPreviousKeyWords
      , arrContextLists, strQueryType, arrPrefix, strSearch, intParenLevel
      , arrPreviousWords, bolCurrentCharCloseParen, bolPreviousCharCloseParen
      , intStartCursorPosition, arrFirstWords, strCurrentWord, strCurrentLine
      , bolPreviousCharReturn, bolCurrentCharReturn, bolFirstSpace
      , intOpenParen, intCloseParen, intVersion = parseFloat(contextData.minorVersionNumber, 10);
    // if the popup isn't already open or it's open but it's asleep
    //console.log(autocompleteGlobals.popupOpen, autocompleteGlobals.popupAsleep);
    if (event.action === 'remove') {
        if (autocompleteGlobals.popupOpen === true) {
            autocompletePopupClose(editor);
        }
    }
    if (autocompleteGlobals.popupOpen === false || autocompleteGlobals.popupAsleep === true) {
        // get current query range
        currentQueryRange = editor.currentQueryRange;

        // get full script
        strScript = editor.getValue();

        // get event cursor position start/end
        intStartCursorPosition = rowAndColumnToIndex(strScript, event.start.row, event.start.column);
        intEndCursorPosition = rowAndColumnToIndex(strScript, event.end.row, event.end.column);
        intCursorPosition = intStartCursorPosition;

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
        
    
        
        /*
        
        GS.rightPad(test_window, 'stringToPadWith', lengthToPadTo);
        GS.rightPad(test, 'stringToPadWith', lengthToPadTo);
        GS.
        GS.stringToElement('<div>your HTML here</div>');
        GS.leftPad(stringToPad, 'stringToPadWith', lengthToPadTo);
            GS.rightPad(stringToPad, 'stringToPadWith', lengthToPadTo);
        GS.rightPad(stringToPad, 'stringToPadWith', lengthToPadTo);
            <template for="hud"></template>
            <template for="table">
                <table>
                    <tbody>
                        <tr>
                            <th heading="#"><gs-static column="row_number"></gs-static></th>
                            <td heading=""></td>
                        </tr>
                    </tbody>
                </table>
            </template>
            <template for="insert"></template>
        </gs-envelope>
        
        
        */
        
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

        // waterfall to get the autocomplete list type
        if (strPreviousWord && (/[A-Z\"]/gim).test(strScript[parseInt(intCursorPosition, 10) + 1]) !== true) {
            bolPreviousCharWhitespace = (!(strScript[intCursorPosition - 1] || '').trim());
            bolCurrentCharWhitespace  = (!(strScript[intCursorPosition] || '').trim());
            bolPreviousCharReturn     = (strScript[intCursorPosition - 1] === '\n');
            bolCurrentCharReturn      = (strScript[intCursorPosition] === '\n');

            bolCurrentCharPeriod      = (strScript[intCursorPosition] === '.');
            bolCurrentCharValidStart  = (/[a-z0-9\"]/gi).test(strScript[intCursorPosition]);
            bolAfterComma             = (strPreviousWord[strPreviousWord.length - 1] === ',');
            bolCurrentCharOpenParen   = (strScript[intCursorPosition]     === '(');
            bolCurrentCharCloseParen  = (strScript[intCursorPosition]     === ')');
            bolPreviousCharOpenParen  = (strScript[intCursorPosition - 1] === '(');
            bolPreviousCharCloseParen = (strScript[intCursorPosition - 1] === ')');
            var noComma;
            var bolCols = false, bolTables = false, bolSchemas = false, bolTableFuncs = false, bolBuiltins = false, bolGroups = false, bolUsers = false, bolReturnTypes = false, bolTypes = false, bolLanguages = false, bolRules = false, bolTablespace = false;
            bolFirstSpace = bolCurrentCharWhitespace && !bolPreviousCharWhitespace;


            if (event.action === 'remove' && (/[A-Z\"]/gim).test(strScript[intCursorPosition - 1]) || ((/[A-Z\"]/gim).test(strScript[intCursorPosition]) && !bolCurrentCharWhitespace && (bolPreviousCharWhitespace || bolPreviousCharOpenParen || strScript[intCursorPosition - 1] === '_' || strScript[intCursorPosition] === '_')) && !bolCurrentCharPeriod) {

                if (arrPreviousKeyWords[1] === 'INSERT' && strPreviousKeyWord === 'INTO') {
                    //console.log('schema');
                    bolSchemas = true;
                } else if ((/^INSERT/gi).test(strSearchQuery) && strPreviousKeyWord === 'TO') {
                    //console.log('schema');
                    bolSchemas = true;
                } else if ((/(UPDATE|VIEW|SEQUENCE|FUNCTION|AGGREGATE|COLLATION|CONVERSION|DOMAIN|INDEX|CLASS|FAMILY|OPERATOR|CONFIGURATION|DICTIONARY|PARSER|TEMPLATE|TYPE|ANALYZE|VACUUM|WHEN|SCHEMA|HANDLER|VALIDATOR|ABORT|CHECKPOINT|CLOSE|CLUSTER|COMMENT|COMMIT|COPY|CREATE|DEALLOCATE|DELETE|DISCARD|DO|DROP|EXECUTE|EXPLAIN|FETCH|INSERT|LISTEN|LOAD|LOCK|MOVE|NOTIFY|PREPARE|REASSIGN|REFRESH|REINDEX|RELEASE|RESET|ROLLBACK|SAVEPOINT|SECURITY|SHOW|START|TRUNCATE|UNLISTEN)/i).test(strPreviousKeyWord)) {
                    //console.log('schemas');
                    bolSchemas = true;
                } else if (arrPreviousKeyWords[4] === 'REVOKE' && strPreviousKeyWord === 'FROM') {
                    //console.log('groups, users');
                    bolGroups = true;
                    bolUsers = true;
                } else if (arrPreviousKeyWords[1] === 'ALTER') {
                    //console.log('schemas');
                    bolSchemas = true;
                } else if (strPreviousKeyWord === 'REVOKE') {
                    //console.log('groups');
                    bolGroups = true;
                } else if (strPreviousKeyWord === 'FROM') {
                    if (strScript.indexOf('.') > strScript.indexOf('FROM')) {
                        bolTables = true;
                    } else {
                        //console.log('schemas');
                        bolSchemas = true;
                    }
                } else if (arrPreviousKeyWords[4] === 'REVOKE' && strPreviousKeyWord === 'ON') {
                    //console.log('schema');
                    bolSchemas = true;
                } else if (arrPreviousKeyWords[1] === 'UPDATE' || arrPreviousKeyWords[1] === 'DELETE' && strPreviousKeyWord === 'TO') {
                    //console.log('schemas');
                    bolSchemas = true;
                } else if (strPreviousKeyWord === 'TABLESPACE') {
                    //console.log('tablespace');
                    bolTablespace = true;
                } else if (arrPreviousKeyWords[1] === 'ORDER' && strPreviousKeyWord === 'BY') {
                    //console.log('tables');
                    bolTables = true;
                } else if (arrPreviousKeyWords[1] === 'OWNER' && strPreviousKeyWord === 'TO') {
                    //console.log('groups, users');
                    bolGroups = true;
                    bolUsers = true;
                } else if (arrPreviousKeyWords[2] === 'ON' && strPreviousKeyWord === 'TO') {
                    //console.log('groups, users');
                    bolGroups = true;
                    bolUsers = true;
                } else if (strPreviousKeyWord === 'JOIN' && !bolAfterComma && strScript[intCursorPosition - (strPreviousWord.length + 2)] !== ',') {
                    //console.log('schemas');
                    bolSchemas = true;
                } else if (strPreviousKeyWord === 'SET') {
                    //console.log('columns');
                    bolCols = true;
                } else if (strScript[intCursorPosition - (strPreviousWord.length + 2)] === ',' || bolAfterComma && strPreviousKeyWord === 'VALUES') {
                    bolCols = true;
                    bolBuiltins = true;
                } else if (strScript[intCursorPosition - (strPreviousWord.length + 2)] === ',' || bolAfterComma && strPreviousKeyWord === 'SET') {
                    bolCols = true;
                } else if (strScript[intCursorPosition - (strPreviousWord.length + 2)] === ',' || bolAfterComma && strPreviousKeyWord === 'SELECT') {
                    bolCols = true;
                    bolTables = true;
                    bolBuiltins = true;
                } else if (strScript[intCursorPosition - (strPreviousWord.length + 2)] === ',' || bolAfterComma) {
                    bolSchemas = true;
                } else if (arrPreviousKeyWords[2] === 'ALL' && arrPreviousKeyWords[1] === 'ON' && strPreviousKeyWord === 'FUNCTION') {
                    //console.log('schemas');
                    bolSchemas = true;
                } else if (arrPreviousKeyWords[1] === 'ALL' && strPreviousKeyWord === 'ON') {
                    //console.log('schemas');
                    bolSchemas = true;
                } else if (strPreviousKeyWord === 'ON') {
                    //console.log('tables, table-functions');
                    bolTables = true;
                    bolTableFuncs = true;
                } else if ((/^SELECT/gi).test(strSearchQuery)) {
                    //console.log('columns, tables, builtins');
                    bolCols = true;
                    bolTables = true;
                    bolBuiltins = true;
                    //console.log(arrQueries);
                } else if (strPreviousKeyWord === 'TABLE') {
                    //console.log('schemas');
                    bolSchemas = true;
                } else if (strPreviousKeyWord === 'RULE') {
                    //console.log('rules');
                    bolRules = true;
                    //arrQueries = [autocompleteQuery.rules];
                } else if (strPreviousKeyWord === 'GRANT') {
                    //console.log('groups');
                    bolGroups = true;
                } else if (strPreviousKeyWord === 'WHERE') {
                    //console.log('tables, columns, builtins');
                    bolTables = true;
                    bolCols = true;
                    bolBuiltins = true;
                } else if (strPreviousKeyWord === 'RETURNS') {
                    //console.log('returntypes');
                    bolReturnTypes = true;
                } else if (strPreviousKeyWord === 'LANGUAGE') {
                    //console.log('language');
                    bolLanguages =true;
                } else if (strPreviousKeyWord === 'CAST') {
                    //console.log('types');
                    bolTypes = true;
                } else if (arrPreviousKeyWords[1] === 'CAST' && strPreviousKeyWord === 'AS') {
                    //console.log('types');
                    bolTypes = true;
                } else if (strPreviousKeyWord === 'VALUES') {
                    //console.log('columns, functions');
                    bolCols = true;
                    bolBuiltins = true;
                } else {
                    bolSchemas = true;
                }
                
                autocompleteGlobals.bolSnippets = true;
                autocompleteGlobals.lastKeyWord = strPreviousKeyWord;
                
                var strCurrWord = '';
                for (var i = 0, len = strPreviousWord.length; i <= len; i++) {
                    if (strScript[intCursorPosition - i] == ' ' &&
                        strScript[intCursorPosition - i] == ',' &&
                        strScript[intCursorPosition - i] == ';' &&
                        strScript[intCursorPosition - i] == '"' &&
                        strScript[intCursorPosition - i] == "'") {
                        break;
                    } else if (strScript[intCursorPosition - i] !== '.') {
                        strCurrWord = strScript[intCursorPosition - i] + strCurrWord;
                        if (strScript[intCursorPosition] === '_') {
                            bolTables = true;
                        }
                    } else {
                        break;
                    }
                }
            
                 if (bolCols) {
                   arrQueries = [autocompleteQuery.allcolumns];
                } if (bolTables) {
                    if (arrQueries) {
                       arrQueries.push(autocompleteQuery.tables.replace(/\{\{CATALOG}\}/gi, CATALOG_id).replace(/\{\{TOAST}\}/gi, TOAST_id), autocompleteQuery.views.replace(/\{\{CATALOG}\}/gi, CATALOG_id).replace(/\{\{TOAST}\}/gi, TOAST_id)); 
                    } else {
                       arrQueries = [autocompleteQuery.tables.replace(/\{\{CATALOG}\}/gi, CATALOG_id).replace(/\{\{TOAST}\}/gi, TOAST_id), autocompleteQuery.views.replace(/\{\{CATALOG}\}/gi, CATALOG_id).replace(/\{\{TOAST}\}/gi, TOAST_id)]; 
                    }
                } if (bolSchemas) {
                    if (arrQueries) {
                       arrQueries.push(autocompleteQuery.schemas);
                    } else {
                       arrQueries = [autocompleteQuery.schemas];
                    }
                } if (bolTableFuncs) {
                    if (arrQueries) {
                       arrQueries.push(autocompleteQuery.tableFunctions);
                    } else {
                       arrQueries = [autocompleteQuery.tableFunctions];
                    }
                } if (bolBuiltins) {
                    if (arrQueries) {
                       arrQueries.push(autocompleteQuery.funcSnippets);//builtIns);
                    } else {
                       arrQueries = [autocompleteQuery.funcSnippets];//builtIns];
                    }
                } if (bolGroups) {
                    if (arrQueries) {
                       arrQueries.push(autocompleteQuery.groups); 
                    } else {
                       arrQueries = [autocompleteQuery.groups];
                    }
                } if (bolUsers) {
                    if (arrQueries) {
                       arrQueries.push(autocompleteQuery.logins); 
                    } else {
                       arrQueries = [autocompleteQuery.logins];
                    }
                } if (bolReturnTypes) {
                    if (arrQueries) {
                       arrQueries.push(autocompleteQuery.returnTypes);
                    } else {
                       arrQueries = [autocompleteQuery.returnTypes];
                    }
                } if (bolTypes) {
                    if (arrQueries) {
                       arrQueries.push(autocompleteQuery.types2); 
                    } else {
                       arrQueries = [autocompleteQuery.types2]; 
                    }
                } if (bolLanguages) {
                    if (arrQueries) {
                       arrQueries.push(autocompleteQuery.language); 
                    } else {
                        
                       arrQueries = [autocompleteQuery.language]; 
                    }
                } if (bolRules) {
                    if (arrQueries) {
                       arrQueries.push(autocompleteQuery.rules); 
                    } else {
                       arrQueries = [autocompleteQuery.rules]; 
                    }
                } if (bolTablespace) {
                    if (arrQueries) {
                       arrQueries.push(autocompleteQuery.tablespace);
                    } else {
                       arrQueries = [autocompleteQuery.tablespace];
                    }
                }
                
                
                //console.log(strCurrWord);
                
                
                if (event.action === 'remove' && (/[A-Z\"]/gim).test(strScript[intCursorPosition - 1])) {
                    for (var i = 0, len = arrQueries.length; i < len; i++) {
                        arrQueries[i] = arrQueries[i].replace((/\{\{searchStr}\}/gi), strCurrWord.substring(0, strCurrWord.length - 1).toLowerCase() + '%');
                    }
                } else if (arrQueries) {
                    for (var i = 0, len = arrQueries.length; i < len; i++) {
                        if (strScript[intCursorPosition - 1] === '_' || strScript[intCursorPosition] === '_') {
                            arrQueries[i] = arrQueries[i].replace((/\{\{searchStr}\}/gi), strCurrWord.toLowerCase() + '%');
                        } else {
                            arrQueries[i] = arrQueries[i].replace((/\{\{searchStr}\}/gi), strScript[intCursorPosition].toLowerCase() + '%');
                        }
    
                    }
                }
                
                //console.log(arrQueries);
                
                // if we've found queries: open the popup
                if (arrQueries && arrQueries.length > 0) {
                    var strScript2 = editor.getValue()
                          , intSearchStringStart = (autocompleteGlobals.intSearchStart + autocompleteGlobals.intSearchOffset)
                          , intSearchStringEnd = autocompleteGlobals.intSearchEnd
                          , strSearch = strScript2.substring(intSearchStringStart, intSearchStringEnd);
                          
                    if (strScript[intCursorPosition - 1] === '_' || strScript[intCursorPosition] === '_') {
                        autocompleteGlobals.intSearchStart = intEndCursorPosition - strCurrWord.length - autocompleteGlobals.intSearchOffset;
                        autocompleteGlobals.intSearchEnd = intEndCursorPosition;
                        
                    } else if (event.action === 'remove') {
                        
                        autocompleteGlobals.intSearchStart = intEndCursorPosition - strCurrWord.length;
                        autocompleteGlobals.intSearchEnd = intEndCursorPosition;
                        if (strScript2.substring(intSearchStringStart - 1, intSearchStringEnd).substring(0, 1) !== (' ' || '.' || '"' || "'")) {
                            autocompleteGlobals.intSearchStart = intEndCursorPosition - strCurrWord.length - 1;
                            autocompleteGlobals.intSearchEnd = intEndCursorPosition;
                        } else {
                            autocompleteGlobals.intSearchStart = intEndCursorPosition - strCurrWord.length;
                            autocompleteGlobals.intSearchEnd = intEndCursorPosition;
                        }
                        
                    } else {
                        autocompleteGlobals.intSearchStart = intEndCursorPosition - 1;
                        autocompleteGlobals.intSearchEnd = intEndCursorPosition;
                        
                    }
                    autocompletePopupOpen(editor, arrQueries);
                }
                //console.log(arrQueries);
                arrQueries = [];
                
                //console.log(' bolCols: ' + bolCols + ' bolTables: ' + bolTables + ' bolSchemas: ' + bolSchemas + ' bolTableFuncs: ' + bolTableFuncs + ' bolBuiltins: ' + bolBuiltins + ' bolGroups: ' + bolGroups + ' bolUsers: ' + bolUsers + ' bolReturnTypes: ' + bolReturnTypes + ' bolTypes: ' + bolTypes + ' bolLanguages: ' + bolLanguages + ' bolRules: ' + bolRules + ' bolTablespace: ' + bolTablespace);
                
                bolCols = false;
                bolTables = false;
                bolSchemas = false;
                bolTableFuncs = false;
                bolBuiltins = false;
                bolGroups = false;
                bolUsers = false;
                bolReturnTypes = false;
                bolTypes = false;
                bolLanguages = false;
                bolRules = false;
                bolTablespace = false;
                
            // autocomplete after dot
            } else if (bolCurrentCharPeriod) {
                autocompleteGlobals.bolSnippets = false;
                // get prefixes
                jsnPrefix = autocompleteGetPrefix(strScript, intCursorPosition + 1);
                arrPrefix = jsnPrefix.arrStrings;
                
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
                                    autocompletePopupOpen(editor, arrQueries);
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
                                        autocompletePopupOpen(editor, [
                                            autocompleteQuery.columns.replace(/\{\{PARENTOID\}\}/gi, arrResults[0][1])
                                        ]);
                                    }
                                });
                                break;
                            }
                        }
                        
                    }
                }
            // typecasting:
            } else if (strScript[intCursorPosition] === ':' && strScript[intCursorPosition - 1] === ':') {
                autocompleteGlobals.bolSnippets = false;
                autocompleteGlobals.intSearchOffset = 1;
                arrQueries = [autocompleteQuery.types];
                
                
                // if we've found queries: open the popup
                if (arrQueries && arrQueries.length > 0) {
                    autocompleteGlobals.intSearchStart = intEndCursorPosition - 1;
                    autocompleteGlobals.intSearchEnd = intEndCursorPosition;
                    autocompletePopupOpen(editor, arrQueries);
                }
            }
        }
    }
}
/*
function autocompleteFirstQueriesByType(arrPreviousKeyWords, bolCurrentCharWhitespace, strPreviousWord) {
    'use strict';
    var arrQueries
      , oneWord = arrPreviousKeyWords[0]
      , twoWord = arrPreviousKeyWords[1] + arrPreviousKeyWords[0]
      , threeWord = arrPreviousKeyWords[2] + arrPreviousKeyWords[1] + arrPreviousKeyWords[0]
      , intVersion = parseFloat(contextData.minorVersionNumber, 10);
    if ( && arrPreviousKeyWords[0] === strPreviousWord && (
            oneWord === 'AGGREGATE'                 || oneWord === 'CONVERSION' ||
            oneWord === 'COLLATION'                 || oneWord === 'COLUMN' ||
            oneWord === 'DOMAIN'                    || twoWord === 'EVENTTRIGGER' ||
            twoWord === 'FOREIGNTABLE'              || oneWord === 'FUNCTION' ||
            oneWord === 'INDEX'                     || twoWord === 'MATERIALIZEDVIEW' ||
            oneWord === 'OPERATOR'                  || twoWord === 'OPERATORCLASS' ||
            twoWord === 'OPERATORFAMILY'            || oneWord === 'OWNED' ||
            oneWord === 'POLICY'                    || oneWord === 'RULE' ||
            oneWord === 'SEQUENCE'                  || oneWord === 'TABLE' ||
            threeWord === 'TEXTSEARCHCONFIGURATION' || threeWord === 'TEXTSEARCHDICTIONARY' ||
            threeWord === 'TEXTSEARCHPARSER'        || threeWord === 'TEXTSEARCHTEMPLATE' ||
            oneWord === 'TRANSFORM'                 || oneWord === 'TRIGGER' ||
            twoWord === 'TRANSFORMFOR'              ||
            oneWord === 'TYPE'                      || twoWord === 'USERMAPPING' ||
            oneWord === 'ON' ||                     oneWord === 'VIEW'
        )) {
        arrQueries = [autocompleteQuery.schemas];
        
    } else if () {
               if (oneWord === 'CAST') {                 arrQueries = [autocompleteQuery.casts];
        } else if (oneWord === 'COLLATION') {            arrQueries = [autocompleteQuery.collations];
        } else if (oneWord === 'CONSTRAINT') {           arrQueries = [autocompleteQuery.constraints];
        } else if (oneWord === 'DATABASE') {             arrQueries = [autocompleteQuery.databases];
        } else if (twoWord === 'EVENTTRIGGER') {         if (intVersion >= 9.3) { arrQueries = [autocompleteQuery.event_triggers]; }
        } else if (oneWord === 'EXTENSION') {            arrQueries = [autocompleteQuery.extension];
        } else if (threeWord === 'FOREIGNDATAWRAPPER') { arrQueries = [autocompleteQuery.foreign_data_wrapper];
        } else if (oneWord === 'GROUP') {                arrQueries = [autocompleteQuery.groups];
        } else if (oneWord === 'LANGUAGE') {             arrQueries = [autocompleteQuery.language];
        } else if (oneWord === 'POLICY') {               if (intVersion >= 9.5) { arrQueries = [autocompleteQuery.policies]; }
        } else if (oneWord === 'ROLE') {                 arrQueries = [autocompleteQuery.roles];
        } else if (oneWord === 'RULE') {                 arrQueries = [autocompleteQuery.rules];
        } else if (oneWord === 'SCHEMA') {               arrQueries = [autocompleteQuery.schemas];
        } else if (oneWord === 'SERVER') {               arrQueries = [autocompleteQuery.servers];
        } else if (oneWord === 'TABLESPACE') {           arrQueries = [autocompleteQuery.tablespace];
        } else if (oneWord === 'TRIGGER') {              arrQueries = [autocompleteQuery.triggers];
        } else if (oneWord === 'USER') {                 arrQueries = [autocompleteQuery.logins]; }
    }
    
    return arrQueries;
}
*/
function autocompleteSearchBackForWord(strScript, intCursorPosition, strWord) {
    'use strict';
    var strCurrentWord, intCurrentWordStart, intCurrentWordEnd, i;
    
    strWord = strWord.toUpperCase();
    i = (intCursorPosition - 1);
    intCurrentWordStart = null;
    intCurrentWordEnd = null;
    
    while (i > -1) {
        // if we havn't found the previous word end yet and the current character is not whitespace or undefined
        if (intCurrentWordEnd === null && (strScript[i] || '').trim() !== '') { // && strScript[i] !== ','
            // we've found the previous word end: save it
            intCurrentWordEnd = i + 1;
            
        // if we've found the previous word end but not the start and the current character is whitespace or undefined
        } else if (intCurrentWordStart === null && intCurrentWordEnd !== null
                && (
                        (strScript[i] || '').trim() === '' || strScript[i] === '('
                    )) {
            // we've found the previous word start: save it
            intCurrentWordStart = i + 1;
            
        // if we've found the previous word end but not the start and we've reached the first character of the query
        } else if (intCurrentWordStart === null && intCurrentWordEnd !== null && i === 0) {
            // we've found the previous word start: save it
            intCurrentWordStart = i;
        }
        
        if (intCurrentWordStart !== null && intCurrentWordEnd !== null) {
            strCurrentWord = strScript.substring(intCurrentWordStart, intCurrentWordEnd).toUpperCase();
            
            // if the current word is in the keyword list: add to keyword array
            if (strCurrentWord === strWord) {
                return true;
            }
            
            // clear variables for next cycle
            intCurrentWordStart = null;
            intCurrentWordEnd = null;
        }
        
        i -= 1;
    }
    
    return false;
}










var snippetHandler = function (lines, event, editor) {
    if (autocompleteGlobals.popupOpen === false || autocompleteGlobals.popupAsleep === true) {
        autocompleteGlobals.bolSnippets = true;
        arrQueries = [autocompleteQuery.schemas];
        arrQueries[0] = arrQueries[0].replace((/\{\{searchStr}\}/gi), lines.toLowerCase() + '%');
        
        var strScript = editor.getValue();
        intStartCursorPosition = rowAndColumnToIndex(strScript, event.start.row, event.start.column);
        intCursorPosition = intStartCursorPosition;
        
        var intEndCursorPosition = rowAndColumnToIndex(strScript, event.end.row, event.end.column);
        // if we've found queries: open the popup
        if (arrQueries && arrQueries.length > 0  && (/[A-Z\"]/gim).test(strScript[intCursorPosition + 1]) === false) {
            autocompleteGlobals.intSearchStart = intEndCursorPosition - 1;
            autocompleteGlobals.intSearchEnd = intEndCursorPosition;
            autocompletePopupOpen(editor, arrQueries);
            // console.log(autocompleteGlobals);
        }
    }
}















