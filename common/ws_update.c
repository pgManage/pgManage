#include "ws_update.h"

char *ws_update_step1(struct sock_ev_client_request *client_request) {
	struct sock_ev_client_update *client_update = (struct sock_ev_client_update *)(client_request->vod_request_data);
	// DEBUG("UPDATE BEGIN");
	SDEFINE_VAR_ALL(str_col_name, str_sql, str_temp);
	char *str_response = NULL;
	char *str_temp1 = NULL;
	char *str_where_temp = NULL;
	size_t int_length;
	size_t int_where_temp_len = 0;
	size_t int_temp_col_list_len = 0;
	size_t int_col_name_len = 0;
	size_t int_temp_len = 0;
	size_t int_identity_column_name_len = 0;
	size_t int_sql_len = 0;
	size_t int_response_len = 0;

	client_request->arr_response = DArray_create(sizeof(char *), 1);

	char *ptr_pk_header = NULL;
	char *ptr_name_header = NULL;
	char *ptr_pk_header_end = NULL;
	char *ptr_name_header_end = NULL;

	if (DB_connection_driver(client_request->parent->conn) == DB_DRIVER_POSTGRES) {
		SFINISH_SNCAT(client_update->str_temp_table_name, &client_update->int_temp_table_name_len,
			"temp_update", (size_t)11);
	} else {
		SFINISH_SNCAT(client_update->str_temp_table_name, &client_update->int_temp_table_name_len,
			"#temp_update", (size_t)12);
	}

	// Get table names and return columns
	client_update->str_real_table_name = get_table_name(
		client_request->ptr_query, (size_t)(client_request->frame->int_length - (size_t)(client_request->ptr_query - client_request->frame->str_message)),
		&client_update->int_real_table_name_len
	);
	SFINISH_ERROR_CHECK(client_update->str_real_table_name != NULL, "Query failed:\nFATAL\nerror_detail\tERROR: Failed to get table name from query.\n");
	// DEBUG("client_update->str_real_table_name: %s",
	// client_update->str_real_table_name);

	client_update->str_return_columns = get_return_columns(
		client_request->ptr_query, (size_t)(client_request->frame->int_length - (size_t)(client_request->ptr_query - client_request->frame->str_message)),
		client_update->str_real_table_name, client_update->int_real_table_name_len,
		&client_update->int_return_columns_len
	);
	SFINISH_ERROR_CHECK(client_update->str_return_columns != NULL, "Failed to get return columns from query");

#ifndef POSTAGE_INTERFACE_LIBPQ
	client_update->str_return_escaped_columns = get_return_escaped_columns(
		DB_connection_driver(client_request->parent->conn),
		client_request->ptr_query, (size_t)(client_request->frame->int_length - (size_t)(client_request->ptr_query - client_request->frame->str_message)),
		&client_update->int_return_escaped_columns_len
	);
	SFINISH_ERROR_CHECK(client_update->str_return_escaped_columns != NULL, "Failed to get escaped return columns from query");
#endif

	client_update->str_hash_where_clause = get_hash_columns(
		client_request->ptr_query, (size_t)(client_request->frame->int_length - (size_t)(client_request->ptr_query - client_request->frame->str_message)),
		&client_update->int_hash_where_clause_len
	);
	SFREE(str_global_error);

	if (client_update->str_hash_where_clause != NULL) {
		SFINISH_BREPLACE(client_update->str_hash_where_clause, &client_update->int_hash_where_clause_len, "\"", "\"\"", "g");

		if (DB_connection_driver(client_request->parent->conn) == DB_DRIVER_POSTGRES) {
			SFINISH_BREPLACE(client_update->str_hash_where_clause, &client_update->int_hash_where_clause_len, "\t", "\"::text, '') || '\t' || COALESCE(\"", "g");
			SFINISH_SNCAT(str_where_temp, &int_where_temp_len,
				client_update->str_temp_table_name, strlen(client_update->str_temp_table_name),
				"_hash = MD5(COALESCE(\"", (size_t)22,
				client_update->str_hash_where_clause, client_update->int_hash_where_clause_len,
				"\"::text, ''))", (size_t)13);
		} else {
			SFINISH_BREPLACE(client_update->str_hash_where_clause, &client_update->int_hash_where_clause_len, "\t",
				"\" AS nvarchar(MAX)), CAST('' AS nvarchar(MAX))) + CAST('\t' AS nvarchar(MAX)) + COALESCE(CAST(\"", "g");
			SFINISH_SNCAT(str_where_temp, &int_where_temp_len,
				client_update->str_temp_table_name, client_update->int_temp_table_name_len,
				"_hash = LOWER(CONVERT(nvarchar(MAX), HashBytes('MD5', COALESCE(CAST(\"", (size_t)69, client_update->str_hash_where_clause, strlen(client_update->str_hash_where_clause),
				"\" AS nvarchar(MAX)), CAST('' AS nvarchar(MAX)))), 2))", (size_t)53);
		}
		SFREE(client_update->str_hash_where_clause);
		client_update->str_hash_where_clause = str_where_temp;
		client_update->int_hash_where_clause_len = int_where_temp_len;
		str_where_temp = NULL;
	}

	SDEBUG("client_update->str_hash_where_clause: %s", client_update->str_hash_where_clause);

	////GET POINTERS SET TO BEGINNING OF HEADERS
	char *_____str_temp = "HASH";
	client_update->ptr_query = bstrstr(
		client_request->ptr_query, (size_t)(client_request->frame->int_length - (size_t)(client_request->ptr_query - client_request->frame->str_message)),
		"HASH", (size_t)4
	);
	if (client_update->ptr_query == NULL) {
		client_update->ptr_query = bstrstr(
			client_request->ptr_query, (size_t)(client_request->frame->int_length - (size_t)(client_request->ptr_query - client_request->frame->str_message)),
			"RETURN", (size_t)6
		);
		_____str_temp = "RETURN";
	}
	SFINISH_CHECK(client_update->ptr_query != NULL, "Could not find RETURN clause");
	client_update->ptr_query = bstrstr(
		client_update->ptr_query, (size_t)(client_request->frame->int_length - (size_t)(client_update->ptr_query - client_request->frame->str_message)),
		"\012", (size_t)1
	);
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
	SFINISH_SNCAT(client_update->str_pk_join_clause, &client_update->int_pk_join_clause_len,
		"", (size_t)0);
	SFINISH_SNCAT(client_update->str_pk_where_clause, &client_update->int_pk_where_clause_len,
		"", (size_t)0);
	SFINISH_SNCAT(client_update->str_temp_col_list, &int_temp_col_list_len,
		"", (size_t)0);
	SFINISH_SNCAT(client_update->str_set_col_list, &client_update->int_set_col_list_len,
		"", (size_t)0);
#ifndef POSTAGE_INTERFACE_LIBPQ
	SFINISH_SNCAT(client_update->str_insert_column_names, &client_update->int_insert_column_names_len,
		"", (size_t)0);
	SFINISH_SNCAT(client_update->str_insert_parameter_markers, &client_update->int_insert_parameter_markers_len,
		"", (size_t)0);
#endif

	while (ptr_pk_header < ptr_pk_header_end || ptr_name_header < ptr_name_header_end) {
		SFINISH_CHECK(ptr_pk_header < ptr_pk_header_end, "Extra column name");
		SFINISH_CHECK(ptr_name_header < ptr_name_header_end, "Extra column purpose");

		// name
		int_length = strncspn(ptr_name_header, (size_t)(ptr_name_header_end - ptr_name_header), "\t\012", (size_t)2);
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
		ptr_pk_header += strncspn(ptr_pk_header, (size_t)(ptr_pk_header_end - ptr_pk_header), "\t\012", (size_t)2) + 1;
		*(ptr_pk_header - 1) = 0;
		SDEBUG("str_pk_header: %s", str_pk_header);

		SFINISH_BREPLACE(str_col_name, &int_length, "\"", "\"\"", "g");
		str_temp1 = bunescape_value(str_col_name, &int_length);
		SFINISH_CHECK(str_temp1 != NULL, "bunescape_value failed, malformed request?");
		SFREE(str_col_name);
		SFINISH_SNCAT(str_col_name, &int_col_name_len,
			"\"", (size_t)1,
			str_temp1, strlen(str_temp1),
			"\"", (size_t)1);
		SFINISH_SNCAT(str_temp, &int_temp_len,
			"\"", (size_t)1,
			str_pk_header, strlen(str_pk_header),
			str_temp1, strlen(str_temp1),
			"\"", (size_t)1);

		SFREE(str_temp1);

		if (strncmp(str_pk_header, "pk", 2) == 0) {
			if (DB_connection_driver(client_request->parent->conn) == DB_DRIVER_POSTGRES) {
				SFINISH_SNFCAT(client_update->str_pk_join_clause, &client_update->int_pk_join_clause_len,
					int_x == 0 ? "" : " AND ", strlen(int_x == 0 ? "" : " AND "),
					client_update->str_temp_table_name, client_update->int_temp_table_name_len,
					".", (size_t)1,
					str_temp, strlen(str_temp),
					" IS NOT DISTINCT FROM ", (size_t)22,
					client_update->str_real_table_name, client_update->int_real_table_name_len,
					".", (size_t)1,
					str_col_name, int_col_name_len);
				SFINISH_SNFCAT(client_update->str_pk_where_clause, &client_update->int_pk_where_clause_len,
					int_x == 0 ? "" : " AND ", strlen(int_x == 0 ? "" : " AND "),
					client_update->str_real_table_name, client_update->int_real_table_name_len,
					".", (size_t)1,
					str_col_name, int_col_name_len,
					" = ANY(array(SELECT ", (size_t)20,
					client_update->str_temp_table_name, client_update->int_temp_table_name_len,
					".", (size_t)1,
					str_temp, strlen(str_temp),
					" FROM ", (size_t)6,
					client_update->str_temp_table_name, client_update->int_temp_table_name_len,
					"))", (size_t)2);
			} else {
				SFINISH_SNFCAT(client_update->str_pk_join_clause, &client_update->int_pk_join_clause_len,
					int_x == 0 ? "" : " AND ", strlen(int_x == 0 ? "" : " AND "),
					client_update->str_temp_table_name, client_update->int_temp_table_name_len,
					".", (size_t)1,
					str_temp, strlen(str_temp),
					" = ", (size_t)3,
					client_update->str_real_table_name, client_update->int_real_table_name_len,
					".", (size_t)1,
					str_col_name, int_col_name_len);
				SFINISH_SNFCAT(client_update->str_pk_where_clause, &client_update->int_pk_where_clause_len,
					int_x == 0 ? "" : " AND ", strlen(int_x == 0 ? "" : " AND "),
					client_update->str_temp_table_name, client_update->int_temp_table_name_len,
					".", (size_t)1,
					str_temp, strlen(str_temp),
					" = ", (size_t)3,
					client_update->str_real_table_name, client_update->int_real_table_name_len,
					".", (size_t)1,
					str_col_name, int_col_name_len);

				if (client_update->str_identity_column_name == NULL) {
					SFINISH_SNCAT(client_update->str_identity_column_name, &int_identity_column_name_len,
						str_col_name, int_col_name_len);
				}
			}
			int_x++;
		} else if (strncmp(str_pk_header, "set", 3) == 0) {
			SFINISH_SNFCAT(client_update->str_set_col_list, &client_update->int_set_col_list_len,
				int_y == 0 ? "" : ", ", strlen(int_y == 0 ? "" : ", "),
				str_col_name, int_col_name_len,
				" = ", (size_t)3,
				client_update->str_temp_table_name, client_update->int_temp_table_name_len,
				".", (size_t)1,
				str_temp, strlen(str_temp));
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
				SFINISH_SNFCAT(client_update->str_temp_col_list, &int_temp_col_list_len,
					int_i == 0 ? "" : ", ", strlen(int_i == 0 ? "" : ", "),
					"''::text AS ", (size_t)12,
					client_update->str_temp_table_name, client_update->int_temp_table_name_len,
					"_hash", (size_t)5);
			} else {
				SFINISH_SNFCAT(client_update->str_temp_col_list, &int_temp_col_list_len,
					int_i == 0 ? "" : ", ", strlen(int_i == 0 ? "" : ", "),
					"CAST('' AS nvarchar(40)) AS ", (size_t)28,
					client_update->str_temp_table_name, client_update->int_temp_table_name_len,
					"_hash", (size_t)5);
			}

#ifndef POSTAGE_INTERFACE_LIBPQ
			SFINISH_SNFCAT(client_update->str_insert_column_names, &client_update->int_insert_column_names_len,
				client_update->str_temp_table_name, client_update->int_temp_table_name_len,
				"_hash", (size_t)5,
				ptr_pk_header < ptr_pk_header_end ? ", " : "", (size_t)(ptr_pk_header < ptr_pk_header_end ? 2 : 0));
			SFINISH_SNFCAT(client_update->str_insert_parameter_markers, &client_update->int_insert_parameter_markers_len,
				"?", (size_t)1,
				ptr_pk_header < ptr_pk_header_end ? ", " : "", (size_t)(ptr_pk_header < ptr_pk_header_end ? 2 : 0));
#endif
		} else {
			size_t int_insert_parameter_markers_len = 0;
			SFINISH_SNFCAT(client_update->str_temp_col_list, &int_temp_col_list_len,
				int_i == 0 ? "" : ", ", strlen(int_i == 0 ? "" : ", "),
				str_col_name, int_col_name_len,
				" AS ", (size_t)4,
				str_temp, int_temp_len);

#ifndef POSTAGE_INTERFACE_LIBPQ
			SFINISH_SNFCAT(client_update->str_insert_column_names, &client_update->int_insert_column_names_len,
				str_temp, int_temp_len,
				ptr_pk_header < ptr_pk_header_end ? ", " : "", (size_t)(ptr_pk_header < ptr_pk_header_end ? 2 : 0));
			if (DB_connection_driver(client_request->parent->conn) == DB_DRIVER_POSTGRES) {
				SFINISH_SNFCAT(
					client_update->str_insert_parameter_markers, &client_update->int_insert_parameter_markers_len,
					"E?", (size_t)2,
					ptr_pk_header < ptr_pk_header_end ? ", " : "", (size_t)(ptr_pk_header < ptr_pk_header_end ? 2 : 0));
			} else {
				SFINISH_SNFCAT(
					client_update->str_insert_parameter_markers, &client_update->int_insert_parameter_markers_len,
					"?", (size_t)1,
					ptr_pk_header < ptr_pk_header_end ? ", " : "", (size_t)(ptr_pk_header < ptr_pk_header_end ? 2 : 0));
			}
#endif
		}

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
		SFINISH_SNCAT(str_sql, &int_sql_len,
			"CREATE TEMP TABLE ", (size_t)18,
			client_update->str_temp_table_name, client_update->int_temp_table_name_len,
			" ON COMMIT DROP AS SELECT ", (size_t)26,
			client_update->str_temp_col_list, int_temp_col_list_len,
			" FROM ", (size_t)6,
			client_update->str_real_table_name, client_update->int_real_table_name_len,
			" LIMIT 0;", (size_t)9);

		SDEBUG("str_sql: %s", str_sql);
		SFINISH_CHECK(
			DB_exec(global_loop, client_request->parent->conn, client_request, str_sql, ws_update_step2), "DB_exec failed");
	} else {
#ifndef POSTAGE_INTERFACE_LIBPQ
		SDEBUG("client_update->str_insert_column_names: %p", client_update->str_insert_column_names);
		SDEBUG("client_update->str_insert_column_names: %s", client_update->str_insert_column_names);
		if (client_update->str_identity_column_name != NULL) {
			SFINISH_SNCAT(str_sql, &int_sql_len,
				"IF OBJECT_ID('tempdb..", (size_t)22,
				client_update->str_temp_table_name, client_update->int_temp_table_name_len,
				"') IS NOT NULL\n\tDROP TABLE ", (size_t)27,
				client_update->str_temp_table_name, client_update->int_temp_table_name_len,
				"\nSELECT TOP 0 ", (size_t)14,
				client_update->str_identity_column_name, int_identity_column_name_len,
				" AS id_temp123123123, ", (size_t)22,
				client_update->str_temp_col_list, int_temp_col_list_len,
				" INTO ", (size_t)6,
				client_update->str_temp_table_name, client_update->int_temp_table_name_len,
				" FROM ", (size_t)6,
				client_update->str_real_table_name, client_update->int_real_table_name_len,
				";", (size_t)1);

			SDEBUG("str_sql: %s", str_sql);
			SFINISH_CHECK(
				DB_exec(global_loop, client_request->parent->conn, client_request, str_sql, ws_update_step15_sql_server),
				"DB_exec failed");
		} else {
			SFINISH_SNCAT(str_sql, &int_sql_len,
				"IF OBJECT_ID('tempdb..", (size_t)22,
				client_update->str_temp_table_name, client_update->int_temp_table_name_len,
				"') IS NOT NULL\n\tDROP TABLE ", (size_t)27,
				client_update->str_temp_table_name, client_update->int_temp_table_name_len,
				"\nSELECT TOP 0 ", (size_t)14,
				client_update->str_temp_col_list, int_temp_col_list_len,
				" INTO ", (size_t)6,
				client_update->str_temp_table_name, client_update->int_temp_table_name_len,
				" FROM ", (size_t)6,
				client_update->str_real_table_name, client_update->int_real_table_name_len,
				";", (size_t)1);

			SDEBUG("str_sql: %s", str_sql);
			SFINISH_CHECK(
				DB_exec(global_loop, client_request->parent->conn, client_request, str_sql, ws_update_step2), "DB_exec failed");
		}
		SDEBUG("client_update->str_insert_column_names: %p", client_update->str_insert_column_names);
		SDEBUG("client_update->str_insert_column_names: %s", client_update->str_insert_column_names);
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
		SFINISH_SNCAT(str_response, &int_response_len,
			"messageid = ", (size_t)12,
			client_request->str_message_id, strlen(client_request->str_message_id),
			"\012responsenumber = ", (size_t)18,
			str_temp, strlen(str_temp),
			"\012", (size_t)1);
		if (client_request->str_transaction_id != NULL) {
			SFINISH_SNFCAT(str_response, &int_response_len,
				"transactionid = ", (size_t)16,
				client_request->str_transaction_id, strlen(client_request->str_transaction_id),
				"\012", (size_t)1);
		}
		SFINISH_SNFCAT(str_response, &int_response_len,
			_str_response, strlen(_str_response));
		SFREE(_str_response);

		WS_sendFrame(global_loop, client_request->parent, true, 0x01, str_response, int_response_len);
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
	size_t int_response_len = 0;
	size_t int_sql_len = 0;

	SDEFINE_VAR_ALL(str_sql);
	SFINISH_SNCAT(str_response, &int_response_len,
		"", (size_t)0);

	SFINISH_CHECK(res != NULL, "DB_exec failed");
	SFINISH_CHECK(res->status == DB_RES_COMMAND_OK, "DB_exec failed");

	DB_free_result(res);

	SFINISH_SNCAT(str_sql, &int_sql_len,
		"ALTER TABLE ", (size_t)12,
		client_update->str_temp_table_name, client_update->int_temp_table_name_len,
		" DROP COLUMN id_temp123123123;", (size_t)30);
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
		SFINISH_SNCAT(str_response, &int_response_len,
			"messageid = ", (size_t)12,
			client_request->str_message_id, strlen(client_request->str_message_id),
			"\012responsenumber = ", (size_t)18,
			str_temp, strlen(str_temp),
			"\012", (size_t)1);
		if (client_request->str_transaction_id != NULL) {
			SFINISH_SNFCAT(str_response, &int_response_len,
				"transactionid = ", (size_t)16,
				client_request->str_transaction_id, strlen(client_request->str_transaction_id),
				"\012", (size_t)1);
		}
		SFINISH_SNFCAT(str_response, &int_response_len,
			_str_response, strlen(_str_response));
		SFREE(_str_response);
		_str_response = DB_get_diagnostic(client_request->parent->conn, res);
		SFINISH_SNFCAT(str_response, &int_response_len,
			":\n", (size_t)2,
			_str_response, strlen(_str_response));
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
	size_t int_response_len = 0;
	size_t int_sql_len = 0;
	bool bol_ret = true;
	char *str_response = NULL;
	char str_temp[101];
	SDEFINE_VAR_ALL(str_sql);
	SFINISH_SNCAT(str_response, &int_response_len,
		"", (size_t)0);

	SFINISH_CHECK(res != NULL, "DB_exec failed");
	SFINISH_CHECK(res->status == DB_RES_COMMAND_OK, "DB_exec failed");

	// Start copying into temp table
#ifdef POSTAGE_INTERFACE_LIBPQ
	SFINISH_SNCAT(str_sql, &int_sql_len,
		"COPY ", (size_t)5,
		client_update->str_temp_table_name, client_update->int_temp_table_name_len,
		" FROM STDIN;", (size_t)12);
#else
	SFINISH_SNCAT(str_sql, &int_sql_len,
		"INSERT INTO ", (size_t)12,
		client_update->str_temp_table_name, client_update->int_temp_table_name_len,
		" (", (size_t)2,
		client_update->str_insert_column_names, client_update->int_insert_column_names_len,
		") VALUES (", (size_t)10,
		client_update->str_insert_parameter_markers, client_update->int_insert_parameter_markers_len,
		")", (size_t)1);
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
		SFINISH_SNCAT(str_response, &int_response_len,
			"messageid = ", (size_t)12,
			client_request->str_message_id, strlen(client_request->str_message_id),
			"\012responsenumber = ", (size_t)18,
			str_temp, strlen(str_temp),
			"\012", (size_t)1);
		if (client_request->str_transaction_id != NULL) {
			SFINISH_SNFCAT(str_response, &int_response_len,
				"transactionid = ", (size_t)16,
				client_request->str_transaction_id, strlen(client_request->str_transaction_id),
				"\012", (size_t)1);
		}
		SFINISH_SNFCAT(str_response, &int_response_len,
			_str_response, strlen(_str_response));
		SFREE(_str_response);
		_str_response = DB_get_diagnostic(client_request->parent->conn, res);
		SFINISH_SNFCAT(str_response, &int_response_len,
			":\n", (size_t)2,
			_str_response, strlen(_str_response));
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
	size_t int_response_len = 0;
	size_t int_sql_len = 0;

	SFINISH_CHECK(res != NULL, "DB_exec failed");
	SFINISH_CHECK(res->status == DB_RES_COMMAND_OK, "DB_exec failed");

	if (client_update->int_update_count == 0) {
		client_update->int_update_count = DB_rows_affected(res);
	}

	if (DB_connection_driver(client_request->parent->conn) == DB_DRIVER_POSTGRES) {
		if (client_update->str_hash_where_clause != NULL) {
			SFINISH_SNCAT(str_sql, &int_sql_len,
				"SELECT count(*), sum(CASE WHEN ", (size_t)31,
				client_update->str_hash_where_clause, client_update->int_hash_where_clause_len,
				" THEN 1 ELSE 0 END) FROM ", (size_t)25,
				client_update->str_temp_table_name, client_update->int_temp_table_name_len,
				" INNER JOIN ", (size_t)12,
				client_update->str_real_table_name, client_update->int_real_table_name_len,
				" ON ", (size_t)4,
				client_update->str_pk_join_clause, client_update->int_pk_join_clause_len,
				" WHERE ", (size_t)7,
				client_update->str_pk_where_clause, client_update->int_pk_where_clause_len,
				";", (size_t)1);
		} else {
			SFINISH_SNCAT(str_sql, &int_sql_len,
				"SELECT count(*) FROM ", (size_t)21,
				client_update->str_temp_table_name, client_update->int_temp_table_name_len,
				" INNER JOIN ", (size_t)12,
				client_update->str_real_table_name, client_update->int_real_table_name_len,
				" ON ", (size_t)4,
				client_update->str_pk_join_clause, client_update->int_pk_join_clause_len,
				" WHERE ", (size_t)7,
				client_update->str_pk_where_clause, client_update->int_pk_where_clause_len,
				";", (size_t)1);
		}
	} else {
		if (client_update->str_hash_where_clause != NULL) {
			SFINISH_SNCAT(str_sql, &int_sql_len,
				"SELECT CAST(count(*) AS nvarchar(MAX)), CAST(sum(CASE WHEN ", (size_t)59,
				client_update->str_hash_where_clause, client_update->int_hash_where_clause_len,
				" THEN 1 ELSE 0 END) AS nvarchar(MAX)) FROM ", (size_t)43,
				client_update->str_temp_table_name, client_update->int_temp_table_name_len,
				" INNER JOIN ", (size_t)12,
				client_update->str_real_table_name, client_update->int_real_table_name_len,
				" ON ", (size_t)4,
				client_update->str_pk_join_clause, client_update->int_pk_join_clause_len,
				";", (size_t)1);
		} else {
			SFINISH_SNCAT(str_sql, &int_sql_len,
				"SELECT CAST(count(*) AS nvarchar(MAX)) FROM ", (size_t)44,
				client_update->str_temp_table_name, client_update->int_temp_table_name_len,
				" INNER JOIN ", (size_t)12,
				client_update->str_real_table_name, client_update->int_real_table_name_len,
				" ON ", (size_t)4,
				client_update->str_pk_join_clause, client_update->int_pk_join_clause_len,
				";", (size_t)1);
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
		SFINISH_SNCAT(str_response, &int_response_len,
			"messageid = ", (size_t)12,
			client_request->str_message_id, strlen(client_request->str_message_id),
			"\012responsenumber = ", (size_t)18,
			str_temp, strlen(str_temp),
			"\012", (size_t)1);
		if (client_request->str_transaction_id != NULL) {
			SFINISH_SNFCAT(str_response, &int_response_len,
				"transactionid = ", (size_t)16,
				client_request->str_transaction_id, strlen(client_request->str_transaction_id),
				"\012", (size_t)1);
		}
		SFINISH_SNFCAT(str_response, &int_response_len,
			_str_response, strlen(_str_response));
		SFREE(_str_response);
		_str_response = DB_get_diagnostic(client_request->parent->conn, res);
		SFINISH_SNFCAT(str_response, &int_response_len,
			":\n", (size_t)2,
			_str_response, strlen(_str_response));
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
	size_t int_response_len = 0;
	size_t int_sql_len = 0;
	bool bol_ret = true;
	DArray *arr_row_values = NULL;
	size_t int_real_count;
	size_t int_hash_count;
	char *str_response = NULL;
	SFINISH_SNCAT(str_response, &int_response_len,
		"", (size_t)0);

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
		SFINISH_SNCAT(str_sql, &int_sql_len,
			"UPDATE ", (size_t)7,
			client_update->str_real_table_name, client_update->int_real_table_name_len,
			" SET ", (size_t)5,
			client_update->str_set_col_list, client_update->int_set_col_list_len,
			" FROM ", (size_t)6,
			client_update->str_temp_table_name, client_update->int_temp_table_name_len,
			" WHERE ", (size_t)7,
			client_update->str_pk_join_clause, client_update->int_pk_join_clause_len,
			" AND ", (size_t)5,
			client_update->str_pk_where_clause, client_update->int_pk_where_clause_len,
			";", (size_t)1);
	} else {
		SFINISH_SNCAT(str_sql, &int_sql_len,
			"MERGE INTO ", (size_t)11,
			client_update->str_real_table_name, client_update->int_real_table_name_len,
			" WITH (HOLDLOCK) USING ", (size_t)23,
			client_update->str_temp_table_name, client_update->int_temp_table_name_len,
			" ON ", (size_t)4,
			client_update->str_pk_join_clause, client_update->int_pk_join_clause_len,
			" WHEN MATCHED THEN UPDATE SET ", (size_t)30,
			client_update->str_set_col_list, client_update->int_set_col_list_len,
			";", (size_t)1);
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
		SFINISH_SNCAT(str_response, &int_response_len,
			"messageid = ", (size_t)12,
			client_request->str_message_id, strlen(client_request->str_message_id),
			"\012responsenumber = ", (size_t)18,
			str_temp, strlen(str_temp),
			"\012", (size_t)1);
		if (client_request->str_transaction_id != NULL) {
			SFINISH_SNFCAT(str_response, &int_response_len,
				"transactionid = ", (size_t)16,
				client_request->str_transaction_id, strlen(client_request->str_transaction_id),
				"\012", (size_t)1);
		}
		SFINISH_SNFCAT(str_response, &int_response_len,
			_str_response, strlen(_str_response));
		SFREE(_str_response);
		_str_response = DB_get_diagnostic(client_request->parent->conn, res);
		SFINISH_SNFCAT(str_response, &int_response_len,
			":\n", (size_t)2,
			_str_response, strlen(_str_response));
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
	size_t int_sql_len = 0;
	size_t int_response_len = 0;
	char str_temp[101];
	SDEFINE_VAR_ALL(str_sql);
	SFINISH_SNCAT(str_response, &int_response_len,
		"", (size_t)0);

	SFINISH_CHECK(res != NULL, "DB_exec failed");
	SFINISH_CHECK(res->status == DB_RES_COMMAND_OK, "DB_exec failed");

	DB_free_result(res);
// Start copying into temp table
#ifdef POSTAGE_INTERFACE_LIBPQ
	SFINISH_SNCAT(str_sql, &int_sql_len,
		"COPY (SELECT ", (size_t)13,
		client_update->str_return_columns, client_update->int_return_columns_len,
		" FROM ", (size_t)6,
		client_update->str_real_table_name, client_update->int_real_table_name_len,
		" LEFT JOIN ", (size_t)11,
		client_update->str_temp_table_name, client_update->int_temp_table_name_len,
		" ON ", (size_t)4,
		client_update->str_pk_join_clause, client_update->int_pk_join_clause_len,
		" WHERE ", (size_t)7,
		client_update->str_pk_where_clause, client_update->int_pk_where_clause_len,
		") TO STDOUT;", (size_t)12);
#else
	SFINISH_SNCAT(str_sql, &int_sql_len,
		"SELECT ", (size_t)7,
		client_update->str_return_escaped_columns, client_update->int_return_escaped_columns_len,
		" FROM ", (size_t)6,
		client_update->str_real_table_name, client_update->int_real_table_name_len,
		" LEFT JOIN ", (size_t)11,
		client_update->str_temp_table_name, client_update->int_temp_table_name_len,
		" ON ", (size_t)4,
		client_update->str_pk_join_clause, client_update->int_pk_join_clause_len,
		" WHERE ", (size_t)7,
		client_update->str_pk_where_clause, client_update->int_pk_where_clause_len,
		";", (size_t)1);
#endif

	SDEBUG("str_sql: %s", str_sql);
	SFINISH_CHECK(
		DB_copy_out(EV_A, client_request->parent->conn, client_request, str_sql, ws_copy_check_cb), "DB_copy_out failed!");

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
		SFINISH_SNCAT(str_response, &int_response_len,
			"messageid = ", (size_t)12,
			client_request->str_message_id, strlen(client_request->str_message_id),
			"\012responsenumber = ", (size_t)18,
			str_temp, strlen(str_temp),
			"\012", (size_t)1);
		if (client_request->str_transaction_id != NULL) {
			SFINISH_SNFCAT(str_response, &int_response_len,
				"transactionid = ", (size_t)16,
				client_request->str_transaction_id, strlen(client_request->str_transaction_id),
				"\012", (size_t)1);
		}
		SFINISH_SNFCAT(str_response, &int_response_len,
			_str_response, strlen(_str_response));
		SFREE(_str_response);
		_str_response = DB_get_diagnostic(client_request->parent->conn, res);
		SFINISH_SNFCAT(str_response, &int_response_len,
			":\n", (size_t)2,
			_str_response, strlen(_str_response));
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
