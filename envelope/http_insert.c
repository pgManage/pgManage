#ifdef ENVELOPE

#include "http_select.h"

void http_insert_step1(struct sock_ev_client *client) {
	SDEBUG("http_insert_step1");
	struct sock_ev_client_insert *client_insert = NULL;
	SDEFINE_VAR_ALL(str_uri, str_uri_temp, str_action_name, str_temp);
	SDEFINE_VAR_MORE(str_args, str_sql, str_data, str_one_col, str_one_val);
	char *str_response = NULL;
	char *ptr_end_uri = NULL;
	size_t int_count;
	char *ptr_end = NULL;
	char *ptr_loop = NULL;
	size_t int_one_col_len = 0;
	size_t int_uri_len = 0;
	size_t int_query_len = 0;
	size_t int_response_len = 0;

	client->cur_request =
		create_request(client, NULL, NULL, NULL, NULL, sizeof(struct sock_ev_client_insert), POSTAGE_REQ_INSERT);
	SFINISH_CHECK(client->cur_request != NULL, "create_request failed!");
	client_insert = (struct sock_ev_client_insert *)(client->cur_request->vod_request_data);

	str_uri = str_uri_path(client->str_request, client->int_request_len, &int_uri_len);
	SFINISH_CHECK(str_uri != NULL, "str_uri_path() failed");
	str_args = query(client->str_request, client->int_request_len, &int_query_len);
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
	client_insert->str_real_table_name = getpar(str_args, "src", int_query_len, &client_insert->int_real_table_name_len);
	if (client_insert->str_real_table_name == NULL || client_insert->str_real_table_name[0] == 0) {
		SFREE(client_insert->str_real_table_name);
		client_insert->str_real_table_name =
			getpar(str_args, "view", int_query_len, &client_insert->int_real_table_name_len);
	}
	SFINISH_ERROR_CHECK(client_insert->str_real_table_name != NULL && client_insert->str_real_table_name[0] != 0,
		"Failed to get table name from query");

	// Get sequence name
	client_insert->str_sequence_name = getpar(str_args, "currval", int_query_len, &client_insert->int_currval_len);

	// Get return columns
	str_data = getpar(str_args, "data", int_query_len, &client_insert->int_data_len);
	if (str_data != NULL && client_insert->int_data_len > 0) {
		SFINISH_SNCAT(client_insert->str_return_columns, &client_insert->int_return_columns_len,
			"", (size_t)0);
		SDEBUG("str_data: %s", str_data);
		ptr_loop = str_data;
		client_insert->darr_column_values = DArray_create(sizeof(char *), 1);
		while (ptr_loop[0] != 0) {
			// DEBUG("while loop start:");
			// CHECK_FOR_INTERRUPTS();
			// get keys
			ptr_end = bstrstr(ptr_loop, client_insert->int_data_len, "=", 1);
			SFINISH_CHECK(ptr_end != 0, "Badly formed data string. Should be URI encoded 'key=value&key=value'.");

			// get col name
			int_one_col_len = (size_t)(ptr_end - ptr_loop);
			SFINISH_SALLOC(str_one_col, int_one_col_len + 1);
			memcpy(str_one_col, ptr_loop, int_one_col_len);
			ptr_loop = ptr_loop + int_one_col_len + 1;
			str_one_col[int_one_col_len] = 0;
			client_insert->int_data_len -= int_one_col_len + 1;
			// decode if necessary
			ptr_end = bstrstr(str_one_col, int_one_col_len, "%", 1);
			if (ptr_end != NULL) {
				str_temp = str_one_col;
				str_one_col = uri_to_cstr(str_one_col, &int_one_col_len);
				SFREE(str_temp);
			}

			SFINISH_SNFCAT(client_insert->str_return_columns, &client_insert->int_return_columns_len,
				str_one_col, int_one_col_len,
				",", (size_t)1);
			SFREE(str_one_col);

			// get vals
			ptr_end = bstrstr(ptr_loop, client_insert->int_data_len, "&", 1);
			int_count = (ptr_end == 0) ? strlen(ptr_loop) : (size_t)(ptr_end - ptr_loop);
			SFINISH_SREALLOC(str_one_val, int_count + 1);
			memcpy(str_one_val, ptr_loop, int_count);
			ptr_loop = ptr_loop + int_count + ((ptr_end == 0) ? 0 : 1);
			str_one_val[int_count] = 0;
			client_insert->int_data_len -= int_count + ((ptr_end == 0) ? 0 : 1);
			;
			// decode if necessary
			ptr_end = bstrstr(str_one_val, int_count, "%", 1);
			if (ptr_end != NULL) {
				str_temp = str_one_val;
				str_one_val = uri_to_cstr(str_one_val, &int_count);
				SFREE(str_temp);
			}

			DArray_push(client_insert->darr_column_values, str_one_val);
			str_one_val = NULL;
		}
		client_insert->str_return_columns[strlen(client_insert->str_return_columns) - 1] = '\0';
		SDEBUG("client_insert->str_return_columns: %s", client_insert->str_return_columns);
		client_insert->int_return_columns_len -= 1;
	} else {
		SFINISH("No insert data");
	}

	SFINISH_SNCAT(client_insert->str_sql, &client_insert->int_sql_len,
		"SELECT ", (size_t)7,
		client_insert->str_return_columns, client_insert->int_return_columns_len,
		"\012   FROM ", (size_t)9,
		client_insert->str_real_table_name, client_insert->int_real_table_name_len,
		";", (size_t)1);

	if (DB_connection_driver(client->conn) == DB_DRIVER_POSTGRES) {
		SFINISH_CHECK(DB_exec(global_loop, client->conn, client, "BEGIN;", http_insert_step2), "DB_exec failed");
	} else if (DB_connection_driver(client->conn) == DB_DRIVER_SQL_SERVER) {
		SFINISH_CHECK(DB_exec(global_loop, client->conn, client, "BEGIN TRANSACTION;", http_insert_step2), "DB_exec failed");
	} else {
		SFINISH_CHECK(query_is_safe(client_insert->str_sql), "SQL Injection detected");
		SFINISH_CHECK(DB_get_column_types_for_query(global_loop, client->conn, client_insert->str_sql, client, http_insert_step3),
			"DB_get_column_types_for_query failed");
	}

	// SFINISH("Only WHERE, ORDER BY, LIMIT and OFFSET are allowed in the SELECT request");

	bol_error_state = false;
finish:
	SFREE_ALL();
	ssize_t int_client_write_len = 0;
	if (bol_error_state) {
		bol_error_state = false;

		char *_str_response = str_response;
		char str_length[51] = { 0 };
		snprintf(str_length, 50, "%zu", strlen(_str_response));
		char *str_temp =
			"HTTP/1.1 500 Internal Server Error\015\012"
			"Server: " SUN_PROGRAM_LOWER_NAME "\015\012"
			"Connection: close\015\012"
			"Content-Length: ";
		SFINISH_SNCAT(
			str_response, &int_response_len,
			str_temp, strlen(str_temp),
			str_length, strlen(str_length),
			"\015\012\015\012", (size_t)4,
			_str_response, strlen(_str_response)
		);
		SFREE(_str_response);
	}
	if (str_response != NULL && (int_client_write_len = client_write(client, str_response, strlen(str_response))) < 0) {
		SERROR_NORESPONSE("client_write() failed");
	}
	SFREE(str_response);
	if (int_client_write_len != 0) {
		ws_insert_free(client_insert);
		ev_io_stop(global_loop, &client->io);
		SFREE(client->str_request);
		SERROR_CHECK_NORESPONSE(client_close(client), "Error closing Client");
	}
}

bool http_insert_step2(EV_P, void *cb_data, DB_result *res) {
	struct sock_ev_client *client = cb_data;
	struct sock_ev_client_insert *client_insert = (struct sock_ev_client_insert *)(client->cur_request->vod_request_data);
	char *str_response = NULL;
	DArray *arr_row_values = NULL;
	size_t int_response_len = 0;
	SDEFINE_VAR_ALL(str_temp);

	SFINISH_CHECK(res != NULL, "DB_exec failed");
	SFINISH_CHECK(res->status == DB_RES_COMMAND_OK, "DB_exec failed");

	DB_free_result(res);

	SDEBUG("client_insert->str_sql: %s", client_insert->str_sql);
	SFINISH_CHECK(query_is_safe(client_insert->str_sql), "SQL Injection detected");
	SFINISH_CHECK(DB_get_column_types_for_query(EV_A, client->conn, client_insert->str_sql, client, http_insert_step3),
		"DB_get_column_types_for_query failed");

	SDEBUG("str_response: %s", str_response);

	bol_error_state = false;
finish:
	if (arr_row_values != NULL) {
		DArray_clear_destroy(arr_row_values);
		arr_row_values = NULL;
	}
	if (bol_error_state) {
		bol_error_state = false;

		char *_str_response1 = str_response;
		char *_str_response2 = DB_get_diagnostic(client->conn, res);
		char str_length[51] = { 0 };
		snprintf(str_length, 50, "%zu", strlen(_str_response1) + strlen(_str_response2) + 2);
		char *str_temp =
			"HTTP/1.1 500 Internal Server Error\015\012"
			"Server: " SUN_PROGRAM_LOWER_NAME "\015\012"
			"Connection: close\015\012"
			"Content-Length: ";
		SFINISH_SNCAT(
			str_response, &int_response_len,
			str_temp, strlen(str_temp),
			str_length, strlen(str_length),
			"\015\012\015\012", (size_t)4,
			_str_response1, strlen(_str_response1),
			":\n", (size_t)2,
			_str_response2, strlen(_str_response2)
		);
		SFREE(_str_response1);
		SFREE(_str_response2);
	}
	ssize_t int_client_write_len = 0;
	if (str_response != NULL && (int_client_write_len = client_write(client, str_response, strlen(str_response))) < 0) {
		SERROR_NORESPONSE("client_write() failed");
	}
	SFREE(str_response);
	DB_free_result(res);
	if (int_client_write_len != 0) {
		ws_insert_free(client_insert);
		ev_io_stop(EV_A, &client->io);
		SFREE(client->str_request);
		SERROR_CHECK_NORESPONSE(client_close(client), "Error closing Client");
	}
	SFREE_ALL();
	return true;
}

bool http_insert_step3(EV_P, void *cb_data, DB_result *res) {
	struct sock_ev_client *client = cb_data;
	struct sock_ev_client_insert *client_insert = (struct sock_ev_client_insert *)(client->cur_request->vod_request_data);
	char *str_response = NULL;
	size_t int_response_len = 0;
	size_t i = 0, int_len = 0;
	SDEFINE_VAR_ALL(str_temp);

	SFINISH_CHECK(res != NULL, "query_callback failed!");
	SFINISH_CHECK(res->status == DB_RES_TUPLES_OK, "Query failed");

	SFINISH_CHECK(DB_fetch_row(res) == DB_FETCH_OK, "DB_fetch_row failed");
	client_insert->darr_column_types = DB_get_row_values(res);

	DB_free_result(res);

	SFREE(client_insert->str_sql);

	if (strcmp(client_insert->str_return_columns, "*") == 0) {
		SFINISH_SNCAT(client_insert->str_sql, &client_insert->int_sql_len,
			"INSERT INTO ", (size_t)12,
			client_insert->str_real_table_name, client_insert->int_real_table_name_len,
			" VALUES (", (size_t)9);
	} else {
		SFINISH_SNCAT(client_insert->str_sql, &client_insert->int_sql_len,
			"INSERT INTO ", (size_t)12,
			client_insert->str_real_table_name, client_insert->int_real_table_name_len,
			" (", (size_t)2,
			client_insert->str_return_columns, client_insert->int_return_columns_len,
			") VALUES (", (size_t)10);
	}

	int_len = DArray_end(client_insert->darr_column_types);
	for (i = 0; i < int_len; i += 1) {
		str_temp = DB_escape_literal(client->conn, DArray_get(client_insert->darr_column_values, i),
			strlen(DArray_get(client_insert->darr_column_values, i)));
		SFINISH_CHECK(str_temp != NULL, "DB_escape_literal failed");
		if (DB_connection_driver(client->conn) == DB_DRIVER_POSTGRES) {
			SFINISH_SNFCAT(client_insert->str_sql, &client_insert->int_sql_len,
				str_temp, strlen(str_temp),
				"::", (size_t)2,
				DArray_get(client_insert->darr_column_types, i),
				strlen(DArray_get(client_insert->darr_column_types, i)));
		} else if (DB_connection_driver(client->conn) == DB_DRIVER_SQL_SERVER) {
			SFINISH_SNFCAT(client_insert->str_sql, &client_insert->int_sql_len,
				"CAST(", (size_t)5,
				str_temp, strlen(str_temp),
				" AS ", (size_t)4,
				DArray_get(client_insert->darr_column_types, i), strlen(DArray_get(client_insert->darr_column_types, i)),
				")", (size_t)1);
		} else {
			SFINISH_SNFCAT(client_insert->str_sql, &client_insert->int_sql_len,
				str_temp, strlen(str_temp));
		}
		SFREE(str_temp);
		if (i < (int_len - 1)) {
			SFINISH_SNFCAT(client_insert->str_sql, &client_insert->int_sql_len,
				",", (size_t)1);
		} else {
			SFINISH_SNFCAT(client_insert->str_sql, &client_insert->int_sql_len,
				");", (size_t)2);
		}
	}
	int_len = 0;
	DArray_clear_destroy(client_insert->darr_column_types);
	client_insert->darr_column_types = NULL;

	SDEBUG("client_insert->str_sql: %s", client_insert->str_sql);

	// Use the sql we generated earlier to send all the data to the socket
	SFINISH_CHECK(query_is_safe(client_insert->str_sql), "SQL Injection detected");
	SFINISH_CHECK(DB_exec(EV_A, client->conn, client, client_insert->str_sql, http_insert_step4), "DB_exec failed");

	SDEBUG("str_response: %s", str_response);

	bol_error_state = false;
finish:
	if (bol_error_state) {
		bol_error_state = false;

		if (client_insert->darr_column_types != NULL) {
			DArray_clear_destroy(client_insert->darr_column_types);
			client_insert->darr_column_types = NULL;
		}

		char *_str_response1 = str_response;
		char *_str_response2 = DB_get_diagnostic(client->conn, res);
		char str_length[51] = { 0 };
		snprintf(str_length, 50, "%zu", strlen(_str_response1) + strlen(_str_response2) + 2);
		char *str_temp =
			"HTTP/1.1 500 Internal Server Error\015\012"
			"Server: " SUN_PROGRAM_LOWER_NAME "\015\012"
			"Connection: close\015\012"
			"Content-Length: ";
		SFINISH_SNCAT(
			str_response, &int_response_len,
			str_temp, strlen(str_temp),
			str_length, strlen(str_length),
			"\015\012\015\012", (size_t)4,
			_str_response1, strlen(_str_response1),
			":\n", (size_t)2,
			_str_response2, strlen(_str_response2)
		);
		SFREE(_str_response1);
		SFREE(_str_response2);
	}
	ssize_t int_client_write_len = 0;
	if (str_response != NULL && (int_client_write_len = client_write(client, str_response, strlen(str_response))) < 0) {
		SFREE(str_response);
		SERROR_NORESPONSE("client_write() failed");
	}
	SFREE(str_response);
	DB_free_result(res);
	SFREE_ALL();
	if (int_client_write_len != 0) {
		ws_insert_free(client_insert);
		ev_io_stop(EV_A, &client->io);
		SFREE(client->str_request);
		SERROR_CHECK_NORESPONSE(client_close(client), "Error closing Client");
	}
	return true;
}

bool http_insert_step4(EV_P, void *cb_data, DB_result *res) {
	struct sock_ev_client *client = cb_data;
	struct sock_ev_client_insert *client_insert = (struct sock_ev_client_insert *)(client->cur_request->vod_request_data);
	char *str_response = NULL;
	DArray *arr_row_values = NULL;
	size_t int_response_len = 0;
	SDEFINE_VAR_ALL(str_temp, str_col_seq);

	SFINISH_CHECK(res != NULL, "DB_exec failed");
	SFINISH_CHECK(res->status == DB_RES_COMMAND_OK, "DB_exec failed");

	SFREE(client_insert->str_sql);
	if (DB_connection_driver(client->conn) == DB_DRIVER_POSTGRES) {
		if (client_insert->str_sequence_name != NULL && strlen(client_insert->str_sequence_name) > 0) {
			SFINISH_SNCAT(client_insert->str_sql, &client_insert->int_sql_len,
				"SELECT currval(", (size_t)15,
				client_insert->str_sequence_name, strlen(client_insert->str_sequence_name),
				");", (size_t)2);
		} else {
			SFINISH_SNCAT(client_insert->str_sql, &client_insert->int_sql_len,
				"SELECT lastval();", (size_t)17);
		}

		SFINISH_CHECK(query_is_safe(client_insert->str_sql), "SQL Injection detected");
		SFINISH_CHECK(DB_exec(EV_A, client->conn, client, client_insert->str_sql, http_insert_step5), "DB_exec failed");
	} else if (DB_connection_driver(client->conn) == DB_DRIVER_SQL_SERVER) {
		if (client_insert->str_sequence_name != NULL && strlen(client_insert->str_sequence_name) > 0) {
			str_col_seq = DB_escape_literal(client->conn, client_insert->str_sequence_name, strlen(client_insert->str_sequence_name));
			SFINISH_CHECK(str_col_seq != NULL, "DB_escape_literal failed!");
			SFINISH_SNCAT(client_insert->str_sql, &client_insert->int_sql_len,
				"SELECT CAST(IDENT_CURRENT(", (size_t)26,
				str_col_seq, strlen(str_col_seq),
				") AS nvarchar(MAX));", (size_t)20);
		} else {
			SFINISH_SNCAT(client_insert->str_sql, &client_insert->int_sql_len,
				"SELECT CAST(SCOPE_IDENTITY() AS nvarchar(MAX));", (size_t)47);
		}

		SFINISH_CHECK(query_is_safe(client_insert->str_sql), "SQL Injection detected");
		SFINISH_CHECK(DB_exec(EV_A, client->conn, client, client_insert->str_sql, http_insert_step5), "DB_exec failed");
	} else {
		SFINISH_SNCAT(client_insert->str_sql, &client_insert->int_sql_len,
			" SELECT Cstr(id) As id2 FROM (SELECT TOP 1 @@IDENTITY AS id FROM ", (size_t)65,
			client_insert->str_real_table_name, client_insert->int_real_table_name_len,
			") em", (size_t)4);
		SFINISH_CHECK(query_is_safe(client_insert->str_sql), "SQL Injection detected");
		SFINISH_CHECK(DB_exec(EV_A, client->conn, client, client_insert->str_sql, http_insert_step6), "DB_exec failed");
	}

	DB_free_result(res);

	SDEBUG("client_insert->str_sql: %s", client_insert->str_sql);

	SDEBUG("str_response: %s", str_response);

	bol_error_state = false;
finish:
	if (arr_row_values != NULL) {
		DArray_clear_destroy(arr_row_values);
		arr_row_values = NULL;
	}
	if (bol_error_state) {
		bol_error_state = false;

		char *_str_response1 = str_response;
		char *_str_response2 = DB_get_diagnostic(client->conn, res);
		char str_length[51] = { 0 };
		snprintf(str_length, 50, "%zu", strlen(_str_response1) + strlen(_str_response2) + 2);
		char *str_temp =
			"HTTP/1.1 500 Internal Server Error\015\012"
			"Server: " SUN_PROGRAM_LOWER_NAME "\015\012"
			"Connection: close\015\012"
			"Content-Length: ";
		SFINISH_SNCAT(
			str_response, &int_response_len,
			str_temp, strlen(str_temp),
			str_length, strlen(str_length),
			"\015\012\015\012", (size_t)4,
			_str_response1, strlen(_str_response1),
			":\n", (size_t)2,
			_str_response2, strlen(_str_response2)
		);
		SFREE(_str_response1);
		SFREE(_str_response2);
	}
	ssize_t int_client_write_len = 0;
	if (str_response != NULL && (int_client_write_len = client_write(client, str_response, strlen(str_response))) < 0) {
		SERROR_NORESPONSE("client_write() failed");
	}
	SFREE(str_response);
	DB_free_result(res);
	if (int_client_write_len != 0) {
		ws_insert_free(client_insert);
		ev_io_stop(EV_A, &client->io);
		SFREE(client->str_request);
		SERROR_CHECK_NORESPONSE(client_close(client), "Error closing Client");
	}
	SFREE_ALL();
	return true;
}

bool http_insert_step5(EV_P, void *cb_data, DB_result *res) {
	struct sock_ev_client *client = cb_data;
	struct sock_ev_client_insert *client_insert = (struct sock_ev_client_insert *)(client->cur_request->vod_request_data);
	char *str_response = NULL;
	DArray *arr_row_values = NULL;
	size_t int_response_len = 0;
	SDEFINE_VAR_ALL(str_temp);

	SFINISH_CHECK(res != NULL, "DB_exec failed");
	SFINISH_CHECK(res->status == DB_RES_TUPLES_OK, "DB_exec failed");

	SFINISH_CHECK(DB_fetch_row(res) == DB_FETCH_OK, "DB_fetch_row failed");

	arr_row_values = DB_get_row_values(res);
	SFINISH_CHECK(arr_row_values != NULL, "DB_get_row_values failed");

	SFINISH_SNCAT(client_insert->str_result, &client_insert->int_result_len,
		DArray_get(arr_row_values, 0), strlen(DArray_get(arr_row_values, 0)));
	DArray_clear_destroy(arr_row_values);
	arr_row_values = NULL;

	SFINISH_CHECK(DB_fetch_row(res) == DB_FETCH_END, "DB_fetch_row failed");

	if (DB_connection_driver(client->conn) == DB_DRIVER_POSTGRES) {
		SFINISH_CHECK(DB_exec(EV_A, client->conn, client, "END;", http_insert_step6), "DB_exec failed");
	} else {
		SFINISH_CHECK(DB_exec(EV_A, client->conn, client, "COMMIT TRANSACTION;", http_insert_step6), "DB_exec failed");
	}

	SDEBUG("str_response: %s", str_response);

	bol_error_state = false;
finish:
	if (arr_row_values != NULL) {
		DArray_clear_destroy(arr_row_values);
		arr_row_values = NULL;
	}
	if (bol_error_state) {
		bol_error_state = false;

		char *_str_response1 = str_response;
		char *_str_response2 = DB_get_diagnostic(client->conn, res);
		char str_length[51] = { 0 };
		snprintf(str_length, 50, "%zu", strlen(_str_response1) + strlen(_str_response2) + 2);
		char *str_temp =
			"HTTP/1.1 500 Internal Server Error\015\012"
			"Server: " SUN_PROGRAM_LOWER_NAME "\015\012"
			"Connection: close\015\012"
			"Content-Length: ";
		SFINISH_SNCAT(
			str_response, &int_response_len,
			str_temp, strlen(str_temp),
			str_length, strlen(str_length),
			"\015\012\015\012", (size_t)4,
			_str_response1, strlen(_str_response1),
			":\n", (size_t)2,
			_str_response2, strlen(_str_response2)
		);
		SFREE(_str_response1);
		SFREE(_str_response2);
	}
	ssize_t int_client_write_len = 0;
	if (str_response != NULL && (int_client_write_len = client_write(client, str_response, strlen(str_response))) < 0) {
		SERROR_NORESPONSE("client_write() failed");
	}
	SFREE(str_response);
	DB_free_result(res);
	if (int_client_write_len != 0) {
		ws_insert_free(client_insert);
		ev_io_stop(EV_A, &client->io);
		SFREE(client->str_request);
		SERROR_CHECK_NORESPONSE(client_close(client), "Error closing Client");
	}
	SFREE_ALL();
	return true;
}

bool http_insert_step6(EV_P, void *cb_data, DB_result *res) {
	struct sock_ev_client *client = cb_data;
	struct sock_ev_client_insert *client_insert = (struct sock_ev_client_insert *)(client->cur_request->vod_request_data);
	char *str_response = NULL;
	size_t int_response_len = 0;
	DArray *arr_row_values = NULL;
	SDEFINE_VAR_ALL(str_temp);

	SFINISH_CHECK(res != NULL, "DB_exec failed");
	if (DB_connection_driver(client->conn) == DB_DRIVER_MSACCESS) {
		SFINISH_CHECK(res->status == DB_RES_TUPLES_OK, "DB_exec failed");

		SFINISH_CHECK(DB_fetch_row(res) == DB_FETCH_OK, "DB_fetch_row failed");

		arr_row_values = DB_get_row_values(res);
		SFINISH_CHECK(arr_row_values != NULL, "DB_get_row_values failed");

		SFREE(client_insert->str_result);
		SFINISH_SNCAT(client_insert->str_result, &client_insert->int_result_len,
			DArray_get(arr_row_values, 0), strlen(DArray_get(arr_row_values, 0)));
		DArray_clear_destroy(arr_row_values);
		arr_row_values = NULL;

		SFINISH_CHECK(DB_fetch_row(res) == DB_FETCH_END, "DB_fetch_row failed");
	} else {
		SFINISH_CHECK(res->status == DB_RES_COMMAND_OK, "DB_exec failed");
	}

	SFINISH_SNCAT(str_response, &int_response_len,
		"HTTP/1.1 200 OK\015\012"
		"Server: " SUN_PROGRAM_LOWER_NAME "\015\012"
		"Connection: close\015\012\015\012"
		"{\"stat\": true, \"dat\": {\"lastval\": ",
		strlen("HTTP/1.1 200 OK\015\012"
			"Server: " SUN_PROGRAM_LOWER_NAME "\015\012"
			"Connection: close\015\012\015\012"
			"{\"stat\": true, \"dat\": {\"lastval\": "),
		client_insert->str_result, client_insert->int_result_len,
		"}}", (size_t)2);
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

		char *_str_response1 = str_response;
		char *_str_response2 = DB_get_diagnostic(client->conn, res);
		char str_length[51] = { 0 };
		snprintf(str_length, 50, "%zu", strlen(_str_response1) + strlen(_str_response2) + 2);
		char *str_temp =
			"HTTP/1.1 500 Internal Server Error\015\012"
			"Server: " SUN_PROGRAM_LOWER_NAME "\015\012"
			"Connection: close\015\012"
			"Content-Length: ";
		SFINISH_SNCAT(
			str_response, &int_response_len,
			str_temp, strlen(str_temp),
			str_length, strlen(str_length),
			"\015\012\015\012", (size_t)4,
			_str_response1, strlen(_str_response1),
			":\n", (size_t)2,
			_str_response2, strlen(_str_response2)
		);
		SFREE(_str_response1);
		SFREE(_str_response2);
	}
	ssize_t int_client_write_len = 0;
	if (str_response != NULL && (int_client_write_len = client_write(client, str_response, strlen(str_response))) < 0) {
		SERROR_NORESPONSE("client_write() failed");
	}
	SFREE(str_response);
	DB_free_result(res);
	ws_insert_free(client_insert);
	if (int_client_write_len != 0) {
		ev_io_stop(EV_A, &client->io);
		SFREE(client->str_request);
		SERROR_CHECK_NORESPONSE(client_close(client), "Error closing Client");
	}
	SFREE_ALL();
	return true;
}

#endif
