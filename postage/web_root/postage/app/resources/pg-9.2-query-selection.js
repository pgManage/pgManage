/*jslint white:true*/
var bolQuerySelectionLoaded = true;


function rowAndColumnToIndex(strText, intRow, intColumn) {
    'use strict';
    var arrLines, intIndex, i, len;

    arrLines = strText.split('\n');
    intIndex = 0;

    // count previous full lines
    for (i = 0, len = intRow; i < len; i += 1) {
        if (arrLines[i] !== null && arrLines[i] !== undefined) {
            intIndex += arrLines[i].length + 1;
        }
    }

    // add previous characters
    intIndex += intColumn;

    return intIndex;
}

function indexToRowAndColumn(strText, intIndex) {
    'use strict';
    var i, len, intRows, intColumns;

    for (i = 0, len = intIndex, intRows = 0, intColumns = 0; i < len; i += 1) {
        intColumns += 1;

        if (strText[i] === '\n') {
            intRows += 1;
            intColumns = 0;
        }
    }

    return {'row': intRows, 'column': intColumns};
}

function highlightCurrentQuery(tabElement, jsnQueryStart, jsnQueryEnd) {
    "use strict";

    // remove and old yellow highlights
    if (tabElement.openSelectionMarker) {
        tabElement.relatedEditor.getSession().removeMarker(tabElement.openSelectionMarker);
        tabElement.openSelectionMarker = null;
    }

    // highlight matches if start and end positions have been provided
    if (jsnQueryStart && jsnQueryEnd) {
        tabElement.openSelectionMarker =
            tabElement.relatedEditor.getSession()
                .addMarker(
                    new Range(jsnQueryStart.row, jsnQueryStart.column, jsnQueryEnd.row, jsnQueryEnd.column),
                    'ace-selected-query',
                    'background'
                );
    }
}

function positionFindRange(strScript, intSearchFromPos, arrQueryStartKeywords, arrDangerousQueryStartKeywords, arrExtraSearchKeywords) {
    "use strict";
    var intNeedle;
    var prevChar;
    var currChar;
    var intWordPoint;
    var strChar;
    var str2Char;
    var strWord;
    var bolAlpha;
    var bolEnder;
    var intQueryStart;
    var intQueryEnd;
    var intQuoteStatus;
    var strTag;
    var intQuoteNeedle;
    var bolExtraSearch;
    var bolWord;
    var strFirstWord;
    var bolDeduced;
    var bolFoundStart;
    var arrExtraSearchWords;
    var intStartingWordsToFind;
    var intParenLevel; // what the current parenthesis level is for the current query
    var intParenLevelAtCursor; // what parenthesis level the cursor is at for the current query
    var scriptLen = strScript.length;
    var i;
    var len;
    var bolIgnore = false;
    var intDollarQuotes = 0;
    var arrDollarQuotes = [];
    var incompleteQoute = '';
    var overRideBolExtraSearch = false;
    

    // behaviours:
    //      if the cursor is on a starting word for a query, that query is selected
    //      if the cursor is inside a query, that query is selected
    //      if the cursor is inside a query that's within a comment, that query is selected
    //      if the cursor is inside a query that's within a string, that query is selected

    // the overview of how this is going to work:
    //      we are going to iterate through the SQL text starting at the cursor position.
    //      we are going to call the variable we use to keep track of our position "the needle".
    //      we are going to move the needle forward until we run into a non alphabet character.
    //      we are going to move the needle backward until we run into a character that's not in the alphabet.
    //      we are going to look at the word in between the two points we found.
    //          if the word is not in the list of query starting words
    //              carry on to the next previous word
    //          if the word is in the list of query starting words
    //              save the starting position
    //              move forward with query split to find the end of the query

    intNeedle = intSearchFromPos;
    strChar = strScript[intNeedle];
    
    if (strChar === '"') {
        intNeedle += 1;
        intSearchFromPos += 1;
        strChar = strScript[intNeedle];
    }
    
    //if (!strScript[intNeedle + 1]) {
    //    strChar = '\n';
    //}

    // if the current char is in the alphabet
    if ((/[a-z]/gi).test(strChar)) {
        // move the needle forward until we run into a non alphabet character
        while (intNeedle < scriptLen) {
            strChar = strScript[intNeedle];
            bolAlpha = (/[a-z]/gi).test(strChar);

            if (!bolAlpha) {
                intWordPoint = (intNeedle - 1);
                break;
            }
            if (intNeedle === (scriptLen - 1)) {
                intWordPoint = intNeedle;
                break;
            }
            intNeedle += 1;
        }
    }
    //console.log(intNeedle, strChar);
    // move the needle backward until we run into a character that's not in the alphabet
    while (intNeedle >= 0) {
        currChar = strScript[intNeedle];
        if (intNeedle > 0) {
            prevChar = strScript[intNeedle - 1];
        } else {
            prevChar = strScript[intNeedle];
        }
        
        
        
        if (bolIgnore === false) {
            if (currChar === '/' && prevChar === '*') {
                bolIgnore = true;
            }if (currChar === '*' && prevChar === '/') {
                bolIgnore = true;
            } else if (currChar === '"') {
                bolIgnore = true;
            } else if (currChar === "'") {
                bolIgnore = true;
            } else if (currChar === ')') {
                bolIgnore = true;
            } else if (currChar === '$') {
                bolIgnore = false;
                for (var i = 1, len = strScript.length; i < len; i++) {
                    if (strScript[intNeedle - i] !== '$') {
                        incompleteQoute += strScript[intNeedle - i];
                        bolIgnore = true;
                    } else {
                        if (arrDollarQuotes.indexOf(incompleteQoute) === -1) {
                            arrDollarQuotes.push(incompleteQoute);
                            bolIgnore = true;
                        } else {
                            if (arrDollarQuotes.indexOf(incompleteQoute) !== -1) {
                                arrDollarQuotes.splice(arrDollarQuotes.indexOf(incompleteQoute), 1);
                                bolIgnore = false;
                            }
                        }
                        incompleteQoute = '';
                        intNeedle -= i;
                        i = strScript.length;
                    }
                }
                
            }
        } else {
            if (currChar === '*' && prevChar === '/') {
                bolIgnore = false;
            } else if (currChar === '"') {
                bolIgnore = false;
            } else if (currChar === "'") {
                bolIgnore = false;
            } else if (currChar === '(') {
                bolIgnore = false;
            } else if (currChar === '$') {
                bolIgnore = false;
                for (var i = 1, len = strScript.length; i < len; i++) {
                    if (strScript[intNeedle - i] !== '$') {
                        incompleteQoute += strScript[intNeedle - i];
                        bolIgnore = true;
                    } else {
                        if (arrDollarQuotes.indexOf(incompleteQoute) === -1) {
                            arrDollarQuotes.push(incompleteQoute);
                            bolIgnore = true;
                        } else {
                            if (arrDollarQuotes.indexOf(incompleteQoute) !== -1) {
                                arrDollarQuotes.splice(arrDollarQuotes.indexOf(incompleteQoute), 1);
                                bolIgnore = false;
                            }
                        }
                        incompleteQoute = '';
                        intNeedle -= i;
                        i = strScript.length;
                    }
                }
                
            }
        }
        
        strChar = strScript[intNeedle];
        bolAlpha = (/[a-z]/gi).test(strChar);
        bolEnder = (/[\s\(\)\'\"\.]/gi).test(strChar);
        
        
        //$SELECT$SELECT$SELECT$
        if (!bolIgnore || bolEnder || overRideBolExtraSearch) {
    
            // if we have an intWordPoint and we run into a whitespace character (or the beginning of the script):
            if (typeof intWordPoint === 'number' || intNeedle === 0) {
                if (bolEnder) {
                    //console.log(strWord);
                    strWord = strScript.substring(intNeedle + 1, intWordPoint + 1);
                    intQueryStart = (intNeedle + 1);
                } else if (intNeedle === 0) {
                    strWord = '';
                    if (typeof intWordPoint === 'number') {
                        strWord = strScript.substring(0, intWordPoint + 1);
                    }
                    intQueryStart = 0;
                }
    
                if (bolEnder || intNeedle === 0) {
                    bolWord = false;
    
                    // if word is only alpha: test word
                    if ((/^[a-z]*$/gi).test(strWord)) {
                        bolWord = true;
                        strWord = strWord.toUpperCase();
                    }
                        
                    // if we found a word
                    //          and it's a dangerous starting word
                    //          and we haven't started an extra search
                    if (
                            bolWord &&
                            arrDangerousQueryStartKeywords.indexOf(strWord) !== -1 &&
                            !bolExtraSearch
                        ) {
                        // set the number of words to find to 8, add the current word and set bolExtraSearch to true
                        if (overRideBolExtraSearch) {
                            bolExtraSearch = false;
                        } else {
                            intStartingWordsToFind = 8;
                            arrExtraSearchWords = [];
                            bolExtraSearch = true;
                        }
                    }
    
                    // if we found a word
                    //          and it's a starting word or an extra search keyword
                    //          and we've started an extra search
                    if (
                            bolWord &&
                            (
                                arrQueryStartKeywords.indexOf(strWord) !== -1 ||
                                arrExtraSearchKeywords.indexOf(strWord) !== -1
                            ) &&
                            bolExtraSearch) {
                                
                        // add starting word to extra word array and decrease the number of words to find
                        arrExtraSearchWords.push({
                            'word': strWord,
                            'index': (intNeedle === 0 ? 0 : intNeedle + 1)
                        });
                        intStartingWordsToFind -= 1;
                    }
                        
                    // if we've started an extra search
                    //          and (
                    //              we've found our last extra word
                    //              or we've scanned to the beginning of the document
                    //          )
                    if (bolExtraSearch && (
                            intStartingWordsToFind === 0 ||
                            intNeedle === 0
                        )) {
                        // deduce the real starting word
                        
                        // if we run into a TO or FROM, query starts at first found word
                        // if we run into a GRANT or REVOKE, query starts there
                        //// if we run into a WITH immediatly before SELECT,INSERT,UPDATE,DELETE, query starts there
                        // else, query starts at first found word
    
                        i = 0;
                        len = arrExtraSearchWords.length;
                        while (i < len) {
                            if (arrExtraSearchWords[i].word === 'TO' || arrExtraSearchWords[i].word === 'FROM') {
                                bolDeduced = true;
                                intQueryStart = arrExtraSearchWords[0].index;
                                strFirstWord = arrExtraSearchWords[0].word;
                                break;
                            } else if (arrExtraSearchWords[i].word === 'GRANT' || arrExtraSearchWords[i].word === 'REVOKE') {
                                bolDeduced = true;
                                intQueryStart = arrExtraSearchWords[i].index;
                                strFirstWord = arrExtraSearchWords[i].word;
                                break;
                            }
                            //console.log('\'' + arrExtraSearchWords[i].word + '\'');
                            i += 1;
                        }
    
                        if (!bolDeduced) {
                            intQueryStart = arrExtraSearchWords[0].index;
                            strFirstWord = arrExtraSearchWords[0].word;
                        }
    
                        bolFoundStart = true;
                        break;
                    }
                    
                    // if we haven't started an extra search
                    //          and we've found a word
                    //          and we've found a query starting word
                    if (!bolExtraSearch && bolWord && arrQueryStartKeywords.indexOf(strWord) !== -1) {
                        // we've found the query start
                        bolFoundStart = true;
                        strFirstWord = strWord;
                        break;
                    }
    
                    //// if word is only alpha: test word
                    //if ((/^[a-z]*$/gi).test(strWord)) {
                    //    strWord = strWord.toUpperCase();
                    //    if (arrQueryStartKeywords.indexOf(strWord) !== -1) {
                    //        break;
                    //    }
                    //}
                    intWordPoint = null;
                }
                intQueryStart = null;
    
            // if we dont have an intWordPoint and we run into an alpha character: set intWordPoint
            } else if (typeof intWordPoint !== 'number' && bolAlpha) {
                intWordPoint = intNeedle;
            }
        }
        intNeedle -= 1;
        if (bolIgnore && intNeedle === 1) {
            overRideBolExtraSearch = true;
        }
    }
    /*

    // sometimes a query doesn't have a semicolon like it's supposed to, here we define
    //      what query starting keywords mark the end of other queries
    var arrAllQueryEndKeywords = [
        'ABORT', 'ALTER', 'ANALYZE', 'CHECKPOINT', 'CLOSE', 'CLUSTER', 'COMMENT',
        'COMMIT', 'COPY', 'CREATE', 'DEALLOCATE', 'DELETE', 'DISCARD', 'DO', 'DROP',
        'EXECUTE', 'EXPLAIN', 'FETCH', 'GRANT', 'IMPORT', 'INSERT', 'LISTEN',
        'LOAD', 'LOCK', 'MOVE', 'NOTIFY', 'PREPARE', 'REASSIGN', 'REFRESH', 'REINDEX',
        'RELEASE', 'RESET', 'REVOKE', 'ROLLBACK', 'SAVEPOINT', 'SECURITY',
        'SET', 'SHOW', 'START', 'TRUNCATE', 'UNLISTEN', 'UPDATE', 'VACUUM', 'VALUES',
        'WITH' //, 'BEGIN', 'DECLARE', 'END'
    ];
    var jsnQueryEndKeywords = {
        "insert": [
            'SELECT'
        ],
        "grant": [
            'EXECUTE', 'SELECT', 'TRUNCATE', 'INSERT', 'UPDATE', 'DELETE'
        ],
        "revoke": [
            'EXECUTE', 'SELECT', 'TRUNCATE', 'INSERT', 'UPDATE', 'DELETE'
        ],
        "explain": [
            'ANALYZE', 'SELECT'
        ],
        "create": [
            'ANALYZE', 'SELECT', 'WITH', 'EXECUTE', 'INSERT', 'UPDATE', 'DELETE',
            'COMMIT', 'TRUNCATE', 'SECURITY'
        ],
        "alter": [
            'ALTER', 'SET', 'RESET', 'DROP', 'WITH', 'GRANT', 'REVOKE', 'SELECT',
            'INSERT', 'UPDATE', 'DELETE', 'TRUNCATE', 'EXECUTE', 'SECURITY'
        ],
        "else": []
    };

    */

    // quote status (intQuoteStatus) values
    //      0 => no quotes
    //      2 => dollar tag
    //      3 => single quote
    //      4 => double quote
    //      5 => multiline comment
    //      6 => line comment
    //      7 => create function quote

    // special mention:
    //      intParenLevel is the number of parenthesis we are deep
    
    // if we found the query start: move forward with query split to find the end of the query
    if (bolFoundStart) {
        intParenLevel = 0;
        intQuoteStatus = 0;
        intNeedle = intQueryStart;
        while (intNeedle < scriptLen) {
            strChar = strScript[intNeedle];
            str2Char = strChar + (strScript[intNeedle + 1] || '');

            // FOUND MULTILINE COMMENT:
            if (intQuoteStatus === 0 && str2Char === "/*") {
                intQuoteStatus = 5;

            // ENDING MULTILINE COMMENT
            } else if (intQuoteStatus === 5 && str2Char === "*/") {
                intQuoteStatus = 0;

            // FOUND DASH COMMENT:
            } else if (intQuoteStatus === 0 && str2Char === "--") {
                intQuoteStatus = 6;

            // ENDING DASH COMMENT
            } else if (intQuoteStatus === 6 && (strChar === "\n" || strChar === "\r")) {
                intQuoteStatus = 0;

            // FOUND SLASH:  we don't skip slashed chars within dollar tags, double quotes and comments.
            } else if (strChar === "\\" && intQuoteStatus !== 4 && intQuoteStatus !== 2 && intQuoteStatus !== 5 && intQuoteStatus !== 6) {
                // skip next character
                intNeedle += 1;

            // FOUND SINGLE QUOTE:
            } else if (intQuoteStatus === 0 && strChar === "'") {
                intQuoteStatus = 3;

            // ENDING SINGLE QUOTE
            } else if (intQuoteStatus === 3 && strChar === "'") {
                intQuoteStatus = 0;

            // FOUND DOUBLE QUOTE:
            } else if (intQuoteStatus === 0 && strChar === "\"") {
                intQuoteStatus = 4;

            // ENDING DOUBLE QUOTE
            } else if (intQuoteStatus === 4 && strChar === "\"") {
                intQuoteStatus = 0;

            // FOUND OPEN PARENTHESIS:
            } else if (intQuoteStatus === 0 && strChar === "(") {
                intParenLevel = intParenLevel + 1;

            // FOUND CLOSE PARENTHESIS
            } else if (intQuoteStatus === 0 && strChar === ")") {
                intParenLevel = intParenLevel - 1;

            // FOUND DOLLAR TAG START:
            } else if (intQuoteStatus === 0 && strChar === "$") {
                // lookahead to get tag name
                intQuoteNeedle = intNeedle + 1;

                while (intQuoteNeedle < scriptLen && strScript[intQuoteNeedle].match(/^[a-z0-9_]$/gi)) {
                    intQuoteNeedle += 1;
                }

                if (strScript[intQuoteNeedle] === "$") {
                    strTag = strScript.substring(intNeedle + 1, intQuoteNeedle);
                    intNeedle = (intQuoteNeedle + 1);
                    intQuoteStatus = 2;
                }
            // END DOLLAR TAG
            } else if (intQuoteStatus === 2 && strScript.substr(intNeedle, strTag.length) === strTag) {
                intQuoteStatus = 0;

                // move pointer to end of end dollar tag
                intNeedle += strTag.length;
            }

            // FOUND AN UNQUOTED SEMICOLON:
            if (intParenLevel === 0 && intQuoteStatus === 0 && strChar === ';') {
                intQueryEnd = intNeedle;
                break;

            // FOUND THE SCRIPT END:
            } else if (intNeedle === (scriptLen - 1)) {
                intQueryEnd = intNeedle;
                break;
                
            // FOUND EXTRA PAREN:
            } else if (intParenLevel < 0) {
                intQueryEnd = intNeedle;
                break;
            }

            // if we've hit the current mouse position: save the parenthesis level
            if (intNeedle === intSearchFromPos) {
                intParenLevelAtCursor = intParenLevel;
            }
            intNeedle += 1;
        }
    }
    
    // V--- chops off the last character
    //// move the needle back one character so that we don't include the character that ended the query detection
    //intQueryEnd -= 1;
    
    // V--- prevents you from adding lines after the query and still detecting the query
    //// move the needle backwards to trim off extra whitespace (if needed)
    //if (strScript[intQueryEnd - 1] && (/^[\s]$/g).test(strScript[intQueryEnd - 1])) {
    //    intNeedle = (intQueryEnd - 1);
    //    while (intNeedle > intQueryStart) {
    //        if (strScript[intNeedle] && !(/^[\s]$/g).test(strScript[intNeedle])) {
    //            intQueryEnd = (intNeedle + 1);
    //            break;
    //        }
    //        intNeedle -= 1;
    //    }
    //    
    //}

    // return the query start/end, first word end and parenthesis level at the cursor
    return {
        'intQueryStart': intQueryStart,
        'intFirstWordEnd': intQueryStart + (strFirstWord || '').length,
        'intQueryEnd': intQueryEnd,
        'intParenLevelAtCursor': intParenLevelAtCursor || 0
    };
}

function selectionFindRange(tabElement, editor) {
    "use strict";
    var jsnQuery;
    var strScript = editor.getValue();
    var jsnSelection = editor.getSelectionRange();
    if (jsnSelection.start.column === 0 ||
        jsnSelection.start.column === 1
    ) {
        var intCursorPos = rowAndColumnToIndex(strScript, jsnSelection.start.row, jsnSelection.start.column);
    } else {
        var intCursorPos = rowAndColumnToIndex(strScript, jsnSelection.start.row, jsnSelection.start.column - 1);
    }
    var intSearchPos = intCursorPos;
    var jsnQueryStart;
    var jsnQueryEnd;
    var i;
    var arrQueryStartKeywords;
    var arrDangerousQueryStartKeywords;
    var arrExtraSearchKeywords;
    // ######################
    //      known issues
    //      in a query that looks like this: "EXPLAIN ANALYZE ..." the ANALYZE is found
    //              first. to fix this we need to alter the extra search code to handle
    //              different patterns of extra search (currently it's handling only
    //              GRANT/REVOKE queries)
    //              (same thing for ROLLBACK TO SAVEPOINT and SAVEPOINT)
    //              (same thing for (SELECT, INSERT, UPDATE, DELETE) and WITH)
    //              (same thing for (SELECT, INSERT, UPDATE, DELETE) and CREATE TRIGGER)
    //              (same thing for (SET) and UPDATE)
    // ######################

    arrQueryStartKeywords = [
        'ABORT', 'ALTER', 'ANALYZE', 'CHECKPOINT', 'CLOSE', 'CLUSTER', 'COMMENT',
        'COMMIT', 'COPY', 'CREATE', 'DEALLOCATE', 'DELETE', 'DISCARD', 'DO', 'DROP',
        'EXECUTE', 'EXPLAIN', 'FETCH', 'GRANT', 'IMPORT', 'INSERT', 'LISTEN',
        'LOAD', 'LOCK', 'MOVE', 'NOTIFY', 'PREPARE', 'REASSIGN', 'REFRESH', 'REINDEX',
        'RELEASE', 'RESET', 'REVOKE', 'ROLLBACK', 'SAVEPOINT', 'SECURITY', 'SELECT',
        'SET', 'SHOW', 'START', 'TRUNCATE', 'UNLISTEN', 'UPDATE', 'VACUUM', 'VALUES'
        //'BEGIN', 'DECLARE', 'END'
    ];
    arrDangerousQueryStartKeywords = [
        'EXECUTE', 'SELECT', 'INSERT', 'UPDATE', 'DELETE', 'TRUNCATE'
    ];
    arrExtraSearchKeywords = [
        'TO', 'FROM', 'INSERT', 'UPDATE', 'DELETE', 'TRUNCATE'
    ];


    
    jsnQuery = positionFindRange(strScript, intSearchPos, arrQueryStartKeywords, arrDangerousQueryStartKeywords, arrExtraSearchKeywords);
    // this solves #108
    if (intCursorPos === strScript.length) {
        intCursorPos -= 1;
    }
    //console.log(jsnQuery);
    // if the cursor is not in the selection: search higher
    if (intCursorPos > jsnQuery.intQueryEnd) {
        // there are only some queries that can wrap around other queries. that's
        //      why this list of start keywords is shorter than the full list
        arrQueryStartKeywords = [
            'COMMENT', 'COPY', 'CREATE', 'DELETE', 'DO', 'EXPLAIN', 'INSERT', 'NOTIFY',
            'PREPARE', 'SELECT', 'UPDATE', 'VALUES'
        ];

        i = 0;
        while (i < 8000 && intSearchPos > 0 && intCursorPos > jsnQuery.intQueryEnd) {
            //console.log('intSearchPos:  ', intSearchPos);
            intSearchPos = jsnQuery.intQueryStart - 1;
            jsnQuery = positionFindRange(strScript, intSearchPos, arrQueryStartKeywords, arrDangerousQueryStartKeywords, arrExtraSearchKeywords);

            if (jsnQuery.intQueryStart === undefined) {
                break;
            }

            i += 1;
        }
    }

    if (intCursorPos > jsnQuery.intQueryEnd || jsnQuery.intQueryEnd === undefined) {
        jsnQuery = {
            'intQueryStart': undefined,
            'intQueryEnd': undefined,
            'intParenLevelAtCursor': undefined
        };
    }

    // clear selection range storage
    editor.currentQueryRange = null;
    
    // if we found a query
    if (jsnQuery.intQueryStart !== jsnQuery.intQueryEnd) {
        // resolve query positions to jsn
        jsnQueryStart = indexToRowAndColumn(strScript, jsnQuery.intQueryStart);
        jsnQueryEnd = indexToRowAndColumn(strScript, jsnQuery.intQueryEnd);
        // set current range in the editor
        editor.currentQueryRange = {
            'start': jsnQueryStart,
            'end':  jsnQueryEnd,
            'text': strScript.substring(jsnQuery.intQueryStart, jsnQuery.intQueryEnd),
            'intParenLevel': jsnQuery.intParenLevelAtCursor
        };
        
        
        //console.log(JSON.stringify(editor.currentQueryRange));
        //console.log(editor.currentQueryRange.text);
    }
    editor.currentSelections = editor.getSelection().getAllRanges().slice(0);

    highlightCurrentQuery(
        tabElement,
        jsnQueryStart,
        indexToRowAndColumn(strScript, jsnQuery.intFirstWordEnd)
        //jsnQueryEnd // <--- replace above line with this when testing
    );

    GS.triggerEvent(editor.container, 'range-update');
}
