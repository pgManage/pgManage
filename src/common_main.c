#ifdef _WIN32
#include <windows.h>
#include <winsock2.h>
#include <ws2tcpip.h>

#ifndef EV_CONFIG_H
#define EV_CONFIG_H "ev_config.h.win32"
#include "../dependencies/libev/ev.c"
#endif // EV_CONFIG_H
#else
#include <ev.h>
#endif

#include "common_server.h"
#include <openssl/crypto.h>
#include <stdio.h>

#ifdef _WIN32
#include <direct.h>
#include <stdlib.h>
#endif

#ifdef _WIN32
#pragma comment(lib, "Ws2_32.lib")
#ifdef _WIN64
#pragma comment(lib, "../lib/x64/libpq.lib")
#pragma comment(lib, "../lib/x64/libssl-43.lib")
#pragma comment(lib, "../lib/x64/libcrypto-41.lib")
#else
#pragma comment(lib, "../lib/x86/libpq.lib")
#pragma comment(lib, "../lib/x86/libssl-43.lib")
#pragma comment(lib, "../lib/x86/libcrypto-41.lib")
#endif
#endif

SOCKET int_sock = INVALID_SOCKET;

ev_periodic last_activity_free_timer;
ev_signal sigint_watcher;
ev_signal sigterm_watcher;
ev_signal sigbreak_watcher;

/*
This function is run when the program exits
*/
void program_exit() {
	fprintf(stderr, SUN_PROGRAM_UPPER_NAME" IS SHUTTING DOWN\n");
	if (global_loop != NULL) {
		size_t int_i, int_len;

		ev_io_stop(global_loop, &_server.io);
		if (int_global_login_timeout > 0) {
			ev_periodic_stop(global_loop, &last_activity_free_timer);
		}
		ev_signal_stop(global_loop, &sigint_watcher);
		ev_signal_stop(global_loop, &sigterm_watcher);
		ev_signal_stop(global_loop, &sigbreak_watcher);

		if (_server.list_client != NULL) {
			while (List_first(_server.list_client) != NULL) {
				client_close_immediate(List_first(_server.list_client));
			}
			List_destroy(_server.list_client);
			_server.list_client = NULL;
		}

		if (_server.arr_client_last_activity != NULL) {
			for (int_i = 0, int_len = DArray_end(_server.arr_client_last_activity); int_i < int_len; int_i += 1) {
				struct sock_ev_client_last_activity *client_last_activity =
					(struct sock_ev_client_last_activity *)DArray_get(_server.arr_client_last_activity, int_i);
				client_last_activity_free(client_last_activity);
			}
			DArray_destroy(_server.arr_client_last_activity);
		}

		SFREE(str_global_port);
		SFREE(str_global_error);
		SFREE(str_global_config_file);
		SFREE(str_global_connection_file);
		SFREE(str_global_login_group);
		SFREE(str_global_sql_root);
		SFREE(str_global_web_root);
		SFREE(str_global_data_root);
		SFREE(str_global_tls_cert);
		SFREE(str_global_tls_key);
		SFREE(str_global_log_level);
#ifdef _WIN32

		SFREE(POSTAGE_PREFIX);
#endif

		for (int_i = 0, int_len = DArray_end(darr_global_connection); int_i < int_len; int_i += 1) {
			struct struct_connection *conninfo = (struct struct_connection *)DArray_get(darr_global_connection, int_i);
			if (conninfo != NULL) {
				connection_free(conninfo);
			}
		}
		DArray_destroy(darr_global_connection);

		if (bol_tls) {
			SSL_CTX_free(_server.ssl_ctx);
		}
		EVP_cleanup();
		CRYPTO_cleanup_all_ex_data();
		ERR_free_strings();

#if OPENSSL_VERSION_NUMBER < 0x10100000L
		ERR_remove_thread_state(NULL);
#endif

		ev_break(global_loop, EVBREAK_ALL);
		ev_loop_destroy(global_loop);
		global_loop = NULL;

#ifdef _WIN32
		WSACleanup();
#else
		close(int_sock);
#endif
	}
	DB_finish_framework();
}

/*
This function is run when the program gets a SIGINT or a SIGTERM
*/
void sigint_cb(EV_P, ev_signal *w, int revents) {
	if (EV_A != NULL) {
	} // get rid of unused parameter warning
	if (w != NULL) {
	} // get rid of unused parameter warning
	if (revents != 0) {
	} // get rid of unused parameter warning
	program_exit();
}

void free_last_activity(EV_P, ev_periodic *w, int revents) {
	if (EV_A != NULL) {
	} // get rid of unused parameter warning
	if (w != NULL) {
	} // get rid of unused parameter warning
	if (revents != 0) {
	} // get rid of unused parameter warning
	size_t int_i, int_len;
	struct sock_ev_client_last_activity *client_last_activity = NULL;
	struct sock_ev_client *client = NULL;
	bool bol_no_clients, bol_skip = false;
	if (_server.arr_client_last_activity != NULL) {
		for (int_i = 0, int_len = DArray_end(_server.arr_client_last_activity); int_i < int_len; int_i += 1) {
			client_last_activity = (struct sock_ev_client_last_activity *)DArray_get(_server.arr_client_last_activity, int_i);
			if (client_last_activity != NULL &&
				(ev_now(global_loop) - client_last_activity->last_activity_time) >= int_global_login_timeout) {
				bol_no_clients = true;
				{
					LIST_FOREACH(_server.list_client, first, next, node) {
						client = node->value;
						SDEBUG("client: %p", client);
						SDEBUG("client->bol_request_in_progress: %s",
							client != NULL ? (client->bol_request_in_progress ? "true" : "false") : "(null)");
						if (client != NULL && (ssize_t)int_i == client->int_last_activity_i &&
							client->bol_request_in_progress == false) {
							bol_no_clients = false;
						} else if (client != NULL && (ssize_t)int_i == client->int_last_activity_i &&
								   client->bol_request_in_progress == true) {
							bol_skip = true;
							break;
						}
					}
				}

				if (bol_skip == false) {
					LIST_FOREACH(_server.list_client, first, next, node) {
						client = node->value;
						if (client != NULL && client->int_last_activity_i > (ssize_t)int_i) {
							client->int_last_activity_i -= 1;
						}
					}
				} else {
					bol_skip = false;
					continue;
				}

				if (bol_no_clients == false) {
					ListNode *node = _server.list_client->first;
					for (; node != NULL;) {
						client = node->value;
						SDEBUG("client: %p", client);
						SDEBUG("client->bol_request_in_progress: %s",
							client != NULL ? (client->bol_request_in_progress ? "true" : "false") : "(null)");
						if (client != NULL && (ssize_t)int_i == client->int_last_activity_i &&
							client->bol_request_in_progress == false) {
							node = node->next;
							client_close_immediate(client);
						} else {
							node = node->next;
						}
						SDEBUG("node: %p", node);
					}
				}

				if (bol_no_clients == true) {
					SDEBUG("client_last_activity: %p", client_last_activity);
					client_last_activity_free(client_last_activity);

					DArray_set(_server.arr_client_last_activity, int_i, NULL);
				}
			}
		}

		DArray *new_arr_client_last_activity = DArray_create(sizeof(struct sock_ev_client_last_activity *), 1);
		if (new_arr_client_last_activity == NULL) {
			SERROR_NORESPONSE("DArray_create failed");
			return;
		}

		for (int_i = 0, int_len = DArray_end(_server.arr_client_last_activity); int_i < int_len; int_i += 1) {
			client_last_activity = (struct sock_ev_client_last_activity *)DArray_get(_server.arr_client_last_activity, int_i);
			if (client_last_activity != NULL) {
				DArray_push(new_arr_client_last_activity, client_last_activity);
			}
		}

		DArray_destroy(_server.arr_client_last_activity);
		_server.arr_client_last_activity = new_arr_client_last_activity;
	}
}

/*
Program entry point
*/
int main(int argc, char *const *argv) {
	memset(&sigint_watcher, 0, sizeof(ev_signal));
	memset(&sigterm_watcher, 0, sizeof(ev_signal));
	memset(&sigbreak_watcher, 0, sizeof(ev_signal));
#ifdef _WIN32
	WORD w_version_requested;
	WSADATA wsa_data;
	int err;
	w_version_requested = MAKEWORD(2, 2);

	err = WSAStartup(w_version_requested, &wsa_data);
	if (err != 0) {
		printf("WSAStartup failed with error: %d\n", err);
		return 1;
	}
#endif
#ifdef _WIN32
	SERROR_CHECK(_getcwd(cwd, sizeof(cwd)) != NULL, "getcwd failed");
#else
	SERROR_CHECK(getcwd(cwd, sizeof(cwd)) != NULL, "getcwd failed");
#endif

	// This would be an SERROR_CHECK, but the parse_options function already
	// prints an error if it fails
	if (parse_options(argc, argv) == false) {
		goto error;
	}
	SINFO("Configuration finished");

	global_loop = ev_default_loop(0);
	SERROR_CHECK(global_loop != NULL, "ev_default_loop failed!");

	if (int_global_login_timeout > 0) {
		memset(&last_activity_free_timer, 0, sizeof(ev_periodic));
		ev_periodic_init(&last_activity_free_timer, free_last_activity, 0, (ev_tstamp)(int_global_login_timeout) / 10, NULL);
		ev_periodic_start(global_loop, &last_activity_free_timer);
	}

	ev_signal_init(&sigint_watcher, sigint_cb, SIGINT);
	ev_signal_start(global_loop, &sigint_watcher);
	ev_signal_init(&sigterm_watcher, sigint_cb, SIGTERM);
	ev_signal_start(global_loop, &sigterm_watcher);
#ifdef SIGBREAK
	ev_signal_init(&sigterm_watcher, sigint_cb, SIGBREAK);
	ev_signal_start(global_loop, &sigterm_watcher);
#endif

	memset(&_server, 0, sizeof(_server));

#ifdef _WIN32
#else
	// clear sigpipe handler
	signal(SIGPIPE, SIG_IGN);
#endif

	struct addrinfo hints;
	struct addrinfo *res;

	// atexit(program_exit);

	SERROR_CHECK(DB_init_framework(), "DB_init_framework() failed");

	// Check if we have the tls cert/key
	if (str_global_tls_cert != NULL && str_global_tls_key != NULL) {
		bol_tls = true;

	} else {
		// We don't, so just listen on http
		bol_tls = false;
	}

	// Initialize AES
	SSL_library_init();
	init_aes_key_iv();

	// Get address info
	memset(&hints, 0, sizeof(hints));
	hints.ai_family = AF_INET;
	hints.ai_socktype = SOCK_STREAM;
	hints.ai_flags = AI_PASSIVE;
	int int_status = getaddrinfo(NULL, str_global_port, &hints, &res);
	SERROR_CHECK(int_status == 0, "getaddrinfo failed: %d (%s)", int_status, gai_strerror(int_status));

	// Get socket to bind
	int_sock = socket(res->ai_family, res->ai_socktype, res->ai_protocol);
	SERROR_CHECK(int_sock != INVALID_SOCKET, "Failed to create socket");

	// Set socket to reuse the address
	int bol_reuseaddr = 1;
	SERROR_CHECK(setsockopt((int)int_sock, SOL_SOCKET, SO_REUSEADDR, &bol_reuseaddr, sizeof(int)) != -1, "setsockopt failed");

	((struct sockaddr_in *)(res->ai_addr))->sin_addr.s_addr = htonl(bol_global_local_only ? INADDR_LOOPBACK : INADDR_ANY);
	// Bind socket
	SERROR_CHECK(bind(int_sock, res->ai_addr, (socklen_t)res->ai_addrlen) != -1, "bind failed");

	freeaddrinfo(res);

	// Listen on socket
	SERROR_CHECK(listen(int_sock, 10) != -1, "listen failed");

	// Set socket to NONBLOCK
	setnonblock(int_sock);

	// Create Client List
	_server.list_client = List_create();
	_server.arr_client_last_activity = DArray_create(sizeof(struct sock_ev_client_last_activity), 128);
	_server.int_sock = int_sock;

	if (bol_tls) {
		// Initialize an SSL context
		_server.ssl_ctx = SSL_CTX_new(SSLv23_server_method());
		if (!_server.ssl_ctx) {
			perror("Unable to create SSL context");
			ERR_print_errors_fp(stderr);
			goto error;
		}

		// Set the certificate file
		if (SSL_CTX_use_certificate_file(_server.ssl_ctx, str_global_tls_cert, SSL_FILETYPE_PEM) <= 0) {
			ERR_print_errors_fp(stderr);
			goto error;
		}

		// Set the key file
		if (SSL_CTX_use_PrivateKey_file(_server.ssl_ctx, str_global_tls_key, SSL_FILETYPE_PEM) <= 0) {
			ERR_print_errors_fp(stderr);
			goto error;
		}

		if (SSL_CTX_set_cipher_list(_server.ssl_ctx, "HIGH:!aNULL") != 1) {
			ERR_print_errors_fp(stderr);
			goto error;
		}
	}

// Add callback for readable data
#ifdef _WIN32
	int fd = _open_osfhandle(int_sock, 0);
	ev_io_init(&_server.io, server_cb, fd, EV_READ);
#else
	ev_io_init(&_server.io, server_cb, int_sock, EV_READ);
#endif
	ev_io_start(global_loop, &_server.io);

	printf("\n\nOpen %s://<this computer's ip>:%s/ in your web browser\n", bol_tls ? "https" : "http", str_global_port);
	fflush(0);

	ev_run(global_loop, 0);

	return 0;
error:
	if (global_loop != NULL) {
		program_exit();
	}
	return 1;
}
