/*jslint white:true*/

// NOTES:                   Start   End
// Dash Comment             --      \r or \n
// Multi-line comment       /*      */
// Slash                    \       next char
// Single Quote             '       '
// Double Quote             "       "
// dollar tag               $$      $$
// custom dollar tag        $xx$    $xx$    case sensitive

// function sql_split(str_form_data) {
// 	var int_inputstring_len;
// 	var int_qs = 0; // quote status
// 	var int_E_quote = 0; // for single quotes and backslash skipping
// 	var int_ps = 0; // parenthesis level
// 	var int_element_len = 0;
// 	var int_chunk_len = 0;
// 	var int_tag = 0;
// 	var int_last_query = 0;
// 	var int_tag_len = 0;
// 	var str_tag = '', str_temp = '', str_trailing = '';
// 	var arr_list = [];
	

// 	int_inputstring_len = str_form_data.length;
// 	// I considered copying input to local memory but we don't change it.
// 	//   So don't copy the entire item into a new variable, it could be large.
// 	var int_loop = 0;  // increments by one character per loop
// 	var int_start = 0; // increments when we push SQL to array

// 	// quote status
// 	// 0 => no quotes
// 	// 1 => start a dollar tag
// 	// 2 => have a dollar tag
// 	// 3 => single quote
// 	// 4 => double quote
// 	// 5 => multiline comment
// 	// 6 => line comment

// 	while (int_inputstring_len > 0) {
// 		//SDEBUG("1");
// 		//SDEBUG("int_loop: %s", int_loop);
// 		int_chunk_len = 1;
// 		int_element_len += int_chunk_len;
// 		//SDEBUG("int_inputstring_len: %i, int_chunk_len: %i, int_element_len: %i ", int_inputstring_len, int_chunk_len,
// 		//	int_element_len);

// 		// if we're beginning a new element then strip white space
// 		/*if ( element_len === 1 && ( start_ptr[0] === ' ' || start_ptr[0] === '\r' || start_ptr[0] === '\n' || start_ptr[0] === '\t' ) ) {
// 			start_ptr = start_ptr + 1;
// 			element_len = 0;
// 			// SDEBUG("test start_ptr: %i;", start_ptr[0] );

// 		// FOUND MULTILINE COMMENT:
// 		} else*/ if (int_qs === 0 && int_inputstring_len > 1 && str_form_data.substr(int_loop, 2) === "/*") {
// 			int_qs = 5;
// 		// console.log("found multiline comment");

// 			// ENDING MULTILINE COMMENT
// 		} else if (int_qs === 5 && int_inputstring_len > 1 && str_form_data.substr(int_loop, 2) === "*/") {
// 			int_qs = 0;
// 		// console.log("found end of multiline comment");

// 			// FOUND DASH COMMENT:
// 		} else if (int_qs === 0 && int_inputstring_len > 1 && str_form_data.substr(int_loop, 2) === "--") {
// 			int_qs = 6;
// 		// console.log("found dash comment");

// 			// ENDING DASH COMMENT
// 		} else if (int_qs === 6 && int_inputstring_len > 1 && (str_form_data.substr(int_loop, 1) === "\n" || str_form_data.substr(int_loop, 1) === "\r")) {
// 			int_qs = 0;
// 		// console.log("found end of dash comment");

// 			// CONSUME COMMENT
// 		} else if (int_qs === 6 || int_qs === 5) {
// 			// this speeds things up but it doesn't consume comments because we can't
// 			// overwrite the incoming pointer
// 			// and we don't memcpy one letter at a time, we copy each element as a
// 			// whole. Trying to get rid of SQL with
// 			// only comments in them is going to require a re-write

// 			// FOUND SLASH:  we don't skip slashed chars within dollar tags, double or single quotes and comments.
// 		} else if (str_form_data.substr(int_loop, 1) === "\\" && int_qs !== 4 && int_qs !== 2 && int_qs !== 5 && int_qs !== 6) {
// 			// skip next character
// 			int_loop = int_loop + int_chunk_len;
// 			int_inputstring_len -= int_chunk_len;
// 			int_chunk_len = 1;
// 			int_element_len += int_chunk_len;
// 		// console.log("found slash int_loop: %s", int_loop);

// 			// FOUND SINGLE QUOTE:
// 		} else if (int_qs === 0 && str_form_data.substr(int_loop, 1) === "'") {
// 			int_qs = 3;
// 			int_E_quote = (int_loop - 1) === 'E';
// 		// console.log("found single quote");

// 			// ENDING SINGLE QUOTE
// 		} else if (int_qs === 3 && str_form_data.substr(int_loop, 1) === "'") {
// 			int_qs = 0;
// 			int_E_quote = 0;
// 		// console.log("found end of single quote");

// 			// FOUND DOUBLE QUOTE:
// 		} else if (int_qs === 0 && str_form_data.substr(int_loop, 1) === "\"") {
// 			int_qs = 4;
// 		// console.log("found double quote");

// 			// ENDING DOUBLE QUOTE
// 		} else if (int_qs === 4 && str_form_data.substr(int_loop, 1) === "\"") {
// 			int_qs = 0;
// 		// console.log("found end of double quote");

// 			// FOUND OPEN PARENTHESIS:
// 		} else if (int_qs === 0 && str_form_data.substr(int_loop, 1) === "(") {
// 			int_ps = int_ps + 1;
// 		// console.log("found open parenthesis");

// 			// FOUND CLOSE PARENTHESIS
// 		} else if (int_qs === 0 && str_form_data.substr(int_loop, 1) === ")" && int_ps > 0) {
// 			int_ps = int_ps - 1;
// 		// console.log("found close parenthesis");

// 			// FOUND DOLLAR TAG START:
// 		} else if (int_qs === 0 && str_form_data.substr(int_loop, 1) === "$") {
// 		   //// console.log('start dollar tag');
// 			// we should be looking ahead here. get the tag or if false start then
// 			// just continue
// 			var int_test_loop = int_loop + 1;

//             while (int_test_loop < int_inputstring_len && str_form_data.substr(int_test_loop, 1).match("^[a-zA-Z0-9_]$")) {
//                 int_test_loop += 1;
//             }
            
// 			if (str_form_data.substr(int_test_loop, 1) === '$') {
// 				int_tag = (int_test_loop - (int_loop - 1));
// 				// SDEBUG("int_tag: %i", int_tag);
// 				str_tag = str_form_data.substr(int_loop, int_tag);
// 				// SDEBUG("str_tag[0]: %s", str_tag);
// 				// we found the end of the tag, now look for the close tag
// 				int_loop += int_tag;
// 				int_inputstring_len -= int_tag;
// 				int_element_len += int_tag;
// 				int_qs = 2;
// 				// SDEBUG("after int_loop: %s", int_loop);
// 			} else {
// 				// false alarm, do nothing
// 			}

// 			// END DOLLAR TAG
// 		} else if (int_qs === 2 && str_form_data.substr(int_loop, str_tag.length) === str_tag)  {
// 		   ////// console.log('end dollar tag');
// 			// SDEBUG("END DOLLAR TAG START: %s", int_loop);
// 			// SDEBUG("int_tag: %i", int_tag);
// 			int_qs = 0;
// 			// move pointer to end of end dollar tag
// 			int_tag -= 1;
// 			int_element_len += int_tag;
// 			int_loop += int_tag;
// 			int_inputstring_len -= int_tag;
// 			// SDEBUG("found end dollar tag");
// 			// SDEBUG("End dollar tag: 2: end int_loop: %s", int_loop);

// 			// FOUND AN UNQUOTED/ UNPARENTHESISED SEMICOLON:
// 		} else if (int_ps === 0 && int_qs === 0 && str_form_data.substr(int_loop, 1) === ";") {
// 		// console.log("found semicolon;");
// 			// stash away this array element

// 			str_temp = str_form_data.substr(int_start, int_element_len);
// 			arr_list.push(str_temp);
			
// // 			memcpy(str_tag, int_loop, int_tag);
// // 			str_tag = str_form_data.substr(int_loop, int_tag);
// 			// SDEBUG("arr_list[%i]: %s", DArray_count(arr_list), str_temp);
// 			// SDEBUG("int_start: %s, element_len: %i", int_start, int_element_len);

// 			int_start = int_loop + int_chunk_len;
// 			int_element_len = 0;
// 			str_temp = '';
// 		}
// 		int_loop += int_chunk_len;
// 		int_inputstring_len -= int_chunk_len;
// 		// SDEBUG("END: %s, int_ps: %i, int_qs: %i, element_len: %i, inputstring_len: %i", int_loop, int_ps, int_qs, int_element_len, int_inputstring_len);
// 	}
// 	// SDEBUG("int_element_len: %i, int_loop: %s, int_start: %s;", int_element_len, int_loop, int_start);
// 	// SDEBUG("int_ps: %i, int_qs: %i, int_element_len: %i", int_ps, int_qs, int_element_len);

// 	// if we have a trailing SQL statement (or nothing in form data at all)
// 	if (int_element_len > 0) {
// 		// if you are reading this see the comment above marked "consume comment"

// 		// stash away this array element

//         str_temp = str_form_data.substr(int_start, int_element_len);
// 		arr_list.push(str_temp);
// 		// SDEBUG("int_start: %i", int_start);
// 		// SDEBUG("int_loop: %i", int_loop);
// 		// SDEBUG("int_element_len: %i", int_element_len);
// 	}
// 	// DEBUG("done");

// 	int_last_query = arr_list.length - 1;
// 	var str_last_query = arr_list[int_last_query];
// 	var ptr_end_query = str_last_query + str_last_query.length;
// 	int_qs = 0;
// 	int_loop = str_last_query;
// 	int_inputstring_len = str_last_query.length;
// 	// SDEBUG("START WHILE LAST ONE");
// 	while (str_last_query.length < ptr_end_query.length) {
// 	   // console.log(str_last_query.length, ptr_end_query.length);
// 		int_chunk_len = 1;
// 		if (int_qs === 0 && int_inputstring_len > 1 && str_form_data.substr(int_loop, int_chunk_len + 1) === "/*") {
// 			int_qs = 5;
// 			// SDEBUG("found multiline comment: %c", *int_loop);

// 			// ENDING MULTILINE COMMENT
// 		} else if (int_qs === 5 && int_inputstring_len > 1 && str_form_data.substr(int_loop, int_chunk_len + 1) === "*/") {
// 			int_qs = 0;
// 			// SDEBUG("found end of multiline comment: %c", *int_loop);
// 			str_last_query += 1;
// 			int_loop += int_chunk_len;
// 			int_inputstring_len -= int_chunk_len;

// 			// FOUND DASH COMMENT:
// 		} else if (int_qs === 0 && int_inputstring_len > 1 && str_form_data.substr(int_loop, int_chunk_len + 1) === "--") {
// 			int_qs = 6;
// 			// SDEBUG("found dash comment: %c", *int_loop);

// 			// ENDING DASH COMMENT
// 		} else if (int_qs === 6 && (str_form_data.substr(int_loop, int_chunk_len) === "\n" || str_form_data.substr(int_loop, int_chunk_len) === "\r")) {
// 			int_qs = 0;
// 			// SDEBUG("found end of dash comment: %c", *int_loop);

// 			// CONSUME COMMENT
// 		} else if (int_qs === 6 || int_qs === 5) {
// 			// this speeds things up but it doesn't consume comments because we can't
// 			// overwrite the incoming pointer
// 			// and we don't memcpy one letter at a time, we copy each element as a
// 			// whole. Trying to get rid of SQL with
// 			// only comments in them is going to require a re-write
// 			// SDEBUG("COMMENTS: %c", *int_loop);

// 			// FOUND SLASH:  we don't skip slashed chars within dollar tags, double
// 			// quotes and comments.
// 		} else if (str_form_data.substr(int_loop, int_chunk_len + 1) === "\\" && int_qs !== 4 && int_qs !== 2 && int_qs !== 5 && int_qs !== 6) {
// 			// skip next character
// 			int_loop = int_loop + int_chunk_len;
// 			int_inputstring_len -= int_chunk_len;
// 			int_chunk_len = 1;
// 			int_element_len += int_chunk_len;
// 			str_last_query += 1;
// 			// SDEBUG("found slash int_loop: %s", int_loop);
// 		} else if (str_last_query > -1 && str_last_query.trim() === '') {
// 			// SDEBUG("SPACE: %c", *int_loop);
// 			// STARTING MULTILINE COMMENT
// 		} else {
// 			// SDEBUG("BREAK int_loop: %s, str_last_query: %s, int_qs: %d", int_loop, str_last_query, int_qs);
// 			break;
// 		}
// 		str_last_query += int_chunk_len;
// 		int_loop += int_chunk_len;
// 		int_inputstring_len -= int_chunk_len;
// 	}
// 	if (str_last_query === 0) {
// 		str_last_query = arr_list.pop();
// 	}

// 	return arr_list;
// }

// //the test function should have it run the split function and then check it against the correct output
// function sql_split_test (strText, strCompText) {
//     var arrSplitSQL = sql_split(strText), bolPass = true;
//     for (var i = 0, len = arrSplitSQL.length; i < len; i++) {
//         if (arrSplitSQL[i] === strCompText[i]) {
//             bolPass = true;
//         } else {
//             bolPass = false;
//         }
//         if (bolPass === false) {
//             console.error('FAIL', arrSplitSQL, strCompText, i);
//             break;
//         } else if (i === len - 1) {
//             //console.log('PASS');
//         }
//     }
//     }
    


// window.addEventListener('load', function () {
//   console.log("CHECKING SINGLE QUOTES");
//   // check that single quotes work
//   var strText, strCompText;
  
// strText = "SELECT sql.untaint('test;'); SELECT sql.untaint('test;');";
// strCompText = ["SELECT sql.untaint('test;');", " SELECT sql.untaint('test;');"];
// sql_split_test(strText, strCompText);
// // console.log("check that single quotes work with wide char");
// strText = "SELECT sql.untaint('testÃ Â¾Â ;'); SELECT sql.untaint('test;');";
// strCompText = ["SELECT sql.untaint('testÃ Â¾Â ;');", " SELECT sql.untaint('test;');"];
// sql_split_test(strText, strCompText);
// // console.log("check that single quotes ignore slashed single quot");
// strText = "SELECT sql.untaint('test\\';'); SELECT sql.untaint('test;');";
// strCompText = ["SELECT sql.untaint('test\\';');", " SELECT sql.untaint('test;');"];
// sql_split_test(strText, strCompText);
// // console.log("check that single quotes ignore slashed dbl quot");
// strText = "SELECT sql.untaint('test\\\";'); SELECT sql.untaint('test;');";
// strCompText = ["SELECT sql.untaint('test\\\";');", " SELECT sql.untaint('test;');"];
// sql_split_test(strText, strCompText);
// // console.log("check that single quotes ignore dollar signs");
// strText = "SELECT sql.untaint('test$;'); SELECT sql.untaint('test;');";
// strCompText = ["SELECT sql.untaint('test$;');", " SELECT sql.untaint('test;');"];
// sql_split_test(strText, strCompText);
// // console.log("check that single quotes ignore dash comment");
// strText = "SELECT sql.untaint('test--;'); SELECT sql.untaint('test;');";
// strCompText = ["SELECT sql.untaint('test--;');", " SELECT sql.untaint('test;');"];
// sql_split_test(strText, strCompText);
// // console.log("check that single quotes ignore multiline comments");
// strText = "SELECT sql.untaint('test/*;'); SELECT sql.untaint('test;');";
// strCompText = ["SELECT sql.untaint('test/*;');", " SELECT sql.untaint('test;');"];
// sql_split_test(strText, strCompText);


// console.log("CHECKING DOLLAR TAGS");
// strText = "SELECT sql.untaint($$test;$$); SELECT sql.untaint($$test;$$);";
// strCompText = ["SELECT sql.untaint($$test;$$);", " SELECT sql.untaint($$test;$$);"]
// sql_split_test(strText, strCompText);
// // console.log("check that $$ tags work with wide char");
// strText = "SELECT sql.untaint($$testÃ Â¾Â ;$$); SELECT sql.untaint($$test;$$);";
// strCompText = ["SELECT sql.untaint($$testÃ Â¾Â ;$$);", " SELECT sql.untaint($$test;$$);"];
// sql_split_test(strText, strCompText);
// // console.log("check that $$ tags exclude non-matching dollar sign");
// strText = "SELECT sql.untaint($$test$;$$); SELECT sql.untaint($$test;$$);";
// strCompText = ["SELECT sql.untaint($$test$;$$);", " SELECT sql.untaint($$test;$$);"];
// sql_split_test(strText, strCompText);
// // console.log("check that $a$ tags exclude non-matching dollar signs (extra semicolons");
// strText = "SELECT sql.untaint($$test;;$aa;$$); SELECT sql.untaint($$test;$$);";
// strCompText = ["SELECT sql.untaint($$test;;$aa;$$);", " SELECT sql.untaint($$test;$$);"];
// sql_split_test(strText, strCompText);
// // console.log("check that $$ tags exclude single quot");
// strText = "SELECT sql.untaint($$test';$$); SELECT sql.untaint($$test;$$);";
// strCompText = ["SELECT sql.untaint($$test';$$);", " SELECT sql.untaint($$test;$$);"];
// sql_split_test(strText, strCompText);
// // console.log("check that $$ tags exclude backslash single quot");
// strText = "SELECT sql.untaint($$test\';$$); SELECT sql.untaint($$test;$$);";
// strCompText = ["SELECT sql.untaint($$test\';$$);", " SELECT sql.untaint($$test;$$);"];
// sql_split_test(strText, strCompText);
// // console.log("check that $$ tags exclude dbl quot");
// strText = "SELECT sql.untaint($$test\";$$); SELECT sql.untaint($$test;$$);";
// strCompText = ["SELECT sql.untaint($$test\";$$);", " SELECT sql.untaint($$test;$$);"];
// sql_split_test(strText, strCompText);
// // console.log("check that $$ tags interprets slashes as normal chars: SELECT $$\$$");
// strText = "SELECT sql.untaint($$test;\\$$); SELECT sql.untaint($$test;$$);";
// strCompText = ["SELECT sql.untaint($$test;\\$$);", " SELECT sql.untaint($$test;$$);"];
// sql_split_test(strText, strCompText);
// // console.log("check that $$ tags ignores single quotes: SELECT $$\$$");
// strText = "SELECT sql.untaint($$test--;$$); SELECT sql.untaint($$test;$$);";
// strCompText = ["SELECT sql.untaint($$test--;$$);", " SELECT sql.untaint($$test;$$);"];
// sql_split_test(strText, strCompText);
// // console.log("check that $$ tags ignores double quotes: SELECT $$\$$");
// strText = "SELECT sql.untaint($$test/*;$$); SELECT sql.untaint($$test;$$);";
// strCompText = ["SELECT sql.untaint($$test/*;$$);", " SELECT sql.untaint($$test;$$);"];
// sql_split_test(strText, strCompText);

// console.log("CHECKING NAMED TAGS");
// strText = "SELECT sql.untaint($a$test;$a$); SELECT sql.untaint($a$test;$a$);";
// strCompText = ["SELECT sql.untaint($a$test;$a$);", " SELECT sql.untaint($a$test;$a$);"];
// sql_split_test(strText, strCompText);
// // console.log("check that $a$ tags work with wide chars");
// strText = "SELECT sql.untaint($a$testÃ Â¾Â ;$a$); SELECT sql.untaint($a$test;$a$);";
// strCompText = ["SELECT sql.untaint($a$testÃ Â¾Â ;$a$);", " SELECT sql.untaint($a$test;$a$);"];
// sql_split_test(strText, strCompText);
// // console.log("check that $a$ tags exclude non-matching dollar signs");
// strText = "SELECT sql.untaint($a$test$;$a$); SELECT sql.untaint($a$test;$a$);";
// strCompText = ["SELECT sql.untaint($a$test$;$a$);", " SELECT sql.untaint($a$test;$a$);"];
// sql_split_test(strText, strCompText);
// // console.log("check that $a$ tags exclude non-matching dollar signs (extra semicolons)");
// strText = "SELECT sql.untaint($a$test;;$aa;$a$); SELECT sql.untaint($a$test;$a$);";
// strCompText = ["SELECT sql.untaint($a$test;;$aa;$a$);", " SELECT sql.untaint($a$test;$a$);"];
// sql_split_test(strText, strCompText);
// // console.log("check that $a$ tags exclude single quote");
// strText = "SELECT sql.untaint($a$test';$a$); SELECT sql.untaint($a$test;$a$);";
// strCompText = ["SELECT sql.untaint($a$test';$a$);", " SELECT sql.untaint($a$test;$a$);"];
// sql_split_test(strText, strCompText);
// // console.log("check that $a$ tags exclude dbl quote");
// strText = "SELECT sql.untaint($a$test\";$a$); SELECT sql.untaint($a$test;$a$);";
// strCompText = ["SELECT sql.untaint($a$test\";$a$);", " SELECT sql.untaint($a$test;$a$);"];
// sql_split_test(strText, strCompText);
// // console.log("check that $a$ tags interprets slashes as normal chars: SELECT $a$\$;");
// strText = "SELECT sql.untaint($a$test\\$a$); SELECT sql.untaint($a$test;$a$);";
// strCompText = ["SELECT sql.untaint($a$test\\$a$);", " SELECT sql.untaint($a$test;$a$);"];
// sql_split_test(strText, strCompText);
// // console.log("check that $a$ tags ignores dash comments");
// strText = "SELECT sql.untaint($a$test--;$a$); SELECT sql.untaint($a$test;$a$);";
// strCompText = ["SELECT sql.untaint($a$test--;$a$);", " SELECT sql.untaint($a$test;$a$);"];
// sql_split_test(strText, strCompText);
// // console.log("check that $a$ tags ignores multiline comments");
// strText = "SELECT sql.untaint($a$test/*;$a$); SELECT sql.untaint($a$test;$a$);";
// strCompText = ["SELECT sql.untaint($a$test/*;$a$);", " SELECT sql.untaint($a$test;$a$);"];
// sql_split_test(strText, strCompText);

// console.log("CHECKING DOUBLE QUOTES");
// // console.log("check that dbl quotes work: SELECT "text_example" FROM wfp.aatest;");
// strText = "SELECT sql.untaint(\"test;\"); SELECT sql.untaint(\"test;\");";
// strCompText = ["SELECT sql.untaint(\"test;\");", " SELECT sql.untaint(\"test;\");"];
// sql_split_test(strText, strCompText);
// // console.log("Anything goes within dbl quotes...");
// // console.log("check that dbl quotes doesn't choke on wide chars: ALTER TABLE wfp.aatest ADD COLUMN "wegbÃ Â¾Â " text; SELECT chr(4000)");
// strText = "SELECT sql.untaint(\"testÃ Â¾Â ;Ã Â¾Â \"); SELECT sql.untaint(\"test;\");";
// strCompText = ["SELECT sql.untaint(\"testÃ Â¾Â ;Ã Â¾Â \");", " SELECT sql.untaint(\"test;\");"];
// sql_split_test(strText, strCompText);
// // console.log("check that dbl quotes interprets slashes as normal chars: ALTER TABLE wfp.aatest ADD COLUMN "wegb\" text;");
// // console.log("  a slash would normally cause next character (dbl quote) to be ignored.");
// strText = "SELECT sql.untaint(\"test;\\\"); SELECT sql.untaint(\"test;\");";
// strCompText = ["SELECT sql.untaint(\"test;\\\");", " SELECT sql.untaint(\"test;\");"];
// sql_split_test(strText, strCompText);
// // console.log("check that dbl quotes interprets dollar signs as normal chars");
// strText = "SELECT sql.untaint(\"test$;\"); SELECT sql.untaint(\"test;\");";
// strCompText = ["SELECT sql.untaint(\"test$;\");", " SELECT sql.untaint(\"test;\");"];
// sql_split_test(strText, strCompText);
// // console.log("check that dbl quotes interprets single quotes as normal chars");
// strText =  "SELECT sql.untaint(\"test';\"); SELECT sql.untaint(\"test;\");";
// strCompText = ["SELECT sql.untaint(\"test';\");", " SELECT sql.untaint(\"test;\");"];
// sql_split_test(strText, strCompText);
// // console.log("check that dbl quotes ignores dash comments");
// strText = "SELECT sql.untaint(\"test--;\"); SELECT sql.untaint(\"test;\");";
// strCompText = ["SELECT sql.untaint(\"test--;\");", " SELECT sql.untaint(\"test;\");"];
// sql_split_test(strText, strCompText);
// // console.log("check that dbl quotes ignores multiline comments");
// strText = "SELECT sql.untaint(\"test/*;\"); SELECT sql.untaint(\"test;\");"
// strCompText = ["SELECT sql.untaint(\"test/*;\");", " SELECT sql.untaint(\"test;\");"];
// sql_split_test(strText, strCompText);

// console.log("CHECKING NO QUOTES");
// // console.log("check that no quotes interprets single dollar as normal character if followed by other than [a-z0-9A-Z_]");
// strText = "SELECT sql.untaint($a$test;$a$)$; SELECT sql.untaint($a$test;$a$\");";
// strCompText = ["SELECT sql.untaint($a$test;$a$)$;", " SELECT sql.untaint($a$test;$a$\");"];
// sql_split_test(strText, strCompText);

// console.log("CHECKING COMMENTS");
// // console.log("check that multiline comments ignore everything");
// strText = "/*SELECT sql.untaint();\\*/ SELECT sql.untaint(); SELECT current_date;";
// strCompText = ["/*SELECT sql.untaint();\\*/ SELECT sql.untaint();", " SELECT current_date;"];
// sql_split_test(strText, strCompText);
// // console.log("check that dash comments ignore everything but \n");
// strText = "--SELECT sql.untaint();\n SELECT sql.untaint(); SELECT current_date;";
// strCompText = ["--SELECT sql.untaint();\n SELECT sql.untaint();", " SELECT current_date;"];
// sql_split_test(strText, strCompText);

// console.log("###");
// // console.log("check that dash comments ignore everything but \r");
// strText = "--SELECT sql.untaint();\r\n SELECT sql.untaint(); SELECT current_date;";
// strCompText = ["--SELECT sql.untaint();\r\n SELECT sql.untaint();", " SELECT current_date;"];
// sql_split_test(strText, strCompText);

    
// });

function findSqlQueryFromCursor(str_form_data, cursorPos) {
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
	var cursorIsInQuery = false;
	var bolLastQuery = false
	var query_start_row = 0;
	var query_end_row = 1;
	var query_start_col = 1;
	var query_end_col = 0;
	var currRow = 1;
	var currCol = 1;
	var bolIgnoreWhiteSpace = true;

	int_inputstring_len = str_form_data.length;
	// I considered copying input to local memory but we don't change it.
	//   So don't copy the entire item into a new variable, it could be large.
	var int_loop = 0;  // increments by one character per loop
	var int_start = 0; // increments when we push SQL to array
    
    //change from array to String
    //keep track of query start and end
    //when we find an unquoted SEMICOLON then 
    //if the next number is cursorPos
    //  return the String
    //if we find the cursor in the query elsewhere then
    //  set bolLastQuery to true
    // when we get to the if bolLastQuery is true return the query text
    
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
		if (intNotReset === cursorPos) {
		    bolLastQuery = true;
		    //console.log(cursorIsInQuery);
		}
		if (cursorPos === 0) {
		    if (intNotReset === cursorPos + 1) {
    		    bolLastQuery = true;
    		    //console.log(cursorIsInQuery);
    		}
		}
		
		if (bolIgnoreWhiteSpace) {
		    while (str_form_data.substr(int_loop, 1) === " " || str_form_data.substr(int_loop, 1) === "\t" || str_form_data.substr(int_loop, 1) === "\n") {
                if (str_form_data.substr(int_loop, 1) === "\n") {
                    currRow += 1;
                    currCol = 0;
                } else {
                    currCol += int_chunk_len;
                }
		        //console.log(str_form_data.substr(int_loop, 1), int_loop, 'please');
				int_loop += int_chunk_len;
				int_inputstring_len -= int_chunk_len;
				int_element_len += int_chunk_len;
		    }
		    query_start_row += currRow - query_start_row - 1;
            query_start_col = currCol;
		    bolIgnoreWhiteSpace = false;
		}
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
			currCol += int_tag;
			int_inputstring_len -= int_tag;
			// FOUND AN UNQUOTED/ UNPARENTHESISED SEMICOLON: || found end of document
		} else if (int_ps === 0 && int_qs === 0 && str_form_data.substr(int_loop, 1) === ";" || str_form_data.length - 1 === int_loop) {
		// console.log("found semicolon;");
			// stash away this array element

			str_temp = str_form_data.substr(int_start, int_element_len);
			
			//console.log(cursorIsInQuery);
			//if (cursorIsInQuery) {
			if ((int_element_len + 1 === cursorPos) || bolLastQuery) {
			    strQuery = str_temp;
			    //console.log(str_temp);
			    query_end_row = currRow - 1;
                query_end_col = currCol;
			    break;
			} else {
			    
			}
			
			int_start = int_loop + int_chunk_len;
			int_element_len = 0;
			str_temp = '';
		    query_start_row = currRow;
            query_start_col = 0;
            bolIgnoreWhiteSpace = true;
		}
		int_loop += int_chunk_len;
		int_inputstring_len -= int_chunk_len;
	}

	// if we have a trailing SQL statement (or nothing in form data at all)
	if (int_element_len > 0) {
		// if you are reading this see the comment above marked "consume comment"

		// stash away this array element

        str_temp = str_form_data.substr(int_start, int_element_len);
		//strQuery = str_temp;
		// SDEBUG("int_start: %i", int_start);
		// SDEBUG("int_loop: %i", int_loop);
		// SDEBUG("int_element_len: %i", int_element_len);
	}
    
    //console.log(query_start_col, query_start_row, query_end_col, query_end_row);
    
	return {
	     'strQuery':       strQuery
	    ,'end_column':     query_end_col
	    ,'end_row':        query_end_row
	    ,'start_column':   query_start_col
	    ,'start_row':      query_start_row
	};


}



// var strCursorSplitText = ml(function () {/*
// SELECT *, 'SELECT * FROM test.asdf' AS ";"
// FROM wiki.rgroups
// Limit 10;
// SELECT *, 'SELECT * FROM test.asdf' AS ";"
// FROM wiki.rgroups
// Limit 10;
// SELECT *, 'SELECT * FROM test.asdf' AS ";"
// FROM wiki.rgroups
// Limit 10;
// SELECT *, 'SELECT * FROM test.asdf' AS ";"
// --FROM wiki.rgroups;
// Limit 10;
// */});
// var arrSplitSQLFromPos = findSqlQueryFromCursor(strCursorSplitText, 50);










































