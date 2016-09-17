#ifdef ENVELOPE

#include "http_delete.h"

void http_delete_step1(struct sock_ev_client *client) {
	SDEBUG("http_delete_step1");
	struct sock_ev_client_delete *client_delete = NULL;
	SDEFINE_VAR_ALL(str_uri, str_uri_temp, str_action_name, str_temp);
	SDEFINE_VAR_MORE(str_args, str_sql, str_data, str_one_col, str_one_val);
	char *str_response = NULL;
	char *ptr_end_uri = NULL;
	char *ptr_data = NULL;
	char *ptr_data_end = NULL;
	ssize_t int_len = 0;
	size_t int_uri_length = 0;
	size_t int_query_length = 0;
	size_t int_data_length = 0;

	client->cur_request =
		create_request(client, NULL, NULL, NULL, NULL, sizeof(struct sock_ev_client_delete), POSTAGE_REQ_DELETE);
	SFINISH_CHECK(client->cur_request != NULL, "create_request failed!");
	client_delete = (struct sock_ev_client_delete *)(client->cur_request->vod_request_data);

	str_uri = str_uri_path(client->str_request, client->int_request_len, &int_uri_length);
	SFINISH_CHECK(str_uri != NULL, "str_uri_path() failed");
	str_args = query(client->str_request, client->int_request_len, &int_query_length);
	SFINISH_CHECK(str_args != NULL, "query() failed");

	SDEBUG("str_uri: %s", str_uri);

	ptr_end_uri = strchr(str_uri, '?');
	if (ptr_end_uri != NULL) {
		*ptr_end_uri = 0;
	}

	ptr_end_uri = strchr(str_uri, '#');
	if (ptr_end_uri != NULL) {
		*ptr_end_uri = 0;
	}

	SDEBUG("str_args: %s", str_args);

	// Get table names
	client_delete->str_real_table_name = getpar(str_args, "src", int_query_length, &client_delete->int_real_table_name_length);
	if (client_delete->str_real_table_name == NULL || strlen(client_delete->str_real_table_name) == 0) {
		SFREE(client_delete->str_real_table_name);
		client_delete->str_real_table_name =
			getpar(str_args, "view", int_query_length, &client_delete->int_real_table_name_length);
	}
	SFINISH_ERROR_CHECK(client_delete->str_real_table_name != NULL, "Failed to get table name from query");

	// Get return columns
	str_data = getpar(str_args, "id", int_query_length, &int_data_length);

	ptr_data = str_data;
	ptr_data_end = str_data + int_data_length;
	while (ptr_data < ptr_data_end) {
		if (*ptr_data != '0' && *ptr_data != '1' && *ptr_data != '2' && *ptr_data != '3' && *ptr_data != '4' &&
			*ptr_data != '5' && *ptr_data != '6' && *ptr_data != '7' && *ptr_data != '8' && *ptr_data != '9' &&
			*ptr_data != ',' && *ptr_data != ' ' && *ptr_data != '\t' && *ptr_data != '\n') {
			SFINISH("The id argument can only have commas, numbers and whitespace");
		}
		ptr_data++;
	}

	SFINISH_CAT_CSTR(
		client_delete->str_sql, "DELETE FROM ", client_delete->str_real_table_name, " WHERE id IN (", str_data, ");");

	SDEBUG("client_delete->str_sql: %s", client_delete->str_sql);
	if (DB_connection_driver(client->conn) == DB_DRIVER_POSTGRES) {
		SFINISH_CHECK(DB_exec(global_loop, client->conn, client, "BEGIN;", http_delete_step2), "DB_exec failed");
	} else {
		SFINISH_CHECK(DB_exec(global_loop, client->conn, client, "BEGIN TRANSACTION;", http_delete_step2), "DB_exec failed");
	}

	// SFINISH("Only WHERE, ORDER BY, LIMIT and OFFSET are allowed in the SELECT request");

	bol_error_state = false;
finish:
	SFREE_ALL();
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
		ws_delete_free(client_delete);
		ev_io_stop(global_loop, &client->io);
		SFREE(client->str_request);
		SERROR_CHECK_NORESPONSE(client_close(client), "Error closing Client");
	}
}

bool http_delete_step2(EV_P, void *cb_data, DB_result *res) {
	struct sock_ev_client *client = cb_data;
	struct sock_ev_client_delete *client_delete = (struct sock_ev_client_delete *)(client->cur_request->vod_request_data);
	char *str_response = NULL;
	char *_str_response = NULL;
	ssize_t int_len = 0;
	SDEFINE_VAR_ALL(str_temp);

	SFINISH_CHECK(res != NULL, "DB_exec failed");
	SFINISH_CHECK(res->status == DB_RES_COMMAND_OK, "DB_exec failed");

	DB_free_result(res);

	SDEBUG("client_delete->str_sql: %s", client_delete->str_sql);
	SFINISH_CHECK(DB_exec(EV_A, client->conn, client, client_delete->str_sql, http_delete_step3), "DB_exec failed");

	SDEBUG("str_response: %s", str_response);

	bol_error_state = false;
finish:
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
	SFREE(str_response);
	DB_free_result(res);
	if (int_len != 0) {
		ws_delete_free(client_delete);
		ev_io_stop(EV_A, &client->io);
		SFREE(client->str_request);
		SERROR_CHECK_NORESPONSE(client_close(client), "Error closing Client");
	}
	SFREE_ALL();
	return true;
}

bool http_delete_step3(EV_P, void *cb_data, DB_result *res) {
	struct sock_ev_client *client = cb_data;
	struct sock_ev_client_delete *client_delete = (struct sock_ev_client_delete *)(client->cur_request->vod_request_data);
	char *str_response = NULL;
	char *_str_response = NULL;
	ssize_t int_len = 0;
	SDEFINE_VAR_ALL(str_temp);

	SFINISH_CHECK(res != NULL, "DB_exec failed");
	SFINISH_CHECK(res->status == DB_RES_COMMAND_OK, "DB_exec failed");

	DB_free_result(res);

	if (DB_connection_driver(client->conn) == DB_DRIVER_POSTGRES) {
		SFINISH_CHECK(DB_exec(EV_A, client->conn, client, "END;", http_delete_step4), "DB_exec failed");
	} else {
		SFINISH_CHECK(DB_exec(EV_A, client->conn, client, "COMMIT TRANSACTION;", http_delete_step4), "DB_exec failed");
	}

	SDEBUG("str_response: %s", str_response);

	bol_error_state = false;
finish:
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
	SFREE(str_response);
	DB_free_result(res);
	if (int_len != 0) {
		ws_delete_free(client_delete);
		ev_io_stop(EV_A, &client->io);
		SFREE(client->str_request);
		SERROR_CHECK_NORESPONSE(client_close(client), "Error closing Client");
	}
	SFREE_ALL();
	return true;
}

bool http_delete_step4(EV_P, void *cb_data, DB_result *res) {
	struct sock_ev_client *client = cb_data;
	struct sock_ev_client_delete *client_delete = (struct sock_ev_client_delete *)(client->cur_request->vod_request_data);
	char *str_response = NULL;
	char *_str_response = NULL;
	ssize_t int_len = 0;
	DArray *arr_row_values = NULL;
	SDEFINE_VAR_ALL(str_temp);

	SFINISH_CHECK(res != NULL, "DB_exec failed");
	SFINISH_CHECK(res->status == DB_RES_COMMAND_OK, "DB_exec failed");

	SFINISH_CAT_CSTR(str_response, "HTTP/1.1 200 OK\015\012"
								   "Server: " SUN_PROGRAM_LOWER_NAME "\015\012\015\012"
								   "{\"stat\": true, \"dat\": \"\"}");
	SFREE(str_temp);

	SDEBUG("str_response: %s", str_response);

	bol_error_state = false;
finish:
	if (arr_row_values != NULL) {
		DArray_clear_destroy(arr_row_values);
		arr_row_values = NULL;
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
	SFREE(str_response);
	DB_free_result(res);
	ws_delete_free(client_delete);
	if (int_len != 0) {
		ev_io_stop(EV_A, &client->io);
		SFREE(client->str_request);
		SERROR_CHECK_NORESPONSE(client_close(client), "Error closing Client");
	}
	SFREE_ALL();
	return true;
}

#endif
