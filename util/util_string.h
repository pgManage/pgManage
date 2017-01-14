#ifndef VA_NUM_ARGS
#define __________________EXPAND(x) x
#define VA_NUM_ARGS(...)                                                                                                         \
	__________________EXPAND(VA_NUM_ARGS_IMPL(22, ##__VA_ARGS__, 99, 98, 97, 96, 95, 94, 93, 92, 91, 90, 89, 88, 87, 86, 85, 84, \
		83, 82, 81, 80, 79, 78, 77, 76, 75, 74, 73, 72, 71, 70, 69, 68, 67, 66, 65, 64, 63, 62, 61, 60, 59, 58, 57, 56, 55, 54,  \
		53, 52, 51, 50, 49, 48, 47, 46, 45, 44, 43, 42, 41, 40, 39, 38, 37, 36, 35, 34, 33, 32, 31, 30, 29, 28, 27, 26, 25, 24,  \
		23, 22, 21, 20, 19, 18, 17, 16, 15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1, 0))

#define VA_NUM_ARGS_IMPL(_0, _1, _2, _3, _4, _5, _6, _7, _8, _9, _10, _11, _12, _13, _14, _15, _16, _17, _18, _19, _20, _21,     \
						 _22, _23, _24, _25, _26, _27, _28, _29, _30, _31, _32, _33, _34, _35, _36, _37, _38, _39, _40, _41,     \
						 _42, _43, _44, _45, _46, _47, _48, _49, _50, _51, _52, _53, _54, _55, _56, _57, _58, _59, _60, _61,     \
						 _62, _63, _64, _65, _66, _67, _68, _69, _70, _71, _72, _73, _74, _75, _76, _77, _78, _79, _80, _81,     \
						 _82, _83, _84, _85, _86, _87, _88, _89, _90, _91, _92, _93, _94, _95, _96, _97, _98, _99, N, ...)       \
	N

// On August 13, 2015, nunzio made this capable of 100 args because he went past
// the 48 arg
// limit writing the save config function for the installer
//#define     VA_NUM_ARGS(...) VA_NUM_ARGS_IMPL(11,##__VA_ARGS__,
// 48,47,46,45,44,43,42,41,40,39,38,37,36,35,34,33,32,31,30,29,28,27,26,25,24,23,22,21,20,19,18,17,16,15,14,13,12,11,10,9,8,7,6,5,4,3,2,1,0)
//#define
// VA_NUM_ARGS_IMPL(_0,_1,_2,_3,_4,_5,_6,_7,_8,_9,_10,_11,_12,_13,_14,_15,_16,_17,_18,_19,_20,_21,_22,_23,_24,_25,_26,_27,_28,_29,_30,_31,_32,_33,_34,_35,_36,_37,_38,_39,_40,_41,_42,_43,_44,_45,_46,_47,_48,N,...)
// N

#endif
// only want this defined one time

#pragma once

#ifdef _WIN32
#define strncasecmp(x, y, z) _strnicmp(x, y, z)
#endif

#include <stdarg.h>
#include <stdio.h>
#include <string.h>
//#include <regex.h>
#include <ctype.h>
#include <errno.h>
#include <stdbool.h>
#ifdef _WIN32
#include <BaseTsd.h>
#endif

#include "util_error.h"
#include "util_salloc.h"

/*
Check to see if a string needs to be escaped as either an identifier or a literal
*/
bool check_to_escape(char *str_input, bool bol_as_ident);
/*
Escape a string for use in tab delimited data.
*/
char *escape_value(char *str_input);
char *bescape_value(char *str_input, size_t *ptr_int_length);

/*
Unescape a string from tab delimited data.
*/
char *unescape_value(char *str_input);
char *bunescape_value(char *str_input, size_t *ptr_int_length);

/*
Replace instance of `str_find` with `str_replace` from in `str_input`.
Two flags that can be set:
g -> Replace all instances
i -> Case Insensitive

//str_string_to_replace = "Apples are awesome!"
SERROR_REPLACE(str_string_to_replace, "Apple", "Orange", "g")
//str_string_to_replace = "Oranges are awesome!"
*/
char *replace(char *str_input, char *str_find, char *str_replace, char *str_flags);

#define SERROR_REPLACE(A, B, C, D) SERROR_CHECK(A = replace(A, B, C, D), "replace failed")
#define SFINISH_REPLACE(A, B, C, D) SFINISH_ERROR_CHECK(A = replace(A, B, C, D), "replace failed")

char *breplace(char *str_input, size_t *ptr_int_length, char *str_find, char *str_replace, char *str_flags);

#define SERROR_BREPLACE(A, B, C, D, E) SERROR_CHECK(A = breplace(A, B, C, D, E), "breplace failed")
#define SFINISH_BREPLACE(A, B, C, D, E) SFINISH_ERROR_CHECK(A = breplace(A, B, C, D, E), "breplace failed")

/*
Match firt character in `str_string` from `str_pattern` using regular
expressions.
*/
// bool match_first_char(char *str_pattern, const char *str_string);

/*
Runs a regular expression and returns the result.
*/
// regmatch_t *sunny_regex(char *str_pattern, char *str_input);

/*
Take a URI Encoded string and decode it.
*/
char *uri_to_cstr(char *ptr_loop, size_t *int_inputstring_len);

/*
Searchs a URI Encoded query string and returns the value for the `str_key`.
*/
char *getpar(char *str_query, char *str_key, size_t int_query_length, size_t *int_value_length);

/*
Encodes string into a JSON string.
*/
char *jsonify(char *inputstring);

/*
Makes all the characters in a string lowercase.
//str_string = "The String"
TO_LOWER(str_string)
//str_string = "the string"
*/
char *str_tolower(char *str);
#define TO_LOWER(A) A = str_tolower(A);
char *bstr_tolower(char *str, size_t int_strlen);

/*
Makes all the characters in a string uppercase.
//str_string = "The String"
TO_UPPER(str_string)
//str_string = "THE STRING"
*/
char *str_toupper(char *str);
#define TO_UPPER(A) A = str_toupper(A);
char *bstr_toupper(char *str, size_t int_strlen);

/*
Returns the content type for a file extension.
You can send the whole filename, but all you need is the dot `.` and extension.
Since it finds the extension itself, you should just send the whole name over.
*/
char *contenttype(char *str_filename);

/*
Encodes a string (with a length) for use in a URI.
*/
char *snuri(char *str_input, size_t int_in_len, size_t *ptr_int_out_len);

/*
Same as the standard function strstr, but you send the lengths too. This makes
it binary compatible.
*/
char *bstrstr(char *buff1, size_t len1, char *buff2, size_t len2);

/*
Encode a string to hex.
Send the pointer to the integer variable containing the original length.
That length will be changed to reflect the new variable.
*/
char *hexencode(char *str_to_encode, size_t *ptr_int_len);
// size_t explode(const char *delim, char *str, char **pointers_out, char
// *bytes_out);

char *_sncat(bool bol_free, size_t int_num_arg, size_t *ptr_int_len, ...);
#define SERROR_SNCAT(value, len_ptr, ...) SERROR_CHECK(value = _sncat(false, VA_NUM_ARGS(__VA_ARGS__), len_ptr, ##__VA_ARGS__), "sncat failed")
#define SFINISH_SNCAT(value, len_ptr, ...) SFINISH_ERROR_CHECK(value = _sncat(false, VA_NUM_ARGS(__VA_ARGS__), len_ptr, ##__VA_ARGS__), "sncat failed")
#define SERROR_SNFCAT(value, len_ptr, ...) SERROR_CHECK(value = _sncat(true, VA_NUM_ARGS(__VA_ARGS__) + 2, len_ptr, value, *len_ptr, ##__VA_ARGS__), "sncat failed")
#define SFINISH_SNFCAT(value, len_ptr, ...) SFINISH_ERROR_CHECK(value = _sncat(true, VA_NUM_ARGS(__VA_ARGS__) + 2, len_ptr, value, *len_ptr, ##__VA_ARGS__), "sncat failed")
