#include "ws_delete.h"

char *ws_delete_step1(struct sock_ev_client_request *client_request) {
	struct sock_ev_client_delete *client_delete = (struct sock_ev_client_delete *)(client_request->vod_request_data);
	SDEBUG("DELETE BEGIN");
	char *str_response = NULL;
	char *str_temp = NULL;
	char *str_temp1 = NULL;
	size_t int_length = 0;
	size_t int_i = 0;
	size_t int_x = 0;
	size_t int_y = 0;

	client_request->arr_response = DArray_create(sizeof(char *), 1);

	char *ptr_pk_header = NULL;
	char *ptr_pk_header_end = NULL;
	char *ptr_name_header = NULL;
#ifndef POSTAGE_INTERFACE_LIBPQ
	char *ptr_name_header_end = NULL;
#endif

	SDEFINE_VAR_ALL(str_temp_col_list, str_col_name, str_sql, str_where_temp);

	if (DB_connection_driver(client_request->parent->conn) == DB_DRIVER_POSTGRES) {
		SFINISH_CAT_CSTR(client_delete->str_temp_table_name, "temp_delete");
	} else {
		SFINISH_CAT_CSTR(client_delete->str_temp_table_name, "#temp_delete");
	}

	// Get table names and return columns
	SFINISH_ERROR_CHECK((client_delete->str_real_table_name = get_table_name(client_request->ptr_query)) != NULL,
		"Failed to get table name from query");

	client_delete->str_hash_where_clause = get_hash_columns(client_request->ptr_query);
	SFREE(str_global_error);

	if (client_delete->str_hash_where_clause != NULL) {
		SFINISH_REPLACE(client_delete->str_hash_where_clause, "\"", "\"\"", "g");
		if (DB_connection_driver(client_request->parent->conn) == DB_DRIVER_POSTGRES) {
			SFINISH_REPLACE(client_delete->str_hash_where_clause, "\t", "\"::text, '') || '\t' || COALESCE(\"", "g");
			SFINISH_CAT_CSTR(str_where_temp, client_delete->str_temp_table_name, "_hash = MD5(COALESCE(\"",
				client_delete->str_hash_where_clause, "\"::text, ''))");
		} else {
			SFINISH_REPLACE(client_delete->str_hash_where_clause, "\t",
				"\" AS nvarchar(MAX)), CAST('' AS nvarchar(MAX))) + CAST('\t' AS nvarchar(MAX)) + COALESCE(CAST(\"", "g");
			SFINISH_CAT_CSTR(str_where_temp, client_delete->str_temp_table_name,
				"_hash = LOWER(CONVERT(nvarchar(MAX), HashBytes('MD5', COALESCE(CAST(\"", client_delete->str_hash_where_clause,
				"\" AS nvarchar(MAX)), CAST('' AS nvarchar(MAX)))), 2))");
		}
		SFREE(client_delete->str_hash_where_clause);
		client_delete->str_hash_where_clause = str_where_temp;
		str_where_temp = NULL;
	}

	SDEBUG("client_delete->str_hash_where_clause: %s", client_delete->str_hash_where_clause);

	////GET POINTERS SET TO BEGINNING OF HEADERS
	client_delete->ptr_query = strstr(client_request->ptr_query, "HASH");
	if (client_delete->ptr_query == NULL) {
		client_delete->ptr_query = client_request->ptr_query;
	}
	client_delete->ptr_query = strstr(client_delete->ptr_query, "\012");
	SFINISH_CHECK(client_delete->ptr_query, "strstr failed, malformed request?");
	client_delete->ptr_query += 2;
	ptr_pk_header = client_delete->ptr_query;
	ptr_name_header = strchr(ptr_pk_header, '\012');
	SFINISH_CHECK(ptr_name_header, "strchr failed, malformed request?");
	ptr_name_header += 1;
	ptr_pk_header_end = ptr_name_header;
	client_delete->ptr_query = strchr(ptr_name_header, '\012');
	SFINISH_CHECK(client_delete->ptr_query != NULL, "strchr failed, malformed request?");
#ifndef POSTAGE_INTERFACE_LIBPQ
	ptr_name_header_end = client_delete->ptr_query;
#endif
	client_delete->ptr_query += 1;

	SDEBUG("ptr_pk_header: %s", ptr_pk_header);
	SDEBUG("ptr_name_header: %s", ptr_name_header);
	SDEBUG("client_delete->ptr_query: %s", client_delete->ptr_query);

	////PARSE HEADERS
	SFINISH_CAT_CSTR(client_delete->str_pk_where_clause, "");
	SFINISH_CAT_CSTR(str_temp_col_list, "");
#ifndef POSTAGE_INTERFACE_LIBPQ
	SFINISH_CAT_CSTR(client_delete->str_insert_column_names, str_col_name, "");
	SFINISH_CAT_CSTR(client_delete->str_insert_parameter_markers, "");
#endif

	while (ptr_pk_header < ptr_pk_header_end) {
		// name
		int_length = strcspn(ptr_name_header, "\t\012");
		SFINISH_SALLOC(str_col_name, int_length + 1);
		memcpy(str_col_name, ptr_name_header, int_length);
		str_col_name[int_length] = '\0';
		ptr_name_header += int_length + 1;

		char *str_pk_header =
			strncmp(ptr_pk_header, "pk", 2) == 0 ? "pk_" : strncmp(ptr_pk_header, "set", 3) == 0 ? "set_" : "hash_";
		SDEBUG("str_pk_header: %s", str_pk_header);
		SDEBUG("ptr_pk_header: %s", ptr_pk_header);
		ptr_pk_header += strcspn(ptr_pk_header, "\t\012") + 1;

		SDEBUG("str_col_name: %s", str_col_name);
		SDEBUG("str_pk_header: %s", str_pk_header);

		SFINISH_REPLACE(str_col_name, "\"", "\"\"", "g");
		str_temp1 = unescape_value(str_col_name);
		SDEBUG("str_temp1: %s", str_temp1);
		SFINISH_CHECK(str_temp1 != NULL, "unescape_value failed, malformed request?");
		SFREE(str_col_name);
		SFINISH_CAT_CSTR(str_col_name, "\"", str_temp1, "\"");
		SFINISH_CAT_CSTR(str_temp, "\"", str_pk_header, str_temp1, "\"");

		SFREE(str_temp1);

		if (strncmp(str_pk_header, "hash", 4) == 0) {
			if (DB_connection_driver(client_request->parent->conn) == DB_DRIVER_POSTGRES) {
				SFINISH_CAT_APPEND(
					str_temp_col_list, int_i == 0 ? "" : ", ", "''::text AS ", client_delete->str_temp_table_name, "_hash");
			} else {
				SFINISH_CAT_APPEND(str_temp_col_list, int_i == 0 ? "" : ", ", "CAST('' AS nvarchar(40)) AS ",
					client_delete->str_temp_table_name, "_hash");
			}
#ifndef POSTAGE_INTERFACE_LIBPQ
			SFINISH_CAT_APPEND(client_delete->str_insert_column_names, client_delete->str_temp_table_name, "_hash",
				(ptr_name_header < ptr_name_header_end ? ", " : ""));
			SFINISH_CAT_APPEND(
				client_delete->str_insert_parameter_markers, "?", (ptr_name_header < ptr_name_header_end ? ", " : ""));
#endif
		} else {
			SDEBUG("str_col_name: %s", str_col_name);
			SFINISH_CAT_APPEND(str_temp_col_list, int_i == 0 ? "" : ", ", str_col_name, " AS ", str_temp);
#ifndef POSTAGE_INTERFACE_LIBPQ
			SFINISH_CAT_APPEND(
				client_delete->str_insert_column_names, str_temp, (ptr_name_header < ptr_name_header_end ? ", " : ""));
			if (DB_connection_driver(client_request->parent->conn) == DB_DRIVER_POSTGRES) {
				SFINISH_CAT_APPEND(
					client_delete->str_insert_parameter_markers, "E?", (ptr_name_header < ptr_name_header_end ? ", " : ""));
			} else {
				SFINISH_CAT_APPEND(
					client_delete->str_insert_parameter_markers, "?", (ptr_name_header < ptr_name_header_end ? ", " : ""));
			}
#endif
		}

		if (strncmp(str_pk_header, "pk", 2) == 0) {
			if (DB_connection_driver(client_request->parent->conn) == DB_DRIVER_POSTGRES) {
				SFINISH_CAT_APPEND(client_delete->str_pk_where_clause, int_x == 0 ? "" : " AND ",
					client_delete->str_temp_table_name, ".", str_temp, " IS NOT DISTINCT FROM ",
					client_delete->str_real_table_name, ".", str_col_name);
			} else {
				SFINISH_CAT_APPEND(client_delete->str_pk_where_clause, int_x == 0 ? "" : " AND ",
					client_delete->str_temp_table_name, ".", str_temp, " = ", client_delete->str_real_table_name, ".",
					str_col_name);

				if (client_delete->str_identity_column_name == NULL) {
					SFINISH_CAT_CSTR(client_delete->str_identity_column_name, str_col_name);
				}
			}
			int_x++;
		} else {
			SFINISH_CHECK(client_delete->str_hash_where_clause != NULL, "Hashes supplied, but columns unknown");
			SDEBUG("hash detected");
			SFINISH_CHECK(int_y == 0, "Too many hashes");
			int_y++;
		}
		SFREE(str_col_name);
		SFREE(str_temp);
		int_i++;
	}
	if (client_delete->str_hash_where_clause != NULL) {
		SDEBUG("int_y: %d", int_y);
		SFINISH_CHECK(int_y == 1, "Hash columns supplied, but hashes unknown");
	}

	SFINISH_CHECK(client_delete->str_pk_where_clause[0] != 0, "Primary key required");

	////CREATE TEMP TABLE
	if (DB_connection_driver(client_request->parent->conn) == DB_DRIVER_POSTGRES) {
		SFINISH_CAT_CSTR(str_sql, "CREATE TEMP TABLE ", client_delete->str_temp_table_name, " ON COMMIT DROP AS SELECT ",
			str_temp_col_list, " FROM ", client_delete->str_real_table_name, " LIMIT 0;");

		SDEBUG("str_sql: %s", str_sql);
		SFINISH_CHECK(
			DB_exec(global_loop, client_request->parent->conn, client_request, str_sql, ws_delete_step2), "DB_exec failed");
	} else {
#ifndef POSTAGE_INTERFACE_LIBPQ
		if (client_delete->str_identity_column_name != NULL) {
			SFINISH_CAT_CSTR(str_sql, "IF OBJECT_ID('tempdb..", client_delete->str_temp_table_name,
				"') IS NOT NULL\n\tDROP TABLE ", client_delete->str_temp_table_name, "\n", "SELECT TOP 0 ",
				client_delete->str_identity_column_name, " AS id_temp123123123, ", str_temp_col_list, " INTO ",
				client_delete->str_temp_table_name, " FROM ", client_delete->str_real_table_name, ";");

			SDEBUG("str_sql: %s", str_sql);
			SFINISH_CHECK(
				DB_exec(global_loop, client_request->parent->conn, client_request, str_sql, ws_delete_step15_sql_server),
				"DB_exec failed");
		} else {
			SFINISH_CAT_CSTR(str_sql, "IF OBJECT_ID('tempdb..", client_delete->str_temp_table_name,
				"') IS NOT NULL\n\tDROP TABLE ", client_delete->str_temp_table_name, "\n", "SELECT TOP 0 ", str_temp_col_list,
				" INTO ", client_delete->str_temp_table_name, " FROM ", client_delete->str_real_table_name, ";");

			SDEBUG("str_sql: %s", str_sql);
			SFINISH_CHECK(
				DB_exec(global_loop, client_request->parent->conn, client_request, str_sql, ws_delete_step2), "DB_exec failed");
		}
// SFINISH_CAT_CSTR(str_sql, "SELECT TOP 0 ", str_temp_col_list, " INTO ", client_delete->str_temp_table_name, " FROM ",
//	client_delete->str_real_table_name, ";");
#endif
	}

	SFREE(str_temp_col_list);

	bol_error_state = false;
finish:
	SFREE(str_temp);
	if (bol_error_state == true) {
		bol_error_state = false;

		client_request->int_response_id += 1;
		char str_temp2[101] = {0};
		snprintf(str_temp2, 100, "%zd", client_request->int_response_id);

		char *_str_response = str_response;
		SFINISH_CAT_CSTR(str_response, "messageid = ", client_request->str_message_id, "\012"
																					   "responsenumber = ",
			str_temp2, "\012");
		if (client_request->str_transaction_id != NULL) {
			SFINISH_CAT_APPEND(str_response, "transactionid = ", client_request->str_transaction_id, "\012");
		}
		SFINISH_CAT_APPEND(str_response, _str_response);
		SFREE(_str_response);

		WS_sendFrame(global_loop, client_request->parent, true, 0x01, str_response, strlen(str_response));
		DArray_push(client_request->arr_response, str_response);
		ws_delete_free(client_delete);
		// client_request_free(client_request);
		// client_request_free takes care of this
		// SFREE(client_delete);
	}
	SFREE_ALL();
	return str_response;
}
#ifndef POSTAGE_INTERFACE_LIBPQ
bool ws_delete_step15_sql_server(EV_P, void *cb_data, DB_result *res) {
	struct sock_ev_client_request *client_request = cb_data;
	struct sock_ev_client_delete *client_delete = (struct sock_ev_client_delete *)(client_request->vod_request_data);
	char str_temp[101];
	memset(str_temp, 0, 101);
	SDEFINE_VAR_ALL(str_sql);
	bool bol_ret = true;
	char *str_response = NULL;
	SFINISH_CAT_CSTR(str_response, "");

	SFINISH_CHECK(res != NULL, "DB_exec failed");
	SFINISH_CHECK(res->status == DB_RES_COMMAND_OK, "DB_exec failed");

	DB_free_result(res);

	SFINISH_CAT_CSTR(str_sql, "ALTER TABLE ", client_delete->str_temp_table_name, " DROP COLUMN id_temp123123123;");
	SDEBUG("str_sql: %s", str_sql);

	SFINISH_CHECK(DB_exec(EV_A, client_request->parent->conn, client_request, str_sql, ws_delete_step2), "DB_exec failed");

	bol_error_state = false;
	bol_ret = false;
finish:
	if (bol_error_state == true) {
		bol_error_state = false;
		bol_ret = false;

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

		ws_delete_free(client_delete);
		// client_request_free(client_request);
		// client_request_free takes care of this
		// SFREE(client_delete);
	} else {
		SFREE(str_response);
	}
	DB_free_result(res);
	SFREE_ALL();
	return bol_ret;
}
#endif

bool ws_delete_step2(EV_P, void *cb_data, DB_result *res) {
	struct sock_ev_client_request *client_request = cb_data;
	struct sock_ev_client_delete *client_delete = (struct sock_ev_client_delete *)(client_request->vod_request_data);
	size_t int_len_content;
	char str_temp[101];
	memset(str_temp, 0, 101);
	bool bol_ret = true;
	char *str_response = NULL;
	SDEFINE_VAR_ALL(str_sql);
	SFINISH_CAT_CSTR(str_response, "");

	SFINISH_CHECK(res != NULL, "DB_exec failed");
	SFINISH_CHECK(res->status == DB_RES_COMMAND_OK, "DB_exec failed");

	DB_free_result(res);
// Start copying into temp table
#ifdef POSTAGE_INTERFACE_LIBPQ
	SFINISH_CAT_CSTR(str_sql, "COPY ", client_delete->str_temp_table_name, " FROM STDIN;");
#else
	SFINISH_CAT_CSTR(str_sql, "INSERT INTO ", client_delete->str_temp_table_name, " (", client_delete->str_insert_column_names,
		") VALUES (", client_delete->str_insert_parameter_markers, ")");
	SDEBUG("str_sql: %s", str_sql);
#endif

	SDEBUG("client_delete->ptr_query: %s", client_delete->ptr_query);
	int_len_content = client_request->frame->int_length - (size_t)(client_delete->ptr_query - client_request->frame->str_message);
	SFINISH_CHECK(DB_copy_in(EV_A, client_request->parent->conn, client_request, client_delete->ptr_query, int_len_content,
					  str_sql, ws_delete_step4),
		"DB_copy_in failed");

	bol_error_state = false;
	bol_ret = true;
finish:
	if (bol_error_state == true) {
		bol_error_state = false;
		bol_ret = false;

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

		ws_delete_free(client_delete);
		// client_request_free(client_request);
		// client_request_free takes care of this
		// SFREE(client_delete);
	} else {
		SFREE(str_response);
	}
	DB_free_result(res);
	SFREE_ALL();
	return bol_ret;
}

bool ws_delete_step4(EV_P, void *cb_data, DB_result *res) {
	struct sock_ev_client_request *client_request = cb_data;
	struct sock_ev_client_delete *client_delete = (struct sock_ev_client_delete *)(client_request->vod_request_data);
	char str_temp[101];
	memset(str_temp, 0, 101);
	bool bol_ret = true;
	char *str_response = NULL;
	SDEFINE_VAR_ALL(str_sql);

	SFINISH_CHECK(res != NULL, "DB_copy_in failed");
	SFINISH_CHECK(res->status == DB_RES_COMMAND_OK, "DB_copy_in failed");

	if (client_delete->int_delete_count == 0) {
		client_delete->int_delete_count = (size_t)DB_rows_affected(res);
	}

	DB_free_result(res);

	if (DB_connection_driver(client_request->parent->conn) == DB_DRIVER_POSTGRES) {
		if (client_delete->str_hash_where_clause != NULL) {
			SFINISH_CAT_CSTR(str_sql, "SELECT count(*), sum(CASE WHEN ", client_delete->str_hash_where_clause,
				" THEN 1 ELSE 0 END) FROM ", client_delete->str_temp_table_name, " ", "INNER JOIN ",
				client_delete->str_real_table_name, " ON ", client_delete->str_pk_where_clause, ";");
		} else {
			SFINISH_CAT_CSTR(str_sql, "SELECT count(*) FROM ", client_delete->str_temp_table_name, " ", "INNER JOIN ",
				client_delete->str_real_table_name, " ON ", client_delete->str_pk_where_clause, ";");
		}
	} else {
		if (client_delete->str_hash_where_clause != NULL) {
			SFINISH_CAT_CSTR(str_sql, "SELECT CAST(count(*) AS nvarchar(MAX)), CAST(sum(CASE WHEN ",
				client_delete->str_hash_where_clause, " THEN 1 ELSE 0 END) AS nvarchar(MAX)) FROM ",
				client_delete->str_temp_table_name, " ", "INNER JOIN ", client_delete->str_real_table_name, " ON ",
				client_delete->str_pk_where_clause, ";");
		} else {
			SFINISH_CAT_CSTR(str_sql, "SELECT CAST(count(*) AS nvarchar(MAX)) FROM ", client_delete->str_temp_table_name, " ",
				"INNER JOIN ", client_delete->str_real_table_name, " ON ", client_delete->str_pk_where_clause, ";");
		}
	}

	/*
	int int_status = PQsendQuery(client_request->parent->cnxn, str_sql);
	if (int_status != 1) {
		SFINISH_ERROR("count failed: %s", PQerrorMessage(client_request->parent->cnxn));
	}

	query_callback(client_request, ws_delete_step5);
	*/

	SDEBUG("str_sql: %s", str_sql);

	SFINISH_CHECK(DB_exec(EV_A, client_request->parent->conn, client_request, str_sql, ws_delete_step5), "DB_exec failed");

	bol_error_state = false;
	bol_ret = true;
finish:
	SFREE_ALL();
	if (bol_error_state == true) {
		bol_ret = false;
		bol_error_state = false;

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

		ws_delete_free(client_delete);
		// client_request_free(client_request);
		// client_request_free takes care of this
		// SFREE(client_delete);
	} else {
		SFREE(str_response);
	}
	DB_free_result(res);
	return bol_ret;
}

bool ws_delete_step5(EV_P, void *cb_data, DB_result *res) {
	struct sock_ev_client_request *client_request = cb_data;
	struct sock_ev_client_delete *client_delete = (struct sock_ev_client_delete *)(client_request->vod_request_data);
	SDEFINE_VAR_ALL(str_sql);
	bool bol_ret = true;
	char *str_response = NULL;
	DArray *arr_row_values = NULL;
	size_t int_real_count;
	size_t int_hash_count;
	char str_temp[101];
	memset(str_temp, 0, 101);
	SFINISH_CAT_CSTR(str_response, "");

	SFINISH_CHECK(res != NULL, "DB_exec failed");
	SFINISH_CHECK(res->status == DB_RES_TUPLES_OK, "DB_exec failed");

	// Get counts and compare
	SFINISH_CHECK(DB_fetch_row(res) == DB_FETCH_OK, "DB_fetch_row failed");
	arr_row_values = DB_get_row_values(res);
	SFINISH_CHECK(arr_row_values != NULL, "DB_get_row_values failed");
	int_real_count = (size_t)strtol(DArray_get(arr_row_values, 0), NULL, 10);
	int_hash_count = (client_delete->str_hash_where_clause != NULL
						  ? (DArray_get(arr_row_values, 1) != NULL ? (size_t)strtol(DArray_get(arr_row_values, 1), NULL, 10) : 0)
						  : int_real_count);

	SDEBUG("client_delete->int_delete_count: %d", client_delete->int_delete_count);
	SDEBUG("int_real_count                 : %d", int_real_count);
	SDEBUG("int_hash_count                 : %d", int_hash_count);

	SFINISH_CHECK(client_delete->int_delete_count == int_real_count, "Some of these records have already been deleted.");
	SFINISH_CHECK(client_delete->int_delete_count == int_hash_count, "Someone updated this record before you.");

	DB_free_result(res);
	// Delete the rows
	if (DB_connection_driver(client_request->parent->conn) == DB_DRIVER_POSTGRES) {
		SFINISH_CAT_CSTR(str_sql, "DELETE FROM ", client_delete->str_real_table_name, " USING ",
			client_delete->str_temp_table_name, " WHERE ", client_delete->str_pk_where_clause, ";");
	} else {
		SFINISH_CAT_CSTR(str_sql, "MERGE INTO ", client_delete->str_real_table_name, " WITH (HOLDLOCK) "
																					 "USING ",
			client_delete->str_temp_table_name, " ", "ON ", client_delete->str_pk_where_clause, " ", "WHEN MATCHED ",
			"THEN DELETE;");
	}
	SFREE(client_delete->str_pk_where_clause);

	SFINISH_CHECK(DB_exec(EV_A, client_request->parent->conn, client_request, str_sql, ws_delete_step6), "DB_exec failed");

	bol_error_state = false;
	bol_ret = true;
finish:
	if (arr_row_values != NULL) {
		DArray_clear_destroy(arr_row_values);
	}
	if (bol_error_state == true) {
		bol_error_state = false;
		bol_ret = false;

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

		ws_delete_free(client_delete);
		// client_request_free(client_request);
		// client_request_free takes care of this
		// SFREE(client_delete);
	} else {
		SFREE(str_response);
	}
	DB_free_result(res);
	SFREE_ALL();
	return bol_ret;
}

bool ws_delete_step6(EV_P, void *cb_data, DB_result *res) {
	struct sock_ev_client_request *client_request = cb_data;
	struct sock_ev_client_delete *client_delete = (struct sock_ev_client_delete *)(client_request->vod_request_data);

	bool bol_ret = true;
	char *str_response = NULL;
	char str_temp[101];
	memset(str_temp, 0, 101);
	SDEFINE_VAR_ALL(str_rows);

	SFINISH_CHECK(res != NULL, "DB_exec failed");
	SFINISH_CHECK(res->status == DB_RES_COMMAND_OK, "DB_exec failed");

	SFINISH_SALLOC(str_rows, 20);
	sprintf(str_rows, "%zd", DB_rows_affected(res));
	str_rows = *str_rows == '\0' ? "0" : str_rows;

	DB_free_result(res);
	// Build first response (tells the client how many rows deleted)
	client_request->int_response_id += 1;
	snprintf(str_temp, 100, "%zd", client_request->int_response_id);

	SFINISH_CAT_CSTR(str_response, "messageid = ", client_request->str_message_id, "\012"
																				   "responsenumber = ",
		str_temp, "\012");
	if (client_request->str_transaction_id != NULL) {
		SFINISH_CAT_APPEND(str_response, "transactionid = ", client_request->str_transaction_id, "\012");
	}
	SFINISH_CAT_APPEND(str_response, "Rows Affected\012", str_rows, "\012");

	WS_sendFrame(EV_A, client_request->parent, true, 0x01, str_response, strlen(str_response));
	DArray_push(client_request->arr_response, str_response);

	// Build second response (tells the client we're done)
	client_request->int_response_id += 1;
	memset(str_temp, 0, 101);
	snprintf(str_temp, 100, "%zd", client_request->int_response_id);

	SFINISH_CAT_CSTR(str_response, "messageid = ", client_request->str_message_id, "\012"
																				   "responsenumber = ",
		str_temp, "\012");
	if (client_request->str_transaction_id != NULL) {
		SFINISH_CAT_APPEND(str_response, "transactionid = ", client_request->str_transaction_id, "\012");
	}
	SFINISH_CAT_APPEND(str_response, "TRANSACTION COMPLETED");

	WS_sendFrame(EV_A, client_request->parent, true, 0x01, str_response, strlen(str_response));
	DArray_push(client_request->arr_response, str_response);
	str_response = NULL;

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
	} else {
		SFREE(str_response);
	}
	DB_free_result(res);
	ws_delete_free(client_delete);
	// client_request_free(client_request);
	// client_request_free takes care of this
	// SFREE(client_delete);
	SFREE_ALL();
	return bol_ret;
}

void ws_delete_free(struct sock_ev_client_delete *to_free) {
	SFREE(to_free->str_pk_where_clause);
	SFREE(to_free->str_hash_where_clause);
	SFREE(to_free->str_real_table_name);
	SFREE(to_free->str_temp_table_name);
#ifndef POSTAGE_INTERFACE_LIBPQ
	SFREE(to_free->str_insert_column_names);
	SFREE(to_free->str_insert_parameter_markers);
#endif
	SFREE(to_free->str_identity_column_name);
	SFREE(to_free->str_sql);
}
