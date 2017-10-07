#include "common_ssl.h"

extern bool bol_tls;

ssize_t client_read(struct sock_ev_client *client, void *buf, size_t int_len) {
	if (bol_tls) {
		int int_status = 0;
		if (client->bol_ssl_handshake == false) {
			SDEBUG("SSL_accept");
			int_status = SSL_accept(client->ssl);
			if (int_status == true) {
				SDEBUG("SSL_read");
				client->bol_ssl_handshake = true;
				int_status = SSL_read(client->ssl, buf, (int)int_len);
			}
		} else {
			SDEBUG("SSL_read");
			int_status = SSL_read(client->ssl, buf, (int)int_len);
		}
		if (int_status <= 0) {
			int int_error = SSL_get_error(client->ssl, int_status);
			SERROR_NORESPONSE("int_error: %d (%s)", int_error, ERR_error_string((long unsigned int)int_error, NULL));
			SFREE(str_global_error);
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

// (bol_tls ? tls_read(C->tls_pgmanage_io_context, V, L) : (ssize_t)read((int)C->_int_sock, V, L))
// (bol_tls ? tls_write(C->tls_pgmanage_io_context, V, L) : (ssize_t)write((int)C->_int_sock, V, L))
