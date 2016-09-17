#include "common_auth.h"

// get connection string from cookie
DB_conn *set_cnxn(struct sock_ev_client *client, char *str_request, connect_cb_t connect_cb) {
	char *str_response = NULL;
	SDEFINE_VAR_ALL(str_cookie_encrypted, str_cookie_decrypted, str_password, str_uri, str_temp, str_conn_index);
	SDEFINE_VAR_MORE(str_conn_debug, str_username, str_connname, str_database, str_uri_temp, str_context_data);
	SDEFINE_VAR_MORE(str_user_agent, str_host);
	SDEFINE_VAR_MORE(str_uri_user_agent, str_uri_ip_address, str_uri_host);
	char *str_conn = NULL;
	ssize_t int_i = 0;
	ssize_t int_len = 0;
	size_t int_conn_index = 0;
	size_t int_uri_length = 0;
	size_t int_user_length = 0;
	size_t int_password_length = 0;
	size_t int_dbname_length = 0;
#ifdef ENVELOPE
#else
	size_t int_connname_length = 0;
	size_t int_conn_length = 0;
#endif
	ListNode *other_client_node = NULL;

	str_uri_temp = str_uri_path(client->str_request, client->int_request_len, &int_uri_length);
	SFINISH_CHECK(str_uri_temp != NULL, "str_uri_path failed");
#ifdef ENVELOPE
	SFINISH_CAT_CSTR(client->str_cookie_name, "envelope");
#else
	char *ptr_slash = strchr(str_uri_temp + 9, '/');
	SFINISH_CHECK(ptr_slash != NULL, "strchr failed!");
	*ptr_slash = 0;
	SFINISH_CAT_CSTR(str_conn_index, str_uri_temp + 9);
	int_conn_index = (size_t)strtol(str_conn_index, NULL, 10);
	SFINISH_CAT_CSTR(client->str_cookie_name, "postage_", str_conn_index);
#endif

	////DECRYPT
	SDEBUG("client->str_cookie_name: %s", client->str_cookie_name);
	str_cookie_encrypted = str_cookie(str_request, client->str_cookie_name);
	if (str_cookie_encrypted == NULL || strlen(str_cookie_encrypted) <= 0) {
		SFINISH("No Cookie.");
	}
	size_t int_cookie_len = strlen(str_cookie_encrypted);

	// Make sure we have the last close time
	if (client->int_last_activity_i == -1) {
		// If we don't, then find it
		for (int_i = 0, int_len = (ssize_t)DArray_end(client->server->arr_client_last_activity); int_i < int_len; int_i += 1) {
			struct sock_ev_client_last_activity *client_last_activity =
				(struct sock_ev_client_last_activity *)DArray_get(client->server->arr_client_last_activity, (size_t)int_i);
			// The two things that need to be the same, are the ip and the cookie
			// (these are stored by the auth?action=login
			// request handler)
			if (client_last_activity != NULL &&
				strncmp(client_last_activity->str_client_ip, client->str_client_ip, INET_ADDRSTRLEN) == 0 &&
				strncmp(client_last_activity->str_cookie, str_cookie_encrypted, strlen(str_cookie_encrypted)) == 0) {
				client->int_last_activity_i = int_i;
				break;
			}
		}
		// If we don't have it, we don't need it
	}

	// Find another client from the same place/cookie
	LIST_FOREACH(client->server->list_client, first, next, node) {
		struct sock_ev_client *other_client = node->value;
		SDEBUG("other_client                     = %p", other_client);
		SDEBUG("other_client->node               = %p", other_client->node);
		SDEBUG("client->node                     = %p", client->node);
		SDEBUG("other_client->cnxn               = %p", other_client->cnxn);
		SDEBUG("other_client->int_last_activity_i   = %d", other_client->int_last_activity_i);
		SDEBUG("client->int_last_activity_i         = %d", client->int_last_activity_i);
		if (other_client != NULL && client->node != other_client->node &&
			client->int_last_activity_i == other_client->int_last_activity_i) {
			other_client_node = node;
			break;
		}
	}

	SDEBUG("List_count(client->server->list_client) = %d", List_count(client->server->list_client));
	SDEBUG("client->server->arr_client_last_activity  = %p", client->server->arr_client_last_activity);
	SDEBUG("client->int_last_activity_i               = %d", client->int_last_activity_i);
	SDEBUG("other_client_node                      = %p", other_client_node);

	// Grab the last close time if we have it
	struct sock_ev_client_last_activity *client_last_activity = NULL;
	if (client->int_last_activity_i != -1) {
		client_last_activity = (struct sock_ev_client_last_activity *)DArray_get(
			client->server->arr_client_last_activity, (size_t)client->int_last_activity_i);

		SDEBUG(" ev_now(EV_A)                                      : %f", ev_now(EV_A));
		SDEBUG("                client_last_activity->last_activity_time : %f", client_last_activity->last_activity_time);
		SDEBUG("(ev_now(EV_A) - client_last_activity->last_activity_time): %f",
			(ev_now(EV_A) - client_last_activity->last_activity_time));
	}
	// Grab the other client if we have it
	struct sock_ev_client *other_client = NULL;
	SDEBUG("other_client_node = %p", other_client_node);
	if (other_client_node != NULL) {
		other_client = other_client_node->value;
	}
	// Check to see if we have another client, if we don't check to see if the
	// session has expired
	SFINISH_CHECK((other_client != NULL && other_client->conn != NULL) ||
					  (client->int_last_activity_i != -1 &&
						  (ev_now(global_loop) - client_last_activity->last_activity_time) < int_global_login_timeout),
		"Session expired");

	str_cookie_decrypted = aes_decrypt(str_cookie_encrypted, &int_cookie_len);

	// **** WARNING ****
	// DO NOT UNCOMMENT THE NEXT LINE! THAT WILL PUT THE FULL COOKIE IN THE CLEAR
	// IN THE LOG!!!!
	// SDEBUG("str_cookie_decrypted: >%s<", str_cookie_decrypted);
	// **** WARNING ****

	SFINISH_CHECK(str_cookie_decrypted != NULL, "aes_decrypt failed");

	////GET THINGS FOR CONNECTION STRING
	str_username = str_tolower(getpar(str_cookie_decrypted, "username", int_cookie_len, &int_user_length));
	SFINISH_CHECK(str_username != NULL, "str_tolower(getpar()) failed");
	SNOTICE("REQUEST USERNAME: %s", str_username);
	str_database = str_tolower(getpar(str_cookie_decrypted, "dbname", int_cookie_len, &int_dbname_length));
	if (str_database != NULL && strlen(str_database) == 0) {
		SFREE(str_database);
	}
	if (str_database != NULL) {
		SNOTICE("REQUEST DATABASE: %s", str_database);
	}

#ifdef ENVELOPE
	SFINISH_CAT_CSTR(str_connname, "");
#else
	str_connname = getpar(str_cookie_decrypted, "connname", int_cookie_len, &int_connname_length);
	SFINISH_CHECK(str_connname != NULL, "getpar failed");
	str_conn = getpar(str_cookie_decrypted, "conn", int_cookie_len, &int_conn_length);
	if (str_conn != NULL && strlen(str_conn) == 0) {
		SFREE(str_conn);
	}
	SDEBUG("str_conn: %s", str_conn);
#endif

	if (client->str_connname == NULL) {
		SFINISH_CAT_CSTR(client->str_connname, str_connname);
	}
	if (client->str_username == NULL) {
		SFINISH_CAT_CSTR(client->str_username, str_username);
	}
	if (client->str_database == NULL) {
		SFINISH_CAT_CSTR(client->str_database, str_database);
	}
	if (str_conn != NULL && client->str_conn == NULL) {
		SFINISH_CAT_CSTR(client->str_conn, str_conn);
	}
	SFREE(str_conn);
	if (client->str_cookie == NULL) {
		SFINISH_CAT_CSTR(client->str_cookie, str_cookie_encrypted);
		SDEBUG("%p->str_cookie: %p", client, client->str_cookie);
	}

	SFREE_PWORD(str_cookie_encrypted);

	if (bol_global_allow_custom_connections == false) {
		SFINISH_CHECK(client->str_conn == NULL, "Cannot specify a custom connection string with current configuration,"
												"if you wish to do this, change allow_custom_connections to true and "
												"restart " SUN_PROGRAM_LOWER_NAME "");
	}

	str_password = getpar(str_cookie_decrypted, "password", int_cookie_len, &int_password_length);
	SFINISH_CHECK(str_password != NULL, "getpar failed");

	SDEBUG("client->str_conn: %s", client->str_conn);
	SDEBUG("str_connname: %s", str_connname);
	SDEBUG("str_database: %s", str_database);

	SFINISH_CHECK(
		client->str_conn != NULL || exists_connection_info(str_connname), "There is no connection info with that name.");

	////ASSEMBLE CONNECTION STRING
	if (client->str_conn != NULL) {
#ifdef POSTAGE_INTERFACE_LIBPQ
		if (str_database != NULL) {
			SFINISH_CAT_CSTR(str_conn, client->str_conn, " dbname=", str_database);
		} else {
			SFINISH_CAT_CSTR(str_conn, client->str_conn);
		}
#else
		SFINISH_CAT_CSTR(str_conn, client->str_conn);
#endif
	} else {
#ifdef POSTAGE_INTERFACE_LIBPQ
		if (str_database != NULL) {
			SFINISH_CAT_CSTR(str_conn, get_connection_info(str_connname, NULL), " dbname=", str_database);
		} else {
			SFINISH_CAT_CSTR(str_conn, get_connection_info(str_connname, NULL));
		}
#else
		SFINISH_CAT_CSTR(str_conn, get_connection_info(str_connname, NULL));
#endif
	}

	SFREE_PWORD(str_cookie_decrypted);

	// client_cb sometimes calls this function and doesn't expect need us to
	// connect to the database (because we are already connected)
	if (connect_cb != NULL) {
		str_user_agent = request_header(str_request, "User-Agent");
		if (str_user_agent == NULL) {
			SFINISH_CAT_CSTR(str_user_agent, "");
		}
		str_host = request_header(str_request, "Host");
		if (str_host == NULL) {
			SFINISH_CAT_CSTR(str_host, "");
		}
		str_uri_user_agent = cstr_to_uri(str_user_agent);
		SFINISH_CHECK(str_uri_user_agent != NULL, "cstr_to_uri failed on string \"%s\"", str_user_agent);

		str_uri_ip_address = cstr_to_uri(client->str_client_ip);
		SFINISH_CHECK(str_uri_ip_address != NULL, "cstr_to_uri failed on string \"%s\"", client->str_client_ip);

		str_uri_host = cstr_to_uri(str_host);
		SFINISH_CHECK(str_uri_host != NULL, "cstr_to_uri failed on string \"%s\"", str_host);

		SFINISH_CAT_CSTR(str_context_data, "request_ip_address=", str_uri_ip_address, "&request_host=", str_uri_host);

		client->conn = DB_connect(global_loop, client, str_conn, str_username, int_user_length, str_password, int_password_length,
			str_context_data, connect_cb);
	}
	SFREE_PWORD(str_password);
	bol_error_state = false;
finish:
	if (str_response != NULL &&
		(strstr(str_response, "\012Session expired") != NULL || strstr(str_response, "\012No Cookie") != NULL)) {
		SFREE(str_response);
		str_temp = str_uri_path(client->str_request, client->int_request_len, &int_uri_length);
		str_uri = cstr_to_uri(str_temp);
		SFREE(str_temp);
		struct struct_connection *conn_info = DArray_get(darr_global_connection, int_conn_index);

		SFINISH_CAT_CSTR(str_response, "HTTP/1.1 440 Login Timeout\015\012"
			"Server: " SUN_PROGRAM_LOWER_NAME "\015\012",
			"Set-Cookie: ", client->str_cookie_name, "=; path=/; expires=Tue, 01 Jan 1990 00:00:00 GMT", (bol_tls ? "; secure" : ""), "; HttpOnly\015\012");
		if (conn_info != NULL) {
#ifdef ENVELOPE
		SFINISH_CAT_APPEND(str_response, "Refresh: 0; url=/index.html?redirect=", str_uri, "\015\012\015\012");
#else
		str_temp = cstr_to_uri(conn_info->str_connection_name);
		SFINISH_CAT_APPEND(str_response, "Refresh: 0; url=/postage/index.html?connection=", str_temp, "&redirect=", str_uri, "\015\012\015\012");
		SFREE(str_temp);
#endif
		} else {
#ifdef ENVELOPE
			SFINISH_CAT_APPEND(str_response, "Refresh: 0; url=/index.html", "\015\012\015\012");
#else
			SFINISH_CAT_APPEND(str_response, "Refresh: 0; url=/postage/index.html", "\015\012\015\012");
#endif
		}
		SFINISH_CAT_APPEND(str_response, "You need to login.\012");

		/*
		if (conn_info != NULL) {
			SFINISH_CAT_CSTR(str_response, "HTTP/1.1 200 OK\015\012"
										   "Server: " SUN_PROGRAM_LOWER_NAME "\015\012",
				"Set-Cookie: ", client->str_cookie_name, "="
														 "; path=/; expires=Tue, 01 Jan 1990 00:00:00 GMT",
				(bol_tls ? "; secure" : ""), "; HttpOnly\015\012\015\012",
				"<!DOCTYPE html PUBLIC \"-//W3C//DTD XHTML 1.0 Strict//EN\" "
				"\"http://www.w3.org/TR/xhtml1/DTD/xhtml1-strict.dtd\">\012",
				"<html xmlns=\"http://www.w3.org/1999/xhtml\" "
				"xml:lang=\"en-GB\">\012");
#ifdef ENVELOPE
			SFINISH_CAT_APPEND(str_response, "<head><script>window.open('/index.html?connection=");
#else
			SFINISH_CAT_APPEND(str_response, "<head><script>window.open('/postage/index.html?connection=");
#endif
			SFINISH_CAT_APPEND(str_response, conn_info->str_connection_name, "&redirect=", str_uri,
				"', "
				"'_self');</script></head><body></body></html>");
		} else {
			SFINISH_CAT_CSTR(str_response, "HTTP/1.1 200 OK\015\012"
										   "Server: " SUN_PROGRAM_LOWER_NAME "\015\012",
				"Set-Cookie: ", client->str_cookie_name, "="
														 "; path=/; expires=Tue, 01 Jan 1990 00:00:00 GMT",
				(bol_tls ? "; secure" : ""), "; HttpOnly\015\012\015\012",
				"<!DOCTYPE html PUBLIC \"-//W3C//DTD XHTML 1.0 Strict//EN\" "
				"\"http://www.w3.org/TR/xhtml1/DTD/xhtml1-strict.dtd\">\012",
				"<html xmlns=\"http://www.w3.org/1999/xhtml\" "
				"xml:lang=\"en-GB\">\012");
#ifdef ENVELOPE
			SFINISH_CAT_APPEND(str_response, "<head><script>window.open('/index.html', ");
#else
			SFINISH_CAT_APPEND(str_response, "<head><script>window.open('/postage/index.html', ");
#endif
			SFINISH_CAT_APPEND(str_response, "'_self');</script></head><body></body></html>");
		}
		*/
	}

	SFREE_PWORD(str_cookie_encrypted);
	SFREE_PWORD(str_cookie_decrypted);
	SFREE_PWORD(str_password);
	SFREE_PWORD(str_conn);
	SFREE(str_conn_debug);
	SFREE(str_username);
	SFREE(str_conn);

	// For some reason SFREE_ALL segfaults without this
	str_cookie_encrypted = NULL;
	str_cookie_decrypted = NULL;
	str_password = NULL;
	str_conn = NULL;

	SFREE_ALL();

	if (str_response != NULL) {
		if ((int_len = CLIENT_WRITE(client, str_response, strlen(str_response))) < 0) {
			if (bol_tls) {
				SFINISH_LIBTLS_CONTEXT(client->tls_postage_io_context, "tls_write() failed");
			} else {
				SFINISH("write() failed");
			}
			ev_io_stop(global_loop, &client->io);
			SFINISH_CLIENT_CLOSE(client);
		}
		SFREE_PWORD(str_response);
	}
	bol_error_state = false;
	return client->conn;
}
