#ifdef ENVELOPE

#include "http_update.h"

void http_update_step1(struct sock_ev_client *client) {
	struct sock_ev_client_update *client_update = NULL;
	SDEFINE_VAR_ALL(str_action_name, str_temp, str_args, str_sql, str_loop, str_col_ident, str_one_col, str_one_val);
	char *str_response = NULL;
	char *ptr_loop = NULL;
	char *ptr_end = NULL;
	size_t int_count = 0;
	size_t int_query_length = 0;
	size_t int_where_length = 0;

	client->cur_request =
		create_request(client, NULL, NULL, NULL, NULL, sizeof(struct sock_ev_client_update), POSTAGE_REQ_UPDATE);
	SFINISH_CHECK(client->cur_request != NULL, "create_request failed!");
	client_update = (struct sock_ev_client_update *)(client->cur_request->vod_request_data);

	str_args = query(client->str_request, client->int_request_len, &int_query_length);
	SFINISH_CHECK(str_args != NULL, "query() failed");

	SDEBUG("str_args: %s", str_args);

	client_update->str_columns = getpar(str_args, "cols", int_query_length, &client_update->int_columns_length);
	if (client_update->str_columns == NULL || client_update->int_columns_length == 0) {
		SFREE(client_update->str_columns);
		SFINISH_CAT_CSTR(client_update->str_columns, "*");
	}

	SDEBUG("client_update->str_columns: %s", client_update->str_columns);

	client_update->str_real_table_name = getpar(str_args, "src", int_query_length, &client_update->int_real_table_name_length);
	if (client_update->str_real_table_name == NULL || client_update->int_real_table_name_length == 0) {
		SFREE(client_update->str_real_table_name);
		client_update->str_real_table_name =
			getpar(str_args, "view", int_query_length, &client_update->int_real_table_name_length);
	}
	SFINISH_ERROR_CHECK(client_update->str_real_table_name != NULL && client_update->int_real_table_name_length != 0,
		"Failed to get table name from query");

	client_update->str_col = getpar(str_args, "column", int_query_length, &client_update->int_col_length);
	SFINISH_ERROR_CHECK(client_update->str_col != NULL, "getpar failed");

	client_update->str_value = getpar(str_args, "value", int_query_length, &client_update->int_value_length);
	SFINISH_ERROR_CHECK(client_update->str_value != NULL, "getpar failed");

	str_col_ident = DB_escape_identifier(client->conn, client_update->str_col, client_update->int_col_length);
	SFINISH_ERROR_CHECK(str_col_ident != NULL, "DB_escape_identifier failed");

	SFINISH_CAT_CSTR(client_update->str_type_sql, "SELECT ", str_col_ident);
	SFREE(str_col_ident);

	str_loop = getpar(str_args, "where", int_query_length, &int_where_length);
	SFINISH_CHECK(str_loop != NULL, "where parameter required");
	ptr_loop = str_loop;
	client_update->darr_where_column = DArray_create(sizeof(char *), 1);
	client_update->darr_where_value = DArray_create(sizeof(char *), 1);
	client_update->int_update_columns = 0;
	while ((size_t)(ptr_loop - str_loop) < int_where_length) {
		// get keys
		ptr_end = strstr(ptr_loop, "=");
		SFINISH_CHECK(ptr_end != NULL, "Badly formed where string. Should be URI encoded 'key=value&key=value'.");

		// get col name
		int_count = (size_t)(ptr_end - ptr_loop);
		SFINISH_SALLOC(str_one_col, int_count + 1);
		memcpy(str_one_col, ptr_loop, int_count);
		ptr_loop = ptr_loop + int_count + 1;
		str_one_col[int_count] = 0;
		// decode if necessary
		ptr_end = strstr(str_one_col, "%");
		if (ptr_end != NULL) {
			str_temp = str_one_col;
			str_one_col = uri_to_cstr(str_one_col, &int_count);
			SFINISH_CHECK(str_one_col != NULL, "uri_to_cstr failed");
			SFREE(str_temp);
		}

		str_col_ident = DB_escape_identifier(client->conn, str_one_col, strlen(str_one_col));
		SFINISH_ERROR_CHECK(str_col_ident != NULL, "DB_escape_identifier failed");

		SFINISH_CAT_APPEND(client_update->str_type_sql, ", ", str_col_ident);
		SFREE(str_col_ident);
		client_update->int_update_columns += 1;

		SDEBUG("str_one_col: %s", str_one_col);
		DArray_push(client_update->darr_where_column, str_one_col);
		str_one_col = NULL;

		// get vals
		ptr_end = strstr(ptr_loop, "&");
		int_count = (ptr_end == NULL) ? strlen(ptr_loop) : (size_t)(ptr_end - ptr_loop);
		SFINISH_SALLOC(str_one_val, int_count + 1);
		memcpy(str_one_val, ptr_loop, int_count);
		ptr_loop = ptr_loop + int_count + ((ptr_end == 0) ? 0 : 1);
		str_one_val[int_count] = 0;

		// decode if necessary
		ptr_end = strstr(str_one_val, "%");
		if (ptr_end != NULL) {
			str_temp = str_one_val;
			str_one_val = uri_to_cstr(str_one_val, &int_count);
			SFINISH_CHECK(str_one_val != NULL, "uri_to_cstr failed");
			SFREE(str_temp);
		}

		SDEBUG("str_one_val: %s", str_one_val);
		DArray_push(client_update->darr_where_value, str_one_val);
		str_one_val = NULL;
	}

	SFINISH_CAT_APPEND(
		client_update->str_type_sql, ", ", client_update->str_columns, " FROM ", client_update->str_real_table_name);
	SDEBUG("client_update->str_type_sql: %s", client_update->str_type_sql);

	SFINISH_CHECK(
		DB_get_column_types_for_query(global_loop, client->conn, client_update->str_type_sql, client, http_update_step2),
		"DB_get_column_types_for_query failed");

	bol_error_state = false;
finish:
	SFREE_ALL();
	ssize_t int_response_len = 0;
	if (str_response != NULL && (int_response_len = CLIENT_WRITE(client, str_response, strlen(str_response))) < 0) {
		SFREE(str_response);
		if (bol_tls) {
			SERROR_NORESPONSE_LIBTLS_CONTEXT(client->tls_postage_io_context, "tls_write() failed");
		} else {
			SERROR_NORESPONSE("write() failed");
		}
	}
	SFREE(str_response);
	if (int_response_len != 0) {
		ws_update_free(client_update);
		ev_io_stop(global_loop, &client->io);
		SFREE(client->str_request);
		SERROR_CHECK_NORESPONSE(client_close(client), "Error closing Client");
	}
}

bool http_update_step2(EV_P, void *cb_data, DB_result *res) {
	struct sock_ev_client *client = cb_data;
	struct sock_ev_client_update *client_update = (struct sock_ev_client_update *)(client->cur_request->vod_request_data);
	char *str_response = NULL;
	char *_str_response = NULL;
	size_t int_i = 0, int_len = 0;
	DArray *darr_column_names = NULL;
	DArray *darr_column_types = NULL;
	bool bol_first_where = true;
	bool bol_first_u_where = true;
	SDEFINE_VAR_ALL(str_one_val_literal, str_col);

	// DO NOT FREE (these are obtained from arrays that are going to be cleared/destroyed)
	char *str_one_col = NULL;
	char *str_one_val = NULL;
	char *str_data_type = NULL;

	SFINISH_CHECK(res != NULL, "DB_get_column_types_for_query failed!");
	SFINISH_CHECK(res->status == DB_RES_TUPLES_OK, "Query failed");

	SFINISH_CHECK(DB_fetch_row(res) == DB_FETCH_OK, "DB_fetch_row failed");
	darr_column_names = DB_get_column_names(res);
	SFINISH_CHECK(darr_column_names != NULL, "DB_get_column_names failed");
	darr_column_types = DB_get_row_values(res);
	SFINISH_CHECK(darr_column_types != NULL, "DB_get_row_values failed");

	SFINISH_CAT_CSTR(client_update->str_col_data_type, DArray_get(darr_column_types, 0));

	int_len = DArray_count(darr_column_names);
	SDEBUG("client_update->str_columns: %s", client_update->str_columns);
	SFREE(client_update->str_columns);
	SFINISH_CAT_CSTR(client_update->str_columns, "");
	for (int_i = client_update->int_update_columns + 1; int_i < int_len; int_i += 1) {
		str_data_type = DArray_get(darr_column_types, int_i);
		if (strchr(str_data_type, ' ') != NULL) {
			*(strchr(str_data_type, ' ')) = 0;
		}
		str_col = DB_escape_identifier(
			client->conn, DArray_get(darr_column_names, int_i), strlen(DArray_get(darr_column_names, int_i)));
		SFINISH_CHECK(str_col != NULL, "DB_escape_literal failed");

		if (DB_connection_driver(client->conn) == DB_DRIVER_POSTGRES) {
			SFINISH_CAT_APPEND(
				client_update->str_columns, int_i == (client_update->int_update_columns + 1) ? "" : ", ", str_col, "::varchar");
		} else {
			SFINISH_CAT_APPEND(client_update->str_columns, int_i == (client_update->int_update_columns + 1) ? "" : ", ", "CAST(",
				str_col, " AS nvarchar(MAX))");
		}
		SDEBUG("client_update->str_columns: %s", client_update->str_columns);
		SFREE(str_col);
	}
	SDEBUG("client_update->str_columns: %s", client_update->str_columns);

	SFINISH_CAT_CSTR(client_update->str_where, "");
	SFINISH_CAT_CSTR(client_update->str_u_where, "");
	for (int_i = 0; int_i < client_update->int_update_columns; int_i += 1) {
		str_data_type = DArray_get(darr_column_types, int_i + 1);
		if (strchr(str_data_type, ' ') != NULL) {
			*(strchr(str_data_type, ' ')) = 0;
		}
		str_one_col = DArray_get(client_update->darr_where_column, int_i);
		str_one_val = DArray_get(client_update->darr_where_value, int_i);

		if (bol_first_u_where) {
			bol_first_u_where = false;
		} else {
			SFINISH_CAT_APPEND(client_update->str_u_where, " AND ");
		}
		if (DB_connection_driver(client->conn) == DB_DRIVER_POSTGRES) {
			SFINISH_CAT_APPEND(client_update->str_u_where, str_one_col, " IS NOT DISTINCT FROM ");
		} else {
			SFINISH_CAT_APPEND(client_update->str_u_where, str_one_col, " = ");
		}

		if (strlen(str_one_col) != 14 && strncmp(str_one_col, "change_stamp", 12) != 0) {
			if (bol_first_where) {
				bol_first_where = false;
			} else {
				SFINISH_CAT_APPEND(client_update->str_where, " AND ");
			}
			if (DB_connection_driver(client->conn) == DB_DRIVER_POSTGRES) {
				SFINISH_CAT_APPEND(client_update->str_where, str_one_col, " IS NOT DISTINCT FROM ");
			} else {
				SFINISH_CAT_APPEND(client_update->str_where, str_one_col, " = ");
			}
		}

		if (strncmp(str_one_val, "NULL", 4) == 0) {
			if (DB_connection_driver(client->conn) == DB_DRIVER_POSTGRES) {
				SFINISH_CAT_APPEND(client_update->str_u_where, "NULL::", str_data_type);
			} else {
				SFINISH_CAT_APPEND(client_update->str_u_where, "CAST(NULL AS ", str_data_type, ")");
			}
			if (strlen(str_one_col) != 14 && strncmp(str_one_col, "change_stamp", 12) != 0) {
				if (DB_connection_driver(client->conn) == DB_DRIVER_POSTGRES) {
					SFINISH_CAT_APPEND(client_update->str_where, "NULL::", str_data_type);
				} else {
					SFINISH_CAT_APPEND(client_update->str_where, "CAST(NULL AS ", str_data_type, ")");
				}
			}
		} else {
			str_one_val_literal = DB_escape_literal(client->conn, str_one_val, strlen(str_one_val));
			if (DB_connection_driver(client->conn) == DB_DRIVER_POSTGRES) {
				SFINISH_CAT_APPEND(client_update->str_u_where, str_one_val_literal, "::", str_data_type);
			} else {
				SFINISH_CAT_APPEND(client_update->str_u_where, "CAST(", str_one_val_literal, " AS ", str_data_type, ")");
			}
			if (strlen(str_one_col) != 14 && strncmp(str_one_col, "change_stamp", 12) != 0) {
				if (DB_connection_driver(client->conn) == DB_DRIVER_POSTGRES) {
					SFINISH_CAT_APPEND(client_update->str_where, str_one_val_literal, "::", str_data_type);
				} else {
					SFINISH_CAT_APPEND(client_update->str_where, "CAST(", str_one_val_literal, " AS ", str_data_type, ")");
				}
			}
			SFREE(str_one_val_literal);
		}
		str_data_type = NULL;
		str_one_col = NULL;
		str_one_val = NULL;
	}

	SDEBUG("client_update->str_where: %s", client_update->str_where);
	SDEBUG("client_update->str_u_where: %s", client_update->str_u_where);

	if (DB_connection_driver(client->conn) == DB_DRIVER_POSTGRES) {
		SFINISH_CAT_CSTR(client_update->str_sql, "SELECT count(*) FROM ", client_update->str_real_table_name, " WHERE ",
			client_update->str_u_where, ";");
	} else {
		SFINISH_CAT_CSTR(client_update->str_sql, "SELECT CAST(count(*) AS nvarchar(MAX)) FROM ",
			client_update->str_real_table_name, " WHERE ", client_update->str_u_where, ";");
	}
	SFINISH_CHECK(DB_exec(EV_A, client->conn, client, client_update->str_sql, http_update_step3), "DB_exec failed");

	DB_free_result(res);

	bol_error_state = false;
finish:
	SFREE_ALL();
	if (darr_column_names != NULL) {
		DArray_clear_destroy(darr_column_names);
	}
	if (darr_column_types != NULL) {
		DArray_clear_destroy(darr_column_types);
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
	ssize_t int_response_len = 0;
	if (str_response != NULL && (int_response_len = CLIENT_WRITE(client, str_response, strlen(str_response))) < 0) {
		SFREE(str_response);
		if (bol_tls) {
			SERROR_NORESPONSE_LIBTLS_CONTEXT(client->tls_postage_io_context, "tls_write() failed");
		} else {
			SERROR_NORESPONSE("write() failed");
		}
	}
	SFREE(str_response);
	DB_free_result(res);
	if (int_response_len != 0) {
		ws_update_free(client_update);
		ev_io_stop(EV_A, &client->io);
		SFREE(client->str_request);
		SERROR_CHECK_NORESPONSE(client_close(client), "Error closing Client");
	}
	return true;
}

bool http_update_step3(EV_P, void *cb_data, DB_result *res) {
	struct sock_ev_client *client = cb_data;
	struct sock_ev_client_update *client_update = (struct sock_ev_client_update *)(client->cur_request->vod_request_data);
	char *str_response = NULL;
	char *_str_response = NULL;
	DArray *darr_count = NULL;
	SDEFINE_VAR_ALL(str_value_literal);

	SFINISH_CHECK(res != NULL, "DB_get_column_types_for_query failed!");
	SFINISH_CHECK(res->status == DB_RES_TUPLES_OK, "Query failed");

	SFINISH_CHECK(DB_fetch_row(res) == DB_FETCH_OK, "DB_fetch_row failed");
	darr_count = DB_get_row_values(res);
	SFINISH_CHECK(darr_count != NULL, "DB_get_row_values failed");

	SFINISH_CHECK(strncmp(darr_count->contents[0], "0", 2) != 0, "Someone updated this record before you.");

	if (strncmp(client_update->str_value, "NULL", 5) == 0) {
		SFINISH_CAT_CSTR(str_value_literal, "NULL");
	} else {
		str_value_literal = DB_escape_literal(client->conn, client_update->str_value, strlen(client_update->str_value));
		SFINISH_CHECK(str_value_literal != NULL, "DB_escape_literal failed");
	}
	SFREE(client_update->str_sql);
	if (DB_connection_driver(client->conn) == DB_DRIVER_POSTGRES) {
		SFINISH_CAT_CSTR(client_update->str_sql, "UPDATE ", client_update->str_real_table_name, " SET ", client_update->str_col,
			"=", str_value_literal, "::", client_update->str_col_data_type, " WHERE ", client_update->str_u_where, ";");
	} else {
		SFINISH_CAT_CSTR(client_update->str_sql, "UPDATE ", client_update->str_real_table_name, " SET ", client_update->str_col,
			"=CAST(", str_value_literal, " AS ", client_update->str_col_data_type, ")", " WHERE ", client_update->str_u_where,
			";");
	}
	SDEBUG("client_update->str_sql: %s", client_update->str_sql);
	SFINISH_CHECK(DB_exec(EV_A, client->conn, client, client_update->str_sql, http_update_step4), "DB_exec failed");

	DB_free_result(res);

	bol_error_state = false;
finish:
	SFREE_ALL();
	if (darr_count != NULL) {
		DArray_clear_destroy(darr_count);
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
	ssize_t int_response_len = 0;
	if (str_response != NULL && (int_response_len = CLIENT_WRITE(client, str_response, strlen(str_response))) < 0) {
		SFREE(str_response);
		if (bol_tls) {
			SERROR_NORESPONSE_LIBTLS_CONTEXT(client->tls_postage_io_context, "tls_write() failed");
		} else {
			SERROR_NORESPONSE("write() failed");
		}
	}
	SFREE(str_response);
	DB_free_result(res);
	if (int_response_len != 0) {
		ws_update_free(client_update);
		ev_io_stop(EV_A, &client->io);
		SFREE(client->str_request);
		SERROR_CHECK_NORESPONSE(client_close(client), "Error closing Client");
	}
	return true;
}

bool http_update_step4(EV_P, void *cb_data, DB_result *res) {
	struct sock_ev_client *client = cb_data;
	struct sock_ev_client_update *client_update = (struct sock_ev_client_update *)(client->cur_request->vod_request_data);
	char *str_response = NULL;
	char *_str_response = NULL;
	SDEFINE_VAR_ALL(str_value_literal);

	SFINISH_CHECK(res != NULL, "DB_get_column_types_for_query failed!");
	SFINISH_CHECK(res->status == DB_RES_COMMAND_OK, "Query failed");

	SFREE(client_update->str_sql);
	SFINISH_CAT_CSTR(client_update->str_sql, "SELECT ", client_update->str_columns, " FROM ", client_update->str_real_table_name,
		" WHERE ", client_update->str_where, ";");

	SDEBUG("client_update->str_sql: %s", client_update->str_sql);
	SFINISH_CHECK(DB_exec(EV_A, client->conn, client, client_update->str_sql, http_update_step5), "DB_exec failed");

	DB_free_result(res);

	bol_error_state = false;
finish:
	SFREE_ALL();
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
	ssize_t int_response_len = 0;
	if (str_response != NULL && (int_response_len = CLIENT_WRITE(client, str_response, strlen(str_response))) < 0) {
		SFREE(str_response);
		if (bol_tls) {
			SERROR_NORESPONSE_LIBTLS_CONTEXT(client->tls_postage_io_context, "tls_write() failed");
		} else {
			SERROR_NORESPONSE("write() failed");
		}
	}
	SFREE(str_response);
	DB_free_result(res);
	if (int_response_len != 0) {
		ws_update_free(client_update);
		ev_io_stop(EV_A, &client->io);
		SFREE(client->str_request);
		SERROR_CHECK_NORESPONSE(client_close(client), "Error closing Client");
	}
	return true;
}

bool http_update_step5(EV_P, void *cb_data, DB_result *res) {
	struct sock_ev_client *client = cb_data;
	struct sock_ev_client_update *client_update = (struct sock_ev_client_update *)(client->cur_request->vod_request_data);
	char *str_response = NULL;
	char *_str_response = NULL;
	size_t y = 0;
	size_t maxy = 0;
	DArray *darr_data = NULL;
	DArray *darr_data_length = NULL;
	SDEFINE_VAR_ALL(str_data, str_temp);

	SFINISH_CHECK(res != NULL, "DB_get_column_types_for_query failed!");
	SFINISH_CHECK(res->status == DB_RES_TUPLES_OK, "Query failed");

	SFINISH_CHECK(DB_fetch_row(res) == DB_FETCH_OK, "DB_fetch_row failed");
	darr_data = DB_get_row_values(res);
	SFINISH_CHECK(darr_data != NULL, "DB_get_row_values failed");
	darr_data_length = DB_get_row_lengths(res);
	maxy = DArray_end(darr_data);

	SFINISH_CAT_CSTR(str_data, "[");
	for (y = 0; y < maxy; y++) {
		if ((*(int *)DArray_get(darr_data_length, y)) == -1) {
			SFINISH_CAT_APPEND(str_data, (y == 0 ? "" : ","), "null");
		} else {
			str_temp = jsonify(DArray_get(darr_data, y));
			SFINISH_CHECK(str_temp != NULL, "jsonify failed");
			SFINISH_CAT_APPEND(str_data, (y == 0 ? "" : ","), str_temp);
			SFREE(str_temp);
		}
	}
	SFINISH_CAT_APPEND(str_data, "]");

	SFINISH_CAT_CSTR(str_response, "HTTP/1.1 200 OK\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n",
		"{\"stat\": true, \"dat\": ", str_data, "}");
	SFREE(str_data);

	DB_free_result(res);

	bol_error_state = false;
finish:
	SFREE_ALL();
	if (darr_data != NULL) {
		DArray_clear_destroy(darr_data);
	}
	if (darr_data_length != NULL) {
		DArray_clear_destroy(darr_data_length);
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
	ssize_t int_response_len = 0;
	if (str_response != NULL && (int_response_len = CLIENT_WRITE(client, str_response, strlen(str_response))) < 0) {
		SFREE(str_response);
		if (bol_tls) {
			SERROR_NORESPONSE_LIBTLS_CONTEXT(client->tls_postage_io_context, "tls_write() failed");
		} else {
			SERROR_NORESPONSE("write() failed");
		}
	}
	SFREE(str_response);
	DB_free_result(res);
	if (int_response_len != 0) {
		ws_update_free(client_update);
		ev_io_stop(EV_A, &client->io);
		SFREE(client->str_request);
		SERROR_CHECK_NORESPONSE(client_close(client), "Error closing Client");
	}
	return true;
}

#endif
