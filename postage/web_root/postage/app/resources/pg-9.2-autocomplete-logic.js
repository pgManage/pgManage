var bolAutocompleteLogicLoaded = true;

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
        strScript          = strScript.substring(intStart, intEndCursorPosition); //intCursorPosition + 1
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
        
        // waterfall to get the autocomplete list type
        if (strPreviousWord) {
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
            
            bolFirstSpace = bolCurrentCharWhitespace && !bolPreviousCharWhitespace;
            
            // type autocomplete
            if (strScript[intCursorPosition] === ':' && strScript[intCursorPosition - 1] === ':') {
                autocompleteGlobals.intSearchOffset = 1;
                arrQueries = [autocompleteQuery.types];
                
            // query specific autocomplete
            } else if (
                    (
                        (bolFirstSpace && !bolCurrentCharReturn) ||
                        (bolCurrentCharValidStart && bolPreviousCharWhitespace) ||
                        (bolCurrentCharOpenParen) ||
                        (bolPreviousCharOpenParen && bolCurrentCharWhitespace)
                    ) || (
                        (/^CREATE/gi).test(strSearchQuery) && !bolCurrentCharPeriod
                    )
                    ) {
                autocompleteGlobals.intSearchOffset = ((bolCurrentCharValidStart && bolPreviousCharWhitespace) ? 0 : 1);
                // ()  <- context priority
                //
                // c   <- columns              |  t   <- tables
                // v   <- views                |  f   <- functions
                // a   <- aggregates           |  s   <- schemas
                // C   <- collate              |  OC  <- operator classes
                // CO  <- comparison operator  |  CD  <- comparison delimiter (AND/OR)
                // CON <- constraints
                
                // insert
                if ((/^INSERT/gi).test(strSearchQuery)) {
                    // INSERT INTO < s> AS alias
                    //         (<(c)c>, <(c)c>)
                    //     VALUES
                    //         (< sf>, < sf>)
                    //     ON CONFLICT (<(c)c> COLLATE < C> < OC>) WHERE <(c)c> > 2
                    //         ON CONSTRAINT <(CON)>
                    //         DO UPDATE SET <(c)c> = <(c)c> WHERE <(c)c> < CO> <(c)c> < CD> <(c)c> < CO> <(c)c>
                    //     RETURNING <(ctv)cs>, <(ctv)cs>;
                    
                    // after INTO: schemas, tables and views
                    if (strPreviousWord === 'INTO') {
                        arrQueries = [autocompleteQuery.schemas];
                        
                    // after RETURNING: columns, schemas
                    } else if (strPreviousKeyWord === 'RETURNING' && (bolAfterComma || bolCurrentCharWhitespace)) {
                        arrQueries = [autocompleteQuery.allcolumns, autocompleteQuery.schemas];
                        arrContextLists = ['tables', 'views'];
                        
                    // word after COLLATE: collations
                    } else if (strPreviousWord === 'COLLATE' && bolCurrentCharWhitespace) {
                        arrQueries = [autocompleteQuery.collations];
                        
                    // word after COLLATE: operator classes
                    } else if (strPreviousKeyWord === 'COLLATE' && bolCurrentCharWhitespace) {
                        arrQueries = [autocompleteQuery.opclass];
                        
                    // after WHERE: columns, schemas
                    } else if ((/(WHERE|AND|OR)/gi).test(strPreviousKeyWord) && bolCurrentCharWhitespace) {
                        arrQueries = [autocompleteQuery.allcolumns, autocompleteQuery.schemas];
                        arrContextLists = ['tables', 'views'];
                        
                    // after CONSTRAINT: constraints
                    } else if (strPreviousKeyWord === 'CONSTRAINT' && bolCurrentCharWhitespace) {
                        arrQueries = [autocompleteQuery.constraints];
                        
                    // after SET: columns
                    } else if (strPreviousKeyWord === 'SET' && (bolAfterComma || bolCurrentCharWhitespace)) {
                        arrQueries = [autocompleteQuery.allcolumns];
                        
                    // paren after CONFLICT: columns
                    } else if (strPreviousKeyWord === 'CONFLICT' && (bolAfterComma || bolCurrentCharOpenParen)) {
                        arrQueries = [autocompleteQuery.allcolumns];
                        
                    // paren after VALUES: schemas
                    } else if (strPreviousKeyWord === 'VALUES' && (bolAfterComma || bolCurrentCharOpenParen)) {
                        arrQueries = [autocompleteQuery.schemas]; //, autocompleteQuery.functions
                        
                    // paren after INTO: columns
                    } else if (strPreviousKeyWord === 'INTO' && ((bolAfterComma && bolCurrentCharWhitespace) || bolCurrentCharOpenParen)) {
                        arrQueries = [autocompleteQuery.allcolumns];
                    }
                    
                // table
                } else if ((/^TABLE/gi).test(strSearchQuery)) {
                    // after TABLE or ONLY: schemas
                    if (strPreviousWord === 'TABLE' || strPreviousWord === 'ONLY') {
                        arrQueries = [autocompleteQuery.schemas];
                    }
                    
                // select
                } else if ((/^SELECT/gi).test(strSearchQuery)) {
                    // ################################################################################
                    // ################### NEEDS CONTEXT COLUMNS AND OBJECT/ALIASES ###################
                    // ################################################################################
                    
                    //    SELECT <(ctv)cs>
                    //      FROM < s>
                    // LEFT JOIN < s> ON <(tv)s> = <(tv)s>
                    //     WHERE <(ctv)cs>
                    //  GROUP BY <(ctv)cs>
                    //    HAVING <(ctv)cs>
                    //    WINDOW test_window AS (
                    //                  PARTITION BY <(ctv)cs>
                    //                      ORDER BY <(ctv)cs> ASC
                    //                  ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING
                    //             )
                    //  ORDER BY <(ctv)cs> ASC
                    //     LIMIT 500
                    //    OFFSET 0;
                    // -----------------------------------------------------------
                    // SELECT <(ctv)cs>
                    //   FROM < s>
                    //  FETCH FIRST 500 ROWS ONLY
                    //    FOR SHARE OF <(t)> NOWAIT;
                    // -----------------------------------------------------------
                    //           SELECT <(ctv)cs>
                    //             FROM < s>
                    //        LEFT JOIN < s> "aa" USING (<(c)>)
                    //  LEFT OUTER JOIN < s> "ab" USING (<(c)>)
                    //       RIGHT JOIN < s> "ac" USING (<(c)>)
                    // RIGHT OUTER JOIN < s> "ad" USING (<(c)>)
                    //        FULL JOIN < s> "ae" USING (<(c)>)
                    //  FULL OUTER JOIN < s> "af" USING (<(c)>)
                    //       INNER JOIN < s> "ag" USING (<(c)>)
                    //        LEFT JOIN < s> "ah" NATURAL
                    //  LEFT OUTER JOIN < s> "ai" NATURAL
                    //       RIGHT JOIN < s> "aj" NATURAL
                    // RIGHT OUTER JOIN < s> "ak" NATURAL
                    //        FULL JOIN < s> "al" NATURAL
                    //  FULL OUTER JOIN < s> "am" NATURAL
                    //       INNER JOIN < s> "an" NATURAL
                    //        LEFT JOIN < s> "ao" ON <(tv)s> = <(tv)s>
                    //  LEFT OUTER JOIN < s> "ap" ON <(tv)s> = <(tv)s>
                    //       RIGHT JOIN < s> "aq" ON <(tv)s> = <(tv)s>
                    // RIGHT OUTER JOIN < s> "ar" ON <(tv)s> = <(tv)s>
                    //        FULL JOIN < s> "as" ON <(tv)s> = <(tv)s>
                    //  FULL OUTER JOIN < s> "at" ON <(tv)s> = <(tv)s>
                    //       INNER JOIN < s> "au" ON <(tv)s> = <(tv)s>
                    //            LIMIT 5;
                    // -----------------------------------------------------------
                    // SELECT <(ctv)ctvs>
                    //   FROM ( SELECT * FROM < s> LIMIT 30 ) AS "av";
                    // -----------------------------------------------------------
                    // SELECT <(ctv)ctvs>
                    //   FROM ( SELECT * FROM < s> LIMIT 30 ) "av";
                    
                    // after OF:
                    if (strPreviousKeyWord === 'OF' && bolCurrentCharWhitespace) {
                        //arrQueries = [];
                        arrContextLists = ['tables'];
                        
                    // after ORDER BY: columns and schemas
                    } else if (arrPreviousKeyWords[1] === 'ORDER' && strPreviousKeyWord === 'BY' && bolCurrentCharWhitespace) {
                        arrQueries = [autocompleteQuery.allcolumns, autocompleteQuery.schemas];
                        arrContextLists = ['tables', 'views'];
                        
                    // after PARTITION BY: columns and schemas
                    } else if (arrPreviousKeyWords[1] === 'PARTITION' && strPreviousKeyWord === 'BY' && bolCurrentCharWhitespace) {
                        arrQueries = [autocompleteQuery.allcolumns, autocompleteQuery.schemas];
                        arrContextLists = ['tables', 'views'];
                        
                    // after HAVING: columns and schemas
                    } else if (strPreviousKeyWord === 'HAVING' && bolCurrentCharWhitespace) {
                        arrQueries = [autocompleteQuery.allcolumns, autocompleteQuery.schemas];
                        arrContextLists = ['tables', 'views'];
                        
                    // after GROUP BY: columns and schemas
                    } else if (arrPreviousKeyWords[1] === 'GROUP' && strPreviousKeyWord === 'BY' && bolCurrentCharWhitespace) {
                        arrQueries = [autocompleteQuery.allcolumns, autocompleteQuery.schemas];
                        arrContextLists = ['tables', 'views'];
                        
                    // after WHERE: columns and schemas
                    } else if (strPreviousKeyWord === 'WHERE' && bolCurrentCharWhitespace) {
                        arrQueries = [autocompleteQuery.allcolumns, autocompleteQuery.schemas];
                        arrContextLists = ['tables', 'views'];
                        
                    // after USING comma/open paren: columns
                    } else if (strPreviousKeyWord === 'USING' && (bolAfterComma || bolCurrentCharOpenParen)) {
                        arrQueries = [autocompleteQuery.allcolumns];
                        
                    // after ON: columns and schemas
                    } else if (strPreviousKeyWord === 'ON' && bolCurrentCharWhitespace) {
                        arrQueries = [autocompleteQuery.allcolumns, autocompleteQuery.schemas];
                        arrContextLists = ['tables', 'views'];
                        
                    // after JOIN: schemas
                    } else if (strPreviousKeyWord === 'JOIN' && bolCurrentCharWhitespace) {
                        arrQueries = [autocompleteQuery.schemas];
                        
                    // after FROM or FROM comma: schemas
                    } else if (strPreviousKeyWord === 'FROM' && (bolAfterComma || (bolFirstSpace))) {
                        arrQueries = [autocompleteQuery.schemas];
                        
                    // after INTO: schemas
                    } else if (strPreviousKeyWord === 'INTO' && bolFirstSpace) {
                        arrQueries = [autocompleteQuery.schemas];
                        
                    // after SELECT, ALL or DISTINCT:
                    } else if (((/(SELECT|ALL|DISTINCT)/gi).test(strPreviousWord) && bolFirstSpace) ||
                                ((/(SELECT|ALL|DISTINCT)/gi).test(strPreviousKeyWord) && bolAfterComma)) {
                        arrQueries = [autocompleteQuery.allcolumns, autocompleteQuery.schemas];
                        arrContextLists = ['tables', 'views'];
                    }
                    
                // update
                } else if ((/^UPDATE/gi).test(strSearchQuery)) {
                    // UPDATE ONLY < s> AS alias
                    //         SET <(c)c> = <(c)c>, <(c)c> = <(c)c>
                    //        FROM < s> AS alias2, < s> AS alias3
                    //       WHERE <(ctv)cs> < CO> <(ctv)cs> < CD> <(ctv)cs> < CO> <(ctv)cs>
                    //   RETURNING <(ctv)cs>, <(ctv)cs>;
                    
                    // after RETURNING: columns and schemas
                    if (strPreviousKeyWord === 'RETURNING' && (bolAfterComma || bolCurrentCharWhitespace)) {
                        arrQueries = [autocompleteQuery.allcolumns, autocompleteQuery.schemas];
                        arrContextLists = ['tables', 'views'];
                        
                    // after WHERE: columns and schemas
                    } else if (strPreviousKeyWord === 'WHERE' && bolCurrentCharWhitespace) {
                        arrQueries = [autocompleteQuery.allcolumns, autocompleteQuery.schemas];
                        arrContextLists = ['tables', 'views'];
                    
                    // after FROM or FROM comma: schemas
                    } else if (strPreviousKeyWord === 'FROM' && (bolAfterComma || (bolFirstSpace))) {
                        arrQueries = [autocompleteQuery.schemas];
                        
                    // after SET or SET comma: columns
                    } else if (strPreviousKeyWord === 'SET' && (bolAfterComma || bolCurrentCharWhitespace)) {
                        arrQueries = [autocompleteQuery.allcolumns];
                        
                    // after UPDATE or ONLY: schemas
                    } else if ((/(UPDATE|ONLY)/gi).test(strPreviousWord) && (bolFirstSpace)) {
                        arrQueries = [autocompleteQuery.schemas];
                    }
                    
                // delete
                } else if ((/^DELETE/gi).test(strSearchQuery)) {
                    // DELETE FROM ONLY < s> AS alias
                    //            USING < s> AS alias2, < s> AS alias3
                    //            WHERE <(ctv)cs> < CO> <(ctv)cs> < CD> <(ctv)cs> < CO> <(ctv)cs>
                    //        RETURNING <(ctv)cs>, <(ctv)cs>;
                    
                    // after RETURNING: columns
                    if (strPreviousKeyWord === 'RETURNING' && (bolAfterComma || bolCurrentCharWhitespace)) {
                        arrQueries = [autocompleteQuery.allcolumns, autocompleteQuery.schemas];
                        arrContextLists = ['tables', 'views'];
                        
                    // after WHERE: columns and schemas
                    } else if ((/(WHERE|AND|OR)/gi).test(strPreviousKeyWord) && bolCurrentCharWhitespace) {
                        arrQueries = [autocompleteQuery.allcolumns, autocompleteQuery.schemas];
                        arrContextLists = ['tables', 'views'];
                        
                    // after USING: schemas, tables and views
                    } else if (strPreviousKeyWord === 'USING' && (bolCurrentCharWhitespace || bolAfterComma)) {
                        arrQueries = [autocompleteQuery.schemas];
                        
                    // after FROM or ONLY: schemas, tables and views
                    } else if ((strPreviousWord === 'FROM' || strPreviousWord === 'ONLY') && bolCurrentCharWhitespace) {
                        arrQueries = [autocompleteQuery.schemas];
                    }
                    
                } else if ((/^(BEGIN|START\s*TRANSACTION|SET\s*TRANSACTION|SET\s*SESSION\s*CHARACTERISTICS\s*AS\s*TRANSACTION)/gi).test(strSearchQuery)) {
                    if ((strPreviousKeyWord === 'BEGIN' && bolCurrentCharWhitespace) || (bolAfterComma) ||
                        (
                            strPreviousKeyWord === 'TRANSACTION'
                            && bolCurrentCharWhitespace && strPreviousKeyWord === strPreviousWord
                        )) {
                        arrQueries = [autocompleteQuery.begin_keyword_one];
                        
                    } else if (
                        (
                            (/(SERIALIZABLE|READ|COMMITTED|UNCOMMITTED)/i).test(strPreviousKeyWord)
                            && bolCurrentCharWhitespace && strPreviousKeyWord === strPreviousWord
                        )) {
                        arrQueries = [autocompleteQuery.begin_keyword_two];
                        
                    } else if ((/(WRITE|ONLY)/i).test(strPreviousKeyWord)
                            && bolCurrentCharWhitespace && strPreviousKeyWord === strPreviousWord) {
                        arrQueries = [autocompleteQuery.begin_keyword_three];
                    }
                    
                } else if ((/^(SET\s*CONSTRAINTS)/gi).test(strSearchQuery)) {
                    if ((strPreviousKeyWord === 'CONSTRAINTS' && bolCurrentCharWhitespace && strPreviousKeyWord === strPreviousWord) || (bolAfterComma)) {
                        arrQueries = [autocompleteQuery.all_keyword, autocompleteQuery.schemas];
                        
                    } else if (strPreviousWord !== 'CONSTRAINTS' && bolCurrentCharWhitespace) {
                        arrQueries = [autocompleteQuery.set_constraint_keyword_one];
                    }
                    
                // set/show/reset
                } else if ((/^(SET|SHOW|RESET)/gi).test(strSearchQuery)) {
                    // after SET or RESET: set keywords and setable settings
                    if ((/(SET|RESET)/gi).test(strPreviousWord)) {
                        arrQueries = [autocompleteQuery.set_keywords, autocompleteQuery.settings];
                        
                    // after SHOW: set keywords and setable settings
                    } else if ((/(SHOW)/gi).test(strPreviousWord)) {
                        arrQueries = [autocompleteQuery.show_keywords, autocompleteQuery.settings];
                        
                    // after SESSION AUTHORIZATION:
                    } else if (arrPreviousKeyWords[1] === 'AUTHORIZATION' && arrPreviousKeyWords[0] === 'TO') {
                        arrQueries = [autocompleteQuery.logins];
                        
                    // after ROLE:
                    } else if (arrPreviousKeyWords[1] === 'SET' && arrPreviousKeyWords[0] === 'ROLE') {
                        arrQueries = [autocompleteQuery.none_keyword, autocompleteQuery.roles];
                        
                    // after SESSION: setable settings
                    } else if ((/(SESSION)/gi).test(strPreviousWord)) {
                        arrQueries = [autocompleteQuery.settings];
                    }
                    
                // grant/revoke
                } else if ((/^(GRANT|REVOKE)/gi).test(strSearchQuery)) {
                    // after GRANT/REVOKE
                    if ((/(GRANT|REVOKE)/gi).test(strPreviousWord)) {
                        arrQueries = [autocompleteQuery.permissions, autocompleteQuery.roles];
                        
                    // after commas after GRANT/REVOKE
                    } else if (bolAfterComma) {
                        arrQueries = [autocompleteQuery.permissions];
                        
                    // after TO/FROM: roles
                    } else if ((/(TO|FROM)/gi).test(strPreviousWord)) {
                        arrQueries = [autocompleteQuery.roles];
                        
                    // after ON: grant object types
                    } else if (strPreviousWord === 'ON' && bolCurrentCharWhitespace) {
                        arrQueries = [autocompleteQuery.permissionobjects];
                        
                    // after DATABASE: databases
                    } else if (strPreviousWord === 'DATABASE' && bolCurrentCharWhitespace) {
                        arrQueries = [autocompleteQuery.databases];
                        
                    // after TABLESPACE: tablespaces
                    } else if (strPreviousWord === 'TABLESPACE' && bolCurrentCharWhitespace) {
                        arrQueries = [autocompleteQuery.tablespace];
                        
                    // after object type: schemas
                    } else if ( (/(TABLE|SEQUENCE|DOMAIN|WRAPPER|SERVER|FUNCTION|LANGUAGE|SCHEMA|TYPE)/gi).test(strPreviousWord)) {
                        arrQueries = [autocompleteQuery.schemas];
                    }
                    
                // PREPARE TRANSACTION/COMMIT PREPARED/ROLLBACK PREPARED
                } else if ((/^(PREPARE TRANSACTION|COMMIT PREPARED|ROLLBACK PREPARED)/gi).test(strSearchQuery)) {
                    if ((strPreviousWord === 'TRANSACTION' || strPreviousWord === 'PREPARED') && bolCurrentCharWhitespace) {
                        arrQueries = [autocompleteQuery.prepared_transactions];
                    }
                    
                } else if ((/^(COMMENT)/gi).test(strSearchQuery)) {
                    
                    if (arrPreviousKeyWords[1] === 'COMMENT' && strPreviousKeyWord === 'ON' && bolCurrentCharWhitespace) {
                        arrQueries = [autocompleteQuery.comment_objects];
                    } else {
                        arrQueries = autocompleteFirstQueriesByType(arrPreviousKeyWords, bolCurrentCharWhitespace, strPreviousWord);
                    }
                    
                } else if ((/^(CLOSE|FETCH|MOVE)/gi).test(strSearchQuery)) {
                    if (strPreviousKeyWord === 'CLOSE' && bolCurrentCharWhitespace && strPreviousKeyWord === strPreviousWord) {
                        arrQueries = [autocompleteQuery.all_keyword, autocompleteQuery.cursors];
                        
                    } else if ((
                                    strPreviousKeyWord === 'FETCH' ||
                                    strPreviousKeyWord === 'MOVE'
                                ) && bolCurrentCharWhitespace && strPreviousKeyWord === strPreviousWord) {
                        arrQueries = [autocompleteQuery.fetch_keyword];
                        
                    } else if (
                                (
                                    (/^(NEXT|PRIOR|FIRST|LAST|ALL|FORWARD|BACKWARD)/gi).test(strPreviousKeyWord) ||
                                    !isNaN(parseInt(strPreviousWord, 10))
                                ) &&
                                bolCurrentCharWhitespace) {
                        arrQueries = [autocompleteQuery.cursors];
                    }
                    
                } else if ((/^(DISCARD)/gi).test(strSearchQuery)) {
                    if (strPreviousKeyWord === 'DISCARD' && bolCurrentCharWhitespace && strPreviousKeyWord === strPreviousWord) {
                        arrQueries = [autocompleteQuery.discard_keyword];
                    }
                    
                } else if ((/^(DO)/gi).test(strSearchQuery)) {
                    if (strPreviousKeyWord === 'LANGUAGE' && bolCurrentCharWhitespace && strPreviousKeyWord === strPreviousWord) {
                        arrQueries = [autocompleteQuery.language];
                    }
                    
                } else if ((/^(DEALLOCATE)/gi).test(strSearchQuery)) {
                    if ((
                            strPreviousKeyWord === 'DEALLOCATE' ||
                            strPreviousKeyWord === 'PREPARE'
                        ) && bolCurrentCharWhitespace && strPreviousKeyWord === strPreviousWord) {
                        arrQueries = [autocompleteQuery.all_keyword, autocompleteQuery.prepared_statements];
                    }
                    
                } else if ((/^(EXECUTE)/gi).test(strSearchQuery)) {
                    if (strPreviousKeyWord === 'EXECUTE' && bolCurrentCharWhitespace && strPreviousKeyWord === strPreviousWord) {
                        arrQueries = [autocompleteQuery.prepared_statements];
                        
                    } else if ((bolAfterComma || bolCurrentCharOpenParen)) {
                        arrQueries = [autocompleteQuery.schemas];
                    }
                    
                } else if ((/^(PREPARE)/gi).test(strSearchQuery)) {
                    if ((bolAfterComma || bolCurrentCharOpenParen)) {
                        arrQueries = [autocompleteQuery.types];
                    }
                    
                } else if ((/^(VALUES)/gi).test(strSearchQuery)) {
                    if (arrPreviousKeyWords[1] === 'ORDER' && strPreviousKeyWord === 'BY' && bolCurrentCharWhitespace) {
                        arrQueries = [autocompleteQuery.schemas];
                    }
                    
                } else if ((/^(VACUUM)/gi).test(strSearchQuery)) {
                    if (strPreviousWord === 'VACUUM' && bolCurrentCharWhitespace) {
                        arrQueries = [['FULL', 'FREEZE', 'VERBOSE', 'ANALYZE']];
                        
                    } else if ((/^VACUUM\s*\(/).test(strScript) && (strScript.match(/\)/gi) || []).length >= 1 && (bolCurrentCharWhitespace)) {
                        arrQueries = [autocompleteQuery.schemas];
                        
                    } else if ((/(VACUUM|FULL|FREEZE|VERBOSE|ANALYZE|(\)$))/i).test(strPreviousWord)
                            && intParenLevel === 0 && bolCurrentCharWhitespace) {
                        arrQueries = [['FULL', 'FREEZE', 'VERBOSE', 'ANALYZE'], autocompleteQuery.schemas];
                        
                    } else if ((/^VACUUM\s*\(/).test(strScript) && (bolAfterComma || bolCurrentCharOpenParen)) {
                        arrQueries = [['FULL', 'FREEZE', 'VERBOSE', 'ANALYZE']];
                        
                    } else if ((
                                    ((/^VACUUM\s*\(/).test(strScript) && (strScript.match(/\)/gi) || []).length >= 1)
                                 || (!(/^VACUUM\s*\(/).test(strScript) && (strScript.match(/\)/gi) || []).length === 0)
                                ) && intParenLevel === 1 && (bolAfterComma || bolCurrentCharOpenParen)) {
                        arrQueries = [autocompleteQuery.allcolumns];
                    }
                    
                } else if ((/^(UNLISTEN)/gi).test(strSearchQuery)) {
                    if (strPreviousKeyWord === 'UNLISTEN' && bolCurrentCharWhitespace) {
                        arrQueries = [autocompleteQuery.listening_channels];
                    }
                    
                } else if ((/^(TRUNCATE)/gi).test(strSearchQuery)) {
                    // after TRUNCATE or ONLY or TABLE or comma: schemas (to tables)
                    if ((
                                (/^(TRUNCATE|ONLY|TABLE)/gi).test(strPreviousKeyWord)
                             && bolCurrentCharWhitespace
                             && strPreviousKeyWord === strPreviousWord
                         ) || bolAfterComma) {
                        arrQueries = [autocompleteQuery.schemas];
                        
                    // after IDENTITY: truncate keywords two
                    } else if (strPreviousKeyWord === 'IDENTITY' && bolCurrentCharWhitespace) {
                        arrQueries = [autocompleteQuery.truncate_keyword_two];
                        
                    // not after comma: truncate keywords one and two
                    } else if (!bolAfterComma && bolCurrentCharWhitespace) {
                        arrQueries = [autocompleteQuery.truncate_keyword_one, autocompleteQuery.truncate_keyword_two];
                    }
                    
                } else if ((/^(LOCK)/gi).test(strSearchQuery)) {
                    if ((
                            (/^(LOCK|ONLY|TABLE)/gi).test(strPreviousKeyWord)
                             && bolCurrentCharWhitespace
                             && strPreviousKeyWord === strPreviousWord
                         ) || bolAfterComma) {
                        arrQueries = [autocompleteQuery.schemas];
                        
                    // after MODE: lock keywords two
                    } else if (strPreviousKeyWord === 'MODE' && bolCurrentCharWhitespace) {
                        arrQueries = [autocompleteQuery.lock_keyword_two];
                        
                    // not after comma: lock keywords one and two
                    } else if (!bolAfterComma && bolCurrentCharWhitespace) {
                        arrQueries = [autocompleteQuery.lock_keyword_one, autocompleteQuery.lock_keyword_two];
                    }
                    
                } else if ((/^(REASSIGN)/gi).test(strSearchQuery)) {
                    if (strPreviousKeyWord === 'REASSIGN' && bolCurrentCharWhitespace && strPreviousKeyWord === strPreviousWord) {
                        arrQueries = [autocompleteQuery.reassign_keyword_one];
                        
                    } else if (strPreviousKeyWord === 'BY' && bolCurrentCharWhitespace && strPreviousKeyWord === strPreviousWord) {
                        arrQueries = [autocompleteQuery.reassign_keyword_two, autocompleteQuery.roles];
                        
                    } else if (strPreviousKeyWord === 'BY' && bolCurrentCharWhitespace && strPreviousKeyWord !== strPreviousWord) {
                        arrQueries = [autocompleteQuery.reassign_keyword_three];
                        
                    } else if (strPreviousKeyWord === 'TO' && bolCurrentCharWhitespace && strPreviousKeyWord === strPreviousWord) {
                        arrQueries = [autocompleteQuery.reassign_keyword_two, autocompleteQuery.roles];
                    }
                    
                } else if ((/^(REFRESH\s*MATERIALIZED\s*VIEW)/gi).test(strSearchQuery)) {
                    if (strPreviousKeyWord === 'VIEW' && bolCurrentCharWhitespace && strPreviousKeyWord === strPreviousWord) {
                        arrQueries = [autocompleteQuery.refresh_materialized_views_keyword_one, autocompleteQuery.schemas];
                        
                    } else if (strPreviousKeyWord === 'CONCURRENTLY' && bolCurrentCharWhitespace && strPreviousKeyWord === strPreviousWord) {
                        arrQueries = [autocompleteQuery.schemas];
                        
                    } else if ((/VIEW|CONCURRENTLY/gi).test(strPreviousKeyWord) && bolCurrentCharWhitespace && strPreviousKeyWord !== strPreviousWord) {
                        arrQueries = [autocompleteQuery.refresh_materialized_views_keyword_two];
                    }
                    
                } else if ((/^(REINDEX)/gi).test(strSearchQuery)) {
                    if (strPreviousKeyWord === 'REINDEX' && bolCurrentCharWhitespace && strPreviousKeyWord === strPreviousWord) {
                        arrQueries = [autocompleteQuery.reindex_keyword_one, autocompleteQuery.reindex_keyword_two];
                        
                    } else if (strPreviousWord === 'VERBOSE)' && bolCurrentCharWhitespace) {
                        arrQueries = [autocompleteQuery.reindex_keyword_two];
                        
                    } else if ((/INDEX|TABLE|SCHEMA/gi).test(strPreviousWord) && bolCurrentCharWhitespace) {
                        arrQueries = [autocompleteQuery.schemas];
                        
                    } else if ((/DATABASE|SYSTEM/gi).test(strPreviousWord) && bolCurrentCharWhitespace) {
                        arrQueries = [autocompleteQuery.current_database];
                    }
                    
                } else if ((/^(EXPLAIN)/gi).test(strSearchQuery)) {
                    if (strPreviousKeyWord === 'EXPLAIN' && bolCurrentCharWhitespace && strPreviousKeyWord === strPreviousWord) {
                        arrQueries = [autocompleteQuery.explain_keyword_one];
                        
                    } else if ((bolCurrentCharOpenParen || bolAfterComma) && intParenLevel === 1) {
                        arrQueries = [autocompleteQuery.explain_keyword_one, autocompleteQuery.explain_keyword_two];
                        
                    } else if (strPreviousWord === 'FORMAT' && bolCurrentCharWhitespace) {
                        arrQueries = [autocompleteQuery.explain_keyword_three];
                    }
                    
                } else if ((/^(IMPORT\s*FOREIGN\s*SCHEMA)/gi).test(strSearchQuery)) {
                    if (strPreviousKeyWord === 'SERVER' && bolCurrentCharWhitespace && strPreviousKeyWord === strPreviousWord) {
                        arrQueries = [autocompleteQuery.servers];
                        
                    } else if (strPreviousKeyWord === 'INTO' && bolCurrentCharWhitespace && strPreviousKeyWord === strPreviousWord) {
                        arrQueries = [autocompleteQuery.schemas];
                    }
                    
                } else if ((/^(SECURITY\s*LABEL)/gi).test(strSearchQuery)) {
                    if (strPreviousKeyWord === 'LABEL' && bolCurrentCharWhitespace && strPreviousKeyWord === strPreviousWord) {
                        arrQueries = [autocompleteQuery.security_label_providers];
                        
                    } else if ((/LABEL|FOR/gi).test(strPreviousKeyWord) && bolCurrentCharWhitespace && strPreviousKeyWord !== strPreviousWord) {
                        arrQueries = [autocompleteQuery.security_label_keyword_one];
                        
                    } else if (strPreviousKeyWord === 'IS' && bolCurrentCharWhitespace && strPreviousKeyWord !== strPreviousWord) {
                        arrQueries = [autocompleteQuery.security_labels];
                        
                    } else if (strPreviousKeyWord === 'LANGUAGE' && bolCurrentCharWhitespace && strPreviousKeyWord === strPreviousWord) {
                        arrQueries = [autocompleteQuery.language];
                        
                    } else if (strPreviousKeyWord === 'ROLE' && bolCurrentCharWhitespace && strPreviousKeyWord === strPreviousWord) {
                        arrQueries = [autocompleteQuery.roles];
                        
                    } else if (strPreviousKeyWord === 'TABLESPACE' && bolCurrentCharWhitespace && strPreviousKeyWord === strPreviousWord) {
                        arrQueries = [autocompleteQuery.tablespace];
                        
                    } else if (
                          (arrPreviousKeyWords[0] === 'AGGREGATE' && bolCurrentCharWhitespace && arrPreviousKeyWords[0] === strPreviousWord) ||
                          (arrPreviousKeyWords[0] === 'COLUMN' && bolCurrentCharWhitespace && arrPreviousKeyWords[0] === strPreviousWord) ||
                          (arrPreviousKeyWords[0] === 'DOMAIN' && bolCurrentCharWhitespace && arrPreviousKeyWords[0] === strPreviousWord) ||
                          (arrPreviousKeyWords[1] === 'FOREIGN'
                        && arrPreviousKeyWords[0] === 'TABLE' && bolCurrentCharWhitespace && arrPreviousKeyWords[0] === strPreviousWord) ||
                          (arrPreviousKeyWords[0] === 'FUNCTION' && bolCurrentCharWhitespace && arrPreviousKeyWords[0] === strPreviousWord) ||
                          (arrPreviousKeyWords[1] === 'MATERIALIZED'
                        && arrPreviousKeyWords[0] === 'VIEW' && bolCurrentCharWhitespace && arrPreviousKeyWords[0] === strPreviousWord) ||
                          (arrPreviousKeyWords[0] === 'SEQUENCE' && bolCurrentCharWhitespace && arrPreviousKeyWords[0] === strPreviousWord) ||
                          (arrPreviousKeyWords[0] === 'TABLE' && bolCurrentCharWhitespace && arrPreviousKeyWords[0] === strPreviousWord) ||
                          (arrPreviousKeyWords[0] === 'TYPE' && bolCurrentCharWhitespace && arrPreviousKeyWords[0] === strPreviousWord) ||
                          (arrPreviousKeyWords[0] === 'VIEW' && bolCurrentCharWhitespace && arrPreviousKeyWords[0] === strPreviousWord)) {
                        arrQueries = [autocompleteQuery.schemas];
                    }
                    
                } else if ((/^(COPY)/gi).test(strSearchQuery)) {
                    if (strPreviousKeyWord === 'COPY' && bolCurrentCharWhitespace && strPreviousKeyWord === strPreviousWord) {
                        arrQueries = [autocompleteQuery.schemas];
                        
                    } else if (strPreviousKeyWord === 'COPY' && bolCurrentCharWhitespace && strPreviousKeyWord !== strPreviousWord) {
                        arrQueries = [autocompleteQuery.copy_keyword_one];
                        
                    } else if (strPreviousKeyWord === 'COPY' && (bolCurrentCharOpenParen || bolAfterComma)) {
                        arrQueries = [autocompleteQuery.allcolumns];
                        
                    } else if (strPreviousKeyWord === 'FORMAT' && bolCurrentCharWhitespace && strPreviousKeyWord === strPreviousWord) {
                        arrQueries = [autocompleteQuery.copy_keyword_four];
                        
                    } else if (strPreviousKeyWord === 'FROM' && bolCurrentCharWhitespace && strPreviousKeyWord === strPreviousWord) {
                        arrQueries = [autocompleteQuery.copy_keyword_two_a];
                        
                    } else if (strPreviousKeyWord === 'TO' && bolCurrentCharWhitespace && strPreviousKeyWord === strPreviousWord) {
                        arrQueries = [autocompleteQuery.copy_keyword_two_b];
                        
                    } else if ((
                                   (bolCurrentCharOpenParen && intParenLevel === 0)
                                || (bolAfterComma && intParenLevel === 1)
                                || (bolCurrentCharWhitespace && intParenLevel === 1))) {
                        arrQueries = [autocompleteQuery.copy_keyword_three];
                    } else if ((
                                   (bolCurrentCharOpenParen && intParenLevel === 1)
                                || (bolAfterComma && intParenLevel === 2)
                                || (bolCurrentCharWhitespace && intParenLevel === 2))) {
                        arrQueries = [autocompleteQuery.allcolumns];
                    }
                    
                } else if ((/^(ANALYZE)/gi).test(strSearchQuery)) {
                    if (strPreviousKeyWord === 'ANALYZE' && bolCurrentCharWhitespace && strPreviousKeyWord === strPreviousWord) {
                        arrQueries = [autocompleteQuery.analyze_keyword_one, autocompleteQuery.schemas];
                        
                    } else if (bolCurrentCharOpenParen || bolAfterComma) {
                        arrQueries = [autocompleteQuery.allcolumns];
                        
                    } else if (strPreviousKeyWord === 'VERBOSE' && bolCurrentCharWhitespace && strPreviousKeyWord === strPreviousWord) {
                        arrQueries = [autocompleteQuery.schemas];
                    }
                    
                } else if ((/^(CLUSTER)/gi).test(strSearchQuery)) {
                    if (strPreviousKeyWord === 'CLUSTER' && bolCurrentCharWhitespace && strPreviousKeyWord === strPreviousWord) {
                        arrQueries = [autocompleteQuery.cluster_keyword_one, autocompleteQuery.schemas];
                        
                    } else if ((/(CLUSTER|VERBOSE)/gi).test(strPreviousKeyWord) && bolCurrentCharWhitespace && strPreviousKeyWord !== strPreviousWord) {
                        arrQueries = [autocompleteQuery.cluster_keyword_two];
                        
                    } else if (strPreviousKeyWord === 'VERBOSE' && bolCurrentCharWhitespace && strPreviousKeyWord === strPreviousWord) {
                        arrQueries = [autocompleteQuery.schemas];
                        
                    } else if (strPreviousKeyWord === 'USING' && bolCurrentCharWhitespace && strPreviousKeyWord === strPreviousWord) {
                        arrQueries = [autocompleteQuery.table_qualified_indexes.replace(/\{\{TABLENAME\}\}/gi, arrPreviousWords[1])];
                    }
                    
                } else if ((/^(ALTER)\s*$/gi).test(strSearchQuery)) {
                    if (strPreviousKeyWord === 'ALTER' && bolFirstSpace && strPreviousKeyWord === strPreviousWord) {
                        arrQueries = [autocompleteQuery.alter_keyword_one];
                    }
                    
                } else if ((/^(DROP)\s*$/gi).test(strSearchQuery)) {
                    if (strPreviousKeyWord === 'DROP' && bolCurrentCharWhitespace && strPreviousKeyWord === strPreviousWord) {
                        arrQueries = [autocompleteQuery.drop_keyword_one];
                    }
                    
                // drop
                } else if ((/^(DROP)/gi).test(strSearchQuery)) {
                    arrQueries = autocompleteFirstQueriesByType(arrPreviousKeyWords, bolCurrentCharWhitespace, strPreviousWord);
                    
                // all ALTER ... OWNER TO queries
                } else if ((/^(ALTER)/gi).test(strSearchQuery)
                           && (arrPreviousKeyWords[1] + arrPreviousKeyWords[0]) === 'OWNERTO'
                                && bolCurrentCharWhitespace
                                && strPreviousKeyWord === strPreviousWord) {
                    if (parseFloat(contextData.minorVersionNumber, 10) >= 9.5) {
                        arrQueries = [['CURRENT_USER', 'SESSION_USER'], autocompleteQuery.roles];
                    } else {
                        arrQueries = [autocompleteQuery.roles];
                    }
                    
                // all ALTER ... SET SCHEMA queries
                } else if ((/^(ALTER)/gi).test(strSearchQuery)
                           && (arrPreviousKeyWords[1] + arrPreviousKeyWords[0]) === 'SETSCHEMA'
                                && bolCurrentCharWhitespace
                                && strPreviousKeyWord === strPreviousWord) {
                    
                    arrQueries = [autocompleteQuery.schemas];
                    
                // ALTER AGGREGATE and ALTER COLLATION and ALTER CONVERSION
                } else if ((/^(ALTER\s*(AGGREGATE|COLLATION|CONVERSION))/gi).test(strSearchQuery)) {
                    if ((/(AGGREGATE|COLLATION|CONVERSION)/gi).test(strPreviousKeyWord)
                            && bolCurrentCharWhitespace && strPreviousKeyWord === strPreviousWord) {
                        arrQueries = [autocompleteQuery.schemas];
                        
                    } else if (
                                (strPreviousKeyWord === 'AGGREGATE'  && bolCurrentCharWhitespace && strPreviousWord[strPreviousWord.length - 1] === ')')
                             || (strPreviousKeyWord === 'COLLATION'  && bolCurrentCharWhitespace && strPreviousKeyWord !== strPreviousWord)
                             || (strPreviousKeyWord === 'CONVERSION' && bolCurrentCharWhitespace && strPreviousKeyWord !== strPreviousWord)
                            ) {
                        arrQueries = [['OWNER TO', 'RENAME TO', 'SET SCHEMA']];
                    }
                    
                } else if ((/^(ALTER\s*DATABASE)/gi).test(strSearchQuery)) {
                    if (strPreviousKeyWord === 'DATABASE' && bolCurrentCharWhitespace && strPreviousKeyWord === strPreviousWord) {
                        arrQueries = [autocompleteQuery.databases];
                        
                    } else if (strPreviousKeyWord === 'DATABASE' && bolCurrentCharWhitespace && strPreviousKeyWord !== strPreviousWord) {
                        arrQueries = [['OWNER TO', 'RENAME TO', 'RESET', 'SET TABLESPACE', 'SET', 'WITH']];
                        
                    } else if (strPreviousKeyWord === 'WITH' && bolCurrentCharWhitespace && strPreviousKeyWord === strPreviousWord) {
                        arrQueries = [['ALLOW_CONNECTIONS TRUE', 'ALLOW_CONNECTIONS FALSE', 'CONNECTION LIMIT', 'IS_TEMPLATE TRUE', 'IS_TEMPLATE FALSE']];
                        
                    } else if (strPreviousKeyWord === 'TABLESPACE' && bolCurrentCharWhitespace && strPreviousKeyWord === strPreviousWord) {
                        arrQueries = [autocompleteQuery.tablespace];
                        
                    } else if (strPreviousKeyWord === 'SET' && bolCurrentCharWhitespace && strPreviousKeyWord === strPreviousWord) {
                        arrQueries = [autocompleteQuery.settings];
                        
                    } else if (strPreviousKeyWord === 'SET' && bolCurrentCharWhitespace && strPreviousKeyWord !== strPreviousWord) {
                        arrQueries = [['TO', 'TO DEFAULT', 'FROM CURRENT']];
                        
                    } else if (strPreviousKeyWord === 'RESET' && bolCurrentCharWhitespace && strPreviousKeyWord === strPreviousWord) {
                        arrQueries = [['ALL'], autocompleteQuery.settings];
                    }
                    
                } else if ((/^(ALTER\s*DEFAULT\s*PRIVILEGES)/gi).test(strSearchQuery)) {
                    if (
                            (strPreviousKeyWord === 'PRIVILEGES' && bolCurrentCharWhitespace && strPreviousKeyWord === strPreviousWord)
                         || (strPreviousKeyWord === 'ROLE'       && bolCurrentCharWhitespace && strPreviousKeyWord !== strPreviousWord)
                         || (strPreviousKeyWord === 'SCHEMA'     && bolCurrentCharWhitespace && strPreviousKeyWord !== strPreviousWord)
                        ) {
                        
                        arrQueries = [[]];
                        if (!(/.*FOR\s*ROLE.*/gi).test(strSearchQuery)) { arrQueries[0].push('FOR ROLE'); }
                        if (!(/.*IN\s*SCHEMA.*/gi).test(strSearchQuery)) { arrQueries[0].push('IN SCHEMA'); }
                        arrQueries[0].push('GRANT');
                        arrQueries[0].push('REVOKE');
                        arrQueries[0].push('REVOKE GRANT OPTION FOR');
                        
                    } else if (strPreviousKeyWord === 'ROLE' && bolCurrentCharWhitespace && strPreviousKeyWord === strPreviousWord) {
                        arrQueries = [autocompleteQuery.roles];
                        
                    } else if (strPreviousKeyWord === 'SCHEMA' && bolCurrentCharWhitespace && strPreviousKeyWord === strPreviousWord) {
                        arrQueries = [autocompleteQuery.schemas];
                        
                    } else if (
                            (
                                (
                                    strPreviousKeyWord === 'GRANT' ||
                                    strPreviousKeyWord === 'REVOKE' ||
                                    (
                                        arrPreviousKeyWords[3] + arrPreviousKeyWords[2] +
                                        arrPreviousKeyWords[1] + arrPreviousKeyWords[0]
                                    ) === 'REVOKEGRANTOPTIONFOR'
                                ) && (bolCurrentCharWhitespace && strPreviousKeyWord === strPreviousWord)
                            )
                            || bolAfterComma) {
                        arrQueries = [['ALL', 'SELECT', 'INSERT', 'UPDATE', 'DELETE', 'TRUNCATE', 'REFERENCES', 'TRIGGER', 'USAGE', 'EXECUTE']];
                        
                    } else if ((/ALL|SELECT|INSERT|UPDATE|DELETE|TRUNCATE|REFERENCES|TRIGGER|USAGE|EXECUTE/gi).test(strPreviousWord)
                            && (/.*GRANT.*/gi).test(strSearchQuery)
                            && bolCurrentCharWhitespace && !bolAfterComma) {
                        arrQueries = [['ON TABLES TO', 'ON SEQUENCES TO', 'ON FUNCTIONS TO', 'ON TYPES TO']];
                        
                    } else if ((/ALL|SELECT|INSERT|UPDATE|DELETE|TRUNCATE|REFERENCES|TRIGGER|USAGE|EXECUTE/gi).test(strPreviousWord)
                            && (/.*REVOKE.*/gi).test(strSearchQuery)
                            && bolCurrentCharWhitespace && !bolAfterComma) {
                        arrQueries = [['ON TABLES FROM', 'ON SEQUENCES FROM', 'ON FUNCTIONS FROM', 'ON TYPES FROM']];
                        
                    } else if ((/TO|FROM/gi).test(strPreviousWord) && bolCurrentCharWhitespace) {
                        arrQueries = [['PUBLIC'], autocompleteQuery.roles];
                        
                    } else if ((/TO|FROM/gi).test(strPreviousKeyWord) && (/.*REVOKE.*/gi).test(strSearchQuery) && bolCurrentCharWhitespace) {
                        arrQueries = [['CASCADE', 'RESTRICT']];
                    }
                    
                } else if ((/^(ALTER\s*DOMAIN)/gi).test(strSearchQuery)) {
                    if (strPreviousKeyWord === 'DOMAIN' && bolCurrentCharWhitespace && strPreviousKeyWord === strPreviousWord) {
                        arrQueries = [autocompleteQuery.schemas];
                        
                    } else if (strPreviousKeyWord === 'DOMAIN' && bolCurrentCharWhitespace && strPreviousKeyWord !== strPreviousWord) {
                        arrQueries = [['SET DEFAULT', 'DROP DEFAULT', 'SET NOT NULL', 'DROP NOT NULL'
                                     , 'ADD', 'DROP CONSTRAINT', 'RENAME CONSTRAINT', 'VALIDATE CONSTRAINT'
                                     , 'OWNER TO', 'RENAME TO', 'SET SCHEMA']];
                        
                    } else if ((arrPreviousWords[1] + arrPreviousWords[0]) === 'DROPCONSTRAINT' && bolCurrentCharWhitespace) {
                        arrQueries = [['IF EXISTS'], autocompleteQuery.domain_qualified_constraints.replace(/\{\{DOMAINNAME\}\}/gi, arrPreviousWords[2])];
                        
                    } else if ((arrPreviousWords[1] + arrPreviousWords[0]) === 'IFEXISTS' && bolCurrentCharWhitespace) {
                        arrQueries = [autocompleteQuery.domain_qualified_constraints.replace(/\{\{DOMAINNAME\}\}/gi, arrPreviousWords[2])];
                        
                    } else if ((arrPreviousKeyWords[1] + arrPreviousKeyWords[0]) === 'IFEXISTS' && bolCurrentCharWhitespace) {
                        arrQueries = [['RESTRICT', 'CASCADE']];
                        
                    } else if ((arrPreviousWords[1] + arrPreviousWords[0]) === 'RENAMECONSTRAINT' && bolCurrentCharWhitespace) {
                        arrQueries = [autocompleteQuery.domain_qualified_constraints.replace(/\{\{DOMAINNAME\}\}/gi, arrPreviousWords[2])];
                        
                    } else if ((arrPreviousKeyWords[1] + arrPreviousKeyWords[0]) === 'RENAMECONSTRAINT' && bolCurrentCharWhitespace) {
                        arrQueries = [['TO']];
                        
                    } else if ((arrPreviousWords[1] + arrPreviousWords[0]) === 'VALIDATECONSTRAINT' && bolCurrentCharWhitespace) {
                        arrQueries = [autocompleteQuery.domain_qualified_constraints.replace(/\{\{DOMAINNAME\}\}/gi, arrPreviousWords[2])];
                    }
                    
                } else if ((/^(ALTER\s*EVENT\s*TRIGGER)/gi).test(strSearchQuery)) {
                    if (strPreviousWord === 'TRIGGER' && bolFirstSpace) {
                        arrQueries = [autocompleteQuery.schemas];
                        
                    } else if (strPreviousKeyWord === 'TRIGGER' && bolCurrentCharWhitespace) {
                        arrQueries = [['DISABLE', 'ENABLE REPLICA', 'ENABLE ALWAYS', 'OWNER TO', 'RENAME TO']];
                    }
                    
                } else if ((/^(ALTER\s*EXTENSION)/gi).test(strSearchQuery)) {
                    if (strPreviousWord === 'EXTENSION' && bolFirstSpace) {
                        arrQueries = [autocompleteQuery.extension];
                        
                    } else if (strPreviousKeyWord === 'EXTENSION' && bolFirstSpace) {
                        arrQueries = [['UPDATE', 'UPDATE TO', 'SET SCHEMA', 'ADD', 'DROP']];
                        
                    } else if ((/(ADD|DROP)/gi).test(strPreviousKeyWord) && bolFirstSpace) {
                        arrQueries = [['AGGREGATE', 'CAST', 'COLLATION', 'CONVERSION', 'DOMAIN', 'EVENT TRIGGER', 'FOREIGN DATA WRAPPER', 'FOREIGN TABLE', 'FUNCTION', 'MATERIALIZED VIEW', 'OPERATOR', 'OPERATOR CLASS', 'OPERATOR FAMILY', 'LANGUAGE', 'PROCEDURAL LANGUAGE', 'SCHEMA', 'SEQUENCE', 'SERVER', 'TABLE', 'TEXT SEARCH CONFIGURATION', 'TEXT SEARCH DICTIONARY', 'TEXT SEARCH PARSER', 'TEXT SEARCH TEMPLATE', 'TRANSFORM FOR', 'TYPE', 'VIEW']];
                        
                    } else {
                        arrQueries = autocompleteFirstQueriesByType(arrPreviousKeyWords, bolCurrentCharWhitespace, strPreviousWord);
                    }
                    
                } else if ((/^(ALTER\s*FOREIGN\s*DATA\s*WRAPPER)/gi).test(strSearchQuery)) {
                    if (strPreviousWord === 'WRAPPER' && bolFirstSpace) {
                        arrQueries = [autocompleteQuery.extension];
                        
                    } else if (arrPreviousWords[1] === 'WRAPPER' && bolFirstSpace) {
                        arrQueries = [['HANDLER', 'HANDLER NO HANDLER', 'VALIDATOR', 'VALIDATOR NO VALIDATOR', 'OPTIONS']];
                        
                    } else if (arrPreviousWords[1] !== 'NO' &&
                                (strPreviousWord === 'HANDLER' || strPreviousWord === 'VALIDATOR') &&
                                bolFirstSpace) {
                        arrQueries = [autocompleteQuery.schemas];
                        
                    } else if ((strPreviousKeyWord === 'OPTIONS' && bolCurrentCharOpenParen) || bolAfterComma) {
                        arrQueries = [['ADD', 'SET', 'DROP']];
                    }
                    
                } else if ((/^(ALTER\s*FOREIGN\s*TABLE)/gi).test(strSearchQuery)) {
                    if (strPreviousWord === 'TABLE' && bolFirstSpace) {
                        arrQueries = [['IF EXISTS', 'ONLY'], autocompleteQuery.schemas];
                        
                    } else if ((arrPreviousWords[2] + arrPreviousWords[1] + arrPreviousWords[0]) === 'TABLEIFEXISTS'
                            && bolFirstSpace) {
                        arrQueries = [['ONLY'], autocompleteQuery.schemas];
                        
                    } else if (strPreviousWord === 'ONLY' && bolFirstSpace) {
                        arrQueries = [autocompleteQuery.schemas];
                        
                    } else if ((
                                    strPreviousKeyWord === 'TABLE'
                                 || (arrPreviousKeyWords[2] + arrPreviousKeyWords[1] + arrPreviousKeyWords[0]) === 'TABLEIFEXISTS'
                                 || strPreviousKeyWord === 'ONLY'
                                )
                                && bolFirstSpace) {
                        arrQueries = [['ADD COLUMN', 'DROP COLUMN', 'RENAME COLUMN', 'ALTER COLUMN', 'ADD', 'VALIDATE CONSTRAINT'
                                     , 'DROP CONSTRAINT', 'DISABLE TRIGGER', 'ENABLE TRIGGER', 'ENABLE REPLICA TRIGGER'
                                     , 'ENABLE ALWAYS TRIGGER', 'SET WITH OIDS', 'SET WITHOUT OIDS', 'INHERIT', 'NO INHERIT'
                                     , 'OPTIONS']];
                        
                    } else if ((arrPreviousWords[2] + arrPreviousWords[1] === 'ADDCOLUMN')
                            && bolFirstSpace) {
                        arrQueries = [autocompleteQuery.types];
                        
                    } else if ((arrPreviousWords[3] + arrPreviousWords[2] === 'ADDCOLUMN')
                            && bolFirstSpace) {
                        arrQueries = [['COLLATE']];
                        
                    } else if ( (
                                    (arrPreviousWords[1] + arrPreviousWords[0] === 'DROPCOLUMN')
                                 || (arrPreviousWords[3] + arrPreviousWords[2] + arrPreviousWords[1] + arrPreviousWords[0] === 'DROPCOLUMNIFEXISTS')
                                 || (arrPreviousWords[1] + arrPreviousWords[0] === 'RENAMECOLUMN')
                                 || (arrPreviousWords[1] + arrPreviousWords[0] === 'ALTERCOLUMN')
                                ) && bolFirstSpace) {
                        if (arrPreviousWords[1] === 'DROP') {
                            arrQueries = [['IF EXISTS'], autocompleteQuery.allcolumns];
                        } else {
                            arrQueries = [autocompleteQuery.allcolumns];
                        }
                        
                    } else if ((
                            ((arrPreviousKeyWords[1] + arrPreviousKeyWords[0]) === 'DROPCOLUMN')
                         || ((arrPreviousKeyWords[3] + arrPreviousKeyWords[2] + arrPreviousKeyWords[1] + arrPreviousKeyWords[0]) === 'DROPCOLUMNIFEXISTS')
                        ) && bolFirstSpace) {
                        arrQueries = [['RESTRICT', 'CASCADE']];
                        
                    } else if ( (arrPreviousKeyWords[1] + arrPreviousKeyWords[0] === 'RENAMECOLUMN')
                                && bolFirstSpace) {
                        arrQueries = [['TO']];
                        
                    } else if ( (arrPreviousKeyWords[1] + arrPreviousKeyWords[0] === 'ALTERCOLUMN')
                                && bolFirstSpace) {
                        arrQueries = [['TYPE', 'SET DEFAULT', 'DROP DEFAULT', 'SET NOT NULL', 'DROP NOT NULL', 'SET', 'RESET'
                                     , 'SET STATISTICS', 'SET STORAGE PLAIN', 'SET STORAGE EXTERNAL', 'SET STORAGE EXTENDED'
                                     , 'SET STORAGE MAIN']];
                        
                    } else if (strPreviousWord === 'TYPE' && bolFirstSpace) {
                        arrQueries = [autocompleteQuery.types];
                        
                    } else if (strPreviousKeyWord === 'TYPE' && bolFirstSpace) {
                        arrQueries = [['COLLATE']];
                        
                    } else if (strPreviousWord === 'COLLATE' && bolFirstSpace) {
                        arrQueries = [autocompleteQuery.collations];
                        
                    } else if ((arrPreviousWords[1] + arrPreviousWords[0] === 'VALIDATECONSTRAINT')
                            && bolFirstSpace) {
                        arrQueries = [autocompleteQuery.table_qualified_constraints.replace(/\{\{TABLENAME\}\}/gi, arrPreviousWords[2])];
                        
                    } else if ((arrPreviousWords[1] + arrPreviousWords[0] === 'DROPCONSTRAINT')
                            && bolFirstSpace) {
                        arrQueries = [['IF EXISTS'], autocompleteQuery.table_qualified_constraints.replace(/\{\{TABLENAME\}\}/gi, arrPreviousWords[2])];
                        
                    } else if ((arrPreviousWords[3] + arrPreviousWords[2] + arrPreviousWords[1] + arrPreviousWords[0]) === 'DROPCONSTRAINTIFEXISTS'
                            && bolFirstSpace) {
                        arrQueries = [autocompleteQuery.table_qualified_constraints.replace(/\{\{TABLENAME\}\}/gi, arrPreviousWords[4])];
                        
                    } else if ((
                                     (arrPreviousWords[4] + arrPreviousWords[3] + arrPreviousWords[2] + arrPreviousWords[1]) === 'DROPCONSTRAINTIFEXISTS'
                                  || (arrPreviousWords[2] + arrPreviousWords[1]) === 'DROPCONSTRAINT'
                                ) && bolFirstSpace) {
                        arrQueries = [['RESTRICT', 'CASCADE']];
                        
                    } else if ((
                                    (arrPreviousWords[1] + arrPreviousWords[0]) === 'DISABLETRIGGER'
                                 || (arrPreviousWords[1] + arrPreviousWords[0]) === 'ENABLETRIGGER'
                               ) && bolFirstSpace) {
                        arrQueries = [['ALL', 'USER'], autocompleteQuery.table_qualified_triggers.replace(/\{\{TABLENAME\}\}/gi, arrPreviousWords[2])];
                        
                    } else if ((
                                    (arrPreviousWords[2] + arrPreviousWords[1] + arrPreviousWords[0]) === 'ENABLEREPLICATRIGGER'
                                 || (arrPreviousWords[2] + arrPreviousWords[1] + arrPreviousWords[0]) === 'ENABLEALWAYSTRIGGER'
                               ) && bolFirstSpace) {
                        arrQueries = [autocompleteQuery.table_qualified_triggers.replace(/\{\{TABLENAME\}\}/gi, arrPreviousWords[3])];
                        
                    } else if (strPreviousWord === 'INHERIT' && bolFirstSpace) {
                        arrQueries = [autocompleteQuery.schemas];
                        
                    } else if (arrPreviousWords.indexOf('ADD') !== -1 && arrPreviousWords.indexOf('VALID') === -1
                            && strPreviousWord !== 'ADD' && intParenLevel === 0
                            && bolFirstSpace) {
                        arrQueries = [['NOT VALID']];
                        
                    } else if (((/(SET|RESET)/gi).test(strPreviousKeyWord) && bolCurrentCharOpenParen) || bolAfterComma) {
                        arrQueries = [['n_distinct = ', 'n_distinct_inherited = ']];
                        
                    } else if ((strPreviousKeyWord === 'OPTIONS' && bolCurrentCharOpenParen) || bolAfterComma) {
                        arrQueries = [['ADD', 'SET', 'DROP']];
                    }
                    
                } else if ((/^(ALTER\s*FUNCTION)/gi).test(strSearchQuery)) {
                    if (strPreviousWord === 'FUNCTION' && bolFirstSpace) {
                        arrQueries = [autocompleteQuery.schemas];
                        
                    } else if (strPreviousKeyWord === 'FUNCTION' && bolFirstSpace) {
                        arrQueries = [['RENAME TO', 'OWNER TO', 'SET SCHEMA', 'CALLED ON NULL INPUT', 'RETURNS NULL ON NULL INPUT'
                                     , 'STRICT', 'IMMUTABLE', 'STABLE', 'VOLATILE', 'LEAKPROOF', 'NOT LEAKPROOF', 'SECURITY INVOKER'
                                     , 'SECURITY DEFINER', 'EXTERNAL SECURITY INVOKER', 'EXTERNAL SECURITY DEFINER', 'COST', 'ROWS'
                                     , 'SET', 'RESET']];
                        
                    } else if (strPreviousWord === 'SET' && bolFirstSpace) {
                        arrQueries = [autocompleteQuery.settings];
                        
                    } else if (strPreviousWord === 'RESET' && bolFirstSpace) {
                        arrQueries = [['ALL'], autocompleteQuery.settings];
                        
                    } else if (strPreviousKeyWord === 'SET' && bolFirstSpace) {
                        arrQueries = [['TO', 'TO DEFAULT', 'FROM CURRENT']];
                        
                    } else if ((
                                    (/(INPUT|STRICT|IMMUTABLE|STABLE|VOLATILE|LEAKPROOF|INVOKER|DEFINER|DEFAULT|CURRENT|ALL)/gi).test(strPreviousWord)
                                 || ((/(COST|ROWS|TO|RESET)/gi).test(strPreviousKeyWord) && strPreviousKeyWord !== strPreviousWord)
                                ) && bolFirstSpace) {
                        arrQueries = [['RESTRICT']];
                    }
                    
                } else if ((/^(ALTER\s*GROUP)/gi).test(strSearchQuery)) {
                    if (strPreviousWord === 'GROUP' && bolFirstSpace) {
                        arrQueries = [['CURRENT_USER', 'SESSION_USER'], autocompleteQuery.roles];
                        
                    } else if (arrPreviousWords[1] === 'GROUP' && bolFirstSpace) {
                        arrQueries = [['ADD USER', 'DROP USER', 'RENAME TO']];
                        
                    } else if ((strPreviousWord === 'USER' && bolFirstSpace) || bolAfterComma) {
                        arrQueries = [autocompleteQuery.roles];
                    }
                    
                } else if ((/^(ALTER\s*INDEX)/gi).test(strSearchQuery)) {
                    if (strPreviousWord === 'INDEX' && bolFirstSpace) {
                        arrQueries = [['IF EXISTS', 'ALL IN TABLESPACE'], autocompleteQuery.schemas];
                        
                    } else if (strPreviousWord === 'EXISTS' && bolFirstSpace) {
                        arrQueries = [autocompleteQuery.schemas];
                        
                    } else if ((strPreviousKeyWord === 'INDEX' || strPreviousKeyWord === 'EXISTS')
                            && bolFirstSpace) {
                        arrQueries = [['RENAME TO', 'SET TABLESPACE', 'SET', 'RESET']];
                        
                    } else if ((arrPreviousWords[1] + arrPreviousWords[0]) === 'INTABLESPACE'
                            && bolFirstSpace) {
                        arrQueries = [autocompleteQuery.tablespace];
                        
                    } else if ((arrPreviousKeyWords[1] + arrPreviousKeyWords[0]) === 'INTABLESPACE'
                            && bolFirstSpace) {
                        arrQueries = [['OWNED BY', 'SET TABLESPACE']];
                        
                    } else if ((arrPreviousWords[1] + arrPreviousWords[0]) === 'OWNEDBY'
                            && bolFirstSpace) {
                        arrQueries = [autocompleteQuery.roles];
                        
                    } else if ((arrPreviousKeyWords[1] + arrPreviousKeyWords[0]) === 'OWNEDBY'
                            && bolFirstSpace) {
                        arrQueries = [['SET TABLESPACE']];
                        
                    } else if ((arrPreviousWords[1] + arrPreviousWords[0]) === 'SETTABLESPACE'
                            && bolFirstSpace) {
                        arrQueries = [autocompleteQuery.tablespace];
                        
                    } else if ((arrPreviousKeyWords[1] + arrPreviousKeyWords[0]) === 'SETTABLESPACE'
                            && bolFirstSpace) {
                        arrQueries = [['NOWAIT']];
                        
                    } else if (bolCurrentCharOpenParen || bolAfterComma) {
                        arrQueries = [['fillfactor', 'buffering', 'fastupdate', 'gin_pending_list_limit', 'pages_per_range']];
                    }
                    
                } else if ((/^(ALTER\s*(PROCEDURAL)\s*LANGUAGE)/gi).test(strSearchQuery)) {
                    if (strPreviousWord === 'LANGUAGE' && bolFirstSpace) {
                        arrQueries = [autocompleteQuery.language];
                        
                    } else if (arrPreviousWords[1] === 'LANGUAGE' && bolFirstSpace) {
                        arrQueries = [['RENAME TO', 'OWNER TO']];
                    }
                    
                } else if ((/^(ALTER\s*LARGE\s*OBJECT)/gi).test(strSearchQuery)) {
                    if (strPreviousWord === 'OBJECT' && bolFirstSpace) {
                        arrQueries = [autocompleteQuery.large_objects];
                        
                    } else if (arrPreviousWords[1] === 'OBJECT' && bolFirstSpace) {
                        arrQueries = [['OWNER TO']];
                    }
                    
                } else if ((/^(ALTER\s*MATERIALIZED\s*VIEW)/gi).test(strSearchQuery)) {
                    if (strPreviousWord === 'VIEW' && bolFirstSpace) {
                        arrQueries = [['IF EXISTS', 'ALL IN TABLESPACE'], autocompleteQuery.schemas];
                        
                    } else if (strPreviousWord === 'EXISTS' && bolFirstSpace) {
                        arrQueries = [autocompleteQuery.schemas];
                        
                    } else if ((strPreviousKeyWord === 'VIEW' || strPreviousKeyWord === 'EXISTS')
                            && strPreviousWord !== strPreviousKeyWord && bolFirstSpace) {
                        arrQueries = [['RENAME COLUMN', 'RENAME TO', 'SET SCHEMA', 'ALTER COLUMN', 'CLUSTER ON'
                                     , 'SET WITHOUT CLUSTER', 'SET', 'RESET', 'OWNER TO', 'SET TABLESPACE']];
                        
                    } else if ((arrPreviousWords[1] + arrPreviousWords[0]) === 'ALTERCOLUMN'
                            && bolFirstSpace) {
                        arrQueries = [autocompleteQuery.allcolumns];
                        
                    } else if ((arrPreviousKeyWords[1] + arrPreviousKeyWords[0]) === 'ALTERCOLUMN'
                            && bolFirstSpace) {
                        arrQueries = [['SET STATISTICS', 'SET', 'RESET', 'SET STORAGE PLAIN'
                                     , 'SET STORAGE EXTERNAL', 'SET STORAGE EXTENDED', 'SET STORAGE MAIN']];
                        
                    } else if (((arrPreviousKeyWords[1] === 'ALTER' || arrPreviousKeyWords[1] === 'COLUMN') && (/(SET|RESET)/gi).test(strPreviousKeyWord))
                                && (bolCurrentCharOpenParen || bolAfterComma)) {
                        arrQueries = [['n_distinct', 'n_distinct_inherited']];
                        
                    } else if (((/(SET|RESET)/gi).test(strPreviousKeyWord)) && (bolCurrentCharOpenParen || bolAfterComma)) {
                        arrQueries = [['fillfactor', 'autovacuum_enabled', 'toast.autovacuum_enabled', 'autovacuum_vacuum_threshold', 'toast.autovacuum_vacuum_threshold', 'autovacuum_vacuum_scale_factor', 'toast.autovacuum_vacuum_scale_factor', 'autovacuum_analyze_threshold', 'autovacuum_analyze_scale_factor', 'autovacuum_vacuum_cost_delay', 'toast.autovacuum_vacuum_cost_delay', 'autovacuum_vacuum_cost_limit', 'toast.autovacuum_vacuum_cost_limit', 'autovacuum_freeze_min_age', 'toast.autovacuum_freeze_min_age', 'autovacuum_freeze_max_age', 'toast.autovacuum_freeze_max_age', 'autovacuum_freeze_table_age', 'toast.autovacuum_freeze_table_age', 'autovacuum_multixact_freeze_min_age', 'toast.autovacuum_multixact_freeze_min_age', 'autovacuum_multixact_freeze_max_age', 'toast.autovacuum_multixact_freeze_max_age', 'autovacuum_multixact_freeze_table_age', 'toast.autovacuum_multixact_freeze_table_age', 'log_autovacuum_min_duration', 'toast.log_autovacuum_min_duration', 'user_catalog_table']];
                        
                    } else if ((arrPreviousWords[1] + arrPreviousWords[0]) === 'CLUSTERON'
                            && bolFirstSpace) {
                        arrQueries = [autocompleteQuery.table_qualified_indexes.replace(/\{\{TABLENAME\}\}/gi, arrPreviousWords[2])];
                        
                    } else if ((arrPreviousWords[1] + arrPreviousWords[0]) === 'RENAMECOLUMN'
                            && bolFirstSpace) {
                        arrQueries = [autocompleteQuery.allcolumns];
                        
                    } else if ((arrPreviousKeyWords[1] + arrPreviousKeyWords[0]) === 'RENAMECOLUMN'
                            && bolFirstSpace) {
                        arrQueries = [['TO']];
                        
                    } else if (strPreviousWord === 'TABLESPACE' && bolFirstSpace) {
                        arrQueries = [autocompleteQuery.tablespace];
                        
                    } else if ((arrPreviousKeyWords[1] + arrPreviousKeyWords[0]) === 'INTABLESPACE'
                            && bolFirstSpace) {
                        arrQueries = [['OWNED BY', 'SET TABLESPACE']];
                        
                    } else if ((arrPreviousWords[1] + arrPreviousWords[0]) === 'OWNEDBY'
                            && bolFirstSpace) {
                        arrQueries = [autocompleteQuery.roles];
                        
                    } else if ((arrPreviousKeyWords[1] + arrPreviousKeyWords[0]) === 'OWNEDBY'
                            && bolFirstSpace) {
                        arrQueries = [['SET TABLESPACE']];
                        
                    } else if ((arrPreviousWords[1] + arrPreviousWords[0]) === 'SETTABLESPACE'
                            && bolFirstSpace) {
                        arrQueries = [autocompleteQuery.tablespace];
                        
                    } else if ((arrPreviousKeyWords[1] + arrPreviousKeyWords[0]) === 'SETTABLESPACE'
                            && bolFirstSpace) {
                        arrQueries = [['NOWAIT']];
                    }
                    
                } else if ((/^(ALTER\s*OPERATOR\s*CLASS)/gi).test(strSearchQuery)) {
                    if (strPreviousWord === 'CLASS' && bolFirstSpace) {
                        arrQueries = [autocompleteQuery.schemas];
                        
                    } else if (strPreviousKeyWord === 'CLASS' && bolFirstSpace) {
                        arrQueries = [['USING']];
                        
                    } else if (strPreviousWord === 'USING' && bolFirstSpace) {
                        arrQueries = [autocompleteQuery.access_methods];
                        
                    } else if (strPreviousKeyWord === 'USING' && bolFirstSpace) {
                        arrQueries = [['RENAME TO', 'OWNER TO', 'SET SCHEMA']];
                    }
                    
                } else if ((/^(ALTER\s*OPERATOR\s*FAMILY)/gi).test(strSearchQuery)) {
                    if (strPreviousWord === 'FAMILY' && bolFirstSpace) {
                        arrQueries = [autocompleteQuery.schemas];
                        
                    } else if (strPreviousKeyWord === 'FAMILY' && bolFirstSpace) {
                        arrQueries = [['USING']];
                        
                    } else if (strPreviousWord === 'USING' && bolFirstSpace) {
                        arrQueries = [autocompleteQuery.access_methods];
                        
                    } else if (strPreviousKeyWord === 'USING' && bolFirstSpace) {
                        arrQueries = [['ADD OPERATOR', 'ADD FUNCTION', 'DROP OPERATOR', 'DROP FUNCTION', 'RENAME TO', 'OWNER TO', 'SET SCHEMA']];
                        
                    } else if (bolCurrentCharOpenParen || bolAfterComma) {
                        arrQueries = [autocompleteQuery.types];
                        
                    } else if ((arrPreviousWords[2] + arrPreviousWords[1]) === 'ADDOPERATOR' && bolFirstSpace) {
                        arrQueries = [autocompleteQuery.schemas];
                        
                    } else if (arrPreviousKeyWords.indexOf('OPERATOR') <= 3 && bolCurrentCharWhitespace && bolPreviousCharCloseParen) {
                        arrQueries = [['FOR SEARCH', 'FOR ORDER BY']];
                        
                    } else if ((arrPreviousWords[1] + arrPreviousWords[0]) === 'ORDERBY' && bolFirstSpace) {
                        arrQueries = [autocompleteQuery.btree_operator_families];
                        
                    } else if (arrPreviousKeyWords.indexOf('FUNCTION') <= 3 && bolCurrentCharWhitespace && bolPreviousCharCloseParen) {
                        arrQueries = [autocompleteQuery.schemas];
                    }
                    
                } else if ((/^(ALTER\s*OPERATOR)/gi).test(strSearchQuery)) {
                    if (strPreviousWord === 'OPERATOR' && bolFirstSpace) {
                        arrQueries = [autocompleteQuery.schemas];
                        
                    } else if (strPreviousWord[strPreviousWord.length - 1] === ')' && bolFirstSpace) {
                        arrQueries = [['OWNER TO', 'SET SCHEMA']];
                    }
                    
                } else if ((/^(ALTER\s*POLICY)/gi).test(strSearchQuery)) {
                    if (strPreviousWord === 'POLICY' && bolFirstSpace) {
                        if (parseFloat(contextData.minorVersionNumber, 10) >= 9.5) {
                            arrQueries = [autocompleteQuery.policies];
                        }
                        
                    } else if (strPreviousKeyWord === 'POLICY' && bolFirstSpace) {
                        arrQueries = [['ON']];
                        
                    } else if (strPreviousWord === 'ON' && bolFirstSpace) {
                        arrQueries = [autocompleteQuery.schemas];
                        
                    } else if (strPreviousKeyWord === 'ON' && bolFirstSpace) {
                        arrQueries = [['TO', 'USING', 'WITH CHECK']];
                        
                    } else if (strPreviousWord === 'TO' && bolFirstSpace) {
                        arrQueries = [['CURRENT_USER', 'PUBLIC', 'SESSION_USER'], autocompleteQuery.roles];
                        
                    } else if (arrPreviousWords[1] === 'TO' && bolFirstSpace) {
                        arrQueries = [['USING', 'WITH CHECK']];
                        
                    } else if (bolCurrentCharWhitespace && bolPreviousCharCloseParen) {
                        arrQueries = [['WITH CHECK']];
                    }
                    
                } else if ((/^(ALTER\s*ROLE)/gi).test(strSearchQuery)) {
                    if (strPreviousWord === 'ROLE' && bolFirstSpace) {
                        arrQueries = [['ALL', 'CURRENT_USER', 'SESSION_USER'], autocompleteQuery.roles];
                        
                    } else if (arrPreviousWords[1] === 'ROLE' && bolFirstSpace) {
                        arrQueries = [['RENAME TO', 'WITH', 'IN DATABASE', 'SET', 'RESET']];
                        
                    } else if (strPreviousWord === 'DATABASE' && bolFirstSpace) {
                        arrQueries = [autocompleteQuery.databases];
                        
                    } else if (arrPreviousWords[1] === 'DATABASE' && bolFirstSpace) {
                        arrQueries = [['SET', 'RESET']];
                        
                    } else if (strPreviousWord === 'SET' && bolFirstSpace) {
                        arrQueries = [autocompleteQuery.settings];
                        
                    } else if (strPreviousWord === 'WITH' && bolFirstSpace) {
                        arrQueries = [['SUPERUSER', 'NOSUPERUSER', 'CREATEDB', 'NOCREATEDB', 'CREATEROLE', 'NOCREATEROLE', 'CREATEUSER', 'NOCREATEUSER', 'INHERIT', 'NOINHERIT', 'LOGIN', 'NOLOGIN', 'REPLICATION', 'NOREPLICATION', 'BYPASSRLS', 'NOBYPASSRLS', 'CONNECTION LIMIT', 'ENCRYPTED PASSWORD', 'UNENCRYPTED PASSWORD', 'VALID UNTIL']];
                        
                    } else if (arrPreviousWords[1] === 'SET' && bolFirstSpace) {
                        arrQueries = [['TO', 'TO DEFAULT', 'FROM CURRENT']];
                        
                    } else if (strPreviousWord === 'RESET' && bolFirstSpace) {
                        arrQueries = [['ALL'], autocompleteQuery.settings];
                    }
                    
                } else if ((/^(ALTER\s*RULE)/gi).test(strSearchQuery)) {
                    if (strPreviousWord === 'RULE' && bolFirstSpace) {
                        arrQueries = [autocompleteQuery.rules];
                        
                    } else if (arrPreviousWords[1] === 'RULE' && bolFirstSpace) {
                        arrQueries = [['ON']];
                        
                    } else if (strPreviousWord === 'ON' && bolFirstSpace) {
                        arrQueries = [autocompleteQuery.schemas];
                        
                    } else if (arrPreviousWords[1] === 'ON' && bolFirstSpace) {
                        arrQueries = [['RENAME TO']];
                    }
                    
                } else if ((/^(ALTER\s*SCHEMA)/gi).test(strSearchQuery)) {
                    if (strPreviousWord === 'SCHEMA' && bolFirstSpace) {
                        arrQueries = [autocompleteQuery.schemas];
                        
                    } else if (arrPreviousWords[1] === 'SCHEMA' && bolFirstSpace) {
                        arrQueries = [['OWNER TO', 'RENAME TO']];
                    }
                    
                } else if ((/^(ALTER\s*SEQUENCE)/gi).test(strSearchQuery)) {
                    if (strPreviousWord === 'SEQUENCE' && bolFirstSpace) {
                        arrQueries = [['IF EXISTS'], autocompleteQuery.schemas];
                        
                    } else if (strPreviousWord === 'EXISTS' && bolFirstSpace) {
                        arrQueries = [autocompleteQuery.schemas];
                        
                    } else if ((/(SEQUENCE|EXISTS)/gi).test(arrPreviousWords[1]) && bolFirstSpace) {
                        arrQueries = [['OWNER TO', 'RENAME TO', 'SET SCHEMA', 'INCREMENT BY', 'MINVALUE', 'NO MINVALUE', 'MAXVALUE', 'NO MAXVALUE', 'START WITH', 'RESTART', 'RESTART WITH', 'CACHE', 'CYCLE', 'NO CYCLE', 'OWNED BY', 'OWNED BY NONE']];
                        
                    } else if ((arrPreviousWords[1] + arrPreviousWords[0]) === 'OWNEDBY' && bolFirstSpace) {
                        arrQueries = [autocompleteQuery.schemas];
                    }
                    
                } else if ((/^(ALTER\s*SERVER)/gi).test(strSearchQuery)) {
                    if (strPreviousWord === 'SERVER' && bolFirstSpace) {
                        arrQueries = [autocompleteQuery.servers];
                        
                    } else if (strPreviousKeyWord === 'SERVER' && bolFirstSpace) {
                        arrQueries = [['VERSION', 'OPTIONS', 'OWNER TO', 'RENAME TO']];
                        
                    } else if (strPreviousKeyWord === 'VERSION' && bolFirstSpace) {
                        arrQueries = [['OPTIONS']];
                        
                    } else if (bolCurrentCharOpenParen || bolAfterComma) {
                        arrQueries = [['ADD', 'SET', 'DROP']];
                    }
                    
                } else if ((/^(ALTER\s*SYSTEM)/gi).test(strSearchQuery)) {
                    if (strPreviousWord === 'SYSTEM' && bolFirstSpace) {
                        arrQueries = [['SET', 'RESET']];
                        
                    } else if (strPreviousWord === 'SET' && bolFirstSpace) {
                        arrQueries = [autocompleteQuery.settings];
                        
                    } else if (arrPreviousWords[1] === 'SET' && bolFirstSpace) {
                        arrQueries = [['TO', 'TO DEFAULT']];
                        
                    } else if (strPreviousWord === 'RESET' && bolFirstSpace) {
                        arrQueries = [['ALL'], autocompleteQuery.settings];
                    }
                    
                } else if ((/^(ALTER\s*TABLESPACE)/gi).test(strSearchQuery)) {
                    if (strPreviousWord === 'TABLESPACE' && bolFirstSpace) {
                        arrQueries = [autocompleteQuery.tablespace];
                        
                    } else if (arrPreviousWords[1] === 'TABLESPACE' && bolFirstSpace) {
                        arrQueries = [['RENAME TO', 'OWNER TO', 'SET', 'RESET']];
                        
                    } else if (bolCurrentCharOpenParen || bolAfterComma) {
                        arrQueries = [['seq_page_cost', 'random_page_cost']];
                    }
                    
                } else if ((/^(ALTER\s*TABLE)/gi).test(strSearchQuery)) {
                    if (strPreviousWord === 'TABLE' && bolFirstSpace) {
                        arrQueries = [['IF EXISTS', 'ONLY', 'ALL IN TABLESPACE'], autocompleteQuery.schemas];
                        
                    } else if ((arrPreviousWords[2] + arrPreviousWords[1] + arrPreviousWords[0]) === 'TABLEIFEXISTS'
                            && bolFirstSpace) {
                        arrQueries = [['ONLY'], autocompleteQuery.schemas];
                        
                    } else if (strPreviousWord === 'ONLY' && bolFirstSpace) {
                        arrQueries = [autocompleteQuery.schemas];
                        
                    } else if ((
                                    strPreviousKeyWord === 'TABLE'
                                 || (arrPreviousKeyWords[2] + arrPreviousKeyWords[1] + arrPreviousKeyWords[0]) === 'TABLEIFEXISTS'
                                 || strPreviousKeyWord === 'ONLY'
                                )
                                && bolFirstSpace) {
                        arrQueries = [['RENAME TO', 'SET SCHEMA', 'OWNER TO', 'ADD COLUMN', 'RENAME COLUMN', 'DROP COLUMN', 'ALTER COLUMN', 'RENAME CONSTRAINT', 'ADD', 'ALTER CONSTRAINT', 'VALIDATE CONSTRAINT', 'DROP CONSTRAINT', 'DISABLE TRIGGER', 'ENABLE TRIGGER', 'ENABLE REPLICA TRIGGER', 'ENABLE ALWAYS TRIGGER', 'DISABLE RULE', 'ENABLE RULE', 'ENABLE REPLICA RULE', 'ENABLE ALWAYS RULE', 'DISABLE ROW LEVEL SECURITY', 'ENABLE ROW LEVEL SECURITY', 'FORCE ROW LEVEL SECURITY', 'NO FORCE ROW LEVEL SECURITY', 'CLUSTER ON', 'SET WITHOUT CLUSTER', 'SET WITH OIDS', 'SET WITHOUT OIDS', 'SET TABLESPACE', 'SET LOGGED', 'SET UNLOGGED', 'SET', 'RESET', 'INHERIT', 'NO INHERIT', 'OF', 'NOT OF', 'REPLICA IDENTITY DEFAULT', 'REPLICA IDENTITY USING INDEX', 'REPLICA IDENTITY FULL', 'REPLICA IDENTITY NOTHING']];
                        
                    } else if ((arrPreviousWords[2] + arrPreviousWords[1] === 'ADDCOLUMN')
                            && bolFirstSpace) {
                        arrQueries = [autocompleteQuery.types];
                        
                    } else if ((arrPreviousWords[3] + arrPreviousWords[2] === 'ADDCOLUMN')
                            && bolFirstSpace) {
                        arrQueries = [['COLLATE']];
                        
                    } else if ( (
                                    (arrPreviousWords[1] + arrPreviousWords[0] === 'DROPCOLUMN')
                                 || (arrPreviousWords[3] + arrPreviousWords[2] + arrPreviousWords[1] + arrPreviousWords[0] === 'DROPCOLUMNIFEXISTS')
                                 || (arrPreviousWords[1] + arrPreviousWords[0] === 'RENAMECOLUMN')
                                 || (arrPreviousWords[1] + arrPreviousWords[0] === 'ALTERCOLUMN')
                                ) && bolFirstSpace) {
                        if (arrPreviousWords[1] === 'DROP') {
                            arrQueries = [['IF EXISTS'], autocompleteQuery.allcolumns];
                        } else {
                            arrQueries = [autocompleteQuery.allcolumns];
                        }
                        
                    } else if ((
                            ((arrPreviousKeyWords[1] + arrPreviousKeyWords[0]) === 'DROPCOLUMN')
                         || ((arrPreviousKeyWords[3] + arrPreviousKeyWords[2] + arrPreviousKeyWords[1] + arrPreviousKeyWords[0]) === 'DROPCOLUMNIFEXISTS')
                        ) && bolFirstSpace) {
                        arrQueries = [['RESTRICT', 'CASCADE']];
                        
                    } else if ( (arrPreviousKeyWords[1] + arrPreviousKeyWords[0] === 'RENAMECOLUMN')
                                && bolFirstSpace) {
                        arrQueries = [['TO']];
                        
                    } else if ( (arrPreviousKeyWords[1] + arrPreviousKeyWords[0] === 'ALTERCOLUMN')
                                && bolFirstSpace) {
                        arrQueries = [['TYPE', 'SET DEFAULT', 'DROP DEFAULT', 'SET NOT NULL', 'DROP NOT NULL', 'RESET', 'SET'
                                     , 'SET STATISTICS', 'SET STORAGE PLAIN', 'SET STORAGE EXTERNAL', 'SET STORAGE EXTENDED'
                                     , 'SET STORAGE MAIN']];
                        
                    } else if (strPreviousWord === 'TYPE' && bolFirstSpace) {
                        arrQueries = [autocompleteQuery.types];
                        
                    } else if (strPreviousKeyWord === 'TYPE' && bolFirstSpace) {
                        arrQueries = [['COLLATE']];
                        
                    } else if (strPreviousWord === 'COLLATE' && bolFirstSpace) {
                        arrQueries = [autocompleteQuery.collations];
                        
                    } else if (strPreviousKeyWord === 'COLLATE' && bolFirstSpace) {
                        arrQueries = [['USING']];
                        
                    } else if ((arrPreviousWords[1] + arrPreviousWords[0] === 'RENAMECONSTRAINT')
                            && bolFirstSpace) {
                        arrQueries = [autocompleteQuery.table_qualified_constraints.replace(/\{\{TABLENAME\}\}/gi, arrPreviousWords[2])];
                        
                    } else if ((arrPreviousWords[2] + arrPreviousWords[1] === 'RENAMECONSTRAINT')
                            && bolFirstSpace) {
                        arrQueries = [['TO']];
                        
                    } else if ((arrPreviousWords[1] + arrPreviousWords[0] === 'VALIDATECONSTRAINT')
                            && bolFirstSpace) {
                        arrQueries = [autocompleteQuery.table_qualified_constraints.replace(/\{\{TABLENAME\}\}/gi, arrPreviousWords[2])];
                        
                    } else if ((arrPreviousWords[1] + arrPreviousWords[0] === 'DROPCONSTRAINT')
                            && bolFirstSpace) {
                        arrQueries = [['IF EXISTS'], autocompleteQuery.table_qualified_constraints.replace(/\{\{TABLENAME\}\}/gi, arrPreviousWords[2])];
                        
                    } else if ((arrPreviousWords[3] + arrPreviousWords[2] + arrPreviousWords[1] + arrPreviousWords[0]) === 'DROPCONSTRAINTIFEXISTS'
                            && bolFirstSpace) {
                        arrQueries = [autocompleteQuery.table_qualified_constraints.replace(/\{\{TABLENAME\}\}/gi, arrPreviousWords[4])];
                        
                    } else if ((
                                     (arrPreviousWords[4] + arrPreviousWords[3] + arrPreviousWords[2] + arrPreviousWords[1]) === 'DROPCONSTRAINTIFEXISTS'
                                  || (arrPreviousWords[2] + arrPreviousWords[1]) === 'DROPCONSTRAINT'
                                ) && bolFirstSpace) {
                        arrQueries = [['RESTRICT', 'CASCADE']];
                        
                    } else if ((
                                    (arrPreviousWords[1] + arrPreviousWords[0]) === 'DISABLETRIGGER'
                                 || (arrPreviousWords[1] + arrPreviousWords[0]) === 'ENABLETRIGGER'
                               ) && bolFirstSpace) {
                        arrQueries = [['ALL', 'USER'], autocompleteQuery.table_qualified_triggers.replace(/\{\{TABLENAME\}\}/gi, arrPreviousWords[2])];
                        
                    } else if ((
                                    (arrPreviousWords[2] + arrPreviousWords[1] + arrPreviousWords[0]) === 'ENABLEREPLICATRIGGER'
                                 || (arrPreviousWords[2] + arrPreviousWords[1] + arrPreviousWords[0]) === 'ENABLEALWAYSTRIGGER'
                               ) && bolFirstSpace) {
                        arrQueries = [autocompleteQuery.table_qualified_triggers.replace(/\{\{TABLENAME\}\}/gi, arrPreviousWords[3])];
                        
                    } else if (strPreviousWord === 'INHERIT' && bolFirstSpace) {
                        arrQueries = [autocompleteQuery.schemas];
                        
                    } else if ((arrPreviousWords[1] + arrPreviousWords[0]) === 'ALTERCONSTRAINT'
                            && bolFirstSpace) {
                        arrQueries = [autocompleteQuery.table_qualified_triggers.replace(/\{\{TABLENAME\}\}/gi, arrPreviousWords[2])];
                        
                    } else if ((arrPreviousKeyWords[1] + arrPreviousKeyWords[0]) === 'ALTERCONSTRAINT'
                            && bolFirstSpace) {
                        arrQueries = [['DEFERRABLE', 'NOT DEFERRABLE', 'INITIALLY DEFERRED', 'INITIALLY IMMEDIATE']];
                        
                    } else if (strPreviousWord === 'DEFERRABLE' && bolFirstSpace) {
                        arrQueries = [['INITIALLY DEFERRED', 'INITIALLY IMMEDIATE']];
                        
                    } else if (arrPreviousWords.indexOf('ADD') !== -1
                            && arrPreviousWords.indexOf('VALID') === -1
                            && arrPreviousWords.indexOf('COLUMN') === -1
                            && arrPreviousWords.indexOf('CONSTRAINT') === -1
                            && arrPreviousWords.indexOf('INDEX') === -1
                            && strPreviousWord !== 'ADD' && intParenLevel === 0
                            && bolFirstSpace) {
                        arrQueries = [['NOT VALID']];
                        
                    // set after alter column
                    } else if ((arrPreviousKeyWords[1] === 'COLUMN' && (/(SET|RESET)/gi).test(strPreviousKeyWord))
                            && (bolCurrentCharOpenParen || bolAfterComma)) {
                        arrQueries = [['n_distinct = ', 'n_distinct_inherited = ']];
                        
                    // the only other set
                    } else if ((arrPreviousWords.indexOf('SET') !== -1 || arrPreviousWords.indexOf('RESET') !== -1)
                            && (bolCurrentCharOpenParen || bolAfterComma)) {
                        arrQueries = [['fillfactor', 'autovacuum_enabled', 'toast.autovacuum_enabled', 'autovacuum_vacuum_threshold', 'toast.autovacuum_vacuum_threshold', 'autovacuum_vacuum_scale_factor', 'toast.autovacuum_vacuum_scale_factor', 'autovacuum_analyze_threshold', 'autovacuum_analyze_scale_factor', 'autovacuum_vacuum_cost_delay', 'toast.autovacuum_vacuum_cost_delay', 'autovacuum_vacuum_cost_limit', 'toast.autovacuum_vacuum_cost_limit', 'autovacuum_freeze_min_age', 'toast.autovacuum_freeze_min_age', 'autovacuum_freeze_max_age', 'toast.autovacuum_freeze_max_age', 'autovacuum_freeze_table_age', 'toast.autovacuum_freeze_table_age', 'autovacuum_multixact_freeze_min_age', 'toast.autovacuum_multixact_freeze_min_age', 'autovacuum_multixact_freeze_max_age', 'toast.autovacuum_multixact_freeze_max_age', 'autovacuum_multixact_freeze_table_age', 'toast.autovacuum_multixact_freeze_table_age', 'log_autovacuum_min_duration', 'toast.log_autovacuum_min_duration', 'user_catalog_table']];
                        
                    } else if (strPreviousWord === 'ADD' && bolFirstSpace) {
                        arrQueries = [['CONSTRAINT', 'UNIQUE USING INDEX', 'PRIMARY KEY USING INDEX']];
                        
                    } else if (strPreviousWord === 'INDEX' && bolFirstSpace) {
                        arrQueries = [autocompleteQuery.schemas];
                        
                    } else if (strPreviousKeyWord === 'INDEX' && bolFirstSpace) {
                        arrQueries = [['DEFERRABLE', 'NOT DEFERRABLE', 'INITIALLY DEFERRED', 'INITIALLY IMMEDIATE']];
                        
                        
                    } else if ((arrPreviousWords[1] + arrPreviousWords[0]) === 'ADDCONSTRAINT'
                            && bolFirstSpace) {
                        arrQueries = [autocompleteQuery.schemas];
                        
                    } else if ((arrPreviousWords[2] + arrPreviousWords[1]) === 'ADDCONSTRAINT'
                            && bolFirstSpace) {
                        arrQueries = [['UNIQUE USING INDEX', 'PRIMARY KEY USING INDEX']];
                        
                    } else if ((arrPreviousWords[1] + arrPreviousWords[0]) === 'CLUSTERON'
                            && bolFirstSpace) {
                        arrQueries = [autocompleteQuery.schemas];
                        
                    } else if ((
                                (arrPreviousWords[1] + arrPreviousWords[0]) === 'DISABLERULE'
                             || (arrPreviousWords[1] + arrPreviousWords[0]) === 'ENABLERULE'
                            ) && bolFirstSpace) {
                        arrQueries = [autocompleteQuery.table_qualified_rules.replace(/\{\{TABLENAME\}\}/gi, arrPreviousWords[2])];
                        
                    } else if ((
                                (arrPreviousWords[2] + arrPreviousWords[1] + arrPreviousWords[0]) === 'ENABLEREPLICARULE'
                             || (arrPreviousWords[2] + arrPreviousWords[1] + arrPreviousWords[0]) === 'ENABLEALWAYSRULE'
                            ) && bolFirstSpace) {
                        arrQueries = [autocompleteQuery.table_qualified_rules.replace(/\{\{TABLENAME\}\}/gi, arrPreviousWords[3])];
                        
                    } else if (strPreviousWord === 'OF' && bolFirstSpace) {
                        arrQueries = [autocompleteQuery.types];
                        
                    } else if (strPreviousWord === 'TABLESPACE' && bolFirstSpace) {
                        arrQueries = [autocompleteQuery.tablespace];
                        
                    } else if ((arrPreviousKeyWords[1] + arrPreviousKeyWords[0]) === 'INTABLESPACE'
                            && bolFirstSpace) {
                        arrQueries = [['OWNED BY', 'SET TABLESPACE']];
                        
                    } else if ((arrPreviousWords[1] + arrPreviousWords[0]) === 'OWNEDBY'
                            && bolFirstSpace) {
                        arrQueries = [autocompleteQuery.roles];
                        
                    } else if ((arrPreviousKeyWords[1] + arrPreviousKeyWords[0]) === 'OWNEDBY'
                            && bolFirstSpace) {
                        arrQueries = [['SET TABLESPACE']];
                        
                    } else if ((arrPreviousWords[1] + arrPreviousWords[0]) === 'SETTABLESPACE'
                            && bolFirstSpace) {
                        arrQueries = [autocompleteQuery.tablespace];
                        
                    } else if ((arrPreviousKeyWords[1] + arrPreviousKeyWords[0]) === 'SETTABLESPACE'
                            && bolFirstSpace) {
                        arrQueries = [['NOWAIT']];
                    }
                    
                } else if ((/^(ALTER\s*TEXT\s*SEARCH\s*CONFIGURATION)/gi).test(strSearchQuery)) {
                    if (strPreviousWord === 'CONFIGURATION' && bolFirstSpace) {
                        arrQueries = [autocompleteQuery.schemas];
                        
                    } else if (arrPreviousWords[1] === 'CONFIGURATION' && bolFirstSpace) {
                        arrQueries = [['ADD MAPPING', 'ALTER MAPPING', 'DROP MAPPING', 'RENAME TO', 'OWNER TO', 'SET SCHEMA']];
                        
                    } else if ((arrPreviousWords[1] + arrPreviousWords[0]) === 'ADDMAPPING'
                            && bolFirstSpace) {
                        arrQueries = [['FOR']];
                        
                    } else if ((arrPreviousWords[1] + arrPreviousWords[0]) === 'ALTERMAPPING'
                            && bolFirstSpace) {
                        arrQueries = [['FOR', 'REPLACE']];
                        
                    } else if ((arrPreviousWords[1] + arrPreviousWords[0]) === 'DROPMAPPING'
                            && bolFirstSpace) {
                        arrQueries = [['IF EXISTS', 'FOR']];
                        
                    } else if ((arrPreviousWords[1] + arrPreviousWords[0]) === 'IFEXISTS'
                            && bolFirstSpace) {
                        arrQueries = [['FOR']];
                        
                    } else if (arrPreviousWords[1] === 'REPLACE' && bolFirstSpace) {
                        arrQueries = [['WITH']];
                        
                    } else if (strPreviousWord === 'FOR' && bolFirstSpace) {
                        arrQueries = [autocompleteQuery.text_search_tokens];
                        
                    } else if (strPreviousWord === 'REPLACE' && bolFirstSpace) {
                        arrQueries = [autocompleteQuery.schemas];
                        
                    } else if (strPreviousWord === 'WITH' && bolFirstSpace) {
                        arrQueries = [autocompleteQuery.schemas];
                        
                    } else if (bolAfterComma && autocompleteSearchBackForWord(strScript, intCursorPosition, 'WITH')) {
                        arrQueries = [autocompleteQuery.schemas];
                        
                    } else if (bolAfterComma && autocompleteSearchBackForWord(strScript, intCursorPosition, 'FOR')) {
                        arrQueries = [autocompleteQuery.text_search_tokens];
                        
                    } else if (bolCurrentCharWhitespace && autocompleteSearchBackForWord(strScript, intCursorPosition, 'FOR')
                                                        && !autocompleteSearchBackForWord(strScript, intCursorPosition, 'ADD')) {
                        arrQueries = [['REPLACE', 'WITH']];
                        
                    } else if (bolCurrentCharWhitespace && autocompleteSearchBackForWord(strScript, intCursorPosition, 'FOR')) {
                        arrQueries = [['WITH']];
                    }
                    
                } else if ((/^(ALTER\s*TEXT\s*SEARCH\s*DICTIONARY)/gi).test(strSearchQuery)) {
                    if (strPreviousWord === 'DICTIONARY' && bolFirstSpace) {
                        arrQueries = [['()', 'RENAME TO', 'OWNER TO', 'SET SCHEMA']];
                    }
                    
                } else if ((/^(ALTER\s*TEXT\s*SEARCH\s*PARSER)/gi).test(strSearchQuery)) {
                    if (strPreviousWord === 'PARSER' && bolFirstSpace) {
                        arrQueries = [['RENAME TO', 'SET SCHEMA']];
                    }
                    
                } else if ((/^(ALTER\s*TEXT\s*SEARCH\s*TEMPLATE)/gi).test(strSearchQuery)) {
                    if (strPreviousWord === 'TEMPLATE' && bolFirstSpace) {
                        arrQueries = [['RENAME TO', 'SET SCHEMA']];
                    }
                    
                } else if ((/^(ALTER\s*TRIGGER)/gi).test(strSearchQuery)) {
                    if (strPreviousWord === 'TRIGGER' && bolFirstSpace) {
                        arrQueries = [autocompleteQuery.triggers];
                        
                    } else if (arrPreviousWords[1] === 'TRIGGER' && bolFirstSpace) {
                        arrQueries = [['ON']];
                        
                    } else if (strPreviousWord === 'ON' && bolFirstSpace) {
                        arrQueries = [autocompleteQuery.schemas];
                        
                    } else if (arrPreviousWords[1] === 'ON' && bolFirstSpace) {
                        arrQueries = [['RENAME TO']];
                    }
                    
                } else if ((/^(ALTER\s*TYPE)/gi).test(strSearchQuery)) {
                    if (strPreviousWord === 'TYPE' && bolFirstSpace
                                                        && !autocompleteSearchBackForWord(strScript, intCursorPosition, 'ATTRIBUTE')) {
                        arrQueries = [autocompleteQuery.schemas];
                        
                    } else if (arrPreviousWords[1] === 'TYPE' && bolFirstSpace
                                                        && !autocompleteSearchBackForWord(strScript, intCursorPosition, 'ATTRIBUTE')) {
                        arrQueries = [['OWNER TO', 'RENAME TO', 'SET SCHEMA', 'ADD ATTRIBUTE', 'DROP ATTRIBUTE'
                                     , 'ALTER ATTRIBUTE', 'RENAME ATTRIBUTE', 'ADD VALUE']];
                        
                    } else if ((arrPreviousWords[1] + arrPreviousWords[0]) === 'ALTERATTRIBUTE'
                            && bolFirstSpace) {
                        arrQueries = [autocompleteQuery.allcolumns];
                        
                    } else if ((arrPreviousWords[2] + arrPreviousWords[1]) === 'ALTERATTRIBUTE'
                            && bolFirstSpace) {
                        arrQueries = [['TYPE']];
                        
                    } else if (strPreviousWord === 'TYPE' && bolFirstSpace) {
                        arrQueries = [autocompleteQuery.types];
                        
                    } else if (arrPreviousWords[1] === 'TYPE' && bolFirstSpace) {
                        arrQueries = [['COLLATE', 'CASCADE', 'RESTRICT']];
                        
                    } else if ((arrPreviousWords[1] + arrPreviousWords[0]) === 'ADDATTRIBUTE'
                            && bolFirstSpace) {
                        arrQueries = [autocompleteQuery.allcolumns];
                        
                    } else if ((arrPreviousWords[2] + arrPreviousWords[1]) === 'ADDATTRIBUTE'
                            && bolFirstSpace) {
                        arrQueries = [autocompleteQuery.types];
                        
                    } else if ((arrPreviousWords[3] + arrPreviousWords[2]) === 'ADDATTRIBUTE'
                            && bolFirstSpace) {
                        arrQueries = [['COLLATE', 'CASCADE', 'RESTRICT']];
                        
                    } else if (strPreviousWord === 'COLLATE' && bolFirstSpace) {
                        arrQueries = [autocompleteQuery.collations];
                        
                    } else if (arrPreviousWords[1] === 'COLLATE' && bolFirstSpace) {
                        arrQueries = [['CASCADE', 'RESTRICT']];
                        
                    } else if ((arrPreviousWords[1] + arrPreviousWords[0]) === 'DROPATTRIBUTE'
                            && bolFirstSpace) {
                        arrQueries = [['IF EXISTS'], autocompleteQuery.allcolumns];
                        
                    } else if ((arrPreviousWords[1] + arrPreviousWords[0]) === 'IFEXISTS'
                            && bolFirstSpace) {
                        arrQueries = [autocompleteQuery.allcolumns];
                        
                    } else if ((
                                    (arrPreviousWords[2] + arrPreviousWords[1]) === 'DROPATTRIBUTE'
                                 || (arrPreviousWords[2] + arrPreviousWords[1]) === 'IFEXISTS'
                            ) && bolFirstSpace) {
                        arrQueries = [['CASCADE', 'RESTRICT']];
                        
                    } else if ((arrPreviousWords[1] + arrPreviousWords[0]) === 'RENAMEATTRIBUTE'
                            && bolFirstSpace) {
                        arrQueries = [autocompleteQuery.allcolumns];
                        
                    } else if ((arrPreviousWords[2] + arrPreviousWords[1]) === 'RENAMEATTRIBUTE'
                            && bolFirstSpace) {
                        arrQueries = [['TO']];
                        
                    } else if (arrPreviousWords[1] === 'TO' && bolFirstSpace) {
                        arrQueries = [['CASCADE', 'RESTRICT']];
                        
                    } else if ((arrPreviousWords[1] + arrPreviousWords[0]) === 'ADDVALUE'
                            && bolFirstSpace) {
                        if (parseFloat(contextData.minorVersionNumber, 10) >= 9.3) {
                            arrQueries = [['IF NOT EXISTS']];
                        }
                        
                    } else if ((
                                    (arrPreviousWords[2] + arrPreviousWords[1]) === 'ADDVALUE'
                                 || (arrPreviousWords[2] + arrPreviousWords[1]) === 'NOTEXISTS'
                            ) && bolFirstSpace) {
                        arrQueries = [['BEFORE', 'AFTER']];
                        
                    } else if (strPreviousWord === 'BEFORE' && bolFirstSpace) {
                        arrQueries = [autocompleteQuery.enum_qualified_values.replace(/\{\{ENUMNAME\}\}/gi, arrFirstWords[2])];
                        
                    } else if (strPreviousWord === 'AFTER' && bolFirstSpace) {
                        arrQueries = [autocompleteQuery.enum_qualified_values.replace(/\{\{ENUMNAME\}\}/gi, arrFirstWords[2])];
                    }
                    
                } else if ((/^(ALTER\s*USER\s*MAPPING)/gi).test(strSearchQuery)) {
                    if (strPreviousWord === 'MAPPING' && bolFirstSpace) {
                        arrQueries = [['FOR']];
                        
                    } else if (strPreviousWord === 'FOR' && bolFirstSpace) {
                        if (parseFloat(contextData.minorVersionNumber, 10) >= 9.5) {
                            arrQueries = [['USER', 'CURRENT_USER', 'SESSION_USER', 'PUBLIC'], autocompleteQuery.roles];
                        } else {
                            arrQueries = [['USER', 'CURRENT_USER', 'PUBLIC'], autocompleteQuery.roles];
                        }
                        
                    } else if (arrPreviousWords[1] === 'FOR' && bolFirstSpace) {
                        arrQueries = [['SERVER']];
                        
                    } else if (strPreviousWord === 'SERVER' && bolFirstSpace) {
                        arrQueries = [autocompleteQuery.servers];
                        
                    } else if (arrPreviousWords[1] === 'SERVER' && bolFirstSpace) {
                        arrQueries = [['OPTIONS']];
                        
                    } else if ((strPreviousKeyWord === 'OPTIONS' && bolCurrentCharOpenParen) || bolAfterComma) {
                        arrQueries = [['ADD', 'SET', 'DROP']];
                    }
                    
                } else if ((/^(ALTER\s*USER)/gi).test(strSearchQuery)) {
                    if (strPreviousWord === 'USER' && bolFirstSpace) {
                        if (parseFloat(contextData.minorVersionNumber, 10) >= 9.5) {
                            arrQueries = [['CURRENT_USER', 'SESSION_USER'], autocompleteQuery.roles];
                        } else {
                            arrQueries = [autocompleteQuery.roles];
                        }
                        
                    } else if (arrPreviousWords[1] === 'USER' && bolFirstSpace) {
                        arrQueries = [['WITH', 'RENAME TO', 'SET', 'RESET']];
                        
                    } else if (strPreviousWord === 'WITH' && bolFirstSpace) {
                        arrQueries = [['SUPERUSER', 'NOSUPERUSER', 'CREATEDB', 'NOCREATEDB', 'CREATEROLE', 'NOCREATEROLE', 'CREATEUSER', 'NOCREATEUSER', 'INHERIT', 'NOINHERIT', 'LOGIN', 'NOLOGIN', 'REPLICATION', 'NOREPLICATION', 'CONNECTION LIMIT', 'ENCRYPTED PASSWORD', 'UNENCRYPTED PASSWORD', 'VALID UNTIL']];
                        
                    } else if (strPreviousWord === 'SET' && bolFirstSpace) {
                        arrQueries = [autocompleteQuery.settings];
                        
                    } else if (arrPreviousWords[1] === 'SET' && bolFirstSpace) {
                        arrQueries = [['TO', 'TO DEFAULT', 'FROM CURRENT']];
                        
                    } else if (strPreviousWord === 'RESET' && bolFirstSpace) {
                        arrQueries = [['ALL'], autocompleteQuery.settings];
                    }
                    
                } else if ((/^(ALTER\s*VIEW)/gi).test(strSearchQuery)) {
                    if (strPreviousWord === 'VIEW' && bolFirstSpace) {
                        arrQueries = [['IF EXISTS'], autocompleteQuery.schemas];
                        
                    } else if (strPreviousWord === 'EXISTS' && bolFirstSpace) {
                        arrQueries = [autocompleteQuery.schemas];
                        
                    } else if ((arrPreviousWords[1] === 'VIEW' || arrPreviousWords[1] === 'EXISTS')
                                && bolFirstSpace) {
                        arrQueries = [['ALTER COLUMN', 'OWNER TO', 'RENAME TO', 'SET SCHEMA', 'SET', 'RESET']];
                        
                    } else if ((strPreviousWord === 'ALTER' || strPreviousWord === 'COLUMN')
                                && bolFirstSpace) {
                        arrQueries = [autocompleteQuery.allcolumns];
                        
                    } else if ((arrPreviousWords[1] === 'ALTER' || arrPreviousWords[1] === 'COLUMN')
                                && bolFirstSpace) {
                        arrQueries = [['SET DEFAULT', 'DROP DEFAULT']];
                        
                    } else if (autocompleteSearchBackForWord(strScript, intCursorPosition, 'SET') && (bolCurrentCharOpenParen || bolAfterComma)) {
                        if (parseFloat(contextData.minorVersionNumber, 10) >= 9.3) {
                            arrQueries = [['check_option=\'local\'', 'check_option=\'cascaded\'', 'security_barrier=TRUE', 'security_barrier=FALSE']];
                        } else {
                            arrQueries = [['security_barrier=TRUE', 'security_barrier=FALSE']];
                        }
                        
                    } else if (autocompleteSearchBackForWord(strScript, intCursorPosition, 'RESET') && (bolCurrentCharOpenParen || bolAfterComma)) {
                        if (parseFloat(contextData.minorVersionNumber, 10) >= 9.3) {
                            arrQueries = [['check_option', 'security_barrier']];
                        } else {
                            arrQueries = [['security_barrier']];
                        }
                    }
                    
                } else if ((/^(CREATE)\s*$/gi).test(strSearchQuery)) {
                    if (strPreviousKeyWord === 'CREATE' && bolFirstSpace && strPreviousKeyWord === strPreviousWord) {
                        arrQueries = [['AGGREGATE', 'CAST', 'COLLATION', 'CONVERSION', 'DEFAULT CONVERSION', 'DATABASE', 'DOMAIN', 'EVENT TRIGGER', 'EXTENSION', 'FOREIGN DATA WRAPPER', 'FOREIGN TABLE', 'FUNCTION', 'OR REPLACE FUNCTION', 'GROUP', 'INDEX', 'UNIQUE INDEX', 'OR REPLACE TRUSTED LANGUAGE', 'TRUSTED LANGUAGE', 'LANGUAGE', 'MATERIALIZED VIEW', 'OPERATOR', 'OPERATOR CLASS', 'OPERATOR FAMILY', 'POLICY', 'ROLE', 'RULE', 'OR REPLACE RULE', 'SCHEMA', 'SEQUENCE', 'TEMP SEQUENCE', 'SERVER', 'TABLE', 'TABLE AS', 'TABLESPACE', 'TEXT SEARCH CONFIGURATION', 'TEXT SEARCH DICTIONARY', 'TEXT SEARCH PARSER', 'TEXT SEARCH TEMPLATE', 'TRANSFORM', 'OR REPLACE TRANSFORM', 'TRIGGER', 'CONSTRAINT TRIGGER', 'TYPE', 'USER', 'USER MAPPING', 'VIEW']];
                    }
                    
                } else if ((/^(CREATE\s*AGGREGATE)/gi).test(strSearchQuery)) {
                    if (strPreviousWord === 'AGGREGATE' && bolFirstSpace) {
                        arrQueries = [autocompleteQuery.schemas];
                        
                    } else if (intOpenParen === 1 && (bolAfterComma || bolCurrentCharOpenParen)) {
                        if (parseFloat(contextData.minorVersionNumber, 10) >= 9.4) {
                            arrQueries = [['IN', 'VARIADIC'], autocompleteQuery.types];
                        } else {
                            arrQueries = [autocompleteQuery.types];
                        }
                    } else if (parseFloat(contextData.minorVersionNumber, 10) >= 9.4 &&
                                (arrPreviousWords[1] + arrPreviousWords[0]) === 'ORDERBY'
                                && bolFirstSpace) {
                        arrQueries = [['IN', 'VARIADIC'], autocompleteQuery.types];
                    } else if (parseFloat(contextData.minorVersionNumber, 10) >= 9.4 &&
                                (strScript.match(/\(/gi) || []).length === 1 && bolCurrentCharWhitespace) {
                        arrQueries = [['ORDER BY'], autocompleteQuery.types];
                        
                    } else if (intOpenParen >= 2
                            && (strCurrentLine === '  ' || strCurrentLine === '    ' || strCurrentLine === '\t' || strCurrentLine.trim() === ',')) {
                        if (parseFloat(contextData.minorVersionNumber, 10) >= 9.4) {
                            arrQueries = [['SFUNC =', 'STYPE =', 'SSPACE =', 'FINALFUNC =', 'FINALFUNC_EXTRA', 'INITCOND =', 'HYPOTHETICAL', 'MSFUNC =', 'MINVFUNC =', 'MSTYPE =', 'MSSPACE =', 'MFINALFUNC =', 'MFINALFUNC_EXTRA', 'MINITCOND =', 'SORTOP =']];
                            
                        } else {
                            arrQueries = [['SFUNC =', 'STYPE =', 'FINALFUNC =', 'INITCOND =', 'SORTOP =']];
                        }
                    } else if ((/FUNC\=$/gi).test(arrPreviousWords[1] + arrPreviousWords[0]) && bolCurrentCharWhitespace) {
                        arrQueries = [autocompleteQuery.schemas];
                    } else if ((/TYPE\=$/gi).test(arrPreviousWords[1] + arrPreviousWords[0]) && bolCurrentCharWhitespace) {
                        arrQueries = [autocompleteQuery.types];
                    } else if ((/OP\=$/gi).test(arrPreviousWords[1] + arrPreviousWords[0]) && bolCurrentCharWhitespace) {
                        arrQueries = [autocompleteQuery.operators];
                    }
                    
                } else if ((/^(CREATE\s*CAST)/gi).test(strSearchQuery)) {
                    if (intCloseParen === 0 && ((strPreviousWord === 'AS' && bolFirstSpace) || bolCurrentCharOpenParen)) {
                        arrQueries = [autocompleteQuery.types];
                        
                    } else if (!autocompleteSearchBackForWord(strScript, intCursorPosition, 'FUNCTION') && bolFirstSpace && intCloseParen === 1) {
                        arrQueries = [['WITH FUNCTION', 'WITHOUT FUNCTION', 'WITH INOUT']];
                        
                    } else if ((arrPreviousWords[1] + strPreviousWord) === 'WITHFUNCTION' && bolFirstSpace) {
                        arrQueries = [autocompleteQuery.schemas];
                        
                    } else if ((
                                    (autocompleteSearchBackForWord(strScript, intCursorPosition, 'WITH') && intCloseParen === 2)
                                 || (autocompleteSearchBackForWord(strScript, intCursorPosition, 'WITHOUT') && intCloseParen === 1)
                                ) && !(/ASSIGNMENT|IMPLICIT/gi).test(strPreviousWord) && bolFirstSpace) {
                        arrQueries = [['AS ASSIGNMENT', 'AS IMPLICIT']];
                    }
                    
                } else if ((/^(CREATE\s*COLLATION)/gi).test(strSearchQuery)) {
                    if (strPreviousWord === 'COLLATION' && bolFirstSpace) {
                        arrQueries = [autocompleteQuery.schemas];
                        
                    } else if (intOpenParen === 1
                            && (strCurrentLine === '  ' || strCurrentLine === '    ' || strCurrentLine === '\t' || strCurrentLine.trim() === ',')) {
                        arrQueries = [['LOCALE =', 'LC_COLLATE =', 'LC_CTYPE =']];
                    }
                    
                } else if ((/^(CREATE\s*CONVERSION|CREATE\s*DEFAULT\s*CONVERSION)/gi).test(strSearchQuery)) {
                    if (strPreviousWord === 'CONVERSION' && bolFirstSpace) {
                        arrQueries = [autocompleteQuery.schemas];
                        
                    } else if (arrPreviousWords[1] === 'CONVERSION' && bolFirstSpace) {
                        arrQueries = [['FOR']];
                        
                    } else if ((strPreviousWord === 'FOR' || strPreviousWord === 'TO') && bolFirstSpace) {
                        arrQueries = [autocompleteQuery.encodings];
                        
                    } else if (arrPreviousWords[1] === 'FOR' && bolFirstSpace) {
                        arrQueries = [['TO']];
                        
                    } else if (arrPreviousWords[1] === 'TO' && bolFirstSpace) {
                        arrQueries = [['FROM']];
                        
                    } else if (strPreviousWord === 'FROM' && bolFirstSpace) {
                        arrQueries = [autocompleteQuery.schemas];
                        
                    } else if (intOpenParen === 1
                            && (strCurrentLine === '  ' || strCurrentLine === '    ' || strCurrentLine === '\t' || strCurrentLine.trim() === ',')) {
                        arrQueries = [['LOCALE =', 'LC_COLLATE =', 'LC_CTYPE =']];
                    }
                    
                } else if ((/^(CREATE\s*DATABASE)/gi).test(strSearchQuery)) {
                    if (arrPreviousWords[1] === 'DATABASE' && bolFirstSpace) {
                        arrQueries = [['WITH']];
                        
                    } else if ((strPreviousWord === 'WITH' && bolFirstSpace && !bolCurrentCharReturn)
                            || (strCurrentLine === '  ' || strCurrentLine === '    ' || strCurrentLine === '\t' || strCurrentLine.trim() === ',')) {
                        arrQueries = [['OWNER =', 'TEMPLATE =', 'ENCODING =', 'LC_COLLATE =', 'LC_CTYPE =', 'TABLESPACE =', 'ALLOW_CONNECTIONS =', 'CONNECTION =', 'IS_TEMPLATE =']];
                        
                    } else if ((/ENCODING\=$/gi).test(arrPreviousWords[1] + arrPreviousWords[0]) && bolCurrentCharWhitespace) {
                        arrQueries = [autocompleteQuery.encodings];
                    } else if ((/COLLATE\=$/gi).test(arrPreviousWords[1] + arrPreviousWords[0]) && bolCurrentCharWhitespace) {
                        arrQueries = [autocompleteQuery.collates];
                    } else if ((/TYPE\=$/gi).test(arrPreviousWords[1] + arrPreviousWords[0]) && bolCurrentCharWhitespace) {
                        arrQueries = [autocompleteQuery.types];
                    } else if ((/TABLESPACE\=$/gi).test(arrPreviousWords[1] + arrPreviousWords[0]) && bolCurrentCharWhitespace) {
                        arrQueries = [autocompleteQuery.tablespace];
                    } else if ((/IS_TEMPLATE\=$/gi).test(arrPreviousWords[1] + arrPreviousWords[0]) && bolCurrentCharWhitespace) {
                        arrQueries = [['TRUE', 'FALSE']];
                    } else if ((/ALLOW_CONNECTIONS\=$/gi).test(arrPreviousWords[1] + arrPreviousWords[0]) && bolCurrentCharWhitespace) {
                        arrQueries = [['TRUE', 'FALSE']];
                    } else if ((/TEMPLATE\=$/gi).test(arrPreviousWords[1] + arrPreviousWords[0]) && bolCurrentCharWhitespace) {
                        arrQueries = [autocompleteQuery.databases];
                    }
                    
                } else if ((/^(CREATE\s*DOMAIN)/gi).test(strSearchQuery)) {
                    if (arrPreviousWords[1] === 'DOMAIN' && bolFirstSpace && !bolCurrentCharReturn) {
                        arrQueries = [['AS']];
                        
                    } else if ((strPreviousWord === 'AS' && bolFirstSpace && !bolCurrentCharReturn)) {
                        arrQueries = [autocompleteQuery.types];
                        
                    } else if (arrPreviousWords[1] === 'AS' && bolFirstSpace && !bolCurrentCharReturn) {
                        arrQueries = [['COLLATE', 'DEFAULT']];
                        
                    } else if (strPreviousWord === 'COLLATE' && bolFirstSpace && !bolCurrentCharReturn) {
                        arrQueries = [autocompleteQuery.collates];
                        
                    } else if ((strCurrentLine === '  ' || strCurrentLine === '    ' || strCurrentLine === '\t' || strCurrentLine.trim() === ',')) {
                        arrQueries = [['CONSTRAINT', 'NOT NULL', 'NULL', 'CHECK']];
                        
                    } else if (strPreviousWord === 'CONSTRAINT' && bolFirstSpace && !bolCurrentCharReturn) {
                        arrQueries = [autocompleteQuery.constraints];
                        
                    } else if (arrPreviousWords[1] === 'CONSTRAINT' && bolFirstSpace && !bolCurrentCharReturn) {
                        arrQueries = [['NOT NULL', 'NULL', 'CHECK']];
                    }
                    
                } else if ((/^(CREATE\s*EVENT\s*TRIGGER)/gi).test(strSearchQuery)) {
                    if (intVersion >= 9.3) {
                        if (arrPreviousWords[1] === 'TRIGGER' && bolFirstSpace && !bolCurrentCharReturn) {
                            arrQueries = [['ON']];
                            
                        } else if ((strPreviousWord === 'ON' && bolFirstSpace && !bolCurrentCharReturn)) {
                            arrQueries = [['ddl_command_start', 'ddl_command_end', 'table_rewrite', 'sql_drop']];
                            
                        } else if (arrPreviousWords[1] === 'ON' && bolFirstSpace && !bolCurrentCharReturn) {
                            arrQueries = [['WHEN TAG IN', 'EXECUTE PROCEDURE']];
                            
                        } else if ((strPreviousWord === 'PROCEDURE' && bolFirstSpace && !bolCurrentCharReturn)) {
                            arrQueries = [autocompleteQuery.schemas];
                            
                        } else if ((strPreviousWord[strPreviousWord.length - 1] === ')' && bolFirstSpace)) {
                            arrQueries = [['AND WHEN TAG IN', 'EXECUTE PROCEDURE']];
                        }
                    }
                    
                } else if ((/^(CREATE\s*EXTENSION)/gi).test(strSearchQuery)) {
                    if ((strPreviousWord === 'EXTENSION' && bolFirstSpace && !bolCurrentCharReturn)) {
                        arrQueries = [['IF NOT EXISTS']];
                        
                    } else if ((/(EXISTS|EXTENSION)/gi).test(arrPreviousWords[1]) && bolFirstSpace && !bolCurrentCharReturn) {
                        arrQueries = [['WITH']];
                        
                    } else if ((strPreviousWord === 'SCHEMA' && bolFirstSpace && !bolCurrentCharReturn)) {
                        arrQueries = [autocompleteQuery.schemas];
                        
                    } else if ((strPreviousWord === 'WITH' || (/(SCHEMA|VERSION|FROM)/gi).test(arrPreviousWords[1]))
                            && bolCurrentCharWhitespace && !bolCurrentCharReturn) {
                        arrQueries = [['SCHEMA', 'VERSION', 'FROM']];
                    }
                    
                } else if ((/^(CREATE\s*FOREIGN\s*DATA\s*WRAPPER)/gi).test(strSearchQuery)) {
                    if ((strCurrentLine === '  ' || strCurrentLine === '    ' || strCurrentLine === '\t' || strCurrentLine.trim() === ',')) {
                        arrQueries = [['HANDLER', 'VALIDATOR', 'OPTIONS']];
                        
                    } else if (arrPreviousWords[1] !== 'NO' && strPreviousWord === 'HANDLER' && bolFirstSpace && !bolCurrentCharReturn) {
                        arrQueries = [['NO HANDLER'], autocompleteQuery.schemas];
                        
                    } else if (arrPreviousWords[1] !== 'NO' && strPreviousWord === 'VALIDATOR' && bolFirstSpace && !bolCurrentCharReturn) {
                        arrQueries = [['NO VALIDATOR'], autocompleteQuery.schemas];
                    }
                    
                } else if ((/^(CREATE\s*FOREIGN\s*TABLE)/gi).test(strSearchQuery)) {
                    if (strPreviousWord === 'TABLE') {
                        arrQueries = [['IF NOT EXISTS']];
                        
                    } else if (strPreviousWord === 'EXISTS') {
                        arrQueries = [autocompleteQuery.schemas];
                        
                    } else if (intParenLevel === 1 && strCurrentLine.trim() === strPreviousWord && bolFirstSpace) {
                        arrQueries = [autocompleteQuery.types];
                        
                    } else if (intParenLevel === 1 && strCurrentLine.trim() === '') {
                        arrQueries = [['CONSTRAINT', 'CHECK']];
                        
                    } else if (autocompleteGlobals.arrTypes.indexOf(strPreviousWord.toLowerCase()) !== -1 && bolFirstSpace) {
                        arrQueries = [['OPTIONS', 'COLLATE', 'CONSTRAINT', 'NOT NULL', 'NULL', 'CHECK', 'DEFAULT']];
                        
                    } else if (arrPreviousWords[1] === 'CONSTRAINT' && bolFirstSpace) {
                        arrQueries = [['NOT NULL', 'NULL', 'CHECK', 'DEFAULT']];
                        
                    } else if (strPreviousWord === 'COLLATE' && bolFirstSpace) {
                        arrQueries = [autocompleteQuery.collates];
                        
                    } else if (intParenLevel === 0 && strPreviousWord[strPreviousWord.length - 1] === ')' && bolFirstSpace) {
                        arrQueries = [['INHERITS', 'SERVER', 'OPTIONS']];
                        
                    } else if (strPreviousWord === 'SERVER' && bolFirstSpace) {
                        arrQueries = [autocompleteQuery.servers];
                    }
                    
                } else if ((/^(CREATE\s*FUNCTION|CREATE\s*OR\s*REPLACE\s*FUNCTION)/gi).test(strSearchQuery)) {
                    if (strPreviousWord === 'FUNCTION' && bolFirstSpace) {
                        arrQueries = [autocompleteQuery.schemas];
                        
                    } else if (strPreviousWord === 'RETURNS' && bolFirstSpace) {
                        arrQueries = [['TABLE'], autocompleteQuery.types];
                        
                    } else if (autocompleteSearchBackForWord(strScript, intCursorPosition, 'TABLE')
                            && (bolCurrentCharWhitespace && intParenLevel === 1) || (bolCurrentCharOpenParen || bolAfterComma)) {
                        arrQueries = [autocompleteQuery.types];
                        
                    } else if ((bolCurrentCharWhitespace && intParenLevel === 1) || (bolCurrentCharOpenParen || bolAfterComma)) {
                        arrQueries = [autocompleteQuery.types];
                        
                    } else if (strPreviousWord === 'LANGUAGE' && bolFirstSpace) {
                        arrQueries = [autocompleteQuery.language];
                        
                    } else if (strPreviousWord === 'TYPE' && bolFirstSpace) {
                        arrQueries = [autocompleteQuery.types];
                        
                    } else if (strPreviousWord === 'SET' && bolFirstSpace) {
                        arrQueries = [autocompleteQuery.settings];
                        
                    } else if (arrPreviousWords[1] === 'SET' && bolFirstSpace) {
                        arrQueries = [['TO', 'FROM CURRENT']];
                    }
                    
                } else if ((/^(CREATE\s*GROUP)/gi).test(strSearchQuery)) {
                    if (arrPreviousWords[1] === 'GROUP' && !autocompleteSearchBackForWord(strScript, intCursorPosition, 'WITH') && bolFirstSpace) {
                        arrQueries = [['WITH']];
                    } else if ((/^(ROLE|GROUP|ADMIN|USER)$/gi).test(strPreviousWord) || bolAfterComma) {
                        arrQueries = [autocompleteQuery.roles];
                    } else if (autocompleteSearchBackForWord(strScript, intCursorPosition, 'WITH') && bolCurrentCharWhitespace) {
                        arrQueries = [['SUPERUSER', 'NOSUPERUSER', 'CREATEDB', 'NOCREATEDB', 'CREATEROLE', 'NOCREATEROLE', 'CREATEUSER', 'NOCREATEUSER', 'INHERIT', 'NOINHERIT', 'LOGIN', 'NOLOGIN', 'ENCRYPTED PASSWORD', 'UNENCRYPTED PASSWORD', 'VALID UNTIL', 'IN ROLE', 'IN GROUP', 'ROLE', 'ADMIN', 'USER']];
                    }
                    
                } else if ((/^(CREATE\s*INDEX|CREATE\s*UNIQUE\s*INDEX)/gi).test(strSearchQuery)) {
                    if (strPreviousWord === 'ON' && bolFirstSpace) {
                        arrQueries = [autocompleteQuery.schemas];
                        
                    } else if (strPreviousWord === 'USING' && bolFirstSpace) {
                        arrQueries = [autocompleteQuery.access_methods];
                        
                    } else if (strPreviousWord === 'COLLATE' && bolFirstSpace) {
                        arrQueries = [autocompleteQuery.collates];
                        
                    } else if (strPreviousWord === 'TABLESPACE' && bolFirstSpace) {
                        arrQueries = [autocompleteQuery.tablespace];
                        
                    } else if (autocompleteSearchBackForWord(strScript, intCursorPosition, 'WITH')
                                && !autocompleteSearchBackForWord(strScript, intCursorPosition, 'WHERE')
                                && (bolCurrentCharOpenParen || bolAfterComma)) {
                        arrQueries = [['buffering =', 'fillfactor =', 'fastupdate =', 'gin_pending_list_limit =', 'pages_per_range =']];
                    }
                    
                } else if ((/^(CREATE[\s(OR|REPLACE|PROCEDURAL|TRUSTED)]*LANGUAGE)/gi).test(strSearchQuery)) {
                    if (strPreviousWord === 'HANDLER' && bolFirstSpace) {
                        arrQueries = [autocompleteQuery.schemas];
                    } else if (strPreviousWord === 'INLINE' && bolFirstSpace) {
                        arrQueries = [autocompleteQuery.schemas];
                    } else if (strPreviousWord === 'VALIDATOR' && bolFirstSpace) {
                        arrQueries = [autocompleteQuery.schemas];
                    } else if ((strCurrentLine === '  ' || strCurrentLine === '    ' || strCurrentLine === '\t')) {
                        arrQueries = [['HANDLER', 'INLINE', 'VALIDATOR']];
                    }
                    
                } else if ((/^(CREATE\s*MATERIALIZED\s*VIEW)/gi).test(strSearchQuery)) {
                    if (intVersion >= 9.3) {
                        if (strPreviousWord === 'VIEW' && bolFirstSpace) {
                            arrQueries = [['IF NOT EXISTS'], autocompleteQuery.schemas];
                            
                        } else if (strPreviousWord === 'EXISTS' && bolFirstSpace) {
                            arrQueries = [autocompleteQuery.schemas];
                            
                        } else if (strPreviousWord === 'TABLESPACE' && bolFirstSpace) {
                            arrQueries = [autocompleteQuery.tablespace];
                            
                        } else if (autocompleteSearchBackForWord(strScript, intCursorPosition, 'WITH')
                                    && !autocompleteSearchBackForWord(strScript, intCursorPosition, 'SELECT')
                                    && (bolCurrentCharOpenParen || bolAfterComma)) {
                            arrQueries = [['fillfactor', 'autovacuum_enabled', 'toast.autovacuum_enabled', 'autovacuum_vacuum_threshold', 'toast.autovacuum_vacuum_threshold', 'autovacuum_vacuum_scale_factor', 'toast.autovacuum_vacuum_scale_factor', 'autovacuum_analyze_threshold', 'autovacuum_analyze_scale_factor', 'autovacuum_vacuum_cost_delay', 'toast.autovacuum_vacuum_cost_delay', 'autovacuum_vacuum_cost_limit', 'toast.autovacuum_vacuum_cost_limit', 'autovacuum_freeze_min_age', 'toast.autovacuum_freeze_min_age', 'autovacuum_freeze_max_age', 'toast.autovacuum_freeze_max_age', 'autovacuum_freeze_table_age', 'toast.autovacuum_freeze_table_age', 'autovacuum_multixact_freeze_min_age', 'toast.autovacuum_multixact_freeze_min_age', 'autovacuum_multixact_freeze_max_age', 'toast.autovacuum_multixact_freeze_max_age', 'autovacuum_multixact_freeze_table_age', 'toast.autovacuum_multixact_freeze_table_age', 'log_autovacuum_min_duration', 'toast.log_autovacuum_min_duration', 'user_catalog_table']];
                        }
                    }
                    
                } else if ((/^(CREATE\s*OPERATOR\s*CLASS)/gi).test(strSearchQuery)) {
                    if (strPreviousWord === 'CLASS' && bolFirstSpace) {
                        arrQueries = [autocompleteQuery.schemas];
                        
                    } else if (arrPreviousWords[1] === 'CLASS' && bolFirstSpace) {
                        arrQueries = [['FOR TYPE', 'DEFAULT FOR TYPE']];
                        
                    } else if (strPreviousWord === 'TYPE' && bolFirstSpace) {
                        arrQueries = [autocompleteQuery.types];
                        
                    } else if (arrPreviousWords[1] === 'TYPE' && bolFirstSpace) {
                        arrQueries = [['USING']];
                        
                    } else if (strPreviousWord === 'USING' && bolFirstSpace) {
                        arrQueries = [autocompleteQuery.access_methods];
                        
                    } else if (strPreviousWord === 'FAMILY' && bolFirstSpace) {
                        arrQueries = [autocompleteQuery.schemas];
                        
                    } else if (strPreviousWord === 'STORAGE' && bolFirstSpace) {
                        arrQueries = [autocompleteQuery.types];
                        
                    } else if (arrPreviousWords[1] === 'OPERATOR' && bolFirstSpace) {
                        arrQueries = [autocompleteQuery.schemas];
                        
                    } else if (strPreviousWord[1] === 'BY' && bolFirstSpace) {
                        arrQueries = [autocompleteQuery.btree_operator_families];
                        
                    } else if ((strCurrentLine === '  ' || strCurrentLine === '    ' || strCurrentLine === '\t' ||
                                (strCurrentLine.trim() === ',' && bolFirstSpace))) {
                        arrQueries = [['OPERATOR','FUNCTION','STORAGE']];
                    }
                    
                } else if ((/^(CREATE\s*OPERATOR\s*FAMILY)/gi).test(strSearchQuery)) {
                    if (strPreviousWord === 'FAMILY' && bolFirstSpace) {
                        arrQueries = [autocompleteQuery.schemas];
                        
                    } else if (arrPreviousWords[1] === 'FAMILY' && bolFirstSpace) {
                        arrQueries = [['USING']];
                        
                    } else if (strPreviousWord === 'USING' && bolFirstSpace) {
                        arrQueries = [autocompleteQuery.access_methods];
                    }
                    
                } else if ((/^(CREATE\s*OPERATOR)/gi).test(strSearchQuery)) {
                    if (strPreviousWord === 'OPERATOR' && bolFirstSpace) {
                        arrQueries = [autocompleteQuery.schemas];
                        
                    } else if (intParenLevel === 1
                            && (strCurrentLine === '  ' || strCurrentLine === '    ' || strCurrentLine === '\t' ||
                                (strCurrentLine.trim() === ',' && bolFirstSpace))) {
                        arrQueries = [['PROCEDURE =','LEFTARG =','RIGHTARG =','COMMUTATOR =','NEGATOR =','RESTRICT =','JOIN =','HASHES','MERGES']];
                        
                    } else if ((/(PROCEDURE|JOIN|RESTRICT)\=$/gi).test(arrPreviousWords[1] + arrPreviousWords[0]) && bolCurrentCharWhitespace) {
                        arrQueries = [autocompleteQuery.schemas];
                    } else if ((/(COMMUTATOR|NEGATOR)\=$/gi).test(arrPreviousWords[1] + arrPreviousWords[0]) && bolCurrentCharWhitespace) {
                        arrQueries = [autocompleteQuery.schemas];
                    } else if ((/ARG\=$/gi).test(arrPreviousWords[1] + arrPreviousWords[0]) && bolCurrentCharWhitespace) {
                        arrQueries = [autocompleteQuery.types];
                    }
                    
                } else if ((/^(CREATE\s*POLICY)/gi).test(strSearchQuery)) {
                    if (intVersion >= 9.5) {
                        if (strPreviousWord === 'POLICY') {
                            arrQueries = [autocompleteQuery.schemas];
                            
                        } else if (arrPreviousWords[1] === 'POLICY' && bolFirstSpace) {
                            arrQueries = [['ON']];
                            
                        } else if (strPreviousWord === 'ON' && bolFirstSpace) {
                            arrQueries = [autocompleteQuery.schemas];
                            
                        } else if ((strCurrentLine === '  ' || strCurrentLine === '    ' || strCurrentLine === '\t')) {
                            arrQueries = [['FOR', 'TO', 'USING', 'WITH CHECK']];
                            
                        } else if (strPreviousWord === 'FOR' && bolFirstSpace) {
                            arrQueries = [['ALL', 'SELECT', 'INSERT', 'UPDATE', 'DELETE']];
                            
                        } else if (strPreviousWord === 'TO' && bolFirstSpace) {
                            arrQueries = [['PUBLIC', 'CURRENT_USER', 'SESSION_USER'], autocompleteQuery.roles];
                        }
                    }
                    
                } else if ((/^(CREATE\s*ROLE)/gi).test(strSearchQuery)) {
                    if (arrPreviousWords[1] === 'ROLE' && !autocompleteSearchBackForWord(strScript, intCursorPosition, 'WITH') && bolFirstSpace) {
                        arrQueries = [['WITH']];
                    } else if (((/^(ROLE|GROUP|ADMIN|USER)$/gi).test(strPreviousWord) || bolAfterComma)
                                && autocompleteSearchBackForWord(strScript, intCursorPosition, 'WITH')) {
                        arrQueries = [autocompleteQuery.roles];
                    } else if (autocompleteSearchBackForWord(strScript, intCursorPosition, 'WITH') && bolCurrentCharWhitespace) {
                        arrQueries = [['SUPERUSER','NOSUPERUSER','CREATEDB','NOCREATEDB','CREATEROLE','NOCREATEROLE','CREATEUSER','NOCREATEUSER','INHERIT','NOINHERIT','LOGIN','NOLOGIN','REPLICATION','NOREPLICATION','BYPASSRLS','NOBYPASSRLS','CONNECTION LIMIT','ENCRYPTED PASSWORD','UNENCRYPTED PASSWORD','VALID UNTIL','IN ROLE','IN GROUP','ROLE','ADMIN','USER']];
                    }
                    
                } else if ((/^(CREATE\s*RULE|CREATE\s*OR\s*REPLACE\s*RULE)/gi).test(strSearchQuery)) {
                    if (arrPreviousWords[1] === 'RULE' && bolFirstSpace) {
                        arrQueries = [['AS ON']];
                        
                    } else if (strPreviousWord === 'ON' && bolFirstSpace) {
                        arrQueries = [['SELECT', 'INSERT', 'UPDATE', 'DELETE']];
                        
                    } else if (arrPreviousWords[1] === 'ON' && bolFirstSpace) {
                        arrQueries = [['TO']];
                        
                    } else if (strPreviousWord === 'TO' && bolFirstSpace) {
                        arrQueries = [autocompleteQuery.schemas];
                        
                    } else if (arrPreviousWords[1] === 'TO' && bolFirstSpace) {
                        arrQueries = [['WHERE', 'DO']];
                        
                    } else if (strPreviousWord === 'DO' && bolFirstSpace) {
                        arrQueries = [['ALSO', 'INSTEAD', 'NOTHING', 'SELECT', 'INSERT', 'UPDATE', 'DELETE', 'NOTIFY']];
                        
                    } else if ((/(ALSO|INSTEAD)/).test(strPreviousWord) && bolFirstSpace) {
                        arrQueries = [['NOTHING', 'SELECT', 'INSERT', 'UPDATE', 'DELETE', 'NOTIFY']];
                    }
                    
                } else if ((/^(CREATE\s*SCHEMA)/gi).test(strSearchQuery)) {
                    if (strPreviousWord === 'SCHEMA' && bolFirstSpace) {
                        arrQueries = [['IF NOT EXISTS']];
                        
                    } else if ((arrPreviousWords[1] === 'SCHEMA' || arrPreviousWords[1] === 'EXISTS') && bolFirstSpace) {
                        arrQueries = [['AUTHORIZATION']];
                        
                    } else if (strPreviousWord === 'AUTHORIZATION' && bolFirstSpace) {
                        arrQueries = [autocompleteQuery.roles];
                    }
                    
                } else if ((/^(CREATE\s*SEQUENCE|CREATE\s*TEMP\s*SEQUENCE|CREATE\s*TEMPORARY\s*SEQUENCE)/gi).test(strSearchQuery)) {
                    if (strPreviousWord === 'SEQUENCE' && bolFirstSpace) {
                        arrQueries = [['IF NOT EXISTS'], autocompleteQuery.schemas];
                        
                    } else if (strPreviousWord === 'EXISTS' && bolFirstSpace) {
                        arrQueries = [autocompleteQuery.schemas];
                        
                    } else if ((strCurrentLine === '  ' || strCurrentLine === '    ' || strCurrentLine === '\t')) {
                        arrQueries = [['INCREMENT BY','MINVALUE','MAXVALUE','NO MINVALUE','NO MAXVALUE','START WITH','CACHE','CYCLE','NO CYCLE','OWNED BY']];
                        
                    } else if ((arrPreviousWords[1] + strPreviousWord) === 'OWNEDBY' && bolFirstSpace) {
                        arrQueries = [['NONE'], autocompleteQuery.schemas];
                    }
                    
                } else if ((/^(CREATE\s*SERVER)/gi).test(strSearchQuery)) {
                    if (arrPreviousWords[1] === 'SERVER'
                                && (
                                        (bolFirstSpace && !bolCurrentCharReturn)
                                     || (strCurrentLine === '  ' || strCurrentLine === '    ' || strCurrentLine === '\t')
                                    )) {
                        arrQueries = [['TYPE', 'VERSION', 'FOREIGN DATA WRAPPER']];
                        
                    } else if (arrPreviousWords[1] === 'TYPE'
                                && (
                                        (bolFirstSpace && !bolCurrentCharReturn)
                                     || (strCurrentLine === '  ' || strCurrentLine === '    ' || strCurrentLine === '\t')
                                    )) {
                        arrQueries = [['VERSION', 'FOREIGN DATA WRAPPER']];
                        
                    } else if (arrPreviousWords[1] === 'VERSION'
                                && (
                                        (bolFirstSpace && !bolCurrentCharReturn)
                                     || (strCurrentLine === '  ' || strCurrentLine === '    ' || strCurrentLine === '\t')
                                    )) {
                        arrQueries = [['FOREIGN DATA WRAPPER']];
                        
                    } else if (strPreviousWord === 'WRAPPER' && bolFirstSpace) {
                        arrQueries = [autocompleteQuery.foreign_data_wrapper];
                        
                    } else if (arrPreviousWords[1] === 'WRAPPER'
                                && (
                                        (bolFirstSpace && !bolCurrentCharReturn)
                                     || (strCurrentLine === '  ' || strCurrentLine === '    ' || strCurrentLine === '\t')
                                    )) {
                        arrQueries = [['OPTIONS']];
                    }
                    
                } else if ((/^(CREATE\s*TABLESPACE)/gi).test(strSearchQuery)) {
                    if (arrPreviousWords[1] === 'TABLESPACE' && bolFirstSpace) {
                        arrQueries = [['OWNER', 'LOCATION', 'WITH']];
                        
                    } else if (arrPreviousWords[1] === 'OWNER' && bolFirstSpace) {
                        arrQueries = [['LOCATION', 'WITH']];
                        
                    } else if (arrPreviousWords[1] === 'LOCATION' && bolFirstSpace) {
                        arrQueries = [['WITH']];
                        
                    } else if (strPreviousWord === 'OWNER') {
                        if (parseFloat(contextData.minorVersionNumber, 10) >= 9.5) {
                            arrQueries = [['CURRENT_USER', 'SESSION_USER'], autocompleteQuery.roles];
                        } else {
                            arrQueries = [autocompleteQuery.roles];
                        }
                        
                    } else if (bolCurrentCharOpenParen || bolAfterComma) {
                        arrQueries = [['seq_page_cost =', 'random_page_cost =']];
                    }
                    
                } else if ((/^(CREATE[\s(GLOBAL|LOCAL|TEMPORARY|TEMP|UNLOGGED)]*TABLE)/gi).test(strSearchQuery)) {
                    if (strPreviousWord === 'TABLE' && bolFirstSpace) {
                        arrQueries = [['IF NOT EXISTS'], autocompleteQuery.schemas];
                        
                    } else if (strPreviousWord === 'EXISTS' && bolFirstSpace) {
                        arrQueries = [autocompleteQuery.schemas];
                        
                    } else if (strPreviousWord === 'OF' && bolFirstSpace) {
                        arrQueries = [autocompleteQuery.types];
                        
                    } else if (strPreviousWord === 'COLLATE' && bolFirstSpace) {
                        arrQueries = [autocompleteQuery.types];
                        
                    } else if (strPreviousWord === 'LIKE' && bolFirstSpace) {
                        arrQueries = [autocompleteQuery.schemas];
                        
                    } else if (arrPreviousWords[1] === 'LIKE' && bolFirstSpace) {
                        arrQueries = [['INCLUDING', 'EXCLUDING']];
                        
                    } else if ((strPreviousWord === 'INCLUDING' || strPreviousWord === 'EXCLUDING') && bolFirstSpace) {
                        arrQueries = [['DEFAULTS', 'CONSTRAINTS', 'INDEXES', 'STORAGE', 'COMMENTS', 'ALL']];
                        
                    } else if (strPreviousKeyWord === 'INHERITS' && (bolCurrentCharOpenParen || bolAfterComma)) {
                        arrQueries = [autocompleteQuery.schemas];
                        
                    } else if (strPreviousKeyWord === 'WITH' && (bolCurrentCharOpenParen || bolAfterComma)) {
                            arrQueries = [['fillfactor', 'autovacuum_enabled', 'toast.autovacuum_enabled', 'autovacuum_vacuum_threshold', 'toast.autovacuum_vacuum_threshold', 'autovacuum_vacuum_scale_factor', 'toast.autovacuum_vacuum_scale_factor', 'autovacuum_analyze_threshold', 'autovacuum_analyze_scale_factor', 'autovacuum_vacuum_cost_delay', 'toast.autovacuum_vacuum_cost_delay', 'autovacuum_vacuum_cost_limit', 'toast.autovacuum_vacuum_cost_limit', 'autovacuum_freeze_min_age', 'toast.autovacuum_freeze_min_age', 'autovacuum_freeze_max_age', 'toast.autovacuum_freeze_max_age', 'autovacuum_freeze_table_age', 'toast.autovacuum_freeze_table_age', 'autovacuum_multixact_freeze_min_age', 'toast.autovacuum_multixact_freeze_min_age', 'autovacuum_multixact_freeze_max_age', 'toast.autovacuum_multixact_freeze_max_age', 'autovacuum_multixact_freeze_table_age', 'toast.autovacuum_multixact_freeze_table_age', 'log_autovacuum_min_duration', 'toast.log_autovacuum_min_duration', 'user_catalog_table']];
                        
                    } else if ((arrPreviousWords[1] + strPreviousWord) === 'ONCOMMIT' && bolFirstSpace) {
                        arrQueries = [['PRESERVE ROWS', 'DELETE ROWS', 'DROP']];
                        
                    } else if (strPreviousWord === 'TABLESPACE' && bolFirstSpace) {
                        arrQueries = [autocompleteQuery.tablespace];
                        
                    } else if (strPreviousWord === 'USING' && bolFirstSpace) {
                        arrQueries = [autocompleteQuery.access_methods];
                        
                    } else if (strPreviousWord === 'CONSTRAINT' && bolFirstSpace) {
                        arrQueries = [autocompleteQuery.constraint];
                        
                    } else if (strPreviousWord === 'REFERENCES' && bolFirstSpace) {
                        arrQueries = [autocompleteQuery.schemas];
                        
                    } else if (strPreviousKeyWord === 'REFERENCES' && (bolCurrentCharOpenParen || bolAfterComma)) {
                        arrQueries = [autocompleteQuery.allcolumns];
                        
                    } else if ((
                                    (arrPreviousWords[1] + strPreviousWord) === 'ONDELETE'
                                 || (arrPreviousWords[1] + strPreviousWord) === 'ONUPDATE'
                                ) && bolFirstSpace) {
                        arrQueries = [['NO ACTION', 'RESTRICT', 'CASCADE', 'SET NULL', 'SET DEFAULT']];
                        
                    } else if (strCurrentLine.trim().toUpperCase() === strPreviousWord && strPreviousWord !== strPreviousKeyWord && bolFirstSpace) {
                        arrQueries = [autocompleteQuery.types];
                    }
                    
                } else if ((/^(CREATE\s*TEXT\s*SEARCH\s*CONFIGURATION)/gi).test(strSearchQuery)) {
                    if (strPreviousWord === 'CONFIGURATION' && bolFirstSpace) {
                        arrQueries = [autocompleteQuery.schemas];
                        
                    } else if (bolCurrentCharOpenParen) {
                        arrQueries = [['PARSER =', 'COPY =']];
                        
                    } else if ((/(PARSER|COPY)\=$/gi).test(arrPreviousWords[1] + arrPreviousWords[0]) && bolCurrentCharWhitespace) {
                        arrQueries = [autocompleteQuery.schemas];
                    }
                    
                } else if ((/^(CREATE\s*TEXT\s*SEARCH\s*DICTIONARY)/gi).test(strSearchQuery)) {
                    if (strPreviousWord === 'DICTIONARY' && bolFirstSpace) {
                        arrQueries = [autocompleteQuery.schemas];
                        
                    } else if ((/(TEMPLATE)\=$/gi).test(arrPreviousWords[1] + arrPreviousWords[0]) && bolCurrentCharWhitespace) {
                        arrQueries = [autocompleteQuery.schemas];
                    }
                    
                } else if ((/^(CREATE\s*TEXT\s*SEARCH\s*PARSER)/gi).test(strSearchQuery)) {
                    if (strPreviousWord === 'PARSER' && bolFirstSpace) {
                        arrQueries = [autocompleteQuery.schemas];
                        
                    } else if ((strCurrentLine === '  ' || strCurrentLine === '    ' || strCurrentLine === '\t')) {
                        arrQueries = [['START =', 'GETTOKEN =', 'END =', 'LEXTYPES =', 'HEADLINE =']];
                        
                    } else if ((/(START|GETTOKEN|END|LEXTYPES|HEADLINE)\=$/gi).test(arrPreviousWords[1] + arrPreviousWords[0])
                            && bolCurrentCharWhitespace) {
                        arrQueries = [autocompleteQuery.schemas];
                    }
                    
                } else if ((/^(CREATE\s*TEXT\s*SEARCH\s*TEMPLATE)/gi).test(strSearchQuery)) {
                    if (strPreviousWord === 'TEMPLATE' && bolFirstSpace) {
                        arrQueries = [autocompleteQuery.schemas];
                        
                    } else if ((strCurrentLine === '  ' || strCurrentLine === '    ' || strCurrentLine === '\t')) {
                        arrQueries = [['INIT =', 'LEXIZE =']];
                        
                    } else if ((/(INIT|LEXIZE)\=$/gi).test(arrPreviousWords[1] + arrPreviousWords[0])
                            && bolCurrentCharWhitespace) {
                        arrQueries = [autocompleteQuery.schemas];
                    }
                    
                } else if ((/^(CREATE\s*TRANSFORM|CREATE\s*OR\s*REPLACE\s*TRANSFORM)/gi).test(strSearchQuery)) {
                    if (strPreviousWord === 'TRANSFORM' && bolFirstSpace) {
                        arrQueries = [['FOR']];
                        
                    } else if (strPreviousWord === 'FOR' && bolFirstSpace) {
                        arrQueries = [autocompleteQuery.types];
                        
                    } else if (arrPreviousWords[1] === 'FOR' && bolFirstSpace) {
                        arrQueries = [['LANGUAGE']];
                        
                    } else if (strPreviousWord === 'LANGUAGE' && bolFirstSpace) {
                        arrQueries = [autocompleteQuery.language];
                        
                    } else if ((strCurrentLine === '  ' || strCurrentLine === '    ' || strCurrentLine === '\t')) {
                        arrQueries = [['FROM SQL WITH FUNCTION', 'TO SQL WITH FUNCTION']];
                        
                    } else if (strPreviousWord === 'FUNCTION' && bolFirstSpace) {
                        arrQueries = [autocompleteQuery.schemas];
                    }
                    
                } else if ((/^(CREATE\s*TRIGGER|CREATE\s*CONSTRAINT\s*TRIGGER)/gi).test(strSearchQuery)) {
                    if (strPreviousWord === 'TRIGGER' && bolFirstSpace) {
                        arrQueries = [autocompleteQuery.schemas];
                        
                    } else if (arrPreviousWords[1] === 'TRIGGER' && bolFirstSpace) {
                        arrQueries = [['BEFORE', 'AFTER', 'INSTEAD OF']];
                        
                    } else if ((
                                       strPreviousWord === 'BEFORE'
                                    || strPreviousWord === 'AFTER'
                                    || strPreviousWord === 'OR'
                                    || (arrPreviousWords[1] + strPreviousWord) === 'INSTEADOF'
                                ) && bolFirstSpace) {
                        arrQueries = [['INSERT', 'UPDATE', 'DELETE', 'TRUNCATE']];
                        
                    } else if (strPreviousWord === 'ON' && bolFirstSpace) {
                        arrQueries = [autocompleteQuery.schemas];
                        
                    } else if (strPreviousWord === 'FROM' && bolFirstSpace) {
                        arrQueries = [autocompleteQuery.schemas];
                        
                    } else if (strPreviousWord === 'PROCEDURE' && bolFirstSpace) {
                        arrQueries = [autocompleteQuery.schemas];
                    }
                    
                } else if ((/^(CREATE\s*TYPE)/gi).test(strSearchQuery)) {
                    if (strPreviousWord === 'TYPE' && bolFirstSpace) {
                        arrQueries = [autocompleteQuery.schemas];
                        
                    } else if (arrPreviousWords[1] === 'TYPE' && bolFirstSpace) {
                        arrQueries = [['AS', 'AS RANGE', 'AS ENUM', '(']];
                        
                    } else if (strPreviousWord === 'COLLATE' && bolFirstSpace) {
                        arrQueries = [autocompleteQuery.collates];
                        
                    } else if (!autocompleteSearchBackForWord(strScript, intCursorPosition, 'AS') &&
                                (strCurrentLine === '  ' || strCurrentLine === '    ' || strCurrentLine === '\t')) {
                        arrQueries = [['INPUT =','OUTPUT =','RECEIVE =','SEND =','TYPMOD_IN =','TYPMOD_OUT =','ANALYZE =','INTERNALLENGTH =','PASSEDBYVALUE','ALIGNMENT =','STORAGE =','LIKE =','CATEGORY =','PREFERRED =','DEFAULT =','ELEMENT =','DELIMITER =','COLLATABLE =']];
                        
                    } else if (autocompleteSearchBackForWord(strScript, intCursorPosition, 'RANGE') &&
                                (strCurrentLine === '  ' || strCurrentLine === '    ' || strCurrentLine === '\t')) {
                        arrQueries = [['SUBTYPE =','SUBTYPE_OPCLASS =','COLLATION =','CANONICAL =','SUBTYPE_DIFF =']];
                        
                    } else if (autocompleteSearchBackForWord(strScript, intCursorPosition, 'AS') &&
                                !autocompleteSearchBackForWord(strScript, intCursorPosition, 'RANGE') &&
                                !autocompleteSearchBackForWord(strScript, intCursorPosition, 'ENUM') &&
                                strCurrentLine.trim().toUpperCase() === strPreviousWord && bolFirstSpace) {
                        arrQueries = [autocompleteQuery.types];
                        
                    } else if (autocompleteSearchBackForWord(strScript, intCursorPosition, 'AS') &&
                                !autocompleteSearchBackForWord(strScript, intCursorPosition, 'RANGE') &&
                                !autocompleteSearchBackForWord(strScript, intCursorPosition, 'ENUM') &&
                                (strCurrentLine === '  ' || strCurrentLine === '    ' || strCurrentLine === '\t')) {
                        arrQueries = [autocompleteQuery.allcolumns];
                        
                    } else if ((/(PREFERRED|COLLATABLE)\=$/gi).test(arrPreviousWords[1] + arrPreviousWords[0]) && bolCurrentCharWhitespace) {
                        arrQueries = [['TRUE', 'FALSE']];
                        
                    } else if ((/(STORAGE)\=$/gi).test(arrPreviousWords[1] + arrPreviousWords[0]) && bolCurrentCharWhitespace) {
                        arrQueries = [['plain', 'external', 'extended', 'main']];
                        
                    } else if ((/(LIKE|ELEMENT|SUBTYPE)\=$/gi).test(arrPreviousWords[1] + arrPreviousWords[0]) && bolCurrentCharWhitespace) {
                        arrQueries = [autocompleteQuery.types];
                        
                    } else if ((/(ALIGNMENT)\=$/gi).test(arrPreviousWords[1] + arrPreviousWords[0]) && bolCurrentCharWhitespace) {
                        arrQueries = [['char', 'int2', 'int4', 'double']];
                        
                    } else if ((/(CATEGORY)\=$/gi).test(arrPreviousWords[1] + arrPreviousWords[0]) && bolCurrentCharWhitespace) {
                        arrQueries = [['A','B','C','D','E','G','I','N','P','R','S','T','U','V','X']];
                        
                    } else if ((/(INTERNALLENGTH)\=$/gi).test(arrPreviousWords[1] + arrPreviousWords[0]) && bolCurrentCharWhitespace) {
                        arrQueries = [['VARIABLE']];
                        
                    } else if ((/(COLLATION)\=$/gi).test(arrPreviousWords[1] + arrPreviousWords[0]) && bolCurrentCharWhitespace) {
                        arrQueries = [autocompleteQuery.collations];
                        
                    } else if ((/(SUBTYPE_OPCLASS|CANONICAL|SUBTYPE_DIFF|INPUT|OUTPUT|RECEIVE|SEND|TYPMOD_IN|TYPMOD_OUT|ANALYZE)\=$/gi)
                                    .test(arrPreviousWords[1] + arrPreviousWords[0]) && bolCurrentCharWhitespace) {
                        arrQueries = [autocompleteQuery.schemas];
                    }
                    
                } else if ((/^(CREATE\s*USER\s*MAPPING)/gi).test(strSearchQuery)) {
                    if (strPreviousWord === 'MAPPING' && bolFirstSpace) {
                        arrQueries = [['FOR']];
                        
                    } else if (strPreviousWord === 'FOR' && bolFirstSpace) {
                        arrQueries = [['USER', 'CURRENT_USER', 'PUBLIC'], autocompleteQuery.logins];
                        
                    } else if (arrPreviousWords[1] === 'FOR' && bolFirstSpace) {
                        arrQueries = [['SERVER']];
                        
                    } else if (strPreviousWord === 'SERVER' && bolFirstSpace) {
                        arrQueries = [autocompleteQuery.servers];
                        
                    } else if (arrPreviousWords[1] === 'SERVER' && bolFirstSpace) {
                        arrQueries = [['OPTIONS']];
                    }
                    
                } else if ((/^(CREATE\s*USER)/gi).test(strSearchQuery)) {
                    if (arrPreviousWords[1] === 'USER' && !autocompleteSearchBackForWord(strScript, intCursorPosition, 'WITH') && bolFirstSpace) {
                        arrQueries = [['WITH']];
                    } else if (((/^(ROLE|GROUP|ADMIN|USER)$/gi).test(strPreviousWord) || bolAfterComma)
                                && autocompleteSearchBackForWord(strScript, intCursorPosition, 'WITH')) {
                        arrQueries = [autocompleteQuery.roles];
                    } else if (autocompleteSearchBackForWord(strScript, intCursorPosition, 'WITH') && bolCurrentCharWhitespace) {
                        arrQueries = [['SUPERUSER','NOSUPERUSER','CREATEDB','NOCREATEDB','CREATEROLE','NOCREATEROLE','CREATEUSER','NOCREATEUSER','INHERIT','NOINHERIT','LOGIN','NOLOGIN','REPLICATION','NOREPLICATION','BYPASSRLS','NOBYPASSRLS','CONNECTION LIMIT','ENCRYPTED PASSWORD','UNENCRYPTED PASSWORD','VALID UNTIL','IN ROLE','IN GROUP','ROLE','ADMIN','USER']];
                    }
                    
                } else if ((/^(CREATE[\s(OR|REPLACE|TEMP|TEMPORARY|RECURSIVE)]*VIEW)/gi).test(strSearchQuery)) {
                    if (strPreviousWord === 'VIEW' && bolFirstSpace) {
                        arrQueries = [autocompleteQuery.schemas];
                        
                    } else if (arrPreviousWords[1] === 'VIEW' && bolFirstSpace) {
                        arrQueries = [['WITH']];
                        
                    } else if (strPreviousKeyWord === 'WITH' && (bolCurrentCharOpenParen || bolAfterComma)) {
                        arrQueries = [['check_option', 'security_barrier=true', 'security_barrier=false']];
                    }
                    
                } else if ((/^(ABORT)/gi).test(strSearchQuery)) {
                    if (strPreviousWord === 'ABORT' && bolFirstSpace) {
                        arrQueries = [['WORK', 'TRANSACTION']];
                    }
                    
                } else if ((/^(COMMIT\s*PREPARED)/gi).test(strSearchQuery)) {
                    if (strPreviousWord === 'PREPARED' && bolFirstSpace) {
                        arrQueries = [autocompleteQuery.prepared_transactions];
                    }
                    
                } else if ((/^(COMMIT)/gi).test(strSearchQuery)) {
                    if (strPreviousWord === 'COMMIT' && bolFirstSpace) {
                        arrQueries = [['WORK', 'TRANSACTION', 'PREPARED']];
                    }
                    
                } else if ((/^(END)/gi).test(strSearchQuery)) {
                    if (strPreviousWord === 'END' && bolFirstSpace) {
                        arrQueries = [['WORK', 'TRANSACTION']];
                    }
                    
                } else if ((/^(NOTIFY)/gi).test(strSearchQuery)) {
                    if (strPreviousWord === 'NOTIFY' && bolFirstSpace) {
                        arrQueries = [autocompleteQuery.listening_channels];
                    }
                    
                } else if ((/^(RELEASE)/gi).test(strSearchQuery)) {
                    if (strPreviousWord === 'RELEASE' && bolFirstSpace) {
                        arrQueries = [['SAVEPOINT']];
                    }
                    
                } else if ((/^(ROLLBACK\s*PREPARED)/gi).test(strSearchQuery)) {
                    if (strPreviousWord === 'ROLLBACK' && bolFirstSpace) {
                        arrQueries = [autocompleteQuery.prepared_transactions];
                    }
                    
                } else if ((/^(ROLLBACK)/gi).test(strSearchQuery)) {
                    if (strPreviousWord === 'ROLLBACK' && bolFirstSpace) {
                        arrQueries = [['WORK', 'TRANSACTION', 'PREPARED', 'TO SAVEPOINT']];
                    }
                    
                } else if ((/^(DECLARE)/gi).test(strSearchQuery)) {
                    if (arrPreviousWords[1] === 'DECLARE' && bolFirstSpace) {
                        arrQueries = [['BINARY', 'INSENSITIVE', 'SCROLL', 'NO SCROLL', 'CURSOR']];
                        
                    } else if (strPreviousWord === 'BINARY' && bolFirstSpace) {
                        arrQueries = [['INSENSITIVE', 'SCROLL', 'NO SCROLL', 'CURSOR']];
                        
                    } else if (strPreviousWord === 'INSENSITIVE' && bolFirstSpace) {
                        arrQueries = [['SCROLL', 'NO SCROLL', 'CURSOR']];
                        
                    } else if (strPreviousWord === 'SCROLL' && bolFirstSpace) {
                        arrQueries = [['CURSOR']];
                        
                    } else if (strPreviousWord === 'CURSOR' && bolFirstSpace) {
                        arrQueries = [['WITH HOLD', 'WITHOUT HOLD']];
                        
                    } else if ((/(WITH|WITHOUT|HOLD)/gi).test(strPreviousWord) && bolFirstSpace) {
                        arrQueries = [['FOR']];
                    }
                }
                
                // do something with arrContextLists
                // order when autocompleteQuery.allcolumns is in arrQueries
                
                // if we've found queries: open the popup
                if (arrQueries && arrQueries.length > 0) {
                    autocompleteGlobals.intSearchStart = intEndCursorPosition - 1;
                    autocompleteGlobals.intSearchEnd = intEndCursorPosition;
                    autocompletePopupOpen(editor, arrQueries);
                }
                
            // autocomplete after dot
            } else if (bolCurrentCharPeriod) {
                // get prefixes
                jsnPrefix = autocompleteGetPrefix(strScript, intCursorPosition + 1);
                arrPrefix = jsnPrefix.arrStrings;
                
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
                    }
                }
            }
        }
    }
}

function autocompleteFirstQueriesByType(arrPreviousKeyWords, bolCurrentCharWhitespace, strPreviousWord) {
    'use strict';
    var arrQueries
      , oneWord = arrPreviousKeyWords[0]
      , twoWord = arrPreviousKeyWords[1] + arrPreviousKeyWords[0]
      , threeWord = arrPreviousKeyWords[2] + arrPreviousKeyWords[1] + arrPreviousKeyWords[0]
      , intVersion = parseFloat(contextData.minorVersionNumber, 10);
    
    if (bolCurrentCharWhitespace && arrPreviousKeyWords[0] === strPreviousWord && (
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
        
    } else if (bolCurrentCharWhitespace) {
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
