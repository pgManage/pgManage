/*jslint white:true*/
var bolQuerySelectionLoaded = true;

function scanFirstLevelRange(tabElement, strScript, jsnCursor, searchRange) {
    'use strict';
    var intStart = 0, intCursor, arrStatements;
    
    // in first level: exception should not split the range
    
    // count these as parenthesis:
    //      (declare, begin) -> END;
    //      (for, WHILE, loop) -> END LOOP; label?
    //      (IF) -> END IF;
    //      (CASE WHEN) -> END CASE;
    
    // search until first keyword and get the ranges of keyword to semicolon and if the mouse is inside: continue
    
    // convert cursor position (row and column) to character number
    intCursor = rowAndColumnToIndex(strScript, jsnCursor.start.row, jsnCursor.start.column);
    
    //// consume comments
    //strScript = consumeComments(strScript);
    
    // loop through script and split on unparenthesised, unquoted semicolons until start and end encompass the cursor
    var int_qs = 0 // quote status
      , int_ps = 0 // parenthesis level
      , int_statement = 0
      , int_element_len = 0
      , int_tag = 0
      , str_tag = ''
      , arr_str_list = []
      , str_form_data = strScript
      , int_form_data_length
      , int_inputstring_len
      , str_trailing, ptr_loop, ptr_start, int_chunk_len
      , int_query_start, int_query_end, int_query_length
      , arr_int_open_paren_indexes = [], str_srch_string
      , str_function_quote, int_function_quote_len, ptr_quote_loop
      , bolFoundQuery = false, i, len, jsnStart, jsnEnd, searchStart
      , searchEnd, arrStartMatches, arrEndMatches, int_declare, int_loop, statement_tag_length
      , strSubstring, bolFunction;
    
    if (searchRange) {
        searchStart = rowAndColumnToIndex(strScript, searchRange.start.row, searchRange.start.column);
        searchEnd = rowAndColumnToIndex(strScript, searchRange.end.row, searchRange.end.column);
        
        strSubstring = strScript.substring(searchStart, searchEnd);
        bolFunction = (/^(CREATE|(CREATE\ OR\ REPLACE))\s*FUNCTION/gi).test(strSubstring.trim());
        
        int_form_data_length = searchEnd - searchStart;
        int_inputstring_len = searchEnd - searchStart;
        ptr_loop = searchStart;
        ptr_start = searchStart;
        
        //console.log('1:', searchRange, searchStart, searchEnd, strScript.substring(searchStart, searchEnd));
        
    } else {
        bolFunction = (/^(CREATE|(CREATE\ OR\ REPLACE))\s*FUNCTION/gi).test(strScript.trim());
        int_form_data_length = str_form_data.length;
        int_inputstring_len = str_form_data.length;
        ptr_loop = 0;
        ptr_start = 0;
    }
    
    arrStatements = [
        {'name': 'loop',  'start': /^(FOR|WHILE|LOOP)/i,                   'end': /^END[\s]*LOOP/i}
      , {'name': 'if',    'start': /^IF/i,                                 'end': /^END[\s]*IF[\s]*;/i, 'exclude': /^IF\s*(NOT\s*EXISTS|EXISTS)/i}
      , {'name': 'case',  'start': /^CASE/i,                               'end': /^END[\s]*(CASE)?/i}
      , {'name': 'begin', 'start': /^(DECLARE|BEGIN|EXCEPTION[^;]*THEN)/i, 'end': /^END[\s]*;/i}
    ];
    
    //// if not a function remove FOR and IF
    //if (!bolFunction) {
    //    arrStatements.splice(0,1);
    //    arrStatements.splice(0,1);
    //}
    
    intStart = ptr_loop;
    int_declare = 0;
    int_loop = 0;
    
    // quote status (int_qs) values
    //      0 => no quotes
    //      2 => dollar tag
    //      3 => single quote
    //      4 => double quote
    //      5 => multiline comment
    //      6 => line comment
    //      7 => create function quote
    
    // special mention:
    //      int_ps is the number of parenthesis we are deep
    
    // loop through script
    while (int_inputstring_len > 0) {
        int_element_len += 1;
        
        //console.log('   input length: ' + int_inputstring_len + '\n' +
        //            ' element length: ' + int_element_len + '\n' +
        //            'current 2 chars: ' + str_form_data.substr(ptr_loop, 2));
        
        if (int_ps === 0 && int_qs === 0 && !(/^[0-9a-z_]$/gi).test(str_form_data.substr(ptr_loop - 1, 1))) {
            for (i = 0, len = arrStatements.length; i < len; i += 1) {
                arrStartMatches = str_form_data.substring(ptr_loop).match(arrStatements[i].start);
                arrEndMatches = str_form_data.substring(ptr_loop).match(arrStatements[i].end);
                
                strSubstring = str_form_data.substring((str_form_data[intStart] === ';' ? intStart + 1 : intStart), (ptr_loop - 1));
                bolFunction = (/^(CREATE|(CREATE\ OR\ REPLACE))\s*FUNCTION/gi).test(strSubstring.trim());
                
                // FOUND UNCOMMENTED, UNQUOTED, UNPARENTHESISED STATEMENT
                if (arrStartMatches
                        && (bolFunction === true || (arrStatements[i].name !== 'loop' && arrStatements[i].name !== 'if'))
                        && (
                            !arrStatements[i].exclude
                         || !(arrStatements[i].exclude).test(str_form_data.substring(ptr_loop))
                        )
                    ) {
                    statement_tag_length = (arrStartMatches[0].indexOf(';') === -1 ? arrStartMatches[0].length : arrStartMatches[0].length - 1);
                    
                    if (int_declare === 0 && int_loop === 0) { int_statement += 1; }
                    if (int_declare !== 0) { int_declare -= 1; }
                    if (int_loop !== 0) { int_loop -= 1; }
                    
                    if (arrStartMatches[0].toLowerCase() === 'declare') {
                        int_declare += 1;
                    }
                    if (arrStartMatches[0].toLowerCase().indexOf('exception') === 0) {
                        int_statement -= 1;
                    }
                    if (arrStartMatches[0].toLowerCase() === 'for') {
                        int_loop += 1;
                    }
                    
                    ptr_loop += statement_tag_length;
                    int_inputstring_len -= statement_tag_length;
                    
                    //console.log('1***', int_statement, arrStartMatches[0]); //,
                    //            arrStatements[i].start,
                    //            //str_form_data.substring(ptr_loop).match(arrStatements[i].start),
                    //            '\n' + str_form_data.substring(ptr_loop, ptr_loop + 20));
                    break;
                    
                // FOUND UNCOMMENTED, UNQUOTED, UNPARENTHESISED STATEMENT END
                } else if (arrEndMatches) {
                    statement_tag_length = (arrEndMatches[0].indexOf(';') === -1 ? arrEndMatches[0].length : arrEndMatches[0].length - 1);
                    int_statement -= 1;
                    ptr_loop += statement_tag_length;
                    int_inputstring_len -= statement_tag_length;
                    
                    //console.log('2***', int_statement, arrEndMatches[0]); //,
                    //            arrStatements[i].end,
                    //            //str_form_data.substring(ptr_loop).match(arrStatements[i].end),
                    //            '\n' + str_form_data.substring(ptr_loop, ptr_loop + 20));
                    break;
                }
            }
        }
        
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
            
        // FOUND SLASH:  we don't skip slashed chars within dollar tags, double quotes and comments.
        } else if (str_form_data.substr(ptr_loop, 1) === "\\" && int_qs !== 4 && int_qs !== 2 && int_qs !== 5 && int_qs !== 6) {
            // skip next character
            ptr_loop += 1;
            int_inputstring_len -= int_chunk_len;
            int_chunk_len = 1;
            int_element_len += int_chunk_len;
            //console.log("found slash ptr_loop: " + ptr_loop);
            
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
            
            //console.log(ptr_loop, ptr_quote_loop);
            
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
        } else if (int_statement === 0 && int_ps === 0 && int_qs === 0 &&
                        (
                            str_form_data.substr(ptr_loop, 1) === ";"// ||
                            //str_form_data.substr(ptr_loop, 7) === "DECLARE" ||
                            //str_form_data.substr(ptr_loop, 5) === "BEGIN" ||
                            //str_form_data.substr(ptr_loop, 1) === "EXCEPTION"
                        )) {
            //console.log("found semicolon >" + ptr_start + "|" + ptr_loop + "<");
            //console.log("found block >" + (str_form_data.substring(ptr_start, ptr_loop)) + "<");
            
            // if the end is greater than the cursor
            if (ptr_loop >= intCursor) {
                if (strScript[intStart] === ';') { intStart += 1; }
                bolFoundQuery = true;
                //ptr_loop += 1;
                break;
            }
            
            intStart = ptr_loop;
            
            ptr_start = ptr_loop + 1;
            int_element_len = 0;
        }
        
        ptr_loop += 1;
        int_inputstring_len -= 1;
    }
    
    // if we haven't found a query: check from last semicolon to end of search
    if (!bolFoundQuery) {
        // if the end is greater than the cursor
        if (ptr_loop >= intCursor) {
            if (strScript[intStart] === ';') { intStart += 1; }
            bolFoundQuery = true;
        }
    }
    
    //console.log('1.1:', intStart, ptr_loop, bolFoundQuery, strScript.substring(intStart, ptr_loop));
    //                    //, indexToRowAndColumn(strScript, intStart), indexToRowAndColumn(strScript, ptr_loop));
    
    if (bolFoundQuery) {
        //console.log(strScript);
        //console.log(intStart, ptr_loop, intCursor);
        //console.log(strScript.substring(intStart, ptr_loop));
        
        // convert range character numbers into start and end, column and row
        return {
            'start': indexToRowAndColumn(strScript, intStart),
            'end': indexToRowAndColumn(strScript, ptr_loop),
            'bolMatch': false
        };
    }
}

function scanSecondLevelRange(tabElement, strScript, jsnCursor, searchRange) {
    'use strict';
    var bolCursorInSecondTier = false, intCursor = rowAndColumnToIndex(strScript, jsnCursor.start.row, jsnCursor.start.column)
      , jsnRange, intStart, intEnd, arrRanges = [], i, len, searchStart, searchEnd
      , arrStatements;
    
    // search for second tier ranges inside searchRange
    
    // TODO: dollar quote with return right after
    // TODO: talk to papa about single quotes
    
    // loop through script and get ranges for parens and dollar quotes
    var int_qs = 0 // quote status
      , int_ps = 0 // parenthesis level
      , int_statement = 0
      , int_declare, int_loop
      , int_element_len = 0
      , int_tag = 0
      , str_tag = ''
      , arr_str_list = []
      , str_form_data = strScript
      , int_form_data_length = str_form_data.length
      , int_inputstring_len = str_form_data.length
      , str_trailing, ptr_loop = 0, ptr_start = 0, int_chunk_len
      , int_query_start, int_query_end, int_query_length
      , arr_int_open_paren_indexes = [], str_srch_string
      , str_function_quote, int_function_quote_len, ptr_quote_loop
      , bolFoundQuery = false, i, len, jsnStart, jsnEnd, strParenText
      , arrStartMatches, arrEndMatches, int_statement_range_start, statement_tag_length
      , strSubstring, bolFunction;
    
    
    if (searchRange) {
        searchStart = rowAndColumnToIndex(strScript, searchRange.start.row, searchRange.start.column);
        searchEnd = rowAndColumnToIndex(strScript, searchRange.end.row, searchRange.end.column);
        strSubstring = strScript.substring(searchStart, searchEnd);
        
        bolFunction = (/^(CREATE|(CREATE\ OR\ REPLACE))\s*FUNCTION/gi).test(strSubstring.trim());
        
        //console.log(bolFunction, strSubstring);
        
        int_form_data_length = searchEnd - searchStart;
        int_inputstring_len = searchEnd - searchStart;
        ptr_loop = searchStart;
        ptr_start = searchStart;
        
        //console.log('2:', searchRange, searchStart, searchEnd, strScript.substring(searchStart, searchEnd));
        
    } else {
        bolFunction = (/^(CREATE|(CREATE\ OR\ REPLACE))\s*FUNCTION/gi).test(strScript.trim());
        
        int_form_data_length = str_form_data.length;
        int_inputstring_len = str_form_data.length;
        ptr_loop = 0;
        ptr_start = 0;
    }
    
    arrStatements = [
        {'name': 'loop',  'start': /^(FOR|WHILE|LOOP)/i,                   'end': /^END[\s]*LOOP/i}
      , {'name': 'if',    'start': /^(IF|THEN|ELSIF|ELSE)/i,               'end': /^END[\s]*IF[\s]*;/i, 'exclude': /^IF\s*(NOT\s*EXISTS|EXISTS)/i}
      , {'name': 'case',  'start': /^CASE/i,                               'end': /^END[\s]*(CASE)?/i}
      , {'name': 'begin', 'start': /^(DECLARE|BEGIN|EXCEPTION[^;]*THEN)/i, 'end': /^END[\s]*;/i}
    ];
    
    //// if not a function remove FOR and IF
    //if (!bolFunction) {
    //    arrStatements.splice(0,1);
    //    arrStatements.splice(0,1);
    //}
    
    intStart = ptr_loop;
    int_statement_range_start = ptr_loop;
    int_declare = 0;
    int_loop = 0;
    
    // in second level:
    //      declare to begin is a range
    //      begin to exception is a range
    //      exception to end is a range
    
    // quote status (int_qs) values
    //      0 => no quotes
    //      2 => dollar tag
    //      3 => single quote
    //      4 => double quote
    //      5 => multiline comment
    //      6 => line comment
    
    //      6 => line comment
    
    // declare increases int_declare and if the begin is found it decreases int_declare instead
    
    // special mention:
    //      int_ps is the number of parenthesis we are deep
    
    // loop through script
    while (int_inputstring_len > 0) {
        int_element_len += 1;
        
        //console.log('   input length: ' + int_inputstring_len + '\n' +
        //            ' element length: ' + int_element_len + '\n' +
        //            'current 2 chars: ' + str_form_data.substr(ptr_loop, 2));
        
        if (int_qs === 0 && int_ps === 0 && !(/^[0-9a-z_]$/gi).test(str_form_data.substr(ptr_loop - 1, 1))) {
            for (i = 0, len = arrStatements.length; i < len; i += 1) {
                arrStartMatches = str_form_data.substring(ptr_loop).match(arrStatements[i].start);
                arrEndMatches = str_form_data.substring(ptr_loop).match(arrStatements[i].end);
                
                strSubstring = str_form_data.substring((str_form_data[intStart] === ';' ? intStart + 1 : intStart), (ptr_loop - 1));
                bolFunction = (/^(CREATE|(CREATE\ OR\ REPLACE))\s*FUNCTION/gi).test(strSubstring.trim());
                
                // FOUND UNCOMMENTED, UNQUOTED, UNPARENTHESISED STATEMENT
                if (arrStartMatches
                        && (bolFunction === true || (arrStatements[i].name !== 'loop' && arrStatements[i].name !== 'if'))
                        && (
                            !arrStatements[i].exclude ||
                            !(arrStatements[i].exclude).test(str_form_data.substring(ptr_loop))
                        )
                    ) {
                    statement_tag_length = (arrStartMatches[0].indexOf(';') === -1 ? arrStartMatches[0].length : arrStartMatches[0].length - 1);
                    
                    if (int_declare === 0 && int_loop === 0) { int_statement += 1; }
                    if (int_declare !== 0) { int_declare -= 1; }
                    if (int_loop !== 0) { int_loop -= 1; }
                    
                    if (arrStartMatches[0].toLowerCase() === 'declare') {
                        int_declare += 1;
                    }
                    if (arrStartMatches[0].toLowerCase().indexOf('exception') === 0) {
                        int_statement -= 1;
                    }
                    if (arrStartMatches[0].toLowerCase() === 'for' || arrStartMatches[0].toLowerCase() === 'while') {
                        int_loop += 1;
                    }
                    if (arrStartMatches[0].toLowerCase().indexOf('then') === 0) {
                        int_statement -= 1;
                    }
                    if (arrStartMatches[0].toLowerCase().indexOf('elsif') === 0) {
                        int_statement -= 1;
                    }
                    if (arrStartMatches[0].toLowerCase().indexOf('else') === 0) {
                        int_statement -= 1;
                    }
                    
                    int_inputstring_len -= statement_tag_length;
                    
                    //console.log('1***', int_statement, arrStartMatches[0]); //,
                    //            arrStatements[i].start,
                    //            //str_form_data.substring(ptr_loop).match(arrStatements[i].start),
                    //            '\n' + str_form_data.substring(ptr_loop, ptr_loop + 20));
                    
                    if (int_statement === 1) {
                        //console.log('1***', '->' + strScript.substring(int_statement_range_start, ptr_loop) + '<-' +
                        //                    ' (' + int_statement_range_start + ', ' + ptr_loop + ')');
                        arrRanges.push({
                            'start': int_statement_range_start
                          , 'end': ptr_loop
                          , 'text': strScript.substring(int_statement_range_start, ptr_loop)
                          , 'type': 1
                        });
                        ptr_loop += statement_tag_length;
                        int_statement_range_start = ptr_loop;
                        //console.log('RANGEPOINT');
                    } else {
                        ptr_loop += statement_tag_length;
                    }
                    
                    break;
                    
                // FOUND UNCOMMENTED, UNQUOTED, UNPARENTHESISED STATEMENT END
                } else if (arrEndMatches) {
                    statement_tag_length = (arrEndMatches[0].indexOf(';') === -1 ? arrEndMatches[0].length : arrEndMatches[0].length - 1);
                    int_statement -= 1;
                    int_inputstring_len -= statement_tag_length;
                    
                    //console.log('2***', '->' + str_form_data.substring(int_statement_range_start, ptr_loop) + '<-');
                                //int_statement, arrEndMatches[0]); //,
                                //arrStatements[i].end,
                                //str_form_data.substring(ptr_loop).match(arrStatements[i].end)
                    
                    if (int_statement === 0) {
                        arrRanges.push({
                            'start': int_statement_range_start
                          , 'end': ptr_loop
                          , 'text': strScript.substring(int_statement_range_start, ptr_loop)
                          , 'type': 2
                        });
                        ptr_loop += statement_tag_length;
                        int_statement_range_start = ptr_loop;
                        //console.log('RANGEPOINT');
                    } else {
                        ptr_loop += statement_tag_length;
                    }
                    
                    break;
                }
            }
        }
        
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
            
        // FOUND SLASH:  we don't skip slashed chars within dollar tags, double quotes and comments.
        } else if (str_form_data.substr(ptr_loop, 1) === "\\" && int_qs !== 4 && int_qs !== 2 && int_qs !== 5 && int_qs !== 6) {
            // skip next character
            ptr_loop += 1;
            int_inputstring_len -= int_chunk_len;
            int_chunk_len = 1;
            int_element_len += int_chunk_len;
            //console.log("found slash ptr_loop: " + ptr_loop);
            
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
            
            if (arr_int_open_paren_indexes.length === 1) {
                strParenText = strScript.substring(arr_int_open_paren_indexes[0], ptr_loop);
                
                // if the parenthesized text starts with SELECT, INSERT, UPDATE, DELETE, PERFORM or EXECUTE:
                //      push parenthesis as a range
                if ((/^\((SELECT|INSERT|UPDATE|DELETE|PERFORM|EXECUTE)/gi).test(strParenText)) {
                    arrRanges.push({
                        'start': arr_int_open_paren_indexes[0]
                      , 'end': ptr_loop
                      , 'text': strScript.substring(arr_int_open_paren_indexes[0], ptr_loop)
                      , 'type': 3
                    });
                }
            }
            
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
            
            //console.log(ptr_loop, ptr_quote_loop);
            
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
            
            arrRanges.push({
                'start': ptr_quote_loop + 1
              , 'end': ptr_loop
              , 'text': strScript.substring(arr_int_open_paren_indexes[0], ptr_loop)
              , 'type': 4
            });
            
            // move pointer to end of end dollar tag
            int_tag -= 1;
            int_element_len += int_tag;
            ptr_loop += int_tag;
            int_inputstring_len -= int_tag;
            
        // FOUND AN UNQUOTED SEMICOLON:
        } else if (int_statement === 0 && int_ps === 0 && int_qs === 0 && str_form_data.substr(ptr_loop, 1) === ";") {
            //console.log("found semicolon >" + ptr_start + "|" + ptr_loop + "<");
            //console.log("found block >" + (str_form_data.substring(ptr_start, ptr_loop)) + "<");
            //console.log(ptr_loop, intEnd);
            
            // if the end is greater than the cursor
            //if (ptr_loop > intCursor) {
            //    if (strScript[intStart] === ';') { intStart += 1; }
            //}
            //
            //arrRanges.push({
            //    'start': intStart
            //  , 'end': ptr_loop
            //  , 'text': strScript.substring(intStart, ptr_loop)
            //  , 'type': 5
            //});
            
            intStart = ptr_loop;
            
            
            ptr_start = ptr_loop + 1;
            int_element_len = 0;
        }
        
        ptr_loop += 1;
        int_inputstring_len -= 1;
    }
    
    // check to see if the cursor is in one of the second tier ranges
    for (i = 0, len = arrRanges.length; i < len; i += 1) {
        intStart = arrRanges[i].start;
        intEnd   = arrRanges[i].end;
        
        if (intCursor >= intStart && intCursor <= intEnd) {
            bolCursorInSecondTier = true;
            
            jsnRange = {
                'start': indexToRowAndColumn(strScript, intStart),
                'end':  indexToRowAndColumn(strScript, intEnd)
            };
            
            //console.log(jsnRange, strScript.substring(intStart, intEnd));
            break;
        }
    }
    
    //console.log('2.1:', bolCursorInSecondTier, 'Range:' + i, intStart, intEnd, arrRanges, strScript.substring(intStart, intEnd));
    //                      // jsnRange); //intCursor);
    
    // if cursor is in a second tier range: return range start and end
    if (bolCursorInSecondTier === true) {
        //console.log(jsnRange);
        jsnRange.bolMatch = false;
        return jsnRange;
        
    // else: run property window function and return nothing
    } else {
        searchRange.bolMatch = true;
        return searchRange;
        
        //searchToKeyword(tabElement, strScript, jsnCursor, searchRange);
    }
}


// restrict selection from the first character to the semicolon
function searchToKeyword(tabElement, strScript, jsnCursor, textRange) {
    'use strict';
    var intCursor = rowAndColumnToIndex(strScript, jsnCursor.start.row, jsnCursor.start.column)
      , intStart = rowAndColumnToIndex(strScript, textRange.start.row, textRange.start.column)
      , intEnd = rowAndColumnToIndex(strScript, textRange.end.row, textRange.end.column)
      , strCommentConsumed = consumeComments(strScript), strChar, intParenLevel, strTemp;
    
    // move start to first non-whitespace character that is uncommented
    //console.log('1***', intCursor, intStart, intEnd);
    
    strChar = strCommentConsumed[intStart];
    //console.log(strChar);
    while (intStart < intEnd && (strChar === ' ' || strChar === '\t' || strChar === '\n')) {
        intStart += 1;
        strChar = strCommentConsumed[intStart];
    }
    
    // move end to first non-whitespace character that is uncommented or end
    strChar = strCommentConsumed[intEnd - 1];
    //console.log(strChar);
    while (intEnd > -1 && (strChar === ' ' || strChar === '\t' || strChar === '\n' || strChar === undefined)) {
        intEnd -= 1;
        strChar = strCommentConsumed[intEnd];
    }
    intEnd += (strChar !== ';' ? 1 : 0);
    //console.log('2***', intCursor, intStart, intEnd, strChar);
    
    // if cursor is still in trimmed portion: send the range to the property window handler 
    if (intCursor >= intStart) { // && intCursor <= intEnd
        // if textRange has a semicolon at the end: move end of range to behind the semi
        //console.log('"' + strCommentConsumed[intEnd - 1] + '"', '"' + strCommentConsumed[intEnd] + '"', '"' + strCommentConsumed[intEnd + 1] + '"');
        if (strCommentConsumed[intEnd - 1] === ';') {
            intEnd -= 1;
        }
        
        // calculate parenthesis level by using the difference in the number of open parens and close parens
        strTemp = strCommentConsumed.substring(0, intCursor + 1);
        intParenLevel = (strTemp.match(/\(/g) || []).length - (strTemp.match(/\)/g) || []).length;
        //console.log(strTemp, intParenLevel);
        
        tabElement.relatedEditor.currentQueryRange = {
            'start': indexToRowAndColumn(strScript, intStart),
            'end':  indexToRowAndColumn(strScript, intEnd),
            'text': strScript.substring(intStart, intEnd),
            'intParenLevel': intParenLevel
        };
    }
}

function selectionFindRange(tabElement, editor) {
    'use strict';
    var strScript = editor.getValue(), jsnSelection = editor.getSelectionRange()
      , currentScanResult = scanFirstLevelRange(tabElement, strScript, jsnSelection)
      , bolFirstLevelScan = true, intStart, intEnd, i, len;
      
    // if there are old query markers: remove them
    if (tabElement.arrHighlight) {
        for (i = 0, len = tabElement.arrHighlight.length; i < len; i += 1) {
            editor.getSession().removeMarker(tabElement.arrHighlight[i]);
        }
    }
    tabElement.arrHighlight = [];
    
    //currentScanResult.topLevelText = strScript.substring(
    //                                                rowAndColumnToIndex(strScript, currentScanResult.start.row, currentScanResult.start.column)
    //                                              , rowAndColumnToIndex(strScript, currentScanResult.end.row, currentScanResult.end.column)
    //                                            );
    
    i = 0;
    while (currentScanResult && currentScanResult.bolMatch === false && i < 100) {
        if (bolFirstLevelScan === true) {
            currentScanResult = scanSecondLevelRange(tabElement, strScript, jsnSelection, currentScanResult);
            bolFirstLevelScan = false;
            
        } else {
            currentScanResult = scanFirstLevelRange(tabElement, strScript, jsnSelection, currentScanResult);
            bolFirstLevelScan = true;
        }
        i += 1;
    }
    
    //console.log(strScript.substring(
    //                            rowAndColumnToIndex(strScript, currentScanResult.start.row, currentScanResult.start.column)
    //                          , rowAndColumnToIndex(strScript, currentScanResult.end.row, currentScanResult.end.column)
    //                        ));
    
    editor.currentQueryRange = null;
    
    if (currentScanResult && currentScanResult.bolMatch === true) {
        searchToKeyword(tabElement, strScript, jsnSelection, currentScanResult);
    }
    
    GS.triggerEvent(editor.container, 'range-update');
}

