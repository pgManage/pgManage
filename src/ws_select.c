#include "ws_select.h"

// This is still secure even though we allow an arbitrary from:
// 1. We quote column names in the RETURN clause
// 2. We check if there is a semicolon that would cause another query to run
// 3. Only SELECT is allowed in a FROM

void ws_select_step1(struct sock_ev_client_request *client_request) {
	SDEBUG("ws_select_step1");
	struct sock_ev_client_select *client_select = (struct sock_ev_client_select *)(client_request->client_request_data);
	char *str_response = NULL;
	char *ptr_attr_header = NULL;
	char *ptr_end_attr_header = NULL;
	char *ptr_attr_values = NULL;
	char *ptr_end_attr_values = NULL;

	size_t int_attr_name_len = 0;
	size_t int_attr_value_len = 0;
	size_t int_response_len = 0;
	SDEFINE_VAR_ALL(str_temp, str_temp1, str_attr_name, str_attr_value);
	// int int_status;

	client_request->arr_response = DArray_create(sizeof(char *), 1);

	// This is a name used for a temporary statement to get the column names
	SFINISH_SNCAT(client_select->str_statement_name, &client_select->int_statement_name_len,
		"temp_select_", (size_t)12,
		client_request->str_message_id, client_request->int_message_id_len);

	// Get table names and return columns
	client_select->str_real_table_name = get_table_name(
		client_request->ptr_query, (size_t)(client_request->frame->int_length - (size_t)(client_request->ptr_query - client_request->frame->str_message)),
		&client_select->int_real_table_name_len
	);
	SFINISH_ERROR_CHECK(client_select->str_real_table_name != NULL, "Query failed:\nFATAL\nerror_detail\tERROR: Failed to get table name from query.\n");

	client_select->str_return_columns = get_return_columns(
		client_request->ptr_query, (size_t)(client_request->frame->int_length - (size_t)(client_request->ptr_query - client_request->frame->str_message)),
		client_select->str_real_table_name, client_select->int_real_table_name_len,
		&client_select->int_return_columns_len
	);
	SFINISH_ERROR_CHECK(client_select->str_return_columns != NULL, "Failed to get return columns from query");

	// Start building SQL
	SFINISH_SNCAT(client_select->str_sql, &client_select->int_sql_len,
		"SELECT ", (size_t)7,
		client_select->str_return_columns, client_select->int_return_columns_len,
		"\012   FROM ", (size_t)9,
		client_select->str_real_table_name, client_select->int_real_table_name_len,
		"\012", (size_t)1);

	// Get start of the attr headers
	ptr_attr_header = bstrstr(
		client_request->ptr_query, (size_t)(client_request->frame->int_length - (size_t)(client_request->ptr_query - client_request->frame->str_message)),
		"RETURN", (size_t)6
	);
	SFINISH_CHECK(ptr_attr_header != NULL, "bstrstr failed, malformed request?");
	ptr_attr_header = bstrstr(
		ptr_attr_header, (size_t)(client_request->frame->int_length - (size_t)(ptr_attr_header - client_request->frame->str_message)),
		"\012", (size_t)1
	);
	SFINISH_CHECK(ptr_attr_header != NULL, "bstrstr failed, malformed request?");
	while (*ptr_attr_header == '\012') {
		ptr_attr_header += 1;
	}
	// Get end of headers
	ptr_end_attr_header = bstrstr(
		ptr_attr_header, (size_t)(client_request->frame->int_length - (size_t)(ptr_attr_header - client_request->frame->str_message)),
		"\012", (size_t)1
	);
	if (ptr_end_attr_header != NULL) {
		// Get start of attr values
		ptr_attr_values = ptr_end_attr_header + 1;
		ptr_end_attr_values = bstrstr(
			ptr_attr_values, (size_t)(client_request->frame->int_length - (size_t)(ptr_attr_values - client_request->frame->str_message)),
			"\012", (size_t)1
		);
		if (ptr_end_attr_values == NULL) {
			ptr_end_attr_values = client_request->frame->str_message + client_request->frame->int_length;
		}

		SDEBUG("ptr_attr_header: >%s<", ptr_attr_header);
		SDEBUG("ptr_attr_values: >%s<", ptr_attr_values);

		// Loop through attributes (SQL clauses)
		while (ptr_attr_header < ptr_end_attr_header) {
			// Get attr name
			int_attr_name_len = strncspn(ptr_attr_header, (size_t)(ptr_end_attr_header - ptr_attr_header), "\t\012", (size_t)2);

			SFINISH_SALLOC(str_attr_name, int_attr_name_len + 1);
			memcpy(str_attr_name, ptr_attr_header, int_attr_name_len);
			str_attr_name[int_attr_name_len] = '\0';
			ptr_attr_header += int_attr_name_len + 1;

			// Get attr value
			int_attr_value_len = strncspn(ptr_attr_values, (size_t)(ptr_end_attr_values - ptr_attr_values), "\t\012", (size_t)2);
			SFINISH_SALLOC(str_attr_value, int_attr_value_len + 1);
			memcpy(str_attr_value, ptr_attr_values, int_attr_value_len);
			str_attr_value[int_attr_value_len] = '\0';
			ptr_attr_values += int_attr_value_len + 1;

			// Unescape the value
			str_temp1 = str_attr_value;
			str_attr_value = bunescape_value(str_temp1, &int_attr_value_len);
			SFINISH_CHECK(str_attr_value != NULL, "bunescape_value failed, malformed request?");
			SFREE(str_temp1);

			SDEBUG("str_attr_name : >%s<", str_attr_name);
			SDEBUG("str_attr_value: >%s<", str_attr_value);

			bstr_toupper(str_attr_name, int_attr_name_len);
			if (strncmp(str_attr_name, "WHERE", 6) == 0 || strncmp(str_attr_name, "ORDER BY", 9) == 0 ||
				strncmp(str_attr_name, "LIMIT", 6) == 0 || strncmp(str_attr_name, "OFFSET", 7) == 0) {
				SFINISH_SNFCAT(client_select->str_sql, &client_select->int_sql_len,
					str_attr_name, int_attr_name_len,
					" ", (size_t)1,
					str_attr_value, int_attr_value_len,
					"\012", (size_t)1);
				SDEBUG("str_attr_name: %s", str_attr_name);
				SDEBUG("int_attr_name_len: %zu", int_attr_name_len);
				SDEBUG("str_attr_value: %s", str_attr_value);
				SDEBUG("int_attr_value_len: %zu", int_attr_value_len);
			} else {
				SFINISH("Only WHERE, ORDER BY, LIMIT and OFFSET are allowed in the SELECT request");
			}

			// Free name and value
			SFREE(str_attr_name);
			SFREE(str_attr_value);
		}
	}

	SDEBUG("client_select->str_sql: %s", client_select->str_sql);
	SFINISH_CHECK(query_is_safe(client_select->str_sql), "SQL Injection detected");

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
		SFINISH_SNCAT(str_response, &int_response_len,
			"messageid = ", (size_t)12,
			client_request->str_message_id, client_request->int_message_id_len,
			"\012responsenumber = ", (size_t)18,
			str_temp, strlen(str_temp),
			"\012", (size_t)1);
		if (client_request->str_transaction_id != NULL) {
			SFINISH_SNFCAT(str_response, &int_response_len,
				"transactionid = ", (size_t)16,
				client_request->str_transaction_id, client_request->int_transaction_id_len,
				"\012", (size_t)1);
		}
		SFINISH_SNFCAT(str_response, &int_response_len,
			_str_response, strlen(_str_response));
		SFREE(_str_response);

		WS_sendFrame(global_loop, client_request->parent, true, 0x01, str_response, strlen(str_response));
		DArray_push(client_request->arr_response, str_response);
		str_response = NULL;
	}
	SFREE_ALL();
}

// bool ws_select_step4(EV_P, PGresult *res, ExecStatusType result, struct
// sock_ev_client_request *client_request) {
bool ws_select_step4(EV_P, void *cb_data, DB_result *res) {
	struct sock_ev_client_request *client_request = cb_data;
	SDEBUG("ws_select_step4");
	struct sock_ev_client_select *client_select = (struct sock_ev_client_select *)(client_request->client_request_data);
	SDEFINE_VAR_ALL(str_temp, str_temp1, str_oid_type, str_int_mod, str_sql, str_inner_top, str_col);

	char *str_response = NULL;
	size_t int_column, int_num_columns;
	DArray *arr_column_names = NULL;
	DArray *arr_row_values = NULL;
	DArray *arr_row_lengths = NULL;
	size_t int_response_len = 0;
	size_t int_sql_len = 0;

	SFINISH_SNCAT(str_response, &int_response_len,
		"", (size_t)0);

	SFINISH_CHECK(res != NULL, "query_callback failed!");
	SFINISH_CHECK(res->status == DB_RES_TUPLES_OK, "Query failed");

	arr_column_names = DB_get_column_names(res);
	int_num_columns = DArray_end(arr_column_names);
	SDEBUG("int_num_columns: >%d<", int_num_columns);

	SFINISH_CHECK(DB_fetch_row(res) == DB_FETCH_OK, "DB_fetch_row failed");
	arr_row_values = DB_get_row_values(res);
	arr_row_lengths = DB_get_row_lengths(res);

	for (int_column = 0; int_column < int_num_columns; int_column += 1) {
		// Get column name and escape it
		size_t int_temp1_len = strlen(DArray_get(arr_column_names, int_column));
		str_temp1 = bescape_value(DArray_get(arr_column_names, int_column), &int_temp1_len);
		SFINISH_CHECK(str_temp1 != NULL, "bescape_value failed");
		// Add it to the response
		SFINISH_SNFCAT(str_response, &int_response_len,
			str_temp1, int_temp1_len,
			int_column < (int_num_columns - 1) ? "\t" : "\012", strlen(int_column < (int_num_columns - 1) ? "\t" : "\012"));

		SFREE(str_temp1);
	}

	for (int_column = 0; int_column < int_num_columns; int_column += 1) {
		// Add the type to the response
		SFINISH_SNFCAT(str_response, &int_response_len,
			DArray_get(arr_row_values, int_column), strlen(DArray_get(arr_row_values, int_column)),
			int_column < (int_num_columns - 1) ? "\t" : "\012", strlen(int_column < (int_num_columns - 1) ? "\t" : "\012"));
	}

	SDEBUG("str_response: >%s<", str_response);

	DB_free_result(res);

	client_request->int_response_id += 1;
	SFREE(str_temp);
	SFINISH_SALLOC(str_temp, 101 * sizeof(char));
	snprintf(str_temp, 100, "%zd", client_request->int_response_id);

	char *_str_response = str_response;
	SFINISH_SNCAT(str_response, &int_response_len,
		"messageid = ", (size_t)12,
		client_request->str_message_id, client_request->int_message_id_len,
		"\012responsenumber = ", (size_t)18,
		str_temp, strlen(str_temp),
		"\012", (size_t)1);
	if (client_request->str_transaction_id != NULL) {
		SFINISH_SNFCAT(str_response, &int_response_len,
			"transactionid = ", (size_t)16,
			client_request->str_transaction_id, client_request->int_transaction_id_len,
			"\012", (size_t)1);
	}
	SFINISH_SNFCAT(str_response, &int_response_len,
		_str_response, strlen(_str_response));
	SDEBUG("_str_response: >%s<", _str_response);
	SFREE(_str_response);
	SDEBUG("str_response: >%s<", str_response);
	WS_sendFrame(EV_A, client_request->parent, true, 0x01, str_response, strlen(str_response));
	DArray_push(client_request->arr_response, str_response);
	str_response = NULL;

// Use the sql we generated earlier to copy all of the data to stdout
	SFINISH_SNCAT(str_sql, &int_sql_len,
		"COPY (", (size_t)6,
		client_select->str_sql, client_select->int_sql_len,
		") TO STDOUT;", (size_t)12);
	SFINISH_CHECK(query_is_safe(str_sql), "SQL Injection detected");

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
		SFINISH_SNCAT(str_response, &int_response_len,
			"messageid = ", (size_t)12,
			client_request->str_message_id, client_request->int_message_id_len,
			"\012responsenumber = ", (size_t)18,
			str_temp, strlen(str_temp),
			"\012", (size_t)1);
		SFREE(str_temp);
		if (client_request->str_transaction_id != NULL) {
			SFINISH_SNFCAT(str_response, &int_response_len,
				"transactionid = ", (size_t)16,
				client_request->str_transaction_id, client_request->int_transaction_id_len,
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
	return true;
}

void ws_select_free(struct sock_ev_client_request_data *client_request_data) {
	struct sock_ev_client_select *client_select = (struct sock_ev_client_select *)client_request_data;
	SFREE(client_select->str_real_table_name);
	SFREE(client_select->str_return_columns);
	SFREE(client_select->str_statement_name);
	SFREE(client_select->str_sql);
	SFREE(client_select->str_row_count);

	SFREE(client_select->str_where);
	SFREE(client_select->str_order_by);
	SFREE(client_select->str_offset);
	SFREE(client_select->str_limit);

	if (client_select->darr_column_types != NULL) {
		DArray_clear_destroy(client_select->darr_column_types);
		client_select->darr_column_types = NULL;
	}
	if (client_select->darr_column_names != NULL) {
		DArray_clear_destroy(client_select->darr_column_names);
		client_select->darr_column_names = NULL;
	}
}
