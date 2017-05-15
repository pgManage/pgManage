#include "common_ssl.h"

extern bool bol_tls;

ssize_t client_read(struct sock_ev_client *client, void *buf, size_t int_len) {
	if (bol_tls) {
		int int_status = SSL_read(client->ssl, buf, (int)int_len);
		if (int_status <= 0) {
			int int_error = SSL_get_error(client->ssl, int_status);
			if (int_error == SSL_ERROR_WANT_READ) {
				return SOCK_WANT_READ;
			} else if (int_error == SSL_ERROR_WANT_WRITE) {
				return SOCK_WANT_WRITE;
			} else {
				return -abs(int_error);
			}
		} else {
			return int_status;
		}
	} else {
		return (ssize_t)read((int)client->_int_sock, buf, int_len);
	}
}

ssize_t client_write(struct sock_ev_client *client, void *buf, size_t int_len) {
	if (bol_tls) {
		int int_status = SSL_write(client->ssl, buf, (int)int_len);
		if (int_status <= 0) {
			int int_error = SSL_get_error(client->ssl, int_status);
			if (int_error == SSL_ERROR_WANT_READ) {
				return SOCK_WANT_READ;
			} else if (int_error == SSL_ERROR_WANT_WRITE) {
				return SOCK_WANT_WRITE;
			} else {
				return -abs(int_error);
			}
		} else {
			return int_status;
		}
	} else {
		return (ssize_t)write((int)client->_int_sock, buf, int_len);
	}
}

// (bol_tls ? tls_read(C->tls_postage_io_context, V, L) : (ssize_t)read((int)C->_int_sock, V, L))
// (bol_tls ? tls_write(C->tls_postage_io_context, V, L) : (ssize_t)write((int)C->_int_sock, V, L))
