#include "util_base64.h"

// for salloc
#include "util_salloc.h"
// for strlen
#include <string.h>

#include <openssl/bio.h>
#include <openssl/buffer.h>
#include <openssl/evp.h>

/*
 * INTERFACE FUNCTIONS
 */
// encode function
// arg1: input string
// arg2: pointer to length of input string
// returns pointer to output string, arg2 gets replaced with length
char *b64encode(const char *input, size_t *plen) {
	BIO *bio, *b64;
	char *str_return = NULL;
	BUF_MEM *bufferPtr = NULL;

	b64 = BIO_new(BIO_f_base64());
	bio = BIO_new(BIO_s_mem());
	bio = BIO_push(b64, bio);

	BIO_set_flags(b64, BIO_FLAGS_BASE64_NO_NL);
	BIO_write(bio, input, (int)(*plen));
	SERROR_CHECK(BIO_flush(bio) == 1, "BIO_flush() failed");
	BIO_get_mem_ptr(bio, &bufferPtr);

	SERROR_SALLOC(str_return, bufferPtr->length + 1);
	memcpy(str_return, bufferPtr->data, bufferPtr->length);
	str_return[bufferPtr->length] = 0;
	*plen = bufferPtr->length;

	BIO_free_all(bio);

	return str_return;
error:
	SFREE(str_return);
	return NULL;
}

// decode function
// arg1: input string
// arg2: pointer to length of input string
// returns pointer to output string, arg2 gets replaced with length
char *b64decode(const char *str_input, size_t *plen) {
	BIO *bio, *b64;
	char *str_return = NULL;
	SERROR_SALLOC(str_return, (*plen) + 1);

	b64 = BIO_new(BIO_f_base64());
	bio = BIO_new_mem_buf((char *)str_input, (int)(*plen));
	bio = BIO_push(b64, bio);

	BIO_set_flags(b64, BIO_FLAGS_BASE64_NO_NL);
	*plen = (size_t)BIO_read(b64, str_return, (int)(*plen));
	BIO_free_all(bio);

	return str_return;
error:
	SFREE(str_return);
	return NULL;
}
