#include "ws_select.h"

char *ws_select_step1(struct sock_ev_client_request *client_request) {
	SDEBUG("ws_select_step1");
	struct sock_ev_client_select *client_select = (struct sock_ev_client_select *)(client_request->vod_request_data);
	char *str_response = NULL;
	char *ptr_attr_header = NULL;
	char *ptr_end_attr_header = NULL;
	char *ptr_attr_values = NULL;
	size_t int_length = 0;
	SDEFINE_VAR_ALL(str_temp, str_temp1, str_attr_name, str_attr_value);
	// int int_status;

	client_request->arr_response = DArray_create(sizeof(char *), 1);

	// This is a name used for a temporary statement to get the column names
	SFINISH_CAT_CSTR(client_select->str_statement_name, "temp_select_", client_request->str_message_id);

	// Get table names and return columns
	SFINISH_ERROR_CHECK((client_select->str_real_table_name = get_table_name(client_request->ptr_query)) != NULL,
		"Query failed:\nFATAL\nerror_detail\tERROR: Failed to get table name from query.\n");
	SFINISH_ERROR_CHECK((client_select->str_return_columns =
								get_return_columns(client_request->ptr_query, client_select->str_real_table_name)) != NULL,
		"Failed to get return columns from query");

#ifdef POSTAGE_INTERFACE_LIBPQ
#else
	SFINISH_ERROR_CHECK((client_select->str_return_escaped_columns = get_return_escaped_columns(
							 DB_connection_driver(client_request->parent->conn), client_request->ptr_query)) != NULL,
		"Failed to get escaped return columns from query.");

	SFINISH_CAT_CSTR(client_select->str_sql_escaped_return, "SELECT ", client_select->str_return_escaped_columns, "\012",
		"   FROM ", client_select->str_real_table_name, "\012");
#endif

	// Start building SQL
	SFINISH_CAT_CSTR(client_select->str_sql, "SELECT ", client_select->str_return_columns, "\012", "   FROM ",
		client_select->str_real_table_name, "\012");

	// Get start of the attr headers
	ptr_attr_header = strstr(client_request->ptr_query, "RETURN");
	SFINISH_CHECK(ptr_attr_header != NULL, "strstr failed, malformed request?");
	ptr_attr_header = strstr(ptr_attr_header, "\012");
	SFINISH_CHECK(ptr_attr_header != NULL, "strstr failed, malformed request?");
	while (*ptr_attr_header == '\012') {
		ptr_attr_header += 1;
	}
	// Get end of headers
	ptr_end_attr_header = strstr(ptr_attr_header, "\012");
	if (ptr_end_attr_header != NULL) {
		// Get start of attr values
		ptr_attr_values = ptr_end_attr_header + 1;

		SDEBUG("ptr_attr_header: >%s<", ptr_attr_header);
		SDEBUG("ptr_attr_values: >%s<", ptr_attr_values);

		// Loop through attributes (SQL clauses)
		while (ptr_attr_header < ptr_end_attr_header) {
			// Get attr name
			int_length = strcspn(ptr_attr_header, "\t\012");

			SFINISH_SALLOC(str_attr_name, int_length + 1);
			memcpy(str_attr_name, ptr_attr_header, int_length);
			str_attr_name[int_length] = '\0';
			ptr_attr_header += int_length + 1;

			// Get attr value
			int_length = strcspn(ptr_attr_values, "\t\012");
			SFINISH_SALLOC(str_attr_value, int_length + 1);
			memcpy(str_attr_value, ptr_attr_values, int_length);
			str_attr_value[int_length] = '\0';
			ptr_attr_values += int_length + 1;

			// Unescape the value
			str_temp1 = str_attr_value;
			str_attr_value = unescape_value(str_temp1);
			SFINISH_CHECK(str_attr_value != NULL, "unescape_value failed, malformed request?");
			SFREE(str_temp1);

			SDEBUG("str_attr_name : >%s<", str_attr_name);
			SDEBUG("str_attr_value: >%s<", str_attr_value);

			str_toupper(str_attr_name);
			if (strncmp(str_attr_name, "WHERE", 5) == 0 || strncmp(str_attr_name, "ORDER BY", 8) == 0 ||
				strncmp(str_attr_name, "LIMIT", 5) == 0 || strncmp(str_attr_name, "OFFSET", 6) == 0) {
#ifdef POSTAGE_INTERFACE_LIBPQ
				SFINISH_CAT_APPEND(client_select->str_sql, str_attr_name, " ", str_attr_value, "\012");
#else
				if (DB_connection_driver(client_request->parent->conn) == DB_DRIVER_POSTGRES) {
					SFINISH_CAT_APPEND(client_select->str_sql_escaped_return, str_attr_name, " ", str_attr_value, "\012");
				} else {
					SDEBUG("str_attr_name: >%s<", str_attr_name);
					if (strncmp(str_attr_name, "WHERE", 5) == 0) {
						SFREE(client_select->str_where);
						SFINISH_CAT_CSTR(client_select->str_where, str_attr_value);
						SDEBUG("str_where: %s", client_select->str_where);
						if (strncmp(client_select->str_where, "TRUE", 4) == 0) {
							SFREE(client_select->str_where);
						}

					} else if (strncmp(str_attr_name, "ORDER BY", 8) == 0) {
						SFREE(client_select->str_order_by);
						SFINISH_CAT_CSTR(client_select->str_order_by, str_attr_value);
						SDEBUG("str_order_by: %s", client_select->str_order_by);

					} else if (strncmp(str_attr_name, "LIMIT", 5) == 0) {
						SFREE(client_select->str_limit);
						SFINISH_CAT_CSTR(client_select->str_limit, str_attr_value);
						SDEBUG("str_limit: %s", client_select->str_limit);
						if (strncmp(client_select->str_limit, "ALL", 4) == 0) {
							SFREE(client_select->str_limit);
						}

					} else if (strncmp(str_attr_name, "OFFSET", 6) == 0) {
						SFREE(client_select->str_offset);
						SFINISH_CAT_CSTR(client_select->str_offset, str_attr_value);
						SDEBUG("str_offset: %s", client_select->str_offset);
					}
				}
#endif
			} else {
				SFINISH("Only WHERE, ORDER BY, LIMIT and OFFSET are allowed in the SELECT request");
			}

			// Free name and value
			SFREE(str_attr_name);
			SFREE(str_attr_value);
		}
	}

	SFINISH_CHECK(DB_get_column_types_for_query(
					  global_loop, client_request->parent->conn, client_select->str_sql, client_request, ws_select_step4),
		"DB_get_column_types_for_query failed");

	/*
	// Prepare the query so that we can get the column names and types
	int_status = PQsendPrepare(client_request->parent->cnxn, client_select->str_statement_name, client_select->str_sql, 0, NULL);
	if (int_status != 1) {
		SFINISH_ERROR("Failed to prepare query: %s", PQerrorMessage(client_request->parent->cnxn));
	}

	// This function will run the next step once the database returns
	query_callback(client_request, ws_select_step2);
	*/

	bol_error_state = false;
finish:
	if (bol_error_state == true) {
		bol_error_state = false;

		client_request->int_response_id += 1;
		SFREE(str_temp);
		SFINISH_SALLOC(str_temp, 101 * sizeof(char));
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

		ws_select_free(client_select);
		// client_request_free(client_request);
		// client_request_free takes care of this
		// SFREE(client_select);
	}
	SFREE_ALL();
	return str_response;
}

// bool ws_select_step4(EV_P, PGresult *res, ExecStatusType result, struct
// sock_ev_client_request *client_request) {
bool ws_select_step4(EV_P, void *cb_data, DB_result *res) {
	struct sock_ev_client_request *client_request = cb_data;
	SDEBUG("ws_select_step4");
	struct sock_ev_client_select *client_select = (struct sock_ev_client_select *)(client_request->vod_request_data);
	SDEFINE_VAR_ALL(str_temp, str_temp1, str_oid_type, str_int_mod, str_sql, str_inner_top, str_col);

#ifdef POSTAGE_INTERFACE_LIBPQ
#else
	char *ptr_col = NULL;
#endif
	char *str_response = NULL;
	size_t int_column, int_num_columns;
	DArray *arr_column_names = NULL;
	DArray *arr_row_values = NULL;
	DArray *arr_row_lengths = NULL;

	SFINISH_CAT_CSTR(str_response, "");

	SFINISH_CHECK(res != NULL, "query_callback failed!");
	SFINISH_CHECK(res->status == DB_RES_TUPLES_OK, "Query failed");

	arr_column_names = DB_get_column_names(res);
	int_num_columns = DArray_end(arr_column_names);
	SDEBUG("int_num_columns: >%d<", int_num_columns);

	SFINISH_CHECK(DB_fetch_row(res) == DB_FETCH_OK, "DB_fetch_row failed");
	arr_row_values = DB_get_row_values(res);
	arr_row_lengths = DB_get_row_lengths(res);

#ifdef POSTAGE_INTERFACE_LIBPQ
#else
	if (DB_connection_driver(client_request->parent->conn) != DB_DRIVER_POSTGRES) {
		SFREE(client_select->str_return_escaped_columns)
		SFREE(client_select->str_sql_escaped_return);
		SFINISH_CAT_CSTR(client_select->str_sql_escaped_return, "SELECT\ttest\ttest\nRETURN\t");
		for (size_t int_i = 0, int_len = DArray_end(arr_column_names); int_i < int_len; int_i += 1) {
			ptr_col = DArray_get(arr_column_names, int_i);
			SFINISH_CHECK(ptr_col != NULL, "DB_escape_identifier failed");
			SFINISH_CAT_APPEND(client_select->str_sql_escaped_return, (int_i == 0 ? "" : "\t"), ptr_col);
		}
		SFINISH_CAT_APPEND(client_select->str_sql_escaped_return, "\012");
		SFINISH_ERROR_CHECK((client_select->str_return_escaped_columns = get_return_escaped_columns(
			DB_connection_driver(client_request->parent->conn), client_select->str_sql_escaped_return)) != NULL,
			"Failed to get escaped return columns from query.");
		SFREE(client_select->str_sql_escaped_return);

		if (client_select->str_order_by == NULL) {
			SFINISH_CAT_CSTR(client_select->str_order_by, "");
			for (size_t int_i = 0, int_len = DArray_end(arr_column_names); int_i < int_len; int_i += 1) {
				str_col = DB_escape_identifier(client_request->parent->conn, DArray_get(arr_column_names, int_i),
					strlen(DArray_get(arr_column_names, int_i)));
				SFINISH_CHECK(str_col != NULL, "DB_escape_identifier failed");
				SFINISH_CAT_APPEND(client_select->str_order_by, (int_i == 0 ? "" : ", "), str_col);
				SFREE(str_col);
			}
		}

		SFINISH_CAT_CSTR(client_select->str_sql_escaped_return, "SELECT ", client_select->str_return_escaped_columns, "\012");

		if (client_select->str_limit != NULL && client_select->str_offset != NULL) {
			SFINISH_CAT_CSTR(str_inner_top, "(", client_select->str_limit, " + ", client_select->str_offset, ")");
		} else if (client_select->str_limit != NULL) {
			SFINISH_CAT_CSTR(str_inner_top, client_select->str_limit);
		} else {
			SFINISH_CAT_CSTR(str_inner_top, "100 PERCENT");
		}

		SFINISH_CAT_APPEND(client_select->str_sql_escaped_return, "   FROM (\012"
																  "		SELECT TOP ",
			str_inner_top, " ROW_NUMBER() OVER (ORDER BY ", client_select->str_order_by, ") AS ",
			client_select->str_statement_name, "_row, *\012"
											   "			FROM ",
			client_select->str_real_table_name, "\012");
		if (client_select->str_where != NULL) {
			SFINISH_CAT_APPEND(client_select->str_sql_escaped_return, "			WHERE (", client_select->str_where, ")\012");
		}

		SFINISH_CAT_APPEND(client_select->str_sql_escaped_return, "	) ", client_select->str_statement_name, "\012");

		SFINISH_CAT_APPEND(client_select->str_sql_escaped_return, "	WHERE 1=1");

		if (client_select->str_offset != NULL) {
			SFINISH_CAT_APPEND(client_select->str_sql_escaped_return, " AND (", client_select->str_statement_name, "_row > ",
				client_select->str_offset, ")");
		}
		SFINISH_CAT_APPEND(client_select->str_sql_escaped_return, "	ORDER BY ", client_select->str_order_by, "\012");

		SDEBUG("client_select->str_sql_escaped_return:\n%s", client_select->str_sql_escaped_return);
	}
#endif

	for (int_column = 0; int_column < int_num_columns; int_column += 1) {
		// Get column name and escape it
		str_temp1 = escape_value(DArray_get(arr_column_names, int_column));
		SFINISH_CHECK(str_temp1 != NULL, "escape_value failed");
		// Add it to the response
		SFINISH_CAT_APPEND(str_response, str_temp1, int_column < (int_num_columns - 1) ? "\t" : "\012");

		SFREE(str_temp1);
	}

	for (int_column = 0; int_column < int_num_columns; int_column += 1) {
		// Add the type to the response
		SFINISH_CAT_APPEND(
			str_response, DArray_get(arr_row_values, int_column), int_column < (int_num_columns - 1) ? "\t" : "\012");
	}

	SDEBUG("str_response: >%s<", str_response);

	DB_free_result(res);

	client_request->int_response_id += 1;
	SFREE(str_temp);
	SFINISH_SALLOC(str_temp, 101 * sizeof(char));
	snprintf(str_temp, 100, "%zd", client_request->int_response_id);

	char *_str_response = str_response;
	SFINISH_CAT_CSTR(str_response, "messageid = ", client_request->str_message_id, "\012responsenumber = ", str_temp, "\012");
	if (client_request->str_transaction_id != NULL) {
		SFINISH_CAT_APPEND(str_response, "transactionid = ", client_request->str_transaction_id, "\012");
	}
	SFINISH_CAT_APPEND(str_response, _str_response);
	SDEBUG("_str_response: >%s<", _str_response);
	SFREE(_str_response);
	SDEBUG("str_response: >%s<", str_response);
	WS_sendFrame(EV_A, client_request->parent, true, 0x01, str_response, strlen(str_response));
	DArray_push(client_request->arr_response, str_response);
	str_response = NULL;

// Use the sql we generated earlier to copy all of the data to stdout
#ifdef POSTAGE_INTERFACE_LIBPQ
	SFINISH_CAT_CSTR(str_sql, "COPY (", client_select->str_sql, ") TO STDOUT;");
#else
	SFINISH_CAT_CSTR(str_sql, client_select->str_sql_escaped_return);
#endif

	SFINISH_CHECK(
		DB_copy_out(EV_A, client_request->parent->conn, client_request, str_sql, ws_copy_check_cb), "DB_copy_out failed!");

	bol_error_state = false;
finish:
	SFREE_ALL();
	if (arr_column_names != NULL) {
		DArray_clear_destroy(arr_column_names);
	}
	if (arr_row_values != NULL) {
		DArray_clear_destroy(arr_row_values);
	}
	if (arr_row_lengths != NULL) {
		DArray_clear_destroy(arr_row_lengths);
	}
	if (bol_error_state == true) {
		bol_error_state = false;

		client_request->int_response_id += 1;
		SFINISH_SALLOC(str_temp, 101 * sizeof(char));
		snprintf(str_temp, 100, "%zd", client_request->int_response_id);

		_str_response = str_response;
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

		ws_select_free(client_select);
		// client_request_free(client_request);
		// client_request_free takes care of this
		// SFREE(client_select);
	} else {
		SFREE(str_response);
	}
	DB_free_result(res);
	return true;
}

void ws_select_free(struct sock_ev_client_select *to_free) {
	SFREE(to_free->str_real_table_name);
	SFREE(to_free->str_return_columns);
#ifndef POSTAGE_INTERFACE_LIBPQ
	SFREE(to_free->str_return_escaped_columns);
	SFREE(to_free->str_sql_escaped_return);
#endif
	SFREE(to_free->str_statement_name);
	SFREE(to_free->str_sql);
	SFREE(to_free->str_row_count);

	SFREE(to_free->str_where);
	SFREE(to_free->str_order_by);
	SFREE(to_free->str_offset);
	SFREE(to_free->str_limit);

	if (to_free->darr_column_types != NULL) {
		DArray_clear_destroy(to_free->darr_column_types);
		to_free->darr_column_types = NULL;
	}
	if (to_free->darr_column_names != NULL) {
		DArray_clear_destroy(to_free->darr_column_names);
		to_free->darr_column_names = NULL;
	}
}
