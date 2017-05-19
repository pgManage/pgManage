#include "http_select.h"

void http_select_step1(struct sock_ev_client *client) {
	SDEBUG("http_select_step1");
	struct sock_ev_client_select *client_select = NULL;
	SDEFINE_VAR_ALL(str_uri, str_uri_temp, str_action_name, str_temp, str_args, str_sql);
	char *str_response = NULL;
	char *ptr_end_uri = NULL;
	size_t int_uri_len = 0;
	size_t int_query_len = 0;
	size_t int_temp_len = 0;
	size_t int_response_len = 0;

	client->cur_request =
		create_request(client, NULL, NULL, NULL, NULL, sizeof(struct sock_ev_client_select), POSTAGE_REQ_SELECT);
	SFINISH_CHECK(client->cur_request != NULL, "create_request failed!");
	client_select = (struct sock_ev_client_select *)(client->cur_request->client_request_data);
	client->cur_request->parent = client;

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

	// Get table names and return columns
	client_select->str_real_table_name = getpar(str_args, "src", int_query_len, &client_select->int_real_table_name_len);
	if (client_select->str_real_table_name == NULL || client_select->str_real_table_name[0] == 0) {
		SFREE(client_select->str_real_table_name);
		client_select->str_real_table_name =
			getpar(str_args, "view", int_query_len, &client_select->int_real_table_name_len);
	}
	SFINISH_ERROR_CHECK(client_select->str_real_table_name != NULL && client_select->str_real_table_name[0] != 0,
		"Failed to get table name from query");
	client_select->str_return_columns = getpar(str_args, "cols", int_query_len, &client_select->int_return_columns_len);
	if (client_select->str_return_columns == NULL || strlen(client_select->str_return_columns) == 0) {
		SFREE(client_select->str_return_columns);
		SFINISH_SNCAT(client_select->str_return_columns, &client_select->int_return_columns_len,
			"*", (size_t)1);
	}

	// If src is in fact a query, not a object name, then wrap with parentheses
	SFINISH_SNCAT(str_temp, &int_temp_len,
		client_select->str_real_table_name, client_select->int_real_table_name_len);
	bstr_toupper(str_temp, int_temp_len);
	SDEBUG("str_temp: %s", str_temp);
	if (strstr(str_temp, "SELECT") != NULL && *client_select->str_real_table_name != '(') {
		SFREE(str_temp);
		str_temp = client_select->str_real_table_name;
		int_temp_len = client_select->int_real_table_name_len;
		client_select->str_real_table_name = NULL;

		SFINISH_SNCAT(client_select->str_real_table_name, &client_select->int_real_table_name_len,
			"(", (size_t)1,
			str_temp, int_temp_len,
			") sun_sub_query_you_wont_guess_this", (size_t)35);
	}
	SFREE(str_temp);

	client_select->str_where = getpar(str_args, "where", int_query_len, &client_select->int_where_len);
	if (client_select->str_where != NULL && client_select->int_where_len == 0) {
		SFREE(client_select->str_where);
	}
	client_select->str_order_by = getpar(str_args, "order_by", int_query_len, &client_select->int_order_by_len);
	if (client_select->str_order_by != NULL && client_select->int_order_by_len == 0) {
		SFREE(client_select->str_order_by);
	}
	client_select->str_limit = getpar(str_args, "limit", int_query_len, &client_select->int_limit_len);
	if (client_select->str_limit != NULL && client_select->int_limit_len == 0) {
		SFREE(client_select->str_limit);
		client_select->int_limit_len = 0;
	}
	if (client_select->str_limit != NULL && strncmp(client_select->str_limit, "ALL", 4) == 0) {
		SFREE(client_select->str_limit);
	}
	client_select->str_offset = getpar(str_args, "offset", int_query_len, &client_select->int_offset_len);
	if (client_select->str_offset != NULL && client_select->int_offset_len == 0) {
		SFREE(client_select->str_offset);
		client_select->int_offset_len = 0;
	}

	SFINISH_SNCAT(client_select->str_sql, &client_select->int_sql_len,
		"SELECT count(*) OVER () AS sun_row_count_you_wont_guess_this, ", (size_t)62,
		client_select->str_return_columns, client_select->int_return_columns_len,
		"\012   FROM ", (size_t)9,
		client_select->str_real_table_name, client_select->int_real_table_name_len,
		"\012", (size_t)1);

	if (client_select->str_where != NULL) {
		SFINISH_SNFCAT(client_select->str_sql, &client_select->int_sql_len,
			"WHERE ", (size_t)6,
			client_select->str_where, client_select->int_where_len,
			"\012", (size_t)1);
	}

	if (client_select->str_order_by != NULL) {
		SFINISH_SNFCAT(client_select->str_sql, &client_select->int_sql_len,
			"ORDER BY ", (size_t)9,
			client_select->str_order_by, client_select->int_order_by_len,
			"\012", (size_t)1);
	}

	if (DB_connection_driver(client->conn) == DB_DRIVER_POSTGRES) {
		if (client_select->str_limit != NULL) {
			SFINISH_SNFCAT(client_select->str_sql, &client_select->int_sql_len,
				"LIMIT ", (size_t)6,
				client_select->str_limit, client_select->int_limit_len,
				"\012", (size_t)1);
		}

		if (client_select->str_offset != NULL) {
			SFINISH_SNFCAT(client_select->str_sql, &client_select->int_sql_len,
				"OFFSET ", (size_t)7,
				client_select->str_offset, client_select->int_offset_len,
				"\012", (size_t)1);
		}
	}

	SDEBUG("client_select->str_sql: %s", client_select->str_sql);
	SFINISH_CHECK(query_is_safe(client_select->str_sql), "SQL Injection detected");
	SFINISH_CHECK(DB_get_column_types_for_query(global_loop, client->conn, client_select->str_sql, client, http_select_step2),
		"DB_get_column_types_for_query failed");

	// SFINISH("Only WHERE, ORDER BY, LIMIT and OFFSET are allowed in the SELECT request");

	bol_error_state = false;
finish:
	SFREE_ALL();
	ssize_t int_client_write_len = 0;
	if (bol_error_state) {
		bol_error_state = false;

		char *_str_response = str_response;
		char str_len[51] = { 0 };
		snprintf(str_len, 50, "%zu", strlen(_str_response));
		char *str_temp =
			"HTTP/1.1 500 Internal Server Error\015\012"
			"Server: " SUN_PROGRAM_LOWER_NAME "\015\012"
			"Connection: close\015\012"
			"Content-Length: ";
		SFINISH_SNCAT(
			str_response, &int_response_len,
			str_temp, strlen(str_temp),
			str_len, strlen(str_len),
			"\015\012\015\012", (size_t)4,
			_str_response, strlen(_str_response)
		);
		SFREE(_str_response);
	}
	if (str_response != NULL && client_write(client, str_response, int_response_len) < 0) {
		SERROR_NORESPONSE("client_write() failed");
	}
	SFREE(str_response);
	if (int_client_write_len != 0) {
		ws_select_free(client_select);
		ev_io_stop(global_loop, &client->io);
		SFREE(client->str_request);
		SERROR_CHECK_NORESPONSE(client_close(client), "Error closing Client");
	}
}

bool http_select_step2(EV_P, void *cb_data, DB_result *res) {
	struct sock_ev_client *client = cb_data;
	struct sock_ev_client_select *client_select = (struct sock_ev_client_select *)(client->cur_request->client_request_data);
	char *str_response = NULL;
	size_t int_i = 0;
	size_t int_len = 0;
	SDEFINE_VAR_ALL(str_col, str_temp, str_inner_top);
	size_t int_inner_top_len = 0;
	size_t int_response_len = 0;

	SFINISH_CHECK(res != NULL, "query_callback failed!");
	SFINISH_CHECK(res->status == DB_RES_TUPLES_OK, "Query failed");

	SFINISH_CHECK(DB_fetch_row(res) == DB_FETCH_OK, "DB_fetch_row failed");
	client_select->darr_column_types = DB_get_row_values(res);

	if (DB_connection_driver(client->conn) != DB_DRIVER_POSTGRES) {
		SFREE(client_select->str_sql);
		SFREE(client_select->str_return_columns);
		SFINISH_SNCAT(client_select->str_return_columns, &client_select->int_return_columns_len,
			"", (size_t)0);

		client_select->darr_column_names = DB_get_column_names(res);
		SFINISH_CHECK(client_select->darr_column_names != NULL, "DB_get_column_names failed");

		// skip the first column (it is the count(*))
		for (int_i = 1, int_len = DArray_end(client_select->darr_column_names); int_i < int_len; int_i += 1) {
			str_col = DB_escape_identifier(
				client->conn, DArray_get(client_select->darr_column_names, int_i), strlen(DArray_get(client_select->darr_column_names, int_i)));
			SFINISH_CHECK(str_col != NULL, "DB_escape_identifier failed");
			SFINISH_SNFCAT(client_select->str_return_columns, &client_select->int_return_columns_len,
				int_i == 1 ? "" : ", ", strlen(int_i == 1 ? "" : ", "),
				"CAST(", (size_t)5,
				str_col, strlen(str_col),
				" AS nvarchar(MAX)) AS ", (size_t)22,
				str_col, strlen(str_col),
				"\"_return\"", (size_t)9);
			SFREE(str_col);
		}

		if (client_select->str_order_by == NULL) {
			SFINISH_SNCAT(client_select->str_order_by, &client_select->int_order_by_len,
				"", (size_t)0);
			for (int_i = 1, int_len = DArray_end(client_select->darr_column_names); int_i < int_len; int_i += 1) {
				str_col = DB_escape_identifier(
					client->conn, DArray_get(client_select->darr_column_names, int_i), strlen(DArray_get(client_select->darr_column_names, int_i)));
				SFINISH_CHECK(str_col != NULL, "DB_escape_identifier failed");
				SFINISH_SNFCAT(client_select->str_order_by, &client_select->int_order_by_len,
					int_i == 1 ? "" : ", ", strlen(int_i == 1 ? "" : ", "),
					str_col, strlen(str_col));
				SFREE(str_col);
			}
		}

		SFINISH_SALLOC(str_temp, 10);
		snprintf(str_temp, 10, "%d", rand() % 10000);
		SFINISH_SNCAT(client_select->str_statement_name, &client_select->int_statement_name_len,
			"temp_", (size_t)5,
			str_temp, strlen(str_temp));
		SFREE(str_temp);

		SFINISH_SNCAT(client_select->str_sql, &client_select->int_sql_len,
			"SELECT sun_row_count_you_wont_guess_this, ", (size_t)42,
			client_select->str_return_columns, client_select->int_return_columns_len,
			"\012", (size_t)1);
		if (client_select->str_limit != NULL && client_select->str_offset != NULL) {
			SFINISH_SNCAT(str_inner_top, &int_inner_top_len,
				"(", (size_t)1,
				client_select->str_limit, client_select->int_limit_len,
				" + ", (size_t)3,
				client_select->str_offset, client_select->int_offset_len,
				")", (size_t)1);
		} else if (client_select->str_limit != NULL) {
			SFINISH_SNCAT(str_inner_top, &int_inner_top_len,
				client_select->str_limit, client_select->int_limit_len);
		} else if (client_select->str_offset != NULL) {
			SFINISH_SNCAT(str_inner_top, &int_inner_top_len,
				client_select->str_offset, client_select->int_offset_len);
		} else {
			SFINISH_SNCAT(str_inner_top, &int_inner_top_len,
				"100 PERCENT", (size_t)11);
		}

		SFINISH_SNFCAT(client_select->str_sql, &client_select->int_sql_len,
			"   FROM (\012		SELECT TOP ", (size_t)23,
			str_inner_top, int_inner_top_len,
			" CAST(ROW_NUMBER() OVER (ORDER BY ", (size_t)34,
			client_select->str_order_by, client_select->int_order_by_len,
			") AS nvarchar(MAX)) AS ", (size_t)23,
			client_select->str_statement_name, client_select->int_statement_name_len,
			"_row, CAST(count(*) OVER () AS nvarchar(MAX)) AS sun_row_count_you_wont_guess_this, *\012			FROM ", (size_t)94,
			client_select->str_real_table_name, client_select->int_real_table_name_len,
			"\012", (size_t)1);
		if (client_select->str_where != NULL) {
			SFINISH_SNFCAT(client_select->str_sql, &client_select->int_sql_len,
				"			WHERE (", (size_t)10,
				client_select->str_where, client_select->int_where_len,
				")\012", (size_t)2);
		}

		SFINISH_SNFCAT(client_select->str_sql, &client_select->int_sql_len,
			"	) ", (size_t)3,
			client_select->str_statement_name, client_select->int_statement_name_len,
			"\012", (size_t)1);

		SFINISH_SNFCAT(client_select->str_sql, &client_select->int_sql_len,
			"	WHERE 1=1", (size_t)10);

		if (client_select->str_offset != NULL) {
			SFINISH_SNFCAT(client_select->str_sql, &client_select->int_sql_len,
				" AND (", (size_t)6,
				client_select->str_statement_name, client_select->int_statement_name_len,
				"_row > ", (size_t)7,
				client_select->str_offset, client_select->int_offset_len,
				")", (size_t)1);
		}
		SFINISH_SNFCAT(client_select->str_sql, &client_select->int_sql_len,
			"	ORDER BY ", (size_t)10,
			client_select->str_order_by, client_select->int_order_by_len,
			"\012", (size_t)1);
	}

	DB_free_result(res);
	// Use the sql we generated earlier to send all the data to the socket
	SDEBUG("client_select->str_sql: %s", client_select->str_sql);
	SFINISH_CHECK(query_is_safe(client_select->str_sql), "SQL Injection detected");
	SFINISH_CHECK(DB_exec(EV_A, client->conn, client, client_select->str_sql, http_select_step3), "DB_exec failed");

	SDEBUG("str_response: %s", str_response);

	bol_error_state = false;
finish:
	SFREE_ALL();
	if (bol_error_state) {
		bol_error_state = false;

		if (client_select->darr_column_types != NULL) {
			DArray_clear_destroy(client_select->darr_column_types);
			client_select->darr_column_types = NULL;
		}

		char *_str_response1 = str_response;
		char *_str_response2 = DB_get_diagnostic(client->conn, res);
		char str_len[51] = { 0 };
		snprintf(str_len, 50, "%zu", strlen(_str_response1) + strlen(_str_response2) + 2);
		char *str_temp =
			"HTTP/1.1 500 Internal Server Error\015\012"
			"Server: " SUN_PROGRAM_LOWER_NAME "\015\012"
			"Connection: close\015\012"
			"Content-Length: ";
		SFINISH_SNCAT(
			str_response, &int_response_len,
			str_temp, strlen(str_temp),
			str_len, strlen(str_len),
			"\015\012\015\012", (size_t)4,
			_str_response1, strlen(_str_response1),
			":\n", (size_t)2,
			_str_response2, strlen(_str_response2)
		);
		SFREE(_str_response1);
		SFREE(_str_response2);
	}
	ssize_t int_client_write_len = 0;
	if (str_response != NULL && (int_client_write_len = client_write(client, str_response, int_response_len)) < 0) {
		SERROR_NORESPONSE("client_write() failed");
	}
	SFREE(str_response);
	DB_free_result(res);
	if (int_client_write_len != 0) {
		ws_select_free(client_select);
		ev_io_stop(EV_A, &client->io);
		SFREE(client->str_request);
		SERROR_CHECK_NORESPONSE(client_close(client), "Error closing Client");
	}
	return true;
}

bool http_select_step3(EV_P, void *cb_data, DB_result *res) {
	struct sock_ev_client *client = cb_data;
	struct sock_ev_client_select *client_select = (struct sock_ev_client_select *)(client->cur_request->client_request_data);
	char *str_response = NULL;
	size_t int_len = 0, i = 0;
	SDEFINE_VAR_ALL(str_json_columns, str_json_one_column, str_row_count);
	size_t int_json_one_column_len = 0;
	size_t int_json_columns_len = 0;
	struct sock_ev_client_copy_check *client_copy_check = NULL;
	size_t int_response_len = 0;

	SFINISH_CHECK(res != NULL, "DB_exec failed");
	SFINISH_CHECK(res->status == DB_RES_TUPLES_OK, "DB_exec failed");

	SFINISH_SALLOC(client_copy_check, sizeof(struct sock_ev_client_copy_check));

	if (client_select->darr_column_names == NULL) {
		client_select->darr_column_names = DB_get_column_names(res);
		SFINISH_CHECK(client_select->darr_column_names != NULL, "DB_get_column_names failed");
	}

	int_len = DArray_end(client_select->darr_column_names);
	SFINISH_SNCAT(str_json_columns, &int_json_columns_len,
		"", (size_t)0);
	for (i = 1; i < int_len; i += 1) {
		// Add the type to the response
		int_json_one_column_len = strlen(DArray_get(client_select->darr_column_names, i));
		str_json_one_column = jsonify(DArray_get(client_select->darr_column_names, i), &int_json_one_column_len);
		SFINISH_SNFCAT(str_json_columns, &int_json_columns_len,
			str_json_one_column, int_json_one_column_len,
			i < (int_len - 1) ? "," : "", strlen(i < (int_len - 1) ? "," : ""));
		SFREE(str_json_one_column);
	}
	DArray_clear_destroy(client_select->darr_column_names);
	client_select->darr_column_names = NULL;

	SFINISH_SNCAT(client_copy_check->str_response, (size_t *)&client_copy_check->int_response_len,
		"HTTP/1.1 200 OK\015\012"
		"Server: " SUN_PROGRAM_LOWER_NAME "\015\012"
		"Connection: close\015\012"
		"Content-Type: application/json; charset=UTF-8\015\012"
		"\015\012"
		"{\"stat\": true, \"dat\": {\"arr_column\": [",
		strlen("HTTP/1.1 200 OK\015\012"
			"Server: " SUN_PROGRAM_LOWER_NAME "\015\012"
			"Connection: close\015\012"
			"Content-Type: application/json; charset=UTF-8\015\012"
			"\015\012"
			"{\"stat\": true, \"dat\": {\"arr_column\": ["),
		str_json_columns, int_json_columns_len,
		"], \"dat\": [", (size_t)11);
	SFREE(str_json_columns);

	client_copy_check->int_response_len = (ssize_t)strlen(client_copy_check->str_response);
	client_copy_check->client_request = client->cur_request;
	client_copy_check->res = res;

	increment_idle(EV_A);
	ev_check_init(&client_copy_check->check, http_select_step4);
	ev_check_start(EV_A, &client_copy_check->check);
	client->client_copy_check = client_copy_check;

	bol_error_state = false;
finish:
	if (bol_error_state) {
		bol_error_state = false;

		char *_str_response1 = str_response;
		char *_str_response2 = DB_get_diagnostic(client->conn, res);
		char str_len[51] = { 0 };
		snprintf(str_len, 50, "%zu", strlen(_str_response1) + strlen(_str_response2) + 2);
		char *str_temp =
			"HTTP/1.1 500 Internal Server Error\015\012"
			"Server: " SUN_PROGRAM_LOWER_NAME "\015\012"
			"Connection: close\015\012"
			"Content-Length: ";
		SFINISH_SNCAT(
			str_response, &int_response_len,
			str_temp, strlen(str_temp),
			str_len, strlen(str_len),
			"\015\012\015\012", (size_t)4,
			_str_response1, strlen(_str_response1),
			":\n", (size_t)2,
			_str_response2, strlen(_str_response2)
		);
		SFREE(_str_response1);
		SFREE(_str_response2);
		DB_free_result(res);
	}
	ssize_t int_client_write_len = 0;
	if (str_response != NULL) {
		int_client_write_len = client_write(client, str_response, int_response_len);
		SDEBUG("int_client_write_len: %d", int_client_write_len);
		if (int_client_write_len < 0) {
			SERROR_NORESPONSE("client_write() failed");
		}
	}
	SFREE(str_response);
	if (int_client_write_len != 0) {
		ws_select_free(client_select);
		ev_io_stop(EV_A, &client->io);
		SFREE(client->str_request);
		SERROR_CHECK_NORESPONSE(client_close(client), "Error closing Client");
	}
	SFREE_ALL();
	return true;
}

void http_select_step4(EV_P, ev_check *w, int revents) {
	if (revents != 0) {
	} // get rid of unused parameter warning
	struct sock_ev_client_copy_check *client_copy_check = (struct sock_ev_client_copy_check *)w;
	struct sock_ev_client_request *client_request = client_copy_check->client_request;
	struct sock_ev_client_select *client_select = (struct sock_ev_client_select *)(client_request->client_request_data);
	DArray *arr_row_values = NULL;
	DArray *arr_row_lengths = NULL;
	SDEFINE_VAR_ALL(str_rows, str_one_column);
	char *str_type = NULL;
	char *str_response = NULL;
	size_t i = 0, int_len = 0, int_row = 0;
	struct sock_ev_client_copy_io *client_copy_io = NULL;
	size_t int_rows_len = 0;
	size_t int_one_column_len = 0;
	size_t int_response_len = 0;

	SFINISH_SNCAT(str_rows, &int_rows_len,
		"", (size_t)0);
	DB_fetch_status status;
	while (int_row < 10 && (status = DB_fetch_row(client_copy_check->res)) != DB_FETCH_END) {
		// SDEBUG(
		//	"status: %s", status == DB_FETCH_OK ? "DB_FETCH_OK" : status == DB_FETCH_END
		//															  ? "DB_FETCH_END"
		//															  : status == DB_FETCH_ERROR ? "DB_FETCH_ERROR" : "unknown");
		SFINISH_CHECK(status != DB_FETCH_ERROR, "DB_fetch_row failed");

		arr_row_values = DB_get_row_values(client_copy_check->res);
		SFINISH_CHECK(arr_row_values != NULL, "DB_get_row_values failed");
		arr_row_lengths = DB_get_row_lengths(client_copy_check->res);
		SFINISH_CHECK(arr_row_lengths != NULL, "DB_get_row_lengths failed");
		int_len = DArray_end(arr_row_values);

		if (client_select->str_row_count == NULL) {
			SFINISH_SNCAT(client_select->str_row_count, &client_select->int_row_count_len,
				DArray_get(arr_row_values, 0), strlen(DArray_get(arr_row_values, 0)));
		}

		SFINISH_SNFCAT(str_rows, &int_rows_len,
			"[", (size_t)1);
		for (i = 1; i < int_len; i += 1) {
			ssize_t int_current_len = *(ssize_t *)DArray_get(arr_row_lengths, i);
			str_type = DArray_get(client_select->darr_column_types, i);
			// Get column value and escape it
			if (int_current_len == -1) {
				SFINISH_SNCAT(str_one_column, &int_one_column_len,
					"null", (size_t)4);
			} else if (strncmp(str_type, "smallint", 8) == 0 || strncmp(str_type, "integer", 7) == 0 ||
					   (strncmp(str_type, "int", 3) == 0 && strncmp(str_type, "interval", 8) != 0) ||
					   strncmp(str_type, "bigint", 6) == 0 || strncmp(str_type, "smallserial", 11) == 0 ||
					   strncmp(str_type, "int2", 4) == 0 || strncmp(str_type, "serial", 6) == 0 ||
					   strncmp(str_type, "int4", 4) == 0 || strncmp(str_type, "bigserial", 9) == 0 ||
					   strncmp(str_type, "int8", 4) == 0) {
				int_one_column_len = (size_t)int_current_len;
				str_one_column = bescape_value(DArray_get(arr_row_values, i), &int_one_column_len);
				SFINISH_CHECK(str_one_column != NULL, "bescape_value failed");
			} else {
				// SDEBUG("DArray_get(arr_row_values, i): %s", DArray_get(arr_row_values, i));
				int_one_column_len = (size_t)int_current_len;
				str_one_column = jsonify(DArray_get(arr_row_values, i), &int_one_column_len);
				// SDEBUG("str_one_column: %s", str_one_column);
				SFINISH_CHECK(str_one_column != NULL, "jsonify failed");
			}
			// Add it to the response
			SFINISH_SNFCAT(str_rows, &int_rows_len,
				str_one_column, int_one_column_len,
				i < (int_len - 1) ? "," : "", strlen(i < (int_len - 1) ? "," : ""));

			SFREE(str_one_column);
		}

		SFINISH_SNFCAT(str_rows, &int_rows_len,
			"],", (size_t)2);
		// SDEBUG("str_rows: %s", str_rows);
		int_row++;

		DArray_clear_destroy(arr_row_values);
		arr_row_values = NULL;
		DArray_clear_destroy(arr_row_lengths);
		arr_row_lengths = NULL;
	}

	SFINISH_SNFCAT(client_copy_check->str_response, (size_t*)&client_copy_check->int_response_len,
		str_rows, int_rows_len);
	SFREE(str_rows);

	if (status == DB_FETCH_END && client_copy_check->str_response[0] != '\0' &&
		client_copy_check->str_response[client_copy_check->int_response_len - 1] == ',') {
		client_copy_check->str_response[client_copy_check->int_response_len - 1] = '\0';
		client_copy_check->int_response_len -= 1;
	}

	if (status == DB_FETCH_END) {
		if (client_select->str_row_count == NULL) {
			SFINISH_SNCAT(client_select->str_row_count, &client_select->int_row_count_len,
				"0", (size_t)1);
		}
		SFINISH_SNFCAT(client_copy_check->str_response, (size_t*)&client_copy_check->int_response_len,
			"], \"row_count\": ", (size_t)16,
			client_select->str_row_count, client_select->int_row_count_len,
			"}}", (size_t)2);

		SFINISH_SALLOC(client_copy_io, sizeof(struct sock_ev_client_copy_io));

		ev_check_stop(EV_A, w);
		decrement_idle(EV_A);
		ev_io_init(&client_copy_io->io, http_select_step5, GET_CLIENT_SOCKET(client_request->parent), EV_WRITE);
		ev_io_start(EV_A, &client_copy_io->io);

		client_copy_io->client_copy_check = client_copy_check;
		client_request->parent->client_copy_io = client_copy_io;

		DB_free_result(client_copy_check->res);
	}

	bol_error_state = false;
finish:
	if (arr_row_values != NULL) {
		DArray_clear_destroy(arr_row_values);
		arr_row_values = NULL;
	}
	if (arr_row_lengths != NULL) {
		DArray_clear_destroy(arr_row_lengths);
		arr_row_lengths = NULL;
	}
	if (bol_error_state) {
		bol_error_state = false;

		char *_str_response1 = str_response;
		char *_str_response2 = DB_get_diagnostic(client_request->parent->conn, client_copy_check->res);
		char str_len[51] = { 0 };
		snprintf(str_len, 50, "%zu", strlen(_str_response1) + strlen(_str_response2) + 2);
		char *str_temp =
			"HTTP/1.1 500 Internal Server Error\015\012"
			"Server: " SUN_PROGRAM_LOWER_NAME "\015\012"
			"Connection: close\015\012"
			"Content-Length: ";
		SFINISH_SNCAT(
			str_response, &int_response_len,
			str_temp, strlen(str_temp),
			str_len, strlen(str_len),
			"\015\012\015\012", (size_t)4,
			_str_response1, strlen(_str_response1),
			":\n", (size_t)2,
			_str_response2, strlen(_str_response2)
		);
		SFREE(_str_response1);
		SFREE(_str_response2);
		DB_free_result(client_copy_check->res);
		if (client_copy_check != NULL) {
			ev_check_stop(EV_A, w);
			decrement_idle(EV_A);
			SFREE(client_copy_check->str_response);
			SFREE(client_copy_check);
			SFREE(client_copy_io);
			client_request->parent->client_copy_check = NULL;
			client_request->parent->client_copy_io = NULL;

		}
	}
	ssize_t int_client_write_len = 0;
	if (str_response != NULL) {
		int_client_write_len = client_write(client_request->parent, str_response, int_response_len);
		SDEBUG("int_client_write_len: %d", int_client_write_len);
		if (int_client_write_len < 0) {
			SERROR_NORESPONSE("client_write() failed");
		}
	}
	SFREE(str_response);
	if (int_client_write_len != 0) {
		ws_select_free(client_select);
		ev_io_stop(EV_A, &client_request->parent->io);
		SFREE(client_request->parent->str_request);
		SERROR_CHECK_NORESPONSE(client_close(client_request->parent), "Error closing Client");
	}
	SFREE_ALL();
}

void http_select_step5(EV_P, ev_io *w, int revents) {
	if (revents != 0) {
	} // get rid of unused parameter warning
	struct sock_ev_client_copy_io *client_copy_io = (struct sock_ev_client_copy_io *)w;
	struct sock_ev_client_copy_check *client_copy_check = client_copy_io->client_copy_check;
	struct sock_ev_client_request *client_request = client_copy_check->client_request;
	struct sock_ev_client_select *client_select = (struct sock_ev_client_select *)(client_request->client_request_data);
	char *str_response = NULL;
	size_t int_response_len = 0;

	// SDEBUG("client_copy_check->str_response: %s", client_copy_check->str_response);

	ssize_t int_client_write_len =
		client_write(client_request->parent, client_copy_check->str_response + client_copy_check->int_written,
			(size_t)(client_copy_check->int_response_len - client_copy_check->int_written));

	SDEBUG("write(%i, %p, %i): %z", client_request->parent->int_sock,
		client_copy_check->str_response + client_copy_check->int_written,
		client_copy_check->int_response_len - client_copy_check->int_written, int_client_write_len);

	if (int_client_write_len == SOCK_WANT_READ) {
		ev_io_stop(EV_A, w);
		ev_io_set(w, GET_CLIENT_SOCKET(client_request->parent), EV_READ);
		ev_io_start(EV_A, w);
		bol_error_state = false;
		errno = 0;
		return;

	} else if (int_client_write_len == SOCK_WANT_WRITE) {
		ev_io_stop(EV_A, w);
		ev_io_set(w, GET_CLIENT_SOCKET(client_request->parent), EV_WRITE);
		ev_io_start(EV_A, w);
		bol_error_state = false;
		errno = 0;
		return;

	} else if (int_client_write_len < 0 && errno != EAGAIN) {
		SFINISH("client_write(%i, %p, %i) failed: %i", client_request->parent->int_sock,
			client_copy_check->str_response + client_copy_check->int_written,
			client_copy_check->int_response_len - client_copy_check->int_written, int_client_write_len);
	} else {
		// int_response_len can't be negative at this point
		client_copy_check->int_written += int_client_write_len;
	}

	if (client_copy_check->int_written == client_copy_check->int_response_len) {
		ev_io_stop(EV_A, w);

		SFREE(client_copy_check->str_response);
		SFREE(client_copy_check);
		SFREE(client_copy_io);
		client_request->parent->client_copy_check = NULL;
		client_request->parent->client_copy_io = NULL;

		SDEBUG("DONE");
		struct sock_ev_client *client = client_request->parent;
		SFINISH_CLIENT_CLOSE(client);
		client_request = NULL;
	}

	// If this line is not here, we close the client below
	// then libev calls a function on the socket and crashes and burns on windows
	// so... don't touch
	int_response_len = 0;

	bol_error_state = false;
finish:
	if (bol_error_state) {
		if (client_copy_check != NULL) {
			ev_io_stop(EV_A, w);
			SFREE(client_copy_check->str_response);
			SFREE(client_copy_check);
			SFREE(client_copy_io);
			client_request->parent->client_copy_check = NULL;
			client_request->parent->client_copy_io = NULL;
		}
		bol_error_state = false;

		char *_str_response = str_response;
		char str_len[51] = { 0 };
		snprintf(str_len, 50, "%zu", strlen(_str_response));
		char *str_temp =
			"HTTP/1.1 500 Internal Server Error\015\012"
			"Server: " SUN_PROGRAM_LOWER_NAME "\015\012"
			"Connection: close\015\012"
			"Content-Length: ";
		SFINISH_SNCAT(
			str_response, &int_response_len,
			str_temp, strlen(str_temp),
			str_len, strlen(str_len),
			"\015\012\015\012", (size_t)4,
			_str_response, strlen(_str_response)
		);
		SFREE(_str_response);

		int_client_write_len = client_write(client_request->parent, str_response, int_response_len);
		SDEBUG("int_client_write_len: %d", int_client_write_len);
		if (int_client_write_len < 0) {
			SERROR_NORESPONSE("client_write() failed");
		}
		SFREE(str_response);

		ws_select_free(client_select);
		ev_io_stop(EV_A, &client_request->parent->io);
		SFREE(client_request->parent->str_request);
		SDEBUG("ERROR");
		SERROR_CHECK_NORESPONSE(client_close(client_request->parent), "Error closing Client");
	}
}
