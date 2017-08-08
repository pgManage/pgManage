// Hark ye onlooker: Adding UTIL_DEBUG to this file slows it down considerably. You have been warned.
#include "common_client.h"

#ifdef _WIN32
#define strtol _strtoi64
#endif

// **************************************************************************************
// **************************************************************************************
// ************************************ NOTICE/NOTIFY ***********************************
// **************************************************************************************
// **************************************************************************************

void notice_processor(void *arg, const char *str_notice) {
	struct sock_ev_client *client = (struct sock_ev_client *)arg;
	char *str_temp = NULL;
	char *str_temp_escape = NULL;
	SDEBUG("%s", str_notice);
	char *ptr_actual_message = strstr(str_notice, ": ");
	size_t int_notice_len = 0;

	if (ptr_actual_message == NULL) {
		ptr_actual_message = (char *)str_notice;
		str_notice = "NOTICE";
	} else {
		ptr_actual_message += 2;
		*(ptr_actual_message - 2) = 0;
	}
	size_t int_temp_len = strlen(ptr_actual_message);
	str_temp = bunescape_value(ptr_actual_message, &int_temp_len);
	SDEBUG("%s\t%s", str_notice, str_temp);
	str_temp_escape = bescape_value(str_temp, &int_temp_len);
	if (client->str_notice != NULL) {
		int_notice_len = strlen(client->str_notice);
		SERROR_SNFCAT(client->str_notice, &int_notice_len,
			"\012", (size_t)1,
			str_notice, strlen(str_notice),
			"\t", (size_t)1,
			str_temp_escape, int_temp_len);
	} else {
		SERROR_SNCAT(client->str_notice, &int_notice_len,
			str_notice, strlen(str_notice),
			"\t", (size_t)1,
			str_temp_escape, int_temp_len);
	}
	SFREE(str_temp);
	SFREE(str_temp_escape);
	bol_error_state = false;
	return;

error:
	SFREE(str_temp);
	SFREE(str_temp_escape);
	SERROR_NORESPONSE("notice_processor failed");
	bol_error_state = false;
}
#ifdef POSTAGE_INTERFACE_LIBPQ
void _send_notices(struct sock_ev_client *client) {
	char str_temp[101] = {0};
	char *str_temp2 = NULL;
	char *str_response = NULL;
	size_t int_response_len = 0;

	PGnotify *pg_notify_current = NULL;
	pg_notify_current = PQnotifies(client->cnxn);

	SDEBUG("preparing to send notices");
	if (client->str_notice != NULL) {
		SDEBUG("sending notices");
		if (client->cur_request != NULL) {
			client->cur_request->int_response_id += 1;
			snprintf(str_temp, 100, "%zd", client->cur_request->int_response_id);
			SFINISH_SNCAT(str_response, &int_response_len,
				"messageid = ", (size_t)12,
				client->cur_request->str_message_id, strlen(client->cur_request->str_message_id),
				"\012responsenumber = ", (size_t)18,
				str_temp, strlen(str_temp),
				"\012", (size_t)1);
			if (client->cur_request->str_transaction_id != NULL) {
				SFINISH_SNFCAT(str_response, &int_response_len,
					"transactionid = ", (size_t)16,
					client->cur_request->str_transaction_id, strlen(client->cur_request->str_transaction_id),
					"\012", (size_t)1);
			}
		} else {
			SFINISH_SNCAT(str_response, &int_response_len,
				"messageid = NULL\012", (size_t)17);
		}
		SFINISH_SNFCAT(str_response, &int_response_len,
			client->str_notice != NULL ? client->str_notice : "",
			client->str_notice != NULL ? strlen(client->str_notice) : (size_t)0);
		SFREE(client->str_notice);
		WS_sendFrame(global_loop, client, true, 0x01, str_response, strlen(str_response));
		if (client->cur_request != NULL) {
			DArray_push(client->cur_request->arr_response, str_response);
		} else {
			SFREE(str_response);
		}
		str_response = NULL;
		SDEBUG("notices sent");
	}

	if (pg_notify_current != NULL) {
		SFINISH_SNCAT(str_response, &int_response_len,
			"messageid = NULL\012", (size_t)17);
	}
	while (pg_notify_current != NULL) {
		memset(str_temp, 0, 101);
		sprintf(str_temp, "%d", pg_notify_current->be_pid);
		size_t int_temp2_len = pg_notify_current->extra != NULL ? strlen(pg_notify_current->extra) : 0;
		str_temp2 = bescape_value(pg_notify_current->extra != NULL ? pg_notify_current->extra : "", &int_temp2_len);
		SFINISH_CHECK(str_temp2 != NULL, "bescape_value failed");
		SFINISH_SNFCAT(str_response, &int_response_len,
			"NOTIFY\t", (size_t)7,
			pg_notify_current->relname, strlen(pg_notify_current->relname),
			"\t", (size_t)1,
			str_temp, strlen(str_temp),
			"\t", (size_t)1,
			str_temp2, strlen(str_temp2),
			"\012", (size_t)1);
		SDEBUG("%s", str_response);
		PQfreemem(pg_notify_current);

		pg_notify_current = PQnotifies(client->cnxn);
	}
	if (str_response != NULL) {
		WS_sendFrame(global_loop, client, true, 0x01, str_response, strlen(str_response));
	}
finish:
	errno = 0;
	bol_error_state = false;
	if (pg_notify_current != NULL) {
		PQfreemem(pg_notify_current);
		pg_notify_current = NULL;
	}
	SFREE(str_temp2);
	SFREE(str_response);
	SDEBUG("done sending notices");
}

static void cnxn_reset_cb(EV_P, ev_io *w, int revents) {
	if (revents != 0) {
	} // get rid of unused parameter warning
	struct sock_ev_client_cnxn *client_cnxn = (struct sock_ev_client_cnxn *)w;
	char *str_response = NULL;

	PostgresPollingStatusType status = PQresetPoll(client_cnxn->parent->conn->conn);

	// Some debug info
	switch (PQstatus(client_cnxn->parent->conn->conn)) {
		case CONNECTION_STARTED:
			SDEBUG("waiting for connection to be made.");
			break;
		case CONNECTION_MADE:
			SDEBUG("connection OK; waiting to send.");
			break;
		case CONNECTION_AWAITING_RESPONSE:
			SDEBUG("waiting for a response from the _server.");
			break;
		case CONNECTION_AUTH_OK:
			SDEBUG("received authentication; waiting for backend start-up to finish.");
			break;
		case CONNECTION_SSL_STARTUP:
			SDEBUG("negotiating SSL encryption.");
			break;
		case CONNECTION_SETENV:
			SDEBUG("negotiating environment-driven parameter settings.");
			break;
		case CONNECTION_OK:
			SDEBUG("CONNECTION_OK");
			break;
		case CONNECTION_BAD:
			SDEBUG("CONNECTION_BAD");
			break;
		case CONNECTION_NEEDED:
			SDEBUG("CONNECTION_NEEDED");
			break;
	}

	if (status == PGRES_POLLING_OK) {
		// Connection made
		SDEBUG("PGRES_POLLING_OK");
		ev_io_stop(EV_A, &client_cnxn->io);
		client_cnxn->parent->conn->int_status = 1;
		cnxn_cb(EV_A, client_cnxn->parent, client_cnxn->parent->conn);
		if (client_cnxn->parent->client_reconnect_timer != NULL) {
			ev_prepare_stop(EV_A, &client_cnxn->parent->client_reconnect_timer->prepare);
			SFREE(client_cnxn->parent->client_reconnect_timer);

			decrement_idle(EV_A);
		}

	} else if (status == PGRES_POLLING_FAILED) {
		// Connection failed
		SDEBUG("PGRES_POLLING_FAILED");
		SFINISH_ERROR("Connect failed: %s", PQerrorMessage(client_cnxn->parent->conn->conn));

	} else if (status == PGRES_POLLING_READING) {
		// We want to read
		SDEBUG("PGRES_POLLING_READING");

		ev_io_stop(EV_A, w);
		ev_io_set(w, GET_CONN_PQ_SOCKET(client_cnxn->parent->conn), EV_READ);
		ev_io_start(EV_A, w);

	} else if (status == PGRES_POLLING_WRITING) {
		// We want to write
		SDEBUG("PGRES_POLLING_WRITING");

		ev_io_stop(EV_A, w);
		ev_io_set(w, GET_CONN_PQ_SOCKET(client_cnxn->parent->conn), EV_WRITE);
		ev_io_start(EV_A, w);
	}
	bol_error_state = false;
finish:
	if (str_response != NULL) {
		ev_io_stop(EV_A, w);
		client_cnxn->parent->conn->int_status = -1;
		SFREE(client_cnxn->parent->conn->str_response);
		client_cnxn->parent->conn->str_response = strdup(str_response + 6);
		SFREE(str_response);

		struct sock_ev_client *client = client_cnxn->parent;
		client_cnxn->parent->reconnect_watcher = NULL;
		SFREE(client_cnxn);

		ev_prepare_stop(EV_A, &client->client_reconnect_timer->prepare);
		SFREE(client->client_reconnect_timer);
		decrement_idle(EV_A);

		cnxn_cb(EV_A, client, client->conn);
	}
}

void client_reconnect_timer_cb(EV_P, ev_prepare *w, int revents) {
	if (revents != 0) {
	} // get rid of unused parameter warning
	struct sock_ev_client_reconnect_timer *client_reconnect_timer = (struct sock_ev_client_reconnect_timer *)w;
	struct sock_ev_client *client = client_reconnect_timer->parent;

	if ((client_reconnect_timer->close_time + 10) < ev_now(EV_A)) {
		ev_io_stop(EV_A, &client->reconnect_watcher->io);
		DB_finish(client->conn);

		if (client->client_reconnect_timer != NULL) {
			ev_prepare_stop(EV_A, &client->client_reconnect_timer->prepare);
			SFREE(client->client_reconnect_timer);

			decrement_idle(EV_A);
		}

		client_close(client);
	}
}

void client_notify_cb(EV_P, ev_io *w, int revents) {
	if (revents != 0) {
	} // get rid of unused parameter warning
	struct sock_ev_client_notify_watcher *notify_watcher = (struct sock_ev_client_notify_watcher *)w;
	struct sock_ev_client *client = notify_watcher->parent;
	struct sock_ev_client_cnxn *client_cnxn = NULL;
	int int_status = 1;
	SDEFINE_VAR_ALL(str_conninfo);
	if (client->conn == NULL) {
		ev_io_stop(EV_A, w);
		SFREE_ALL();
		return;
	}
	if (socket_is_open(PQsocket(client->conn->conn)) == false) {
		int_status = -1;
	} else if (client->cur_request == NULL) {
		int_status = PQconsumeInput(client->conn->conn);
		if (int_status == 1) {
			send_notices(notify_watcher->parent);

			PQisBusy(notify_watcher->parent->cnxn);
			send_notices(notify_watcher->parent);
		}
	}
	if (int_status != 1) {
		SERROR_NORESPONSE("Lost postgresql connection:\012%s", PQerrorMessage(client->cnxn));
		SFREE(str_global_error);

		SERROR_CHECK(PQresetStart(client->conn->conn) == 1, "PQresetStart failed");

		ev_io_stop(EV_A, &client->notify_watcher->io);
		SFREE(client->notify_watcher);

		SFREE(client->reconnect_watcher);
		SERROR_SALLOC(client_cnxn, sizeof(struct sock_ev_client_cnxn));
		client_cnxn->parent = client;
		client_cnxn->parent->conn->int_status = 0;
		client->reconnect_watcher = client_cnxn;

		SERROR_SALLOC(client->client_reconnect_timer, sizeof(struct sock_ev_client_reconnect_timer));
		ev_prepare_init(&client->client_reconnect_timer->prepare, client_reconnect_timer_cb);
		ev_prepare_start(EV_A, &client->client_reconnect_timer->prepare);
		client->client_reconnect_timer->parent = client;
		client->client_reconnect_timer->close_time = ev_now(EV_A);
		increment_idle(EV_A);

		// set up cnxn socket
		SERROR_SET_CONN_PQ_SOCKET(client->conn);
		ev_io_init(&client_cnxn->io, cnxn_reset_cb, GET_CLIENT_PQ_SOCKET(client), EV_WRITE);
		ev_io_start(EV_A, &client_cnxn->io);

		SFREE_ALL();
		return;
	}
	bol_error_state = false;
error:
	if (bol_error_state && int_status != 1) {
		client_close(client);
	}
	bol_error_state = false;
	SFREE_ALL();
	SFREE(client_cnxn);
}
#endif
// **************************************************************************************
// **************************************************************************************
// ************************************** READ READY ************************************
// **************************************************************************************
// **************************************************************************************

// client socket has data
void client_cb(EV_P, ev_io *w, int revents) {
	if (revents != 0) {
	} // get rid of unused parameter warning
	struct sock_ev_client *client = (struct sock_ev_client *)w;

	unsigned char *str_request = NULL;
	bool bol_request_finished = false;
	char *str_buffer = NULL;
	ssize_t int_len = 0;
	size_t int_content_length = 0;
	size_t int_response_len = 0;
	size_t int_uri_length = 0;
	size_t int_cookie_name_len = 0;
#ifdef ENVELOPE
#else
	size_t int_conn_index_len = 0;
#endif

#ifdef _WIN32
	char *str_temp = NULL;
#endif
	SDEFINE_VAR_ALL(str_response, str_conninfo, str_query);
	SDEFINE_VAR_MORE(str_session_id, str_client_cookie, str_session_client_cookie);
	SDEFINE_VAR_MORE(str_ip_address, str_upper_request, str_conn_index, str_uri_temp);

	SERROR_SALLOC(str_buffer, MAX_BUFFER + 1);

	SDEBUG("revents: %x", revents);
	SDEBUG("EV_READ: %s", revents & EV_READ ? "true" : "false");
	SDEBUG("EV_WRITE: %s", revents & EV_WRITE ? "true" : "false");
	SDEBUG("client->bol_handshake: %s", client->bol_handshake ? "true" : "false");
	SDEBUG("client->bol_connected: %s", client->bol_connected ? "true" : "false");

	// we haven't done the handshake yet
	if (client->bol_handshake == false) {
		errno = 0;
		int_len = client_read(client, str_buffer, MAX_BUFFER);
		SDEBUG("client->int_request_len: %zu", client->int_request_len);
		SDEBUG("int_len: %zd", int_len);
		SWARN_CHECK(
			client->int_request_len > 0 || int_len != 0, "Libev said EV_READ, but there is nothing to read. Closing socket");

		if (int_len >= 0) {
			if (bol_tls == false && (client->int_request_len == 0 || int_len == 0) && bstrstr(str_buffer, (size_t)int_len, "HTTP", 4) == NULL) {
				SERROR("Someone is trying to connect with TLS!");
			}

			SERROR_SREALLOC(client->str_request, (size_t)((ssize_t)client->int_request_len + int_len + 1));
			memcpy(client->str_request + client->int_request_len, str_buffer, (size_t)int_len);
			client->int_request_len += (size_t)int_len;
			client->str_request[client->int_request_len] = '\0';
		} else if (int_len == SOCK_WANT_READ) {
			ev_io_stop(EV_A, w);
			ev_io_set(w, w->fd, EV_READ);
			ev_io_start(EV_A, w);
		} else if (int_len == SOCK_WANT_WRITE) {
			ev_io_stop(EV_A, w);
			ev_io_set(w, w->fd, EV_WRITE);
			ev_io_start(EV_A, w);
		} else if (int_len < 0) {
			SERROR("client_read() failed");
		}

		if (client->bol_upload == false) {
			SERROR_SALLOC(str_upper_request, client->int_request_len + 1);
			memcpy(str_upper_request, client->str_request, client->int_request_len);
			bstr_toupper(str_upper_request, client->int_request_len);
			client->bol_upload =
				(bstrstr(str_upper_request, client->int_request_len, "CONTENT-TYPE: MULTIPART/FORM-DATA; BOUNDARY=",
					 strlen("CONTENT-TYPE: MULTIPART/FORM-DATA; BOUNDARY=")) != NULL);
		}

		char *ptr_content_length =
			bstrstr(str_upper_request, client->int_request_len, "CONTENT-LENGTH", strlen("CONTENT-LENGTH"));
		if (client->bol_upload == true) {
			if (str_upper_request == NULL) {
				SERROR_SALLOC(str_upper_request, client->int_request_len + 1);
				memcpy(str_upper_request, client->str_request, client->int_request_len);
				bstr_toupper(str_upper_request, client->int_request_len);
			}
			if (client->str_boundary == NULL) {
				char *boundary_ptr =
					bstrstr(str_upper_request, client->int_request_len, "CONTENT-TYPE: MULTIPART/FORM-DATA; BOUNDARY=",
						strlen("CONTENT-TYPE: MULTIPART/FORM-DATA; BOUNDARY=")) +
					44;
				boundary_ptr = client->str_request + (boundary_ptr - str_upper_request);
				char *boundary_end_ptr =
					strchr(boundary_ptr, 13) != 0 ? strchr(boundary_ptr, '\015') : strchr(boundary_ptr, '\012');
				if (boundary_end_ptr != NULL) {
					client->int_boundary_length = (size_t)(boundary_end_ptr - boundary_ptr);
					SERROR_SALLOC(client->str_boundary, (size_t)client->int_boundary_length + 3); // extra and null byte
					memcpy(client->str_boundary, boundary_ptr, client->int_boundary_length);
					client->str_boundary[client->int_boundary_length + 0] = '-';
					client->str_boundary[client->int_boundary_length + 1] = '-';
					client->str_boundary[client->int_boundary_length + 2] = '\0';
					client->int_boundary_length += 2;
				} else {
					bol_request_finished = false;
				}
			}

			if (client->str_boundary != NULL) {
				if (bstrstr(client->str_request + client->int_request_len - int_len, (size_t)int_len, client->str_boundary,
						client->int_boundary_length) == NULL) {
					bol_request_finished = false;
				} else {
					bol_request_finished = true;
				}
			}

		} else if (bstrstr(str_upper_request, client->int_request_len, "CONTENT-LENGTH", strlen("CONTENT-LENGTH")) != NULL) {
			ptr_content_length += 14;
			while (*ptr_content_length != 0 && (*ptr_content_length < '0' || *ptr_content_length > '9')) {
				ptr_content_length += 1;
			}
			int_content_length = (size_t)strtol(ptr_content_length, NULL, 10);
			char *ptr_temp_unix = bstrstr(client->str_request, client->int_request_len, "\012\012", 2);
			char *ptr_temp_dos = bstrstr(client->str_request, client->int_request_len, "\015\012\015\012", 4);
			char *ptr_temp_mac = bstrstr(client->str_request, client->int_request_len, "\015\015", 2);

			char *ptr_temp = ptr_temp_unix != NULL ? ptr_temp_unix : ptr_temp_dos != NULL ? ptr_temp_dos : ptr_temp_mac;
			if (ptr_temp == NULL) {
				bol_request_finished = false;
			} else {
				while (*ptr_temp != 0 && (*ptr_temp == '\012' || *ptr_temp == '\015')) {
					ptr_temp += 1;
				}
				bol_request_finished = (client->int_request_len - (size_t)(ptr_temp - client->str_request)) == int_content_length;
			}

		} else {
			char *ptr_temp_unix = bstrstr(client->str_request, client->int_request_len, "\012\012", 2);
			char *ptr_temp_dos = bstrstr(client->str_request, client->int_request_len, "\015\012\015\012", 4);
			char *ptr_temp_mac = bstrstr(client->str_request, client->int_request_len, "\015\015", 2);

			char *ptr_temp = ptr_temp_unix != NULL ? ptr_temp_unix : ptr_temp_dos != NULL ? ptr_temp_dos : ptr_temp_mac;
			bol_request_finished = ptr_temp != NULL;
		}

		if (bol_request_finished) {
			size_t int_ip_address_len = 0;
			str_ip_address = request_header(client->str_request, client->int_request_len, "x-forwarded-for", &int_ip_address_len);
			if (str_ip_address != NULL && int_ip_address_len < (INET_ADDRSTRLEN - 1)) {
				SINFO("str_ip_address: %s", str_ip_address);
				memcpy(client->str_client_ip, str_ip_address, int_ip_address_len);
				SFREE(str_ip_address);
			} else {
				bol_error_state = false;
				SFREE(str_global_error);
			}


			size_t int_i = 0, int_header_len = client->int_request_len;
			SDEBUG("client->bol_upload: %s", client->bol_upload ? "true" : "false");
			if (client->bol_upload) {
				char *ptr_temp_unix = bstrstr(client->str_request, client->int_request_len, "\012\012", 2);
				char *ptr_temp_dos = bstrstr(client->str_request, client->int_request_len, "\015\012\015\012", 4);
				char *ptr_temp_mac = bstrstr(client->str_request, client->int_request_len, "\015\015", 2);

				ptr_temp_unix = ptr_temp_unix != NULL ? ptr_temp_unix : client->str_request + client->int_request_len;
				ptr_temp_dos = ptr_temp_dos != NULL ? ptr_temp_dos : client->str_request + client->int_request_len;
				ptr_temp_mac = ptr_temp_mac != NULL ? ptr_temp_mac : client->str_request + client->int_request_len;

				char *ptr_temp = ptr_temp_unix < ptr_temp_dos ? ptr_temp_unix : ptr_temp_dos;
				ptr_temp = ptr_temp < ptr_temp_mac ? ptr_temp : ptr_temp_mac;

				int_header_len = (size_t)(ptr_temp - client->str_request);
			}
			SDEBUG("int_header_len: %d", int_header_len);
			while (int_i < int_header_len) {
				// Check if the character is not printable
				if ((unsigned char)(client->str_request[int_i]) != 9 && (unsigned char)(client->str_request[int_i]) != 10 &&
					(unsigned char)(client->str_request[int_i]) != 13 &&
					((unsigned char)(client->str_request[int_i]) < 32 ||
						((unsigned char)(client->str_request[int_i]) > 126 &&
							(unsigned char)(client->str_request[int_i]) < 160))) {
					char str_int_code[4] = {0};
					snprintf(str_int_code, 3, "%d", (unsigned char)(client->str_request[int_i]));
					SERROR_SNCAT(str_response, &int_response_len,
						"HTTP/1.1 400 Bad Request\015\012Connection: close\015\012\015\012An invalid character with the code '", (size_t)83,
						str_int_code, strlen(str_int_code),
						"' was found", (size_t)11);

					SBFREE_PWORD(str_upper_request, client->int_request_len);

					if ((int_len = client_write(client, str_response, strlen(str_response))) < 0) {
						SERROR_NORESPONSE("client_write() failed");
					}

					SERROR_CLIENT_CLOSE(client);

					SFREE(str_request);
					SFREE(str_buffer);
					SFREE_PWORD_ALL();
					bol_error_state = false;
					return;
				}
				int_i += 1;
			}
			if (str_upper_request == NULL) {
				SERROR_SALLOC(str_upper_request, client->int_request_len + 1);
				memcpy(str_upper_request, client->str_request, client->int_request_len);
				bstr_toupper(str_upper_request, client->int_request_len);
			}
			if (bstrstr(str_upper_request, client->int_request_len, "SEC-WEBSOCKET-KEY", strlen("SEC-WEBSOCKET-KEY")) != NULL) {
				str_uri_temp = str_uri_path(client->str_request, client->int_request_len, &int_uri_length);
				SERROR_CHECK(str_uri_temp != NULL, "str_uri_path failed");
#ifdef ENVELOPE
				SERROR_SNCAT(client->str_cookie_name, &int_cookie_name_len,
					"envelope", (size_t)8);
#else
				char *ptr_slash = strchr(str_uri_temp + 9, '/');
				if (ptr_slash != NULL) {
					*ptr_slash = 0;
					SERROR_SNCAT(str_conn_index, &int_conn_index_len,
						str_uri_temp + 9, strlen(str_uri_temp + 9));
					SERROR_SNCAT(client->str_cookie_name, &int_cookie_name_len,
						"postage_", (size_t)8,
						str_conn_index, strlen(str_conn_index));
				}
#endif

				SDEBUG("websocket request");
				size_t int_query_length = 0, int_session_id_length = 0;
				str_query = query(client->str_request, client->int_request_len, &int_query_length);
				str_session_id =
					str_query != NULL ? getpar(str_query, "sessionid", int_query_length, &int_session_id_length) : NULL;
				// query() sets this to true if it fails, we don't want it to in
				// this case
				bol_error_state = false;
				SFREE(str_query);

				struct sock_ev_client *session_client = NULL;
				ListNode *other_client_node = NULL;
				if (str_session_id != NULL) {
					LIST_FOREACH(client->server->list_client, first, next, node) {
						struct sock_ev_client *other_client = node->value;
						SDEBUG("other_client->str_session_id: %s", other_client->str_session_id);
						if (other_client != client && other_client->str_session_id != NULL && strncmp(str_session_id, other_client->str_session_id, 11) == 0) {
							other_client_node = node;
							session_client = other_client;
							break;
						}
					}
				}
				SDEBUG("other_client_node: %p", other_client_node);
				SDEBUG("str_session_id: %s", str_session_id);
				if (other_client_node != NULL) {
					size_t int_current_cookie_len = 0;
					size_t int_session_cookie_len = 0;
					str_client_cookie = str_cookie(client->str_request, client->int_request_len, client->str_cookie_name, &int_current_cookie_len);
					str_session_client_cookie = str_cookie(session_client->str_request, session_client->int_request_len, client->str_cookie_name, &int_session_cookie_len);

					// clang-format off
                    if (
							str_client_cookie != NULL
						&&	str_session_client_cookie != NULL
						&&	strcmp(str_client_cookie, str_session_client_cookie) == 0
						&&	(
									(
										session_client->client_timeout_prepare != NULL
										&&	(
												(session_client->client_timeout_prepare->close_time + 10) > ev_now(EV_A)
											||	session_client->client_timeout_prepare->close_time == 0
										)
									)
								||	session_client->client_timeout_prepare == NULL
							)
						) {
						// clang-format on
						client_timeout_prepare_free(session_client->client_timeout_prepare);

						client->cur_request = session_client->cur_request;
						if (client->cur_request != NULL) {
							client->cur_request->parent = client;
						}
						session_client->cur_request = NULL;
						SINFO("client->cur_request: %p", client->cur_request);

						SINFO("client: %p", client);
						client->que_request = session_client->que_request;
						session_client->que_request = NULL;
						if (client->que_request != NULL) {
							QUEUE_FOREACH(client->que_request, node) {
								struct sock_ev_client_request *client_request = (struct sock_ev_client_request *)node->value;
								client_request->parent = client;
								SINFO("client: %p", client);
								SINFO("client_request->parent: %p", client_request->parent);
							}
						}

						client->bol_request_in_progress = session_client->bol_request_in_progress;

						client->client_paused_request = session_client->client_paused_request;
						session_client->client_paused_request = NULL;

						client->conn = session_client->conn;
						session_client->conn = NULL;
						client_close_immediate(session_client);
					} else {
						SFREE(str_session_id);
					}
				}

				if (client->que_message == NULL) {
					client->que_message = Queue_create();
				}
				if (client->que_request == NULL) {
					client->que_request = Queue_create();
				}
				SERROR_SALLOC(client->client_request_watcher, sizeof(struct sock_ev_client_request_watcher));
				client->client_request_watcher->parent = client;
				ev_check_init(&client->client_request_watcher->check, client_request_queue_cb);
				ev_check_start(EV_A, &client->client_request_watcher->check);
				SDEBUG("client->str_request: %p", client->str_request);

				if (client->conn != NULL) {
					//DB_finish(client->conn);
					client->bol_connected = true;
				}

				////HANDSHAKE
				SERROR_CHECK(
					(str_response = WS_handshakeResponse(client->str_request, client->int_request_len, &int_response_len)) != NULL, "Error getting handshake response");

				SDEBUG("str_response       : %s", str_response);
				SDEBUG("client->str_request: %s", client->str_request);
				// return handshake response
				if ((int_len = client_write(client, str_response, int_response_len)) < 0) {
					SERROR_CLIENT_CLOSE(client);
					SERROR("client_write() failed");
				}
				SFREE(str_response);

				SERROR_SALLOC(client->str_session_id, 10 + 1);
				snprintf(client->str_session_id, 11, "0x%08" PRIu64, int_global_session_id++);
				SERROR_SNCAT(str_response, &int_response_len, "sessionid = ", (size_t)12, client->str_session_id, (size_t)10, "\n", (size_t)1);

				SERROR_CHECK(
					WS_sendFrame(EV_A, client, true, 0x01, str_response, int_response_len), "Failed to send message");

				client->bol_handshake = true;

				if (client->conn == NULL) {
					SDEBUG("client->str_request: %p", client->str_request);
					// set_cnxn does its own error handling
					if (set_cnxn(client, cnxn_cb) == NULL) {
						SERROR_CLIENT_CLOSE(client);
					}
					// set_cnxn has started a connection to the database, now we are done

				} else {
					// The reason for this, is because later functions depend on the
					// values this function sets
					if (set_cnxn(client, NULL) == NULL) {
						SERROR_CLIENT_CLOSE(client);
					}
				}

			} else {
#ifdef ENVELOPE
				SERROR_SNCAT(client->str_cookie_name, &int_cookie_name_len,
					"envelope", (size_t)8);
#else
				str_uri_temp = str_uri_path(client->str_request, client->int_request_len, &int_uri_length);
				SERROR_CHECK(str_uri_temp != NULL, "str_uri_path failed");
				if (int_uri_length > 8) {
					char *ptr_slash = strchr(str_uri_temp + 9, '/');
					if (ptr_slash != NULL) {
						*ptr_slash = 0;
						SERROR_SNCAT(str_conn_index, &int_conn_index_len,
							str_uri_temp + 9, strlen(str_uri_temp + 9));
						SERROR_SNCAT(client->str_cookie_name, &int_cookie_name_len,
							"postage_", (size_t)8,
							str_conn_index, strlen(str_conn_index));
					}
				}
#endif
				SDEBUG("http request");
				ev_io_stop(EV_A, &client->io);
				SBFREE_PWORD(str_upper_request, client->int_request_len);
				http_main(client);
				client = NULL; // it is http_main's responsibility now.
			}
		}

		// handshake already done, let's get down to business
	} else if (client->bol_handshake == true && client->bol_connected == true) {
		SDEBUG("Reading a frame");
		WS_readFrame(EV_A, client, client_frame_cb);
	}

	SDEBUG("Readable callback end");

	SFREE(str_request);
	SFREE(str_buffer);
	if (client != NULL) {
		SBFREE_PWORD(str_upper_request, client->int_request_len);
	}
	SFREE_PWORD_ALL();
	bol_error_state = false;
	return;

error:
	bol_error_state = false;
	if (client != NULL) {
		// This prevents an infinite loop if SERROR_CLIENT_CLOSE fails
		struct sock_ev_client *_client = client;
		client = NULL;

		SERROR_CLIENT_CLOSE(_client);
	}
	SFREE(str_request);
	SFREE(str_buffer);
	if (client != NULL) {
		SBFREE_PWORD(str_upper_request, client->int_request_len);
	}
	SFREE_PWORD_ALL();
}

// **************************************************************************************
// **************************************************************************************
// ************************************* FRAME READY
// ************************************
// **************************************************************************************
// **************************************************************************************

void client_frame_cb(EV_P, WSFrame *frame) {
	char *str_temp = NULL;
	char *str_message_id = NULL;
	char *str_transaction_id = NULL;
	struct sock_ev_client *client = frame->parent;
	size_t int_response_confirmed = 0;
	char *ptr_query = NULL;
	char *ptr_end_query = NULL;
	size_t int_old_length = 0;
	size_t int_message_id_len = 0;
	size_t int_transaction_id_len = 0;
	size_t int_first_word_len = 0;

#ifdef POSTAGE_INTERFACE_LIBPQ
	PGcancel *cancel_request = NULL;
#endif
	struct sock_ev_client_copy_check *client_copy_check = NULL;
	SDEFINE_VAR_ALL(str_first_word, str_temp1, str_temp2);
	SDEBUG("Client %p->int_sock == %d", client, client->int_sock);

	// DEBUG("Read a frame");

	ev_io_start(EV_A, &client->io);

	// The specification requires that we disconnect if the client sends an
	// unmasked message
	if (frame->int_opcode == 0x01 && frame->bol_mask == false) {
		SERROR_CLIENT_CLOSE(client);

		WS_freeFrame(frame);

		SERROR("Client sent unmasked message, disconnected.");
	}

	if (frame->bol_fin == false) {
		if (client->str_message == NULL) {
			SERROR_SNCAT(client->str_message, &client->int_message_len,
				"", (size_t)0);
		}
		int_old_length = client->int_message_len;
		client->int_message_len += frame->int_length;
		SERROR_SREALLOC(client->str_message, client->int_message_len + 1);
		memcpy(client->str_message + int_old_length, frame->str_message, frame->int_length);
		client->str_message[client->int_message_len] = 0;

		WS_freeFrame(frame);
		SFREE_ALL();
		// DEBUG("Concatenated");

		return;

	} else if (frame->int_opcode == 0x00 && frame->bol_fin == true) {
		int_old_length = client->int_message_len;
		client->int_message_len += frame->int_length;
		SERROR_SREALLOC(client->str_message, client->int_message_len + 1);
		memcpy(client->str_message + int_old_length, frame->str_message, frame->int_length);
		client->str_message[client->int_message_len] = 0;

		// DEBUG("Last concatenation");
		SFREE(frame->str_message);

		frame->int_length = client->int_message_len;
		frame->str_message = client->str_message;

		client->int_message_len = 0;
		client->str_message = NULL;
	}

	// opcode 0x08 is never more than one frame and is always less than 126
	// characters
	if (frame->int_opcode == 0x08) {
		SINFO("Got  close frame", client);
#ifdef UTIL_DEBUG
		if (frame->int_length > 2) {
			unsigned short int_close_code =
				(unsigned short)((((unsigned short)frame->str_message[0]) << 8) | ((unsigned short)frame->str_message[1]));
			SDEBUG("Client closed connection with code %u for reason: \"%s\"", int_close_code, frame->str_message + 2);
		}
#endif // UTIL_DEBUG
		while (client->que_message->first != NULL) {
			SINFO("client->que_message->first: %p", client->que_message->first);
			struct sock_ev_client_message *client_message = client->que_message->first->value;
			ev_io_stop(EV_A, &client_message->io);
			WSFrame *frame_temp = client_message->frame;
			// This removes this node from the queue, so that the next element we want
			// is the first one
			WS_client_message_free(client_message);
			WS_freeFrame(frame_temp);
		}

		SERROR_CHECK(WS_sendFrame(EV_A, client, true, 0x08, frame->str_message, frame->int_length), "Failed to send message");
		SINFO("Sent close frame", client);

		client->bol_is_open = false;

		WS_freeFrame(frame);

	} else if (frame->int_opcode == 0x09) {
		SDEBUG("Got  ping frame", client);
		SERROR_CHECK(WS_sendFrame(EV_A, client, true, 0x0A, frame->str_message, frame->int_length), "Failed to send message");
		SDEBUG("Sent pong frame", client);
		WS_freeFrame(frame);

	} else if (frame->bol_fin == true && (frame->int_opcode == 0x02 || frame->int_opcode == 0x01 || frame->int_opcode == 0x00)) {
		// Without this, we segfault
		SERROR_CHECK(frame->str_message[0] != '\0', "Empty message");

		// Without this, somebody is allowed to send all manner of weird things
		// without any error at all
		SERROR_CHECK(strncmp(frame->str_message, "messageid = ", 12) == 0, "Invalid message format");

		// Advance past the message id and null terminate it so that
		// frame->str_message contains the message id line
		ptr_query = strchr(frame->str_message, '\012') + 1;

		// Without this, we segfault
		SERROR_CHECK(ptr_query != NULL, "Invalid message format");
		*(ptr_query - 1) = 0;

		ptr_end_query = frame->str_message + frame->int_length;

		SERROR_SNCAT(str_message_id, &int_message_id_len,
			frame->str_message + 12, (size_t)(ptr_query - (frame->str_message + 12)));

		// same for transaction id (if there is one)
		if (strncmp(ptr_query, "transactionid = ", 16) == 0) {
			char *ptr_query2 = ptr_query;
			ptr_query = strchr(ptr_query, '\012') + 1;
			*(ptr_query - 1) = 0;
			SERROR_SNCAT(str_transaction_id, &int_transaction_id_len,
				ptr_query2 + 16, ptr_end_query - (ptr_query2 + 16));
		}

		int_first_word_len = strncspn(ptr_query, ptr_end_query - ptr_query, "\t \012", (size_t)3);
		SERROR_SNCAT(str_first_word, &int_first_word_len,
			ptr_query, int_first_word_len);

		bstr_toupper(str_first_word, int_first_word_len);

		struct sock_ev_client_request *client_request = NULL;

		if (strcmp(str_first_word, "SELECT") == 0) {
			client_request = create_request(client, frame, str_message_id, str_transaction_id, ptr_query,
				sizeof(struct sock_ev_client_select), POSTAGE_REQ_SELECT, ws_select_free);

			SERROR_CHECK(client_request != NULL, "create_request failed!");

		} else if (strcmp(str_first_word, "INSERT") == 0) {
			client_request = create_request(client, frame, str_message_id, str_transaction_id, ptr_query,
				sizeof(struct sock_ev_client_insert), POSTAGE_REQ_INSERT, ws_insert_free);

			SERROR_CHECK(client_request != NULL, "create_request failed!");

		} else if (strcmp(str_first_word, "UPDATE") == 0) {
			client_request = create_request(client, frame, str_message_id, str_transaction_id, ptr_query,
				sizeof(struct sock_ev_client_update), POSTAGE_REQ_UPDATE, ws_update_free);

			SERROR_CHECK(client_request != NULL, "create_request failed!");

		} else if (strcmp(str_first_word, "DELETE") == 0) {
			client_request = create_request(client, frame, str_message_id, str_transaction_id, ptr_query,
				sizeof(struct sock_ev_client_delete), POSTAGE_REQ_DELETE, ws_delete_free);

			SERROR_CHECK(client_request != NULL, "create_request failed!");

		} else if (strcmp(str_first_word, "BEGIN") == 0) {
			client_request = create_request(client, frame, str_message_id, str_transaction_id, ptr_query,
				0, POSTAGE_REQ_BEGIN, NULL);

			SERROR_CHECK(client_request != NULL, "create_request failed!");

		} else if (strcmp(str_first_word, "COMMIT") == 0) {
			client_request = create_request(client, frame, str_message_id, str_transaction_id, ptr_query,
				0, POSTAGE_REQ_COMMIT, NULL);

			SERROR_CHECK(client_request != NULL, "create_request failed!");

		} else if (strcmp(str_first_word, "ROLLBACK") == 0) {
			client_request = create_request(client, frame, str_message_id, str_transaction_id,ptr_query,
				0, POSTAGE_REQ_ROLLBACK, NULL);

			SERROR_CHECK(client_request != NULL, "create_request failed!");

#ifdef ENVELOPE
#else
		} else if (strcmp(str_first_word, "RAW") == 0) {
			client_request = create_request(client, frame, str_message_id, str_transaction_id, ptr_query,
				sizeof(struct sock_ev_client_raw), POSTAGE_REQ_RAW, ws_raw_free);

			SERROR_CHECK(client_request != NULL, "create_request failed!");
#endif
#ifdef ENVELOPE
		} else if (strcmp(str_first_word, "FILE") == 0) {
			client_request = create_request(client, frame, str_message_id, str_transaction_id, ptr_query,
				sizeof(struct sock_ev_client_file), POSTAGE_REQ_FILE, ws_file_free);

			SERROR_CHECK(client_request != NULL, "create_request failed!");
#else
		} else if (strcmp(str_first_word, "TAB") == 0) {
			client_request = create_request(client, frame, str_message_id, str_transaction_id, ptr_query,
				sizeof(struct sock_ev_client_tab), POSTAGE_REQ_TAB, ws_tab_free);

			SERROR_CHECK(client_request != NULL, "create_request failed!");
#endif

		} else if (strcmp(str_first_word, "INFO") == 0) {
			client_request = create_request(client, frame, str_message_id, str_transaction_id, ptr_query,
				0, POSTAGE_REQ_INFO, NULL);

			SERROR_CHECK(client_request != NULL, "create_request failed!");

#ifdef ENVELOPE
		} else if (strcmp(str_first_word, "ACTION") == 0) {
			client_request = create_request(client, frame, str_message_id, str_transaction_id, ptr_query,
				0, POSTAGE_REQ_ACTION, NULL);

			SERROR_CHECK(client_request != NULL, "create_request failed!");
#endif

#ifdef POSTAGE_INTERFACE_LIBPQ
		} else if (strcmp(str_first_word, "CANCEL") == 0) {
			int int_ret_val = 0;
			SINFO("==============================================CANCEL==============================================");
			SDEBUG("client->conn->copy_check: %p", client->conn->copy_check);
			SDEBUG("client->cur_request: %p", client->cur_request);

			cancel_request = PQgetCancel(client->cnxn);
			SERROR_SALLOC(str_temp1, 256);
			int_ret_val = PQcancel(cancel_request, str_temp1, 256);
			PQfreeCancel(cancel_request);
			if (int_ret_val != 1) {
				str_temp2 = SERROR_RESPONSE("PQcancel failed: %s", str_temp1);
				WS_sendFrame(EV_A, client, 0x01, true, str_temp2, strlen(str_temp2));
				SFREE(str_temp2);
			}
			SFREE(str_temp1);

			if (client->conn->copy_check != NULL) {
				SINFO("copy_check branch");
				struct sock_ev_client_request *client_request = client->conn->copy_check->cb_data;

				client_request->bol_cancel_return = true;

				char str_temp[101] = { 0 };
				client_request->int_response_id += 1;
				snprintf(str_temp, 100, "%zd", client_request->int_response_id);

				SFREE(client_request->str_current_response);

				char *_str_response = "TRANSACTION COMPLETED";
				if (client_request->str_transaction_id != NULL) {
					SERROR_SNCAT(client_request->str_current_response, &client_request->int_current_response_length,
						"messageid = ", (size_t)12,
						client_request->str_message_id, client_request->int_message_id_len,
						"\012responsenumber = ", (size_t)18,
						str_temp, strlen(str_temp),
						"\012transactionid = ", (size_t)17,
						client_request->str_transaction_id, client_request->int_message_id_len,
						"\012", (size_t)1,
						_str_response, strlen(_str_response));
				} else {
					SERROR_SNCAT(client_request->str_current_response, &client_request->int_current_response_length,
						"messageid = ", (size_t)12,
						client_request->str_message_id, client_request->int_message_id_len,
						"\012responsenumber = ", (size_t)18,
						str_temp, strlen(str_temp),
						"\012", (size_t)1,
						_str_response, strlen(_str_response));
				}

			}
#ifdef ENVELOPE
#else
			else if (client->cur_request != NULL) {
				SINFO("cur_request branch");
				struct sock_ev_client_request *client_request = client->cur_request;

				if (client_request->int_req_type == POSTAGE_REQ_RAW && client_request->client_request_data != NULL) {
					struct sock_ev_client_raw *client_raw = (struct sock_ev_client_raw *)client_request->client_request_data;

					if (client_raw->copy_check != NULL) {
						char str_temp[101] = { 0 };
						client_request->int_response_id += 1;
						snprintf(str_temp, 100, "%zd", client_request->int_response_id);

						char *_str_response = "TRANSACTION COMPLETED";
						if (client_request->str_transaction_id != NULL) {
							SERROR_SNCAT(client_request->str_current_response, &client_request->int_current_response_length,
								"messageid = ", (size_t)12,
								client_request->str_message_id, client_request->int_message_id_len,
								"\012responsenumber = ", (size_t)18,
								str_temp, strlen(str_temp),
								"\012transactionid = ", (size_t)17,
								client_request->str_transaction_id, client_request->int_message_id_len,
								"\012", (size_t)1,
								_str_response, strlen(_str_response));
						} else {
							SERROR_SNCAT(client_request->str_current_response, &client_request->int_current_response_length,
								"messageid = ", (size_t)12,
								client_request->str_message_id, client_request->int_message_id_len,
								"\012responsenumber = ", (size_t)18,
								str_temp, strlen(str_temp),
								"\012", (size_t)1,
								_str_response, strlen(_str_response));
						}

						int int_status = PQsendQuery(client_request->parent->cnxn, "ROLLBACK");
						if (int_status != 1) {
							SERROR_NORESPONSE("Query failed: %s", PQerrorMessage(client_request->parent->cnxn));
						} else {
							query_callback(EV_A, client_request, ws_raw_step3);
						}
					}
				}
			}
#endif

			WS_freeFrame(frame);
			SFREE(str_message_id);
			SFREE(str_transaction_id);
			SINFO("==============================================CANCEL==============================================");
#endif

		} else if (strcmp(str_first_word, "CONFIRM") == 0) {
			ptr_query += strlen("CONFIRM") + 1;
			int_response_confirmed = (size_t)strtol(ptr_query, NULL, 10);
			SDEBUG("CONFIRMING %d", int_response_confirmed);
			SDEBUG("client->cur_request: %p", client->cur_request);
			if (client->cur_request != NULL) {
				SDEBUG("client->cur_request->arr_response: %p", client->cur_request->arr_response);
				if (client->cur_request->arr_response != NULL) {
					if (DArray_max(client->cur_request->arr_response) > (int_response_confirmed - 1)) {
						void *el = DArray_get(client->cur_request->arr_response, int_response_confirmed - 1);
						SDEBUG("el: %p", el);
						SDEBUG(
							"DArray_end(client->cur_request->arr_response): %d", DArray_end(client->cur_request->arr_response));
						if (el != NULL) {
							bool bol_last_confirm = false;
							char *ptr_message = (char *)el;
							SDEBUG("ptr_message: %s", ptr_message);
							ptr_message = strstr(ptr_message, "\012responsenumber");
							SDEBUG("ptr_message: %s", ptr_message);
							if (ptr_message != NULL) {
								ptr_message = strchr(ptr_message + 1, '\012') + 1;
								SDEBUG("ptr_message: %s", ptr_message);

								bol_last_confirm =
									((strncmp(ptr_message, "TRANSACTION ", 12) == 0) ||
										(strncmp(ptr_message, "FATAL\012", 6) == 0) || (strncmp(ptr_message, "OK", 2) == 0));
								if (bol_last_confirm == false) {
									ptr_message = strchr(ptr_message, '\012');
									SDEBUG("ptr_message: %s", ptr_message);
									bol_last_confirm =
										ptr_message != NULL && ((strncmp(ptr_message + 1, "TRANSACTION ", 12) == 0) ||
																   (strncmp(ptr_message + 1, "FATAL\012", 6) == 0) ||
																   (strncmp(ptr_message + 1, "OK", 3) == 0));
								}

								SDEBUG("bol_last_confirm: %s", bol_last_confirm ? "true" : "false");
								SFREE(el);
								DArray_set(client->cur_request->arr_response, int_response_confirmed - 1, NULL);
								if (bol_last_confirm == true) {
									client_request_free(client->cur_request);
								}
							}
						} else {
							bol_error_state = false;
						}
					}
				}
			}

			WS_freeFrame(frame);
			SFREE(str_message_id);
			SFREE(str_transaction_id);

		} else if (strcmp(str_first_word, "SEND") == 0) {
			SINFO("client: %p", client);
			SINFO("client->cur_request: %p", client->cur_request);
			if (client->cur_request != NULL && client->client_copy_check == NULL && strncmp(client->cur_request->str_message_id, str_message_id, strlen(str_message_id)) == 0) {
				SINFO("client->cur_request->arr_response: %p", client->cur_request->arr_response);
				if (client->cur_request->arr_response != NULL) {
					client_copy_check = NULL;
					SERROR_SALLOC(client_copy_check, sizeof(struct sock_ev_client_copy_check));

					ptr_query += strlen("SEND FROM") + 1;
					client_copy_check->int_i = (size_t)strtol(ptr_query, NULL, 10);
					client_copy_check->int_len = DArray_end(client->cur_request->arr_response) + 1;
					SINFO("client_copy_check->int_i  : %d", client_copy_check->int_i);
					SINFO("client_copy_check->int_len: %d", client_copy_check->int_len);
					SINFO("client_request            : %p", client_request);
					client_copy_check->client_request = client->cur_request;
					ev_check_init(&client_copy_check->check, client_send_from_cb);
					ev_check_start(EV_A, &client_copy_check->check);
					increment_idle(EV_A);
					client->client_copy_check = client_copy_check;
				}
			}

			WS_freeFrame(frame);
			SFREE(str_message_id);
			SFREE(str_transaction_id);

		} else {
			SFREE(frame->str_message);
			size_t int_message_len = 0;
			SERROR_SNCAT(frame->str_message, &int_message_len,
				"messageid = ", (size_t)12,
				str_message_id, strlen(str_message_id),
				"\012FATAL\012Invalid Request Type \"", (size_t)29,
				str_first_word, strlen(str_first_word),
				"\"\012", (size_t)2);
			frame->int_length = int_message_len;

			WS_sendFrame(EV_A, client, 0x01, true, frame->str_message, frame->int_length);

			WS_freeFrame(frame);
			SFREE(str_message_id);
			SFREE(str_transaction_id);
		}

		if (client_request != NULL) {
			SDEBUG("Queue_send(%p, %p);", client->que_request, client_request);
			Queue_send(client->que_request, client_request);
			increment_idle(EV_A);
		}
	}
	bol_error_state = false;
	SFREE_ALL();
	return;

error:
	SFREE_ALL();
	WS_freeFrame(frame);
	SFREE(str_message_id);
	SFREE(str_transaction_id);

	bol_error_state = false;
	if (client) {
		// This prevents an infinite loop if SERROR_CLIENT_CLOSE fails
		struct sock_ev_client *_client = client;
		client = NULL;

		SERROR_CLIENT_CLOSE(_client);
	}
}

// **************************************************************************************
// **************************************************************************************
// ***************************** SEND FROM CHECK CALLBACK
// *******************************
// **************************************************************************************
// **************************************************************************************

void client_send_from_cb(EV_P, ev_check *w, int revents) {
	if (revents != 0) {
	} // get rid of unused parameter warning
	struct sock_ev_client_copy_check *client_copy_check = (struct sock_ev_client_copy_check *)w;
	struct sock_ev_client *client = client_copy_check->client_request->parent;
	void *el = NULL;
	char *str_el = NULL;

	if (client_copy_check->int_i < client_copy_check->int_len) {
		el = DArray_get(client->cur_request->arr_response, client_copy_check->int_i - 1);
		if (el != NULL) {
			str_el = (char *)el;
			WS_sendFrame(EV_A, client, true, 0x01, str_el, strlen(str_el));
		} else {
			bol_error_state = false;
		}
		client_copy_check->int_i += 1;
	} else {
		if (client->client_paused_request != NULL) {
			if (client->client_paused_request->revents == EV_CHECK) {
				ev_check_start(EV_A, (ev_check *)client->client_paused_request->watcher);
			} else {
				ev_io_start(EV_A, (ev_io *)client->client_paused_request->watcher);
			}
			ev_feed_event(EV_A, client->client_paused_request->watcher, client->client_paused_request->revents);
			SINFO("client->client_paused_request->bol_free_watcher: %s", client->client_paused_request->bol_free_watcher ? "true" : "false");
			if (client->client_paused_request->bol_free_watcher) {
				increment_idle(EV_A);
			}
			SFREE(client->client_paused_request);
		}
		ev_check_stop(EV_A, w);
		decrement_idle(EV_A);
		client->client_copy_check = NULL;
		SFREE(client_copy_check);
	}
}

// **************************************************************************************
// **************************************************************************************
// ********************************** REQUEST STRUCT
// ************************************
// **************************************************************************************
// **************************************************************************************

struct sock_ev_client_request *create_request(struct sock_ev_client *client, WSFrame *frame, char *str_message_id,
	char *str_transaction_id, char *ptr_query, size_t siz_data, size_t int_req_type, sock_ev_client_request_data_free_func free_func) {
	struct sock_ev_client_request *client_request = NULL;
	SERROR_SALLOC(client_request, sizeof(struct sock_ev_client_request));
	client_request->parent = client;

	client_request->frame = frame;
	client_request->str_message_id = str_message_id;
	client_request->int_message_id_len = str_message_id != NULL ? strlen(str_message_id) : 0;
	client_request->str_transaction_id = str_transaction_id;
	client_request->int_transaction_id_len = str_transaction_id	!= NULL ? strlen(str_transaction_id) : 0;
	client_request->ptr_query = ptr_query;
	client_request->cb_data = NULL;

	if (siz_data > 0) {
		SERROR_SALLOC(client_request->client_request_data, siz_data);
		client_request->client_request_data->free = free_func;
	} else {
		client_request->client_request_data = NULL;
	}
	client_request->int_req_type = int_req_type;

	bol_error_state = false;
	return client_request;
error:
	if (client_request != NULL) {
		SFREE(client_request->client_request_data);
	}
	SFREE(client_request);
	return NULL;
}

void _client_request_free(struct sock_ev_client_request *client_request) {
	SDEBUG("Freeing request with messageid %s at location %p", client_request->str_message_id, client_request);
	if (client_request->client_request_data != NULL) {
		client_request->client_request_data->free(client_request->client_request_data);
		SFREE(client_request->client_request_data);
	}
	if (client_request->parent != NULL) {
		client_request->parent->bol_request_in_progress = false;
		client_request->parent->cur_request = NULL;
	}
	if (client_request->arr_response != NULL) {
		SDEBUG("DArray_clear_destroy(%p)", client_request->arr_response);
		DArray_clear_destroy(client_request->arr_response);
	}
	if (client_request->arr_query != NULL) {
		SDEBUG("DArray_clear_destroy(%p)", client_request->arr_query);
		DArray_clear_destroy(client_request->arr_query);
	}
	// http doesn't use this, so don't free it if it isn't there
	if (client_request->frame != NULL) {
		WS_freeFrame(client_request->frame);
	}
	if (client_request->cb_data != NULL) {
		ev_io_stop(global_loop, &client_request->cb_data->io);
		SFREE(client_request->cb_data);
	}
	SFREE(client_request->str_current_response);
	SFREE(client_request->str_message_id);
	SFREE(client_request->str_transaction_id);
	SFREE(client_request);
}

// **************************************************************************************
// **************************************************************************************
// *********************************** REQUEST QUEUE
// ************************************
// **************************************************************************************
// **************************************************************************************

void client_request_queue_cb(EV_P, ev_check *w, int revents) {
	if (revents != 0) {
	} // get rid of unused parameter warning
	struct sock_ev_client_request_watcher *client_request_watcher = (struct sock_ev_client_request_watcher *)w;
	struct sock_ev_client *client = client_request_watcher->parent;
	char *str_query = NULL;
	char *str_response = NULL;
	int int_len = Queue_count(client->que_request);
	size_t int_query_len = 0;
	size_t int_response_len = 0;
	SDEFINE_VAR_ALL(str_sql);

	if (int_len > 0) {
		// SDEBUG("Queue_count(%p->que_request): %d", client, int_len);
		// SDEBUG("%p->bol_request_in_progress: %s", client, client->bol_request_in_progress ? "true" : "false");
	}
	if (client->bol_request_in_progress == false && int_len > 0) {
		struct sock_ev_client_request *client_request = (struct sock_ev_client_request *)Queue_recv(client->que_request);
		client->cur_request = client_request;
		SDEBUG("client->cur_request: %p", client->cur_request);

		decrement_idle(EV_A);

		switch (client_request->int_req_type) {
			case POSTAGE_REQ_SELECT:
				client->bol_request_in_progress = true;
				ws_select_step1(client_request);
				break;
			case POSTAGE_REQ_INSERT:
				client->bol_request_in_progress = true;
				ws_insert_step1(client_request);
				break;
			case POSTAGE_REQ_UPDATE:
				client->bol_request_in_progress = true;
				ws_update_step1(client_request);
				break;
			case POSTAGE_REQ_DELETE:
				client->bol_request_in_progress = true;
				ws_delete_step1(client_request);
				break;
			case POSTAGE_REQ_BEGIN:
			case POSTAGE_REQ_COMMIT:
			case POSTAGE_REQ_ROLLBACK:
				SDEBUG("ROLLBACK OK 1");
				client->bol_request_in_progress = true;
				client_request->arr_response = DArray_create(sizeof(char *), 1);
				if (DB_connection_driver(client->conn) == DB_DRIVER_POSTGRES) {
					//clang-format off
					SFINISH_SNCAT(str_query, &int_query_len,
						client_request->int_req_type == POSTAGE_REQ_BEGIN ? "BEGIN;" :
						client_request->int_req_type == POSTAGE_REQ_COMMIT ? "COMMIT;" :
						client_request->int_req_type == POSTAGE_REQ_ROLLBACK ? "ROLLBACK;" : "",
						strlen(
							client_request->int_req_type == POSTAGE_REQ_BEGIN ? "BEGIN;" :
							client_request->int_req_type == POSTAGE_REQ_COMMIT ? "COMMIT;" :
							client_request->int_req_type == POSTAGE_REQ_ROLLBACK ? "ROLLBACK;" : ""
						));
					//clang-format on
				} else {
					//clang-format off
					SFINISH_SNCAT(str_query, &int_query_len,
						client_request->int_req_type == POSTAGE_REQ_BEGIN ? "BEGIN TRANSACTION;" :
						client_request->int_req_type == POSTAGE_REQ_COMMIT ? "COMMIT TRANSACTION;" :
						client_request->int_req_type == POSTAGE_REQ_ROLLBACK ? "ROLLBACK TRANSACTION;" : "",
						strlen(
							client_request->int_req_type == POSTAGE_REQ_BEGIN ? "BEGIN TRANSACTION;" :
							client_request->int_req_type == POSTAGE_REQ_COMMIT ? "COMMIT TRANSACTION;" :
							client_request->int_req_type == POSTAGE_REQ_ROLLBACK ? "ROLLBACK TRANSACTION;" : ""
						));
		  			//clang-format on
				}

				SFINISH_CHECK(
					DB_exec(EV_A, client_request->parent->conn, client_request, str_query, client_cmd_cb), "DB_exec failed");

				SFREE(str_query);

				break;
#ifdef ENVELOPE
			case POSTAGE_REQ_FILE:
				client->bol_request_in_progress = true;
				ws_file_step1(client_request);
				break;
			case POSTAGE_REQ_ACTION:
				client->bol_request_in_progress = true;
				ws_action_step1(client_request);
				break;
#else
			case POSTAGE_REQ_TAB:
				client->bol_request_in_progress = true;
				ws_tab_step1(client_request);
				break;
			case POSTAGE_REQ_RAW:
				client->bol_request_in_progress = true;
				ws_raw_step1(client_request);
				break;
#endif
			case POSTAGE_REQ_INFO:
				client->bol_request_in_progress = true;
				client_request->arr_response = DArray_create(sizeof(char *), 1);

				size_t int_sql_len = 0;
				if (DB_connection_driver(client->conn) == DB_DRIVER_POSTGRES) {
					SFINISH_SNCAT(str_sql, &int_sql_len,
						"SELECT SESSION_USER::text " //26
						"UNION ALL " //10
						"SELECT g.rolname" //16
						"	FROM pg_catalog.pg_roles g " //28
						"	LEFT JOIN pg_catalog.pg_auth_members m ON m.roleid = g.oid " //60
						"	LEFT JOIN pg_catalog.pg_roles u ON m.member = u.oid " //53
						"	WHERE g.rolcanlogin = FALSE AND u.rolname = SESSION_USER::text AND g.rolname IS NOT NULL",
						(size_t)282); //89
				} else {
					SFINISH_SNCAT(str_sql, &int_sql_len,
						"SELECT CAST(SYSTEM_USER AS nvarchar(MAX)) AS user_group_name, '1' AS srt " //73
						"UNION ALL " //10
						"SELECT CAST([name] AS nvarchar(MAX)) AS user_group_name, '2' AS srt " //68
						"	FROM ( " //8
						"		SELECT *, is_member(name) AS [is_member] " //43
						"			FROM [sys].[database_principals] " //36
						"	) em " //6
						"	WHERE [is_member] = 1 " //23
						"	ORDER BY 2, 1",
						(size_t)281); //14
				}

				SFINISH_CHECK(DB_exec(EV_A, client->conn, client_request, str_sql, ws_client_info_cb), "DB_exec failed");

				break;
		}
	}
finish:
	int_response_len = 0;

	if (str_response != NULL) {
		char *_str_response = str_response;
		size_t _int_response_len = strlen(str_response);
		SFINISH_SNCAT(str_response, &int_response_len,
			"messageid = ", (size_t)12,
			client->cur_request->str_message_id, strlen(client->cur_request->str_message_id),
			"\012responsenumber = 1\012", (size_t)20,
			_str_response, _int_response_len);

		WS_sendFrame(EV_A, client->cur_request->parent, true, 0x01, str_response, int_response_len);
		DArray_push(client->cur_request->arr_response, str_response);
		str_response = NULL;
	}

	SFREE_ALL();
	bol_error_state = false;
	return;
}

// **************************************************************************************
// **************************************************************************************
// ******************************** CONNECTION HANDLER **********************************
// **************************************************************************************
// **************************************************************************************

void cnxn_cb(EV_P, void *cb_data, DB_conn *conn) {
	struct sock_ev_client *client = cb_data;
	char *str_response = NULL;
	SDEFINE_VAR_ALL(str_temp, str_temp_escape);
	size_t int_response_len = 0;
	size_t int_temp_len = 0;

	SDEBUG("TESTING CNXN_CB");
	if (conn->int_status != 1) {
		SERROR_NORESPONSE("%s", conn->str_response);

		int_temp_len = conn->int_response_len > 0 ? conn->int_response_len : strlen(conn->str_response);
		//str_temp = bunescape_value(conn->str_response, &int_temp_len);
		//SDEBUG("%s\t%s", conn->str_response, str_temp);
		str_temp_escape = bescape_value(conn->str_response, &int_temp_len);
		SDEBUG(">%s|%s<", conn->str_response, str_temp_escape);

		SERROR_SNCAT(str_response, &int_response_len,
			"messageid = NULL\012ERROR\t", (size_t)23,
			str_temp_escape, int_temp_len,
			"\012", (size_t)1);
		WS_sendFrame(EV_A, client, 0x01, true, str_response, strlen(str_response));
	}

	client->bol_connected = true;

#ifdef POSTAGE_INTERFACE_LIBPQ
	//PQsetNoticeProcessor(client->cnxn, notice_processor, client);
	PQsetNoticeProcessor(client->cnxn, notice_processor, client);
	SERROR_SALLOC(client->notify_watcher, sizeof(struct sock_ev_client_notify_watcher));
	ev_io_init(&client->notify_watcher->io, client_notify_cb, GET_CLIENT_PQ_SOCKET(client), EV_READ);
	ev_io_start(EV_A, &client->notify_watcher->io);
	client->notify_watcher->parent = client;
#endif
error:
	SFREE_ALL();
	SFREE(conn->str_response);
	SFREE(str_response);
	return;
}

// **************************************************************************************
// **************************************************************************************
// ************************************ INFO CALLBACK ***********************************
// **************************************************************************************
// **************************************************************************************

// wait for response from group list query
bool ws_client_info_cb(EV_P, void *cb_data, DB_result *res) {
	struct sock_ev_client_request *client_request = cb_data;
	char *str_response = NULL;
	bool bol_ret = true;
	DArray *arr_values = NULL;
	int int_i = 0;
	size_t int_conn_desc_len = 0;
	size_t int_response_len = 0;
	size_t int_user_len = 0;
	DB_fetch_status status = DB_FETCH_OK;
	SDEFINE_VAR_ALL(str_conn_desc, str_conn_desc_enc, str_user);

	SFINISH_CHECK(res != NULL, "DB_exec failed");
	SFINISH_CHECK(res->status == DB_RES_TUPLES_OK, "DB_exec failed");

	SFINISH_SNCAT(str_conn_desc, &int_conn_desc_len,
		client_request->parent->str_connname, strlen(client_request->parent->str_connname),
		"\t", (size_t)1,
		client_request->parent->str_conn != NULL ? client_request->parent->str_conn :
		get_connection_info(client_request->parent->str_connname, NULL),
		strlen(
			client_request->parent->str_conn != NULL ? client_request->parent->str_conn :
			get_connection_info(client_request->parent->str_connname, NULL)
		));

	str_conn_desc_enc = bescape_value(str_conn_desc, &int_conn_desc_len);
	SFINISH_CHECK(str_conn_desc_enc != NULL, "bescape_value failed!");
	SFINISH_SNCAT(str_response, &int_response_len,
		"VERSION\t", (size_t)8,
		VERSION, strlen(VERSION),
		"\012CONNECTION\t", (size_t)12,
		str_conn_desc_enc, strlen(str_conn_desc_enc),
		"\012GROUPS\t[", (size_t)9);

	while ((status = DB_fetch_row(res)) != DB_FETCH_END) {
		SFINISH_CHECK(status != DB_FETCH_ERROR, "DB_fetch_row failed");

		arr_values = DB_get_row_values(res);
		SFINISH_CHECK(arr_values != NULL, "DB_get_row_values failed");

		if (int_i == 0) {
			SFINISH_SNFCAT(str_user, &int_user_len,
				DArray_get(arr_values, 0), strlen(DArray_get(arr_values, 0)));
		} else if (DArray_get(arr_values, 0) != NULL) {
			SFINISH_SNFCAT(str_response, &int_response_len,
				int_i == 1 ? "" : ", ", strlen(int_i == 1 ? "" : ", "),
				"\"", (size_t)1,
				DArray_get(arr_values, 0), strlen(DArray_get(arr_values, 0)),
				"\"", (size_t)1);
		}

		DArray_clear_destroy(arr_values);
		arr_values = NULL;
		int_i += 1;
	}
	SFINISH_SNFCAT(str_response, &int_response_len,
		"]\012USER\t", (size_t)7,
		str_user, int_user_len);

	bol_error_state = false;
	bol_ret = true;
finish:
	SFREE_ALL();
	if (arr_values != NULL) {
		DArray_clear_destroy(arr_values);
		arr_values = NULL;
	}
	char str_temp[101];
	client_request->int_response_id += 1;
	snprintf(str_temp, 100, "%zd", client_request->int_response_id);

	char *_str_response = str_response;
	size_t _int_response_len = int_response_len;
	SFINISH_SNCAT(str_response, &int_response_len,
		"messageid = ", (size_t)12,
		client_request->str_message_id, client_request->int_message_id_len,
		"\012responsenumber = ", (size_t)18,
		str_temp, strlen(str_temp),
		"\012", (size_t)1);
	SFINISH_SNFCAT(str_response, &int_response_len,
		_str_response, _int_response_len);
	SFREE(_str_response);
	if (res != NULL && (res->status != DB_RES_TUPLES_OK || status != DB_FETCH_END)) {
		_str_response = DB_get_diagnostic(client_request->parent->conn, res);
		SFINISH_SNFCAT(str_response, &int_response_len,
			":\n", (size_t)2,
			_str_response, strlen(_str_response));
		SFREE(_str_response);
	} else if (res == NULL && client_request->parent->conn->str_response != NULL) {
		SFINISH_SNFCAT(str_response, &int_response_len,
			":\n", (size_t)2,
			client_request->parent->conn->str_response, strlen(client_request->parent->conn->str_response));
		SFREE(client_request->parent->conn->str_response);
	}

	WS_sendFrame(EV_A, client_request->parent, true, 0x01, str_response, int_response_len);
	DArray_push(client_request->arr_response, str_response);
	str_response = NULL;

	if (bol_error_state == false) {
		client_request->int_response_id += 1;
		memset(str_temp, 0, 101);
		snprintf(str_temp, 100, "%zd", client_request->int_response_id);
		SFINISH_SNCAT(str_response, &int_response_len,
			"messageid = ", (size_t)12,
			client_request->str_message_id, client_request->int_message_id_len,
			"\012responsenumber = ", (size_t)18,
			str_temp, strlen(str_temp),
			"\012TRANSACTION COMPLETED", (size_t)22);
		WS_sendFrame(EV_A, client_request->parent, true, 0x01, str_response, int_response_len);
		DArray_push(client_request->arr_response, str_response);
		str_response = NULL;
	} else {
		bol_error_state = false;
	}
	DB_free_result(res);
	SFREE(str_response);
	return bol_ret;
}

// **************************************************************************************
// **************************************************************************************
// ******************************** BEGIN/COMMIT CALLBACK *******************************
// **************************************************************************************
// **************************************************************************************

// wait for response from command
bool client_cmd_cb(EV_P, void *cb_data, DB_result *res) {
	struct sock_ev_client_request *client_request = cb_data;
	char *str_response = NULL;
	bool bol_ret = true;
	char str_temp[101];
	memset(str_temp, 0, 101);
	size_t int_response_len = 0;

	SFINISH_CHECK(res != NULL, "DB_exec failed");
	SFINISH_CHECK(res->status == DB_RES_COMMAND_OK, "DB_exec failed");

	SFINISH_SNCAT(str_response, &int_response_len,
		"OK", (size_t)2);

	bol_error_state = false;
	bol_ret = true;
finish:
	client_request->int_response_id += 1;
	snprintf(str_temp, 100, "%zd", client_request->int_response_id);

	char *_str_response = str_response;
	size_t _int_response_len = (bol_error_state ? strlen(str_response) : int_response_len);
	SFINISH_SNCAT(str_response, &int_response_len,
		"messageid = ", (size_t)12,
		client_request->str_message_id, client_request->int_message_id_len,
		"\012responsenumber = ", (size_t)18,
		str_temp, strlen(str_temp),
		"\012transactionid = ", (size_t)17,
		client_request->str_message_id, client_request->int_message_id_len,
		"\012", (size_t)1,
		_str_response, _int_response_len);
	SFREE(_str_response);
	if (res != NULL && res->status != DB_RES_COMMAND_OK) {
		_str_response = DB_get_diagnostic(client_request->parent->conn, res);
		SFINISH_SNFCAT(str_response, &int_response_len,
			":\n", (size_t)2,
			_str_response, _int_response_len);
		SFREE(_str_response);
	} else if (res == NULL && client_request->parent->conn->str_response != NULL) {
		SFINISH_SNFCAT(str_response, &int_response_len,
			":\n", (size_t)2,
			client_request->parent->conn->str_response, strlen(client_request->parent->conn->str_response));
		SFREE(client_request->parent->conn->str_response);
	}

	WS_sendFrame(EV_A, client_request->parent, true, 0x01, str_response, int_response_len);
	DArray_push(client_request->arr_response, str_response);
	str_response = NULL;

	if (bol_error_state == true) {
		bol_ret = false;
		bol_error_state = false;
	}
	DB_free_result(res);
	SFREE(str_response);
	return bol_ret;
}

// **************************************************************************************
// **************************************************************************************
// *************************** CHECK IF CLIENT IS STILL THERE
// ***************************
// **************************************************************************************
// **************************************************************************************

bool _socket_is_open(SOCKET int_sock) {
	int int_error = 0;
	socklen_t int_len;

	SDEBUG("int_sock == %d", int_sock);

	errno = 0;
	int_len = sizeof(int_error);
	int int_status = getsockopt((int)int_sock, SOL_SOCKET, SO_ERROR, &int_error, &int_len);
#ifdef _WIN32
	if (int_status == SOCKET_ERROR) {
		SWARN("getsockopt failed: %d", WSAGetLastError());
	}
#endif

	SWARN_CHECK(int_status == 0, "Error getting socket error code: %d (%s)", errno, strerror(errno));
	SWARN_CHECK(int_error == 0, "Socket error, assuming it is closed: %d (%s), %d (%s)", errno, strerror(errno), int_error,
		strerror(int_error));

	errno = 0;
	bol_error_state = false;
	return true;
error:
	errno = 0;
	bol_error_state = false;
	return false;
}

// **************************************************************************************
// **************************************************************************************
// ********************************** CLOSING A CLIENT
// **********************************
// **************************************************************************************
// **************************************************************************************

bool _close_client_if_needed(struct sock_ev_client *client, ev_watcher *watcher, int revents) {
	ListNode *client_node = NULL;
	LIST_FOREACH(_server.list_client, first, next, node) {
		struct sock_ev_client *other_client = node->value;
		if (client == other_client) {
			client_node = node;
			break;
		}
	}
	if (client_node == NULL) {
		return true;
	}
	SDEBUG("close_client_if_needed(client: %p, watcher: %p, revents: %d)", client, watcher, revents);
	SDEBUG("Client %p->bol_is_open == %s", client, client->bol_is_open ? "true" : "false");
	SDEBUG("Client %p->int_sock == %d", client, client->_int_sock);
	SDEBUG("client->cur_request: %p", client->cur_request);
	if (client->bol_is_open == false || !socket_is_open(client->_int_sock)) {
		SDEBUG("Client %p closed", client);
		if (client->client_paused_request != NULL) {
			client_paused_request_free(client->client_paused_request);
		}
		SERROR_SALLOC(client->client_paused_request, sizeof(struct sock_ev_client_paused_request));
		client->client_paused_request->watcher = watcher;
		client->client_paused_request->revents = revents;
		client_close(client);
		bol_error_state = false;
		return true;
	} else {
		SDEBUG("Client %p not closed", client);
		bol_error_state = false;
		return false;
	}
error:
	bol_error_state = false;
	return true;
}

bool client_close(struct sock_ev_client *client) {
	size_t int_cookie_len = 0;
	size_t int_i = 0;
	size_t int_len = 0;
	struct sock_ev_client *other_client = NULL;
	struct sock_ev_client_message *client_message = NULL;
	ListNode *client_node = NULL;
	struct sock_ev_client_last_activity *client_last_activity = NULL;
	bool bol_authorized = false;

	SINFO("Client %p closing", client);
	if (client->que_message != NULL && client->bol_handshake == true && client->bol_is_open == true) {
		while (client->que_message->first != NULL) {
			client_message = client->que_message->first->value;
			ev_io_stop(global_loop, &client_message->io);
			WSFrame *frame = client_message->frame;
			// This removes this node from the queue, so that the next element we want
			// is the first one
			WS_client_message_free(client_message);
			WS_freeFrame(frame);
		}
		WS_sendFrame(global_loop, client, true, 0x08, "asdf", 4);
	}
	ev_io_stop(global_loop, &client->io);

	if ((client->que_message == NULL || client->que_message->first == NULL) && client->bol_socket_is_open == true) {
		if (client->que_message != NULL) {
			Queue_destroy(client->que_message);
			client->que_message = NULL;
		}
		// This must be done NOW, or else the browser will hang
		if (bol_tls) {
			if (SSL_shutdown(client->ssl) != 0) {
				SERROR_NORESPONSE("SSL_shutdown() failed");
			}
			SFREE(str_global_error);
			SSL_free(client->ssl);

			close(client->int_sock);
		} else {
			shutdown(client->int_sock, SHUT_RDWR);
			SDEBUG("Shutdown socket %i", client->int_sock);

			close(client->int_sock);
			SDEBUG("Closed socket %i", client->int_sock);

			errno = 0;
		}
		client->bol_socket_is_open = false;
	}

	if (client->client_request_watcher != NULL) {
		ev_check_stop(global_loop, &client->client_request_watcher->check);
		SFREE(client->client_request_watcher);
	}

	if (client->notify_watcher != NULL) {
		ev_io_stop(global_loop, &client->notify_watcher->io);
		SFREE(client->notify_watcher);
	}

	if (client->client_reconnect_timer != NULL) {
		ev_prepare_stop(global_loop, &client->client_reconnect_timer->prepare);
		SFREE(client->client_reconnect_timer);
		decrement_idle(global_loop);
	}

	LIST_FOREACH(client->server->list_client, first, next, node) {
		other_client = node->value;
		if (client == other_client) {
			client_node = node;
			break;
		}
	}

	if (client->conn != NULL) {
		bol_authorized = client->conn->int_status != -1;
	}
	SDEBUG("bol_authorized: %s", bol_authorized ? "true" : "false");

	if (bol_authorized && client->int_last_activity_i == -1 && client->str_cookie != NULL) {
		int_cookie_len = strlen(client->str_cookie);
		for (int_i = 0, int_len = DArray_end(_server.arr_client_last_activity); int_i < int_len; int_i += 1) {
			client_last_activity = (struct sock_ev_client_last_activity *)DArray_get(_server.arr_client_last_activity, int_i);
			if (client_last_activity &&
				strncmp(client_last_activity->str_client_ip, client->str_client_ip, INET_ADDRSTRLEN) == 0 &&
				strncmp(client_last_activity->str_cookie, client->str_cookie, int_cookie_len) == 0) {
				client->int_last_activity_i = (ssize_t)int_i;
				break;
			}

			if (client_last_activity) {
				SDEBUG("client_last_activity->str_client_ip: %s", client_last_activity->str_client_ip);
				SDEBUG("client_last_activity->str_cookie   : %s", client_last_activity->str_cookie);
			}
		}
		if (client->int_last_activity_i == -1) {
			client_last_activity = NULL;
			SERROR_SALLOC(client_last_activity, sizeof(struct sock_ev_client_last_activity));
			memcpy(client_last_activity->str_client_ip, client->str_client_ip, INET_ADDRSTRLEN);
			SERROR_SNCAT(client_last_activity->str_cookie, &int_cookie_len,
				client->str_cookie, int_cookie_len);
			client->int_last_activity_i = (ssize_t)DArray_push(_server.arr_client_last_activity, client_last_activity);
		}
	}
	if (bol_authorized && client->int_last_activity_i != -1) {
		client_last_activity = (struct sock_ev_client_last_activity *)DArray_get(
			_server.arr_client_last_activity, (size_t)client->int_last_activity_i);
		if (client_last_activity != NULL) {
			SDEBUG("client->int_last_activity_i          : %d", client->int_last_activity_i);
			SDEBUG("ev_now(global_loop)               : %f", ev_now(global_loop));
			SDEBUG("client_last_activity                 : %p", client_last_activity);
			SDEBUG("client_last_activity->last_activity_time: %f", client_last_activity->last_activity_time);
			client_last_activity->last_activity_time = ev_now(global_loop);
		}
	}

	if (client_node != NULL && (client->bol_handshake == true || client->bol_is_open == true)) {
		client->bol_is_open = false;
		if (client->bol_handshake == false || bol_authorized == false || client->cur_request == NULL) {
			SDEBUG("client_close_immediate");
			client_close_immediate(client);
		} else {
			if (client->client_timeout_prepare == NULL) {
				SDEBUG("delay client_close_immediate");
				SINFO("test1: %p", client);
				SERROR_SALLOC(client->client_timeout_prepare, sizeof(struct sock_ev_client_timeout_prepare));
				client->client_timeout_prepare->close_time = ev_now(global_loop);
				client->client_timeout_prepare->parent = client;

				ev_prepare_init(&client->client_timeout_prepare->prepare, client_close_timeout_prepare_cb);
				ev_prepare_start(global_loop, &client->client_timeout_prepare->prepare);
			}
		}
	}

	bol_error_state = false;
	return true;
error:
	return false;
}

#if defined(ENVELOPE) && defined(POSTAGE_INTERFACE_LIBPQ)
void client_close_cancel_query_cb(EV_P, ev_io *w, int revents);
bool client_close_close_cnxn_cb(EV_P, void *cb_data, DB_result *res);
#endif

void client_close_timeout_prepare_cb(EV_P, ev_prepare *w, int revents) {
	if (revents != 0) {
	} // get rid of unused parameter warning
	struct sock_ev_client_timeout_prepare *client_timeout_prepare = (struct sock_ev_client_timeout_prepare *)w;
	struct sock_ev_client *client = client_timeout_prepare->parent;

	// DEBUG("client_timeout_prepare->close_time                           : %f",
	// client_timeout_prepare->close_time);
	// DEBUG("                                     int_global_login_timeout: %d",
	// int_global_login_timeout);
	// DEBUG("client_timeout_prepare->close_time + int_global_login_timeout: %f",
	// client_timeout_prepare->close_time +
	// int_global_login_timeout);
	// DEBUG("ev_now(EV_A)                                                 : %f",
	// ev_now(EV_A));

	ev_io_stop(EV_A, &client_timeout_prepare->parent->io);
	if ((client_timeout_prepare->close_time + 10) <= ev_now(EV_A)) {
		SDEBUG("test2: %p", client);
		ev_prepare_stop(EV_A, w);
		if (w == &client->client_timeout_prepare->prepare) {
			client_timeout_prepare->parent->client_timeout_prepare = NULL;
			SFREE(client_timeout_prepare);
		} else {
			// This is not supposed to happen
			SERROR_NORESPONSE("What happened? How is it possible that `w` != "
							  "`client->client_timeout_prepare`?");
			SDEBUG("`w`                              == %p", w);
			SDEBUG("`client->client_timeout_prepare` == %p", client->client_timeout_prepare);
		}

#if defined(ENVELOPE) && defined(POSTAGE_INTERFACE_LIBPQ)
		if (client->bol_public == false && bol_global_set_user == true) {
			char *err = DB_cancel_query(client->conn);
			if (err == NULL) {
				ev_io_init(&client->io, client_close_cancel_query_cb, client->conn->int_sock, EV_READ);
				ev_io_start(EV_A, &client->io);
			} else {
				SFREE(err);
				SERROR_CHECK_NORESPONSE(DB_exec(global_loop, client->conn, client, "RESET SESSION AUTHORIZATION;", client_close_close_cnxn_cb), "DB_exec failed to reset session authorization");
			}
		} else {
#endif
		SDEBUG("BEFORE client_close_immediate(%p)", client);
		client_close_immediate(client);
		SDEBUG("AFTER  client_close_immediate(%p)", client);
#if defined(ENVELOPE) && defined(POSTAGE_INTERFACE_LIBPQ)
		}
#endif
	}
	bol_error_state = false;
}


#if defined(ENVELOPE) && defined(POSTAGE_INTERFACE_LIBPQ)
void client_close_cancel_query_cb(EV_P, ev_io *w, int revents) {
	if (revents != 0) {
	} // get rid of unused parameter warning
	struct sock_ev_client *client = (struct sock_ev_client *)w;
	int int_status = PQconsumeInput(client->cnxn);
	if (int_status != 1) {
		SERROR_NORESPONSE("PQconsumeInput failed %s", PQerrorMessage(client->cnxn));
		ev_io_stop(EV_A, w);
		SERROR_CHECK_NORESPONSE(DB_exec(global_loop, client->conn, client, "RESET SESSION AUTHORIZATION;", client_close_close_cnxn_cb), "DB_exec failed to reset session authorization");
		return;
	}

	int int_status2 = PQisBusy(client->cnxn);
	if (int_status2 != 1) {
		ev_io_stop(EV_A, w);
		PGresult *res = PQgetResult(client->cnxn);
		while (res != NULL) {
			if (PQresultStatus(res) == PGRES_COPY_OUT) {
				char **buffer_ptr_ptr = salloc(sizeof(char *));
				int_status = PQgetCopyData(client->cnxn, buffer_ptr_ptr, 0);
				PQfreemem(*buffer_ptr_ptr);
				SFREE(buffer_ptr_ptr);
			}
			PQclear(res);
			res = PQgetResult(client->cnxn);
		}
		SERROR_CHECK_NORESPONSE(DB_exec(global_loop, client->conn, client, "RESET SESSION AUTHORIZATION;", client_close_close_cnxn_cb), "DB_exec failed to reset session authorization");
	}
}
bool client_close_close_cnxn_cb(EV_P, void *cb_data, DB_result *res) {
	if (EV_A) { // for unused variable warning
	}
	SINFO("RESET SESSION AUTHORIZATION finished!");
	struct sock_ev_client *client = cb_data;
	DB_finish(client->conn);
	client->conn = NULL;
	DB_free_result(res);
	client_close_immediate(client);
	return false;
}
#endif

void client_close_immediate(struct sock_ev_client *client) {
	SINFO("Client %p closing", client);
	struct WSFrame *frame = NULL;
	ev_io_stop(global_loop, &client->io);

	if (client->notify_watcher != NULL) {
		ev_io_stop(global_loop, &client->notify_watcher->io);
		SFREE(client->notify_watcher);
	}
	if (client->client_copy_check != NULL) {
		ev_check_stop(global_loop, &client->client_copy_check->check);
		decrement_idle(global_loop);
		DB_free_result(client->client_copy_check->res);
		SFREE(client->client_copy_check->str_response);
		SFREE(client->client_copy_check);
	}
	if (client->client_paused_request != NULL && client->client_paused_request->bol_free_watcher) {
		client->client_paused_request->watcher = NULL;
	}

	if (client->client_paused_request != NULL && client->client_paused_request->bol_increment_watcher) {
		// this won't effect the event loop, because DB_finish will have the decrement_idle
		increment_idle(global_loop);
	}
	if (client->conn != NULL) {
		SDEBUG("DB_conn %p closing", client->conn);
		DB_finish(client->conn);
	}

	if (client->bol_socket_is_open == true) {
		if (client->que_message != NULL) {
			while (client->que_message->first != NULL) {
				struct sock_ev_client_message *client_message = client->que_message->first->value;
				ev_io_stop(global_loop, &client_message->io);
				frame = client_message->frame;
				// This removes this node from the queue, so that the next element we
				// want is the first one
				WS_client_message_free(client_message);
				WS_freeFrame(frame);
			}
			Queue_destroy(client->que_message);
			client->que_message = NULL;
		}

		if (bol_tls) {
			if (SSL_shutdown(client->ssl) != 0) {
				SERROR_NORESPONSE("SSL_shutdown() failed");
			}
			SFREE(str_global_error);
			SSL_free(client->ssl);

			close(client->int_sock);
		} else {
			shutdown(client->int_sock, SHUT_RDWR);
			SDEBUG("Shutdown socket %i", client->int_sock);

			close(client->int_sock);
			SDEBUG("Closed socket %i", client->int_sock);

			errno = 0;
		}
		client->bol_socket_is_open = false;
	}
	client_timeout_prepare_free(client->client_timeout_prepare);
	if (client->cur_request != NULL) {
		client->cur_request->parent = NULL;
		client_request_free(client->cur_request);
		client->cur_request = NULL;
	}
	if (client->que_request != NULL) {
		QUEUE_FOREACH(client->que_request, node) {
			struct sock_ev_client_request *client_request = node->value;
			client_request->parent = NULL;
			client_request_free(client_request);
			// This is because we increment idle when we push to this queue
			decrement_idle(global_loop);
		}
		Queue_destroy(client->que_request);
		client->que_request = NULL;
	}
	client_paused_request_free(client->client_paused_request);
	client->client_paused_request = NULL;

	if (client->client_request_watcher != NULL) {
		ev_check_stop(global_loop, &client->client_request_watcher->check);
		SFREE(client->client_request_watcher);
	}
	if (client->client_request_watcher_search != NULL) {
		ev_check_stop(global_loop, &client->client_request_watcher_search->check);
		decrement_idle(global_loop);
		SFREE(client->client_request_watcher_search);
	}
	if (client->client_copy_io != NULL) {
		ev_io_stop(global_loop, &client->client_copy_io->io);
		SFREE(client->client_copy_io);
	}
	if (client->reconnect_watcher != NULL) {
		ev_io_stop(global_loop, &client->reconnect_watcher->io);
	}
	SFREE(client->str_session_id);
	SFREE(client->reconnect_watcher);
	SFREE(client->str_request);
	SFREE(client->str_response);
	SFREE(client->str_conn);
	SFREE(client->str_connname);
	SFREE(client->str_username);
	SFREE(client->str_database);
	SFREE(client->str_notice);
	SFREE(client->str_boundary);
	SFREE(client->str_connname_folder);
	// DEBUG("%p->str_cookie: %p", client, client->str_cookie);
	SFREE_PWORD(client->str_cookie);
	SFREE_PWORD(client->str_cookie_name);

	// DEBUG("Client %p closed", client);
	List_remove(client->server->list_client, client->node);

	SFREE(client);
	bol_error_state = false;
	SDEBUG("client_close_immediate finished");
	return;
}

void _client_timeout_prepare_free(struct sock_ev_client_timeout_prepare *client_timeout_prepare) {
	if (client_timeout_prepare != NULL) {
		ev_prepare_stop(global_loop, &client_timeout_prepare->prepare);
		SFREE(client_timeout_prepare);
	}
}

void client_paused_request_free(struct sock_ev_client_paused_request *client_paused_request) {
	if (client_paused_request != NULL) {
		if (client_paused_request->watcher != NULL) {
			SDEBUG("client_paused_request->watcher: %p", client_paused_request->watcher);
			if (client_paused_request->revents == EV_CHECK) {
				ev_check_stop(global_loop, (ev_check *)client_paused_request->watcher);
			} else {
				ev_io_stop(global_loop, (ev_io *)client_paused_request->watcher);
			}
			SINFO("client_paused_request->revents: %x", client_paused_request->revents);
			SINFO("client_paused_request: %p", client_paused_request);
			SINFO("client_paused_request->watcher: %p", client_paused_request->watcher);
			SFREE(client_paused_request->watcher);
		}
	}
	SFREE(client_paused_request);
}
