//var self, str_part, i = 0;
//self = document.getElementById('test').textContent;
//console.log(self);
//
//str_part = self.match(/^\s*/);
//self = self.substring( str_part[0].length );
//console.log( i++ + ':' + str_part[0] );
//
//str_part = self.match(/^(CREATE)/i);
//self = self.substring( str_part[0].length );
//console.log( i++ + ':' + str_part[0] );
//
//str_part = self.match(/^\s*/);
//self = self.substring( str_part[0].length );
//console.log( i++ + ':' + str_part[0] );
//
//str_part = self.match(/^TEMP/i);
//self = self.substring( str_part[0].length );
//console.log( i++ + ':' + str_part[0] );
//
//str_part = self.match(/^\s*/);
//self = self.substring( str_part[0].length );
//console.log( i++ + ':' + str_part[0] );
//
//str_part = self.match(/^VIEW/i);
//self = self.substring( str_part[0].length );
//console.log( i++ + ':' + str_part[0] );
//
//str_part = self.match(/^\s*/);
//self = self.substring( str_part[0].length );
//console.log( i++ + ':' + str_part[0] );
//
//str_part = self.match(/^\S+/);
//self = self.substring( str_part[0].length );
//console.log( i++ + ':' + str_part[0] );
//
//str_part = self.match(/^\s*/);
//self = self.substring( str_part[0].length );
//console.log( i++ + ':' + str_part[0] );
//
//str_part = self.match(/^WITH(\s*|\s*--[^\n]*[\r\n]\s*)\((\s*|\s*--[^\n]*[\r\n]\s*)SECURITY_BARRIER(\s*|\s*--[^\n]*[\r\n]\s*)\)/i);
//console.log( self );
//self = self.substring( str_part[0].length );
//console.log( i++ + ':' + str_part[0] );
//
//
//// end
//console.log( i++ + ':' + self );
//
//
//<div id="test"> CREATE TEMP VIEW aco.ttest 
// WITH --test()
// ( --test
// SECURITY_BARRIER
// --test
// )
// AS
//</div>

// have an array of regexes for a query
// each regex works at the beginning of the string
// if the regex matches:
//      pull off the part that matched and stick it in an array
//      identify the part


function propertyBindEditor(tabElement, editor) {
    'use strict';
    
    editor.container.addEventListener('range-update', function () {
        propertyButtonEnable(false);
        
        if (editor.currentQueryRange) {
            propertyWindow(tabElement, editor.getValue(), editor.currentQueryRange);
        }
    });
    
}

// enable or disable the query designer button
function propertyButtonEnable(bolEnabled) {
    'use strict';
    var currentTab = document.getElementsByClassName('current-tab')[0], propertyButtonElement;
    
    if (currentTab) {
        propertyButtonElement = currentTab.relatedPropertyButton;
        if (bolEnabled) {
            propertyButtonElement.removeAttribute('disabled');
        } else {
            propertyButtonElement.setAttribute('disabled', '');
        }
    }
}

// take the current text range and try to see if it's designable
function propertyWindow(tabElement, strScript, textRange) {
    'use strict';
    var arrDocButtons, bolDesignable = false, i, len
      , arrChunks = querySplit(strScript, textRange), strTestQuery;
    
    // highlight textRange section
    tabElement.arrHighlight.push(tabElement.relatedEditor.getSession().addMarker(
        new Range(textRange.start.row, textRange.start.column, textRange.end.row, textRange.end.column),
        'ace-selected-element',
        'background'
    ));
    
    // concatinate 20 text and quote chunks together with spaces in between for query detection and documentation links
    for (i = 0, len = arrChunks.length, strTestQuery = ''; i < len; i += 1) {
        if (arrChunks[i].chunkType === 2) {
            strTestQuery += (strTestQuery ? ' ' : '') + arrChunks[i].chunkText;
        }
    }
    
    //console.log(strTestQuery);
    
    // figure out highlighted documentation link
    //arrDocButtons = docButtonForQuery(strTestQuery) || [];
    //if (arrDocButtons.length > 0) {
    //    //console.log('1***', arrDocButtons);
    //    addDocLinks(tabElement, arrDocButtons, false);
    //}
    
    // call property window function for particular section (if one is found)
    if ((/^(CREATE|REPLACE|(CREATE OR REPLACE)|(REPLACE OR CREATE))\s*(TEMPORARY)?\s*(TEMP)?\s*VIEW/gi).test(strTestQuery)) {
        propertyListVIEW(tabElement, strScript, textRange, arrChunks);
        bolDesignable = true;
    } else if ((/^(CREATE|REPLACE|(CREATE OR REPLACE)|(REPLACE OR CREATE)) RULE/gi).test(strTestQuery)) {
        propertyListRULE(tabElement, strScript, textRange, arrChunks);
        bolDesignable = true;
    } else if ((/^(GRANT|REVOKE)\s*/gi).test(strTestQuery)) {
        propertyListPERMISSION(tabElement, strScript, textRange, arrChunks);
        bolDesignable = true;
    } else if ((/^(ALTER VIEW).*(ALTER COLUMN)/gi).test(strTestQuery)) {
        propertyListALTERVIEW_ALTERCOLUMN(tabElement, strScript, textRange, arrChunks);
        bolDesignable = true;
    } else if ((/^(ALTER (VIEW|AGGREGATE|COLLATION|CONVERSION|LARGE OBJECT|OPERATOR|SCHEMA|TEXT SEARCH DICTIONARY)).*(OWNER)/gi).test(strTestQuery)) {
        propertyListALTER_ALTEROWNER(tabElement, strScript, textRange, arrChunks);
        bolDesignable = true;
    } else if ((/^(ALTER (VIEW|AGGREGATE|COLLATION|CONVERSION|SCHEMA|TEXT SEARCH PARSER|TEXT SEARCH TEMPLATE|TEXT SEARCH DICTIONARY)).*(RENAME)/gi).test(strTestQuery)) {
        propertyListALTER_RENAME(tabElement, strScript, textRange, arrChunks);
        bolDesignable = true;
    } else if ((/^(ALTER (VIEW|AGGREGATE|COLLATION|CONVERSION|OPERATOR|TEXT SEARCH PARSER|TEXT SEARCH TEMPLATE|TEXT SEARCH DICTIONARY)).*(SET SCHEMA)/gi).test(strTestQuery)) {
        propertyListALTER_SETSCHEMA(tabElement, strScript, textRange, arrChunks);
        bolDesignable = true;
    } else if ((/^(ALTER VIEW).*(RESET)/gi).test(strTestQuery)) {
        propertyListALTERVIEW_RESET(tabElement, strScript, textRange, arrChunks);
        bolDesignable = true;
    } else if ((/^(ALTER VIEW).*(SET)/gi).test(strTestQuery)) {
        propertyListALTERVIEW_SET(tabElement, strScript, textRange, arrChunks);
        bolDesignable = true;
    } else if ((/^(ALTER TEXT SEARCH DICTIONARY)/gi).test(strTestQuery)) {
        propertyListALTERTEXTSEARCHDICTIONARY(tabElement, strScript, textRange, arrChunks);
        bolDesignable = true;
    } else if ((/^(ALTER TRIGGER)/gi).test(strTestQuery)) {
        propertyListALTERTRIGGER(tabElement, strScript, textRange, arrChunks);
        bolDesignable = true;
    } else if ((/^(ALTER LANGUAGE|ALTER PROCEDURAL LANGUAGE).*(OWNER)/gi).test(strTestQuery)) {
        propertyListALTERLANG_ALTEROWNER(tabElement, strScript, textRange, arrChunks);
        bolDesignable = true;
    } else if ((/^(ALTER LANGUAGE|ALTER PROCEDURAL LANGUAGE).*(RENAME)/gi).test(strTestQuery)) {
        propertyListALTERLANG_ALTERNAME(tabElement, strScript, textRange, arrChunks);
        bolDesignable = true;
    } else if ((/^(CREATE)\s*(GLOBAL|LOCAL)?\s*(TEMPORARY)?\s*(TEMP)?\s*(UNLOGGED)?\s*TABLE/gi).test(strTestQuery)) {
        propertyListCREATETABLE(tabElement, strScript, textRange, arrChunks);
        bolDesignable = true;
    }
    
    propertyButtonEnable(bolDesignable);
}

function docFromCursor(tabElement, strScript, jsnSelection) {
    'use strict';
    //var intStart = rowAndColumnToIndex(strScript, jsnSelection.start.row, jsnSelection.start.column)
    //  , intEnd, strChar, len = strScript.length, strSection, arrDocButtons
    //  , strCommentConsumed = consumeComments(strScript);
    //
    //// loop forward until character
    //strChar = strCommentConsumed[intStart];
    //while (intStart < len && (strChar === ' ' || strChar === '\t' || strChar === '\n')) {
    //    intStart += 1;
    //    strChar = strCommentConsumed[intStart];
    //}
    //
    //// loop backward until first character
    //strChar = strCommentConsumed[intStart];
    //while (intStart > -1 && (strChar !== ' ' && strChar !== '\t' && strChar !== '\n')) {
    //    intStart -= 1;
    //    strChar = strCommentConsumed[intStart];
    //}
    //intStart += 1;
    //
    //// loop forward until non alpha-numeric/./_
    //intEnd = intStart;
    //strChar = strCommentConsumed[intEnd];
    //while (intEnd < len && ((/[a-z0-9_\.]/gi).test(strChar))) {
    //    intEnd += 1;
    //    strChar = strCommentConsumed[intEnd];
    //}
    //intEnd += 1;
    //
    //// send to doc button
    //strSection = strScript.substring(intStart, intEnd);
    //arrDocButtons = docButtonForQuery(strSection) || [];
    //
    //if (arrDocButtons.length > 0) {
    //    //console.log('2***', arrDocButtons);
    //    addDocLinks(tabElement, arrDocButtons, true);
    //}
}

function clearDocLinks(tabElement) {
    'use strict';
    tabElement.relatedDocLinksContainer.style.height = '0';
    tabElement.relatedDocLinksContainer.children[0].innerHTML = '';
    tabElement.relatedDocLinksContainer.children[1].innerHTML = '';
}

function addDocLinks(tabElement, arrDocButtons, bolSecondSection) {
    'use strict';
    tabElement.relatedDocLinksContainer.style.height = '';
    if (bolSecondSection) {
        //tabElement.relatedDocLinksContainer.children[1].innerHTML = arrDocButtons.join('');
    } else {
        //tabElement.relatedDocLinksContainer.children[0].innerHTML = arrDocButtons.join('');
    }
}

// replace the current query with new text
function propertyWindowReplaceQuery(tabElement, textRange, strEditingScript) {
    'use strict';
    var selectionRange = tabElement.relatedEditor.getSelectionRange();
    
    tabElement.relatedEditor.session.selection.setRange(
        new Range(
            textRange.start.row,
            textRange.start.column,
            textRange.end.row,
            textRange.end.column
        )
    );
    tabElement.relatedEditor.insert(strEditingScript);
    
    tabElement.relatedEditor.session.selection.setRange(selectionRange);
    tabElement.relatedEditor.focus();
    selectionFindRange(tabElement, tabElement.relatedEditor);
}

// split a query into an array of chunks. chunks come in these three types:
//      whitespace and comments
//      parenthesis
//      quotes and characters
function querySplit(strScript, textRange) {
    'use strict';
    var intSearchStart = rowAndColumnToIndex(strScript, textRange.start.row, textRange.start.column)
      , intSearchEnd = rowAndColumnToIndex(strScript, textRange.end.row, textRange.end.column)
      , int_qs, int_ps, int_tag, str_tag, int_chunk_start, int_search_len, int_search_full_length
      , ptr_loop, arr_int_open_paren_indexes, current_chunk_type, calculated_chunk_type, int_skip
      , arrChunks = [], i, len, regex_i, regex_len, ptr_quote_loop, bolMatch, key, arrLog = [];
    
    int_qs = 0; // quote status
    int_ps = 0; // parenthesis level
    int_tag = 0;
    str_tag = '';
    int_skip = 0;
    int_search_full_length = (intSearchEnd - intSearchStart);
    int_search_len = int_search_full_length;
    ptr_loop = intSearchStart;
    int_chunk_start = intSearchStart;
    arr_int_open_paren_indexes = [];
    
    // quote status (int_qs) values
    //      0 => no quotes
    //      2 => dollar tag
    //      3 => single quote
    //      4 => double quote
    //      5 => multiline comment
    //      6 => line comment
    
    // chunk types
    //      0 => whitespace / comment group
    //      1 => parenthesis
    //      2 => quote / character group
    
    // split on the three main chunk types
    while (int_search_len > 0) {
        //console.log('   input length: ' + int_search_len + '\n' +
        //            'current 2 chars: ' + strScript.substr(ptr_loop, 2));
		
		//arrLog.push(int_search_len + '');
		
        // FOUND MULTILINE COMMENT:
        if (int_qs === 0 && strScript.substr(ptr_loop, 2) === "/*") {
            int_qs = 5;
            int_skip = 1;
            //console.log("found multiline comment");
            
        // ENDING MULTILINE COMMENT
        } else if (int_qs === 5 && strScript.substr(ptr_loop, 2) === "*/") {
            int_qs = 0;
            int_skip = 1;
            //console.log("found end of multiline comment");
            
        // FOUND DASH COMMENT:
        } else if (int_qs === 0 && strScript.substr(ptr_loop, 2) === "--") {
            int_qs = 6;
            int_skip = 1;
            //console.log("found dash comment");
            
        // ENDING DASH COMMENT
        } else if (int_qs === 6 && (strScript.substr(ptr_loop, 1) === "\n" || strScript.substr(ptr_loop, 1) === "\r")) {
            int_qs = 0;
            //console.log("found end of dash comment");
            
        // FOUND SLASH:  we don't skip slashed chars within dollar tags, double quotes and comments.
        } else if (strScript.substr(ptr_loop, 1) === "\\" && int_qs !== 4 && int_qs !== 2 && int_qs !== 5 && int_qs !== 6) {
            // skip next character
            int_skip = 1;
            //console.log("found slash ptr_loop: " + ptr_loop);
            
        // FOUND OPEN PARENTHESIS:
        } else if (int_qs === 0 && strScript.substr(ptr_loop, 1) === "(") {
            int_ps = int_ps + 1;
            
            arr_int_open_paren_indexes.push(ptr_loop);
            //console.log(' OPEN: ', arr_int_open_paren_indexes);
            //console.log("found open parenthesis");
        
        // FOUND CLOSE PARENTHESIS
        } else if (int_qs === 0 && strScript.substr(ptr_loop, 1) === ")" && int_ps > 0) {
            int_ps = int_ps - 1;
            
            arr_int_open_paren_indexes.splice(arr_int_open_paren_indexes.length - 1, 1);
            //console.log('CLOSE: ', arr_int_open_paren_indexes);
            //console.log("found close parenthesis");
            
        // FOUND SINGLE QUOTE:
        } else if (int_qs === 0 && strScript.substr(ptr_loop, 1) === "'") {
            int_qs = 3;
            //console.log("found single quote");
            
        // ENDING SINGLE QUOTE
        } else if (int_qs === 3 && strScript.substr(ptr_loop, 1) === "'") {
            int_qs = 0;
            //console.log("found end of single quote");
            
        // FOUND DOUBLE QUOTE:
        } else if (int_qs === 0 && strScript.substr(ptr_loop, 1) === "\"") {
            int_qs = 4;
            //console.log("found double quote");
            
        // ENDING DOUBLE QUOTE 
        } else if (int_qs === 4 && strScript.substr(ptr_loop, 1) === "\"") {
            int_qs = 0;
            //console.log("found end of double quote");
        
        // FOUND DOLLAR TAG START:
        } else if (int_qs === 0 && strScript.substr(ptr_loop, 1) === "$") {
            //console.log("found start dollar");
            
            // find the end of the current tag
            ptr_quote_loop = ptr_loop + 1;
            while (ptr_quote_loop < int_search_full_length && strScript.substr(ptr_quote_loop, 1).match("^[a-zA-Z0-9_]$")) {
                ptr_quote_loop += 1;
            }
            
            //console.log(ptr_loop, ptr_quote_loop);
            
            if (strScript.substring(ptr_quote_loop, ptr_quote_loop + 1) === "$") {
                int_tag = ptr_quote_loop - (ptr_loop - 1);
                str_tag = strScript.substr(ptr_loop, int_tag);
                
                // we found the end of the tag, now look for the close tag
                int_skip = int_tag;
                int_qs = 2;
            }
            
            //console.log(str_tag);
            
        // END DOLLAR TAG
        } else if (int_qs === 2 && strScript.substr(ptr_loop, int_tag) === str_tag) {
            //console.log("found end of dollar", str_tag);
            int_qs = 0;
            
            // move pointer to end of end dollar tag
            int_tag -= 1;
            int_skip = int_tag;
            
        // FOUND AN UNQUOTED  :
        }// else if (int_ps === 0 && int_qs === 0) {}
        
        // calculate type
        if (
                (
                    (
                        strScript.substr(ptr_loop, 1).match(/\s/gi)
                    ) || (
                        int_qs === 5 ||
                        int_qs === 6 ||
                        strScript.substr(ptr_loop, 2) === '*/'
                    )
                ) &&
                int_ps === 0 &&
                int_qs !== 2 &&
                int_qs !== 3 &&
                int_qs !== 4) {
            calculated_chunk_type = 0;
        } else if (int_ps > 0 || strScript.substr(ptr_loop, 1) === ')') {
            calculated_chunk_type = 1;
        } else {
            calculated_chunk_type = 2;
        }
        //console.log(calculated_chunk_type, current_chunk_type, strScript.substr(ptr_loop, 1));
        
        if (current_chunk_type !== undefined) {
            // if current type is different from calculated type: seperate chunk
            if (current_chunk_type !== calculated_chunk_type) {
                arrChunks.push({
                    'chunkText': strScript.substring(int_chunk_start, ptr_loop),
                    'chunkStart': int_chunk_start,
                    'chunkEnd': ptr_loop,
                    'chunkType': current_chunk_type
                });
                int_chunk_start = ptr_loop;
                current_chunk_type = calculated_chunk_type;
            }
        } else {
            current_chunk_type = calculated_chunk_type;
        }
        
        ptr_loop += (1 + int_skip);
        int_search_len -= (1 + int_skip);
        int_skip = 0;
    }
    //console.log(arrLog.join(','));
    
    // seperate last chunk
    arrChunks.push({
        'chunkText': strScript.substring(int_chunk_start, ptr_loop),
        'chunkStart': int_chunk_start,
        'chunkEnd': ptr_loop,
        'chunkType': current_chunk_type
    });
    int_chunk_start = ptr_loop;
    current_chunk_type = calculated_chunk_type;
    
    // return results
    return arrChunks;
}

// match chunks by regex
function regexMatch(jsnDesign, arrChunks) {
    'use strict';
    var i, len, key;
    
    // loop through each of the chunks to match (jsnDesign) keywords
    for (i = 0, len = arrChunks.length; i < len; i += 1) {
        for (key in jsnDesign) {
            if (jsnDesign.hasOwnProperty(key)) {
                //console.log(jsnDesign[key].regex, arrChunks[i].chunkText);//, jsnDesign[key].regex.test(arrChunks[i].chunkText));
                if (!jsnDesign[key].arrInstance) {
                    jsnDesign[key].arrInstance = [];
                }
                
                if (jsnDesign[key].regex) {
                    if (jsnDesign[key].regex.test(arrChunks[i].chunkText)) {
                        arrChunks[i].designMatch = key;
                        jsnDesign[key].arrInstance.push(i);
                        
                        break;
                    }
                }
            }
        }
    }
    
    //console.log(arrChunks.slice(0));
    
    return arrChunks;
}

function locationDependentMatch(jsnDesign, arrChunks) {
    'use strict';
    var i, len, key, bolMatchBeforeFirst, bolMatchAfterFirst, bolMatchBeforeLast, bolMatchAfterLast, location_i, location_len, jsnTemp;
    
    //console.log(arrChunks.slice(0));
    
    for (i = 0, len = arrChunks.length; i < len; i += 1) {
        for (key in jsnDesign) {
            if (jsnDesign.hasOwnProperty(key)) {
                if ((
                        jsnDesign[key].beforefirst || jsnDesign[key].afterfirst ||
                        jsnDesign[key].beforelast || jsnDesign[key].afterlast
                    ) &&
                    ( // if type matches chunkType or type is an array and chunkType has a match inside the array
                        arrChunks[i].chunkType === jsnDesign[key].type ||
                        (jsnDesign[key].type.indexOf && jsnDesign[key].type.indexOf(arrChunks[i].chunkType) > -1)
                    )) {
                    
                    bolMatchBeforeFirst = undefined;
                    bolMatchAfterFirst = undefined;
                    bolMatchBeforeLast = undefined;
                    bolMatchAfterLast = undefined;
                    
                    // if there is no regex match or there is a regex match and this chunk matched
                    if (!jsnDesign[key].regex || jsnDesign[key].arrInstance.indexOf(i) > -1) {
                        if (jsnDesign[key].beforefirst) {
                            bolMatchBeforeFirst = true;
                            
                            for (location_i = 0, location_len = jsnDesign[key].beforefirst.length; location_i < location_len; location_i += 1) {
                                jsnTemp = jsnDesign[jsnDesign[key].beforefirst[location_i]];
                                
                                bolMatchBeforeFirst = (jsnTemp.arrInstance.length === 0 || i < jsnTemp.arrInstance[0]);
                                
                                if (bolMatchBeforeFirst === false) { break; }
                            }
                            
                        } else {
                            bolMatchBeforeFirst = true;
                        }
                        
                        if (jsnDesign[key].afterfirst) {
                            bolMatchAfterFirst = true;
                            
                            for (location_i = 0, location_len = jsnDesign[key].afterfirst.length; location_i < location_len; location_i += 1) {
                                jsnTemp = jsnDesign[jsnDesign[key].afterfirst[location_i]];
                                
                                bolMatchAfterFirst = (jsnTemp.arrInstance.length > 0 && i > jsnTemp.arrInstance[0]);
                                
                                if (bolMatchAfterFirst === false) { break; }
                            }
                        } else {
                            bolMatchAfterFirst = true;
                        }
                        
                        if (jsnDesign[key].beforelast) {
                            for (location_i = 0, location_len = jsnDesign[key].beforelast.length; location_i < location_len; location_i += 1) {
                                jsnTemp = jsnDesign[jsnDesign[key].beforelast[location_i]];
                                
                                bolMatchBeforeLast = (jsnTemp.arrInstance.length === 0 || i < jsnTemp.arrInstance[jsnTemp.arrInstance.length - 1]);
                                
                                if (bolMatchBeforeLast === false) { break; }
                            }
                        } else {
                            bolMatchBeforeLast = true;
                        }
                        
                        if (jsnDesign[key].afterlast) {
                            for (location_i = 0, location_len = jsnDesign[key].afterlast.length; location_i < location_len; location_i += 1) {
                                jsnTemp = jsnDesign[jsnDesign[key].afterlast[location_i]];
                                
                                bolMatchAfterLast = (jsnTemp.arrInstance.length === 0 || i > jsnTemp.arrInstance[jsnTemp.arrInstance.length - 1]);
                                
                                if (bolMatchAfterLast === false) { break; }
                            }
                        } else {
                            bolMatchAfterLast = true;
                        }
                    }
                    
                    //console.log('******************************************************************');
                    //console.log(jsnDesign[key].beforefirst, bolMatchBeforeFirst);
                    //console.log(jsnDesign[key].afterfirst, bolMatchAfterFirst);
                    //console.log(jsnDesign[key].beforelast, bolMatchBeforeLast);
                    //console.log(jsnDesign[key].afterlast, bolMatchAfterLast);
                    //console.log(key, arrChunks[i].chunkText);
                    //console.log('******************************************************************');
                    
                    if (bolMatchBeforeFirst && bolMatchAfterFirst && bolMatchBeforeLast && bolMatchAfterLast) {
                        arrChunks[i].designMatch = key;
                        jsnDesign[key].arrInstance = (jsnDesign[key].arrInstance || []);
                        jsnDesign[key].arrInstance.push(i);
                        break;
                    } else {
                        // if before or after first/last did not match and the matches came from the same design JSON as the regex match: remove the match
                        if (arrChunks[i].designMatch && key === arrChunks[i].designMatch) {
                            arrChunks[i].designMatch = undefined;
                        }
                    }
                }
            }
        }
    }
    
    return arrChunks;
}

function openPropertyDialog(strType, arrCommandLinks, arrOtherLinks, strHTML, afterOpen, afterDone) {
    'use strict';
    var templateElement = document.createElement('template'), strCommandHTML, strOtherHTML, i, len
      , strPrefix = 'http://www.postgresql.org/docs/' + contextData.minorVersionNumber + '/static/';
    
    // assemble documentation links
    for (i = 0, len = arrCommandLinks.length, strCommandHTML = ''; i < len; i += 1) {
        strCommandHTML +=  (strCommandHTML ? '&nbsp;&nbsp;&nbsp;' : '') + '<a href="' + strPrefix + arrCommandLinks[i].link + '" class="doc-link" target="_blank" tabindex="0">' +
                                encodeHTML(arrCommandLinks[i].name) +
                            '</a>';
    }
    
    for (i = 0, len = arrOtherLinks.length, strOtherHTML = ''; i < len; i += 1) {
        strOtherHTML +=  (strOtherHTML ? '&nbsp;&nbsp;&nbsp;' : '') + '<a href="' + strPrefix + arrOtherLinks[i].link + '" class="doc-link" target="_blank" tabindex="0">' +
                                encodeHTML(arrOtherLinks[i].name) +
                            '</a>';
    }
    
    templateElement.setAttribute('id', 'dialog-property-window');
    templateElement.setAttribute('data-overlay-close', 'true');
    templateElement.innerHTML = ml(function () {/*
        <gs-page>
            <gs-header><center><h3>{{TYPE}} Properties</h3></center></gs-header>
            <gs-body padded>
                {{STRHTML}}
                <br />
                <gs-button dialogclose>Done</gs-button>
                <br />
                <div class="style-bracket-container">
                    <label class="style-bracket-header">Related PostgreSQL Documentation</label>
                    <div class="style-bracket-left"></div>
                    <div class="style-bracket-right"></div>
                    
                    {{COMMANDLINKS}}{{OTHERLINKS}}
                </div>
            </gs-body>
        </gs-page>
    */}).replace(/\{\{STRHTML\}\}/gi, strHTML)
        .replace(/\{\{TYPE\}\}/gi, strType)
        .replace(/\{\{COMMANDLINKS\}\}/gi, '<center>' + strCommandHTML + '</center>' + (strOtherHTML ? '<br />' : ''))
        .replace(/\{\{OTHERLINKS\}\}/gi, '<center>' + strOtherHTML + '</center>');
    
    GS.openDialog(templateElement, function () {
        var arrElements = xtag.query(this, '[value]'), i, len;
        
        for (i = 0, len = arrElements.length; i < len; i += 1) {
            arrElements[i].setAttribute('data-old-value', arrElements[i].getAttribute('value'));
        }
        
        arrElements[0].setAttribute('tabindex', '0');
        arrElements[0].focus();
        
        if (afterOpen) {
            afterOpen(this);
        }
    }, function (event, strAnswer) {
        if (strAnswer === 'Done') {
            afterDone(this);
        }
    });
}

function closePropertyDialog() {
    'use strict';
    GS.closeDialog('dialog-property-window', 'Done');
}

// insert a chunk in using the values in arrInsertAfterAttemptList for reference points
function insertChunk(arrChunks, toInsert, arrInsertAfterAttemptList, arrInsertBeforeAttemptList) {
    'use strict';
    var i, len, attempt_i, attempt_len, insertIndex = 0, intStartAfterLength, bolFound = false;
    
    arrInsertAfterAttemptList = arrInsertAfterAttemptList || [];
    arrInsertBeforeAttemptList = arrInsertBeforeAttemptList || [];
    
    //console.log('insertChunk', arrInsertAfterAttemptList.toString(), arrInsertBeforeAttemptList.toString());
    
    intStartAfterLength = arrInsertAfterAttemptList.length;
    
    for (i = 0, len = arrChunks.length; i < len; i += 1) {
        if (arrInsertAfterAttemptList.length === 0 && intStartAfterLength !== 0) {
            break;
        } else if (arrInsertBeforeAttemptList.indexOf(arrChunks[i].designMatch) !== -1) {
            //console.log(arrChunks[i]);
            insertIndex = i;// - 1;
            bolFound = true;
            break;
        }
        
        for (attempt_i = 0, attempt_len = arrInsertAfterAttemptList.length; attempt_i < attempt_len; attempt_i += 1) {
            if (arrChunks[i].designMatch === arrInsertAfterAttemptList[attempt_i]) {
                if ((i + 1) > insertIndex) {
                    insertIndex = (i + 1);
                    bolFound = true;
                }
                arrInsertAfterAttemptList.splice(attempt_i, 1);
                attempt_i -= 1;
            }
        }
    }
    
    // if no index has been found: append to the end
    if (!bolFound) {
        insertIndex = arrChunks.length;
    }
    
    //console.log('insertChunk 2', insertIndex);
    
    arrChunks.splice(insertIndex, 0, (typeof toInsert === 'object' ? toInsert : {'chunkText': toInsert}));
}

// update all chunks of a certain type until we match something in arrStopAtFirstList
function updateChunk(arrChunks, typeToUpdate, newText, arrStopAtFirstList) {
    'use strict';
    var i, len;
    //console.log('updateChunk');
    
    for (i = 0, len = arrChunks.length; i < len; i += 1) {
        // if the current chunk is in arrStopAtFirstList: break out of the loop
        if (arrStopAtFirstList.indexOf(arrChunks[i].designMatch) !== -1) {
            break;
            
        // else if the current chunk is the types to update: set it's text to newText
        } else if (arrChunks[i].designMatch === typeToUpdate) {
            arrChunks[i].chunkText = newText;
            break;
        }
    }
}

// clear the chunks that match using "arrTypesToClear",
//      trim previous whitespace/comment chunks until we run into a non-whitespace/comment chunk,
//      until we match something in arrStopAtFirstList
function removeChunk(arrChunks, arrTypesToClear, arrStopAtFirstList) {
    'use strict';
    var i, len, trim_i;
    //console.log('removeChunk');
    
    for (i = 0, len = arrChunks.length; i < len; i += 1) {
        // if the current chunk is in arrStopAtFirstList: break out of the loop
        if (arrStopAtFirstList.indexOf(arrChunks[i].designMatch) !== -1) {
            break;
            
        // else if the current chunk is one of the types to clear: empty it out and trim previous whitespace/comment chunks
        } else if (arrTypesToClear.indexOf(arrChunks[i].designMatch) !== -1) {
            arrChunks[i].chunkText = '';
            
            trim_i = (i - 1);
            while (trim_i >= 0 && arrChunks[trim_i].chunkType === 0) {
                arrChunks[trim_i].chunkText = arrChunks[trim_i].chunkText.trim();
                trim_i -= 1;
            }
        }
    }
}

// get text of nth chunk of type (returns null if it can't be found)
function chunkGetNthOfType(arrChunks, number, strType) {
    'use strict';
    var i, len, value, intInstances;
    
    // text: view name
    for (i = 0, len = arrChunks.length, value = null, intInstances = 0; i < len; i += 1) {
        if (arrChunks[i].designMatch === strType) {
            intInstances += 1;
            if (intInstances === number) {
                value = arrChunks[i].chunkText;
                break;
            }
        }
    }
    
    return value;
}

// get text of first chunk of type
function chunkGetFirstOfType(arrChunks, strType) {
    'use strict';
    return chunkGetNthOfType(arrChunks, 1, strType);
}

// this function find out if there is a chunk that matches on chunk type and text (case instensitive)
function chunkOfTypeAndTextExistsCaseInstensitive(arrChunks, strType, strValue) {
    'use strict';
    var i, len, bolFound;
    
    strValue = strValue.toUpperCase();
    
    // text: view name
    for (i = 0, len = arrChunks.length, bolFound = false; i < len; i += 1) {
        if (arrChunks[i].designMatch === strType && arrChunks[i].chunkText.toUpperCase() === strValue) {
            bolFound = true;
            break;
        }
    }
    
    return bolFound;
}



// updated chunk functions

// insert a chunk
function chunkInsert(arrChunks, strChunkType, strChunkText, arrInsertAfterAttemptList, arrInsertBeforeAttemptList) {
    'use strict';
    var i, len, attempt_i, attempt_len, insertIndex = 0, intStartAfterLength, bolFound = false;
    
    arrInsertAfterAttemptList = arrInsertAfterAttemptList || [];
    arrInsertBeforeAttemptList = arrInsertBeforeAttemptList || [];
    
    intStartAfterLength = arrInsertAfterAttemptList.length;
    
    for (i = 0, len = arrChunks.length; i < len; i += 1) {
        if (arrInsertAfterAttemptList.length === 0 && intStartAfterLength !== 0) {
            break;
        } else if (arrInsertBeforeAttemptList.indexOf(arrChunks[i].designMatch) !== -1) {
            insertIndex = i;// - 1;
            bolFound = true;
            break;
        }
        
        for (attempt_i = 0, attempt_len = arrInsertAfterAttemptList.length; attempt_i < attempt_len; attempt_i += 1) {
            if (arrChunks[i].designMatch === arrInsertAfterAttemptList[attempt_i]) {
                if ((i + 1) > insertIndex) {
                    insertIndex = (i + 1);
                    bolFound = true;
                }
                arrInsertAfterAttemptList.splice(attempt_i, 1);
                attempt_i -= 1;
            }
        }
    }
    
    // if no index has been found: append to the end
    if (!bolFound) {
        insertIndex = arrChunks.length;
    }
    
    // if the previous chunk is a text chunk: add a space to the beginning
    if (arrChunks[insertIndex - 1] && arrChunks[insertIndex - 1].chunkType !== 0) {
        strChunkText = ' ' + strChunkText;
    }
    
    // if the next chunk is a text chunk: add a space to the end
    if (arrChunks[insertIndex] && arrChunks[insertIndex].chunkType !== 0) {
        strChunkText = strChunkText + ' ';
    }
    
    arrChunks.splice(insertIndex, 0, {'chunkText': strChunkText});
}

function chunkUpdate(arrChunks, strChunkType, strChunkText, arrChunksToStopAt) {
    'use strict';
    var i, len;
    
    for (i = 0, len = arrChunks.length; i < len; i += 1) {
        // if the current chunk is in arrChunksToStopAt: break out of the loop
        if (arrChunksToStopAt.indexOf(arrChunks[i].designMatch) !== -1) {
            break;
            
        // else if the current chunk is the types to update: set it's text to strChunkText
        } else if (arrChunks[i].designMatch === strChunkType) {
            arrChunks[i].chunkText = strChunkText;
            break;
        }
    }
}


// update, insert or remove a chunk
function chunkUpsert(arrChunks, jsnDesign, arrChunksBefore, arrChunksAfter, strChunkType, strDependentKeyword, strChunkText) {
    'use strict';
    
    // if strChunkText is empty: remove
    if (strChunkText.trim() === '') {
        removeChunk(arrChunks, [strChunkType], arrChunksAfter);
        
    // else (the new chunk text is not empty):
    } else {
        // if the dependent keyword is defined but doesn't already exist: add it to the strChunkText
        if (strDependentKeyword && (jsnDesign[strDependentKeyword].arrInstance || []).length === 0) {
            strChunkText = (strDependentKeyword + ' ' + strChunkText);
        }
        
        // if chunk of type strChunkType doesn't exist: insert the new value
        if ((jsnDesign[strChunkType].arrInstance || []).length === 0) {
            chunkInsert(arrChunks, strChunkType, strChunkText, arrChunksBefore, arrChunksAfter);
            
        // if chunk of type strChunkType exists: replace the chunk's value
        } else if (jsnDesign[strChunkType].arrInstance.length > 0) {
            chunkUpdate(arrChunks, strChunkType, strChunkText, arrChunksAfter);
        }
    }
}

/*
chunkUpsert(['NAME', 'VIEW'], ['AS', 'WITHPAREN', 'WITH'], 'COLFILTER', '', '(' + ctlFilter.value + ')');

// items before
// items after
// chunk type
// dependent keyword
// new value

// put the whitespace on the correct side of the value
// if the dependent keyword does not exist: append it before the value
// if the chunk does not already exist:
//      insert the value:
//          immediately after items_before (the latest chunk that bears one of their names)
// if the chunk already exists:
//      update the value:
//          first instance before items_after (before the first that bears one of their names)
*/

//insertChunk(arrChunks, ' WITH (security_barrier)', ['COLFILTER', 'NAME', 'VIEW']);
//updateChunk(arrChunks, 'WITHPAREN', '(security_barrier)', ['AS']);
//removeChunk(arrChunks, ['WITH', 'WITHPAREN'], ['AS'])



// sub-constructs are syntax segments of a query that accomplish an effect
// there are several attributes that sub-constructs have:
//      hook point:   a keyword (or multiple) that distinguishes the sub-construct uniquely
//      duplicatable: whether or not the sub-construct can be appear more than once
//      reordable:    whether or not the sub-construct can be reordered
//      required:     whether or not the query needs this sub-construct in order to run
//      sub-constructs cannot be reordered within themselves
//      the first sub-construct of a query cannot be moved
// 
// here is the workflow for query parsing for the propery window:
//      make a JSON structure that defines the constructs that make up a particular query
//      split the current query into chunks
//      use the JSON structure and try to find each construct (in order) in the split query
//          as you identify constructs: append the current construct to a new JSON that mimics the order of the query
//      generate the html of the dialog from the JSON (following the original order, but getting it's values from the second JSON)
//      when the dialog is closed:
//          alter the values from the second JSON
//          reconstruct from the second JSON
//          replace the current value




// ##################################################################################################################################################
// ##################################################################################################################################################
// #################################################### POSTGRES 9.2 SPECIFIC PROPERTY FUNCTIONS ####################################################
// ##################################################################################################################################################
// ##################################################################################################################################################


//var jsnDesign = {
//        'NAME': {
//            'type': ['text', 'paren', 'white/comment'],
//            
//            'after_1st' : [
//                {'type': 'ON', 'required': false},
//                {'type': 'AS', 'required': true}
//            ],
//            'after_2nd' : [],
//            'after_3rd' : [],
//            'after_4th' : [],
//            'after_last': [],
//            'after_each': [],
//            
//            'before_1st' : [],
//            'before_2nd' : [],
//            'before_3rd' : [],
//            'before_4th' : [],
//            'before_last': [],
//            'before_each': []
//        }
//    };
// s - selectbox
// c - checkbox
// t - textbox
// m - multiline text
//
// e - emptyable

//|CREATE| |GLOBAL/LOCAL|(s, e) |TEMP/TEMPORARY|(c) |UNLOGGED|(c) |TABLE| |IF NOT EXISTS|(c) {TABLENAME}(t)
//          |OF| {TYPENAME}(t) (COLPAREN) |WITH OIDS/WITHOUT OIDS/WITH (WITHPAREN)|


function propertyListCREATETABLE(tabElement, strScript, textRange, arrChunks) {
    'use strict';
    var jsnDesign = {
            'CREATE':      { 'regex': /^CREATE$/gi },
            'GLOBALLOCAL': { 'regex': /^(GLOBAL|LOCAL)$/gi },
            'TEMP':        { 'regex': /^(TEMP|TEMPORARY)$/gi },
            'UNLOGGED':    { 'regex': /^UNLOGGED$/gi },
            'TABLE':       { 'regex': /^TABLE$/gi },
            'IF':          { 'regex': /^IF$/gi },
            'NOT':         { 'regex': /^NOT$/gi },
            'EXISTS':      { 'regex': /^EXISTS$/gi },
            'NAME': {
                'type': 2,
                'afterfirst': ['TABLE', 'EXISTS'],
                'beforefirst': ['OF']
            },
            'OF': {
                'regex': /^OF$/gi
            },
            'TYPE': {
                'type': 2,
                'afterfirst': ['OF'],
                'beforefirst': ['COLPAREN', 'WITH']
            },
            'COLPAREN': {
                'type': 1,
                'afterfirst': ['NAME', 'TYPE'],
                'beforefirst': ['WITH', 'WITHPAREN']
            },
            'WITH': {
                'regex': /^WITH$/gi
            },
            'WITHPAREN': {
                'type': 1,
                'afterfirst': ['WITH']
            }
        }, i, len, strValue;
    
    // match what we can using regex
    arrChunks = regexMatch(jsnDesign, arrChunks);
    
    // match the rest by location of the chunk 
    arrChunks = locationDependentMatch(jsnDesign, arrChunks);
    
    //console.log(JSON.stringify(arrChunks[0]));
    //console.log(arrChunks);
    //console.log(jsnDesign);
    
    // creating property dialog function
    window.propertyWindowDialog = function () {
        var templateElement = document.createElement('template')
          , strCreateHTML, strReplaceHTML, strTempHTML, strNameHTML, strFilterHTML, strSecurityHTML
          , i, len, strHTML, strValue;
        
        // checkbox: create
        strValue = chunkOfTypeAndTextExistsCaseInstensitive(arrChunks, 'CREATEREPLACE', 'CREATE').toString();
        
        strCreateHTML = '<label for="property-create">Create:</label>' +
                        '<gs-checkbox id="property-create" value="' + (strValue) + '"></gs-checkbox>';
        
        // checkbox: replace
        strValue = chunkOfTypeAndTextExistsCaseInstensitive(arrChunks, 'CREATEREPLACE', 'REPLACE').toString();
        
        strReplaceHTML = '<label for="property-replace">Replace:</label>' +
                         '<gs-checkbox id="property-replace" value="' + (strValue) + '"></gs-checkbox>';
        
        // checkbox: temporary
        strValue = Boolean(chunkGetFirstOfType(arrChunks, 'TEMP')).toString();
        
        strTempHTML = '<label for="property-temp">Temporary:</label>' +
                      '<gs-checkbox id="property-temp" value="' + (strValue) + '"></gs-checkbox>';
        
        // text: view name
        strValue = chunkGetFirstOfType(arrChunks, 'NAME') || '';
        
        strNameHTML = '<label for="property-name">View Name:</label>' +
                      '<gs-memo id="property-name" value="' + encodeHTML(strValue) + '" autoresize rows="1" no-resize-handle></gs-memo>';
        
        // text: output column name filter
        strValue = (chunkGetFirstOfType(arrChunks, 'COLFILTER') || '()');
        strValue = strValue.substring(1, strValue.length - 1);
        
        strFilterHTML = '<label for="property-filter">Column Names: <small>(Overrides the names of the output)</small></label>' +
                        '<gs-memo id="property-filter" value="' + encodeHTML(strValue) + '" autoresize rows="1" no-resize-handle></gs-memo>';
        
        // checkbox: security barrier
        strValue = chunkGetFirstOfType(arrChunks, 'WITHPAREN') || '';
        strValue = (
                        strValue.indexOf('security_barrier') > -1 &&
                        strValue.replace(/\s/gi, '').toLowerCase().indexOf('security_barrier=false') === -1
                    ).toString();
        
        strSecurityHTML = '<label for="property-security">Security Barrier:</label>' +
                          '<gs-checkbox id="property-security" value="' + (strValue) + '"></gs-checkbox>';
        
        // assemble HTML
        strHTML =   '<gs-grid gutter min-width="0px {reflow}; 300px {1,1}; 527px {1,1,1,1};" reflow-at="527">' +
                        '<gs-block>' + strCreateHTML + '</gs-block>' +
                        '<gs-block>' + strReplaceHTML + '</gs-block>' +
                        '<gs-block>' + strTempHTML + '</gs-block>' +
                        '<gs-block>' + strSecurityHTML + '</gs-block>' +
                    '</gs-grid>' +
                    '<gs-grid gutter reflow-at="527">' +
                        '<gs-block>' + strNameHTML + '</gs-block>' +
                        '<gs-block>' + strFilterHTML + '</gs-block>' +
                    '</gs-grid>';
        
        // create dialog
        openPropertyDialog('CREATE VIEW', [
                                            {'link': 'sql-createview.html', 'name': 'CREATE VIEW'},
                                            {'link': 'sql-select.html', 'name': 'SELECT'}
                                          ],
                                          [
                                            {'link': 'functions-datetime.html', 'name': 'Date/Time Functions and Operators'},
                                            {'link': 'functions-string.html', 'name': 'String Functions and Operators'}
                                          ], strHTML, '', function () {
            var ctlCreate, ctlReplace, ctlTemp, ctlName, ctlFilter, ctlWithSecure
              , i, len, strEditingScript, strText, bolDone, arrValue;
            
            //strEditingScript = strScript.substring(intSearchStart, intSearchEnd);
            //console.log(strEditingScript);
            
            ctlCreate = document.getElementById('property-create');
            ctlReplace = document.getElementById('property-replace');
            ctlTemp = document.getElementById('property-temp');
            ctlName = document.getElementById('property-name');
            ctlFilter = document.getElementById('property-filter');
            ctlWithSecure = document.getElementById('property-security');
            
            // WITH
            if (ctlWithSecure.value !== ctlWithSecure.getAttribute('data-old-value')) {
                removeChunk(arrChunks, ['WITH'], ['AS']);
                chunkUpsert(arrChunks, jsnDesign
                          , ['COLFILTER', 'NAME', 'VIEW'], ['AS']
                          , 'WITHPAREN', ''
                          , (ctlWithSecure.value === 'true' ? 'WITH (security_barrier)' : ''));
            }
            // column filter
            if (ctlFilter.value !== ctlFilter.getAttribute('data-old-value')) {
                chunkUpsert(arrChunks, jsnDesign
                          , ['NAME', 'VIEW'], ['AS', 'WITHPAREN', 'WITH']
                          , 'COLFILTER', ''
                          , (ctlFilter.value ? '(' + ctlFilter.value + ')' : ''));
                
            }
            // name
            if (ctlName.value !== ctlName.getAttribute('data-old-value')) {
                chunkUpsert(arrChunks, jsnDesign, ['VIEW'], ['AS', 'WITHPAREN', 'WITH', 'COLFILTER'], 'NAME', '', ctlName.value);
            }
            // temporary
            if (ctlTemp.value !== ctlTemp.getAttribute('data-old-value')) {
                chunkUpsert(arrChunks, jsnDesign
                          , [], ['AS', 'WITHPAREN', 'WITH', 'COLFILTER', 'NAME', 'VIEW']
                          , 'TEMP', '', (ctlTemp.value === 'true' ? 'TEMPORARY' : ''));
            }
            // CREATE OR REPLACE
            if ((ctlCreate.value !== ctlCreate.getAttribute('data-old-value')) ||
                (ctlReplace.value !== ctlReplace.getAttribute('data-old-value'))) {
                
                removeChunk(arrChunks, ['CREATEREPLACE'], ['AS', 'WITHPAREN', 'WITH', 'COLFILTER', 'NAME', 'VIEW', 'TEMP']);
                
                arrValue = [];
                if (ctlCreate.value === 'true') { arrValue.push('CREATE'); }
                if (ctlReplace.value === 'true') { arrValue.push('REPLACE'); }
                strText = arrValue.join(' OR ');
                
                updateChunk(arrChunks, 'CREATEREPLACE', strText, ['AS', 'WITHPAREN', 'WITH', 'COLFILTER', 'NAME', 'VIEW', 'TEMP']);
            }
            
            
            for (i = 0, len = arrChunks.length, strEditingScript = ''; i < len; i += 1) {
                strEditingScript += arrChunks[i].chunkText;
            }
            
            //console.log(strEditingScript);
            propertyWindowReplaceQuery(tabElement, textRange, strEditingScript);
        });
        
    };
    /*
    CREATE
        [ OR REPLACE ]
        [ TEMP | TEMPORARY ] VIEW name [ ( column_name [, ...] ) ]
        [ WITH ( view_option_name [= view_option_value] [, ... ] ) ]
        AS query
    */
}


function propertyListVIEW(tabElement, strScript, textRange, arrChunks) {
    'use strict';
    var jsnDesign = {
            'CREATEREPLACE': {
                'regex': /^(CREATE|OR|REPLACE)$/gi
            },
            'TEMP': {
                'regex': /^(TEMP|TEMPORARY)$/gi
            },
            'VIEW': {
                'regex': /^VIEW$/gi
            },
            'NAME': {
                'type': 2,
                'afterfirst': ['VIEW'],
                'beforefirst': ['WITH', 'AS']
            },
            'COLFILTER': {
                'type': 1,
                'afterfirst': ['VIEW', 'NAME'],
                'beforefirst': ['WITH', 'AS']
            },
            'WITH': {
                'regex': /^WITH$/gi
            },
            'WITHPAREN': {
                'type': 1,
                'afterfirst': ['WITH'],
                'beforefirst': ['AS']
            },
            'AS': {
                'regex': /^AS$/gi
            }
        }, i, len, strValue;
    
    // match what we can using regex
    arrChunks = regexMatch(jsnDesign, arrChunks);
    
    // match the rest by location of the chunk 
    arrChunks = locationDependentMatch(jsnDesign, arrChunks);
    
    //console.log(JSON.stringify(arrChunks[0]));
    //console.log(arrChunks);
    //console.log(jsnDesign);
    
    // creating property dialog function
    window.propertyWindowDialog = function () {
        var templateElement = document.createElement('template')
          , strCreateHTML, strReplaceHTML, strTempHTML, strNameHTML, strFilterHTML, strSecurityHTML
          , i, len, strHTML, strValue;
        
        // checkbox: create
        strValue = chunkOfTypeAndTextExistsCaseInstensitive(arrChunks, 'CREATEREPLACE', 'CREATE').toString();
        
        strCreateHTML = '<label for="property-create">Create:</label>' +
                        '<gs-checkbox id="property-create" value="' + (strValue) + '"></gs-checkbox>';
        
        // checkbox: replace
        strValue = chunkOfTypeAndTextExistsCaseInstensitive(arrChunks, 'CREATEREPLACE', 'REPLACE').toString();
        
        strReplaceHTML = '<label for="property-replace">Replace:</label>' +
                         '<gs-checkbox id="property-replace" value="' + (strValue) + '"></gs-checkbox>';
        
        // checkbox: temporary
        strValue = Boolean(chunkGetFirstOfType(arrChunks, 'TEMP')).toString();
        
        strTempHTML = '<label for="property-temp">Temporary:</label>' +
                      '<gs-checkbox id="property-temp" value="' + (strValue) + '"></gs-checkbox>';
        
        // text: view name
        strValue = chunkGetFirstOfType(arrChunks, 'NAME') || '';
        
        strNameHTML = '<label for="property-name">View Name:</label>' +
                      '<gs-memo id="property-name" value="' + encodeHTML(strValue) + '" autoresize rows="1" no-resize-handle></gs-memo>';
        
        // text: output column name filter
        strValue = (chunkGetFirstOfType(arrChunks, 'COLFILTER') || '()');
        strValue = strValue.substring(1, strValue.length - 1);
        
        strFilterHTML = '<label for="property-filter">Column Names: <small>(Overrides the names of the output)</small></label>' +
                        '<gs-memo id="property-filter" value="' + encodeHTML(strValue) + '" autoresize rows="1" no-resize-handle></gs-memo>';
        
        // checkbox: security barrier
        strValue = chunkGetFirstOfType(arrChunks, 'WITHPAREN') || '';
        strValue = (
                        strValue.indexOf('security_barrier') > -1 &&
                        strValue.replace(/\s/gi, '').toLowerCase().indexOf('security_barrier=false') === -1
                    ).toString();
        
        strSecurityHTML = '<label for="property-security">Security Barrier:</label>' +
                          '<gs-checkbox id="property-security" value="' + (strValue) + '"></gs-checkbox>';
        
        // assemble HTML
        strHTML =   '<gs-grid gutter min-width="0px {reflow}; 300px {1,1}; 527px {1,1,1,1};" reflow-at="527">' +
                        '<gs-block>' + strCreateHTML + '</gs-block>' +
                        '<gs-block>' + strReplaceHTML + '</gs-block>' +
                        '<gs-block>' + strTempHTML + '</gs-block>' +
                        '<gs-block>' + strSecurityHTML + '</gs-block>' +
                    '</gs-grid>' +
                    '<gs-grid gutter reflow-at="527">' +
                        '<gs-block>' + strNameHTML + '</gs-block>' +
                        '<gs-block>' + strFilterHTML + '</gs-block>' +
                    '</gs-grid>';
        
        // create dialog
        openPropertyDialog('CREATE VIEW', [
                                            {'link': 'sql-createview.html', 'name': 'CREATE VIEW'},
                                            {'link': 'sql-select.html', 'name': 'SELECT'}
                                          ],
                                          [
                                            {'link': 'functions-datetime.html', 'name': 'Date/Time Functions and Operators'},
                                            {'link': 'functions-string.html', 'name': 'String Functions and Operators'}
                                          ], strHTML, '', function () {
            var ctlCreate, ctlReplace, ctlTemp, ctlName, ctlFilter, ctlWithSecure
              , i, len, strEditingScript, strText, bolDone, arrValue;
            
            //strEditingScript = strScript.substring(intSearchStart, intSearchEnd);
            //console.log(strEditingScript);
            
            ctlCreate = document.getElementById('property-create');
            ctlReplace = document.getElementById('property-replace');
            ctlTemp = document.getElementById('property-temp');
            ctlName = document.getElementById('property-name');
            ctlFilter = document.getElementById('property-filter');
            ctlWithSecure = document.getElementById('property-security');
            
            // WITH
            if (ctlWithSecure.value !== ctlWithSecure.getAttribute('data-old-value')) {
                removeChunk(arrChunks, ['WITH'], ['AS']);
                chunkUpsert(arrChunks, jsnDesign
                          , ['COLFILTER', 'NAME', 'VIEW'], ['AS']
                          , 'WITHPAREN', ''
                          , (ctlWithSecure.value === 'true' ? 'WITH (security_barrier)' : ''));
            }
            // column filter
            if (ctlFilter.value !== ctlFilter.getAttribute('data-old-value')) {
                chunkUpsert(arrChunks, jsnDesign
                          , ['NAME', 'VIEW'], ['AS', 'WITHPAREN', 'WITH']
                          , 'COLFILTER', ''
                          , (ctlFilter.value ? '(' + ctlFilter.value + ')' : ''));
                
            }
            // name
            if (ctlName.value !== ctlName.getAttribute('data-old-value')) {
                chunkUpsert(arrChunks, jsnDesign, ['VIEW'], ['AS', 'WITHPAREN', 'WITH', 'COLFILTER'], 'NAME', '', ctlName.value);
            }
            // temporary
            if (ctlTemp.value !== ctlTemp.getAttribute('data-old-value')) {
                chunkUpsert(arrChunks, jsnDesign
                          , [], ['AS', 'WITHPAREN', 'WITH', 'COLFILTER', 'NAME', 'VIEW']
                          , 'TEMP', '', (ctlTemp.value === 'true' ? 'TEMPORARY' : ''));
            }
            // CREATE OR REPLACE
            if ((ctlCreate.value !== ctlCreate.getAttribute('data-old-value')) ||
                (ctlReplace.value !== ctlReplace.getAttribute('data-old-value'))) {
                
                removeChunk(arrChunks, ['CREATEREPLACE'], ['AS', 'WITHPAREN', 'WITH', 'COLFILTER', 'NAME', 'VIEW', 'TEMP']);
                
                arrValue = [];
                if (ctlCreate.value === 'true') { arrValue.push('CREATE'); }
                if (ctlReplace.value === 'true') { arrValue.push('REPLACE'); }
                strText = arrValue.join(' OR ');
                
                updateChunk(arrChunks, 'CREATEREPLACE', strText, ['AS', 'WITHPAREN', 'WITH', 'COLFILTER', 'NAME', 'VIEW', 'TEMP']);
            }
            
            
            for (i = 0, len = arrChunks.length, strEditingScript = ''; i < len; i += 1) {
                strEditingScript += arrChunks[i].chunkText;
            }
            
            //console.log(strEditingScript);
            propertyWindowReplaceQuery(tabElement, textRange, strEditingScript);
        });
        
    };
    /*
    CREATE
        [ OR REPLACE ]
        [ TEMP | TEMPORARY ] VIEW name [ ( column_name [, ...] ) ]
        [ WITH ( view_option_name [= view_option_value] [, ... ] ) ]
        AS query
    */
}

function propertyListRULE(tabElement, strScript, textRange, arrChunks) {
    'use strict';
    var jsnDesign = {
            'CREATEREPLACE': {
                'regex': /^(CREATE|OR|REPLACE)$/gi
            },
            'RULE': {
                'regex': /^RULE$/gi
            },
            'NAME': {
                'type': 2,
                'afterfirst': ['RULE'],
                'beforefirst': ['AS', 'ON', 'TO', 'WHERE', 'DO', 'ALSOINSTEAD']
            },
            'AS': {
                'regex': /^AS$/gi
            },
            'ON': {
                'regex': /^ON$/gi
            },
            'EVENT': {
                'type': 2,
                'afterfirst': ['ON'],
                'beforefirst': ['TO', 'WHERE', 'DO', 'ALSOINSTEAD']
            },
            'TO': {
                'regex': /^TO$/gi
            },
            'OBJECT': {
                'type': 2,
                'afterfirst': ['TO'],
                'beforefirst': ['WHERE', 'DO', 'ALSOINSTEAD']
            },
            'WHERE': {
                'regex': /^WHERE$/gi,
                'type': 2,
                'beforefirst': ['DO', 'ALSOINSTEAD']
            },
            'WHERECONDITION': {
                'type': [1, 2],
                'afterfirst': ['WHERE'],
                'beforefirst': ['DO', 'ALSOINSTEAD']
            },
            'DO': {
                'regex': /^DO$/gi
            },
            'ALSOINSTEAD': {
                'regex': /^(ALSO|INSTEAD)$/gi
            }
        }, i, len, strValue;
    
    // match what we can using regex
    arrChunks = regexMatch(jsnDesign, arrChunks);
    
    // match the rest by location of the chunk
    arrChunks = locationDependentMatch(jsnDesign, arrChunks);
    
    //console.log(arrChunks);
    
    // creating property dialog function
    window.propertyWindowDialog = function () {
        var templateElement = document.createElement('template')
          , strCreateHTML, strReplaceHTML, strRuleNameHTML, strTargetNameHTML, strEventHTML, strWhereHTML, strAlsoInsteadHTML
          , i, len, strHTML, strValue, arrArray;
        
        // checkbox: create
        for (i = 0, len = arrChunks.length, strValue = 'false'; i < len; i += 1) {
            if (arrChunks[i].designMatch === 'CREATEREPLACE' && arrChunks[i].chunkText.toUpperCase() === 'CREATE') {
                strValue = 'true';
                break;
            }
        }
        
        strCreateHTML = '<label for="property-create">Create:</label>' +
                        '<gs-checkbox id="property-create" value="' + (strValue) + '"></gs-checkbox>';
        
        // checkbox: replace
        for (i = 0, len = arrChunks.length, strValue = 'false'; i < len; i += 1) {
            if (arrChunks[i].designMatch === 'CREATEREPLACE' && arrChunks[i].chunkText.toUpperCase() === 'REPLACE') {
                strValue = 'true';
                break;
            }
        }
        
        strReplaceHTML = '<label for="property-replace">Replace:</label>' +
                         '<gs-checkbox id="property-replace" value="' + (strValue) + '"></gs-checkbox>';
        
        // text: rule name
        for (i = 0, len = arrChunks.length, strValue = ''; i < len; i += 1) {
            if (arrChunks[i].designMatch === 'NAME') {
                strValue = arrChunks[i].chunkText;
                break;
            }
        }
        
        strRuleNameHTML = '<label for="property-rule-name">Rule Name:</label>' +
                        '<gs-memo id="property-rule-name" value="' + encodeHTML(strValue) + '" autoresize rows="1" no-resize-handle></gs-memo>';
        
        // text: target name
        for (i = 0, len = arrChunks.length, strValue = ''; i < len; i += 1) {
            if (arrChunks[i].designMatch === 'OBJECT') {
                strValue = arrChunks[i].chunkText;
                break;
            }
        }
        
        strTargetNameHTML = '<label for="property-target">Listening On Object:</label>' +
                            '<gs-memo id="property-target" value="' + encodeHTML(strValue) + '" autoresize rows="1" no-resize-handle></gs-memo>';
        
        
        // select: event
        for (i = 0, len = arrChunks.length, strValue = ''; i < len; i += 1) {
            if (arrChunks[i].designMatch === 'EVENT') {
                strValue = arrChunks[i].chunkText.toUpperCase();
                break;
            }
        }
        
        strEventHTML =  '<label for="property-event">Run On:</label>' +
                        '<gs-select id="property-event" value="' + encodeHTML(strValue) + '">' +
                            '<option></option>' +
                            '<option>SELECT</option>' +
                            '<option>INSERT</option>' +
                            '<option>UPDATE</option>' +
                            '<option>DELETE</option>' +
                        '</gs-select>';
        
        // text: where
        if (jsnDesign.WHERECONDITION.arrInstance.length > 0) {
            arrArray = jsnDesign.WHERECONDITION.arrInstance;
            
            for (i = arrArray[0], len = arrArray[arrArray.length - 1] + 1, strValue = ''; i < len; i += 1) {
                strValue += arrChunks[i].chunkText;
            }
        } else {
            strValue = '';
        }
        //console.log(jsnDesign.WHERECONDITION);
        
        strWhereHTML = '<label for="property-where">Run Where:</label>' +
                       '<gs-memo id="property-where" value="' + encodeHTML(strValue) + '" autoresize rows="1" no-resize-handle></gs-memo>';
        
        
        // select: ALSO/INSTEAD
        for (i = 0, len = arrChunks.length, strValue = ''; i < len; i += 1) {
            if (arrChunks[i].designMatch === 'ALSOINSTEAD') {
                strValue = arrChunks[i].chunkText.toUpperCase();
                break;
            }
        }
        
        strAlsoInsteadHTML =    '<label for="property-also-instead">Runs:</label>' +
                                '<gs-select id="property-also-instead" value="' + encodeHTML(strValue) + '">' +
                                    '<option></option>' +
                                    '<option value="INSTEAD">INSTEAD of default action</option>' +
                                    '<option value="ALSO">ALSO with default action</option>' +
                                '</gs-select>';
        
        // build final HTML
        strHTML =   '<gs-grid gutter min-width="0px {reflow}; 300px {1,1}; 527px {1,1,1,2};" reflow-at="535">' +
                        '<gs-block>' + strCreateHTML + '</gs-block>' +
                        '<gs-block>' + strReplaceHTML + '</gs-block>' +
                        '<gs-block>' + strEventHTML + '</gs-block>' +
                        '<gs-block>' + strAlsoInsteadHTML + '</gs-block>' +
                    '</gs-grid>' +
                    '<gs-grid gutter reflow-at="527">' +
                        '<gs-block>' + strRuleNameHTML + '</gs-block>' +
                        '<gs-block>' + strTargetNameHTML + '</gs-block>' +
                    '</gs-grid>' +
                    strWhereHTML;
        
        // create dialog
        openPropertyDialog('CREATE RULE', [
                                            {'link': 'sql-createrule.html', 'name': 'CREATE RULE'},
                                            {'link': 'sql-select.html', 'name': 'SELECT'},
                                            {'link': 'sql-insert.html', 'name': 'INSERT'},
                                            {'link': 'sql-update.html', 'name': 'UPDATE'},
                                            {'link': 'sql-delete.html', 'name': 'DELETE'}
                                          ],
                                          [
                                            {'link': 'rules-update.html', 'name': 'Rules on INSERT, UPDATE and DELETE'}
                                          ], strHTML, '', function () {
            var ctlAlsoInstead, ctlWhere, ctlTargetName, ctlEvent, ctlRuleName, ctlReplace, ctlCreate
              , i, len, strEditingScript, strText, strTemp;
            
            //strEditingScript = strScript.substring(intSearchStart, intSearchEnd);
            //console.log(strEditingScript);
            
            ctlAlsoInstead = document.getElementById('property-also-instead');
            ctlWhere = document.getElementById('property-where');
            ctlTargetName = document.getElementById('property-target');
            ctlEvent = document.getElementById('property-event');
            ctlRuleName = document.getElementById('property-rule-name');
            ctlReplace = document.getElementById('property-replace');
            ctlCreate = document.getElementById('property-create');
            
            // ALSOINSTEAD
            if (ctlAlsoInstead.value !== ctlAlsoInstead.getAttribute('data-old-value')) {
                strTemp = '';
                if (jsnDesign.DO.arrInstance.length === 0) { strTemp = 'DO '; }
                
                // if no target name exists: insert
                if (!jsnDesign.ALSOINSTEAD.arrInstance || jsnDesign.ALSOINSTEAD.arrInstance.length === 0) {
                    insertChunk(arrChunks, ' ' + strTemp + ctlAlsoInstead.value, ['DO', 'WHERECONDITION', 'WHERE', 'OBJECT', 'TO', 'EVENT', 'ON', 'AS', 'NAME', 'RULE', 'CREATEREPLACE']);
                    
                // else: overwrite targetname
                } else {
                    updateChunk(arrChunks, 'ALSOINSTEAD', strTemp + ctlAlsoInstead.value, []);
                }
            }
            
            // WHERECONDITION
            if (ctlWhere.value !== ctlWhere.getAttribute('data-old-value')) {
                // if no target name exists: insert
                if (!jsnDesign.WHERECONDITION.arrInstance || jsnDesign.WHERECONDITION.arrInstance.length === 0) {
                    insertChunk(arrChunks, ' WHERE ' + ctlWhere.value, ['OBJECT', 'TO', 'EVENT', 'ON', 'AS', 'NAME', 'RULE', 'CREATEREPLACE'], ['DO', 'INSTEAD']);
                    
                // else: overwrite targetname
                } else {
                    removeChunk(arrChunks, ['WHERE', 'WHERECONDITION'], ['DO', 'ALSOINSTEAD']);
                    if (ctlWhere.value.trim()) {
                        updateChunk(arrChunks, 'WHERECONDITION', ' WHERE ' + ctlWhere.value, ['DO', 'ALSOINSTEAD']);
                    }
                }
            }
            
            // TARGET NAME
            if (ctlTargetName.value !== ctlTargetName.getAttribute('data-old-value')) {
                strTemp = '';
                if (jsnDesign.TO.arrInstance.length === 0) { strTemp = 'TO '; }
                
                // if no target name exists: insert
                if (!jsnDesign.OBJECT.arrInstance || jsnDesign.OBJECT.arrInstance.length === 0) {
                    insertChunk(arrChunks, ' ' + strTemp + ctlTargetName.value, ['TO', 'EVENT', 'ON', 'AS', 'NAME', 'RULE', 'CREATEREPLACE']);
                    
                // else: overwrite targetname
                } else {
                    updateChunk(arrChunks, 'OBJECT', strTemp + ctlTargetName.value, ['WHERE', 'DO', 'ALSOINSTEAD']);
                }
            }
            
            // EVENT
            if (ctlEvent.value !== ctlEvent.getAttribute('data-old-value')) {
                strTemp = '';
                if (jsnDesign.ON.arrInstance.length === 0) { strTemp = 'ON '; }
                
                // if no event exists: insert
                if (!jsnDesign.NAME.arrInstance || jsnDesign.NAME.arrInstance.length === 0) {
                    insertChunk(arrChunks, ' ' + strTemp + ctlEvent.value, ['ON', 'AS', 'NAME', 'RULE', 'CREATEREPLACE']);
                    
                // else: overwrite event
                } else {
                    updateChunk(arrChunks, 'EVENT', strTemp + ctlEvent.value, ['TO', 'OBJECT', 'WHERE', 'DO', 'ALSOINSTEAD']);
                }
            }
            
            // RULE NAME
            if (ctlRuleName.value !== ctlRuleName.getAttribute('data-old-value')) {
                // if no name exists: insert
                if (!jsnDesign.NAME.arrInstance || jsnDesign.NAME.arrInstance.length === 0) {
                    insertChunk(arrChunks, ' ' + ctlRuleName.value, ['RULE']);
                    
                // else: overwrite name
                } else {
                    updateChunk(arrChunks, 'NAME', ctlRuleName.value, ['AS', 'ON', 'EVENT', 'TO', 'OBJECT', 'WHERE', 'DO', 'ALSOINSTEAD']);
                }
            }
            
            // CREATEREPLACE
            if (ctlCreate.value !== ctlCreate.getAttribute('data-old-value') ||
                ctlReplace.value !== ctlReplace.getAttribute('data-old-value')) {
                
                removeChunk(arrChunks, ['CREATEREPLACE'], ['RULE', 'NAME', 'AS', 'ON', 'EVENT', 'TO', 'OBJECT', 'WHERE', 'DO', 'ALSOINSTEAD']);
                
                if (ctlCreate.value === 'true' && ctlReplace.value === 'true') {
                    updateChunk(arrChunks, 'CREATEREPLACE', 'CREATE OR REPLACE', ['RULE', 'NAME', 'AS', 'ON', 'EVENT', 'TO', 'OBJECT', 'WHERE', 'DO', 'ALSOINSTEAD']);
                    
                } else if (ctlReplace.value === 'true') {
                    updateChunk(arrChunks, 'CREATEREPLACE', 'REPLACE', ['RULE', 'NAME', 'AS', 'ON', 'EVENT', 'TO', 'OBJECT', 'WHERE', 'DO', 'ALSOINSTEAD']);
                    
                } else if (ctlCreate.value === 'true') {
                    updateChunk(arrChunks, 'CREATEREPLACE', 'CREATE', ['RULE', 'NAME', 'AS', 'ON', 'EVENT', 'TO', 'OBJECT', 'WHERE', 'DO', 'ALSOINSTEAD']);
                }
            }
            
            // assemble script
            for (i = 0, len = arrChunks.length, strEditingScript = ''; i < len; i += 1) {
                strEditingScript += arrChunks[i].chunkText;
            }
            
            //console.log(strEditingScript);
            propertyWindowReplaceQuery(tabElement, textRange, strEditingScript);
        });
        
    };
    /*
        CREATE [ OR REPLACE ] RULE
            name AS
                ON { SELECT | INSERT | UPDATE | DELETE }
                TO table_name [ WHERE condition ]
                DO [ ALSO | INSTEAD ]
                    { NOTHING | command | ( command ; command ... ) }
    */
}

function propertyListPERMISSION(tabElement, strScript, textRange, arrChunks) {
    'use strict';
    var jsnDesign = {
            'GRANTREVOKE': {
                'regex': /^(GRANT|REVOKE)$/gi,
                'arrInstance': []
            },
            'PERMISSION': {
                'regex': /^((ALL|SELECT|INSERT|UPDATE|DELETE|TRUNCATE|REFERENCES|TRIGGER|USAGE|CREATE|CONNECT|TEMPORARY|TEMP|EXECUTE)(,)?|,)$/gi,
                'arrInstance': []
            },
            'ON': {
                'regex': /^ON$/gi,
                'arrInstance': []
            },
            
            
            'OBJECT_NAME': { // object name is swapped with object type because order affects detection
                'type': 2,
                'afterfirst': ['OBJECT_TYPE'],
                'beforefirst': ['TOFROM', 'ROLE_NAME', 'WITH', 'OPTION'],
                'arrInstance': []
            },
            
            'OBJECT_TYPE': {
                'type': 2,
                'afterfirst': ['ON'],
                'beforefirst': ['OBJECT_NAME', 'TOFROM', 'ROLE_NAME', 'WITH', 'OPTION'],
                'arrInstance': []
            },
            
            
            'TOFROM': {
                'regex': /^(TO|FROM)$/gi,
                'arrInstance': []
            },
            'ROLE_NAME': {
                'type': 2,
                'afterfirst': ['TOFROM'],
                'beforefirst': ['WITH', 'OPTION'],
                'arrInstance': []
            },
            'WITH': {
                'regex': /^WITH$/gi,
                'arrInstance': []
            },
            //'GRANT': {   // <-- GRANTREVOKE doubles for this
            //    'regex': /^GRANT$/gi
            //    'afterfirst': ['WITH'],
            //    'type': 2,
            //},
            'ADMIN': {
                'regex': /^ADMIN$/gi,
                'arrInstance': []
            },
            'OPTION': {
                'regex': /^OPTION$/gi,
                'arrInstance': []
            }
        }, i, len, strValue;
    
    // match what we can using regex
    arrChunks = regexMatch(jsnDesign, arrChunks);
    
    // match the rest by location of the chunk
    arrChunks = locationDependentMatch(jsnDesign, arrChunks);
    
    // manually match for the object name if none were found
    if (jsnDesign.OBJECT_NAME.arrInstance.length === 0 && jsnDesign.OBJECT_TYPE.arrInstance.length === 0 && jsnDesign.TOFROM.arrInstance.length > 0) {
        for (i = 0, len = arrChunks.length; i < len; i += 1) {
            if (arrChunks[i].designMatch === 'TOFROM') {
                break;
            }
            
            if (!arrChunks[i].designMatch && arrChunks[i].chunkType === 2) {
                arrChunks[i].designMatch = 'OBJECT_NAME';
                jsnDesign.OBJECT_NAME.arrInstance.push(i);
            }
        }
    }
    
    //console.log(arrChunks);
    
    // creating property dialog function
    window.propertyWindowDialog = function () {
        var templateElement = document.createElement('template')
          , strGrantRevokeHTML, strTypeHTML, strObjectNameHTML, strPermissionHTML, strRoleNameHTML, strGrantOptionHTML
          , i, len, strHTML, strValue, arrArray, strType, arrPermissions, arrPermissionChecks, perm_i, perm_len;
        
        // select: grant/revoke
        for (i = 0, len = arrChunks.length, strValue = 'GRANT'; i < len; i += 1) {
            if (arrChunks[i].designMatch === 'GRANTREVOKE') {
                strValue = arrChunks[i].chunkText.toUpperCase();
                break;
            }
        }
        
        strGrantRevokeHTML = '<label for="property-grant-revoke">GRANT or REVOKE:</label>' +
                        '<gs-select id="property-grant-revoke" value="' + (strValue) + '">' +
                            '<option>GRANT</option>' +
                            '<option>REVOKE</option>' +
                        '</gs-select>';
        
        
        // select: type
        for (i = 0, len = arrChunks.length, strValue = ''; i < len; i += 1) {
            if (arrChunks[i].designMatch === 'OBJECT_TYPE') {
                strValue += (strValue ? ' ' : '') + arrChunks[i].chunkText.toUpperCase();
            }
        }
        strType = strValue;
        
        strTypeHTML =   '<label for="property-type">On Object Of Type:</label>' +
                        '<gs-select id="property-type" value="' + (strValue) + '">' +
                            '<option value="">ROLE</option>' +
                            '<option value="TABLE">TABLE / VIEW</option>' +
                            '<option>SEQUENCE</option>' +
                            '<option>DATABASE</option>' +
                            '<option>DOMAIN</option>' +
                            '<option>FOREIGN DATA WRAPPER</option>' +
                            '<option>FOREIGN SERVER</option>' +
                            '<option>FUNCTION</option>' +
                            '<option>ALL FUNCTIONS IN SCHEMA</option>' +
                            '<option>LANGUAGE</option>' +
                            '<option>LARGE OBJECT</option>' +
                            '<option>SCHEMA</option>' +
                            '<option>TABLESPACE</option>' +
                            '<option>TYPE</option>' +
                        '</gs-select>';
        
        // text: name
        for (i = 0, len = arrChunks.length, strValue = ''; i < len; i += 1) {
            if (arrChunks[i].designMatch === 'OBJECT_NAME') {
                strValue += arrChunks[i].chunkText;
                break;
            }
        }
        
        strObjectNameHTML = '<label for="property-object-name">Object Name:</label>' +
                            '<gs-text id="property-object-name" value="' + encodeHTML(strValue) + '"></gs-text>';
        
        // checkboxes: permissions
        if (strType === '') {
            arrPermissionChecks = [];
        } else if (strType === 'TABLE') {
            arrPermissionChecks = ['ALL', 'SELECT', 'INSERT', 'UPDATE', 'DELETE', 'TRUNCATE', 'REFERENCES', 'TRIGGER'];
        } else if (strType === 'SEQUENCE') {
            arrPermissionChecks = ['ALL', 'USAGE', 'SELECT', 'UPDATE'];
        } else if (strType === 'DATABASE') {
            arrPermissionChecks = ['ALL', 'CREATE', 'CONNECT', 'TEMPORARY', 'TEMP'];
        } else if (strType === 'DOMAIN') {
            arrPermissionChecks = ['ALL', 'USAGE'];
        } else if (strType === 'FOREIGN DATA WRAPPER') {
            arrPermissionChecks = ['ALL', 'USAGE'];
        } else if (strType === 'FOREIGN SERVER') {
            arrPermissionChecks = ['ALL', 'USAGE'];
        } else if (strType === 'FUNCTION') {
            arrPermissionChecks = ['ALL', 'EXECUTE'];
        } else if (strType === 'ALL FUNCTIONS IN SCHEMA') {
            arrPermissionChecks = ['ALL', 'EXECUTE'];
        } else if (strType === 'LANGUAGE') {
            arrPermissionChecks = ['ALL', 'USAGE'];
        } else if (strType === 'LARGE OBJECT') {
            arrPermissionChecks = ['ALL', 'SELECT', 'UPDATE'];
        } else if (strType === 'SCHEMA') {
            arrPermissionChecks = ['ALL', 'CREATE', 'USAGE'];
        } else if (strType === 'TABLESPACE') {
            arrPermissionChecks = ['ALL', 'CREATE'];
        } else if (strType === 'TYPE') {
            arrPermissionChecks = ['ALL', 'USAGE'];
        }
        
        arrPermissions = [
            'ALL', 'SELECT', 'INSERT', 'UPDATE', 'DELETE', 'TRUNCATE', 'REFERENCES', 'TRIGGER',
            'USAGE', 'CREATE', 'CONNECT', 'TEMPORARY', 'TEMP', 'EXECUTE'
        ];
        
        strPermissionHTML = '<label id="permissions-label" ' + (strType === '' ? 'hidden' : '') + '>Object Permissions:</label>';
        
        for (perm_i = 0, perm_len = arrPermissions.length; perm_i < perm_len; perm_i += 1) {
            strValue = 'false';
            
            if (arrPermissionChecks.indexOf(arrPermissions[perm_i]) > -1) {
                for (i = 0, len = arrChunks.length, strValue = ''; i < len; i += 1) {
                    if (arrChunks[i].designMatch === 'PERMISSION' &&
                        arrChunks[i].chunkText.toUpperCase().indexOf(arrPermissions[perm_i]) === 0) {
                        strValue = 'true';
                        break;
                    }
                }
            }
            
            strPermissionHTML += '<div flex-horizontal class="checkbox-permission" ' +
                                                       'data-permission="' + arrPermissions[perm_i] + '" ' +
                                                      (arrPermissionChecks.indexOf(arrPermissions[perm_i]) === -1 ? 'hidden' : '') +
                                                      '>' +
                                    '<label style="width: 8em; text-align: right;">' + arrPermissions[perm_i] + ':</label>' +
                                    '<gs-checkbox flex value="' + strValue + '"></gs-checkbox>' +
                                 '</div>';
        }
        
        // text: role
        for (i = 0, len = arrChunks.length, strValue = ''; i < len; i += 1) {
            if (arrChunks[i].designMatch === 'ROLE_NAME') {
                strValue += arrChunks[i].chunkText;
                break;
            }
        }
        
        strRoleNameHTML = '<label for="property-role-name">Role To GRANT/REVOKE TO/FROM:</label>' +
                          '<gs-text id="property-role-name" value="' + encodeHTML(strValue) + '"></gs-text>';
        
        
        // checkbox: WITH GRANT OPTION / WITH ADMIN OPTION
        strValue = 'false';
        if (jsnDesign.WITH.arrInstance.length > 0 &&
            jsnDesign.OPTION.arrInstance.length > 0 &&
            (
                (
                    jsnDesign.GRANTREVOKE.arrInstance.length > 1 &&
                    jsnDesign.GRANTREVOKE.arrInstance[1] > jsnDesign.WITH.arrInstance[0] &&
                    jsnDesign.GRANTREVOKE.arrInstance[1] < jsnDesign.OPTION.arrInstance[0]
                ) ||
                jsnDesign.ADMIN.arrInstance.length > 0
            )) {
            strValue = 'true';
        }
        
        strGrantOptionHTML =    '<label id="grant-option-label" for="property-with-grant">' +
                                    (strType === '' ? 'With Admin Option' : 'With Grant Option') +
                                ':</label>' +
                                '<gs-checkbox id="property-with-grant" value="' + encodeHTML(strValue) + '"></gs-checkbox>';
        
        // build final HTML
        strHTML =   strGrantRevokeHTML +
                    '<gs-grid gutter min-width="0px {reflow}; 527px {1,1};" reflow-at="535">' +
                        '<gs-block>' + strTypeHTML + '</gs-block>' +
                        '<gs-block>' + strObjectNameHTML + '</gs-block>' +
                    '</gs-grid>' +
                    strPermissionHTML +
                    '<gs-grid gutter reflow-at="527" widths="2,1">' +
                        '<gs-block>' + strRoleNameHTML + '</gs-block>' +
                        '<gs-block>' + strGrantOptionHTML + '</gs-block>' +
                    '</gs-grid>';
        
        // create dialog
        openPropertyDialog('GRANT / REVOKE', [
                                               {'link': 'sql-grant.html', 'name': 'GRANT'},
                                               {'link': 'sql-revoke.html', 'name': 'REVOKE'}
                                             ],
                                             [
                                               {'link': 'role-membership.html', 'name': 'Role Membership'},
                                               {'link': 'ddl-priv.html', 'name': 'Privileges'}
                                             ], strHTML, function (dialog) {
            document.getElementById('property-type').addEventListener('change', function () {
                var strType = this.value, arrElements = xtag.query(dialog, '.checkbox-permission'), i, len, arrPermissionChecks;
                
                if (strType === '') {
                    arrPermissionChecks = [];
                } else if (strType === 'TABLE') {
                    arrPermissionChecks = ['ALL', 'SELECT', 'INSERT', 'UPDATE', 'DELETE', 'TRUNCATE', 'REFERENCES', 'TRIGGER'];
                } else if (strType === 'SEQUENCE') {
                    arrPermissionChecks = ['ALL', 'USAGE', 'SELECT', 'UPDATE'];
                } else if (strType === 'DATABASE') {
                    arrPermissionChecks = ['ALL', 'CREATE', 'CONNECT', 'TEMPORARY', 'TEMP'];
                } else if (strType === 'DOMAIN') {
                    arrPermissionChecks = ['ALL', 'USAGE'];
                } else if (strType === 'FOREIGN DATA WRAPPER') {
                    arrPermissionChecks = ['ALL', 'USAGE'];
                } else if (strType === 'FOREIGN SERVER') {
                    arrPermissionChecks = ['ALL', 'USAGE'];
                } else if (strType === 'FUNCTION') {
                    arrPermissionChecks = ['ALL', 'EXECUTE'];
                } else if (strType === 'ALL FUNCTIONS IN SCHEMA') {
                    arrPermissionChecks = ['ALL', 'EXECUTE'];
                } else if (strType === 'LANGUAGE') {
                    arrPermissionChecks = ['ALL', 'USAGE'];
                } else if (strType === 'LARGE OBJECT') {
                    arrPermissionChecks = ['ALL', 'SELECT', 'UPDATE'];
                } else if (strType === 'SCHEMA') {
                    arrPermissionChecks = ['ALL', 'CREATE', 'USAGE'];
                } else if (strType === 'TABLESPACE') {
                    arrPermissionChecks = ['ALL', 'CREATE'];
                } else if (strType === 'TYPE') {
                    arrPermissionChecks = ['ALL', 'USAGE'];
                }
                
                if (strType === '') {
                    document.getElementById('permissions-label').setAttribute('hidden', '');
                    document.getElementById('grant-option-label').textContent = 'With Admin Option';
                } else {
                    document.getElementById('permissions-label').removeAttribute('hidden');
                    document.getElementById('grant-option-label').textContent = 'With Grant Option';
                }
                
                for (i = 0, len = arrElements.length; i < len; i += 1) {
                    if (arrPermissionChecks.indexOf(arrElements[i].getAttribute('data-permission')) === -1) {
                        arrElements[i].setAttribute('hidden', '');
                    } else {
                        arrElements[i].removeAttribute('hidden');
                    }
                }
            });
            
        }, function (dialog) {
            var ctlGrantRevoke, ctlType, ctlObjectName, ctlRoleName, ctlWithGrantAdmin
              , i, len, strEditingScript, strText, strTemp, bolTemp, intTemp, arrPermissions, arrElements;
            
            //strEditingScript = strScript.substring(intSearchStart, intSearchEnd);
            //console.log(strEditingScript);
            
            ctlGrantRevoke = document.getElementById('property-grant-revoke');
            ctlType = document.getElementById('property-type');
            ctlObjectName = document.getElementById('property-object-name');
            ctlRoleName = document.getElementById('property-role-name');
            ctlWithGrantAdmin = document.getElementById('property-with-grant');
            
            // OPTION
            // GRANTREVOKE / ADMIN
            // WITH
            //console.log(ctlWithGrantAdmin.value, ctlWithGrantAdmin.getAttribute('data-old-value'));
            if (ctlWithGrantAdmin.value !== ctlWithGrantAdmin.getAttribute('data-old-value')) {
                // clear from first WITH forward
                for (i = 0, len = arrChunks.length, bolTemp = false, intTemp = 0; i < len; i += 1) {
                    if (arrChunks[i].designMatch === 'WITH') {
                        intTemp = i;
                        bolTemp = true;
                    }
                    
                    if (bolTemp === true) {
                        // if whitespace/comment chunk: trim
                        if (arrChunks[i].chunkType === 0) {
                            arrChunks[i].chunkText = arrChunks[i].chunkText.trim();
                            
                        // else (parenthesis chunk or text chunk): empty
                        } else {
                            arrChunks[i].chunkText = '';
                        }
                    }
                }
                
                //console.log(ctlWithGrantAdmin.value);
                if (ctlWithGrantAdmin.value === 'true') {
                    strTemp = (ctlType.value === '' ? 'WITH ADMIN OPTION' : 'WITH GRANT OPTION');
                    //console.log(strTemp);
                    
                    if (intTemp) {
                        arrChunks[intTemp].chunkText = strTemp;
                    } else {
                        arrChunks.push({'chunkText': ' ' + strTemp, 'designMatch': 'WITH'});
                    }
                } else {
                    arrChunks[intTemp - 1].chunkText = arrChunks[intTemp - 1].chunkText.trim();
                }
            }
            
            // ROLE_NAME
            if (ctlRoleName.value !== ctlRoleName.getAttribute('data-old-value')) {
                strTemp = '';
                if (jsnDesign.TOFROM.arrInstance.length === 0) {
                    if (ctlGrantRevoke.value === 'GRANT') {
                        strTemp = 'TO ';
                    } else {
                        strTemp = 'FROM ';
                    }
                }
                
                // if no target name exists: insert
                if (!jsnDesign.ROLE_NAME.arrInstance || jsnDesign.ROLE_NAME.arrInstance.length === 0) {
                    //console.log('1***');
                    insertChunk(arrChunks, {'chunkText': ' ' + strTemp + ctlRoleName.value, 'designMatch': 'ROLE_NAME'}, '', ['WITH', 'ADMIN', 'OPTION']);
                    //console.log('2***', arrChunks.slice(0));
                    
                // else: overwrite targetname
                } else {
                    updateChunk(arrChunks, 'ROLE_NAME', ctlRoleName.value, ['WITH', 'ADMIN', 'OPTION']);
                }
            }
            
            
            // OBJECT_NAME
            if (ctlObjectName.value !== ctlObjectName.getAttribute('data-old-value')) {
                // if no target name exists: insert
                if (!jsnDesign.OBJECT_NAME.arrInstance || jsnDesign.OBJECT_NAME.arrInstance.length === 0) {
                    insertChunk(arrChunks, {'chunkText': ' ' + ctlObjectName.value, 'designMatch': 'OBJECT_NAME'}, '', ['TOFROM', 'ROLE_NAME', 'WITH', 'ADMIN', 'OPTION']);
                    
                // else: overwrite targetname
                } else {
                    updateChunk(arrChunks, 'OBJECT_NAME', ctlObjectName.value, ['TOFROM', 'ROLE_NAME', 'WITH', 'ADMIN', 'OPTION']);
                }
            }
            
            // OBJECT_TYPE
            if (ctlType.value !== ctlType.getAttribute('data-old-value')) {
                strTemp = '';
                if (jsnDesign.ON.arrInstance.length === 0) { strTemp = 'ON '; }
                
                if (ctlType.value === '') {
                    removeChunk(arrChunks, ['OBJECT_TYPE', 'ON'], ['OBJECT_NAME', 'TOFROM', 'ROLE_NAME', 'WITH', 'ADMIN', 'OPTION']);
                    
                } else {
                    // if no target name exists: insert
                    if (!jsnDesign.OBJECT_TYPE.arrInstance || jsnDesign.OBJECT_TYPE.arrInstance.length === 0) {
                        insertChunk(arrChunks, {'chunkText': ' ' + strTemp + ctlType.value, 'designMatch': 'OBJECT_TYPE'}, '', ['OBJECT_NAME', 'TOFROM', 'ROLE_NAME', 'WITH', 'ADMIN', 'OPTION']);
                        
                    // else: overwrite targetname
                    } else {
                        updateChunk(arrChunks, 'OBJECT_TYPE', strTemp + ctlType.value, ['OBJECT_NAME', 'TOFROM', 'ROLE_NAME', 'WITH', 'ADMIN', 'OPTION']);
                    }
                }
            }
            
            // PERMISSION
            arrElements = xtag.query(dialog, '.checkbox-permission');
            strTemp = '';
            bolTemp = false;
            
            for (i = 0, len = arrElements.length; i < len; i += 1) {
                if (!arrElements[i].hasAttribute('hidden') && arrElements[i].children[1].value === 'true') {
                    strTemp += (strTemp ? ', ' : '') + arrElements[i].getAttribute('data-permission');
                }
                if (!arrElements[i].hasAttribute('hidden') && 
                    arrElements[i].children[1].value !== arrElements[i].children[1].getAttribute('data-old-value')) {
                    bolTemp = true;
                }
            }
            
            if (bolTemp === true || ctlType.value !== ctlType.getAttribute('data-old-value')) {
                //console.log('PERMISSIONS', strTemp);
                if (!jsnDesign.PERMISSION.arrInstance || jsnDesign.PERMISSION.arrInstance.length === 0) {
                    insertChunk(arrChunks, ' ' + strTemp, '', ['ON', 'OBJECT_TYPE', 'OBJECT_NAME', 'TOFROM', 'ROLE_NAME', 'WITH', 'ADMIN', 'OPTION']);
                    
                } else {
                    removeChunk(arrChunks, ['PERMISSION'], ['ON', 'OBJECT_TYPE', 'OBJECT_NAME', 'TOFROM', 'ROLE_NAME', 'WITH', 'ADMIN', 'OPTION']);
                    updateChunk(arrChunks, 'PERMISSION', ' ' + strTemp, []);
                }
            }
            
            // GRANTREVOKE
            if (ctlGrantRevoke.value !== ctlGrantRevoke.getAttribute('data-old-value')) {
                //console.log(arrChunks.slice(0));
                updateChunk(arrChunks, 'GRANTREVOKE', ctlGrantRevoke.value, []);
                updateChunk(arrChunks, 'TOFROM', (ctlGrantRevoke.value === 'GRANT' ? 'TO' : 'FROM'), []);
                //console.log(arrChunks.slice(0));
            }
            
            // assemble script
            for (i = 0, len = arrChunks.length, strEditingScript = ''; i < len; i += 1) {
                strEditingScript += arrChunks[i].chunkText;
            }
            
            //console.log(strEditingScript);
            propertyWindowReplaceQuery(tabElement, textRange, strEditingScript);
        });
        
    };
    /*
        { GRANT | REVOKE ]
            [
                ALL |                                                                     // ALL
                { SELECT | INSERT | UPDATE | DELETE | TRUNCATE | REFERENCES | TRIGGER } | // TABLE / VIEW
                { USAGE | SELECT | UPDATE } |                                             // SEQUENCE
                { CREATE | CONNECT | TEMPORARY | TEMP } |                                 // DATABASE
                { USAGE } |                                                               // DOMAIN
                { USAGE } |                                                               // FOREIGN DATA WRAPPER
                { USAGE } |                                                               // FOREIGN SERVER
                { EXECUTE ] } |                                                           // FUNCTION / ALL FUNCTIONS IN SCHEMA
                { USAGE } |                                                               // LANGUAGE
                { SELECT | UPDATE } |                                                     // LARGE OBJECT
                { CREATE | USAGE } |                                                      // SCHEMA
                { CREATE } |                                                              // TABLESPACE
                { USAGE }                                                                 // TYPE
            ]
                    // NONE is ROLE -> ROLE
            [
                ON TABLE |
                ON SEQUENCE |
                ON DATABASE |
                ON DOMAIN |
                ON FOREIGN DATA WRAPPER |
                ON FOREIGN SERVER |
                ON FUNCTION |
                ON ALL FUNCTIONS IN SCHEMA |
                ON LANGUAGE |
                ON LARGE OBJECT |
                ON SCHEMA |
                ON TABLESPACE |
                ON TYPE
            ]
                    // NONE is ROLE -> ROLE
            object_name
            {
                TO |     // when GRANT
                FROM     // when REVOKE
            }
            { role_name | PUBLIC }
            [ WITH GRANT OPTION ];
    */
}

function propertyListALTERVIEW_ALTERCOLUMN(tabElement, strScript, textRange, arrChunks) {
    'use strict';
    var jsnDesign = {
            'ALTER': {
                'regex': /^(ALTER)$/gi,
                'arrInstance': []
            },
            'VIEW': {
                'regex': /^(VIEW)$/gi,
                'arrInstance': []
            },
            'IF': {
                'regex': /^(IF)$/gi,
                'arrInstance': []
            },
            'EXISTS': {
                'regex': /^(EXISTS)$/gi,
                'arrInstance': []
            },
            'OBJECTNAME': {
                'type': [1,2],
                'afterlast': ['VIEW', 'IF', 'EXISTS'],
                'beforelast': ['ALTER'],
                'arrInstance': []
            },
            
            // ALTER
            
            'COLUMN': {
                'regex': /^(COLUMN)$/gi,
                'arrInstance': []
            },
            'COLUMNNAME': {
                'type': 2,
                'afterfirst': ['COLUMN'],
                'beforefirst': ['SETDROP', 'DEFAULT', 'DEFAULTEXPRESSION'],
                'arrInstance': []
            },
            
            'SETDROP': {
                'regex': /^(SET|DROP)$/gi,
                'arrInstance': []
            },
            
            'DEFAULT': {
                'regex': /^(DEFAULT)$/gi,
                'arrInstance': []
            },
            
            'DEFAULTEXPRESSION': {
                'type': [0,1,2],
                'afterfirst': ['SETDROP', 'DEFAULT'],
                'arrInstance': []
            }
        }, i, len, strValue;
    
    // match what we can using regex
    arrChunks = regexMatch(jsnDesign, arrChunks);
    
    // match the rest by location of the chunk
    arrChunks = locationDependentMatch(jsnDesign, arrChunks);
    
    //console.log(arrChunks);
    
    
    // creating property dialog function
    window.propertyWindowDialog = function () {
        var templateElement = document.createElement('template')
          , strIfExistsHTML, strViewNameHTML, strColNameHTML, strSetDropHTML, strDefaultHTML
          , i, len, strHTML, strValue, strChoiceValue, strDropValue, strExpression;
        
        // checkbox: if exists
        strValue = (jsnDesign.EXISTS.arrInstance.length > 0 ? 'true' : 'false');
        
        strIfExistsHTML =   '<label for="property-if-exists">IF EXISTS:</label>' +
                            '<gs-checkbox id="property-if-exists" value="' + (strValue) + '"></gs-checkbox>';
        
        // text: object name
        strValue = '';
        if (jsnDesign.OBJECTNAME.arrInstance.length > 0) {
            arrTemp = jsnDesign.OBJECTNAME.arrInstance;
            for (i = arrTemp[0], len = arrTemp[arrTemp.length - 1] + 1; i < len; i += 1) {
                strValue += arrChunks[i].chunkText || '';
            }
        }
        
        strViewNameHTML = '<label for="property-view-name">VIEW Name:</label>' +
                          '<gs-text id="property-view-name" value="' + (strValue) + '"></gs-text>';
        
        // text: column_name
        strValue = '';
        if (jsnDesign.COLUMNNAME.arrInstance.length > 0) {
            strValue = arrChunks[jsnDesign.COLUMNNAME.arrInstance[0]].chunkText || '';
        }
        
        strColNameHTML = '<label for="property-column-name">Column Name:</label>' +
                         '<gs-text id="property-column-name" value="' + (strValue) + '"></gs-text>';
        
        // select: SET DEFAUlT or DROP DEFAUlT
        strDropValue = 'SET';
        if (jsnDesign.SETDROP.arrInstance.length > 0) {
            strDropValue = arrChunks[jsnDesign.SETDROP.arrInstance[0]].chunkText || '';
        }
        
        strSetDropHTML = '<label for="property-set-drop">DROP/SET DEFAULT:</label>' +
                         '<gs-select id="property-set-drop" value="' + (strDropValue) + '">' +
                             '<option value="SET">SET DEFAULT</option>' +
                             '<option value="DROP">DROP DEFAULT</option>' +
                         '</gs-select>';
        
        // text: if SET DEFAUlT -> new default expression
        strExpression = '';
        if (strDropValue === 'SET') {
            for (i = (jsnDesign.DEFAULTEXPRESSION.arrInstance[0] || arrChunks.length), len = arrChunks.length; i < len; i += 1) {
                strExpression += arrChunks[i].chunkText;
            }
        }
        
        strDefaultHTML = '<label for="property-default-expression">Default Expression:</label>' +
                         '<gs-text id="property-default-expression" value="' + (strExpression) + '" ' + (strDropValue === 'DROP' ? 'disabled' : '') + '></gs-text>';
        
        // build final html
        strHTML = '<gs-grid gutter min-width="0px {reflow}; 527px {1,1};" reflow-at="535">' +
                      '<gs-block>' + strIfExistsHTML + '</gs-block>' +
                      '<gs-block>' + strViewNameHTML + '</gs-block>' +
                  '</gs-grid>' +
                  '<gs-grid gutter min-width="0px {reflow}; 527px {1,1,1};" reflow-at="535">' +
                      '<gs-block>' + strColNameHTML + '</gs-block>' +
                      '<gs-block>' + strSetDropHTML + '</gs-block>' +
                      '<gs-block>' + strDefaultHTML + '</gs-block>' +
                  '</gs-grid>';
        
        // create dialog
        openPropertyDialog('ALTER VIEW ... ALTER COLUMN', [
                                           {'link': 'sql-alterview.html', 'name': 'ALTER VIEW'},
                                           {'link': 'sql-createview.html', 'name': 'CREATE VIEW'},
                                           {'link': 'sql-dropview.html', 'name': 'DROP VIEW'}
                                         ], [],
                                         strHTML, function () {
            
            document.getElementById('property-set-drop').addEventListener('change', function () {
                if (this.value === 'SET') {
                    document.getElementById('property-default-expression').removeAttribute('disabled');
                } else {
                    document.getElementById('property-default-expression').setAttribute('disabled', '');
                }
            });
            
        }, function (dialog) {
            var ctlIfExists, ctlViewName, ctlColumnName, ctlSetDrop, ctlDefault
              , i, len, strEditingScript, strTemp;
            
            ctlIfExists = document.getElementById('property-if-exists');
            ctlViewName = document.getElementById('property-view-name');
            ctlColumnName = document.getElementById('property-column-name');
            ctlSetDrop = document.getElementById('property-set-drop');
            ctlDefault = document.getElementById('property-default-expression');
            
            // IF EXISTS
            if (ctlIfExists.value !== ctlIfExists.getAttribute('data-old-value')) {
                if (ctlIfExists.value === 'true') {
                    insertChunk(arrChunks, {'chunkText': 'IF EXISTS '}, '', ['VIEWNAME', 'COLUMN', 'COLUMNNAME', 'SETDROP', 'DEFAULT', 'DEFAULTEXPRESSION']);
                    
                } else {
                    removeChunk(arrChunks, ['IF', 'EXISTS'], ['VIEWNAME', 'COLUMN', 'COLUMNNAME', 'SETDROP', 'DEFAULT', 'DEFAULTEXPRESSION']);
                }
            }
            
            // VIEW NAME
            if (ctlViewName.value !== ctlViewName.getAttribute('data-old-value')) {
                // if no view name exists: insert
                if (!jsnDesign.OBJECTNAME.arrInstance || jsnDesign.OBJECTNAME.arrInstance.length === 0) {
                    insertChunk(arrChunks, {'chunkText': ' ' + ctlViewName.value}, ['VIEW', 'IF', 'EXISTS']);
                    
                // else: overwrite view name
                } else {
                    removeChunk(arrChunks, ['OBJECTNAME'], ['COLUMN', 'COLUMNNAME', 'SETDROP', 'DEFAULT', 'DEFAULTEXPRESSION']);
                    updateChunk(arrChunks, 'OBJECTNAME', ' ' + ctlViewName.value, ['COLUMN', 'COLUMNNAME', 'SETDROP', 'DEFAULT', 'DEFAULTEXPRESSION']);
                }
            }
            
            // COLUMN NAME
            if (ctlColumnName.value !== ctlColumnName.getAttribute('data-old-value')) {
                if (!jsnDesign.COLUMNNAME.arrInstance || jsnDesign.COLUMNNAME.arrInstance.length === 0) {
                    if ((!jsnDesign.SETDROP.arrInstance || jsnDesign.SETDROP.arrInstance.length === 0) &&
                        (!jsnDesign.DEFAULT.arrInstance || jsnDesign.DEFAULT.arrInstance.length === 0) &&
                        (!jsnDesign.DEFAULTEXPRESSION.arrInstance || jsnDesign.DEFAULTEXPRESSION.arrInstance.length === 0)) {
                        insertChunk(arrChunks, {'chunkText': ' ' + ctlColumnName.value, 'designMatch': 'COLUMNNAME'});
                        
                    } else {
                        insertChunk(arrChunks, {'chunkText': ctlColumnName.value + ' ', 'designMatch': 'COLUMNNAME'}, '', ['SETDROP', 'DEFAULT', 'DEFAULTEXPRESSION']);
                    }
                } else {
                    updateChunk(arrChunks, 'COLUMNNAME', ctlColumnName.value, ['SETDROP', 'DEFAULT', 'DEFAULTEXPRESSION']);
                }
            }
            
            // SET DROP
            if (ctlSetDrop.value !== ctlSetDrop.getAttribute('data-old-value') || !jsnDesign.SETDROP.arrInstance || jsnDesign.SETDROP.arrInstance.length === 0) {
                strTemp = '';
                if (jsnDesign.DEFAULT.arrInstance.length === 0) { strTemp = ' DEFAULT'; }
                
                if (!jsnDesign.SETDROP.arrInstance || jsnDesign.SETDROP.arrInstance.length === 0) {
                    insertChunk(arrChunks, {'chunkText': ' ' + ctlSetDrop.value + strTemp}, ['COLUMNNAME']);
                    
                } else {
                    updateChunk(arrChunks, 'SETDROP', ctlSetDrop.value, ['DEFAULT', 'DEFAULTEXPRESSION']);
                }
                
                // if SETDROP === 'DROP': clear default value
                if (ctlSetDrop.value === 'DROP') {
                    ctlDefault.value = '';
                }
            }
            
            // DEFAULT EXPRESSION
            if (ctlDefault.value !== ctlDefault.getAttribute('data-old-value')) {
                if (!jsnDesign.DEFAULTEXPRESSION.arrInstance || jsnDesign.DEFAULTEXPRESSION.arrInstance.length === 0) {
                    insertChunk(arrChunks, {'chunkText': ' ' + ctlDefault.value});
                } else {
                    removeChunk(arrChunks, ['DEFAULTEXPRESSION'], []);
                    updateChunk(arrChunks, 'DEFAULTEXPRESSION', ' ' + ctlDefault.value, []);
                }
            }
            
            
            // assemble script
            for (i = 0, len = arrChunks.length, strEditingScript = ''; i < len; i += 1) {
                strEditingScript += arrChunks[i].chunkText;
            }
            
            //console.log(strEditingScript);
            propertyWindowReplaceQuery(tabElement, textRange, strEditingScript);
        });
    };
    
    /*
        ALTER VIEW
            [ IF EXISTS ]
            name
                ALTER [ COLUMN ]
                    column_name SET DEFAULT expression
                    column_name DROP DEFAULT
    */
}


function propertyListALTER_ALTEROWNER(tabElement, strScript, textRange, arrChunks) {
    'use strict';
    var jsnDesign = {
            'ALTER': {
                'regex': /^(ALTER)$/gi,
                'arrInstance': []
            },
            'TYPE': {
                'regex': /^(VIEW|AGGREGATE|COLLATION|CONVERSION|(LARGE|OBJECT)|OPERATOR|SCHEMA)|(TEXT|SEARCH|DICTIONARY)$/gi,
                'arrInstance': []
            },
            'IF': {
                'regex': /^(IF)$/gi,
                'arrInstance': []
            },
            'EXISTS': {
                'regex': /^(EXISTS)$/gi,
                'arrInstance': []
            },
            'OBJECTNAME': {
                'type': [1, 2],
                'afterlast': ['TYPE', 'IF', 'EXISTS'],
                'beforefirst': ['OWNER'],
                'arrInstance': []
            },
            'OWNER': {
                'regex': /^(OWNER)$/gi,
                'arrInstance': []
            },
            'TO': {
                'regex': /^(TO)$/gi,
                'arrInstance': []
            },
            'OWNERNAME': {
                'type': 2,
                'afterlast': ['OWNER', 'TO'],
                'arrInstance': []
            }
        }, i, len, strValue;
    
    // match what we can using regex
    arrChunks = regexMatch(jsnDesign, arrChunks);
    
    // match the rest by location of the chunk
    arrChunks = locationDependentMatch(jsnDesign, arrChunks);
    
    //console.log(arrChunks);
    
    
    // creating property dialog function
    window.propertyWindowDialog = function () {
        var strIfExistsHTML, strViewNameHTML, strOwnerNameHTML, i, len, strHTML, strValue, strType, arrTemp, strDoc;
        
        // get object type of query
        arrTemp = jsnDesign.TYPE.arrInstance;
        for (i = 0, len = arrTemp.length, strType = ''; i < len; i += 1) {
            strType += (strType ? ' ' : '') + arrChunks[arrTemp[i]].chunkText || '';
        }
        
        if (strType === 'TEXT SEARCH DICTIONARY') {
            strDoc = 'tsdictionary';
        } else {
            strDoc = strType.toLowerCase();
        }
        
        // checkbox: if exists
        strValue = (jsnDesign.EXISTS.arrInstance.length > 0 ? 'true' : 'false');
        
        strIfExistsHTML =   '<label for="property-if-exists" ' + (strType === 'VIEW' || strType === 'INDEX' || strType === 'TABLE' ? '' : 'hidden') + '>IF EXISTS:</label>' +
                            '<gs-checkbox id="property-if-exists" ' + (strType === 'VIEW' || strType === 'INDEX' || strType === 'TABLE' ? '' : 'hidden') + ' value="' + (strValue) + '"></gs-checkbox>';
        
        // text: object name
        strValue = '';
        if (jsnDesign.OBJECTNAME.arrInstance.length > 0) {
            arrTemp = jsnDesign.OBJECTNAME.arrInstance;
            for (i = arrTemp[0], len = arrTemp[arrTemp.length - 1] + 1; i < len; i += 1) {
                strValue += arrChunks[i].chunkText || '';
            }
        }
        
        strViewNameHTML = '<label for="property-object-name">' + strType + ' Name:</label>' +
                          '<gs-text id="property-object-name" value="' + (strValue) + '"></gs-text>';
        
        // text: column_name
        strValue = '';
        if (jsnDesign.OWNERNAME.arrInstance.length > 0) {
            strValue = arrChunks[jsnDesign.OWNERNAME.arrInstance[0]].chunkText || '';
        }
        
        strOwnerNameHTML = '<label for="property-owner-name">Owner Name:</label>' +
                           '<gs-text id="property-owner-name" value="' + (strValue) + '"></gs-text>';
        
        // build final html
        strHTML = strIfExistsHTML +
                  strViewNameHTML +
                  strOwnerNameHTML;
        
        // create dialog
        openPropertyDialog('ALTER ' + strType + ' ... OWNER', [
                                           {'link': 'sql-alter' + strDoc + '.html', 'name': 'ALTER ' + strType},
                                           {'link': 'sql-create' + strDoc + '.html', 'name': 'CREATE ' + strType},
                                           {'link': 'sql-drop' + strDoc + '.html', 'name': 'DROP ' + strType}
                                         ], [],
                                         strHTML, '', function (dialog) {
            var ctlIfExists, ctlViewName, ctlOwnerName
              , i, len, strEditingScript, strTemp;
            
            ctlIfExists  = document.getElementById('property-if-exists');
            ctlViewName  = document.getElementById('property-object-name');
            ctlOwnerName = document.getElementById('property-owner-name');
            
            // IF EXISTS
            if (ctlIfExists.value !== ctlIfExists.getAttribute('data-old-value')) {
                if (ctlIfExists.value === 'true') {
                    insertChunk(arrChunks, {'chunkText': 'IF EXISTS '}, '', ['OBJECTNAME', 'OWNER', 'TO', 'OWNERNAME']);
                    
                } else {
                    removeChunk(arrChunks, ['IF', 'EXISTS'], ['OBJECTNAME', 'OWNER', 'TO', 'OWNERNAME']);
                }
            }
            
            // OBJECTNAME
            if (ctlViewName.value !== ctlViewName.getAttribute('data-old-value')) {
                // if no object name exists: insert
                if (!jsnDesign.OBJECTNAME.arrInstance || jsnDesign.OBJECTNAME.arrInstance.length === 0) {
                    insertChunk(arrChunks, {'chunkText': ' ' + ctlViewName.value}, ['TYPE', 'IF', 'EXISTS']);
                    
                // else: overwrite object name
                } else {
                    removeChunk(arrChunks, ['OBJECTNAME'], ['OWNER', 'TO', 'OWNERNAME']);
                    updateChunk(arrChunks, 'OBJECTNAME', ' ' + ctlViewName.value, ['OWNER', 'TO', 'OWNERNAME']);
                }
            }
            
            // OWNER NAME
            if (ctlOwnerName.value !== ctlOwnerName.getAttribute('data-old-value')) {
                strTemp = '';
                if (jsnDesign.TO.arrInstance.length === 0) { strTemp = ' TO'; }
                
                if (!jsnDesign.OWNERNAME.arrInstance || jsnDesign.OWNERNAME.arrInstance.length === 0) {
                    insertChunk(arrChunks, {'chunkText': strTemp + ' ' + ctlOwnerName.value});
                } else {
                    updateChunk(arrChunks, 'OWNERNAME', strTemp + ctlOwnerName.value, []);
                }
            }
            
            // assemble script
            for (i = 0, len = arrChunks.length, strEditingScript = ''; i < len; i += 1) {
                strEditingScript += arrChunks[i].chunkText;
            }
            
            //console.log(strEditingScript);
            propertyWindowReplaceQuery(tabElement, textRange, strEditingScript);
        });
    };
    
    // ALTER VIEW [ IF EXISTS ] name OWNER TO new_owner
}


function propertyListALTER_RENAME(tabElement, strScript, textRange, arrChunks) {
    'use strict';
    var jsnDesign = {
            'ALTER': {
                'regex': /^(ALTER)$/gi,
                'arrInstance': []
            },
            'TYPE': {
                'regex': /^(VIEW|AGGREGATE|COLLATION|CONVERSION|SCHEMA|(TEXT|SEARCH|PARSER)|(TEXT|SEARCH|TEMPLATE)|(TEXT|SEARCH|DICTIONARY))$/gi,
                'arrInstance': []
            },
            'IF': {
                'regex': /^(IF)$/gi,
                'arrInstance': []
            },
            'EXISTS': {
                'regex': /^(EXISTS)$/gi,
                'arrInstance': []
            },
            'OLDNAME': {
                'type': [1,2],
                'afterlast': ['TYPE', 'IF', 'EXISTS'],
                'beforefirst': ['RENAME'],
                'arrInstance': []
            },
            'RENAME': {
                'regex': /^(RENAME)$/gi,
                'arrInstance': []
            },
            'TO': {
                'regex': /^(TO)$/gi,
                'arrInstance': []
            },
            'NEWNAME': {
                'type': 2,
                'afterlast': ['RENAME', 'TO'],
                'arrInstance': []
            }
        }, i, len, strValue;
    
    // match what we can using regex
    arrChunks = regexMatch(jsnDesign, arrChunks);
    
    // match the rest by location of the chunk
    arrChunks = locationDependentMatch(jsnDesign, arrChunks);
    
    //console.log(arrChunks);
    
    
    // creating property dialog function
    window.propertyWindowDialog = function () {
        var strIfExistsHTML, strViewNameHTML, strNewNameHTML, i, len, strHTML, strValue, strType, arrTemp, strDoc;
        
        // get object type of query
        arrTemp = jsnDesign.TYPE.arrInstance;
        for (i = 0, len = arrTemp.length, strType = ''; i < len; i += 1) {
            strType += (strType ? ' ' : '') + arrChunks[arrTemp[i]].chunkText || '';
        }
        
        if (strType === 'TEXT SEARCH PARSER') {
            strDoc = 'tsparser';
        } else if (strType === 'TEXT SEARCH TEMPLATE') {
            strDoc = 'tstemplate';
        } else if (strType === 'TEXT SEARCH DICTIONARY') {
            strDoc = 'tsdictionary';
        } else {
            strDoc = strType.toLowerCase();
        }
        
        // checkbox: if exists
        strValue = (jsnDesign.EXISTS.arrInstance.length > 0 ? 'true' : 'false');
        
        strIfExistsHTML =   '<label for="property-if-exists" ' + (strType === 'VIEW' || strType === 'INDEX' || strType === 'TABLE' ? '' : 'hidden') + '>IF EXISTS:</label>' +
                            '<gs-checkbox id="property-if-exists" ' + (strType === 'VIEW' || strType === 'INDEX' || strType === 'TABLE' ? '' : 'hidden') + 
                                ' value="' + (strValue) + '"></gs-checkbox>';
        
        // text: object name
        strValue = '';
        if (jsnDesign.OLDNAME.arrInstance.length > 0) {
            arrTemp = jsnDesign.OLDNAME.arrInstance;
            for (i = arrTemp[0], len = arrTemp[arrTemp.length - 1] + 1; i < len; i += 1) {
                strValue += arrChunks[i].chunkText || '';
            }
        }
        
        strViewNameHTML = '<label for="property-object-name">' + strType + ' Name:</label>' +
                          '<gs-text id="property-object-name" value="' + (strValue) + '"></gs-text>';
        
        // text: column_name
        strValue = '';
        if (jsnDesign.NEWNAME.arrInstance.length > 0) {
            strValue = arrChunks[jsnDesign.NEWNAME.arrInstance[0]].chunkText || '';
        }
        
        strNewNameHTML = '<label for="property-new-name">New Name:</label>' +
                           '<gs-text id="property-new-name" value="' + (strValue) + '"></gs-text>';
        
        // build final html
        strHTML = strIfExistsHTML +
                  strViewNameHTML +
                  strNewNameHTML;
        
        // create dialog
        openPropertyDialog('ALTER ' + strType + ' ... RENAME', [
                                           {'link': 'sql-alter' + strDoc + '.html', 'name': 'ALTER ' + strType},
                                           {'link': 'sql-create' + strDoc + '.html', 'name': 'CREATE ' + strType},
                                           {'link': 'sql-drop' + strDoc + '.html', 'name': 'DROP ' + strType}
                                         ], [],
                                         strHTML, '', function (dialog) {
            var ctlIfExists, ctlViewName, ctlNewName
              , i, len, strEditingScript, strTemp;
            
            ctlIfExists  = document.getElementById('property-if-exists');
            ctlViewName  = document.getElementById('property-object-name');
            ctlNewName = document.getElementById('property-new-name');
            
            // NEWNAME
            if (ctlNewName.value !== ctlNewName.getAttribute('data-old-value')) {
                strTemp = '';
                if (jsnDesign.TO.arrInstance.length === 0) { strTemp = ' TO'; }
                
                if (!jsnDesign.NEWNAME.arrInstance || jsnDesign.NEWNAME.arrInstance.length === 0) {
                    insertChunk(arrChunks, {'chunkText': strTemp + ' ' + ctlNewName.value});
                } else {
                    updateChunk(arrChunks, 'NEWNAME', strTemp + ctlNewName.value, []);
                }
            }
            
            // OLD NAME
            if (ctlViewName.value !== ctlViewName.getAttribute('data-old-value')) {
                // if no object name exists: insert
                if (!jsnDesign.OLDNAME.arrInstance || jsnDesign.OLDNAME.arrInstance.length === 0) {
                    insertChunk(arrChunks, {'chunkText': ' ' + ctlViewName.value}, ['TYPE', 'IF', 'EXISTS']);
                    
                // else: overwrite object name
                } else {
                    removeChunk(arrChunks, ['OLDNAME'], ['RENAME', 'TO', 'OWNERNAME']);
                    updateChunk(arrChunks, 'OLDNAME', ' ' + ctlViewName.value, ['RENAME', 'TO', 'OWNERNAME']);
                }
            }
            
            // IF EXISTS
            if (ctlIfExists.value !== ctlIfExists.getAttribute('data-old-value')) {
                if (ctlIfExists.value === 'true') {
                    insertChunk(arrChunks, {'chunkText': ' IF EXISTS'}, ['ALTER', 'TYPE']);
                    
                } else {
                    removeChunk(arrChunks, ['IF', 'EXISTS'], ['OLDNAME', 'RENAME', 'TO', 'OWNERNAME']);
                }
            }
            
            // assemble script
            for (i = 0, len = arrChunks.length, strEditingScript = ''; i < len; i += 1) {
                strEditingScript += arrChunks[i].chunkText;
            }
            
            //console.log(strEditingScript);
            propertyWindowReplaceQuery(tabElement, textRange, strEditingScript);
        });
    };
    
    // ALTER VIEW [ IF EXISTS ] name RENAME TO newname
}

function propertyListALTER_SETSCHEMA(tabElement, strScript, textRange, arrChunks) {
    'use strict';
    var jsnDesign = {
            'ALTER': {
                'regex': /^(ALTER)$/gi,
                'arrInstance': []
            },
            'TYPE': {
                'regex': /^(VIEW|AGGREGATE|COLLATION|CONVERSION|OPERATOR|(TEXT|SEARCH|PARSER)|(TEXT|SEARCH|TEMPLATE)|(TEXT|SEARCH|DICTIONARY))$/gi,
                'arrInstance': []
            },
            'IF': {
                'regex': /^(IF)$/gi,
                'arrInstance': []
            },
            'EXISTS': {
                'regex': /^(EXISTS)$/gi,
                'arrInstance': []
            },
            'OBJECTNAME': {
                'type': [1, 2],
                'afterlast': ['TYPE', 'IF', 'EXISTS'],
                'beforefirst': ['SET'],
                'arrInstance': []
            },
            'SET': {
                'regex': /^(SET)$/gi,
                'arrInstance': []
            },
            'SCHEMA': {
                'regex': /^(SCHEMA)$/gi,
                'arrInstance': []
            },
            'SCHEMANAME': {
                'type': 2,
                'afterlast': ['SET', 'SCHEMA'],
                'arrInstance': []
            }
        }, i, len, strValue;
    
    // match what we can using regex
    arrChunks = regexMatch(jsnDesign, arrChunks);
    
    // match the rest by location of the chunk
    arrChunks = locationDependentMatch(jsnDesign, arrChunks);
    
    //console.log(arrChunks);
    
    
    // creating property dialog function
    window.propertyWindowDialog = function () {
        var strIfExistsHTML, strViewNameHTML, strNewSchemaHTML, i, len, strHTML, strValue, strType, arrTemp, strDoc;
        
        // get object type of query
        arrTemp = jsnDesign.TYPE.arrInstance;
        for (i = 0, len = arrTemp.length, strType = ''; i < len; i += 1) {
            strType += (strType ? ' ' : '') + arrChunks[arrTemp[i]].chunkText || '';
        }
        
        if (strType === 'TEXT SEARCH PARSER') {
            strDoc = 'tsparser';
        } else if (strType === 'TEXT SEARCH TEMPLATE') {
            strDoc = 'tstemplate';
        } else if (strType === 'TEXT SEARCH DICTIONARY') {
            strDoc = 'tsdictionary';
        } else {
            strDoc = strType.toLowerCase();
        }
        
        // checkbox: if exists
        strValue = (jsnDesign.EXISTS.arrInstance.length > 0 ? 'true' : 'false');
        
        strIfExistsHTML =   '<label for="property-if-exists" ' + (strType === 'VIEW' || strType === 'INDEX' || strType === 'TABLE' ? '' : 'hidden') + '>IF EXISTS:</label>' +
                            '<gs-checkbox id="property-if-exists" ' + (strType === 'VIEW' || strType === 'INDEX' || strType === 'TABLE' ? '' : 'hidden') + ' value="' + (strValue) + '"></gs-checkbox>';
        
        // text: object name
        strValue = '';
        if (jsnDesign.OBJECTNAME.arrInstance.length > 0) {
            arrTemp = jsnDesign.OBJECTNAME.arrInstance;
            for (i = arrTemp[0], len = arrTemp[arrTemp.length - 1] + 1; i < len; i += 1) {
                strValue += arrChunks[i].chunkText || '';
            }
        }
        
        strViewNameHTML = '<label for="property-view-name">' + strType + ' Name:</label>' +
                          '<gs-text id="property-view-name" value="' + (strValue) + '"></gs-text>';
        
        // text: column_name
        strValue = '';
        if (jsnDesign.SCHEMANAME.arrInstance.length > 0) {
            strValue = arrChunks[jsnDesign.SCHEMANAME.arrInstance[0]].chunkText || '';
        }
        
        strNewSchemaHTML = '<label for="property-new-schema">Schema To Move To:</label>' +
                           '<gs-text id="property-new-schema" value="' + (strValue) + '"></gs-text>';
        
        // build final html
        strHTML = strIfExistsHTML +
                  strViewNameHTML +
                  strNewSchemaHTML;
        
        // create dialog
        openPropertyDialog('ALTER ' + strType + ' ... SET SCHEMA', [
                                           {'link': 'sql-alter' + strDoc + '.html', 'name': 'ALTER ' + strType},
                                           {'link': 'sql-create' + strDoc + '.html', 'name': 'CREATE ' + strType},
                                           {'link': 'sql-drop' + strDoc + '.html', 'name': 'DROP ' + strType}
                                         ], [],
                                         strHTML, '', function (dialog) {
            var ctlIfExists, ctlViewName, ctlNewSchema, i, len, strEditingScript, strTemp;
            
            ctlIfExists  = document.getElementById('property-if-exists');
            ctlViewName  = document.getElementById('property-view-name');
            ctlNewSchema = document.getElementById('property-new-schema');
            
            // SCHEMANAME
            if (ctlNewSchema.value !== ctlNewSchema.getAttribute('data-old-value')) {
                if (!jsnDesign.SCHEMANAME.arrInstance || jsnDesign.SCHEMANAME.arrInstance.length === 0) {
                    insertChunk(arrChunks, {'chunkText': ' ' + ctlNewSchema.value});
                } else {
                    updateChunk(arrChunks, 'SCHEMANAME', ctlNewSchema.value, []);
                }
            }
            
            // OBJECT NAME
            if (ctlViewName.value !== ctlViewName.getAttribute('data-old-value')) {
                if (!jsnDesign.OBJECTNAME.arrInstance || jsnDesign.OBJECTNAME.arrInstance.length === 0) {
                    insertChunk(arrChunks, {'chunkText': ' ' + ctlViewName.value}, ['TYPE', 'IF', 'EXISTS']);
                    
                } else {
                    removeChunk(arrChunks, ['OBJECTNAME'], ['SET', 'SCHEMA', 'SCHEMANAME']);
                    updateChunk(arrChunks, 'OBJECTNAME', ' ' + ctlViewName.value, ['SET', 'SCHEMA', 'SCHEMANAME']);
                }
            }
            
            // IF EXISTS
            if (ctlIfExists.value !== ctlIfExists.getAttribute('data-old-value')) {
                if (ctlIfExists.value === 'true') {
                    insertChunk(arrChunks, {'chunkText': ' IF EXISTS'}, ['ALTER', 'VIEW']);
                    
                } else {
                    removeChunk(arrChunks, ['IF', 'EXISTS'], ['OBJECTNAME', 'RENAME', 'TO', 'OWNERNAME']);
                }
            }
            
            // assemble script
            for (i = 0, len = arrChunks.length, strEditingScript = ''; i < len; i += 1) {
                strEditingScript += arrChunks[i].chunkText;
            }
            
            //console.log(strEditingScript);
            propertyWindowReplaceQuery(tabElement, textRange, strEditingScript);
        });
    };
    
    // ALTER VIEW [ IF EXISTS ] name SET SCHEMA schema
}

function propertyListALTERVIEW_SET(tabElement, strScript, textRange, arrChunks) {
    'use strict';
    var jsnDesign = {
            'ALTER': {
                'regex': /^(ALTER)$/gi,
                'arrInstance': []
            },
            'VIEW': {
                'regex': /^(VIEW)$/gi,
                'arrInstance': []
            },
            'IF': {
                'regex': /^(IF)$/gi,
                'arrInstance': []
            },
            'EXISTS': {
                'regex': /^(EXISTS)$/gi,
                'arrInstance': []
            },
            'VIEWNAME': {
                'type': 2,
                'afterlast': ['VIEW', 'IF', 'EXISTS'],
                'beforefirst': ['SET'],
                'arrInstance': []
            },
            'SET': {
                'regex': /^(SET)$/gi,
                'arrInstance': []
            },
            'SETPAREN': {
                'type': 1,
                'afterlast': ['SET'],
                'arrInstance': []
            }
        }, i, len, strValue;
    
    // match what we can using regex
    arrChunks = regexMatch(jsnDesign, arrChunks);
    // match the rest by location of the chunk
    arrChunks = locationDependentMatch(jsnDesign, arrChunks);
    
    //console.log(arrChunks);
    
    // creating property dialog function
    window.propertyWindowDialog = function () {
        var strIfExistsHTML, strViewNameHTML, strSecurityHTML, i, len, strHTML, strValue;
        
        // checkbox: if exists
        strValue = (jsnDesign.EXISTS.arrInstance.length > 0 ? 'true' : 'false');
        
        strIfExistsHTML = '<label for="property-if-exists">IF EXISTS:</label>' +
                          '<gs-checkbox id="property-if-exists" value="' + (strValue) + '"></gs-checkbox>';
        
        // text: view name
        strValue = '';
        if (jsnDesign.VIEWNAME.arrInstance.length > 0) {
            strValue = arrChunks[jsnDesign.VIEWNAME.arrInstance[0]].chunkText || '';
        }
        
        strViewNameHTML = '<label for="property-view-name">VIEW Name:</label>' +
                          '<gs-text id="property-view-name" value="' + (strValue) + '"></gs-text>';
        
        // checkbox: security barrier
        strValue = '';
        if (jsnDesign.SETPAREN.arrInstance.length > 0) {
            strValue = (arrChunks[jsnDesign.SETPAREN.arrInstance[0]].chunkText || '').toLowerCase();
            strValue = (
                            strValue.indexOf('security_barrier') > -1 &&
                            strValue.replace(/\s/gi, '').indexOf('security_barrier=false') === -1
                        ).toString();
        }
        
        strSecurityHTML = '<label for="property-security">Security Barrier:</label>' +
                          '<gs-checkbox id="property-security" value="' + (strValue) + '"></gs-checkbox>';
        
        // build final html
        strHTML = '<gs-grid gutter min-width="0px {reflow}; 527px {1,1};" reflow-at="535">' +
                      '<gs-block>' + strIfExistsHTML + '</gs-block>' +
                      '<gs-block>' + strViewNameHTML + '</gs-block>' +
                  '</gs-grid>' +
                  strSecurityHTML;
        
        // create dialog
        openPropertyDialog('ALTER VIEW ... SET', [
                                           {'link': 'sql-alterview.html', 'name': 'ALTER VIEW'},
                                           {'link': 'sql-createview.html', 'name': 'CREATE VIEW'},
                                           {'link': 'sql-dropview.html', 'name': 'DROP VIEW'}
                                         ], [],
                                         strHTML, '', function (dialog) {
            var ctlIfExists, ctlViewName, ctlSecurity, i, len, strEditingScript, strTemp;
            
            ctlIfExists = document.getElementById('property-if-exists');
            ctlViewName = document.getElementById('property-view-name');
            ctlSecurity = document.getElementById('property-security');
            
            // SETPAREN
            if (ctlSecurity.value !== ctlSecurity.getAttribute('data-old-value')) {
                if ((!jsnDesign.SETPAREN.arrInstance || jsnDesign.SETPAREN.arrInstance.length === 0) && ctlSecurity.value === 'true') {
                    insertChunk(arrChunks, {'chunkText': ' (security_barrier=TRUE)'});
                } else if (jsnDesign.SETPAREN.arrInstance && jsnDesign.SETPAREN.arrInstance.length > 0) {
                    removeChunk(arrChunks, ['SETPAREN'], []);
                    updateChunk(arrChunks, 'SETPAREN', ' (security_barrier=' + ctlSecurity.value.toUpperCase() + ')', []);
                }
            }
            
            // VIEW NAME
            if (ctlViewName.value !== ctlViewName.getAttribute('data-old-value')) {
                if (!jsnDesign.VIEWNAME.arrInstance || jsnDesign.VIEWNAME.arrInstance.length === 0) {
                    insertChunk(arrChunks, {'chunkText': ' ' + ctlViewName.value}, ['VIEW', 'IF', 'EXISTS']);
                    
                } else {
                    updateChunk(arrChunks, 'VIEWNAME', ctlViewName.value, ['RENAME', 'TO', 'OWNERNAME']);
                }
            }
            
            // IF EXISTS
            if (ctlIfExists.value !== ctlIfExists.getAttribute('data-old-value')) {
                if (ctlIfExists.value === 'true') {
                    insertChunk(arrChunks, {'chunkText': ' IF EXISTS'}, ['ALTER', 'VIEW']);
                    
                } else {
                    removeChunk(arrChunks, ['IF', 'EXISTS'], ['VIEWNAME', 'RENAME', 'TO', 'OWNERNAME']);
                }
            }
            
            // assemble script
            for (i = 0, len = arrChunks.length, strEditingScript = ''; i < len; i += 1) {
                strEditingScript += arrChunks[i].chunkText;
            }
            
            //console.log(strEditingScript);
            propertyWindowReplaceQuery(tabElement, textRange, strEditingScript);
        });
    };
    
    // ALTER VIEW [ IF EXISTS ] name SET (set_paren)
}

function propertyListALTERVIEW_RESET(tabElement, strScript, textRange, arrChunks) {
    'use strict';
    var jsnDesign = {
            'ALTER': {
                'regex': /^(ALTER)$/gi,
                'arrInstance': []
            },
            'VIEW': {
                'regex': /^(VIEW)$/gi,
                'arrInstance': []
            },
            'IF': {
                'regex': /^(IF)$/gi,
                'arrInstance': []
            },
            'EXISTS': {
                'regex': /^(EXISTS)$/gi,
                'arrInstance': []
            },
            'VIEWNAME': {
                'type': 2,
                'afterlast': ['VIEW', 'IF', 'EXISTS'],
                'beforefirst': ['RESET'],
                'arrInstance': []
            },
            'RESET': {
                'regex': /^(RESET)$/gi,
                'arrInstance': []
            },
            'RESETPAREN': {
                'type': 1,
                'afterlast': ['RESET'],
                'arrInstance': []
            }
        }, i, len, strValue;
    
    // match what we can using regex
    arrChunks = regexMatch(jsnDesign, arrChunks);
    // match the rest by location of the chunk
    arrChunks = locationDependentMatch(jsnDesign, arrChunks);
    
    //console.log(arrChunks);
    
    // creating property dialog function
    window.propertyWindowDialog = function () {
        var strIfExistsHTML, strViewNameHTML, strSecurityHTML, i, len, strHTML, strValue;
        
        // checkbox: if exists
        strValue = (jsnDesign.EXISTS.arrInstance.length > 0 ? 'true' : 'false');
        
        strIfExistsHTML = '<label for="property-if-exists">IF EXISTS:</label>' +
                          '<gs-checkbox id="property-if-exists" value="' + (strValue) + '"></gs-checkbox>';
        
        // text: view name
        strValue = '';
        if (jsnDesign.VIEWNAME.arrInstance.length > 0) {
            strValue = arrChunks[jsnDesign.VIEWNAME.arrInstance[0]].chunkText || '';
        }
        
        strViewNameHTML = '<label for="property-view-name">VIEW Name:</label>' +
                          '<gs-text id="property-view-name" value="' + (strValue) + '"></gs-text>';
        
        // checkbox: security barrier
        strValue = '';
        if (jsnDesign.RESETPAREN.arrInstance.length > 0) {
            strValue = arrChunks[jsnDesign.RESETPAREN.arrInstance[0]].chunkText || '';
            strValue = (strValue.toLowerCase().indexOf('security_barrier') > -1).toString();
        }
        
        strSecurityHTML = '<label for="property-security">Security Barrier:</label>' +
                          '<gs-checkbox id="property-security" value="' + (strValue) + '"></gs-checkbox>';
        
        // build final html
        strHTML = '<gs-grid gutter min-width="0px {reflow}; 527px {1,1};" reflow-at="535">' +
                      '<gs-block>' + strIfExistsHTML + '</gs-block>' +
                      '<gs-block>' + strViewNameHTML + '</gs-block>' +
                  '</gs-grid>' +
                  strSecurityHTML;
        
        // create dialog
        openPropertyDialog('ALTER VIEW ... RESET', [
                                           {'link': 'sql-alterview.html', 'name': 'ALTER VIEW'},
                                           {'link': 'sql-createview.html', 'name': 'CREATE VIEW'},
                                           {'link': 'sql-dropview.html', 'name': 'DROP VIEW'}
                                         ], [],
                                         strHTML, '', function (dialog) {
            var ctlIfExists, ctlViewName, ctlSecurity, i, len, strEditingScript, strTemp;
            
            ctlIfExists = document.getElementById('property-if-exists');
            ctlViewName = document.getElementById('property-view-name');
            ctlSecurity = document.getElementById('property-security');
            
            // RESETPAREN
            if (ctlSecurity.value !== ctlSecurity.getAttribute('data-old-value')) {
                if ((!jsnDesign.RESETPAREN.arrInstance || jsnDesign.RESETPAREN.arrInstance.length === 0) && ctlSecurity.value === 'true') {
                    insertChunk(arrChunks, {'chunkText': ' (security_barrier)'});
                } else if (jsnDesign.RESETPAREN.arrInstance && jsnDesign.RESETPAREN.arrInstance.length > 0) {
                    removeChunk(arrChunks, ['RESETPAREN'], []);
                    if (ctlSecurity.value === 'true') {
                        updateChunk(arrChunks, 'RESETPAREN', ' (security_barrier)', []);
                    } else {
                        updateChunk(arrChunks, 'RESETPAREN', ' ()', []);
                    }
                }
            }
            
            // VIEW NAME
            if (ctlViewName.value !== ctlViewName.getAttribute('data-old-value')) {
                if (!jsnDesign.VIEWNAME.arrInstance || jsnDesign.VIEWNAME.arrInstance.length === 0) {
                    insertChunk(arrChunks, {'chunkText': ' ' + ctlViewName.value}, ['VIEW', 'IF', 'EXISTS']);
                    
                } else {
                    updateChunk(arrChunks, 'VIEWNAME', ctlViewName.value, ['RENAME', 'TO', 'OWNERNAME']);
                }
            }
            
            // IF EXISTS
            if (ctlIfExists.value !== ctlIfExists.getAttribute('data-old-value')) {
                if (ctlIfExists.value === 'true') {
                    insertChunk(arrChunks, {'chunkText': ' IF EXISTS'}, ['ALTER', 'VIEW']);
                    
                } else {
                    removeChunk(arrChunks, ['IF', 'EXISTS'], ['VIEWNAME', 'RENAME', 'TO', 'OWNERNAME']);
                }
            }
            
            // assemble script
            for (i = 0, len = arrChunks.length, strEditingScript = ''; i < len; i += 1) {
                strEditingScript += arrChunks[i].chunkText;
            }
            
            //console.log(strEditingScript);
            propertyWindowReplaceQuery(tabElement, textRange, strEditingScript);
        });
    };
    
    // ALTER VIEW [ IF EXISTS ] name RESET (reset_paren)
}

function propertyListALTERTEXTSEARCHDICTIONARY(tabElement, strScript, textRange, arrChunks) {
    'use strict';
    var jsnDesign = {
            'ALTER': {
                'regex': /^(ALTER)$/gi,
                'arrInstance': []
            },
            'TEXT': {
                'regex': /^(TEXT)$/gi,
                'arrInstance': []
            },
            'SEARCH': {
                'regex': /^(SEARCH)$/gi,
                'arrInstance': []
            },
            'DICTIONARY': {
                'regex': /^(DICTIONARY)$/gi,
                'arrInstance': []
            },
            
            'SETPAREN': {
                'type': 1,
                'afterlast': ['DICTIONARY'],
                'arrInstance': []
            },
            
            'OBJECTNAME': {
                'type': 2,
                'afterlast': ['DICTIONARY'],
                'beforefirst': ['SETPAREN'],
                'arrInstance': []
            }
        }, i, len, strValue;
    
    // match what we can using regex
    arrChunks = regexMatch(jsnDesign, arrChunks);
    // match the rest by location of the chunk
    arrChunks = locationDependentMatch(jsnDesign, arrChunks);
    
    //console.log(arrChunks);
    
    // creating property dialog function
    window.propertyWindowDialog = function () {
        var strObjectNameHTML, strOptionsHTML, i, len, strHTML, strValue;
        
        // text: view name
        strValue = '';
        if (jsnDesign.OBJECTNAME.arrInstance.length > 0) {
            strValue = arrChunks[jsnDesign.OBJECTNAME.arrInstance[0]].chunkText || '';
        }
        
        strObjectNameHTML = '<label for="property-object-name">TEXT SEARCH DICTIONARY Name:</label>' +
                            '<gs-text id="property-object-name" value="' + (strValue) + '"></gs-text>';
        
        // memo: options
        strValue = '';
        if (jsnDesign.SETPAREN.arrInstance.length > 0) {
            strValue = GS.trim(GS.trim(GS.trim(arrChunks[jsnDesign.SETPAREN.arrInstance[0]].chunkText, '('), ')'), '\n') || '';
        }
        
        strOptionsHTML = '<label for="property-options">' +
                            'Options: ' +
                            '<small>Here\'s a list of possible options (this list is not exaustive): TEMPLATE, Language, StopWords</small>' +
                         '</label>' +
                         '<gs-memo id="property-options" value="' + (strValue) + '" autoresize no-resize-handle></gs-memo>';
        
        // build final html
        strHTML = strObjectNameHTML +
                  strOptionsHTML;
        
        // create dialog
        openPropertyDialog('ALTER TEXT SEARCH DICTIONARY', [
                                           {'link': 'sql-altertsdictionary.html', 'name': 'ALTER TEXT SEARCH DICTIONARY'},
                                           {'link': 'sql-createtsdictionary.html', 'name': 'CREATE TEXT SEARCH DICTIONARY'},
                                           {'link': 'sql-droptsdictionary.html', 'name': 'DROP TEXT SEARCH DICTIONARY'}
                                         ], [
                                            {'link': 'textsearch-dictionaries.html', 'name': 'Dictionaries'}
                                         ],
                                         strHTML, '', function (dialog) {
            var ctlObjectNameHTML, ctlOptionsHTML, i, len, strEditingScript, strTemp;
            
            ctlObjectNameHTML = document.getElementById('property-object-name');
            ctlOptionsHTML    = document.getElementById('property-options');
            
            // SETPAREN
            if (ctlOptionsHTML.value !== ctlOptionsHTML.getAttribute('data-old-value')) {
                if (!jsnDesign.SETPAREN.arrInstance || jsnDesign.SETPAREN.arrInstance.length === 0) {
                    insertChunk(arrChunks, {'chunkText': ' (\n' + ctlOptionsHTML.value + '\n)'}, ['DICTIONARY', 'OBJECTNAME']);
                    
                } else {
                    updateChunk(arrChunks, 'SETPAREN', ' (\n' + ctlOptionsHTML.value + '\n)', []);
                }
            }
            
            // OBJECTNAME
            if (ctlObjectNameHTML.value !== ctlObjectNameHTML.getAttribute('data-old-value')) {
                if (!jsnDesign.OBJECTNAME.arrInstance || jsnDesign.OBJECTNAME.arrInstance.length === 0) {
                    insertChunk(arrChunks, {'chunkText': ' ' + ctlObjectNameHTML.value}, ['DICTIONARY']);
                    
                } else {
                    updateChunk(arrChunks, 'OBJECTNAME', ctlObjectNameHTML.value, ['SETPAREN']);
                }
            }
            
            // assemble script
            for (i = 0, len = arrChunks.length, strEditingScript = ''; i < len; i += 1) {
                strEditingScript += arrChunks[i].chunkText;
            }
            
            //console.log(strEditingScript);
            propertyWindowReplaceQuery(tabElement, textRange, strEditingScript);
        });
    };
    
    // ALTER TEXT SEARCH DICTIONARY name (
    //     option [ = value ] [, ... ]
    // )
}

function propertyListALTERTRIGGER(tabElement, strScript, textRange, arrChunks) {
    'use strict';
    // This function is given an SQL query that has been split into an array of text chunks called "arrChunks".
    //      This function will recognize important chunks and be able to alter them if the user chooses to make changes.
    //      There are three different kinds of chunks:
    //          0 -> Whitespace / comments
    //              A chunk of this kind contains whitespace and comments so '  /*test*/' could be one
    //              chunk and '  --asdf' could be another. These chunks are rarely paid attention to due
    //              to comments and whitespace not having any value in SQL's grammer.
    //          1 -> Parenthesis
    //              A chunk of this kind contains parenthesis from the start parenthesis to end so
    //              '(this is a test)' could be a chunk and '(asdf (fdas))' could be another. These chunks
    //              are not split on the inside.
    //          2 -> Text / quotes
    //              A chunk of this kind contains uncommented/non-whitespace characters and includes quoted
    //              characters. These chunks can contain text like: 'test', "test'asdf'", 'test."asdf@asdf"'
    //              and other variations. This type of chunk is very often used for SQL keywords and names.
    //              In some cases to recognize names you'll need to also include parenthesis type (type 1)
    //              and whitespace type (type 0) chunks, such as in the case of FUNCTION names (because of the
    //              parenthesized parameters and the space between the parenthesis and the text name).
    //      The first step of this function is to find important chunks. This is done using this JSON structure:
    var jsnDesign = {
            // This particular inner JSON structure targets one word: 'ALTER'. This is done using the
            //      'regex' functionality. So this will find any chunk whose text matches the regex.
            'ALTER': {
                'regex': /^ALTER$/gi
            },
            // This is like the 'alter' JSON structure, how it differs is that it looks for the word 'TRIGGER'
            'TRIGGER': {
                'regex': /^TRIGGER$/gi
            },
            // This JSON is looking for a name. Because the text of names varys greatly we must target this type of chunk differently
            'OBJECTNAME': {
                'type': 2,
                'afterfirst': ['ALTER', 'TRIGGER'],
                'beforefirst': ['ON']
            },
            'ON': {
                'regex': /^(ON)$/gi
            },
            'TABLENAME': {
                'type': 2,
                'afterfirst': ['ON'],
                'beforefirst': ['RENAME']
            },
            'RENAME': {
                'regex': /^RENAME$/gi
            },
            'TO': {
                'regex': /^TO$/gi
            },
            'NEWNAME': {
                'type': 2,
                'afterfirst': ['RENAME', 'TO']
            }
        }, i, len, strValue;
    
    // match what we can using regex
    arrChunks = regexMatch(jsnDesign, arrChunks);
    
    // match the rest by location of the chunk
    arrChunks = locationDependentMatch(jsnDesign, arrChunks);
    
    //console.log(arrChunks);
    
    // creating property dialog function
    window.propertyWindowDialog = function () {
        var strObjectNameHTML, strTableNameHTML, strNewNameHTML, i, len, strHTML, strValue, strType, arrTemp, strDoc;
        
        // text: object name
        strValue = '';
        if (jsnDesign.OBJECTNAME.arrInstance.length > 0) {
            strValue = arrChunks[jsnDesign.OBJECTNAME.arrInstance[0]].chunkText || '';
        }
        
        strObjectNameHTML = '<label for="property-object-name">TRIGGER Name:</label>' +
                            '<gs-text id="property-object-name" value="' + encodeHTML(strValue) + '"></gs-text>';
        
        // text: table name
        strValue = '';
        if (jsnDesign.TABLENAME.arrInstance.length > 0) {
            strValue = arrChunks[jsnDesign.TABLENAME.arrInstance[0]].chunkText || '';
        }
        
        strTableNameHTML = '<label for="property-table-name">TABLE Name:</label>' +
                           '<gs-text id="property-table-name" value="' + encodeHTML(strValue) + '"></gs-text>';
        
        // text: new name
        strValue = '';
        if (jsnDesign.NEWNAME.arrInstance.length > 0) {
            strValue = arrChunks[jsnDesign.NEWNAME.arrInstance[0]].chunkText || '';
        }
        
        strNewNameHTML = '<label for="property-new-name">New Name:</label>' +
                           '<gs-text id="property-new-name" value="' + encodeHTML(strValue) + '"></gs-text>';
        
        // build final html
        strHTML = strObjectNameHTML +
                  strTableNameHTML +
                  strNewNameHTML;
        
        // create dialog
        openPropertyDialog('ALTER TRIGGER ... RENAME', [
                                           {'link': 'sql-altertrigger.html', 'name': 'ALTER TRIGGER'},
                                           {'link': 'sql-createtrigger.html', 'name': 'CREATE TRIGGER'},
                                           {'link': 'sql-droptrigger.html', 'name': 'DROP TRIGGER'}
                                         ], [],
                                         strHTML, '', function (dialog) {
            var ctlObjectName, ctlTableName, ctlNewName
              , i, len, strEditingScript, strTemp;
            
            ctlObjectName  = document.getElementById('property-object-name');
            ctlTableName  = document.getElementById('property-table-name');
            ctlNewName = document.getElementById('property-new-name');
            
            // NEWNAME
            if (ctlNewName.value !== ctlNewName.getAttribute('data-old-value')) {
                //console.log(jsnDesign.RENAME.arrInstance);
                strTemp = '';
                if (jsnDesign.RENAME.arrInstance.length === 0) { strTemp += ' RENAME'; }
                if (jsnDesign.TO.arrInstance.length === 0) { strTemp += ' TO'; }
                //console.log('"' + strTemp + '"', jsnDesign.RENAME.arrInstance.length, jsnDesign.TO.arrInstance.length);
                
                if (!jsnDesign.NEWNAME.arrInstance || jsnDesign.NEWNAME.arrInstance.length === 0) {
                    insertChunk(arrChunks, {'chunkText': strTemp + ' ' + ctlNewName.value});
                } else {
                    updateChunk(arrChunks, 'NEWNAME', strTemp + ctlNewName.value, []);
                }
            }
            
            // TABLENAME
            if (ctlTableName.value !== ctlTableName.getAttribute('data-old-value')) {
                strTemp = '';
                if (jsnDesign.TO.arrInstance.length === 0) { strTemp = ' ON'; }
                
                // if no object name exists: insert
                if (!jsnDesign.TABLENAME.arrInstance || jsnDesign.TABLENAME.arrInstance.length === 0) {
                    insertChunk(arrChunks, {'chunkText': strTemp + ' ' + ctlTableName.value}, ['ON', 'OBJECTNAME', 'TRIGGER', 'ALTER']);
                    
                // else: overwrite object name
                } else {
                    updateChunk(arrChunks, 'TABLENAME', strTemp + ctlTableName.value, ['RENAME', 'TO', 'NEWNAME']);
                }
            }
            
            // OBJECTNAME
            if (ctlObjectName.value !== ctlObjectName.getAttribute('data-old-value')) {
                // if no object name exists: insert
                if (!jsnDesign.OBJECTNAME.arrInstance || jsnDesign.OBJECTNAME.arrInstance.length === 0) {
                    insertChunk(arrChunks, {'chunkText': ' ' + ctlObjectName.value}, ['ALTER', 'TRIGGER']);
                    
                // else: overwrite object name
                } else {
                    updateChunk(arrChunks, 'OBJECTNAME', ctlObjectName.value, ['ON', 'TABLENAME', 'RENAME']);
                }
            }
            
            // assemble script
            for (i = 0, len = arrChunks.length, strEditingScript = ''; i < len; i += 1) {
                strEditingScript += arrChunks[i].chunkText;
            }
            
            //console.log(strEditingScript);
            propertyWindowReplaceQuery(tabElement, textRange, strEditingScript);
        });
    };
    
    // ALTER TRIGGER name ON table_name RENAME TO new_name
}












function propertyListALTERLANG_ALTEROWNER(tabElement, strScript, textRange, arrChunks) {
    'use strict';
    
    // ALTER [PROCEDURAL] LANGUAGE name OWNER TO new_owner;
    
    var jsnDesign = {
            'ALTER':      { 'regex': /^ALTER$/gi },
            'TYPE':       { 'regex': /^LANGUAGE$/gi },
            'PROCEDURAL': { 'regex': /^PROCEDURAL$/gi },
            
            'OBJECTNAME': {
                'type': 2,
                'afterlast': ['TYPE', 'PROCEDURAL'],
                'beforefirst': ['OWNER']
            },
            
            'OWNER': { 'regex': /^OWNER$/gi },
            'TO':    { 'regex': /^TO$/gi },
            
            'OWNERNAME': {
                'type': 2,
                'afterlast': ['OWNER', 'TO']
            }
        }, i, len, strValue;
    
    // match what we can using regex
    arrChunks = regexMatch(jsnDesign, arrChunks);
    
    // match the rest by location of the chunk
    arrChunks = locationDependentMatch(jsnDesign, arrChunks);
    
    // creating property dialog function
    window.propertyWindowDialog = function () {
        var strProceduralHTML, strObjectNameHTML, strOwnerNameHTML, i, len, strHTML, strValue;
        
        // checkbox: PROCEDURAL
        strValue = (jsnDesign.PROCEDURAL.arrInstance.length > 0 ? 'true' : 'false');
        
        strProceduralHTML = '<label for="property-procedural">PROCEDURAL:</label>' +
                            '<gs-checkbox id="property-procedural" value="' + (strValue) + '"></gs-checkbox>';
        
        // text: OBJECTNAME
        strValue = '';
        if (jsnDesign.OBJECTNAME.arrInstance.length > 0) {
            strValue = arrChunks[jsnDesign.OBJECTNAME.arrInstance[0]].chunkText || '';
        }
        
        strObjectNameHTML = '<label for="property-object-name">LANGUAGE Name:</label>' +
                            '<gs-text id="property-object-name" value="' + (strValue) + '"></gs-text>';
        
        // text: OWNERNAME
        strValue = '';
        if (jsnDesign.OWNERNAME.arrInstance.length > 0) {
            strValue = arrChunks[jsnDesign.OWNERNAME.arrInstance[0]].chunkText || '';
        }
        
        strOwnerNameHTML = '<label for="property-owner-name">Owner Name:</label>' +
                           '<gs-text id="property-owner-name" value="' + (strValue) + '"></gs-text>';
        
        
        // build final html
        strHTML = strProceduralHTML +
                  strObjectNameHTML +
                  strOwnerNameHTML;
        
        // create dialog
        openPropertyDialog('ALTER LANGUAGE ... OWNER', [
                                           {'link': 'sql-alterlanguage.html', 'name': 'ALTER LANGUAGE'},
                                           {'link': 'sql-createlanguage.html', 'name': 'CREATE LANGUAGE'},
                                           {'link': 'sql-droplanguage.html', 'name': 'DROP LANGUAGE'}
                                         ], [],
                                         strHTML, '', function (dialog) {
            var ctlProcedural, ctlObjectName, ctlOwnerName, i, len, strEditingScript, strTemp;
            
            ctlProcedural = document.getElementById('property-procedural');
            ctlObjectName = document.getElementById('property-object-name');
            ctlOwnerName  = document.getElementById('property-owner-name');
            
            // OWNER NAME
            if (ctlOwnerName.value !== ctlOwnerName.getAttribute('data-old-value')) {
                strTemp = '';
                if (jsnDesign.TO.arrInstance.length === 0) { strTemp = ' TO'; }
                
                if (!jsnDesign.OWNERNAME.arrInstance || jsnDesign.OWNERNAME.arrInstance.length === 0) {
                    insertChunk(arrChunks, {'chunkText': strTemp + ' ' + ctlOwnerName.value});
                } else {
                    updateChunk(arrChunks, 'OWNERNAME', strTemp + ctlOwnerName.value, []);
                }
            }
            
            // OBJECTNAME
            if (ctlObjectName.value !== ctlObjectName.getAttribute('data-old-value')) {
                if (!jsnDesign.OBJECTNAME.arrInstance || jsnDesign.OBJECTNAME.arrInstance.length === 0) {
                    insertChunk(arrChunks, {'chunkText': ' ' + ctlObjectName.value}, ['LANGUAGE']);
                } else {
                    updateChunk(arrChunks, 'OBJECTNAME', ctlObjectName.value, ['OWNER', 'TO', 'OWNERNAME']);
                }
            }
            
            // PROCEDURAL
            if (ctlProcedural.value !== ctlProcedural.getAttribute('data-old-value')) {
                if (ctlProcedural.value === 'true') {
                    insertChunk(arrChunks, {'chunkText': ' PROCEDURAL'}, ['ALTER']);
                } else {
                    removeChunk(arrChunks, ['PROCEDURAL'], ['LANGUAGE']);
                }
            }
            
            // assemble script
            for (i = 0, len = arrChunks.length, strEditingScript = ''; i < len; i += 1) {
                strEditingScript += arrChunks[i].chunkText;
            }
            
            propertyWindowReplaceQuery(tabElement, textRange, strEditingScript);
        });
    };
}

function propertyListALTERLANG_ALTERNAME(tabElement, strScript, textRange, arrChunks) {
    'use strict';
    
    // ALTER [PROCEDURAL] LANGUAGE name RENAME TO new_name;
    
    var jsnDesign = {
            'ALTER':      { 'regex': /^ALTER$/gi },
            'TYPE':       { 'regex': /^LANGUAGE$/gi },
            'PROCEDURAL': { 'regex': /^PROCEDURAL$/gi },
            
            'OBJECTNAME': {
                'type': 1,
                'afterlast': ['ALTER', 'TYPE', 'PROCEDURAL'],
                'beforefirst': ['RENAME']
            },
            
            'RENAME': { 'regex': /^RENAME$/gi },
            'TO': {     'regex': /^TO$/gi },
            
            'NEWNAME': {
                'type': 2,
                'afterlast': ['RENAME', 'TO']
            }
        }, i, len, strValue;
    
    // match what we can using regex
    arrChunks = regexMatch(jsnDesign, arrChunks);
    
    // match the rest by location of the chunk
    arrChunks = locationDependentMatch(jsnDesign, arrChunks);
    
    //console.log(arrChunks);
    
    
    // creating property dialog function
    window.propertyWindowDialog = function () {
        var strProceduralHTML, strObjectNameHTML, strNewNameHTML, i, len, strHTML, strValue;
        
        // checkbox: PROCEDURAL
        strValue = (jsnDesign.PROCEDURAL.arrInstance.length > 0 ? 'true' : 'false');
        
        strProceduralHTML = '<label for="property-procedural">PROCEDURAL:</label>' +
                            '<gs-checkbox id="property-procedural" value="' + (strValue) + '"></gs-checkbox>';
        
        // text: OBJECTNAME
        strValue = '';
        if (jsnDesign.OBJECTNAME.arrInstance.length > 0) {
            strValue = arrChunks[jsnDesign.OBJECTNAME.arrInstance[0]].chunkText || '';
        }
        
        strObjectNameHTML = '<label for="property-object-name">LANGUAGE Name:</label>' +
                            '<gs-text id="property-object-name" value="' + (strValue) + '"></gs-text>';
        
        // text: NEWNAME
        strValue = '';
        if (jsnDesign.NEWNAME.arrInstance.length > 0) {
            strValue = arrChunks[jsnDesign.NEWNAME.arrInstance[0]].chunkText || '';
        }
        
        strNewNameHTML = '<label for="property-new-name">Owner Name:</label>' +
                         '<gs-text id="property-new-name" value="' + (strValue) + '"></gs-text>';
        
        
        // build final html
        strHTML = strProceduralHTML +
                  strObjectNameHTML +
                  strNewNameHTML;
        
        // create dialog
        openPropertyDialog('ALTER LANGUAGE ... RENAME', [
                                           {'link': 'sql-alterlanguage.html', 'name': 'ALTER LANGUAGE'},
                                           {'link': 'sql-createlanguage.html', 'name': 'CREATE LANGUAGE'},
                                           {'link': 'sql-droplanguage.html', 'name': 'DROP LANGUAGE'}
                                         ], [],
                                         strHTML, '', function (dialog) {
            var ctlProcedural, ctlObjectName, ctlNewName, i, len, strEditingScript, strTemp;
            
            ctlProcedural = document.getElementById('property-procedural');
            ctlObjectName = document.getElementById('property-object-name');
            ctlNewName    = document.getElementById('property-new-name');
            
            // NEWNAME
            if (ctlNewName.value !== ctlNewName.getAttribute('data-old-value')) {
                strTemp = '';
                if (jsnDesign.RENAME.arrInstance.length === 0) { strTemp = ' RENAME'; }
                if (jsnDesign.TO.arrInstance.length === 0) { strTemp = ' TO'; }
                
                if (!jsnDesign.NEWNAME.arrInstance || jsnDesign.NEWNAME.arrInstance.length === 0) {
                    insertChunk(arrChunks, {'chunkText': strTemp + ' ' + ctlNewName.value});
                } else {
                    updateChunk(arrChunks, 'NEWNAME', strTemp + ctlNewName.value, []);
                }
            }
            
            // OBJECTNAME
            if (ctlObjectName.value !== ctlObjectName.getAttribute('data-old-value')) {
                if (!jsnDesign.OBJECTNAME.arrInstance || jsnDesign.OBJECTNAME.arrInstance.length === 0) {
                    insertChunk(arrChunks, {'chunkText': ' ' + ctlObjectName.value}, ['LANGUAGE']);
                } else {
                    updateChunk(arrChunks, 'OBJECTNAME', ctlObjectName.value, ['OWNER', 'TO', 'OWNERNAME']);
                }
            }
            
            // PROCEDURAL
            if (ctlProcedural.value !== ctlProcedural.getAttribute('data-old-value')) {
                if (ctlProcedural.value === 'true') {
                    insertChunk(arrChunks, {'chunkText': ' PROCEDURAL'}, ['ALTER']);
                } else {
                    removeChunk(arrChunks, ['PROCEDURAL'], ['LANGUAGE']);
                }
            }
            
            // assemble script
            for (i = 0, len = arrChunks.length, strEditingScript = ''; i < len; i += 1) {
                strEditingScript += arrChunks[i].chunkText;
            }
            
            propertyWindowReplaceQuery(tabElement, textRange, strEditingScript);
        });
    };
}



