#include "util_salloc.h"

void *salloc(size_t size) {
	void *void_return = malloc(size);
	// 	void *void_return = NULL; //for debugging only
	if (void_return) {
		memset(void_return, '\0', size);
		return void_return;
	}

	// Darn it. Oh Hey! Maybe memory will be okay in 2 seconds =)
	sleep(2);
	void_return = malloc(size);
	if (void_return) {
		memset(void_return, '\0', size);
		return void_return;
	}

	// Oh come on, it seems we have some serious problems
	SERROR_NORESPONSE("Out of memory.");
	return NULL;
}

void *srealloc(void *void_ptr, size_t size) {
	void *void_return = realloc(void_ptr, size);
	// 	void *void_return = NULL; //for debugging only
	if (void_return) {
		return void_return;
	}

	// Darn it. Oh Hey! Maybe memory will be okay in 2 seconds =)
	sleep(2);
	void_return = realloc(void_ptr, size);
	if (void_return) {
		return void_return;
	}

	// Oh come on, it seems we have some serious problems
	SERROR_NORESPONSE("Out of memory.");
	return NULL;
}

/* overwrites a variable variable until the null byte, then frees it
*
* pword must be a C-string with a NUL terminator
*/
void bfree_pword(char volatile *str_pword, size_t int_len) {
	memset((char *)str_pword, 0, int_len);
	// SERROR_NORESPONSE("secure free: >%s<", (char *)pword);
	free((char *)str_pword);
}
