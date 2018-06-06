#include "ws_insert.h"

void ws_insert_step1(struct sock_ev_client_request *client_request) {
	struct sock_ev_client_insert *client_insert = (struct sock_ev_client_insert *)(client_request->client_request_data);
	SDEFINE_VAR_ALL(str_temp, str_temp1, str_sql, str_col_name, str_col_seq);
	char *str_response = NULL;
	char *ptr_pk = NULL;
	char *ptr_end_pk = NULL;
	char *ptr_seq = NULL;
	char *ptr_end_seq = NULL;
	char *ptr_column_names = NULL;
	char *ptr_end_column_names = NULL;
	size_t int_col_name_len = 0;
	size_t int_col_seq_len = 0;
	size_t int_sql_len = 0;
	size_t int_response_len = 0;

	client_request->arr_response = DArray_create(sizeof(char *), 1);

	// This is a name used for a temporary statement to get the column types
	SFINISH_SNCAT(client_insert->str_temp_table_name, &client_insert->int_temp_table_name_len,
		"temp_insert", (size_t)11);
	client_insert->int_temp_table_name_len = strlen(client_insert->str_temp_table_name);

	// Get table names and return columns
	client_insert->str_real_table_name = get_table_name(
		client_request->ptr_query, (size_t)(client_request->frame->int_length - (size_t)(client_request->ptr_query - client_request->frame->str_message)),
		&client_insert->int_real_table_name_len
	);
	SFINISH_ERROR_CHECK(client_insert->str_real_table_name != NULL, "Query failed:\nFATAL\nerror_detail\tERROR: Failed to get table name from query.\n");
	// DEBUG("client_insert->str_real_table_name: %s",
	// client_insert->str_real_table_name);

	SFINISH_ERROR_CHECK(
		get_schema_and_table_name(
			client_request->parent->conn,
			client_request->ptr_query, (size_t)(client_request->frame->int_length - (size_t)(client_request->ptr_query - client_request->frame->str_message)),
			&client_insert->str_schema_literal,
			&client_insert->str_table_literal
		)
		, "Query failed:\nFATAL\nerror_detail\tERROR: Failed to get table name from query.\n"
	);

	client_insert->str_return_columns = get_return_columns(
		client_request->ptr_query, (size_t)(client_request->frame->int_length - (size_t)(client_request->ptr_query - client_request->frame->str_message)),
		client_insert->str_real_table_name, client_insert->int_real_table_name_len,
		&client_insert->int_return_columns_len
	);
	SDEBUG("client_insert->str_return_columns: %s", client_insert->str_return_columns);
	SDEBUG("client_request->ptr_query: %s", client_request->ptr_query);
	SFINISH_ERROR_CHECK(client_insert->str_return_columns != NULL, "Failed to get return columns from query");

	// DEBUG("client_insert->str_return_columns:  %s",
	// client_insert->str_return_columns);

	ptr_pk = bstrstr(
		client_request->ptr_query, (size_t)(client_request->frame->int_length - (size_t)(client_request->ptr_query - client_request->frame->str_message)),
		"PK", (size_t)2
	);
	SFINISH_CHECK(ptr_pk != NULL, "could not find \"PK\", malformed request?");
	ptr_end_pk = bstrstr(
		ptr_pk, (size_t)(client_request->frame->int_length - (size_t)(ptr_pk - client_request->frame->str_message)),
		"\012", (size_t)1
	);
	*ptr_end_pk = 0;
	ptr_pk += 3;
	SDEBUG("ptr_pk: %s", ptr_pk);

	ptr_seq = bstrstr(
		ptr_end_pk + 1, (size_t)(client_request->frame->int_length - (size_t)((ptr_end_pk + 1) - client_request->frame->str_message)),
		"SEQ", (size_t)3
	);
	SFINISH_CHECK(ptr_seq != NULL, "could not find \"SEQ\", malformed request?");
	ptr_end_seq = bstrstr(
		ptr_seq, (size_t)(client_request->frame->int_length - (size_t)(ptr_seq - client_request->frame->str_message)),
		"\012", (size_t)1
	);
	*ptr_end_seq = 0;
	ptr_seq += 4;
	SDEBUG("ptr_seq: %s", ptr_seq);

	client_insert->ptr_values = ptr_end_seq + 1;
	if (strncmp(client_insert->ptr_values, "ORDER BY", 8) == 0) {
		char *str_temp = client_insert->ptr_values + 9;
		client_insert->ptr_values = bstrstr(
			client_insert->ptr_values, (size_t)(client_request->frame->int_length - (size_t)(client_insert->ptr_values - client_request->frame->str_message)),
			"\012", (size_t)1
		);
		SFINISH_CHECK(client_insert->ptr_values != NULL, "Could not find end of ORDER BY clause");
		size_t int_temp_len = (size_t)(client_insert->ptr_values - str_temp);
		SFINISH_SNCAT(client_insert->str_return_order_by, &client_insert->int_return_order_by_len, str_temp, int_temp_len);
	}
	client_insert->ptr_values += 1;
	while (*client_insert->ptr_values == '\012') {
		client_insert->ptr_values += 1;
	}
	//SDEBUG("client_insert->ptr_values: %s", client_insert->ptr_values);

	ptr_column_names = client_insert->ptr_values;
	SFINISH_CHECK(*ptr_column_names != 0, "No column names");
	ptr_end_column_names = bstrstr(
		ptr_column_names, (size_t)(client_request->frame->int_length - (size_t)(ptr_column_names - client_request->frame->str_message)),
		"\012", (size_t)1
	);
	SFINISH_CHECK(ptr_end_column_names != NULL, "No insert data");
	*ptr_end_column_names = 0;
	client_insert->ptr_values = ptr_end_column_names + 1;

	SFINISH_SNCAT(client_insert->str_column_names, &client_insert->int_column_names_len,
		ptr_column_names, strlen(ptr_column_names));

	// Replace double quotes with double double quotes (this allows double quotes
	// within column names)
	SFINISH_BREPLACE(client_insert->str_column_names, &client_insert->int_column_names_len, "\"", "\"\"", "g");
	// Replace tabs with "\",\"" so that we can use them in an sql statement
	SFINISH_BREPLACE(client_insert->str_column_names, &client_insert->int_column_names_len, "\t", "\",\"", "g");
	// unescape the column names
	str_temp = bunescape_value(client_insert->str_column_names, &client_insert->int_column_names_len);
	SFINISH_CHECK(str_temp != NULL, "bunescape_value failed, malformed request?");
	SFREE(client_insert->str_column_names);
	SFINISH_SNCAT(client_insert->str_column_names, &client_insert->int_column_names_len,
		"\"", (size_t)1,
		str_temp, client_insert->int_column_names_len,
		"\"", (size_t)1);
	SFREE(str_temp);

	SFINISH_SNCAT(client_insert->str_pk_join_clause, &client_insert->int_pk_join_clause_len,
		"", (size_t)0);
	SFINISH_SNCAT(client_insert->str_pk_where_clause, &client_insert->int_pk_where_clause_len,
		"", (size_t)0); //"id = lastval()");
	SFINISH_SNCAT(client_insert->str_pk_columns, &client_insert->int_pk_columns_len,
		"", (size_t)0);
	SFINISH_SNCAT(client_insert->str_pk_return_where_clause, &client_insert->int_pk_return_where_clause_len,
		"", (size_t)0);
	client_insert->darr_pk = DArray_create(sizeof(char *), 10);
	client_insert->darr_sequence = DArray_create(sizeof(char *), 10);
	size_t int_i = 0, int_j = 0, int_k = 0;
	while (ptr_pk < ptr_end_pk) {
		// PK name
		int_col_name_len = strncspn(ptr_pk, (size_t)(ptr_end_pk - ptr_pk), "\t\012", (size_t)2);
		SFINISH_SALLOC(str_col_name, int_col_name_len + 1);
		memcpy(str_col_name, ptr_pk, int_col_name_len);
		str_col_name[int_col_name_len] = '\0';
		ptr_pk += int_col_name_len + 1;

		str_temp1 = DB_escape_identifier(client_request->parent->conn, str_col_name, int_col_name_len);
		SFINISH_CHECK(str_temp1 != NULL, "DB_escape_identifier failed, malformed request?");
		SFREE(str_col_name);
		str_col_name = str_temp1;
		int_col_name_len = strlen(str_col_name);
		str_temp1 = NULL;

		// PK sequence
		int_col_seq_len = strncspn(ptr_seq, (size_t)(ptr_end_seq - ptr_seq), "\t\012", (size_t)2);
		SFINISH_SALLOC(str_col_seq, int_col_seq_len + 1);
		memcpy(str_col_seq, ptr_seq, int_col_seq_len);
		str_col_seq[int_col_seq_len] = '\0';
		ptr_seq += int_col_seq_len + 1;

		str_temp1 = DB_escape_literal(client_request->parent->conn, str_col_seq, int_col_seq_len);
		SFINISH_CHECK(str_temp1 != NULL, "DB_escape_literal failed, malformed request?");
		SFREE(str_col_seq);
		str_col_seq = str_temp1;
		int_col_seq_len = strlen(str_col_seq);
		str_temp1 = NULL;

		SFREE(str_temp1);

		SFINISH_SNFCAT(client_insert->str_pk_columns, &client_insert->int_pk_columns_len,
			int_i > 0 ? ", " : "", strlen(int_i > 0 ? ", " : ""),
			client_insert->str_real_table_name, client_insert->int_real_table_name_len,
			".", (size_t)1,
			str_col_name, int_col_name_len);

		SINFO("client_insert->str_pk_return_where_clause: %s", client_insert->str_pk_return_where_clause);
		SFINISH_SNFCAT(client_insert->str_pk_return_where_clause, &client_insert->int_pk_return_where_clause_len,
			int_i > 0 ? " AND " : "", strlen(int_i > 0 ? " AND " : ""),
			client_insert->str_real_table_name, client_insert->int_real_table_name_len,
			".", (size_t)1,
			str_col_name, int_col_name_len,
			" = ", (size_t)3,
			client_insert->str_temp_table_name, client_insert->int_temp_table_name_len,
			"_2.", (size_t)3,
			str_col_name, int_col_name_len);

		if (strncmp(str_col_seq, "''", 2) != 0) {
			SFINISH_SNFCAT(client_insert->str_pk_where_clause, &client_insert->int_pk_where_clause_len,
				int_i > 0 ? " AND " : "", strlen(int_i > 0 ? " AND " : ""),
				client_insert->str_real_table_name, client_insert->int_real_table_name_len,
				".", (size_t)1,
				str_col_name, int_col_name_len,
				" = currval(", (size_t)11,
				str_col_seq, int_col_seq_len,
				"::name::regclass)", (size_t)17);
				
				char *str_temp_sequence = NULL;
				size_t int_temp_sequence_len = 0;
				SFINISH_SNCAT(str_temp_sequence, &int_temp_sequence_len, str_col_seq, int_col_seq_len);

				DArray_push(client_insert->darr_sequence, str_temp_sequence);

				SFINISH_SNCAT(str_temp_sequence, &int_temp_sequence_len, str_col_name, int_col_name_len);

				DArray_push(client_insert->darr_pk, str_temp_sequence);

		} else {
			if (bstrstr(client_insert->str_column_names, client_insert->int_column_names_len, str_col_name, int_col_name_len) == NULL) {
				int_j += 1;
				SFINISH_CHECK(int_j == 1, "Only one PK column allowed to not have an unspecified value");
				SFINISH_SNFCAT(client_insert->str_pk_where_clause, &client_insert->int_pk_where_clause_len,
					int_i > 0 ? " AND " : "", int_i > 0 ? 5 : 0,
					client_insert->str_real_table_name, client_insert->int_real_table_name_len,
					".", (size_t)1,
					str_col_name, int_col_name_len,
					" = lastval()", (size_t)12);
			} else {
				SFINISH_SNFCAT(client_insert->str_pk_join_clause, &client_insert->int_pk_join_clause_len,
					int_k > 0 ? " AND " : "", int_k > 0 ? 5 : 0,
					client_insert->str_real_table_name, client_insert->int_real_table_name_len,
					".", (size_t)1,
					str_col_name, int_col_name_len,
					" = ", (size_t)3,
					client_insert->str_temp_table_name, client_insert->int_temp_table_name_len,
					".", (size_t)1,
					str_col_name, int_col_name_len);
				SFINISH_SNFCAT(client_insert->str_pk_where_clause, &client_insert->int_pk_where_clause_len,
					int_i > 0 ? " AND " : "", int_i > 0 ? 5 : 0,
					client_insert->str_temp_table_name, client_insert->int_temp_table_name_len,
					".", (size_t)1,
					str_col_name, int_col_name_len,
					" IS NOT NULL", (size_t)12);
			}
		}

		int_i += 1;
		SFREE(str_col_name);
	}

	SDEBUG("client_insert->str_pk_join_clause : %s", client_insert->str_pk_join_clause);
	SDEBUG("client_insert->str_pk_where_clause: %s", client_insert->str_pk_where_clause);

	// Create first temp table (this one holds the data from the client)
	SFINISH_SNCAT(str_sql, &int_sql_len,
		"CREATE TEMP TABLE ", (size_t)18,
		client_insert->str_temp_table_name, client_insert->int_temp_table_name_len,
		" ON COMMIT DROP AS\nSELECT ", (size_t)26,
		client_insert->str_column_names, client_insert->int_column_names_len,
		" FROM ", (size_t)6,
		client_insert->str_real_table_name, client_insert->int_real_table_name_len,
		" LIMIT 0;", (size_t)9);
	SFINISH_CHECK(query_is_safe(str_sql), "SQL Injection detected");
	SFINISH_CHECK(DB_exec(global_loop, client_request->parent->conn, client_request, str_sql, ws_insert_step2), "DB_exec failed");

	bol_error_state = false;
finish:
	if (bol_error_state == true) {
		bol_error_state = false;

		char str_temp2[101] = {0};
		client_request->int_response_id += 1;
		memset(str_temp2, 0, 101);
		snprintf(str_temp2, 100, "%zd", client_request->int_response_id);

		char *_str_response = str_response;
		SFINISH_SNCAT(str_response, &int_response_len,
			"messageid = ", (size_t)12,
			client_request->str_message_id, client_request->int_message_id_len,
			"\012responsenumber = ", (size_t)18,
			str_temp2, strlen(str_temp2),
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

bool ws_insert_step2(EV_P, void *cb_data, DB_result *res) {
	struct sock_ev_client_request *client_request = cb_data;
	struct sock_ev_client_insert *client_insert = (struct sock_ev_client_insert *)(client_request->client_request_data);
	size_t int_len_content;
	SDEFINE_VAR_ALL(str_sql);
	size_t int_response_len = 0;
	size_t int_sql_len = 0;
	char *str_response = NULL;
	bool bol_ret = true;
	SFINISH_SNCAT(str_response, &int_response_len,
		"", (size_t)0);

	SFINISH_CHECK(res != NULL, "DB_exec failed");
	SFINISH_CHECK(res->status == DB_RES_COMMAND_OK, "DB_exec failed");

	// Start copying into the first temp table
	SFINISH_SNCAT(str_sql, &int_sql_len,
		"COPY ", (size_t)5,
		client_insert->str_temp_table_name, client_insert->int_temp_table_name_len,
		" FROM STDIN;", (size_t)12);

	SFINISH_CHECK(query_is_safe(str_sql), "SQL Injection detected");

	int_len_content =
		client_request->frame->int_length - (size_t)(client_insert->ptr_values - client_request->frame->str_message);
	SFINISH_CHECK(int_len_content > 0, "No insert data");
	SFINISH_CHECK(DB_copy_in(
		EV_A, client_request->parent->conn, client_request, client_insert->ptr_values, int_len_content, str_sql, ws_insert_step3), "DB_copy_in failed");

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
	return bol_ret;
}

bool ws_insert_step3(EV_P, void *cb_data, DB_result *res) {
	struct sock_ev_client_request *client_request = cb_data;
	struct sock_ev_client_insert *client_insert = (struct sock_ev_client_insert *)(client_request->client_request_data);
	size_t int_len_content;
	SDEFINE_VAR_ALL(str_sql, str_where, str_real_table_name_literal);
	size_t int_sql_len = 0;
	size_t int_where_len = 0;
	char *str_response = NULL;
	size_t int_response_len = 0;
	bool bol_ret = true;
	SFINISH_SNCAT(str_response, &int_response_len,
		"", (size_t)0);

	SFINISH_CHECK(res != NULL, "DB_exec failed");
	SFINISH_CHECK(res->status == DB_RES_COMMAND_OK, "DB_exec failed");

	client_request->int_num_rows = DB_rows_affected(res);

	if (DArray_count(client_insert->darr_sequence) == 0) {
		ws_insert_view_step1(EV_A, client_request);
	} else {
		str_real_table_name_literal = DB_escape_literal(client_request->parent->conn, client_insert->str_real_table_name, client_insert->int_real_table_name_len);
		SFINISH_CHECK(str_real_table_name_literal != NULL, "DB_escape_literal failed");

		char *str_temp = "SELECT count(*) FROM information_schema.tables WHERE ";
		char *str_temp1 = "table_type = 'BASE TABLE' AND ";
		char *str_temp2 = "schema_name = ";
		char *str_temp3 = "table_name = ";
		if (client_insert->str_schema_literal != NULL) {
			SFINISH_SNCAT(str_sql, &int_sql_len,
				str_temp, strlen(str_temp),
				str_temp1, strlen(str_temp1),
				str_temp2, strlen(str_temp2),
				client_insert->str_schema_literal, strlen(client_insert->str_schema_literal),
				" AND ", strlen(" AND "),
				str_temp3, strlen(str_temp3),
				client_insert->str_table_literal, strlen(client_insert->str_table_literal)
			);
		} else {
			SFINISH_SNCAT(str_sql, &int_sql_len,
				str_temp, strlen(str_temp),
				str_temp1, strlen(str_temp1),
				str_temp3, strlen(str_temp3),
				client_insert->str_table_literal, strlen(client_insert->str_table_literal)
			);
		}

		SINFO("str_sql: %s", str_sql);
		SINFO("str_real_table_name_literal: %s", str_real_table_name_literal);

		SFINISH_CHECK(query_is_safe(str_sql), "SQL Injection detected");

		SFINISH_CHECK(DB_exec(EV_A, client_request->parent->conn, client_request, str_sql, ws_insert_step4), "DB_exec failed");
	}

	DB_free_result(res);

	bol_error_state = false;
	bol_ret = true;
finish:
	SFREE_ALL();
	if (bol_error_state == true) {
		bol_error_state = false;
		bol_ret = false;

		client_request->int_response_id += 1;
		char str_temp[101] = { 0 };
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
	return bol_ret;
}

bool ws_insert_step4(EV_P, void *cb_data, DB_result *res) {
	struct sock_ev_client_request *client_request = cb_data;
	struct sock_ev_client_insert *client_insert = (struct sock_ev_client_insert *)(client_request->client_request_data);
	size_t int_len_content;
	SDEFINE_VAR_ALL(str_sql, str_where, str_real_table_name_literal);
	size_t int_sql_len = 0;
	size_t int_where_len = 0;
	char *str_response = NULL;
	size_t int_response_len = 0;
	bool bol_ret = true;
	DArray *darr_row = NULL;
	SFINISH_SNCAT(str_response, &int_response_len,
		"", (size_t)0);

	SFINISH_CHECK(res != NULL, "DB_exec failed");
	SFINISH_CHECK(res->status == DB_RES_TUPLES_OK, "DB_exec failed");

	// check if table or view here
	SFINISH_CHECK(DB_fetch_row(res) == DB_FETCH_OK, "DB_fetch_row failed");
	darr_row = DB_get_row_values(res);
	char *str_value = DArray_get(darr_row, 0);
	SINFO("str_value: %s", str_value);
	if (strncmp(str_value, "0", 2) == 0) {
		ws_insert_view_step1(EV_A, client_request);
	} else {
		ws_insert_table_step1(EV_A, client_request);
	}

	DB_free_result(res);

	bol_error_state = false;
	bol_ret = true;
finish:
	SFREE_ALL();
	if (darr_row != NULL) {
		DArray_clear_destroy(darr_row);
		darr_row = NULL;
	}
	if (bol_error_state == true) {
		bol_error_state = false;
		bol_ret = false;

		client_request->int_response_id += 1;
		char str_temp[101] = { 0 };
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
	return bol_ret;
}

bool ws_insert_view_step1(EV_P, struct sock_ev_client_request *client_request) {
	struct sock_ev_client_insert *client_insert = (struct sock_ev_client_insert *)(client_request->client_request_data);
	SDEFINE_VAR_ALL(str_sql);
	char *str_response = NULL;
	bool bol_ret = true;
	size_t int_sql_len = 0;
	size_t int_response_len = 0;

	// Create second temp table
	// This will hold all of the records with sequences, triggers, etc...
	SFINISH_SNCAT(str_sql, &int_sql_len,
		"CREATE TEMP TABLE ", (size_t)18,
		client_insert->str_temp_table_name, client_insert->int_temp_table_name_len,
		"_2 ON COMMIT DROP AS\nSELECT ", (size_t)28,
		client_insert->str_pk_columns, client_insert->int_pk_columns_len,
		" FROM ", (size_t)6,
		client_insert->str_real_table_name, client_insert->int_real_table_name_len,
		" LIMIT 0;", (size_t)9);

	SFINISH_CHECK(query_is_safe(str_sql), "SQL Injection detected");
	SFINISH_CHECK(DB_exec(EV_A, client_request->parent->conn, client_request, str_sql, ws_insert_view_step2), "DB_exec failed");

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
		_str_response = DB_get_diagnostic(client_request->parent->conn, NULL);
		SFINISH_SNFCAT(str_response, &int_response_len,
			":\n", (size_t)2,
			_str_response, strlen(_str_response));
		SFREE(_str_response);

		WS_sendFrame(EV_A, client_request->parent, true, 0x01, str_response, strlen(str_response));
		DArray_push(client_request->arr_response, str_response);
	}
	return bol_ret;
}


bool ws_insert_view_step2(EV_P, void *cb_data, DB_result *res) {
	struct sock_ev_client_request *client_request = cb_data;
	struct sock_ev_client_insert *client_insert = (struct sock_ev_client_insert *)(client_request->client_request_data);
	char *str_response = NULL;
	bool bol_ret = true;
	size_t int_i = 0;
	char str_i[101];
	SDEFINE_VAR_ALL(str_sql, str_insert_columns, str_pk_insert_columns, str_replace_table_name);
	size_t int_replace_table_name_len = 0;
	size_t int_insert_columns_len = 0;
	size_t int_pk_insert_columns_len = 0;
	size_t int_response_len = 0;
	size_t int_sql_len = 0;
	SFINISH_SNCAT(str_response, &int_response_len,
		"", (size_t)0);

	SFINISH_CHECK(res != NULL, "DB_exec failed");
	SFINISH_CHECK(res->status == DB_RES_COMMAND_OK, "DB_exec failed");

	DB_free_result(res);

	client_insert->darr_insert_queries = DArray_create(sizeof(char *), 10);

	SFINISH_SNCAT(str_replace_table_name, &int_replace_table_name_len,
		client_insert->str_real_table_name, client_insert->int_real_table_name_len,
		".", (size_t)1);
	SFINISH_SNCAT(str_insert_columns, &int_insert_columns_len,
		client_insert->str_return_columns, client_insert->int_return_columns_len);
	SFINISH_BREPLACE(str_insert_columns, &int_insert_columns_len, str_replace_table_name, "", "g");

	SFINISH_SNCAT(str_pk_insert_columns, &int_pk_insert_columns_len,
		client_insert->str_pk_columns, client_insert->int_pk_columns_len);
	SFINISH_BREPLACE(str_pk_insert_columns, &int_pk_insert_columns_len, str_replace_table_name, "", "g");

	for (int_i = 0; int_i < client_request->int_num_rows; int_i += 1) {
		memset(str_i, 0, 101);
		snprintf(str_i, 100, "%zd", int_i);
		SFINISH_SNCAT(str_sql, &int_sql_len,
			"INSERT INTO ", (size_t)12,
			client_insert->str_real_table_name, client_insert->int_real_table_name_len,
			" (", (size_t)2,
			client_insert->str_column_names, client_insert->int_column_names_len,
			")\nSELECT ", (size_t)9,
			client_insert->str_column_names, client_insert->int_column_names_len,
			"\n       FROM ", (size_t)13,
			client_insert->str_temp_table_name, client_insert->int_temp_table_name_len,
			"\n       LIMIT 1\n       OFFSET ", (size_t)30,
			str_i, strlen(str_i),
			";\n", (size_t)2);

		SFINISH_CHECK(query_is_safe(str_sql), "SQL Injection detected");

		DArray_push(client_insert->darr_insert_queries, str_sql);
		str_sql = NULL;

		if (client_insert->str_pk_join_clause == NULL || client_insert->str_pk_join_clause[0] == 0) {
			SFINISH_SNCAT(str_sql, &int_sql_len,
				"INSERT INTO ", (size_t)12,
				client_insert->str_temp_table_name, client_insert->int_temp_table_name_len,
				"_2 (", (size_t)4,
				str_pk_insert_columns, int_pk_insert_columns_len,
				")\nSELECT ", (size_t)9,
				client_insert->str_pk_columns, client_insert->int_pk_columns_len,
				"\n       FROM ", (size_t)13,
				client_insert->str_real_table_name, client_insert->int_real_table_name_len,
				"       WHERE ", (size_t)13,
				client_insert->str_pk_where_clause, client_insert->int_pk_where_clause_len,
				";\n\n", (size_t)3);

			SFINISH_CHECK(query_is_safe(str_sql), "SQL Injection detected");

			DArray_push(client_insert->darr_insert_queries, str_sql);
			str_sql = NULL;
		}
	}

	if (client_insert->str_pk_join_clause != NULL && client_insert->str_pk_join_clause[0] != 0) {
		SFINISH_SNCAT(str_sql, &int_sql_len,
			"\nINSERT INTO ", (size_t)13,
			client_insert->str_temp_table_name, client_insert->int_temp_table_name_len,
			"_2 (", (size_t)4,
			str_pk_insert_columns, int_pk_insert_columns_len,
			")\nSELECT ", (size_t)9,
			client_insert->str_pk_columns, client_insert->int_pk_columns_len,
			"\n       FROM ", (size_t)13,
			client_insert->str_real_table_name, client_insert->int_real_table_name_len,
			"       LEFT JOIN ", (size_t)17,
			client_insert->str_temp_table_name, client_insert->int_temp_table_name_len,
			" ON ", (size_t)4,
			client_insert->str_pk_join_clause, client_insert->int_pk_join_clause_len,
			"\n       WHERE ", (size_t)14,
			client_insert->str_pk_where_clause, client_insert->int_pk_where_clause_len,
			";\n\n", (size_t)3);

		SFINISH_CHECK(query_is_safe(str_sql), "SQL Injection detected");

		DArray_push(client_insert->darr_insert_queries, str_sql);
		str_sql = NULL;
	}

	//SDEBUG("INSERTING...");
	//SDEBUG("DArray_get(client_insert->darr_insert_queries, client_insert->int_current_insert_query): %s",
	//	DArray_get(client_insert->darr_insert_queries, client_insert->int_current_insert_query));
	SFINISH_CHECK(DB_exec(EV_A, client_request->parent->conn, client_request,
		DArray_get(client_insert->darr_insert_queries, client_insert->int_current_insert_query++), ws_insert_view_step3), "DB_exec failed");

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
	return bol_ret;
}

bool ws_insert_view_step3(EV_P, void *cb_data, DB_result *res) {
	//SDEBUG("ws_insert_step6: INSERT ROW...");
	struct sock_ev_client_request *client_request = cb_data;
	struct sock_ev_client_insert *client_insert = (struct sock_ev_client_insert *)(client_request->client_request_data);
	SDEFINE_VAR_ALL(str_temp, str_sql);
	char *str_response = NULL;
	size_t int_response_len = 0;
	bool bol_ret = true;
	SFINISH_SNCAT(str_response, &int_response_len,
		"", (size_t)0);

	SFINISH_CHECK(res != NULL, "DB_exec failed");
	SFINISH_CHECK(res->status == DB_RES_COMMAND_OK, "DB_exec failed");

	// no need to check these queries for injection, they are already checked in the above step
	//SDEBUG("DArray_get(client_insert->darr_insert_queries, client_insert->int_current_insert_query): %s",
	//	DArray_get(client_insert->darr_insert_queries, client_insert->int_current_insert_query));
	if (client_insert->int_current_insert_query < (DArray_end(client_insert->darr_insert_queries) - 1)) {
		SFINISH_CHECK(DB_exec(EV_A, client_request->parent->conn, client_request,
			DArray_get(client_insert->darr_insert_queries, client_insert->int_current_insert_query++), ws_insert_view_step3), "DB_exec failed");
	} else {
		SFINISH_CHECK(DB_exec(EV_A, client_request->parent->conn, client_request,
			DArray_get(client_insert->darr_insert_queries, client_insert->int_current_insert_query), ws_insert_view_step4), "DB_exec failed");
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
	return bol_ret;
}

bool ws_insert_view_step4(EV_P, void *cb_data, DB_result *res) {
	SDEBUG("ws_insert_step6: ALL ROWS INSERTED, STARTING COPY OUT");
	struct sock_ev_client_request *client_request = cb_data;
	struct sock_ev_client_insert *client_insert = (struct sock_ev_client_insert *)(client_request->client_request_data);
	char *str_response = NULL;
	bool bol_ret = true;
	size_t int_temp_len = 0;
	size_t int_response_len = 0;
	size_t int_sql_len = 0;
	SDEFINE_VAR_ALL(str_temp, str_sql);
	SFINISH_SNCAT(str_response, &int_response_len,
		"", (size_t)0);

	SFINISH_CHECK(res != NULL, "DB_exec failed");
	SFINISH_CHECK(res->status == DB_RES_COMMAND_OK, "DB_exec failed");

	SDEBUG("...DONE INSERTING");

	DB_free_result(res);

	SFINISH_SNCAT(str_sql, &int_sql_len,
		"COPY (SELECT ", (size_t)13,
		client_insert->str_return_columns, client_insert->int_return_columns_len,
		" FROM ", (size_t)6,
		client_insert->str_real_table_name, client_insert->int_real_table_name_len,
		" INNER JOIN ", (size_t)12,
		client_insert->str_temp_table_name, client_insert->int_temp_table_name_len,
		"_2 ON ", (size_t)6,
		client_insert->str_pk_return_where_clause, client_insert->int_pk_return_where_clause_len
	);

	if (client_insert->str_return_order_by != NULL) {
		SFINISH_SNFCAT(str_sql, &int_sql_len,
			" ORDER BY ", (size_t)10,
			client_insert->str_return_order_by, client_insert->int_return_order_by_len
		);
	}

	SFINISH_SNFCAT(str_sql, &int_sql_len,
		") TO STDOUT;", (size_t)12
	);
	SDEBUG("str_sql: >%s<", str_sql);

	SFINISH_CHECK(query_is_safe(str_sql), "SQL Injection detected");
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
	return bol_ret;
}

bool ws_insert_table_step1(EV_P, struct sock_ev_client_request *client_request) {
	struct sock_ev_client_insert *client_insert = (struct sock_ev_client_insert *)(client_request->client_request_data);
	SDEFINE_VAR_ALL(str_sql);
	char *str_response = NULL;
	bool bol_ret = true;
	size_t int_sql_len = 0;
	size_t int_response_len = 0;
	size_t int_i = 0;
	size_t int_num_sequence = DArray_count(client_insert->darr_sequence);

	SFINISH_SNCAT(str_sql, &int_sql_len, "SELECT ", (size_t)7);

	while (int_i < int_num_sequence) {
		char *str_seq = DArray_get(client_insert->darr_sequence, int_i);
		SFINISH_SNFCAT(
			str_sql, &int_sql_len,
			(int_i > 0 ? ", nextval(" : "nextval("), (size_t)(int_i > 0 ? 10 : 8),
			str_seq, strlen(str_seq),
			")", (size_t)1
		);
		SINFO("str_sql: %s", str_sql);
		int_i += 1;
	}

	SFINISH_CHECK(query_is_safe(str_sql), "SQL Injection detected");
	SFINISH_CHECK(DB_exec(EV_A, client_request->parent->conn, client_request, str_sql, ws_insert_table_step2), "DB_exec failed");

	bol_error_state = false;
	bol_ret = true;
finish:
	SFREE_ALL();
	if (bol_error_state == true) {
		bol_ret = false;
		bol_error_state = false;

		client_request->int_response_id += 1;
		char str_temp[101] = { 0 };
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
		_str_response = DB_get_diagnostic(client_request->parent->conn, NULL);
		SFINISH_SNFCAT(str_response, &int_response_len,
			":\n", (size_t)2,
			_str_response, strlen(_str_response));
		SFREE(_str_response);

		WS_sendFrame(EV_A, client_request->parent, true, 0x01, str_response, strlen(str_response));
		DArray_push(client_request->arr_response, str_response);
	}
	return bol_ret;
}

bool ws_insert_table_step2(EV_P, void *cb_data, DB_result *res) {
	struct sock_ev_client_request *client_request = cb_data;
	struct sock_ev_client_insert *client_insert = (struct sock_ev_client_insert *)(client_request->client_request_data);
	size_t int_len_content;
	SDEFINE_VAR_ALL(str_sql, str_where, str_real_table_name_literal);
	size_t int_sql_len = 0;
	size_t int_where_len = 0;
	char *str_response = NULL;
	size_t int_response_len = 0;
	bool bol_ret = true;
	DArray *darr_row = NULL;
	SFINISH_SNCAT(str_response, &int_response_len,
		"", (size_t)0);
	size_t int_i = 0;
	size_t int_num_sequence = 0;

	SFINISH_CHECK(res != NULL, "DB_exec failed");
	SFINISH_CHECK(res->status == DB_RES_TUPLES_OK, "DB_exec failed");

	// check if table or view here
	SFINISH_CHECK(DB_fetch_row(res) == DB_FETCH_OK, "DB_fetch_row failed");
	darr_row = DB_get_row_values(res);
	int_num_sequence = DArray_count(darr_row);

	SFINISH_SNCAT(client_insert->str_table_return_where, &client_insert->int_table_return_where_len, "", (size_t)0);

	while (int_i < int_num_sequence) {
		char *str_pk = DArray_get(client_insert->darr_pk, int_i);
		char *str_id = DArray_get(darr_row, int_i);
		SFINISH_SNFCAT(
			client_insert->str_table_return_where, &client_insert->int_table_return_where_len,
			str_pk, strlen(str_pk),
			" > ", (size_t)3,
			str_id, strlen(str_id)
		);
		SINFO("client_insert->str_table_return_where: %s", client_insert->str_table_return_where);
		int_i += 1;
	}

	SFINISH_SNCAT(
		str_sql, &int_sql_len,
		"INSERT INTO ", (size_t)12,
		client_insert->str_real_table_name, client_insert->int_real_table_name_len,
		" (", (size_t)2,
		client_insert->str_column_names, client_insert->int_column_names_len,
		") SELECT", (size_t)8,
		client_insert->str_column_names, client_insert->int_column_names_len,
		" FROM ", (size_t)6,
		client_insert->str_temp_table_name, client_insert->int_temp_table_name_len
	);

	DB_free_result(res);

	SFINISH_CHECK(query_is_safe(str_sql), "SQL Injection detected");
	SFINISH_CHECK(DB_exec(EV_A, client_request->parent->conn, client_request, str_sql, ws_insert_table_step3), "DB_exec failed");

	bol_error_state = false;
	bol_ret = true;
finish:
	SFREE_ALL();
	if (darr_row != NULL) {
		DArray_clear_destroy(darr_row);
		darr_row = NULL;
	}
	if (bol_error_state == true) {
		bol_error_state = false;
		bol_ret = false;

		client_request->int_response_id += 1;
		char str_temp[101] = { 0 };
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
	return bol_ret;
}

bool ws_insert_table_step3(EV_P, void *cb_data, DB_result *res) {
	struct sock_ev_client_request *client_request = cb_data;
	struct sock_ev_client_insert *client_insert = (struct sock_ev_client_insert *)(client_request->client_request_data);
	char *str_response = NULL;
	bool bol_ret = true;
	size_t int_temp_len = 0;
	size_t int_response_len = 0;
	size_t int_sql_len = 0;
	SDEFINE_VAR_ALL(str_temp, str_sql);
	SFINISH_SNCAT(str_response, &int_response_len,
		"", (size_t)0);

	SFINISH_CHECK(res != NULL, "DB_exec failed");
	SFINISH_CHECK(res->status == DB_RES_COMMAND_OK, "DB_exec failed");

	SDEBUG("...DONE INSERTING");

	DB_free_result(res);

	SFINISH_SNCAT(str_sql, &int_sql_len,
		"COPY (SELECT ", (size_t)13,
		client_insert->str_return_columns, client_insert->int_return_columns_len,
		" FROM ", (size_t)6,
		client_insert->str_real_table_name, client_insert->int_real_table_name_len,
		" WHERE ", (size_t)7,
		client_insert->str_table_return_where, client_insert->int_table_return_where_len,
		" AND xmin::text::bigint = txid_current()", (size_t)40
	);

	if (client_insert->str_return_order_by != NULL) {
		SFINISH_SNFCAT(str_sql, &int_sql_len,
			" ORDER BY ", (size_t)10,
			client_insert->str_return_order_by, client_insert->int_return_order_by_len
		);
	}

	SFINISH_SNFCAT(str_sql, &int_sql_len,
		") TO STDOUT;", (size_t)12
	);

	SDEBUG("client_insert->str_return_escaped_columns: >%s<", client_insert->str_return_escaped_columns);
	SDEBUG("strlen(client_insert->str_return_escaped_columns): >%d<", strlen(client_insert->str_return_escaped_columns));
	SDEBUG("client_insert->int_return_escaped_columns_len: >%d<", client_insert->int_return_escaped_columns_len);
	SINFO("str_sql: >%s<", str_sql);

	SFINISH_CHECK(query_is_safe(str_sql), "SQL Injection detected");
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
	return bol_ret;
}

void ws_insert_free(struct sock_ev_client_request_data *client_request_data) {
	struct sock_ev_client_insert *client_insert = (struct sock_ev_client_insert *)client_request_data;
	if (client_insert->darr_insert_queries != NULL) {
		DArray_clear_destroy(client_insert->darr_insert_queries);
		client_insert->darr_insert_queries = NULL;
	}
	SFREE(client_insert->str_return_columns);
	SFREE(client_insert->str_pk_where_clause);
	SFREE(client_insert->str_pk_join_clause);
	SFREE(client_insert->str_column_names);
	SFREE(client_insert->str_real_table_name);
	SFREE(client_insert->str_temp_table_name);
	SFREE(client_insert->str_schema_literal);
	SFREE(client_insert->str_table_literal);
	SFREE(client_insert->str_sequence_name);
	SFREE(client_insert->str_pk_columns);
	SFREE(client_insert->str_pk_return_where_clause);
	SFREE(client_insert->str_sql);
	SFREE(client_insert->str_table_return_where);
	SFREE(client_insert->str_return_order_by);
	if (client_insert->darr_sequence != NULL) {
		DArray_clear_destroy(client_insert->darr_sequence);
		client_insert->darr_sequence = NULL;
	}
	if (client_insert->darr_pk != NULL) {
		DArray_clear_destroy(client_insert->darr_pk);
		client_insert->darr_pk = NULL;
	}
	if (client_insert->darr_column_types != NULL) {
		DArray_clear_destroy(client_insert->darr_column_types);
		client_insert->darr_column_types = NULL;
	}
	if (client_insert->darr_column_values != NULL) {
		DArray_clear_destroy(client_insert->darr_column_values);
		client_insert->darr_column_values = NULL;
	}
	SFREE(client_insert->str_result);
	SFREE(client_insert->str_identity_column_name);
}
