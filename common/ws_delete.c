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
	size_t int_where_temp_len = 0;
	size_t int_col_name_len = 0;
	size_t int_temp_len = 0;
	size_t int_temp_col_list_len = 0;
	size_t int_sql_len = 0;
	size_t int_response_len = 0;

	client_request->arr_response = DArray_create(sizeof(char *), 1);

	char *ptr_pk_header = NULL;
	char *ptr_pk_header_end = NULL;
	char *ptr_name_header = NULL;
#ifndef POSTAGE_INTERFACE_LIBPQ
	char *ptr_name_header_end = NULL;
#endif

	SDEFINE_VAR_ALL(str_temp_col_list, str_col_name, str_sql, str_where_temp);

	if (DB_connection_driver(client_request->parent->conn) == DB_DRIVER_POSTGRES) {
		SFINISH_SNCAT(client_delete->str_temp_table_name, &client_delete->int_temp_table_name_len,
			"temp_delete", (size_t)11);
	} else {
		SFINISH_SNCAT(client_delete->str_temp_table_name, &client_delete->int_temp_table_name_len,
			"#temp_delete", (size_t)12);
	}

	// Get table names and return columns
	SFINISH_ERROR_CHECK((client_delete->str_real_table_name = get_table_name(client_request->ptr_query)) != NULL,
		"Failed to get table name from query");
	client_delete->int_real_table_name_len = strlen(client_delete->str_real_table_name);

	client_delete->str_hash_where_clause = get_hash_columns(client_request->ptr_query);
	SFREE(str_global_error);

	if (client_delete->str_hash_where_clause != NULL) {
		client_delete->int_hash_where_clause_len = strlen(client_delete->str_hash_where_clause);
		SFINISH_BREPLACE(client_delete->str_hash_where_clause, &client_delete->int_hash_where_clause_len, "\"", "\"\"", "g");
		if (DB_connection_driver(client_request->parent->conn) == DB_DRIVER_POSTGRES) {
			SFINISH_BREPLACE(client_delete->str_hash_where_clause, &client_delete->int_hash_where_clause_len, "\t", "\"::text, '') || '\t' || COALESCE(\"", "g");
			client_delete->int_hash_where_clause_len = strlen(client_delete->str_hash_where_clause);
			SFINISH_SNCAT(str_where_temp, &int_where_temp_len,
				client_delete->str_temp_table_name, client_delete->int_temp_table_name_len,
				"_hash = MD5(COALESCE(\"", (size_t)22,
				client_delete->str_hash_where_clause, client_delete->int_hash_where_clause_len,
				"\"::text, ''))", (size_t)13);
		} else {
			SFINISH_BREPLACE(client_delete->str_hash_where_clause, &client_delete->int_hash_where_clause_len, "\t",
				"\" AS nvarchar(MAX)), CAST('' AS nvarchar(MAX))) + CAST('\t' AS nvarchar(MAX)) + COALESCE(CAST(\"", "g");
			client_delete->int_hash_where_clause_len = strlen(client_delete->str_hash_where_clause);
			SFINISH_SNCAT(str_where_temp, &int_where_temp_len,
				client_delete->str_temp_table_name, client_delete->int_temp_table_name_len,
				"_hash = LOWER(CONVERT(nvarchar(MAX), HashBytes('MD5', COALESCE(CAST(\"", (size_t)69, client_delete->str_hash_where_clause, client_delete->int_hash_where_clause_len,
				"\" AS nvarchar(MAX)), CAST('' AS nvarchar(MAX)))), 2))", (size_t)53);
		}
		SFREE(client_delete->str_hash_where_clause);
		client_delete->str_hash_where_clause = str_where_temp;
		client_delete->int_hash_where_clause_len = int_where_temp_len;
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
	SFINISH_SNCAT(client_delete->str_pk_where_clause, &client_delete->int_pk_where_clause_len,
		"", (size_t)0);
	SFINISH_SNCAT(str_temp_col_list, &int_temp_col_list_len,
		"", (size_t)0);
#ifndef POSTAGE_INTERFACE_LIBPQ
	SFINISH_SNCAT(client_delete->str_insert_column_names, &client_delete->int_insert_column_names_len,
		str_col_name, int_col_name_len,
		"", (size_t)0);
	SFINISH_SNCAT(client_delete->str_insert_parameter_markers, &client_delete->int_insert_parameter_markers_len,
		"", (size_t)0);
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

		SFINISH_BREPLACE(str_col_name, &int_length, "\"", "\"\"", "g");
		str_temp1 = bunescape_value(str_col_name, &int_length);
		SDEBUG("str_temp1: %s", str_temp1);
		SFINISH_CHECK(str_temp1 != NULL, "bunescape_value failed, malformed request?");
		SFREE(str_col_name);
		SFINISH_SNCAT(str_col_name, &int_col_name_len,
			"\"", (size_t)1,
			str_temp1, int_length,
			"\"", (size_t)1);
		SFINISH_SNCAT(str_temp, &int_temp_len,
			"\"", (size_t)1,
			str_pk_header, strlen(str_pk_header),
			str_temp1, int_length,
			"\"", (size_t)1);

		SFREE(str_temp1);

		if (strncmp(str_pk_header, "hash", 4) == 0) {
			if (DB_connection_driver(client_request->parent->conn) == DB_DRIVER_POSTGRES) {
				SFINISH_SNFCAT(str_temp_col_list, &int_temp_col_list_len,
					int_i == 0 ? "" : ", ", strlen(int_i == 0 ? "" : ", "),
					"''::text AS ", (size_t)12,
					client_delete->str_temp_table_name, client_delete->int_temp_table_name_len,
					"_hash", (size_t)5);
			} else {
				SFINISH_SNFCAT(str_temp_col_list, &int_temp_col_list_len,
					int_i == 0 ? "" : ", ", strlen(int_i == 0 ? "" : ", "),
					"CAST('' AS nvarchar(40)) AS ", (size_t)28,
					client_delete->str_temp_table_name, client_delete->int_temp_table_name_len,
					"_hash", (size_t)5);
			}
#ifndef POSTAGE_INTERFACE_LIBPQ
			SFINISH_SNFCAT(client_delete->str_insert_column_names, &client_delete->int_insert_column_names_len,
				client_delete->str_temp_table_name, client_delete->int_temp_table_name_len,
				"_hash", (size_t)5,
				ptr_name_header < ptr_name_header_end ? ", " : "",
				strlen(ptr_name_header < ptr_name_header_end ? ", " : ""));
			SFINISH_SNFCAT(client_delete->str_insert_parameter_markers, &client_delete->int_insert_parameter_markers_len,
				"?", (size_t)1,
				ptr_name_header < ptr_name_header_end ? ", " : "", strlen(ptr_name_header < ptr_name_header_end ? ", " : ""));
#endif
		} else {
			SDEBUG("str_col_name: %s", str_col_name);
			SFINISH_SNFCAT(str_temp_col_list, &int_temp_col_list_len,
				int_i == 0 ? "" : ", ", strlen(int_i == 0 ? "" : ", "),
				str_col_name, int_col_name_len,
				" AS ", (size_t)4,
				str_temp, strlen(str_temp));
#ifndef POSTAGE_INTERFACE_LIBPQ
			SFINISH_SNFCAT(
				client_delete->str_insert_column_names, &client_delete->int_insert_column_names_len,
				str_temp, strlen(str_temp),
				ptr_name_header < ptr_name_header_end ? ", " : "", (size_t)(ptr_name_header < ptr_name_header_end ? 2 : 0)
			);
			if (DB_connection_driver(client_request->parent->conn) == DB_DRIVER_POSTGRES) {
				SFINISH_SNFCAT(client_delete->str_insert_parameter_markers, &client_delete->int_insert_parameter_markers_len,
					"E?", (size_t)2,
					ptr_name_header < ptr_name_header_end ? ", " : "",
					strlen(ptr_name_header < ptr_name_header_end ? ", " : ""));
			} else {
				SFINISH_SNFCAT(client_delete->str_insert_parameter_markers, &client_delete->int_insert_parameter_markers_len,
					"?", (size_t)1,
					ptr_name_header < ptr_name_header_end ? ", " : "",
					strlen(ptr_name_header < ptr_name_header_end ? ", " : ""));
			}
#endif
		}

		if (strncmp(str_pk_header, "pk", 2) == 0) {
			if (DB_connection_driver(client_request->parent->conn) == DB_DRIVER_POSTGRES) {
				SFINISH_SNFCAT(client_delete->str_pk_where_clause, &client_delete->int_pk_where_clause_len,
					int_x == 0 ? "" : " AND ", strlen(int_x == 0 ? "" : " AND "),
					client_delete->str_temp_table_name, client_delete->int_temp_table_name_len,
					".", (size_t)1,
					str_temp, strlen(str_temp),
					" IS NOT DISTINCT FROM ", (size_t)22,
					client_delete->str_real_table_name, client_delete->int_real_table_name_len,
					".", (size_t)1,
					str_col_name, int_col_name_len);
			} else {
				SFINISH_SNFCAT(client_delete->str_pk_where_clause, &client_delete->int_pk_where_clause_len,
					int_x == 0 ? "" : " AND ", strlen(int_x == 0 ? "" : " AND "),
					client_delete->str_temp_table_name, client_delete->int_temp_table_name_len,
					".", (size_t)1,
					str_temp, strlen(str_temp),
					" = ", (size_t)3,
					client_delete->str_real_table_name, client_delete->int_real_table_name_len,
					".", (size_t)1,
					str_col_name, int_col_name_len);

				if (client_delete->str_identity_column_name == NULL) {
					SFINISH_SNCAT(client_delete->str_identity_column_name, &client_delete->int_identity_column_name_len,
						str_col_name, int_col_name_len);
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
		SFINISH_SNCAT(str_sql, &int_sql_len,
			"CREATE TEMP TABLE ", (size_t)18,
			client_delete->str_temp_table_name, client_delete->int_temp_table_name_len,
			" ON COMMIT DROP AS SELECT ", (size_t)26,
			str_temp_col_list, int_temp_col_list_len,
			" FROM ", (size_t)6,
			client_delete->str_real_table_name, client_delete->int_real_table_name_len,
			" LIMIT 0;", (size_t)9);

		SDEBUG("str_sql: %s", str_sql);
		SFINISH_CHECK(
			DB_exec(global_loop, client_request->parent->conn, client_request, str_sql, ws_delete_step2), "DB_exec failed");
	} else {
#ifndef POSTAGE_INTERFACE_LIBPQ
		if (client_delete->str_identity_column_name != NULL) {
			SFINISH_SNCAT(str_sql, &int_sql_len,
				"IF OBJECT_ID('tempdb..", (size_t)22,
				client_delete->str_temp_table_name, client_delete->int_temp_table_name_len,
				"') IS NOT NULL\n\tDROP TABLE ", (size_t)27,
				client_delete->str_temp_table_name, client_delete->int_temp_table_name_len,
				"\nSELECT TOP 0 ", (size_t)14,
				client_delete->str_identity_column_name, client_delete->int_identity_column_name_len,
				" AS id_temp123123123, ", (size_t)22,
				str_temp_col_list, int_temp_col_list_len,
				" INTO ", (size_t)6,
				client_delete->str_temp_table_name, client_delete->int_temp_table_name_len,
				" FROM ", (size_t)6,
				client_delete->str_real_table_name, client_delete->int_real_table_name_len,
				";", (size_t)1);

			SDEBUG("str_sql: %s", str_sql);
			SFINISH_CHECK(
				DB_exec(global_loop, client_request->parent->conn, client_request, str_sql, ws_delete_step15_sql_server),
				"DB_exec failed");
		} else {
			SFINISH_SNCAT(str_sql, &int_sql_len,
				"IF OBJECT_ID('tempdb..", (size_t)22,
				client_delete->str_temp_table_name, client_delete->int_temp_table_name_len,
				"') IS NOT NULL\n\tDROP TABLE ", (size_t)27,
				client_delete->str_temp_table_name, client_delete->int_temp_table_name_len,
				"\nSELECT TOP 0 ", (size_t)14,
				str_temp_col_list, int_temp_col_list_len,
				" INTO ", (size_t)6,
				client_delete->str_temp_table_name, client_delete->int_temp_table_name_len,
				" FROM ", (size_t)6,
				client_delete->str_real_table_name, client_delete->int_real_table_name_len,
				";", (size_t)1);

			SDEBUG("str_sql: %s", str_sql);
			SFINISH_CHECK(
				DB_exec(global_loop, client_request->parent->conn, client_request, str_sql, ws_delete_step2), "DB_exec failed");
		}
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
		SFINISH_SNCAT(str_response, &int_response_len,
			"messageid = ", (size_t)12,
			client_request->str_message_id, strlen(client_request->str_message_id),
			"\012responsenumber = ", (size_t)18,
			str_temp2, strlen(str_temp2),
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
	size_t int_response_len = 0;
	size_t int_sql_len = 0;
	SFINISH_SNCAT(str_response, &int_response_len,
		"", (size_t)0);

	SFINISH_CHECK(res != NULL, "DB_exec failed");
	SFINISH_CHECK(res->status == DB_RES_COMMAND_OK, "DB_exec failed");

	DB_free_result(res);

	SFINISH_SNCAT(str_sql, &int_sql_len,
		"ALTER TABLE ", (size_t)12,
		client_delete->str_temp_table_name, client_delete->int_temp_table_name_len,
		" DROP COLUMN id_temp123123123;", (size_t)30);
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
	size_t int_response_len = 0;
	size_t int_sql_len = 0;
	SDEFINE_VAR_ALL(str_sql);
	SFINISH_SNCAT(str_response, &int_response_len,
		"", (size_t)0);

	SFINISH_CHECK(res != NULL, "DB_exec failed");
	SFINISH_CHECK(res->status == DB_RES_COMMAND_OK, "DB_exec failed");

	DB_free_result(res);
// Start copying into temp table
#ifdef POSTAGE_INTERFACE_LIBPQ
	SFINISH_SNCAT(str_sql, &int_sql_len,
		"COPY ", (size_t)5,
		client_delete->str_temp_table_name, client_delete->int_temp_table_name_len,
		" FROM STDIN;", (size_t)12);
#else
	SFINISH_SNCAT(str_sql, &int_sql_len,
		"INSERT INTO ", (size_t)12,
		client_delete->str_temp_table_name, client_delete->int_temp_table_name_len,
		" (", (size_t)2,
		client_delete->str_insert_column_names, client_delete->int_insert_column_names_len,
		") VALUES (", (size_t)10,
		client_delete->str_insert_parameter_markers, client_delete->int_insert_parameter_markers_len,
		")", (size_t)1);
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
	size_t int_sql_len = 0;
	size_t int_response_len = 0;
	SDEFINE_VAR_ALL(str_sql);

	SFINISH_CHECK(res != NULL, "DB_copy_in failed");
	SFINISH_CHECK(res->status == DB_RES_COMMAND_OK, "DB_copy_in failed");

	if (client_delete->int_delete_count == 0) {
		client_delete->int_delete_count = (size_t)DB_rows_affected(res);
	}

	DB_free_result(res);

	if (DB_connection_driver(client_request->parent->conn) == DB_DRIVER_POSTGRES) {
		if (client_delete->str_hash_where_clause != NULL) {
			SFINISH_SNCAT(str_sql, &int_sql_len,
				"SELECT count(*), sum(CASE WHEN ", (size_t)31,
				client_delete->str_hash_where_clause, client_delete->int_hash_where_clause_len,
				" THEN 1 ELSE 0 END) FROM ", (size_t)25,
				client_delete->str_temp_table_name, client_delete->int_temp_table_name_len,
				" INNER JOIN ", (size_t)12,
				client_delete->str_real_table_name, client_delete->int_real_table_name_len,
				" ON ", (size_t)4,
				client_delete->str_pk_where_clause, client_delete->int_pk_where_clause_len,
				";", (size_t)1);
		} else {
			SFINISH_SNCAT(str_sql, &int_sql_len,
				"SELECT count(*) FROM ", (size_t)21,
				client_delete->str_temp_table_name, client_delete->int_temp_table_name_len,
				" INNER JOIN ", (size_t)12,
				client_delete->str_real_table_name, client_delete->int_real_table_name_len,
				" ON ", (size_t)4,
				client_delete->str_pk_where_clause, client_delete->int_pk_where_clause_len,
				";", (size_t)1);
		}
	} else {
		if (client_delete->str_hash_where_clause != NULL) {
			SFINISH_SNCAT(str_sql, &int_sql_len,
				"SELECT CAST(count(*) AS nvarchar(MAX)), CAST(sum(CASE WHEN ", (size_t)59,
				client_delete->str_hash_where_clause, client_delete->int_hash_where_clause_len,
				" THEN 1 ELSE 0 END) AS nvarchar(MAX)) FROM ", (size_t)43,
				client_delete->str_temp_table_name, client_delete->int_temp_table_name_len,
				" INNER JOIN ", (size_t)12,
				client_delete->str_real_table_name, client_delete->int_real_table_name_len,
				" ON ", (size_t)4,
				client_delete->str_pk_where_clause, client_delete->int_pk_where_clause_len,
				";", (size_t)1);
		} else {
			SFINISH_SNCAT(str_sql, &int_sql_len,
				"SELECT CAST(count(*) AS nvarchar(MAX)) FROM ", (size_t)44,
				client_delete->str_temp_table_name, client_delete->int_temp_table_name_len,
				" INNER JOIN ", (size_t)12,
				client_delete->str_real_table_name, client_delete->int_real_table_name_len,
				" ON ", (size_t)4,
				client_delete->str_pk_where_clause, client_delete->int_pk_where_clause_len,
				";", (size_t)1);
		}
	}

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

	size_t int_response_len = 0;
	size_t int_sql_len = 0;
	SFINISH_SNCAT(str_response, &int_response_len,
		"", (size_t)0);

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
		SFINISH_SNCAT(str_sql, &int_sql_len,
			"DELETE FROM ", (size_t)12,
			client_delete->str_real_table_name, client_delete->int_real_table_name_len,
			" USING ", (size_t)7,
			client_delete->str_temp_table_name, client_delete->int_temp_table_name_len,
			" WHERE ", (size_t)7,
			client_delete->str_pk_where_clause, client_delete->int_pk_where_clause_len,
			";", (size_t)1);
	} else {
		SFINISH_SNCAT(str_sql, &int_sql_len,
			"MERGE INTO ", (size_t)11,
			client_delete->str_real_table_name, client_delete->int_real_table_name_len,
			" WITH (HOLDLOCK) USING ", (size_t)23,
			client_delete->str_temp_table_name, client_delete->int_temp_table_name_len,
			" ON ", (size_t)4,
			client_delete->str_pk_where_clause, client_delete->int_pk_where_clause_len,
			" WHEN MATCHED THEN DELETE;", (size_t)26);
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
	size_t int_response_len = 0;
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
		"Rows Affected\012", (size_t)14,
		str_rows, strlen(str_rows),
		"\012", (size_t)1);

	WS_sendFrame(EV_A, client_request->parent, true, 0x01, str_response, int_response_len);
	DArray_push(client_request->arr_response, str_response);

	// Build second response (tells the client we're done)
	client_request->int_response_id += 1;
	memset(str_temp, 0, 101);
	snprintf(str_temp, 100, "%zd", client_request->int_response_id);

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
		"TRANSACTION COMPLETED", (size_t)21);

	WS_sendFrame(EV_A, client_request->parent, true, 0x01, str_response, int_response_len);
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
