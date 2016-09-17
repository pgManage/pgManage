#include "ws_insert.h"

char *ws_insert_step1(struct sock_ev_client_request *client_request) {
	struct sock_ev_client_insert *client_insert = (struct sock_ev_client_insert *)(client_request->vod_request_data);
	SDEFINE_VAR_ALL(str_temp, str_temp1, str_sql, str_col_name, str_col_seq);
	char *str_response = NULL;
	char *ptr_pk = NULL;
	char *ptr_end_pk = NULL;
	char *ptr_seq = NULL;
	char *ptr_end_seq = NULL;
	char *ptr_column_names = NULL;
	char *ptr_end_column_names = NULL;

	client_request->arr_response = DArray_create(sizeof(char *), 1);

	// This is a name used for a temporary statement to get the column types
	if (DB_connection_driver(client_request->parent->conn) == DB_DRIVER_POSTGRES) {
		SFINISH_CAT_CSTR(client_insert->str_temp_table_name, "temp_insert");
	} else {
		SFINISH_CAT_CSTR(client_insert->str_temp_table_name, "#temp_insert");
	}

	// Get table names and return columns
	SFINISH_ERROR_CHECK((client_insert->str_real_table_name = get_table_name(client_request->ptr_query)) != NULL,
		"Failed to get table name from query");
	// DEBUG("client_insert->str_real_table_name: %s",
	// client_insert->str_real_table_name);

	SFINISH_ERROR_CHECK((client_insert->str_return_columns =
								get_return_columns(client_request->ptr_query, client_insert->str_real_table_name)) != NULL,
		"Failed to get return columns from query");

#ifndef POSTAGE_INTERFACE_LIBPQ
	SFINISH_ERROR_CHECK((client_insert->str_return_escaped_columns = get_return_escaped_columns(
							 DB_connection_driver(client_request->parent->conn), client_request->ptr_query)) != NULL,
		"Failed to get escaped return columns from query");
	SDEBUG("client_insert->str_return_escaped_columns: %s", client_insert->str_return_escaped_columns);
#endif
	// DEBUG("client_insert->str_return_columns:  %s",
	// client_insert->str_return_columns);

	ptr_pk = strstr(client_request->ptr_query, "PK");
	SFINISH_CHECK(ptr_pk != NULL, "could not find \"PK\", malformed request?");
	ptr_end_pk = strstr(ptr_pk, "\012");
	*ptr_end_pk = 0;
	ptr_pk += 3;
	SDEBUG("ptr_pk: %s", ptr_pk);

	ptr_seq = strstr(ptr_end_pk + 1, "SEQ");
	SFINISH_CHECK(ptr_seq != NULL, "could not find \"SEQ\", malformed request?");
	ptr_end_seq = strstr(ptr_seq, "\012");
	*ptr_end_seq = 0;
	ptr_seq += 4;
	SDEBUG("ptr_seq: %s", ptr_seq);

	client_insert->ptr_values = ptr_end_seq + 1;
	while (*client_insert->ptr_values == '\012') {
		client_insert->ptr_values += 1;
	}
	SDEBUG("client_insert->ptr_values: %s", client_insert->ptr_values);

	ptr_column_names = client_insert->ptr_values;
	SFINISH_CHECK(*ptr_column_names != 0, "No column names");
	ptr_end_column_names = strstr(ptr_column_names, "\012");
	SFINISH_CHECK(ptr_end_column_names != NULL, "No insert data");
	*ptr_end_column_names = 0;
	client_insert->ptr_values = ptr_end_column_names + 1;

	SFINISH_CAT_CSTR(client_insert->str_column_names, ptr_column_names);

	// Replace double quotes with double double quotes (this allows double quotes
	// within column names)
	SFINISH_REPLACE(client_insert->str_column_names, "\"", "\"\"", "g");
	// Replace tabs with "\",\"" so that we can use them in an sql statement
	SFINISH_REPLACE(client_insert->str_column_names, "\t", "\",\"", "g");
	// unescape the column names
	str_temp = unescape_value(client_insert->str_column_names);
	SFINISH_CHECK(str_temp != NULL, "unescape_value failed, malformed request?");
	SFREE(client_insert->str_column_names);
	SFINISH_CAT_CSTR(client_insert->str_column_names, "\"", str_temp, "\"");
	SFREE(str_temp);

#ifndef POSTAGE_INTERFACE_LIBPQ
	SFINISH_CAT_CSTR(client_insert->str_insert_column_names, "");
	SFINISH_CAT_CSTR(client_insert->str_insert_parameter_markers, "");
#endif
	SFINISH_CAT_CSTR(client_insert->str_pk_join_clause, "");
	SFINISH_CAT_CSTR(client_insert->str_pk_where_clause, ""); //"id = lastval()");
	size_t int_i = 0, int_j = 0, int_k = 0, int_length = 0;
	while (ptr_pk < ptr_end_pk) {
		// PK name
		int_length = strcspn(ptr_pk, "\t\012");
		SFINISH_SALLOC(str_col_name, int_length + 1);
		memcpy(str_col_name, ptr_pk, int_length);
		str_col_name[int_length] = '\0';
		ptr_pk += int_length + 1;

		str_temp1 = DB_escape_identifier(client_request->parent->conn, str_col_name, int_length);
		SFINISH_CHECK(str_temp1 != NULL, "unescape_value failed, malformed request?");
		SFREE(str_col_name);
		str_col_name = str_temp1;
		str_temp1 = NULL;

		// PK sequence
		int_length = strcspn(ptr_seq, "\t\012");
		SFINISH_SALLOC(str_col_seq, int_length + 1);
		memcpy(str_col_seq, ptr_seq, int_length);
		str_col_seq[int_length] = '\0';
		ptr_seq += int_length + 1;

		str_temp1 = DB_escape_literal(client_request->parent->conn, str_col_seq, int_length);
		SFINISH_CHECK(str_temp1 != NULL, "unescape_value failed, malformed request?");
		SFREE(str_col_seq);
		str_col_seq = str_temp1;
		str_temp1 = NULL;

		SFREE(str_temp1);

		if (strncmp(str_col_seq, "''", 2) != 0) {
			if (DB_connection_driver(client_request->parent->conn) == DB_DRIVER_POSTGRES) {
				SFINISH_CAT_APPEND(client_insert->str_pk_where_clause, (int_i > 0 ? " AND " : ""),
					client_insert->str_real_table_name, ".", str_col_name, " = currval(", str_col_seq, "::name::regclass)");
			} else {
				SFINISH_CAT_APPEND(client_insert->str_pk_where_clause, (int_i > 0 ? " AND " : ""),
					client_insert->str_real_table_name, ".", str_col_name,
					" = IDENT_CURRENT(", str_col_seq, ")");
			}

		} else {
			if (strstr(client_insert->str_column_names, str_col_name) == NULL) {
				int_j += 1;
				SFINISH_CHECK(int_j == 1, "Only one PK column allowed to not have an unspecified value");
				if (DB_connection_driver(client_request->parent->conn) == DB_DRIVER_POSTGRES) {
					SFINISH_CAT_APPEND(client_insert->str_pk_where_clause, (int_i > 0 ? " AND " : ""),
						client_insert->str_real_table_name, ".", str_col_name, " = lastval()");
				} else {
					SFINISH_CAT_APPEND(client_insert->str_pk_where_clause, (int_i > 0 ? " AND " : ""),
						client_insert->str_real_table_name, ".", str_col_name, " = SCOPE_IDENTITY()");
					SFINISH_CAT_CSTR(client_insert->str_identity_column_name, str_col_name);
				}
			} else {
				SFINISH_CAT_APPEND(client_insert->str_pk_join_clause, (int_k > 0 ? " AND " : ""),
					client_insert->str_real_table_name, ".", str_col_name, " = ", client_insert->str_temp_table_name, ".",
					str_col_name);
				SFINISH_CAT_APPEND(client_insert->str_pk_where_clause, (int_i > 0 ? " AND " : ""),
					client_insert->str_temp_table_name, ".", str_col_name, " IS NOT NULL");
			}
		}
		int_i += 1;
		SFREE(str_col_name);
	}

	SDEBUG("client_insert->str_pk_join_clause : %s", client_insert->str_pk_join_clause);
	SDEBUG("client_insert->str_pk_where_clause: %s", client_insert->str_pk_where_clause);

#ifndef POSTAGE_INTERFACE_LIBPQ
	while (ptr_column_names < ptr_end_column_names) {
		SDEBUG("ptr_column_names                           : %s", ptr_column_names);
		int_length = strcspn(ptr_column_names, "\t\012");
		SFINISH_SALLOC(str_col_name, int_length + 1);
		memcpy(str_col_name, ptr_column_names, int_length);
		str_col_name[int_length] = '\0';
		ptr_column_names += int_length + 1;

		SFINISH_REPLACE(str_col_name, "\"", "\"\"", "g");
		str_temp1 = unescape_value(str_col_name);
		SFINISH_CHECK(str_temp1 != NULL, "unescape_value failed, malformed request?");
		SFREE(str_col_name);
		SFINISH_CAT_CSTR(str_col_name, "\"", str_temp1, "\"");
		SFREE(str_temp1);

		SFINISH_CAT_APPEND(
			client_insert->str_insert_column_names, str_col_name, (ptr_column_names < ptr_end_column_names ? ", " : ""));
		SDEBUG("str_col_name                               : %s", str_col_name);

		if (DB_connection_driver(client_request->parent->conn) == DB_DRIVER_POSTGRES) {
			SFINISH_CAT_APPEND(
				client_insert->str_insert_parameter_markers, "E?", (ptr_column_names < ptr_end_column_names ? ", " : ""));
		} else {
			SFINISH_CAT_APPEND(
				client_insert->str_insert_parameter_markers, "?", (ptr_column_names < ptr_end_column_names ? ", " : ""));
		}

		SFREE(str_col_name);
	}

	SDEBUG("client_insert->str_insert_column_names     : %s", client_insert->str_insert_column_names);
	SDEBUG("client_insert->str_insert_parameter_markers: %s", client_insert->str_insert_parameter_markers);
#endif

	// Create first temp table (this one holds the data from the client)
	if (DB_connection_driver(client_request->parent->conn) == DB_DRIVER_POSTGRES) {
		SFINISH_CAT_CSTR(str_sql, "CREATE TEMP TABLE ", client_insert->str_temp_table_name, " ON COMMIT DROP AS\n", "SELECT ",
			client_insert->str_column_names, " FROM ", client_insert->str_real_table_name, " LIMIT 0;");
		DB_exec(global_loop, client_request->parent->conn, client_request, str_sql, ws_insert_step2);
	} else {
#ifndef POSTAGE_INTERFACE_LIBPQ
		if (client_insert->str_identity_column_name != NULL) {
			SFINISH_CAT_CSTR(str_sql, "IF OBJECT_ID('tempdb..", client_insert->str_temp_table_name,
				"') IS NOT NULL\n\tDROP TABLE ", client_insert->str_temp_table_name, "\n",
				"SELECT TOP 0 CAST('' AS timestamp) AS identity_temp_123123123123123, ", client_insert->str_identity_column_name,
				" AS id_temp123123123, ", client_insert->str_column_names, " INTO ", client_insert->str_temp_table_name, " FROM ",
				client_insert->str_real_table_name, ";");
			DB_exec(global_loop, client_request->parent->conn, client_request, str_sql, ws_insert_step15_sql_server);
		} else {
			SFINISH_CAT_CSTR(str_sql, "IF OBJECT_ID('tempdb..", client_insert->str_temp_table_name,
				"') IS NOT NULL\n\tDROP TABLE ", client_insert->str_temp_table_name, "\n",
				"SELECT TOP 0 CAST('' AS timestamp) AS identity_temp_123123123123123, ", client_insert->str_column_names,
				" INTO ", client_insert->str_temp_table_name, " FROM ", client_insert->str_real_table_name, ";");
			DB_exec(global_loop, client_request->parent->conn, client_request, str_sql, ws_insert_step2);
		}
#endif
	}

	bol_error_state = false;
finish:
	if (bol_error_state == true) {
		bol_error_state = false;

		char str_temp2[101] = {0};
		client_request->int_response_id += 1;
		memset(str_temp2, 0, 101);
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
		ws_insert_free(client_insert);
	}
	SFREE_ALL();
	return str_response;
}
#ifndef POSTAGE_INTERFACE_LIBPQ
bool ws_insert_step15_sql_server(EV_P, void *cb_data, DB_result *res) {
	struct sock_ev_client_request *client_request = cb_data;
	struct sock_ev_client_insert *client_insert = (struct sock_ev_client_insert *)(client_request->vod_request_data);
	char str_temp[101];
	bool bol_ret = true;
	char *str_response = NULL;
	SDEFINE_VAR_ALL(str_sql);
	SFINISH_CAT_CSTR(str_response, "");

	SFINISH_CHECK(res != NULL, "DB_exec failed");
	SFINISH_CHECK(res->status == DB_RES_COMMAND_OK, "DB_exec failed");

	DB_free_result(res);

	SFINISH_CAT_CSTR(str_sql, "ALTER TABLE ", client_insert->str_temp_table_name, " DROP COLUMN id_temp123123123;");
	SDEBUG("str_sql: %s", str_sql);

	SFINISH_CHECK(DB_exec(EV_A, client_request->parent->conn, client_request, str_sql, ws_insert_step2), "DB_exec failed");

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

		ws_insert_free(client_insert);
		// client_request_free(client_request);
		// client_request_free takes care of this
		// SFREE(client_insert);
	} else {
		SFREE(str_response);
	}
	DB_free_result(res);
	SFREE_ALL();
	return bol_ret;
}
#endif

bool ws_insert_step2(EV_P, void *cb_data, DB_result *res) {
	struct sock_ev_client_request *client_request = cb_data;
	struct sock_ev_client_insert *client_insert = (struct sock_ev_client_insert *)(client_request->vod_request_data);
	size_t int_len_content;
	SDEFINE_VAR_ALL(str_sql);
	char *str_response = NULL;
	bool bol_ret = true;
	SFINISH_CAT_CSTR(str_response, "");

	SFINISH_CHECK(res != NULL, "DB_exec failed");
	SFINISH_CHECK(res->status == DB_RES_COMMAND_OK, "DB_exec failed");

// Start copying into the first temp table
#ifdef POSTAGE_INTERFACE_LIBPQ
	SFINISH_CAT_CSTR(str_sql, "COPY ", client_insert->str_temp_table_name, " FROM STDIN;");
#else
	SFINISH_CAT_CSTR(str_sql, "INSERT INTO ", client_insert->str_temp_table_name, " (", client_insert->str_insert_column_names,
		") VALUES (", client_insert->str_insert_parameter_markers, ")");
	SDEBUG("str_sql: %s", str_sql);
#endif

	int_len_content =
		client_request->frame->int_length - (size_t)(client_insert->ptr_values - client_request->frame->str_message);
	SFINISH_CHECK(int_len_content > 0, "No insert data");
	DB_copy_in(
		EV_A, client_request->parent->conn, client_request, client_insert->ptr_values, int_len_content, str_sql, ws_insert_step4);

	DB_free_result(res);

	bol_error_state = false;
	bol_ret = true;
finish:
	SFREE_ALL();
	if (bol_error_state == true) {
		bol_error_state = false;
		bol_ret = false;

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
		ws_insert_free(client_insert);
		// client_request_free(client_request);
		// client_request_free takes care of this
		// SFREE(client_insert);
	} else {
		SFREE(str_response);
	}
	DB_free_result(res);
	return bol_ret;
}

bool ws_insert_step4(EV_P, void *cb_data, DB_result *res) {
	struct sock_ev_client_request *client_request = cb_data;
	struct sock_ev_client_insert *client_insert = (struct sock_ev_client_insert *)(client_request->vod_request_data);
	SDEFINE_VAR_ALL(str_sql);
	char *str_response = NULL;
	bool bol_ret = true;

	SFINISH_CHECK(res != NULL, "DB_exec failed");
	SFINISH_CHECK(res->status == DB_RES_COMMAND_OK, "DB_exec failed");

	client_request->int_num_rows = DB_rows_affected(res);

	DB_free_result(res);

	// Create second temp table
	// This will hold all of the records with sequences, triggers, etc...
	if (DB_connection_driver(client_request->parent->conn) == DB_DRIVER_POSTGRES) {
		SFINISH_CAT_CSTR(str_sql, "CREATE TEMP TABLE ", client_insert->str_temp_table_name, "_2", " ON COMMIT DROP AS\n",
			"SELECT ", client_insert->str_return_columns, " FROM ", client_insert->str_real_table_name, " LIMIT 0;");
	} else {
		if (client_insert->str_identity_column_name != NULL) {
			SFINISH_CAT_CSTR(str_sql, "IF OBJECT_ID('tempdb..", client_insert->str_temp_table_name,
				"_2') IS NOT NULL\n\tDROP TABLE ", client_insert->str_temp_table_name, "_2\n", "SELECT TOP 0 ",
				client_insert->str_identity_column_name, " AS id_temp123123123, ", client_insert->str_return_columns, " INTO ",
				client_insert->str_temp_table_name, "_2 FROM ", client_insert->str_real_table_name, "; "
																									"ALTER TABLE ",
				client_insert->str_temp_table_name, "_2 DROP COLUMN id_temp123123123;");
		} else {
			SFINISH_CAT_CSTR(str_sql, "IF OBJECT_ID('tempdb..", client_insert->str_temp_table_name,
				"_2') IS NOT NULL\n\tDROP TABLE ", client_insert->str_temp_table_name, "_2\n", "SELECT TOP 0 ",
				client_insert->str_return_columns, " INTO ", client_insert->str_temp_table_name, "_2 FROM ",
				client_insert->str_real_table_name, ";");
		}
	}

	DB_exec(EV_A, client_request->parent->conn, client_request, str_sql, ws_insert_step5);

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
		ws_insert_free(client_insert);
		// client_request_free(client_request);
		// client_request_free takes care of this
		// SFREE(client_insert);
	}
	DB_free_result(res);
	return bol_ret;
}

bool ws_insert_step5(EV_P, void *cb_data, DB_result *res) {
	struct sock_ev_client_request *client_request = cb_data;
	struct sock_ev_client_insert *client_insert = (struct sock_ev_client_insert *)(client_request->vod_request_data);
	char *str_response = NULL;
	bool bol_ret = true;
	size_t int_i = 0;
	char str_i[101];
	SDEFINE_VAR_ALL(str_sql, str_insert_columns, str_replace_table_name);
	SFINISH_CAT_CSTR(str_response, "");

	SFINISH_CHECK(res != NULL, "DB_exec failed");
	SFINISH_CHECK(res->status == DB_RES_COMMAND_OK, "DB_exec failed");

	DB_free_result(res);

	client_insert->darr_insert_queries = DArray_create(sizeof(char *), 10);

	SFINISH_CAT_CSTR(str_replace_table_name, client_insert->str_real_table_name, ".");
	SFINISH_CAT_CSTR(str_insert_columns, client_insert->str_return_columns);
	SFINISH_REPLACE(str_insert_columns, str_replace_table_name, "", "g");

	for (int_i = 0; int_i < client_request->int_num_rows; int_i += 1) {
		memset(str_i, 0, 101);
		if (DB_connection_driver(client_request->parent->conn) == DB_DRIVER_POSTGRES) {
			snprintf(str_i, 100, "%zd", int_i);
			SFINISH_CAT_CSTR(str_sql, "INSERT INTO ", client_insert->str_real_table_name, " (", client_insert->str_column_names,
				")", "\n", "SELECT ", client_insert->str_column_names, "\n", "       FROM ", client_insert->str_temp_table_name,
				"\n", "       LIMIT 1", "\n", "       OFFSET ", str_i, ";", "\n");
		} else {
			snprintf(str_i, 100, "%zd", int_i + 1);
			SFINISH_CAT_CSTR(str_sql, "INSERT INTO ", client_insert->str_real_table_name, " (", client_insert->str_column_names,
				")", "\n", "SELECT ", client_insert->str_column_names, "\n", "       FROM ( SELECT ",
				client_insert->str_column_names, ", ROW_NUMBER() OVER (ORDER BY identity_temp_123123123123123) row_num FROM ",
				client_insert->str_temp_table_name, ") em\n", "       WHERE row_num = ", str_i, ";", "\n");
		}

		DArray_push(client_insert->darr_insert_queries, str_sql);
		str_sql = NULL;

		if (client_insert->str_pk_join_clause == NULL || client_insert->str_pk_join_clause[0] == 0) {
			SFINISH_CAT_CSTR(str_sql, "INSERT INTO ", client_insert->str_temp_table_name, "_2 (", str_insert_columns, ")", "\n",
				"SELECT ", client_insert->str_return_columns, "\n", "       FROM ", client_insert->str_real_table_name,
				"       WHERE ", client_insert->str_pk_where_clause, ";", "\n\n");

			DArray_push(client_insert->darr_insert_queries, str_sql);
			str_sql = NULL;
		}
	}

	if (client_insert->str_pk_join_clause != NULL && client_insert->str_pk_join_clause[0] != 0) {
		SFINISH_CAT_CSTR(str_sql, "\n", "INSERT INTO ", client_insert->str_temp_table_name, "_2 (", str_insert_columns, ")", "\n",
			"SELECT ", client_insert->str_return_columns, "\n", "       FROM ", client_insert->str_real_table_name,
			"       LEFT JOIN ", client_insert->str_temp_table_name, " ON ", client_insert->str_pk_join_clause, "\n",
			"       WHERE ", client_insert->str_pk_where_clause, ";", "\n\n");

		DArray_push(client_insert->darr_insert_queries, str_sql);
		str_sql = NULL;
	}

	SDEBUG("INSERTING...");
	SDEBUG("DArray_get(client_insert->darr_insert_queries, client_insert->int_current_insert_query): %s",
		DArray_get(client_insert->darr_insert_queries, client_insert->int_current_insert_query));
	DB_exec(EV_A, client_request->parent->conn, client_request,
		DArray_get(client_insert->darr_insert_queries, client_insert->int_current_insert_query++), ws_insert_step6);

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
		ws_insert_free(client_insert);
		// client_request_free(client_request);
		// client_request_free takes care of this
		// SFREE(client_insert);
	} else {
		SFREE(str_response);
	}
	DB_free_result(res);
	return bol_ret;
}

bool ws_insert_step6(EV_P, void *cb_data, DB_result *res) {
	struct sock_ev_client_request *client_request = cb_data;
	struct sock_ev_client_insert *client_insert = (struct sock_ev_client_insert *)(client_request->vod_request_data);
	SDEFINE_VAR_ALL(str_temp, str_sql);
	char *str_response = NULL;
	bool bol_ret = true;
	SFINISH_CAT_CSTR(str_response, "");

	SFINISH_CHECK(res != NULL, "DB_exec failed");
	SFINISH_CHECK(res->status == DB_RES_COMMAND_OK, "DB_exec failed");

	SDEBUG("DArray_get(client_insert->darr_insert_queries, client_insert->int_current_insert_query): %s",
		DArray_get(client_insert->darr_insert_queries, client_insert->int_current_insert_query));
	if (client_insert->int_current_insert_query < (DArray_end(client_insert->darr_insert_queries) - 1)) {
		DB_exec(EV_A, client_request->parent->conn, client_request,
			DArray_get(client_insert->darr_insert_queries, client_insert->int_current_insert_query++), ws_insert_step6);
	} else {
		DB_exec(EV_A, client_request->parent->conn, client_request,
			DArray_get(client_insert->darr_insert_queries, client_insert->int_current_insert_query), ws_insert_step7);
	}

	bol_error_state = false;
	bol_ret = true;
finish:
	SFREE_ALL();
	if (bol_error_state == true) {
		bol_ret = false;
		bol_error_state = false;

		client_request->int_response_id += 1;
		SFINISH_SALLOC(str_temp, 100 * sizeof(char));
		snprintf(str_temp, 100, "%zd", client_request->int_response_id);

		char *_str_response = str_response;
		SFINISH_CAT_CSTR(str_response, "messageid = ", client_request->str_message_id, "\012"
																					   "responsenumber = ",
			str_temp, "\012");
		SFREE(str_temp);
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
		ws_insert_free(client_insert);
		// client_request_free(client_request);
		// client_request_free takes care of this
		// SFREE(client_insert);
	} else {
		SFREE(str_response);
	}
	DB_free_result(res);
	return bol_ret;
}

bool ws_insert_step7(EV_P, void *cb_data, DB_result *res) {
	struct sock_ev_client_request *client_request = cb_data;
	struct sock_ev_client_insert *client_insert = (struct sock_ev_client_insert *)(client_request->vod_request_data);
	char *str_response = NULL;
	bool bol_ret = true;
	SDEFINE_VAR_ALL(str_temp, str_sql);
	SFINISH_CAT_CSTR(str_response, "");

	SFINISH_CHECK(res != NULL, "DB_exec failed");
	SFINISH_CHECK(res->status == DB_RES_COMMAND_OK, "DB_exec failed");

	SDEBUG("...DONE INSERTING");
	// Replace the real table name with the second temp table name in the return
	// columns
	SFINISH_CAT_CSTR(str_temp, client_insert->str_temp_table_name, "_2");
	SFINISH_REPLACE(client_insert->str_return_columns, client_insert->str_real_table_name, str_temp, "g");

	DB_free_result(res);

#ifdef POSTAGE_INTERFACE_LIBPQ
	SFINISH_CAT_CSTR(str_sql, "COPY (SELECT ", client_insert->str_return_columns, " FROM ", client_insert->str_temp_table_name,
		"_2) TO STDOUT;");
#else
	SFINISH_CAT_CSTR(
		str_sql, "SELECT ", client_insert->str_return_escaped_columns, " FROM ", client_insert->str_temp_table_name, "_2;");
#endif
	SDEBUG("str_sql: >%s<", str_sql);

	SFINISH_CHECK(
		DB_copy_out(EV_A, client_request->parent->conn, client_request, str_sql, ws_copy_check_cb), "DB_copy_out failed!");

	bol_error_state = false;
	bol_ret = true;
finish:
	SFREE_ALL();
	if (bol_error_state == true) {
		bol_ret = false;
		bol_error_state = false;

		client_request->int_response_id += 1;
		SFINISH_SALLOC(str_temp, 100 * sizeof(char));
		snprintf(str_temp, 100, "%zd", client_request->int_response_id);

		char *_str_response = str_response;
		SFINISH_CAT_CSTR(str_response, "messageid = ", client_request->str_message_id, "\012"
																					   "responsenumber = ",
			str_temp, "\012");
		SFREE(str_temp);
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
		ws_insert_free(client_insert);
		// client_request_free(client_request);
		// client_request_free takes care of this
		// SFREE(client_insert);
	} else {
		SFREE(str_response);
	}
	DB_free_result(res);
	return bol_ret;
}

void ws_insert_free(struct sock_ev_client_insert *to_free) {
	if (to_free->darr_insert_queries != NULL) {
		DArray_clear_destroy(to_free->darr_insert_queries);
		to_free->darr_insert_queries = NULL;
	}
	SFREE(to_free->str_return_columns);
#ifndef POSTAGE_INTERFACE_LIBPQ
	SFREE(to_free->str_return_escaped_columns);
	SFREE(to_free->str_insert_column_names);
	SFREE(to_free->str_insert_parameter_markers);
#endif
	SFREE(to_free->str_pk_where_clause);
	SFREE(to_free->str_pk_join_clause);
	SFREE(to_free->str_column_names);
	SFREE(to_free->str_real_table_name);
	SFREE(to_free->str_temp_table_name);
	SFREE(to_free->str_sequence_name);
	SFREE(to_free->str_sql);
	if (to_free->darr_column_types != NULL) {
		DArray_clear_destroy(to_free->darr_column_types);
		to_free->darr_column_types = NULL;
	}
	if (to_free->darr_column_values != NULL) {
		DArray_clear_destroy(to_free->darr_column_values);
		to_free->darr_column_values = NULL;
	}
	SFREE(to_free->str_result);
	SFREE(to_free->str_identity_column_name);
}
