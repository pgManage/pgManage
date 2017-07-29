#include "util_string.h"

// This is based on OpenBSD strcspn
size_t strncspn(const char *str_search, size_t int_search_len, const char *str_chars, size_t int_chars_len) {
	const char *p, *spanp;
	char c, sc;
	size_t int_i = 0;
	size_t int_j = 0;

	// Stop as soon as we find any character from str_chars
	for (p = str_search; int_i < int_search_len; int_i += 1) {
		c = *p++;
		spanp = str_chars;
		int_j = 0;
		do {
			if ((sc = *spanp++) == c) {
				return (size_t)(p - 1 - str_search);
			}
			int_j += 1;
		} while (int_j < int_chars_len);
	}
	return int_search_len;
}

bool check_to_escape(char *str_input, bool bol_as_ident) {
	char *ptr_input = str_input;
	char *ptr_end_input = (str_input + strlen(str_input));
	size_t int_num_quotes = 0;
	if (ptr_end_input > ptr_input) {
		ptr_end_input -= 1;
	}
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

	size_t int_return_len = 0;
	size_t int_find_len = 0;
	size_t int_replace_len = 0;

	SERROR_SNCAT(str_return, &int_return_len,
		"", (size_t)0);
	SERROR_SNCAT(str_find, &int_find_len,
		str_find_in, strlen(str_find_in));
	SERROR_SNCAT(str_replace, &int_replace_len,
		str_replace_in, strlen(str_replace_in));
	if (strchr(str_flags, 'i') != NULL) {
		str_find = bstr_tolower(str_find, strlen(str_find));
		str_replace = bstr_tolower(str_replace, strlen(str_replace));
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
char *uri_to_cstr(char *ptr_loop, size_t *int_inputstring_len) {
	char *result_text = NULL;
	char *ptr_result;
	size_t int_result_len = 0;
	size_t int_chunk_len = 0;
	char *x;

	// Dangerous loops ahead. We could go infinite if we aren't
	//   careful. So lets check for interrupts.
	SERROR_SALLOC(result_text, 1);
	int_result_len = 0;
	char buffer[3];
	buffer[2] = 0;

	while (*int_inputstring_len > 0) {
		int_chunk_len = 1;

		// SDEBUG("ptr_loop: %s, chunk_len: %i, inputlen: %i", ptr_loop, chunk_len,
		// inputstring_len );
		// SDEBUG("ptr_result: %s, result_len: %i ", ptr_result, result_len );

		// check for % characters
		//   if found, decode as percent encoded hex
		if (strncmp(ptr_loop, "%", 1) == 0) {
			x = ptr_loop + 1;
			// SDEBUG("percent detected");

			// check if two digits  00..7F  //SELECT net.uri_to_text(E':%20:') =>
			// space
			// character;
			if ((strncmp(x, "0", 1) >= 0 && strncmp(x, "7", 1) <= 0) &&
				((strncmp(x + 1, "0", 1) >= 0 && strncmp(x + 1, "9", 1) <= 0) ||
					(strncasecmp(x + 1, "a", 1) >= 0 && strncasecmp(x + 1, "f", 1) <= 0))) {
				// SDEBUG("We have a one byte char. strtol:%ld;", strtol( x, 0, 16)
				// );
				SERROR_SREALLOC(result_text, int_result_len + 1);
				memcpy(buffer, x, 2);
				result_text[int_result_len] = (char)strtol(buffer, 0, 16);
				int_result_len += 1;
				int_chunk_len = 3;

				// check if four digits C2..DF  //SELECT
				// net.uri_to_text(E':%c4%b3'); => combined ij char
			} else if ((strncasecmp(x, "c", 1) == 0) &&
					   ((strncmp(x + 1, "2", 1) >= 0 && strncmp(x + 1, "9", 1) <= 0) ||
						   (strncasecmp(x + 1, "a", 1) >= 0 && strncasecmp(x + 1, "f", 1) <= 0))) {
				// SDEBUG("We have a two byte char 'C' x:%s;", x);
				SERROR_SREALLOC(result_text, int_result_len + 2);
				memcpy(buffer, x, 2);
				result_text[int_result_len] = (char)strtol(buffer, 0, 16);
				memcpy(buffer, x + 3, 2);
				result_text[int_result_len + 1] = (char)strtol(buffer, 0, 16);
				int_result_len += 2;
				int_chunk_len = 6;

				// check if four digits C2..DF
			} else if ((strncasecmp(x, "d", 1) == 0) &&
					   ((strncmp(x + 1, "0", 1) >= 0 && strncmp(x + 1, "9", 1) <= 0) ||
						   (strncasecmp(x + 1, "a", 1) >= 0 && strncasecmp(x + 1, "f", 1) <= 0))) {
				// DEBUG("We have a two byte char 'D'");
				SERROR_SREALLOC(result_text, int_result_len + 2);
				memcpy(buffer, x, 2);
				result_text[int_result_len] = (char)strtol(buffer, 0, 16);
				memcpy(buffer, x + 3, 2);
				result_text[int_result_len + 1] = (char)strtol(buffer, 0, 16);
				int_result_len += 2;
				int_chunk_len = 6;

				// check if six digits E0, E1..EC, ED, EE..EF   //SELECT
				// net.uri_to_text(E':%ef%b9%a0:'); light ampersand
			} else if ((strncasecmp(x, "e", 1) == 0) &&
					   ((strncmp(x + 1, "0", 1) >= 0 && strncmp(x + 1, "9", 1) <= 0) ||
						   (strncasecmp(x + 1, "a", 1) >= 0 && strncasecmp(x + 1, "f", 1) <= 0))) {
				// DEBUG("We have a three byte char.");
				SERROR_SREALLOC(result_text, int_result_len + 3);
				memcpy(buffer, x, 2);
				result_text[int_result_len] = (char)strtol(buffer, 0, 16);
				memcpy(buffer, x + 3, 2);
				result_text[int_result_len + 1] = (char)strtol(buffer, 0, 16);
				memcpy(buffer, x + 6, 2);
				result_text[int_result_len + 2] = (char)strtol(buffer, 0, 16);
				int_result_len += 3;
				int_chunk_len = 9;

				// check if eight digits F0, F1..F3, F4  //SELECT
				// net.uri_to_text(E':%f0%9d%90%80:'); bold A
			} else if ((strncasecmp(x, "f", 1) == 0) && ((strncmp(x + 1, "0", 1) >= 0 && strncmp(x + 1, "4", 1) <= 0))) {
				// SDEBUG("We have a four byte char.");
				SERROR_SREALLOC(result_text, int_result_len + 4);
				memcpy(buffer, x, 2);
				result_text[int_result_len] = (char)strtol(buffer, 0, 16);
				memcpy(buffer, x + 3, 2);
				result_text[int_result_len + 1] = (char)strtol(buffer, 0, 16);
				memcpy(buffer, x + 6, 2);
				result_text[int_result_len + 2] = (char)strtol(buffer, 0, 16);
				memcpy(buffer, x + 9, 2);
				result_text[int_result_len + 3] = (char)strtol(buffer, 0, 16);
				int_result_len += 4;
				int_chunk_len = 12;

				// not a valid character
			} else {
				// SDEBUG("Invalid starting character detected. Returning literal
				// percent character.");
				SERROR_SREALLOC(result_text, int_result_len + int_chunk_len);
				ptr_result = result_text + int_result_len;
				memcpy(ptr_result, ptr_loop, int_chunk_len);
				int_result_len += int_chunk_len;
			}

			// in case of + return a space
		} else if (strncmp(ptr_loop, "+", 1) == 0) {
			// SDEBUG("plus detected");
			SERROR_SREALLOC(result_text, int_result_len + 1);
			ptr_result = result_text + int_result_len;
			memcpy(ptr_result, " ", 1);
			int_result_len += 1;

			// in case of everything else, just add to output as is
		} else {
			// SDEBUG("char detected: %s;", ptr_loop);
			SERROR_SREALLOC(result_text, int_result_len + int_chunk_len);
			ptr_result = result_text + int_result_len;
			memcpy(ptr_result, ptr_loop, int_chunk_len);
			int_result_len += int_chunk_len;
		}
		// to debug: uncomment these three lines at the same time:
		// SFINISH_SREALLOC(result_text, result_len + 1);
		// result_text[result_len] = 0;
		// SDEBUG("result_len: %i, result_text: %s", result_len, result_text );

		// looping
		ptr_loop += int_chunk_len;
		*int_inputstring_len -= int_chunk_len;
	}
	// SDEBUG("end");
	SERROR_SREALLOC(result_text, int_result_len + 1);
	result_text[int_result_len] = '\0';
	*int_inputstring_len = int_result_len;
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
	size_t int_answer_len = 0;
	size_t int_key_len = 0;
	size_t int_result_len = 0;
	SDEFINE_VAR_ALL(key, result);

	// do not change original variable, but lets make a new one with the same name
	SERROR_SNCAT(key, &int_key_len,
		input_key, strlen(input_key),
		"=", (size_t)1);

	do {
		// SDEBUG("query:%s, key:%s, key_len:%i", query, key, key_len);
		if (strncmp(query, key, int_key_len) == 0) {
			answer = query + int_key_len;

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

			int_answer_len = (size_t)(end - answer);
			// SDEBUG("answer_len: %i", answer_len);
			SERROR_SALLOC(result, int_answer_len + 1);
			memcpy(result, answer, int_answer_len);
			result[int_answer_len] = 0;
			str_result = uri_to_cstr(result, &int_answer_len);
			*int_value_length = int_answer_len;
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
	SERROR_SNCAT(str_result, &int_result_len,
		"", (size_t)0);
	SFREE_PWORD_ALL();
	return str_result;
error:
	SFREE(str_result);
	SFREE_PWORD_ALL();
	return NULL;
}

// encode string to JSON
char *jsonify(char *str_inputstring, size_t *ptr_int_result_len) {
	char *str_result = NULL;
	char *ptr_result;
	char *ptr_loop;
	size_t int_result_len;
	size_t int_chunk_len;
	size_t int_inputstring_len = *ptr_int_result_len;

	/* return empty array for empty input string */
	if (int_inputstring_len < 1) {
		SERROR_SNCAT(str_result, ptr_int_result_len,
			"\"\"", (size_t)2);
		return str_result;
	}

	// pointer to current location in text input
	ptr_loop = str_inputstring; // increments by one character per loop

	// Dangerous loops ahead. We could go infinite if we aren't
	//   careful. So lets check for interrupts.
	int_result_len = 1;
	SERROR_SALLOC(str_result, 1);
	str_result[0] = '"';

	while (int_inputstring_len > 0) {
		int_chunk_len = 1;

		SERROR_SREALLOC(str_result, int_result_len + 2);
		ptr_result = str_result + int_result_len;

		SDEBUG("ptr_loop: %s, int_chunk_len: %i, int_inputstring_len: %i", ptr_loop, int_chunk_len, int_inputstring_len);
		SDEBUG("ptr_result: %s, int_result_len: %i ", ptr_result, int_result_len);

		// FOUND SLASH:
		if (strncmp(ptr_loop, "\\", int_chunk_len) == 0) {
			memcpy(ptr_result, "\\\\", 2);
			int_result_len += 2;

			// FOUND DOUBLE QUOTE:
		} else if (strncmp(ptr_loop, "\"", int_chunk_len) == 0) {
			memcpy(ptr_result, "\\\"", 2);
			int_result_len += 2;

			// FOUND REV SLASH:
		} else if (strncmp(ptr_loop, "/", int_chunk_len) == 0) {
			memcpy(ptr_result, "\\/", 2);
			int_result_len += 2;

			// FOUND CHR(13):
		} else if (strncmp(ptr_loop, "\015", int_chunk_len) == 0) {
			memcpy(ptr_result, "\\r", 2);
			int_result_len += 2;

			// FOUND CHR(10):
		} else if (strncmp(ptr_loop, "\012", int_chunk_len) == 0) {
			memcpy(ptr_result, "\\n", 2);
			int_result_len += 2;

			// FOUND TAB:
		} else if (strncmp(ptr_loop, "\t", int_chunk_len) == 0) {
			memcpy(ptr_result, "\\t", 2);
			int_result_len += 2;

			// FOUND FORMFEED:
		} else if (strncmp(ptr_loop, "\f", int_chunk_len) == 0) {
			memcpy(ptr_result, "\\f", 2);
			int_result_len += 2;

			// FOUNDBACKSPACE:
		} else if (strncmp(ptr_loop, "\b", int_chunk_len) == 0) {
			memcpy(ptr_result, "\\b", 2);
			int_result_len += 2;

		} else {
			// NORMAL CHAR:
			memcpy(ptr_result, ptr_loop, int_chunk_len);
			int_result_len += int_chunk_len;
		}

		// to debug: uncomment all three lines at the same time:
		// SFINISH_SREALLOC(result_text, result_len + 1);
		// result_text[result_len] = 0;
		// SDEBUG("result_len: %i, result_text: %s", result_len, result_text);

		// looping
		ptr_loop += int_chunk_len;
		int_inputstring_len -= int_chunk_len;
	}
	SDEBUG("end");
	SERROR_SREALLOC(str_result, int_result_len + 2);
	str_result[int_result_len] = 34;	// dbl quote(")
	str_result[int_result_len + 1] = 0; // null term(\0)
	*ptr_int_result_len = int_result_len + 1;
	return str_result;
error:
	SFREE(str_result);
	*ptr_int_result_len = 0;
	return NULL;
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
				strncmp(str_ptr_fileextension, "xml",  4) == 0 ? "application/xml" :
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
	return "text/plain";
}

char *snuri(char *str_input, size_t int_in_len, size_t *ptr_int_out_len) {
	char *str_result = NULL;
	char *ptr_input = str_input;
	*ptr_int_out_len = int_in_len;
	char *ptr_end_input = str_input + (*ptr_int_out_len);

	// Calculate actual needed length
	for (; ptr_input < ptr_end_input; ptr_input++) {
		if (!((*ptr_input >= 'a' && *ptr_input <= 'z') || (*ptr_input >= 'A' && *ptr_input <= 'Z') ||
			(*ptr_input >= '0' && *ptr_input <= '9') || *ptr_input == '+' || *ptr_input == ',' ||
			*ptr_input == '.' || *ptr_input == '_' || *ptr_input == '-' || *ptr_input == '/')) {

			// Only need to add two chars because there is already space for one.
			*ptr_int_out_len = (*ptr_int_out_len) + 2;
		}
	}

	SERROR_SALLOC(str_result, (*ptr_int_out_len) + 1);

	ptr_input = str_input;
	char *ptr_result = str_result;

	for (; ptr_input < ptr_end_input; ptr_input++) {
		if (!((*ptr_input >= 'a' && *ptr_input <= 'z') || (*ptr_input >= 'A' && *ptr_input <= 'Z') ||
			(*ptr_input >= '0' && *ptr_input <= '9') || *ptr_input == '+' || *ptr_input == ',' ||
			*ptr_input == '.' || *ptr_input == '_' || *ptr_input == '-' || *ptr_input == '/')) {

			// Insert encoded char right where we need it
			snprintf(ptr_result, 4, "%%%02X", *ptr_input);
			ptr_result += 3;
		} else {
			ptr_result[0] = *ptr_input;
			ptr_result += 1;
		}
	}
	bol_error_state = false;
	return str_result;
error:
	*ptr_int_out_len = 0;
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

char *hexencode(unsigned char *str_to_encode, size_t *ptr_int_len) {
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

// Make sure to cast to size_t when passing lengths
char *_sncat(bool bol_free, size_t int_num_arg, size_t *ptr_int_len, ...) {
	char *str_result = NULL;
	va_list ap;
	va_list bp;
	size_t int_i = 0;
	size_t int_offset = 0;
	char *ptr_temp = NULL;

	if (int_num_arg % 2 != 0) {
		SERROR("Odd number of arguments to _sncat");
	}

	*ptr_int_len = 0;

	// Two va_start()s don't always work
	// https://gcc.gnu.org/ml/gcc/2001-08/msg00489.html
	va_start(ap, ptr_int_len);
	va_copy(bp, ap);

	// Add all the lengths
	for (int_i = 0; int_i < int_num_arg; int_i += 2) {
		ptr_temp = va_arg(ap, char *);
		size_t int_len = va_arg(ap, size_t);

		*ptr_int_len += int_len;
	}
	va_end(ap);

	// Allocate return
	if (!bol_free) {
		SERROR_SALLOC(str_result, (*ptr_int_len) + 1);
		int_i = 0;
	} else {
		str_result = va_arg(bp, char *);
		int_offset += va_arg(bp, size_t);
		SERROR_SREALLOC(str_result, (*ptr_int_len) + 1);
		int_i = 2;
	}

	// Copy into return variable
	for (; int_i < int_num_arg; int_i += 2) {
		ptr_temp = va_arg(bp, char *);
		size_t int_len = va_arg(bp, size_t);

		memcpy(str_result + int_offset, ptr_temp, int_len);
		int_offset += int_len;
	}
	va_end(bp);

	str_result[*ptr_int_len] = 0;

	return str_result;
error:
	SFREE(str_result);
	return NULL;
}
