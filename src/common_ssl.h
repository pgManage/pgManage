#pragma once

#include <openssl/ssl.h>
#include <openssl/err.h>

#include "common_client_struct.h"

#define SOCK_WANT_WRITE -2
#define SOCK_WANT_READ -3

ssize_t client_read(struct sock_ev_client *client, void *buf, size_t int_len);
ssize_t client_write(struct sock_ev_client *client, void *buf, size_t int_len);
