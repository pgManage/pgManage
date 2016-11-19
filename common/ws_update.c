#include "ws_update.h"

char *ws_update_step1(struct sock_ev_client_request *client_request) {
	struct sock_ev_client_update *client_update = (struct sock_ev_client_update *)(client_request->vod_request_data);
	// DEBUG("UPDATE BEGIN");
	SDEFINE_VAR_ALL(str_col_name, str_sql, str_temp);
	char *str_response = NULL;
	char *str_temp1 = NULL;
	char *str_where_temp = NULL;
	size_t int_length;

	client_request->arr_response = DArray_create(sizeof(char *), 1);

	char *ptr_pk_header = NULL;
	char *ptr_name_header = NULL;
	char *ptr_pk_header_end = NULL;
	char *ptr_name_header_end = NULL;

	if (DB_connection_driver(client_request->parent->conn) == DB_DRIVER_POSTGRES) {
		SFINISH_CAT_CSTR(client_update->str_temp_table_name, "temp_update");
	} else {
		SFINISH_CAT_CSTR(client_update->str_temp_table_name, "#temp_update");
	}

	// Get table names and return columns
	SFINISH_CHECK((client_update->str_real_table_name = get_table_name(client_request->ptr_query)) != NULL,
		"Failed to get table name from query");
	// DEBUG("client_update->str_real_table_name: %s",
	// client_update->str_real_table_name);

	SFINISH_CHECK((client_update->str_return_columns =
						  get_return_columns(client_request->ptr_query, client_update->str_real_table_name)) != NULL,
		"Failed to get return columns from query");

#ifndef POSTAGE_INTERFACE_LIBPQ
	SFINISH_ERROR_CHECK((client_update->str_return_escaped_columns = get_return_escaped_columns(
							 DB_connection_driver(client_request->parent->conn), client_request->ptr_query)) != NULL,
		"Failed to get escaped return columns from query");
#endif

	client_update->str_hash_where_clause = get_hash_columns(client_request->ptr_query);
	SFREE(str_global_error);

	if (client_update->str_hash_where_clause != NULL) {
		SFINISH_REPLACE(client_update->str_hash_where_clause, "\"", "\"\"", "g");
		if (DB_connection_driver(client_request->parent->conn) == DB_DRIVER_POSTGRES) {
			SFINISH_REPLACE(client_update->str_hash_where_clause, "\t", "\"::text, '') || '\t' || COALESCE(\"", "g");
			SFINISH_CAT_CSTR(str_where_temp, client_update->str_temp_table_name, "_hash = MD5(COALESCE(\"",
				client_update->str_hash_where_clause, "\"::text, ''))");
		} else {
			SFINISH_REPLACE(client_update->str_hash_where_clause, "\t",
				"\" AS nvarchar(MAX)), CAST('' AS nvarchar(MAX))) + CAST('\t' AS nvarchar(MAX)) + COALESCE(CAST(\"", "g");
			SFINISH_CAT_CSTR(str_where_temp, client_update->str_temp_table_name,
				"_hash = LOWER(CONVERT(nvarchar(MAX), HashBytes('MD5', COALESCE(CAST(\"", client_update->str_hash_where_clause,
				"\" AS nvarchar(MAX)), CAST('' AS nvarchar(MAX)))), 2))");
		}
		SFREE(client_update->str_hash_where_clause);
		client_update->str_hash_where_clause = str_where_temp;
		str_where_temp = NULL;
	}

	SDEBUG("client_update->str_hash_where_clause: %s", client_update->str_hash_where_clause);

	////GET POINTERS SET TO BEGINNING OF HEADERS
	char *_____str_temp = "HASH";
	client_update->ptr_query = strstr(client_request->ptr_query, "HASH");
	if (client_update->ptr_query == NULL) {
		client_update->ptr_query = strstr(client_request->ptr_query, "RETURN");
		_____str_temp = "RETURN";
	}
	SFINISH_CHECK(client_update->ptr_query != NULL, "Could not find RETURN clause");
	client_update->ptr_query = strstr(client_update->ptr_query, "\012");
	SFINISH_CHECK(client_update->ptr_query != NULL, "Could not find end of %s clause", _____str_temp);
	client_update->ptr_query += 1;
	while (*client_update->ptr_query == '\012') {
		client_update->ptr_query += 1;
	}
	ptr_pk_header = client_update->ptr_query;
	ptr_name_header = strchr(ptr_pk_header, '\012');
	SFINISH_CHECK(ptr_name_header != NULL, "Could not find end of column purpose headers");
	ptr_name_header += 1;
	ptr_pk_header_end = ptr_name_header;
	client_update->ptr_query = strchr(ptr_name_header, '\012');
	SFINISH_CHECK(client_update->ptr_query != NULL, "Could not find end of column name headers");
	ptr_name_header_end = client_update->ptr_query;
	client_update->ptr_query += 1;

	////PARSE HEADERS
	int int_i = 0;
	int int_x = 0;
	int int_y = 0;
	int int_z = 0;
	SFINISH_CAT_CSTR(client_update->str_pk_join_clause, "");
	SFINISH_CAT_CSTR(client_update->str_pk_where_clause, "");
	SFINISH_CAT_CSTR(client_update->str_temp_col_list, "");
	SFINISH_CAT_CSTR(client_update->str_set_col_list, "");
#ifndef POSTAGE_INTERFACE_LIBPQ
	SFINISH_CAT_CSTR(client_update->str_insert_column_names, str_col_name, "");
	SFINISH_CAT_CSTR(client_update->str_insert_parameter_markers, "");
#endif

	while (ptr_pk_header < ptr_pk_header_end || ptr_name_header < ptr_name_header_end) {
		SFINISH_CHECK(ptr_pk_header < ptr_pk_header_end, "Extra column name");
		SFINISH_CHECK(ptr_name_header < ptr_name_header_end, "Extra column purpose");

		// name
		int_length = strcspn(ptr_name_header, "\t\012");
		SFINISH_SALLOC(str_col_name, int_length + 1);
		memcpy(str_col_name, ptr_name_header, int_length);
		str_col_name[int_length] = '\0';
		ptr_name_header += int_length + 1;

		char *str_pk_header =
			strncmp(ptr_pk_header, "pk", 2) == 0
				? "pk_"
				: strncmp(ptr_pk_header, "set", 3) == 0 ? "set_" : strncmp(ptr_pk_header, "hash", 4) == 0 ? "hash_" : NULL;
		if (str_pk_header == NULL) {
			str_pk_header = ptr_pk_header;
		}
		SDEBUG("ptr_pk_header: %s", ptr_pk_header);
		ptr_pk_header += strcspn(ptr_pk_header, "\t\012") + 1;
		*(ptr_pk_header - 1) = 0;
		SDEBUG("str_pk_header: %s", str_pk_header);

		SFINISH_REPLACE(str_col_name, "\"", "\"\"", "g");
		str_temp1 = unescape_value(str_col_name);
		SFINISH_CHECK(str_temp1 != NULL, "unescape_value failed, malformed request?");
		SFREE(str_col_name);
		SFINISH_CAT_CSTR(str_col_name, "\"", str_temp1, "\"");
		SFINISH_CAT_CSTR(str_temp, "\"", str_pk_header, str_temp1, "\"");

		SFREE(str_temp1);

		if (strncmp(str_pk_header, "pk", 2) == 0) {
			if (DB_connection_driver(client_request->parent->conn) == DB_DRIVER_POSTGRES) {
				SFINISH_CAT_APPEND(client_update->str_pk_join_clause, int_x == 0 ? "" : " AND ",
					client_update->str_temp_table_name, ".", str_temp, " IS NOT DISTINCT FROM ",
					client_update->str_real_table_name, ".", str_col_name);
				SFINISH_CAT_APPEND(client_update->str_pk_where_clause, int_x == 0 ? "" : " AND ",
					client_update->str_real_table_name, ".", str_col_name, " = ANY(array(SELECT ", client_update->str_temp_table_name, ".", str_temp, " FROM ", client_update->str_temp_table_name, "))");
			} else {
				SFINISH_CAT_APPEND(client_update->str_pk_join_clause, int_x == 0 ? "" : " AND ",
					client_update->str_temp_table_name, ".", str_temp, " = ", client_update->str_real_table_name, ".",
					str_col_name);
				SFINISH_CAT_APPEND(client_update->str_pk_where_clause, int_x == 0 ? "" : " AND ",
					client_update->str_temp_table_name, ".", str_temp, " = ", client_update->str_real_table_name, ".",
					str_col_name);

				if (client_update->str_identity_column_name == NULL) {
					SFINISH_CAT_CSTR(client_update->str_identity_column_name, str_col_name);
				}
			}
			int_x++;
		} else if (strncmp(str_pk_header, "set", 3) == 0) {
			SFINISH_CAT_APPEND(client_update->str_set_col_list, int_y == 0 ? "" : ", ", str_col_name, " = ",
				client_update->str_temp_table_name, ".", str_temp);
			int_y++;
		} else if (strncmp(str_pk_header, "hash", 4) == 0) {
			SFINISH_CHECK(client_update->str_hash_where_clause != NULL, "Hashes supplied, but columns unknown");
			SFINISH_CHECK(int_z == 0, "Too many hashes");
			int_z++;
		} else {
			SFINISH("Invalid column purpose '%s'", str_pk_header);
		}

		if (strncmp(str_pk_header, "hash", 4) == 0) {
			if (DB_connection_driver(client_request->parent->conn) == DB_DRIVER_POSTGRES) {
				SFINISH_CAT_APPEND(client_update->str_temp_col_list, int_i == 0 ? "" : ", ", "''::text AS ",
					client_update->str_temp_table_name, "_hash");
			} else {
				SFINISH_CAT_APPEND(client_update->str_temp_col_list, int_i == 0 ? "" : ", ", "CAST('' AS nvarchar(40)) AS ",
					client_update->str_temp_table_name, "_hash");
			}

#ifndef POSTAGE_INTERFACE_LIBPQ
			SFINISH_CAT_APPEND(client_update->str_insert_column_names, client_update->str_temp_table_name, "_hash",
				(ptr_pk_header < ptr_pk_header_end ? ", " : ""));
			SFINISH_CAT_APPEND(client_update->str_insert_parameter_markers, "?", (ptr_pk_header < ptr_pk_header_end ? ", " : ""));
#endif
		} else {
			SFINISH_CAT_APPEND(client_update->str_temp_col_list, int_i == 0 ? "" : ", ", str_col_name, " AS ", str_temp);

#ifndef POSTAGE_INTERFACE_LIBPQ
			SFINISH_CAT_APPEND(client_update->str_insert_column_names, str_temp, (ptr_pk_header < ptr_pk_header_end ? ", " : ""));
			if (DB_connection_driver(client_request->parent->conn) == DB_DRIVER_POSTGRES) {
				SFINISH_CAT_APPEND(
					client_update->str_insert_parameter_markers, "E?", (ptr_pk_header < ptr_pk_header_end ? ", " : ""));
			} else {
				SFINISH_CAT_APPEND(
					client_update->str_insert_parameter_markers, "?", (ptr_pk_header < ptr_pk_header_end ? ", " : ""));
			}
#endif
		}

#ifndef POSTAGE_INTERFACE_LIBPQ
#endif

		SFREE(str_temp);
		SFREE(str_col_name);

		int_i++;
	}
	if (client_update->str_hash_where_clause != NULL) {
		SDEBUG("int_z: %d", int_z);
		SFINISH_CHECK(int_z == 1, "Hash columns supplied, but hashes unknown");
	}

	SFINISH_CHECK(client_update->str_pk_join_clause[0] != 0, "Primary key required");

	////CREATE TEMP TABLE
	if (DB_connection_driver(client_request->parent->conn) == DB_DRIVER_POSTGRES) {
		SFINISH_CAT_CSTR(str_sql, "CREATE TEMP TABLE ", client_update->str_temp_table_name, " ON COMMIT DROP AS SELECT ",
			client_update->str_temp_col_list, " FROM ", client_update->str_real_table_name, " LIMIT 0;");

		SDEBUG("str_sql: %s", str_sql);
		SFINISH_CHECK(
			DB_exec(global_loop, client_request->parent->conn, client_request, str_sql, ws_update_step2), "DB_exec failed");
	} else {
#ifndef POSTAGE_INTERFACE_LIBPQ
		if (client_update->str_identity_column_name != NULL) {
			SFINISH_CAT_CSTR(str_sql, "IF OBJECT_ID('tempdb..", client_update->str_temp_table_name,
				"') IS NOT NULL\n\tDROP TABLE ", client_update->str_temp_table_name, "\n", "SELECT TOP 0 ",
				client_update->str_identity_column_name, " AS id_temp123123123, ", client_update->str_temp_col_list, " INTO ",
				client_update->str_temp_table_name, " FROM ", client_update->str_real_table_name, ";");

			SDEBUG("str_sql: %s", str_sql);
			SFINISH_CHECK(
				DB_exec(global_loop, client_request->parent->conn, client_request, str_sql, ws_update_step15_sql_server),
				"DB_exec failed");
		} else {
			SFINISH_CAT_CSTR(str_sql, "IF OBJECT_ID('tempdb..", client_update->str_temp_table_name,
				"') IS NOT NULL\n\tDROP TABLE ", client_update->str_temp_table_name, "\n", "SELECT TOP 0 ",
				client_update->str_temp_col_list, " INTO ", client_update->str_temp_table_name, " FROM ",
				client_update->str_real_table_name, ";");

			SDEBUG("str_sql: %s", str_sql);
			SFINISH_CHECK(
				DB_exec(global_loop, client_request->parent->conn, client_request, str_sql, ws_update_step2), "DB_exec failed");
		}
// SFINISH_CAT_CSTR(str_sql, "SELECT TOP 0 ", client_update->str_temp_col_list, " INTO ", client_update->str_temp_table_name,
//	" FROM ", client_update->str_real_table_name, ";");

#endif
	}

	bol_error_state = false;
finish:
	SFREE(str_temp);
	SDEBUG("bol_error_state == %s", bol_error_state == true ? "true" : "false");
	if (bol_error_state == true) {
		bol_error_state = false;

		client_request->int_response_id += 1;
		SFINISH_SALLOC(str_temp, 101 * sizeof(char));
		memset(str_temp, 0, 101);
		snprintf(str_temp, 100, "%zd", client_request->int_response_id);

		char *_str_response = str_response;
		SFINISH_CAT_CSTR(str_response, "messageid = ", client_request->str_message_id, "\012"
																					   "responsenumber = ",
			str_temp, "\012");
		if (client_request->str_transaction_id != NULL) {
			SFINISH_CAT_APPEND(str_response, "transactionid = ", client_request->str_transaction_id, "\012");
		}
		SFINISH_CAT_APPEND(str_response, _str_response);
		SFREE(_str_response);

		WS_sendFrame(global_loop, client_request->parent, true, 0x01, str_response, strlen(str_response));
		DArray_push(client_request->arr_response, str_response);
		ws_update_free(client_update);
		// client_request_free(client_request);
		// client_request_free takes care of this
		// SFREE(client_update);
	}
	SFREE_ALL();
	return str_response;
}
#ifndef POSTAGE_INTERFACE_LIBPQ
bool ws_update_step15_sql_server(EV_P, void *cb_data, DB_result *res) {
	struct sock_ev_client_request *client_request = cb_data;
	struct sock_ev_client_update *client_update = (struct sock_ev_client_update *)(client_request->vod_request_data);
	char str_temp[101];
	bool bol_ret = true;
	char *str_response = NULL;
	SDEFINE_VAR_ALL(str_sql);
	SFINISH_CAT_CSTR(str_response, "");

	SFINISH_CHECK(res != NULL, "DB_exec failed");
	SFINISH_CHECK(res->status == DB_RES_COMMAND_OK, "DB_exec failed");

	DB_free_result(res);

	SFINISH_CAT_CSTR(str_sql, "ALTER TABLE ", client_update->str_temp_table_name, " DROP COLUMN id_temp123123123;");
	SDEBUG("str_sql: %s", str_sql);

	SFINISH_CHECK(DB_exec(EV_A, client_request->parent->conn, client_request, str_sql, ws_update_step2), "DB_exec failed");

	bol_error_state = false;
	bol_ret = false;
finish:
	if (bol_error_state == true) {
		bol_error_state = false;
		bol_ret = false;

		client_request->int_response_id += 1;
		memset(str_temp, 0, 101);
		snprintf(str_temp, 100, "%zd", client_request->int_response_id);

		char *_str_response = str_response;
		SFINISH_CAT_CSTR(str_response, "messageid = ", client_request->str_message_id, "\012"
																					   "responsenumber = ",
			str_temp, "\012");
		if (client_request->str_transaction_id != NULL) {
			SFINISH_CAT_APPEND(str_response, "transactionid = ", client_request->str_transaction_id, "\012");
		}
		SFINISH_CAT_APPEND(str_response, _str_response);
		SFREE(_str_response);
		_str_response = DB_get_diagnostic(client_request->parent->conn, res);
		SFINISH_CAT_APPEND(str_response, ":\n", _str_response);
		SFREE(_str_response);

		WS_sendFrame(EV_A, client_request->parent, true, 0x01, str_response, strlen(str_response));
		DArray_push(client_request->arr_response, str_response);

		ws_update_free(client_update);
		// client_request_free(client_request);
		// client_request_free takes care of this
		// SFREE(client_update);
	} else {
		SFREE(str_response);
	}
	DB_free_result(res);
	SFREE_ALL();
	return bol_ret;
}
#endif

bool ws_update_step2(EV_P, void *cb_data, DB_result *res) {
	struct sock_ev_client_request *client_request = cb_data;
	struct sock_ev_client_update *client_update = (struct sock_ev_client_update *)(client_request->vod_request_data);
	size_t int_len_content;
	bool bol_ret = true;
	char *str_response = NULL;
	char str_temp[101];
	SDEFINE_VAR_ALL(str_sql);
	SFINISH_CAT_CSTR(str_response, "");

	SFINISH_CHECK(res != NULL, "DB_exec failed");
	SFINISH_CHECK(res->status == DB_RES_COMMAND_OK, "DB_exec failed");

	// Start copying into temp table
	SDEBUG("client_update->str_temp_table_name: %s", client_update->str_temp_table_name);
#ifdef POSTAGE_INTERFACE_LIBPQ
	SFINISH_CAT_CSTR(str_sql, "COPY ", client_update->str_temp_table_name, " FROM STDIN;");
#else
	SFINISH_CAT_CSTR(str_sql, "INSERT INTO ", client_update->str_temp_table_name, " (", client_update->str_insert_column_names,
		") VALUES (", client_update->str_insert_parameter_markers, ")");
	SDEBUG("str_sql: %s", str_sql);
#endif

	int_len_content = client_request->frame->int_length - (size_t)(client_update->ptr_query - client_request->frame->str_message);
	SFINISH_CHECK(int_len_content > 0, "No update data");
	SFINISH_CHECK(DB_copy_in(EV_A, client_request->parent->conn, client_request, client_update->ptr_query, int_len_content,
					  str_sql, ws_update_step4),
		"DB_copy_in failed");

	DB_free_result(res);

	bol_error_state = false;
	bol_ret = true;
finish:
	if (bol_error_state == true) {
		bol_ret = false;
		bol_error_state = false;

		client_request->int_response_id += 1;
		memset(str_temp, 0, 101);
		snprintf(str_temp, 100, "%zd", client_request->int_response_id);

		char *_str_response = str_response;
		SFINISH_CAT_CSTR(str_response, "messageid = ", client_request->str_message_id, "\012"
																					   "responsenumber = ",
			str_temp, "\012");
		if (client_request->str_transaction_id != NULL) {
			SFINISH_CAT_APPEND(str_response, "transactionid = ", client_request->str_transaction_id, "\012");
		}
		SFINISH_CAT_APPEND(str_response, _str_response);
		SFREE(_str_response);
		_str_response = DB_get_diagnostic(client_request->parent->conn, res);
		SFINISH_CAT_APPEND(str_response, ":\n", _str_response);
		SFREE(_str_response);

		WS_sendFrame(EV_A, client_request->parent, true, 0x01, str_response, strlen(str_response));
		DArray_push(client_request->arr_response, str_response);
		ws_update_free(client_update);
		// client_request_free(client_request);
		// client_request_free takes care of this
		// SFREE(client_update);
	} else {
		SFREE(str_response);
	}
	DB_free_result(res);
	SFREE_ALL();
	return bol_ret;
}

bool ws_update_step4(EV_P, void *cb_data, DB_result *res) {
	struct sock_ev_client_request *client_request = cb_data;
	struct sock_ev_client_update *client_update = (struct sock_ev_client_update *)(client_request->vod_request_data);
	SDEFINE_VAR_ALL(str_sql, str_hash_where_clause);
	char *str_response = NULL;
	bool bol_ret = true;

	SFINISH_CHECK(res != NULL, "DB_exec failed");
	SFINISH_CHECK(res->status == DB_RES_COMMAND_OK, "DB_exec failed");

	if (client_update->int_update_count == 0) {
		client_update->int_update_count = DB_rows_affected(res);
	}

	if (DB_connection_driver(client_request->parent->conn) == DB_DRIVER_POSTGRES) {
		if (client_update->str_hash_where_clause != NULL) {
			SFINISH_CAT_CSTR(str_sql, "SELECT count(*), sum(CASE WHEN ", client_update->str_hash_where_clause,
				" THEN 1 ELSE 0 END) FROM ", client_update->str_temp_table_name, " ", "INNER JOIN ",
				client_update->str_real_table_name, " ON ", client_update->str_pk_join_clause, ";");
		} else {
			SFINISH_CAT_CSTR(str_sql, "SELECT count(*) FROM ", client_update->str_temp_table_name, " ", "INNER JOIN ",
				client_update->str_real_table_name, " ON ", client_update->str_pk_join_clause, ";");
		}
	} else {
		if (client_update->str_hash_where_clause != NULL) {
			SFINISH_CAT_CSTR(str_sql, "SELECT CAST(count(*) AS nvarchar(MAX)), CAST(sum(CASE WHEN ",
				client_update->str_hash_where_clause, " THEN 1 ELSE 0 END) AS nvarchar(MAX)) FROM ",
				client_update->str_temp_table_name, " ", "INNER JOIN ", client_update->str_real_table_name, " ON ",
				client_update->str_pk_join_clause, ";");
		} else {
			SFINISH_CAT_CSTR(str_sql, "SELECT CAST(count(*) AS nvarchar(MAX)) FROM ", client_update->str_temp_table_name, " ",
				"INNER JOIN ", client_update->str_real_table_name, " ON ", client_update->str_pk_join_clause, ";");
		}
	}
	SDEBUG("str_sql: %s", str_sql);

	SFINISH_CHECK(DB_exec(EV_A, client_request->parent->conn, client_request, str_sql, ws_update_step5), "DB_exec failed");

	bol_error_state = false;
	bol_ret = true;
finish:
	SFREE_ALL();
	if (bol_error_state == true) {
		bol_ret = false;
		bol_error_state = false;

		client_request->int_response_id += 1;
		char str_temp[101] = {0};
		snprintf(str_temp, 100, "%zd", client_request->int_response_id);

		char *_str_response = str_response;
		SFINISH_CAT_CSTR(str_response, "messageid = ", client_request->str_message_id, "\012"
																					   "responsenumber = ",
			str_temp, "\012");
		if (client_request->str_transaction_id != NULL) {
			SFINISH_CAT_APPEND(str_response, "transactionid = ", client_request->str_transaction_id, "\012");
		}
		SFINISH_CAT_APPEND(str_response, _str_response);
		SFREE(_str_response);
		_str_response = DB_get_diagnostic(client_request->parent->conn, res);
		SFINISH_CAT_APPEND(str_response, ":\n", _str_response);
		SFREE(_str_response);

		WS_sendFrame(EV_A, client_request->parent, true, 0x01, str_response, strlen(str_response));
		DArray_push(client_request->arr_response, str_response);
		ws_update_free(client_update);
		// client_request_free(client_request);
		// client_request_free takes care of this
		// SFREE(client_insert);
	}
	DB_free_result(res);
	return bol_ret;
}

bool ws_update_step5(EV_P, void *cb_data, DB_result *res) {
	struct sock_ev_client_request *client_request = cb_data;
	struct sock_ev_client_update *client_update = (struct sock_ev_client_update *)(client_request->vod_request_data);
	SDEFINE_VAR_ALL(str_sql);
	bool bol_ret = true;
	DArray *arr_row_values = NULL;
	size_t int_real_count;
	size_t int_hash_count;
	char *str_response = NULL;
	SFINISH_CAT_CSTR(str_response, "");

	SFINISH_CHECK(res != NULL, "DB_exec failed");
	SFINISH_CHECK(res->status == DB_RES_TUPLES_OK, "DB_exec failed");

	// Get counts and compare
	SFINISH_CHECK(DB_fetch_row(res) == DB_FETCH_OK, "DB_fetch_row failed");
	arr_row_values = DB_get_row_values(res);
	SFINISH_CHECK(arr_row_values != NULL, "DB_get_row_values failed");

	int_real_count = (size_t)strtol(DArray_get(arr_row_values, 0), NULL, 10);
	int_hash_count = (client_update->str_hash_where_clause != NULL
						  ? (DArray_get(arr_row_values, 1) != NULL ? (size_t)strtol(DArray_get(arr_row_values, 1), NULL, 10) : 0)
						  : int_real_count);

	SDEBUG("client_update->int_update_count: %d", client_update->int_update_count);
	SDEBUG("int_real_count                 : %d", int_real_count);
	SDEBUG("int_hash_count                 : %d", int_hash_count);

	SFINISH_CHECK(client_update->int_update_count == int_real_count, "Some of these records have already been deleted.");
	SFINISH_CHECK(client_update->int_update_count == int_hash_count, "Someone updated this record before you.");

	SDEBUG("client_update->str_return_columns : %s", client_update->str_return_columns);
	SDEBUG("client_update->str_real_table_name: %s", client_update->str_real_table_name);

	DB_free_result(res);
	if (DB_connection_driver(client_request->parent->conn) == DB_DRIVER_POSTGRES) {
		SFINISH_CAT_CSTR(str_sql, "UPDATE ", client_update->str_real_table_name, " SET ", client_update->str_set_col_list,
			" FROM ", client_update->str_temp_table_name, " WHERE ", client_update->str_pk_join_clause, ";");
	} else {
		SFINISH_CAT_CSTR(str_sql, "MERGE INTO ", client_update->str_real_table_name, " WITH (HOLDLOCK) "
																					 "USING ",
			client_update->str_temp_table_name, " ", "ON ", client_update->str_pk_join_clause, " ", "WHEN MATCHED ",
			"THEN UPDATE ", "SET ", client_update->str_set_col_list, ";");
	}

	SFINISH_CHECK(DB_exec(EV_A, client_request->parent->conn, client_request, str_sql, ws_update_step6), "DB_exec failed");

	bol_error_state = false;
	bol_ret = true;
finish:
	if (arr_row_values != NULL) {
		DArray_clear_destroy(arr_row_values);
	}

	if (bol_error_state == true) {
		bol_ret = false;
		bol_error_state = false;

		client_request->int_response_id += 1;
		char str_temp[101] = {0};
		snprintf(str_temp, 100, "%zd", client_request->int_response_id);

		char *_str_response = str_response;
		SFINISH_CAT_CSTR(str_response, "messageid = ", client_request->str_message_id, "\012"
																					   "responsenumber = ",
			str_temp, "\012");
		if (client_request->str_transaction_id != NULL) {
			SFINISH_CAT_APPEND(str_response, "transactionid = ", client_request->str_transaction_id, "\012");
		}
		SFINISH_CAT_APPEND(str_response, _str_response);
		SFREE(_str_response);
		_str_response = DB_get_diagnostic(client_request->parent->conn, res);
		SFINISH_CAT_APPEND(str_response, ":\n", _str_response);
		SFREE(_str_response);

		WS_sendFrame(EV_A, client_request->parent, true, 0x01, str_response, strlen(str_response));
		DArray_push(client_request->arr_response, str_response);
		ws_update_free(client_update);
		// client_request_free(client_request);
		// client_request_free takes care of this
		// SFREE(client_update);
	} else {
		SFREE(str_response);
	}
	DB_free_result(res);
	SFREE_ALL();
	return bol_ret;
}

bool ws_update_step6(EV_P, void *cb_data, DB_result *res) {
	struct sock_ev_client_request *client_request = cb_data;
	struct sock_ev_client_update *client_update = (struct sock_ev_client_update *)(client_request->vod_request_data);
	bool bol_ret = true;
	char *str_response = NULL;
	char str_temp[101];
	SDEFINE_VAR_ALL(str_sql);
	SFINISH_CAT_CSTR(str_response, "");

	SFINISH_CHECK(res != NULL, "DB_exec failed");
	SFINISH_CHECK(res->status == DB_RES_COMMAND_OK, "DB_exec failed");

	DB_free_result(res);
// Start copying into temp table
#ifdef POSTAGE_INTERFACE_LIBPQ
	SFINISH_CAT_CSTR(str_sql, "COPY (SELECT ", client_update->str_return_columns, " FROM ", client_update->str_real_table_name,
		" LEFT JOIN ", client_update->str_temp_table_name, " ON ", client_update->str_pk_join_clause, " WHERE ",
		client_update->str_pk_where_clause, ") TO STDOUT;");
#else
	SFINISH_CAT_CSTR(str_sql, "SELECT ", client_update->str_return_escaped_columns, " FROM ", client_update->str_real_table_name,
		" LEFT JOIN ", client_update->str_temp_table_name, " ON ", client_update->str_pk_join_clause, " WHERE ",
		client_update->str_pk_where_clause, ";");
#endif

	SDEBUG("str_sql: %s", str_sql);
	SFINISH_CHECK(
		DB_copy_out(EV_A, client_request->parent->conn, client_request, str_sql, ws_copy_check_cb), "DB_copy_out failed!");
	/*
	int int_status = PQsendQuery(client_request->parent->cnxn, str_sql);
	if (int_status != 1) {
		SFINISH_ERROR("UPDATE failed: %s", PQerrorMessage(client_request->parent->cnxn));
	}
	SFREE(str_sql);

	query_callback(client_request, ws_update_step7);
	*/
	bol_error_state = false;
	bol_ret = true;
finish:
	if (bol_error_state == true) {
		bol_ret = false;
		bol_error_state = false;

		memset(str_temp, 0, 101);
		client_request->int_response_id += 1;
		snprintf(str_temp, 100, "%zd", client_request->int_response_id);

		char *_str_response = str_response;
		SFINISH_CAT_CSTR(str_response, "messageid = ", client_request->str_message_id, "\012"
																					   "responsenumber = ",
			str_temp, "\012");
		if (client_request->str_transaction_id != NULL) {
			SFINISH_CAT_APPEND(str_response, "transactionid = ", client_request->str_transaction_id, "\012");
		}
		SFINISH_CAT_APPEND(str_response, _str_response);
		SFREE(_str_response);
		_str_response = DB_get_diagnostic(client_request->parent->conn, res);
		SFINISH_CAT_APPEND(str_response, ":\n", _str_response);
		SFREE(_str_response);

		WS_sendFrame(EV_A, client_request->parent, true, 0x01, str_response, strlen(str_response));
		DArray_push(client_request->arr_response, str_response);
		ws_update_free(client_update);
		// client_request_free(client_request);
		// client_request_free takes care of this
		// SFREE(client_update);
	} else {
		SFREE(str_response);
	}
	DB_free_result(res);
	SFREE_ALL();
	return bol_ret;
}

void ws_update_free(struct sock_ev_client_update *to_free) {
	SFREE(to_free->str_return_columns);
#ifndef POSTAGE_INTERFACE_LIBPQ
	SFREE(to_free->str_return_escaped_columns);
	SFREE(to_free->str_insert_column_names);
	SFREE(to_free->str_insert_parameter_markers);
#endif
	SFREE(to_free->str_pk_where_clause);
	SFREE(to_free->str_pk_join_clause);
	SFREE(to_free->str_temp_col_list);
	SFREE(to_free->str_set_col_list);
	SFREE(to_free->str_real_table_name);
	SFREE(to_free->str_temp_table_name);
	SFREE(to_free->str_sql);
	SFREE(to_free->str_hash_where_clause);
	SFREE(to_free->str_columns);
	SFREE(to_free->str_type_sql);
	SFREE(to_free->str_col);
	SFREE(to_free->str_value);
	SFREE(to_free->str_col_data_type);
	SFREE(to_free->str_u_where);
	SFREE(to_free->str_where);
	SFREE(to_free->str_identity_column_name);
	if (to_free->darr_where_column != NULL) {
		DArray_clear_destroy(to_free->darr_where_column);
		to_free->darr_where_column = NULL;
	}
	if (to_free->darr_where_value != NULL) {
		DArray_clear_destroy(to_free->darr_where_value);
		to_free->darr_where_value = NULL;
	}
}
