/*jslint browser:true, white:true, multivar:true, for:true*/
/*global window, document, GS, console, evt*/var autocompleteLoaded = true;
var autocompleteGlobals = {
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
      , 'arrVariables':    []
      , 'bolInserting':    false
      , 'strQueryID':      null
      , 'jsnKeywords':     {} // <-- filled in by the "autocompleteLoadKeywords" function
      , 'arrTypes':        [] // <-- filled in by the "autocompleteLoadTypes" function
      , 'arrSearchPath':   []
      , 'loadId':          0
      , 'arrCancelledIds': []
      , 'bolSnippets':     false
      , 'bolAlpha':        false
      , 'bolBound':        false
      , 'ignoreNext':      1
      , 'searchLength':    0
      , 'bolQueryRunning': false
      , 'bolQueryCanceled': false
      , 'bolSpecialFilter':  false
      , 'bolTestSlowDown':   false
      , 'quoteLevel':      0
    };
    
    
    

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



function autocompleteLoadTypes() {
    'use strict';
    var strQuery = ml(function () {/*
            SELECT string_agg(pg_type.typname, ',')
              FROM pg_catalog.pg_type
             WHERE (pg_type.typrelid = 0 OR (SELECT pg_class.relkind = 'c' FROM pg_catalog.pg_class WHERE pg_class.oid = pg_type.typrelid))
               AND (NOT EXISTS (SELECT TRUE FROM pg_catalog.pg_type elem WHERE elem.oid = pg_type.typelem AND elem.typarray = pg_type.oid))
               AND (pg_type.typtype <> 'd')
    */});

    autocompleteGlobals.bolQueryRunning = true;
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
        autocompleteGlobals.bolQueryRunning = false;
        //console.log('ending the query');
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

    autocompleteGlobals.bolQueryRunning = true;
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
        autocompleteGlobals.bolQueryRunning = false;
        //console.log('ending the query');
    });
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
    
    //autocompleteGlobals.bolQueryRunning = true;
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
        //autocompleteGlobals.bolQueryRunning = false;
        //console.log('ending the query');
    });
}



function findQuoteLevel(str_form_data, cursorPos) {
    "use strict";
	var int_inputstring_len;
	var int_qs = 0; // quote status
	var int_E_quote = 0; // for single quotes and backslash skipping
	var int_ps = 0; // parenthesis level
	var int_element_len = 0;
	var int_chunk_len = 0;
	var int_tag = 0;
	var int_last_query = 0;
	var int_tag_len = 0;
	var str_tag = '', str_temp = '', str_trailing = '';
	var strQuery = '';
	var intNotReset = 0;
	var currRow = 1;
	var currCol = 1;
	var bolIgnoreWhiteSpace = true;
	var bolFirstQuery = true;

	int_inputstring_len = str_form_data.length;
	// I considered copying input to local memory but we don't change it.
	//   So don't copy the entire item into a new variable, it could be large.
	var int_loop = 0;  // increments by one character per loop
	var int_start = 0; // increments when we push SQL to array


	// quote status
	// 0 => no quotes
	// 1 => start a dollar tag
	// 2 => have a dollar tag
	// 3 => single quote
	// 4 => double quote
	// 5 => multiline comment
	// 6 => line comment

	while (int_inputstring_len > 0) {
	    intNotReset += 1;
		//SDEBUG("1");
		//SDEBUG("int_loop: %s", int_loop);
		int_chunk_len = 1;
		int_element_len += int_chunk_len;

		if (bolIgnoreWhiteSpace) {
		    while (str_form_data.substr(int_loop, 1) === ' ' || str_form_data.substr(int_loop, 1) === "\n" || str_form_data.substr(int_loop, 1) === "\t" || str_form_data.substr(int_loop, 1) === "\r") {
                if (str_form_data.substr(int_loop, 1) === "\n") {
                    currRow += 1;
                    currCol = 0;
                } else {
                    currCol += int_chunk_len;
                }
		        //console.log(str_form_data.substr(int_loop, 1), int_loop, 'whitespace');
				int_loop += 1;
				intNotReset += 1;
				int_element_len += 1;
		    }
            intNotReset -= 1;
		    bolIgnoreWhiteSpace = false;
		}

// 		console.log(str_form_data.substr(int_loop, 1), int_loop, 'not whitespace');
		//console.log(str_form_data.substr(int_loop, 1), int_loop);
		//console.log((str_form_data.substr(int_loop, 1)));
		//SDEBUG("int_inputstring_len: %i, int_chunk_len: %i, int_element_len: %i ", int_inputstring_len, int_chunk_len,
		//	int_element_len);

		// if we're beginning a new element then strip white space
		/*if ( element_len === 1 && ( start_ptr[0] === ' ' || start_ptr[0] === '\r' || start_ptr[0] === '\n' || start_ptr[0] === '\t' ) ) {
			start_ptr = start_ptr + 1;
			element_len = 0;
			// SDEBUG("test start_ptr: %i;", start_ptr[0] );


		} else*/
		if (str_form_data.substr(int_loop, 1) === "\n") {
            currCol = 0;
            currRow += 1;
        } else {
            currCol += 1;
        }

		// FOUND MULTILINE COMMENT:
		if (int_qs === 0 && int_inputstring_len > 1 && str_form_data.substr(int_loop, 2) === "/*") {
			int_qs = 5;
		// console.log("found multiline comment");

			// ENDING MULTILINE COMMENT
		} else if (int_qs === 5 && int_inputstring_len > 1 && str_form_data.substr(int_loop, 2) === "*/") {
			int_qs = 0;
		// console.log("found end of multiline comment");

			// FOUND DASH COMMENT:
		} else if (int_qs === 0 && int_inputstring_len > 1 && str_form_data.substr(int_loop, 2) === "--") {
			int_qs = 6;
		// console.log("found dash comment");

			// ENDING DASH COMMENT
		} else if (int_qs === 6 && int_inputstring_len > 1 && (str_form_data.substr(int_loop, 1) === "\n" || str_form_data.substr(int_loop, 1) === "\r")) {
			int_qs = 0;
		// console.log("found end of dash comment");

			// CONSUME COMMENT
		} else if (int_qs === 6 || int_qs === 5) {
			// this speeds things up but it doesn't consume comments because we can't
			// overwrite the incoming pointer
			// and we don't memcpy one letter at a time, we copy each element as a
			// whole. Trying to get rid of SQL with
			// only comments in them is going to require a re-write

			// FOUND SLASH:  we don't skip slashed chars within dollar tags, double or single quotes and comments.
		} else if (str_form_data.substr(int_loop, 1) === "\\" && int_qs !== 4 && int_qs !== 2 && int_qs !== 5 && int_qs !== 6) {
			// skip next character
			int_loop = int_loop + int_chunk_len;
			int_inputstring_len -= int_chunk_len;
			int_chunk_len = 1;
			int_element_len += int_chunk_len;
		// console.log("found slash int_loop: %s", int_loop);

			// FOUND SINGLE QUOTE:
		} else if (int_qs === 0 && str_form_data.substr(int_loop, 1) === "'") {
			int_qs = 3;
			int_E_quote = (int_loop - 1) === 'E';
		// console.log("found single quote");

			// ENDING SINGLE QUOTE
		} else if (int_qs === 3 && str_form_data.substr(int_loop, 1) === "'") {
			int_qs = 0;
			int_E_quote = 0;
		// console.log("found end of single quote");

			// FOUND DOUBLE QUOTE:
		} else if (int_qs === 0 && str_form_data.substr(int_loop, 1) === "\"") {
			int_qs = 4;
		// console.log("found double quote");

			// ENDING DOUBLE QUOTE
		} else if (int_qs === 4 && str_form_data.substr(int_loop, 1) === "\"") {
			int_qs = 0;
		// console.log("found end of double quote");

			// FOUND OPEN PARENTHESIS:
		} else if (int_qs === 0 && str_form_data.substr(int_loop, 1) === "(") {
			int_ps = int_ps + 1;
		// console.log("found open parenthesis");

			// FOUND CLOSE PARENTHESIS
		} else if (int_qs === 0 && str_form_data.substr(int_loop, 1) === ")" && int_ps > 0) {
			int_ps = int_ps - 1;
		// console.log("found close parenthesis");

			// FOUND DOLLAR TAG START:
		} else if (int_qs === 0 && str_form_data.substr(int_loop, 1) === "$") {
		   //// console.log('start dollar tag');
			// we should be looking ahead here. get the tag or if false start then
			// just continue
			var int_test_loop = int_loop + 1;

            while (int_test_loop < int_inputstring_len && str_form_data.substr(int_test_loop, 1).match("^[a-zA-Z0-9_]$")) {
                int_test_loop += 1;
            }

			if (str_form_data.substr(int_test_loop, 1) === '$') {
				int_tag = (int_test_loop - (int_loop - 1));
				str_tag = str_form_data.substr(int_loop, int_tag);
				// we found the end of the tag, now look for the close tag
				int_loop += int_tag;
				intNotReset += int_tag;
				int_inputstring_len -= int_tag;
				int_element_len += int_tag;
                currCol += int_tag;
				int_qs = 2;
				// SDEBUG("after int_loop: %s", int_loop);
			} else {
				// false alarm, do nothing
			}

			// END DOLLAR TAG
		} else if (int_qs === 2 && str_form_data.substr(int_loop, str_tag.length) === str_tag)  {
			int_qs = 0;
			// move pointer to end of end dollar tag
			int_tag -= 1;
			int_element_len += int_tag;
			int_loop += int_tag;
			intNotReset += int_tag;
			currCol += int_tag;
			int_inputstring_len -= int_tag;
			// FOUND AN UNQUOTED/ UNPARENTHESISED SEMICOLON: || found end of document
		}
		int_loop += int_chunk_len;
		int_inputstring_len -= int_chunk_len;
	}
	return int_qs;


}





























