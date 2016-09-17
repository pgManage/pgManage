#include "http_accept.h"

void http_accept_step1(struct sock_ev_client *client) {
	SDEFINE_VAR_ALL(str_uri, str_uri_temp, str_action_name, str_temp, str_args, str_sql);
	char *str_response = NULL;
	char *ptr_end_uri = NULL;
	ssize_t int_len = 0;
	size_t int_uri_length = 0;
	size_t int_query_length = 0;

	str_uri = str_uri_path(client->str_request, client->int_request_len, &int_uri_length);
	SFINISH_CHECK(str_uri != NULL, "str_uri_path failed");
	ptr_end_uri = strchr(str_uri, '?');
	if (ptr_end_uri != NULL) {
		*ptr_end_uri = 0;
		ptr_end_uri = strchr(ptr_end_uri + 1, '#');
		if (ptr_end_uri != NULL) {
			*ptr_end_uri = 0;
		}
	}

	str_args = query(client->str_request, client->int_request_len, &int_query_length);
	if (str_args == NULL) {
		SFINISH_CAT_CSTR(str_args, "");
	}

#ifdef ENVELOPE
#else
	if (isdigit(str_uri[9])) {
		str_uri_temp = str_uri;
		char *ptr_temp = strchr(str_uri_temp + 9, '/');
		SFINISH_CHECK(ptr_temp != NULL, "strchr failed");
		SFINISH_CAT_CSTR(str_uri, "/postage/app", ptr_temp);
		SFREE(str_uri_temp);
	}
#endif

	SDEBUG("str_args: %s", str_args);

#ifdef ENVELOPE
	SFINISH_CAT_CSTR(str_action_name, str_uri + strlen("/env/"));
#else
	SFINISH_CAT_CSTR(str_action_name, str_uri + strlen("/postage/app/"));
#endif
	char *ptr_end_action_name = strchr(str_action_name, '/');
	if (ptr_end_action_name != NULL) {
		*ptr_end_action_name = 0;
		SFINISH_CAT_CSTR(str_temp, "/", ptr_end_action_name + 1);
		str_uri_temp = cstr_to_uri(str_temp);
		SFINISH_CHECK(str_uri_temp != NULL, "cstr_to_uri failed");
		SFINISH_CAT_APPEND(str_args, "&path=", str_uri_temp);
	}

	str_temp = str_args;
	str_args = DB_escape_literal(client->conn, str_temp, strlen(str_args));
	SFINISH_CHECK(str_args != NULL, "DB_escape_literal failed");

	SDEBUG("str_args: %s", str_args);

	if (DB_connection_driver(client->conn) == DB_DRIVER_POSTGRES) {
		SFINISH_CAT_CSTR(str_sql, "SELECT ", str_action_name, "(", str_args, ");");
	} else {
		SFINISH_CAT_CSTR(str_sql, "EXECUTE ", str_action_name, " ", str_args, ";");
	}
	SFINISH_CHECK(DB_exec(global_loop, client->conn, client, str_sql, http_accept_step2), "DB_exec failed");
	SDEBUG("str_sql: %s", str_sql);

	bol_error_state = false;
finish:
	SFREE_ALL();
	if (bol_error_state) {
		char *_str_response = str_response;
		str_response = cat_cstr("HTTP/1.1 500 Internal Server Error\015\012"
								"Server: " SUN_PROGRAM_LOWER_NAME "\015\012\015\012",
			_str_response);
	}
	if (str_response != NULL && (int_len = CLIENT_WRITE(client, str_response, strlen(str_response))) < 0) {
		SFREE(str_response);
		if (bol_tls) {
			SFINISH_LIBTLS_CONTEXT(client->tls_postage_io_context, "tls_write() failed");
		} else {
			SERROR_NORESPONSE("write() failed");
		}
	}
	SFREE(str_response);
	if (int_len != 0) {
		ev_io_stop(global_loop, &client->io);
		SFREE(client->str_request);
		SERROR_CHECK_NORESPONSE(client_close(client), "Error closing Client");
	}
}

bool http_accept_step2(EV_P, void *cb_data, DB_result *res) {
	struct sock_ev_client *client = cb_data;
	char *str_response = NULL;
	char *_str_response = NULL;
	ssize_t int_len = 0;
	DArray *arr_row_values = NULL;

	SFINISH_CHECK(res != NULL, "DB_exec failed");
	SFINISH_CHECK(res->status == DB_RES_TUPLES_OK, "DB_exec failed");

	SFINISH_CHECK(DB_fetch_row(res) == DB_FETCH_OK, "DB_fetch_row failed");
	arr_row_values = DB_get_row_values(res);
	SFINISH_CHECK(arr_row_values != NULL, "DB_get_row_values failed");

	str_response = DArray_get(arr_row_values, 0);
	SDEBUG("str_response: %s", str_response);

	bol_error_state = false;
finish:
	if (arr_row_values != NULL) {
		DArray_destroy(arr_row_values);
	}
	if (bol_error_state) {
		bol_error_state = false;

		_str_response = str_response;
		str_response = cat_cstr("HTTP/1.1 500 Internal Server Error\015\012"
								"Server: " SUN_PROGRAM_LOWER_NAME "\015\012\015\012",
			_str_response);
		SFREE(_str_response);
		_str_response = DB_get_diagnostic(client->conn, res);
		SFINISH_CAT_APPEND(str_response, ":\n", _str_response);
		SFREE(_str_response);
	}
	if (str_response != NULL && (int_len = CLIENT_WRITE(client, str_response, strlen(str_response))) < 0) {
		SFREE(str_response);
		if (bol_tls) {
			SFINISH_LIBTLS_CONTEXT(client->tls_postage_io_context, "tls_write() failed");
		} else {
			SERROR_NORESPONSE("write() failed");
		}
	}
	DB_free_result(res);
	SFREE(str_response);
	if (int_len != 0) {
		ev_io_stop(EV_A, &client->io);
		SFREE(client->str_request);
		SERROR_CHECK_NORESPONSE(client_close(client), "Error closing Client");
	}
	return true;
}
