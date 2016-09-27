#include "util_string.h"

bool check_to_escape(char *str_input, bool bol_as_ident) {
	char *ptr_input = str_input;
	char *ptr_end_input = (str_input + strlen(str_input)) - 1;
	size_t int_num_quotes = 0;
	while (isspace(*ptr_input)) {
		ptr_input++;
	}
	while (isspace(*ptr_end_input)) {
		ptr_end_input--;
	}
	if (!bol_as_ident && *ptr_input == 'E') {
		ptr_input++;
	}

	if (!bol_as_ident && (*ptr_input != '\'' || *ptr_end_input != '\'')) {
		return true;
	}
	if (bol_as_ident && (*ptr_input != '"' || *ptr_end_input != '"')) {
		return true;
	}
	ptr_input++;

	while (ptr_input < ptr_end_input) {
		if (( bol_as_ident && *ptr_input != '"'  && int_num_quotes > 0 && (int_num_quotes % 2) == 0) ||
			(!bol_as_ident && *ptr_input != '\'' && int_num_quotes > 0 && (int_num_quotes % 2) == 0)) {
			return true;
		} else if ( ( bol_as_ident && *ptr_input == '"' ) ||
					(!bol_as_ident && *ptr_input == '\'')) {
			int_num_quotes += 1;
		} else {
			int_num_quotes = 0;
		}
		ptr_input++;
	}

	return (int_num_quotes % 2) != 0;
}

char *escape_value(char *str_input) {
	size_t int_length = strlen(str_input);
	return bescape_value(str_input, &int_length);
}

char *bescape_value(char *str_input, size_t *ptr_int_length) {
	char *str_return = NULL;
	SERROR_SALLOC(str_return, (*ptr_int_length) + 1);
	memcpy(str_return, str_input, *ptr_int_length);
	str_return[*ptr_int_length] = '\0';

	SERROR_BREPLACE(str_return, ptr_int_length, "\\", "\\\\", "g");
	SERROR_BREPLACE(str_return, ptr_int_length, "\t", "\\t", "g");
	SERROR_BREPLACE(str_return, ptr_int_length, "\012", "\\n", "g");
	SERROR_BREPLACE(str_return, ptr_int_length, "\015", "\\r", "g");

	return str_return;
error:
	bol_error_state = false;
	SFREE(str_return);
	return NULL;
}

char *unescape_value(char *str_input) {
	size_t int_length = strlen(str_input);
	return bunescape_value(str_input, &int_length);
}

char *bunescape_value(char *str_input, size_t *ptr_int_length) {
	char *str_return = NULL;
	SERROR_SALLOC(str_return, (*ptr_int_length) + 1);
	memcpy(str_return, str_input, *ptr_int_length);
	str_return[*ptr_int_length] = '\0';

	SERROR_BREPLACE(str_return, ptr_int_length, "\\r", "\015", "g");
	SERROR_BREPLACE(str_return, ptr_int_length, "\\n", "\012", "g");
	SERROR_BREPLACE(str_return, ptr_int_length, "\\t", "\t", "g");
	SERROR_BREPLACE(str_return, ptr_int_length, "\\\\", "\\", "g");

	return str_return;
error:
	bol_error_state = false;
	SFREE(str_return);
	return NULL;
}

char *replace(char *str_input, char *str_find_in, char *str_replace_in, char *str_flags) {
	size_t int_length = strlen(str_input);
	return breplace(str_input, &int_length, str_find_in, str_replace_in, str_flags);
}

char *breplace(char *str_input, size_t *ptr_int_length, char *str_find_in, char *str_replace_in, char *str_flags) {
	char *str_return = NULL;
	SDEFINE_VAR_ALL(str_buffer, str_find, str_replace);

	SERROR_CAT_CSTR(str_return, "");
	SERROR_CAT_CSTR(str_find, str_find_in);
	SERROR_CAT_CSTR(str_replace, str_replace_in);
	if (strchr(str_flags, 'i') != NULL) {
		str_find = str_tolower(str_find);
		str_replace = str_tolower(str_replace);
	}

	size_t int_find_length = strlen(str_find);
	size_t int_replace_length = strlen(str_replace);
	size_t int_return_length = 0;

	char *ptr_last_input = str_input;
	char *ptr_input = str_input;
	char *ptr_end_input = str_input + (*ptr_int_length);
	size_t int_buffer_length;

	bool bol_continue = true;
	while ((ptr_input = bstrstr(ptr_input, (size_t)(ptr_end_input - ptr_input), str_find, int_find_length)) != NULL &&
		   bol_continue) {
		// get everything up to the instance of str_find into str_buffer
		int_buffer_length = (size_t)(ptr_input - ptr_last_input);
		SERROR_SALLOC(str_buffer, int_buffer_length + 1);
		memcpy(str_buffer, ptr_last_input, int_buffer_length);
		str_buffer[int_buffer_length] = '\0';

		// append str_buffer and str_replace into str_output
		SERROR_SREALLOC(str_return, int_return_length + int_buffer_length + int_replace_length + 1);
		memcpy(str_return + int_return_length, str_buffer, int_buffer_length);
		memcpy(str_return + int_return_length + int_buffer_length, str_replace, int_replace_length);
		str_return[int_return_length + int_buffer_length + int_replace_length] = '\0';
		int_return_length += int_buffer_length + int_replace_length;

		SFREE(str_buffer);
		ptr_input += int_find_length;
		ptr_last_input = ptr_input;

		if (strchr(str_flags, 'g') == NULL) {
			// this will prevent more than one replacement if there is no global flag
			bol_continue = false;
		}
	}

	// get everything up to the end of the input into str_buffer
	// SDEBUG("ptr_end_input - ptr_last_input: %d", ptr_end_input -
	// ptr_last_input);
	// SDEBUG("ptr_end_input:%s", ptr_end_input);
	// SDEBUG("ptr_last_input:%s", ptr_last_input);
	int_buffer_length = (size_t)(ptr_end_input - ptr_last_input);
	SERROR_SALLOC(str_buffer, int_buffer_length + 1);
	memcpy(str_buffer, ptr_last_input, int_buffer_length);
	str_buffer[int_buffer_length] = '\0';

	// append str_buffer into str_output
	SERROR_SREALLOC(str_return, int_return_length + int_buffer_length + 1);
	memcpy(str_return + int_return_length, str_buffer, int_buffer_length);
	str_return[int_return_length + int_buffer_length] = '\0';

	(*ptr_int_length) = int_return_length + int_buffer_length;

	SFREE_ALL();
	SFREE(str_input);

	return str_return;
error:
	SFREE_ALL();
	SFREE(str_return);
	SFREE(str_input);
	bol_error_state = false;
	return NULL;
}
/*
bool match_first_char(char *str_pattern, const char *str_string) {
		DEFINE_VAR_ALL(str_char);
		// SDEBUG("match_one_char");
		int int_status;
		regex_t re;
		regex_t *ptr_re = &re;
		SERROR_SALLOC(str_char, 2);
		str_char[1] = '\0';

		memcpy(str_char, str_string, 1);

		int_status = regcomp(ptr_re, str_pattern, REG_EXTENDED | REG_NOSUB);
		SERROR_CHECK(int_status == 0, "regcomp failed");

		int_status = regexec(ptr_re, str_char, (size_t)0, NULL, 0);
		SERROR_CHECK(int_status == 0, "regexec failed");

		regfree(ptr_re);
		ptr_re = NULL;
		SFREE(str_char);
		SDEBUG("match_one_char END");
		SFREE_ALL();
		return true;
error:
		if (ptr_re)
				regfree(ptr_re);
		SFREE_ALL();
		return false;
}

// Return 1 for match, 0 for no match.
regmatch_t *sunny_regex(char *str_pattern, char *str_input) {
		SDEBUG("sunny_regex");
		int int_status;
		regex_t *re = NULL;
		size_t nmatch = 1;
		regmatch_t *pmatch = NULL;
		SERROR_SALLOC(re, sizeof(regex_t));
		SERROR_SALLOC(pmatch, sizeof(regmatch_t));

		SERROR_CHECK(regcomp(re, str_pattern, REG_EXTENDED) == 0, "sunny_regex
comp error");
		int_status = regexec(re, str_input, nmatch, pmatch, 0);
		SERROR_CHECK(int_status == 0 || int_status == REG_NOMATCH, "sunny_regex
exec error");

		SDEBUG("sunny_regex exec return>%d<", int_status);
		SDEBUG("sunny_regex END>%d|%d<", pmatch->rm_so, pmatch->rm_eo);
		regfree(re);
		SFREE(re);
		re = NULL;
		if (int_status == 0) {
				return pmatch;
		} else {
				SFREE(pmatch);
				return NULL;
		}
error:
		if (re != NULL) {
				regfree(re);
				SFREE(re);
		}
		SFREE(pmatch);
		return NULL;
}
*/
// case uri with percent encoded hex to utf-8
char *uri_to_cstr(char *loop_ptr, size_t *inputstring_len) {
	char *result_text = NULL;
	char *result_ptr;
	size_t result_len;
	size_t chunk_len;
	char *x;

	// Dangerous loops ahead. We could go infinite if we aren't
	//   careful. So lets check for interrupts.
	SERROR_SALLOC(result_text, 1);
	result_len = 0;
	char buffer[3];
	buffer[2] = 0;

	while (*inputstring_len > 0) {
		chunk_len = 1;

		// SDEBUG("loop_ptr: %s, chunk_len: %i, inputlen: %i", loop_ptr, chunk_len,
		// inputstring_len );
		// SDEBUG("result_ptr: %s, result_len: %i ", result_ptr, result_len );

		// check for % characters
		//   if found, decode as percent encoded hex
		if (strncmp(loop_ptr, "%", 1) == 0) {
			x = loop_ptr + 1;
			// SDEBUG("percent detected");

			// check if two digits  00..7F  //SELECT net.uri_to_text(E':%20:') =>
			// space
			// character;
			if ((strncmp(x, "0", 1) >= 0 && strncmp(x, "7", 1) <= 0) &&
				((strncmp(x + 1, "0", 1) >= 0 && strncmp(x + 1, "9", 1) <= 0) ||
					(strncasecmp(x + 1, "a", 1) >= 0 && strncasecmp(x + 1, "f", 1) <= 0))) {
				// SDEBUG("We have a one byte char. strtol:%ld;", strtol( x, 0, 16)
				// );
				SERROR_SREALLOC(result_text, result_len + 1);
				memcpy(buffer, x, 2);
				result_text[result_len] = (char)strtol(buffer, 0, 16);
				result_len += 1;
				chunk_len = 3;

				// check if four digits C2..DF  //SELECT
				// net.uri_to_text(E':%c4%b3'); => combined ij char
			} else if ((strncasecmp(x, "c", 1) == 0) &&
					   ((strncmp(x + 1, "2", 1) >= 0 && strncmp(x + 1, "9", 1) <= 0) ||
						   (strncasecmp(x + 1, "a", 1) >= 0 && strncasecmp(x + 1, "f", 1) <= 0))) {
				// SDEBUG("We have a two byte char 'C' x:%s;", x);
				SERROR_SREALLOC(result_text, result_len + 2);
				memcpy(buffer, x, 2);
				result_text[result_len] = (char)strtol(buffer, 0, 16);
				memcpy(buffer, x + 3, 2);
				result_text[result_len + 1] = (char)strtol(buffer, 0, 16);
				result_len += 2;
				chunk_len = 6;

				// check if four digits C2..DF
			} else if ((strncasecmp(x, "d", 1) == 0) &&
					   ((strncmp(x + 1, "0", 1) >= 0 && strncmp(x + 1, "9", 1) <= 0) ||
						   (strncasecmp(x + 1, "a", 1) >= 0 && strncasecmp(x + 1, "f", 1) <= 0))) {
				// DEBUG("We have a two byte char 'D'");
				SERROR_SREALLOC(result_text, result_len + 2);
				memcpy(buffer, x, 2);
				result_text[result_len] = (char)strtol(buffer, 0, 16);
				memcpy(buffer, x + 3, 2);
				result_text[result_len + 1] = (char)strtol(buffer, 0, 16);
				result_len += 2;
				chunk_len = 6;

				// check if six digits E0, E1..EC, ED, EE..EF   //SELECT
				// net.uri_to_text(E':%ef%b9%a0:'); light ampersand
			} else if ((strncasecmp(x, "e", 1) == 0) &&
					   ((strncmp(x + 1, "0", 1) >= 0 && strncmp(x + 1, "9", 1) <= 0) ||
						   (strncasecmp(x + 1, "a", 1) >= 0 && strncasecmp(x + 1, "f", 1) <= 0))) {
				// DEBUG("We have a three byte char.");
				SERROR_SREALLOC(result_text, result_len + 3);
				memcpy(buffer, x, 2);
				result_text[result_len] = (char)strtol(buffer, 0, 16);
				memcpy(buffer, x + 3, 2);
				result_text[result_len + 1] = (char)strtol(buffer, 0, 16);
				memcpy(buffer, x + 6, 2);
				result_text[result_len + 2] = (char)strtol(buffer, 0, 16);
				result_len += 3;
				chunk_len = 9;

				// check if eight digits F0, F1..F3, F4  //SELECT
				// net.uri_to_text(E':%f0%9d%90%80:'); bold A
			} else if ((strncasecmp(x, "f", 1) == 0) && ((strncmp(x + 1, "0", 1) >= 0 && strncmp(x + 1, "4", 1) <= 0))) {
				// SDEBUG("We have a four byte char.");
				SERROR_SREALLOC(result_text, result_len + 4);
				memcpy(buffer, x, 2);
				result_text[result_len] = (char)strtol(buffer, 0, 16);
				memcpy(buffer, x + 3, 2);
				result_text[result_len + 1] = (char)strtol(buffer, 0, 16);
				memcpy(buffer, x + 6, 2);
				result_text[result_len + 2] = (char)strtol(buffer, 0, 16);
				memcpy(buffer, x + 9, 2);
				result_text[result_len + 3] = (char)strtol(buffer, 0, 16);
				result_len += 4;
				chunk_len = 12;

				// not a valid character
			} else {
				// SDEBUG("Invalid starting character detected. Returning literal
				// percent character.");
				SERROR_SREALLOC(result_text, result_len + chunk_len);
				result_ptr = result_text + result_len;
				memcpy(result_ptr, loop_ptr, chunk_len);
				result_len += chunk_len;
			}

			// in case of + return a space
		} else if (strncmp(loop_ptr, "+", 1) == 0) {
			// SDEBUG("plus detected");
			SERROR_SREALLOC(result_text, result_len + 1);
			result_ptr = result_text + result_len;
			memcpy(result_ptr, " ", 1);
			result_len += 1;

			// in case of everything else, just add to output as is
		} else {
			// SDEBUG("char detected: %s;", loop_ptr);
			SERROR_SREALLOC(result_text, result_len + chunk_len);
			result_ptr = result_text + result_len;
			memcpy(result_ptr, loop_ptr, chunk_len);
			result_len += chunk_len;
		}
		// to debug: uncomment these three lines at the same time:
		// SFINISH_SREALLOC(result_text, result_len + 1);
		// result_text[result_len] = 0;
		// SDEBUG("result_len: %i, result_text: %s", result_len, result_text );

		// looping
		loop_ptr += chunk_len;
		*inputstring_len -= chunk_len;
	}
	// SDEBUG("end");
	SERROR_SREALLOC(result_text, result_len + 1);
	result_text[result_len] = '\0';
	*inputstring_len = result_len;
	return result_text;
error:
	SFREE(result_text);
	return NULL;
}

// returns unencoded key for value as char
char *getpar(char *query, char *input_key, size_t int_query_length, size_t *int_value_length) {
	//@ gets converted into _
	char *answer;
	char *start = query;
	char *end;
	char *str_result = NULL;
	size_t answer_len;
	size_t key_len;
	SDEFINE_VAR_ALL(key, result);

	// do not change original variable, but lets make a new one with the same name
	SERROR_CAT_CSTR(key, input_key, "=");
	key_len = strlen(key);

	do {
		// SDEBUG("query:%s, key:%s, key_len:%i", query, key, key_len);
		if (strncmp(query, key, key_len) == 0) {
			answer = query + key_len;

			// strstr to find answer length.
			end = bstrstr(answer, int_query_length - (size_t)(answer - start), "&", 1);
			if (end == 0) {
				end = start + int_query_length;
				*int_value_length = (size_t)(end - answer);
				str_result = uri_to_cstr(answer, int_value_length);
				SERROR_CHECK(str_result != NULL, "uri_to_cstr failed");
				SFREE_PWORD_ALL();
				return str_result;
			}

			answer_len = (size_t)(end - answer);
			// SDEBUG("answer_len: %i", answer_len);
			SERROR_SALLOC(result, answer_len + 1);
			memcpy(result, answer, answer_len);
			result[answer_len] = 0;
			str_result = uri_to_cstr(result, &answer_len);
			*int_value_length = answer_len;
			SERROR_CHECK(str_result != NULL, "uri_to_cstr failed");
			SFREE_PWORD_ALL();
			return str_result;
		}
		// SDEBUG("rrsg");
		query = bstrstr(query, int_query_length - (size_t)(query - start), "&", 1);
		if (query != 0)
			query += 1;
	} while (query != 0);

	// didn't find anything
	SFREE(key);
	SERROR_CAT_CSTR(str_result, "");
	SFREE_PWORD_ALL();
	return str_result;
error:
	SFREE(str_result);
	SFREE_PWORD_ALL();
	return NULL;
}

// encode string to JSON
char *jsonify(char *inputstring) {
	size_t inputstring_len;
	char *str_result = NULL;
	char *result_ptr;
	char *loop_ptr;
	size_t result_len;
	size_t chunk_len;

	inputstring_len = strlen(inputstring);

	/* return empty array for empty input string */
	if (inputstring_len < 1) {
		SERROR_CAT_CSTR(str_result, "\"\"");
		return str_result;
	}

	// pointer to current location in text input
	loop_ptr = inputstring; // increments by one character per loop

	// Dangerous loops ahead. We could go infinite if we aren't
	//   careful. So lets check for interrupts.
	result_len = 1;
	SERROR_SALLOC(str_result, 1);
	str_result[0] = '"';

	while (inputstring_len > 0) {
		chunk_len = 1;

		SERROR_SREALLOC(str_result, result_len + 2);
		result_ptr = str_result + result_len;

		SDEBUG("loop_ptr: %s, chunk_len: %i, inputlen: %i", loop_ptr, chunk_len, inputstring_len);
		SDEBUG("result_ptr: %s, result_len: %i ", result_ptr, result_len);

		// FOUND SLASH:
		if (strncmp(loop_ptr, "\\", chunk_len) == 0) {
			memcpy(result_ptr, "\\\\", 2);
			result_len += 2;

			// FOUND DOUBLE QUOTE:
		} else if (strncmp(loop_ptr, "\"", chunk_len) == 0) {
			memcpy(result_ptr, "\\\"", 2);
			result_len += 2;

			// FOUND REV SLASH:
		} else if (strncmp(loop_ptr, "/", chunk_len) == 0) {
			memcpy(result_ptr, "\\/", 2);
			result_len += 2;

			// FOUND CHR(13):
		} else if (strncmp(loop_ptr, "\015", chunk_len) == 0) {
			memcpy(result_ptr, "\\r", 2);
			result_len += 2;

			// FOUND CHR(10):
		} else if (strncmp(loop_ptr, "\012", chunk_len) == 0) {
			memcpy(result_ptr, "\\n", 2);
			result_len += 2;

			// FOUND TAB:
		} else if (strncmp(loop_ptr, "\t", chunk_len) == 0) {
			memcpy(result_ptr, "\\t", 2);
			result_len += 2;

			// FOUND FORMFEED:
		} else if (strncmp(loop_ptr, "\f", chunk_len) == 0) {
			memcpy(result_ptr, "\\f", 2);
			result_len += 2;

			// FOUNDBACKSPACE:
		} else if (strncmp(loop_ptr, "\b", chunk_len) == 0) {
			memcpy(result_ptr, "\\b", 2);
			result_len += 2;

		} else {
			// NORMAL CHAR:
			memcpy(result_ptr, loop_ptr, chunk_len);
			result_len += chunk_len;
		}

		// to debug: uncomment all three lines at the same time:
		// SFINISH_SREALLOC(result_text, result_len + 1);
		// result_text[result_len] = 0;
		// SDEBUG("result_len: %i, result_text: %s", result_len, result_text);

		// looping
		loop_ptr += chunk_len;
		inputstring_len -= chunk_len;
	}
	SDEBUG("end");
	SERROR_SREALLOC(str_result, result_len + 2);
	str_result[result_len] = 34;	// dbl quote(")
	str_result[result_len + 1] = 0; // null term(\0)
	return str_result;
error:
	SFREE(str_result);
	return NULL;
}

/* upper-cases s in place */
char *str_toupper(char *str) {
	char *s = str;
	while (*s) {
		*s = (char)toupper(*s);
		s++;
	}
	return str;
}
char *bstr_toupper(char *str, size_t int_strlen) {
	char *s = str;
	size_t int_i = 0;
	while (int_i < int_strlen) {
		*s = (char)toupper(*s);
		s++;
		int_i++;
	}
	return str;
}

/* lower-cases s in place */
char *str_tolower(char *str) {
	char *s = str;
	while (*s) {
		*s = (char)tolower(*s);
		s++;
	}
	return str;
}
char *bstr_tolower(char *str, size_t int_strlen) {
	char *s = str;
	size_t int_i = 0;
	while (int_i < int_strlen) {
		*s = (char)tolower(*s);
		s++;
		int_i++;
	}
	return str;
}

/* filename to file extension to content type */
char *contenttype(char *str_filename) {
	char *str_ptr_fileextension = strrchr(str_filename, '.');
	SERROR_CHECK(str_ptr_fileextension, "strrchr failed, no '.'?");
	str_ptr_fileextension = str_ptr_fileextension + 1;
	// clang-format off
        return  strncmp(str_ptr_fileextension, "js",   3) == 0 ? "application/javascript" :
                strncmp(str_ptr_fileextension, "css",  4) == 0 ? "text/css" :
                strncmp(str_ptr_fileextension, "html", 5) == 0 ? "text/html" :
                strncmp(str_ptr_fileextension, "htm",  4) == 0 ? "text/html" :
                strncmp(str_ptr_fileextension, "gif",  4) == 0 ? "image/gif" :
                strncmp(str_ptr_fileextension, "txt",  4) == 0 ? "text/plain" :
                strncmp(str_ptr_fileextension, "csv",  4) == 0 ? "text/csv" :
                strncmp(str_ptr_fileextension, "ps",   3) == 0 ? "application/postscript" :
                strncmp(str_ptr_fileextension, "pdf",  4) == 0 ? "application/pdf" :
                strncmp(str_ptr_fileextension, "jpg",  4) == 0 ? "image/jpeg" :
                strncmp(str_ptr_fileextension, "zip",  4) == 0 ? "application/zip" :
                strncmp(str_ptr_fileextension, "gzip", 5) == 0 ? "application/x-gzip" :
                strncmp(str_ptr_fileextension, "jpeg", 5) == 0 ? "image/jpeg" :
                strncmp(str_ptr_fileextension, "png",  4) == 0 ? "image/png" :
                strncmp(str_ptr_fileextension, "tiff", 5) == 0 ? "image/tiff" :
                strncmp(str_ptr_fileextension, "svg",  4) == 0 ? "image/svg+xml" :
                strncmp(str_ptr_fileextension, "ico",  4) == 0 ? "image/vnd.microsoft.icon" :
                strncmp(str_ptr_fileextension, "woff2", 6) == 0 ? "application/x-font-woff" :
                strncmp(str_ptr_fileextension, "woff", 5) == 0 ? "application/x-font-woff" :
                strncmp(str_ptr_fileextension, "eot", 4) == 0 ? "application/vnd.ms-fontobject" :
                strncmp(str_ptr_fileextension, "ttf", 4) == 0 ? "application/font-sfnt" :
                "text/plain";
// clang-format on
error:
	return NULL;
}

char *cstr_to_uri(char *str_input) {
	char *str_result = NULL;

	SERROR_CAT_CSTR(str_result, "");
	char str_temp[10];

	char *ptr_input = str_input;
	for (; *ptr_input; ptr_input++) {
		if (!((*ptr_input >= 'a' && *ptr_input <= 'z') || (*ptr_input >= 'A' && *ptr_input <= 'Z') ||
				(*ptr_input >= '0' && *ptr_input <= '9') || *ptr_input == '%' || *ptr_input == '+' || *ptr_input == ',' ||
				*ptr_input == '.' || *ptr_input == '_' || *ptr_input == '-' || *ptr_input == '/' || *ptr_input == '%')) {
			sprintf(str_temp, "%%%02X", *ptr_input);
		} else {
			str_temp[0] = *ptr_input;
			str_temp[1] = 0;
		}
		SERROR_CAT_APPEND(str_result, str_temp);
	}
	bol_error_state = false;
	return str_result;
error:
	SFREE(str_result);
	return NULL;
}

// binary version of strstr
char *bstrstr(char *buff1, size_t len1, char *buff2, size_t len2) {
	// WE RETURN THE FIRST ARGUMENT, USER NEEDS TO FREE BOTH BUFFERS THEMSELVES
	if (!buff1)
		return (char *)NULL;
	if (!buff2)
		return (char *)NULL;
	if (len1 == 0)
		return (char *)NULL;
	if (len2 == 0)
		return (char *)NULL;
	if (len1 < len2)
		return (char *)NULL;
	size_t i;
	for (i = 0; i <= (len1 - len2); i++) {
		if (memcmp(buff1 + i, buff2, len2) == 0) {
			return buff1 + i;
		}
	}

	return (char *)NULL;
}

char *hexencode(char *str_to_encode, size_t *ptr_int_len) {
	size_t int_i, int_in_len = *ptr_int_len, int_out_len = *ptr_int_len * 2;
	char *str_out = NULL;
	char str_temp[3];
	SERROR_SALLOC(str_out, (int_out_len + 1));
	str_out[int_out_len] = 0;

	for (int_i = 0; int_i < int_in_len; int_i += 1) {
		snprintf(str_temp, 3, "%x", str_to_encode[int_i]);
		if (str_temp[1] != 0) {
			memcpy(str_out + (int_i * 2), str_temp, 2);
		} else if (str_temp[1] == 0) {
			str_out[(int_i * 2) + 0] = '0';
			str_out[(int_i * 2) + 1] = str_temp[0];
		}
		SDEBUG("str_temp: %s", str_temp);
	}

	*ptr_int_len = int_out_len;
	return str_out;
error:
	SINFO("int_in_len: %d", int_in_len);
	SINFO("int_out_len: %d", int_out_len);
	SFREE(str_out);
	return NULL;
}

// string to array of strings
// see text_sort function for example
/*size_t explode(const char *delim, char *str, char **pointers_out, char
*bytes_out) {
	size_t delim_length = strlen(delim);
	char **pointers_out_start = pointers_out;

		if (delim_length == 0) {
				SERROR_NORESPONSE("explode: Must send delimeter");
				return 0;
		}

	for (;;) {
		// Find the next occurrence of the item delimiter. //
		char *delim_pos = strstr(str, delim);

		//
		// Emit the current output buffer position, since that is where the
		// next item will be written.
		///
		*pointers_out++ = bytes_out;

		if (delim_pos == NULL) {
			//
			// No more item delimiters left.  Treat the rest of the input
			// string as the last item.
			///
			strcpy(bytes_out, str);
			return pointers_out - pointers_out_start;
		} else {
			//
			// Item delimiter found.  The bytes leading up to it form the next
			// string.
			///
			while (str < delim_pos) {
				*bytes_out++ = *str++;
						}

			// Don't forget the NUL terminator. //
			*bytes_out++ = '\0';

			// Skip over the delimiter. //
			str += delim_length;
		}
	}
}*/

/*
 * c string concatenation for building commands in a way
 *      that is more easy to read than nesting
 */
char *c_cat(size_t args, ...) {
	va_list ap;
	va_list bp;
	// va_list cp;
	char *str_result = NULL;

	size_t i;
	va_start(ap, args);
	va_copy(bp, ap);
	// va_copy (cp, ap);
	size_t total_len = 0;
	size_t *lengths = NULL;
	SERROR_SALLOC(lengths, args * sizeof(size_t));

	// store lengths for the args
	for (i = 0; i < args; i = i + 1) {
		char *temp = va_arg(ap, char *);
		size_t len;
		if (temp) {
			len = strlen(temp);
		} else {
			len = 0;
		}
		lengths[i] = len;
		total_len += len;
		// SDEBUG("total len:%d", total_len );
	}
	va_end(ap);

	// allocate a field large enough for everything
	SERROR_SALLOC(str_result, total_len + 1);
	char *result = str_result;
	char *temp_ptr;

	// fill the new field
	for (i = 0; i < args; i = i + 1) {
		temp_ptr = va_arg(bp, char *);
		if (lengths[i] > 0) {
			// DEBUG("\012lengths[i]: %i", lengths[i]);
			memcpy(result, temp_ptr, lengths[i]);
			result += lengths[i];
		}
		// SDEBUG("\012i: %i, lengths:%d   result:%s   output_len:%d   output:%s;",
		// i,
		// lengths[i], result, strlen(output), output );
		// SDEBUG("\012va_arg(cp, char *):%s:\012", va_arg(cp, char *));
	}

	// add a null terminator
	*result = '\0';
	va_end(bp);
	SFREE(lengths);

	return str_result;
error:
	SFREE(lengths);
	SFREE(str_result);
	return NULL;
}

/*
 * c string concatenation for building commands in a way
 *      that is more easy to read than nesting
 */
// cat_append is just like cat_cstr except the first argument is free()d
char *c_append(size_t args, ...) {
	va_list ap;
	va_list bp;
	// va_list cp;
	char *str_result = NULL;
	char *temp_ptr;

	size_t i;
	va_start(ap, args);
	va_copy(bp, ap);
	// va_copy (cp, ap);
	size_t total_len = 0;
	size_t *lengths = NULL;
	SERROR_SALLOC(lengths, args * sizeof(size_t));

	// store lengths for the args
	for (i = 0; i < args; i = i + 1) {
		temp_ptr = va_arg(ap, char *);
		SERROR_CHECK(i != 0 || temp_ptr != NULL, "First argument can't be null");
		size_t len = strlen(temp_ptr);
		lengths[i] = len;
		total_len += len;
		// SDEBUG("i:%d\012", i );
		// SDEBUG("total len:%d", total_len );
	}
	va_end(ap);

	// allocate a field large enough for everything
	SERROR_SALLOC(str_result, total_len + 1);
	char *result = str_result;

	// fill the new field
	for (i = 0; i < args; i = i + 1) {
		temp_ptr = va_arg(bp, char *);
		if (lengths[i] > 0) {
			// SDEBUG("\012lengths[i]: %i", lengths[i]);
			memcpy(result, temp_ptr, lengths[i]);
			result += lengths[i];
		}

		// free first arg
		// SINFO("OUTSIDE %i", i);
		if (i == 0) {
			// INFO("INSIDE %i", i);
			SFREE(temp_ptr);
		}
		// SDEBUG("\012i: %i, lengths:%d   result:%s   output_len:%d   output:%s;",
		// i,
		// lengths[i], result, strlen(output), output );
		// SDEBUG("\012va_arg(cp, char *):%s:\012", va_arg(cp, char *));
	}

	// add a null terminator
	*result = '\0';
	va_end(bp);
	SFREE(lengths);

	return str_result;
error:
	SFREE(lengths);
	SFREE(str_result);
	return NULL;
}

char *c_char_append(char *str_input, char chr_input) {
	size_t int_length = strlen(str_input);
	SERROR_CHECK(str_input != NULL, "First argument can't be null");
	SERROR_SREALLOC(str_input, int_length + 2);
	str_input[int_length + 0] = chr_input;
	str_input[int_length + 1] = '\0';

	return str_input;
error:
	return NULL;
}
