#pragma once

//-V::571

static const int MB = 1024 * 1024;

#include "util_error.h"
#include <stdlib.h>
#include <unistd.h>
#ifdef _MSC_VER

typedef __int16 int16_t;
typedef unsigned __int16 uint16_t;
typedef __int32 int32_t;
typedef unsigned __int32 uint32_t;
typedef __int64 int64_t;
typedef unsigned __int64 uint64_t;

#else
#include <stdint.h>
#endif

/*
Allocation is done through macros and functions.
Inside the function, we handle checking the malloc function.
If the malloc (or realloc) function returns NULL we try again in a couple of
seconds.
The macro handles the error checking for you.

This mallocs str_username to 255:
char *str_username = NULL;
SERROR_SALLOC(str_username, 255);

Note, before you do anything in a function, initialize all your variables.
Acceptable:
char *str_username = NULL;
char *str_password = NULL;
SERROR_SALLOC(str_username, 255);
SERROR_SALLOC(str_password, 255);

Not acceptable:
char *str_username = NULL;
SERROR_SALLOC(str_username, 255);
char *str_password = NULL;
SERROR_SALLOC(str_password, 255);

There are certain memory errors that do not occur when you initialize before
ANYTHING else.

Allocation macros:
SERROR_SALLOC(str_username, 255);
SFINISH_SALLOC(str_username, 255);
SERROR_SREALLOC(str_username, 255);
SFINISH_SREALLOC(str_username, 255);
*/

void *salloc(size_t size);
#define SERROR_SALLOC(A, B) SERROR_CHECK(A = salloc(B), "salloc failed")
#define SFINISH_SALLOC(A, B) SFINISH_ERROR_CHECK(A = salloc(B), "salloc failed")
void *srealloc(void *void_ptr, size_t size);
#define SERROR_SREALLOC(A, B) SERROR_CHECK(A = srealloc(A, B), "srealloc failed")
#define SFINISH_SREALLOC(A, B) SFINISH_ERROR_CHECK(A = srealloc(A, B), "srealloc failed")

/*
Freeing is done through macros.
This frees the str_username:
SFREE(str_username);

What SFREE does is it sets the variable to NULL after freeing,
and if the variable is already null it doesn't free it.
So you can do this safely:
SERROR_SALLOC(str_username, 255);
SFREE(str_username);
SFREE(str_username);

This makes it much harder to get memory errors.
This similary functions also zeros out the memory, use for sensitive data:
SFREE_PWORD(str_password);
*/

// To free, or not to free, that is the question.
void bfree_pword(char volatile *str_pword, size_t int_len);

/*
Using macros, we can define all the string variables at once, and free them all
at once.
At the beginning of a function do this:
SDEFINE_VAR_ALL(str_username, str_password);

At the end of a function do this:
SFREE_ALL();
Or this:
SFREE_PWORD_ALL();

These macros will expand to something like:
char *str_test = NULL;
char *str_username = NULL;
char *str_password = NULL;
SERROR_SALLOC(str_test, 255);
SERROR_SALLOC(str_username, 255);
SERROR_SALLOC(str_password, 255);

SFREE(str_test);
SFREE(str_username);
SFREE(str_password);

In this example, this would be how I do it:
SDEFINE_VAR_ALL(str_test, str_username, str_password);
...
SFREE_PWORD(str_password);
SFREE_ALL();

Which will expand to this:
char *str_test = NULL;
char *str_username = NULL;
char *str_password = NULL;
SERROR_SALLOC(str_test, 255);
SERROR_SALLOC(str_username, 255);
SERROR_SALLOC(str_password, 255);

SFREE_PWORD(str_password);
SFREE(str_test);
SFREE(str_username);
SFREE(str_password);

If you have alot of variables, do this:
SDEFINE_VAR_ALL(str_test, str_username, str_password, str_example);
SDEFINE_VAR_MORE(str_some_data, str_column, str_count_string);

Macros can only recurse so many times, so after six or seven variable in one
line,
use SDEFINE_VAR_MORE as many times as necessary. Here is a real use case:
SDEFINE_VAR_ALL(str_form_data, str_expires);
SDEFINE_VAR_MORE(str_uri_expires, str_cookie_decrypted);
SDEFINE_VAR_MORE(str_escape_password, str_conn, str_conn_debug, str_body);
SDEFINE_VAR_MORE(str_email_error, str_user_literal, str_sql);
SDEFINE_VAR_MORE(str_expiration);
SDEFINE_VAR_MORE(str_uri_new_password, str_uri_expiration);
SDEFINE_VAR_MORE(str_new_cookie, str_user_quote, str_new_password_literal);
SDEFINE_VAR_MORE(str_uri_timeout, str_one_day_expire);

If you try to fit it all at once, you will get weird macro errors.
It's also more readable this way.

Remember that anything other that strings you will have to define and free
yourself.

struct example_struct *example = NULL;
SDEFINE_VAR_ALL(str_username, str_password);
...
SFREE(example->member);
SFREE(example);
SFREE_PWORD(str_password);
SFREE_ALL();

However, defining a function to cleanly SFREE everything inside a struct
(and the struct itself, with a macro wrapper around the function) is better:
struct example_struct *example = NULL;
DEFINE_VAR_ALL(str_username, str_password);
...
EXAMPLE_STRUCT_FREE(example);
SFREE_PWORD(str_password);
SFREE_ALL();
*/

// Macro code taken from
// https://github.com/pfultz2/Cloak/wiki/C-Preprocessor-tricks,-tips,-and-idioms
// HERE BE DRAGONS
// Maintainer: joseph
//@@@@@@@@@@@@@@@@@@@@@**^^""~~~"^@@^*@*@@**@@@@@@@@@
//@@@@@@@@@@@@@*^^'"~   , - ' '; ,@@b. '  -e@@@@@@@@@
//@@@@@@@@*^"~      . '     . ' ,@@@@(  e@*@@@@@@@@@@
//@@@@@^~         .       .   ' @@@@@@, ~^@@@@@@@@@@@
//@@@~ ,e**@@*e,  ,e**e, .    ' '@@@@@@e,  "*@@@@@'^@
//@',e@@@@@@@@@@ e@@@@@@       ' '*@@@@@@    @@@'   0
//@@@@@@@@@@@@@@@@@@@@@',e,     ;  ~^*^'    ;^~   ' 0
//@@@@@@@@@@@@@@@^""^@@e@@@   .'           ,'   .'  @
//@@@@@@@@@@@@@@'    '@@@@@ '         ,  ,e'  .    ;@
//@@@@@@@@@@@@@' ,&&,  ^@*'     ,  .  i^"@e, ,e@e  @@
//@@@@@@@@@@@@' ,@@@@,          ;  ,& !,,@@@e@@@@ e@@
//@@@@@,~*@@*' ,@@@@@@e,   ',   e^~^@,   ~'@@@@@@,@@@
//@@@@@@, ~" ,e@@@@@@@@@*e*@*  ,@e  @@""@e,,@@@@@@@@@
//@@@@@@@@ee@@@@@@@@@@@@@@@" ,e@' ,e@' e@@@@@@@@@@@@@
//@@@@@@@@@@@@@@@@@@@@@@@@" ,@" ,e@@e,,@@@@@@@@@@@@@@
//@@@@@@@@@@@@@@@@@@@@@@@~ ,@@@,,0@@@@@@@@@@@@@@@@@@@
//@@@@@@@@@@@@@@@@@@@@@@@@,,@@@@@@@@@@@@@@@@@@@@@@@@@
//"""""""""""""""""""""""""""""""""""""""""""""""""""

#define __SUN__CAT(a, ...) __SUN__PRIMITIVE_CAT(a, __VA_ARGS__)
#define __SUN__PRIMITIVE_CAT(a, ...) a##__VA_ARGS__

#define __SUN__IIF(c) __SUN__PRIMITIVE_CAT(__SUN__IIF_, c)
#define __SUN__IIF_0(t, ...) __VA_ARGS__
#define __SUN__IIF_1(t, ...) t

#define __SUN__COMPL(b) __SUN__PRIMITIVE_CAT(__SUN__COMPL_, b)
#define __SUN__COMPL_0 1
#define __SUN__COMPL_1 0
#define __SUN__BITAND(x) __SUN__PRIMITIVE_CAT(__SUN__BITAND_, x)
#define __SUN__BITAND_0(y) 0
#define __SUN__BITAND_1(y) y

#define __SUN__INC(x) __SUN__PRIMITIVE_CAT(__SUN__INC_, x)
#define __SUN__INC_0 1
#define __SUN__INC_1 2
#define __SUN__INC_2 3
#define __SUN__INC_3 4
#define __SUN__INC_4 5
#define __SUN__INC_5 6
#define __SUN__INC_6 7
#define __SUN__INC_7 8
#define __SUN__INC_8 9
#define __SUN__INC_9 9

#define __SUN__DEC(x) __SUN__PRIMITIVE_CAT(__SUN__DEC_, x)
#define __SUN__DEC_0 0
#define __SUN__DEC_1 0
#define __SUN__DEC_2 1
#define __SUN__DEC_3 2
#define __SUN__DEC_4 3
#define __SUN__DEC_5 4
#define __SUN__DEC_6 5
#define __SUN__DEC_7 6
#define __SUN__DEC_8 7
#define __SUN__DEC_9 8

#define __SUN__CHECK_N(x, n, ...) n
#define __SUN__CHECK(...) __SUN__CHECK_N(__SUN__EXPAND__(__VA_ARGS__), 0, )
#define __SUN__PROBE(x) x, 1,

#define __SUN__IS_PAREN(x) __SUN__CHECK(__SUN__IS_PAREN_PROBE x)
#define __SUN__IS_PAREN_PROBE(...) __SUN__PROBE(~)

#define __SUN__NOT(x) __SUN__CHECK(__SUN__PRIMITIVE_CAT(__SUN__NOT_, x))
#define __SUN__NOT_0 __SUN__PROBE(~)

#define __SUN__EMPTY()
#define __SUN__DEFER(id) id __SUN__EMPTY()
#define __SUN__OBSTRUCT(x) x __SUN__DEFER(__SUN__EMPTY)()
#define __SUN__EXPAND(...) __VA_ARGS__
#define __SUN__EXPAND__(x) x
//#define __SUN__EXPAND(x) x
//#define __SUN__EXPAND__(...)  __SUN__EXPAND(__VA_ARGS__)

#define __SUN__BOOL(x) __SUN__COMPL(__SUN__NOT(x))
#define __SUN__IF(c) __SUN__IIF(__SUN__BOOL(c))
#define __SUN__EAT(...)
//#define __SUN__WHEN(c) __SUN__IF(c)(__SUN__EXPAND__, __SUN__EAT)
#define __SUN__WHEN(x) __SUN__PRIMITIVE_CAT(__SUN__WHEN_, x)
#define __SUN__WHEN_0 __SUN__EAT
#define __SUN__WHEN_1 __SUN__EXPAND__
#define __SUN__WHEN_2 __SUN__EXPAND__
#define __SUN__WHEN_3 __SUN__EXPAND__
#define __SUN__WHEN_4 __SUN__EXPAND__
#define __SUN__WHEN_5 __SUN__EXPAND__
#define __SUN__WHEN_6 __SUN__EXPAND__
#define __SUN__WHEN_7 __SUN__EXPAND__
#define __SUN__WHEN_8 __SUN__EXPAND__
#define __SUN__WHEN_9 __SUN__EXPAND__

#define __SUN__PP_ARG0_(arg0, ...) arg0
#define __SUN__PP_REST_(arg0, ...) __SUN__EXPAND__(__VA_ARGS__)
//#define __SUN__PP_ARG0(args) __SUN__PP_ARG0_ args
//#define __SUN__PP_REST(args) __SUN__PP_REST_ args

#define __SUN__EVAL(...) __SUN__EVAL1(__SUN__EVAL1(__SUN__EVAL1(__VA_ARGS__)))
#define __SUN__EVAL1(...) __SUN__EVAL2(__SUN__EVAL2(__SUN__EVAL2(__VA_ARGS__)))
#define __SUN__EVAL2(...) __SUN__EVAL3(__SUN__EVAL3(__SUN__EVAL3(__VA_ARGS__)))
#define __SUN__EVAL3(...) __SUN__EVAL4(__SUN__EVAL4(__SUN__EVAL4(__VA_ARGS__)))
#define __SUN__EVAL4(...) __SUN__EVAL5(__SUN__EVAL5(__SUN__EVAL5(__VA_ARGS__)))
#define __SUN__EVAL5(...) __VA_ARGS__

/*#ifdef _WIN32
#define __SUN__REPEAT(count, macro, A, ...)                                                                                      \
	__SUN__WHEN(count)                                                                                                           \
	(__SUN__EXPAND__(__SUN__OBSTRUCT(__SUN__REPEAT_INDIRECT)()(__SUN__DEC(count), macro, __VA_ARGS__))                           \
			__SUN__OBSTRUCT(macro)(__SUN__DEC(count), A))
#define __SUN__REPEAT_INDIRECT() __SUN__REPEAT
#else*/
#define __SUN__REPEAT(count, macro, A, ...)                                                                                      \
	__SUN__WHEN(count)                                                                                                           \
	(__SUN__OBSTRUCT(__SUN__REPEAT_INDIRECT)()(__SUN__DEC(count), macro, __VA_ARGS__)__SUN__OBSTRUCT(macro)(__SUN__DEC(count), A))
#define __SUN__REPEAT_INDIRECT() __SUN__REPEAT
//#endif

#define SSTR_VALUE(arg) #arg
#define SDEFINE_ADDRESSOF_REPEAT(A, B)                                                                                           \
	sun_list[A] = &B;                                                                                                            \
	sun_name_list[A] = SSTR_VALUE(B);
#define SDEFINE_ADDRESSOF_MORE_REPEAT(A, B)                                                                                      \
	sun_list[old_sun_len + A] = &B;                                                                                              \
	sun_name_list[old_sun_len + A] = SSTR_VALUE(B);

#define SDEFINE_REPEAT(A, B) /*A*/ SDEFINE_VAR(B)

#define SDEFINE_VAR(A) char *A = NULL;
#define SFREE(A)                                                                                                                 \
	if (A != NULL) {                                                                                                             \
		free(A);                                                                                                                 \
		A = NULL;                                                                                                                \
	}
#define SFREE_PWORD(A)                                                                                                           \
	if (A != NULL) {                                                                                                             \
		bfree_pword(A, strlen(A));                                                                                               \
		A = NULL;                                                                                                                \
	}
#define SBFREE_PWORD(A, B)                                                                                                       \
	if (A != NULL) {                                                                                                             \
		bfree_pword(A, B);                                                                                                       \
		A = NULL;                                                                                                                \
	}

// NOBODY CAN EVER USE sun_len OR sun_list
#define SDEFINE_VAR_ALL(...)                                                                                                     \
	size_t sun_len = VA_NUM_ARGS(__VA_ARGS__);                                                                                   \
	size_t old_sun_len = sun_len;                                                                                                \
	if (old_sun_len) {                                                                                                           \
	}                                                                                                                            \
	__SUN__EVAL(__SUN__REPEAT(VA_NUM_ARGS(__VA_ARGS__), SDEFINE_REPEAT, ##__VA_ARGS__))                                          \
	char ***sun_list = salloc(sizeof(char **) * VA_NUM_ARGS(__VA_ARGS__));                                                       \
	char **sun_name_list = salloc(sizeof(char *) * VA_NUM_ARGS(__VA_ARGS__));                                                    \
	char ***old_sun_list = {0};                                                                                                  \
	if (old_sun_list) {                                                                                                          \
	}                                                                                                                            \
	char **old_sun_name_list = {0};                                                                                              \
	if (old_sun_name_list) {                                                                                                     \
	}                                                                                                                            \
	__SUN__EVAL(__SUN__REPEAT(VA_NUM_ARGS(__VA_ARGS__), SDEFINE_ADDRESSOF_REPEAT, ##__VA_ARGS__))

#define SDEFINE_VAR_MORE(...)                                                                                                    \
	old_sun_len = sun_len;                                                                                                       \
	sun_len = sun_len + VA_NUM_ARGS(__VA_ARGS__);                                                                                \
	__SUN__EVAL(__SUN__REPEAT(VA_NUM_ARGS(__VA_ARGS__), SDEFINE_REPEAT, ##__VA_ARGS__))                                          \
	old_sun_list = sun_list;                                                                                                     \
	old_sun_name_list = sun_name_list;                                                                                           \
	sun_list = salloc(sizeof(char **) * (old_sun_len + VA_NUM_ARGS(__VA_ARGS__)));                                               \
	sun_name_list = salloc(sizeof(char *) * (old_sun_len + VA_NUM_ARGS(__VA_ARGS__)));                                           \
	memcpy(sun_list, old_sun_list, sizeof(char **) * old_sun_len);                                                               \
	memcpy(sun_name_list, old_sun_name_list, sizeof(char *) * old_sun_len);                                                      \
	SFREE(old_sun_list);                                                                                                         \
	SFREE(old_sun_name_list);                                                                                                    \
	__SUN__EVAL(__SUN__REPEAT(VA_NUM_ARGS(__VA_ARGS__), SDEFINE_ADDRESSOF_MORE_REPEAT, ##__VA_ARGS__))

// WRAP CODE IN BLOCK TO PUT VARIABLES IN SCOPE
#define SFREE_ALL()                                                                                                              \
	while (sun_len > 0) {                                                                                                        \
		sun_len--;                                                                                                               \
		if (bol_error_state) {                                                                                                   \
			SVAR("%s: %s", sun_name_list[sun_len], *sun_list[sun_len]);                                                          \
		}                                                                                                                        \
		SFREE(*sun_list[sun_len]);                                                                                               \
	}                                                                                                                            \
	SFREE(sun_list);                                                                                                             \
	SFREE(sun_name_list);                                                                                                        \
	sun_len = 0;

// WRAP CODE IN BLOCK TO PUT VARIABLES IN SCOPE
#define SFREE_PWORD_ALL()                                                                                                        \
	{                                                                                                                            \
		size_t i = 0;                                                                                                            \
		while (i < sun_len) {                                                                                                    \
			SFREE_PWORD(*sun_list[i]);                                                                                           \
			i++;                                                                                                                 \
		}                                                                                                                        \
	}                                                                                                                            \
	SFREE(sun_list);                                                                                                             \
	SFREE(sun_name_list);
