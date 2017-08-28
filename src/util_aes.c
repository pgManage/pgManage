#include "util_aes.h"

char str_global_aes_key[32];
char str_global_aes_iv[16];
char str_global_aes_key_init[32];
char str_global_aes_iv_init[16];

void set_aes_key_iv();

char *aes_encrypt(char *str_plaintext_input, size_t *ptr_int_plaintext_length) {
	SDEFINE_VAR_ALL(str_output, str_plaintext);
	char *str_return = NULL;

	// initialize
	set_aes_key_iv();
	AES_KEY AESkey;
	size_t int_old_plaintext_length = *ptr_int_plaintext_length;

	*ptr_int_plaintext_length = ((*ptr_int_plaintext_length + AES_BLOCK_SIZE) / AES_BLOCK_SIZE) * AES_BLOCK_SIZE;
	size_t int_aes_length = *ptr_int_plaintext_length;
	//*ptr_int_plaintext_length = (*ptr_int_plaintext_length) -
	//((*ptr_int_plaintext_length) %
	// 16) + 16;

	SERROR_SALLOC(str_plaintext, *ptr_int_plaintext_length);
	memset(str_plaintext, 0, *ptr_int_plaintext_length);
	memcpy(str_plaintext, str_plaintext_input, int_old_plaintext_length);

	SERROR_SALLOC(str_output, int_aes_length + 1);
	memset(str_output, 0, int_aes_length);

	AES_set_encrypt_key((const unsigned char *)str_global_aes_key, 256, &AESkey);

	AES_cbc_encrypt((const unsigned char *)str_plaintext, (unsigned char *)str_output, int_aes_length, &AESkey,
		(unsigned char *)str_global_aes_iv, AES_ENCRYPT);
	/*
	AES_cbc_encrypt((const unsigned char *)str_plaintext, (unsigned char
	*)str_output,
			int_new_length, &AESkey, (unsigned char *)str_global_aes_iv,
	AES_ENCRYPT);
	*/

	// int int_original_length = int_new_length;
	// int_new_length = (int_new_length & 0xFFFFFFF0) + ((int_new_length & 0x0F) ?
	// 16 : 0);
	//*(str_output + int_new_length) = (int_new_length - int_original_length);

	// printf("str_output: %s\012", str_output);

	// encrypt
	// aes_setkey_enc(&aes, (unsigned char *)key, 256);
	// aes_crypt_cbc(&aes, AES_ENCRYPT, *plaintext_len, (unsigned char *)iv,
	// (unsigned char
	// *)plaintext, (unsigned char *)str_output);

	// base64
	str_return = b64encode(str_output, ptr_int_plaintext_length);

	bol_error_state = false;
	SFREE_ALL();

	return str_return;
error:
	SFREE_ALL();

	SFREE_PWORD(str_return);
	return NULL;
}

char *aes_decrypt(char *str_ciphertext_base64, size_t *ptr_int_ciphertext_length) {
	SDEFINE_VAR_ALL(str_ciphertext);
	char *str_return = NULL;

	// base64
	// printf("test1>%d<\012", *ciphertext_len);
	str_ciphertext = b64decode(str_ciphertext_base64, ptr_int_ciphertext_length);
	// printf("str_ciphertext: %s\012", str_ciphertext);

	// initialize
	set_aes_key_iv();
	AES_KEY AESkey;
	SERROR_SALLOC(str_return, *ptr_int_ciphertext_length + 1);
	memset(str_return, 0, *ptr_int_ciphertext_length);
	// printf("test2>%d<\012", *ptr_int_ciphertext_length);
	// encrypt
	AES_set_decrypt_key((const unsigned char *)str_global_aes_key, 256, &AESkey);

	AES_cbc_encrypt((const unsigned char *)str_ciphertext, (unsigned char *)str_return, *ptr_int_ciphertext_length, &AESkey,
		(unsigned char *)str_global_aes_iv, AES_DECRYPT);

	// aes_crypt_cbc(&aes, AES_DECRYPT, *ciphertext_len, (unsigned char *)iv,
	// (unsigned char
	// *)str_ciphertext, (unsigned char *)str_return);
	// printf("test3>%d<\012", *ciphertext_len);
	SFREE_ALL();

	return str_return;
error:
	SFREE_ALL();
	SFREE_PWORD(str_return);
	return NULL;
}

bool init_aes_key_iv() {
	// production
	SERROR_CHECK(RAND_bytes((unsigned char *)str_global_aes_key_init, 32), "RAND_bytes failed");
	SERROR_CHECK(RAND_bytes((unsigned char *)str_global_aes_iv_init, 16), "RAND_bytes failed");

	return true;
error:
	return false;
}

/*
When the encryption or decryption funcitons are run, they run smaller internal
functions that
change the key and iv for each block that is encrypted/decrypted. So when we
want to encrypt or
decrypt we have to reset the key/iv so that we can start the same way every
time.
*/
void set_aes_key_iv() {
	memcpy(str_global_aes_key, str_global_aes_key_init, 32);
	memcpy(str_global_aes_iv, str_global_aes_iv_init, 16);
}
