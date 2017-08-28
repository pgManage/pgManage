#pragma once
/*
Handles encryption/decryption of cookies.
*/

#ifndef _CRT_SECURE_NO_DEPRECATE
#define _CRT_SECURE_NO_DEPRECATE 1
#endif

#include <stdbool.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <time.h>

#include "util_base64.h"
#include "util_string.h"

#include <openssl/aes.h>
#include <openssl/rand.h>

/*
Encrypts plaintext. The second argument is a pointer to the length. The length
will be changed to the length of the resulting ciphertext.
*/
char *aes_encrypt(char *str_plaintext, size_t *ptr_int_plaintext_length);
/*
Decrypts ciphertext. The second argument is a pointer to the length. The length
will be changed to the length of the resulting plaintext.
*/
char *aes_decrypt(char *str_ciphertext_base64, size_t *ptr_int_ciphertext_length);

/*
Initializes the AES key and iv. Only needs to be run once at start of program.
*/
bool init_aes_key_iv();
