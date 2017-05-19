#include "common_util_sql.h"

bool query_is_safe(char *str_query) {
	DArray *arr_sql = DArray_sql_split(str_query);
	SERROR_CHECK(arr_sql != NULL && DArray_end(arr_sql) == 1, "SQL Injection detected!");

	DArray_clear_destroy(arr_sql);
	return true;
error:
	DArray_clear_destroy(arr_sql);
	return false;
}

char *get_table_name(char *_str_query, size_t int_query_len, size_t *ptr_int_table_name_len) {
	char *str_temp = NULL;
	char *str_temp1 = NULL;
	char *ptr_table_name = NULL;
	char *ptr_end_table_name = NULL;
	char *str_table_name = NULL;
	char *str_query = NULL;

	size_t int_temp_len = 0;

	SERROR_SNCAT(
		str_query, &int_query_len,
		_str_query, int_query_len
	);

	ptr_table_name = str_query + 6;
	SERROR_CHECK(*ptr_table_name == '\t', "Invalid request");
	ptr_table_name += 1;
	ptr_end_table_name = ptr_table_name + strncspn(ptr_table_name, int_query_len - (size_t)(ptr_table_name - str_query), "\t\012", (size_t)2);
	bool bol_schema = *ptr_end_table_name == '\t';
	*ptr_end_table_name = '\0';

	SERROR_SNCAT(
		str_temp, &int_temp_len,
		ptr_table_name, ptr_end_table_name - ptr_table_name
	);

	if (str_temp[0] != '(') {
		SERROR_BREPLACE(str_temp, &int_temp_len, "\"", "\"\"", "g");

		str_temp1 = bunescape_value(str_temp, &int_temp_len);
		SERROR_CHECK(str_temp1 != NULL, "bunescape_value failed");
		SFREE(str_temp);
		str_temp = str_temp1;
		str_temp1 = NULL;

		SERROR_SNCAT(str_table_name, ptr_int_table_name_len,
			"\"", (size_t)1,
			str_temp, int_temp_len,
			"\"", (size_t)1);
		SFREE(str_temp);

		if (bol_schema) {
			ptr_table_name = ptr_end_table_name + 1;
			ptr_end_table_name = bstrstr(ptr_table_name, int_query_len - (size_t)(ptr_table_name - str_query), "\012", (size_t)1);
			SERROR_CHECK(ptr_end_table_name != NULL, "bstrstr failed");
			*ptr_end_table_name = 0;

			SERROR_SNCAT(str_temp, &int_temp_len, ptr_table_name, ptr_end_table_name - ptr_table_name);
			SERROR_BREPLACE(str_temp, &int_temp_len, "\"", "\"\"", "g");

			str_temp1 = bunescape_value(str_temp, &int_temp_len);
			SERROR_CHECK(str_temp1 != NULL, "bunescape_value failed");
			SFREE(str_temp);
			str_temp = str_temp1;
			str_temp1 = NULL;

			SERROR_SNFCAT(str_table_name, ptr_int_table_name_len,
				".\"", (size_t)2,
				str_temp, int_temp_len,
				"\"", (size_t)1);
			SFREE(str_temp);
		}
	} else {
		str_temp1 = bunescape_value(str_temp, &int_temp_len);
		SERROR_CHECK(str_temp1 != NULL, "bunescape_value failed");
		SFREE(str_temp);
		str_temp = str_temp1;
		str_temp1 = NULL;
		SERROR_SNCAT(str_table_name, ptr_int_table_name_len, str_temp, int_temp_len);

		SFREE(str_temp);
	}

	SFREE(str_query);

	return str_table_name;
error:
	SFREE(str_temp1);
	SFREE(str_temp);
	SFREE(str_query);
	*ptr_int_table_name_len = 0;

	SFREE(str_table_name);
	return NULL;
}

char *get_return_columns(char *_str_query, size_t int_query_len, char *str_table_name, size_t int_table_name_len, size_t *ptr_int_return_columns_len) {
	char *str_temp = NULL;
	char *str_temp1 = NULL;
	char *ptr_return_columns = NULL;
	char *ptr_end_return_columns = NULL;
	char *str_return_columns = NULL;
	char *str_query = NULL;
	char *ptr_table_replace = NULL;
	size_t int_temp_len = 0;

	SERROR_SNCAT(
		str_query, &int_query_len,
		_str_query, int_query_len
	);

	ptr_return_columns = bstrstr(str_query, int_query_len, "RETURN\t", (size_t)7);
	SERROR_CHECK(ptr_return_columns != NULL, "strstr failed");
	ptr_return_columns += 7;
	ptr_end_return_columns = bstrstr(ptr_return_columns, int_query_len - (size_t)(ptr_return_columns - str_query), "\012", (size_t)1);
	SERROR_CHECK(ptr_end_return_columns != NULL, "strstr failed");
	*ptr_end_return_columns = 0;

	SERROR_SNCAT(
		str_temp, &int_temp_len,
		ptr_return_columns, (size_t)(ptr_end_return_columns - ptr_return_columns)
	);

	if (strncmp(str_temp, "*", 2) != 0) {
		SERROR_BREPLACE(str_temp, &int_temp_len, "\"", "\"\"", "g");
		SERROR_BREPLACE(str_temp, &int_temp_len, "\t", "\", {{TABLE}}.\"", "g");

		str_temp1 = bunescape_value(str_temp, &int_temp_len);
		SERROR_CHECK(str_temp1 != NULL, "bunescape_value failed");
		SFREE(str_temp);
		str_temp = str_temp1;
		str_temp1 = NULL;

		SERROR_SNCAT(
			str_return_columns, ptr_int_return_columns_len,
			"{{TABLE}}.\"", (size_t)11,
			str_temp, int_temp_len,
			"\"", (size_t)1
		);
		SFREE(str_temp);

		//SERROR_BREPLACE(str_return_columns, ptr_int_return_columns_len, "{{TABLE}}", str_table_name, "g");

		SERROR_SNCAT(
			str_temp, &int_temp_len,
			"", (size_t)0
		);
		ptr_table_replace = bstrstr(str_return_columns, *ptr_int_return_columns_len, "{{TABLE}}", (size_t)9);
		while (ptr_table_replace != NULL) {
			SERROR_SNFCAT(
				str_temp, &int_temp_len,
				str_table_name, int_table_name_len
			);

			char *ptr_next_table_replace = bstrstr(ptr_table_replace + 9, (*ptr_int_return_columns_len) - (size_t)((ptr_table_replace + 9) - str_return_columns), "{{TABLE}}", (size_t)9);
			size_t int_copy_after_len = 0;
			if (ptr_next_table_replace == NULL) {
				int_copy_after_len = (*ptr_int_return_columns_len) - (size_t)((ptr_table_replace + 9) - str_return_columns);
			} else {
				int_copy_after_len = (size_t)(ptr_next_table_replace - (ptr_table_replace + 9));
			}
			SERROR_SNFCAT(
				str_temp, &int_temp_len,
				ptr_table_replace + 9, int_copy_after_len
			);

			ptr_table_replace = ptr_next_table_replace;
		}
		*ptr_int_return_columns_len = int_temp_len;
		SFREE(str_return_columns);
		str_return_columns = str_temp;
		str_temp = NULL;

	} else {
		SERROR_SNCAT(str_return_columns, ptr_int_return_columns_len, str_temp, int_temp_len);
	}
	SFREE(str_temp);
	SFREE(str_query);

	return str_return_columns;
error:
	SFREE(str_temp);
	SFREE(str_temp1);
	SFREE(str_query);
	*ptr_int_return_columns_len = 0;

	SFREE(str_return_columns);
	return NULL;
}

#ifndef POSTAGE_INTERFACE_LIBPQ
char *get_return_escaped_columns(DB_driver driver, char *_str_query, size_t int_query_len, size_t *ptr_int_return_columns_len) {
	char *str_temp = NULL;
	char *str_temp1 = NULL;
	char *ptr_return_columns = NULL;
	char *ptr_end_return_columns = NULL;
	char *str_return_columns = NULL;
	char *str_query = NULL;
	size_t int_temp_len = 0;

	SERROR_SNCAT(
		str_query, &int_query_len,
		_str_query, int_query_len
	);

	ptr_return_columns = bstrstr(str_query, int_query_len, "RETURN\t", (size_t)7);
	SERROR_CHECK(ptr_return_columns != NULL, "strstr failed");
	ptr_return_columns += 7;
	ptr_end_return_columns = bstrstr(ptr_return_columns, int_query_len - (size_t)(ptr_return_columns - str_query), "\012", (size_t)1);
	SERROR_CHECK(ptr_end_return_columns != NULL, "strstr failed");
	*ptr_end_return_columns = 0;

	SERROR_SNCAT(str_temp, &int_temp_len, ptr_return_columns, ptr_end_return_columns - ptr_return_columns);
	if (strncmp(str_temp, "*", 2) != 0) {
		SERROR_BREPLACE(str_temp, &int_temp_len, "\"", "\"\"", "g");

		SERROR_BREPLACE(str_temp, &int_temp_len, "\\t", "TABHERE3141592653589793TABHERE", "g");
		str_temp1 = bunescape_value(str_temp, &int_temp_len);
		SERROR_CHECK(str_temp1 != NULL, "bunescape_value failed");
		SFREE(str_temp);
		str_temp = str_temp1;
		str_temp1 = NULL;
		if (driver == DB_DRIVER_POSTGRES) {
			SERROR_BREPLACE(str_temp, &int_temp_len, "\t", "\"::text, '\\N'), '\\\\', '\\\\\\\\'), '\t', '\\t'), chr(10), '\\n'), chr(13), '\\r') || E'\\t' || replace(replace(replace(replace(COALESCE(\"", "g");
		} else {
			SERROR_BREPLACE(str_temp, &int_temp_len, "\t",
				"\" AS nvarchar(MAX)), CAST('\\N' AS nvarchar(MAX))) AS nvarchar(MAX)), '\\\\', '\\\\\\\\'), '\t', '\\t'), CHAR(10), '\\n'), CHAR(13), '\\r') + "
				"CAST('\t' AS nvarchar(MAX)) + replace(replace(replace(replace(CAST(COALESCE(CAST(\"", "g");
		}
		SERROR_BREPLACE(str_temp, &int_temp_len, "TABHERE3141592653589793TABHERE", "\t", "g");
		if (driver == DB_DRIVER_POSTGRES) {
			SERROR_SNCAT(str_return_columns, ptr_int_return_columns_len,
				"replace(replace(replace(replace(COALESCE(\"", (size_t)42,
				str_temp, int_temp_len,
				"\"::text, '\\N'), '\\\\', '\\\\\\\\'), '\t', '\\t'), chr(10), '\\n'), chr(13), '\\r') || E'\n'", (size_t)81);
		} else {
			SERROR_SNCAT(str_return_columns, ptr_int_return_columns_len,
				"replace(replace(replace(replace(CAST(COALESCE(CAST(\"", (size_t)52,
				str_temp, int_temp_len,
				"\" AS nvarchar(MAX)), CAST('\\N' AS nvarchar(MAX))) AS nvarchar(MAX)), '\\\\', '\\\\\\\\'), '\t', '\\t'), CHAR(10), '\\n'), CHAR(13), '\\r') + CAST(CHAR(10) AS nvarchar(MAX))", (size_t)162);
		}
		SFREE(str_temp);
	} else {
		SERROR_SNCAT(str_return_columns, ptr_int_return_columns_len, str_temp, int_temp_len);
	}
	SFREE(str_temp);
	SFREE(str_query);

	return str_return_columns;
error:
	SFREE(str_temp);
	SFREE(str_temp1);
	SFREE(str_query);
	*ptr_int_return_columns_len = 0;

	SFREE(str_return_columns);
	return NULL;
}
#endif

char *get_hash_columns(char *_str_query, size_t int_query_len, size_t *ptr_int_hash_columns_len) {
	char *str_temp1 = NULL;
	char *ptr_hash_columns = NULL;
	char *ptr_end_hash_columns = NULL;
	char *str_hash_columns = NULL;
	char *str_query = NULL;

	SERROR_SNCAT(
		str_query, &int_query_len,
		_str_query, int_query_len
	);

	ptr_hash_columns = strstr(str_query, "HASH\t");
	SERROR_CHECK(ptr_hash_columns != NULL, "strstr failed");
	ptr_hash_columns += 5;
	ptr_end_hash_columns = strstr(ptr_hash_columns, "\012");
	SERROR_CHECK(ptr_end_hash_columns != NULL, "strstr failed");
	*ptr_end_hash_columns = 0;

	SERROR_SNCAT(str_hash_columns, ptr_int_hash_columns_len,
		ptr_hash_columns, ptr_end_hash_columns - ptr_hash_columns);
	SFREE(str_query);

	return str_hash_columns;
error:
	SFREE(str_temp1);
	SFREE(str_query);
	*ptr_int_hash_columns_len = 0;

	SFREE(str_hash_columns);
	return NULL;
}

bool ws_copy_check_cb(EV_P, bool bol_success, bool bol_last, void *cb_data, char *arg_str_response, size_t int_len) {
	struct sock_ev_client_request *client_request = cb_data;
	char *str_response = NULL;
	size_t int_response_len = 0;
	SFINISH_SNCAT(str_response, &int_len, arg_str_response, int_len);
	SFREE(str_global_error);

	if (client_request->bol_cancel_return == true) {
		if (bol_last) {
			SDEBUG("client_request->str_current_response: %s", client_request->str_current_response);
			WS_sendFrame(EV_A, client_request->parent, true, 0x01, client_request->str_current_response,
				client_request->int_current_response_length);
			DArray_push(client_request->arr_response, client_request->str_current_response);
			client_request->str_current_response = NULL;
			client_request->int_current_response_length = 0;

			if (client_request->int_req_type == POSTAGE_REQ_INSERT) {
				ws_insert_free(client_request->client_request_data);
			} else if (client_request->int_req_type == POSTAGE_REQ_UPDATE) {
				ws_update_free(client_request->client_request_data);
			} else if (client_request->int_req_type == POSTAGE_REQ_SELECT) {
				ws_select_free(client_request->client_request_data);
			}
		}

	} else {
		if (bol_success) {
			if (client_request->str_current_response == NULL && !bol_last) {
				SDEBUG("Build Message Headers...");
				client_request->int_response_id += 1;
				char str_temp[101] = {0};
				snprintf(str_temp, 100, "%zd", client_request->int_response_id);

				SFINISH_SNCAT(client_request->str_current_response, &client_request->int_current_response_length,
					"messageid = ", (size_t)12,
					client_request->str_message_id, strlen(client_request->str_message_id),
					"\012"
					"responsenumber = ", (size_t)18,
					str_temp, strlen(str_temp),
					"\012", (size_t)1);
				if (client_request->str_transaction_id != NULL) {
					SFINISH_SNFCAT(
						client_request->str_current_response, &client_request->int_current_response_length,
						"transactionid = ", (size_t)16,
						client_request->str_transaction_id, strlen(client_request->str_transaction_id),
						"\012", (size_t)1);
				}
			}

			if (!bol_last) {
				SDEBUG("Add row to Message...");
				SFINISH_SREALLOC(client_request->str_current_response, client_request->int_current_response_length + int_len + 1);
				memcpy(client_request->str_current_response + client_request->int_current_response_length, str_response, int_len);
				client_request->str_current_response[client_request->int_current_response_length + int_len] = '\0';
				client_request->int_current_response_length += int_len;
			}

			client_request->int_row_num += 1;
			if ((client_request->int_row_num % 10) == 0 || (bol_last && client_request->str_current_response != NULL)) {
				SDEBUG("Send Message...");
				WS_sendFrame(EV_A, client_request->parent, true, 0x01, client_request->str_current_response,
					client_request->int_current_response_length);
				DArray_push(client_request->arr_response, client_request->str_current_response);
				client_request->str_current_response = NULL;
				client_request->int_current_response_length = 0;
			}

			// If copy_check is null, that means we are on the last message of the request
			if (client_request->parent->conn->copy_check != NULL && close_client_if_needed(client_request->parent, (ev_watcher *)&client_request->parent->conn->copy_check->check, EV_CHECK)) {
				ev_check_stop(EV_A, &client_request->parent->conn->copy_check->check);
				client_request->parent->client_paused_request->bol_free_watcher = true;
				SDEBUG("client_request->parent->cur_request: %p", client_request->parent->cur_request);
				decrement_idle(EV_A);
				SFREE(str_response);
				return false;
			}

			if (bol_last) {
				SDEBUG("Build Message Headers...");
				client_request->int_response_id += 1;
				char str_temp[101] = {0};
				snprintf(str_temp, 100, "%zd", client_request->int_response_id);

				SFINISH_SNCAT(client_request->str_current_response, &client_request->int_current_response_length,
					"messageid = ", (size_t)12,
					client_request->str_message_id, strlen(client_request->str_message_id),
					"\012"
					"responsenumber = ", (size_t)18,
					str_temp, strlen(str_temp),
					"\012", (size_t)1);
				if (client_request->str_transaction_id != NULL) {
					SFINISH_SNFCAT(
						client_request->str_current_response, &client_request->int_current_response_length,
						"transactionid = ", (size_t)16,
						client_request->str_transaction_id, strlen(client_request->str_transaction_id),
						"\012", (size_t)1);
				}

				SFINISH_SNFCAT(client_request->str_current_response, &client_request->int_current_response_length,
					"TRANSACTION COMPLETED", (size_t)21);

				SDEBUG("Send \"TRANSACTION COMPLETED\" Message...");
				WS_sendFrame(EV_A, client_request->parent, true, 0x01, client_request->str_current_response,
					client_request->int_current_response_length);
				DArray_push(client_request->arr_response, client_request->str_current_response);
				client_request->str_current_response = NULL;
				client_request->int_current_response_length = 0;

				if (client_request->int_req_type == POSTAGE_REQ_INSERT) {
					ws_insert_free(client_request->client_request_data);
				} else if (client_request->int_req_type == POSTAGE_REQ_UPDATE) {
					ws_update_free(client_request->client_request_data);
				} else if (client_request->int_req_type == POSTAGE_REQ_SELECT) {
					ws_select_free(client_request->client_request_data);
				}
			}

		} else {
			SDEBUG("Error...");
			if (client_request->str_current_response != NULL) {
				SDEBUG("Send Message...");
				WS_sendFrame(EV_A, client_request->parent, true, 0x01, client_request->str_current_response,
					client_request->int_current_response_length);
				DArray_push(client_request->arr_response, client_request->str_current_response);
				client_request->str_current_response = NULL;
				client_request->int_current_response_length = 0;
			}

			client_request->int_response_id += 1;
			char str_temp[101] = {0};
			snprintf(str_temp, 100, "%zd", client_request->int_response_id);

			SDEBUG("Send Error...");
			SFINISH_SNCAT(client_request->str_current_response, &client_request->int_current_response_length,
				"messageid = ", (size_t)12,
				client_request->str_message_id, strlen(client_request->str_message_id),
				"\012"
				"responsenumber = ", (size_t)18,
				str_temp, strlen(str_temp),
				"\012", (size_t)1);
			if (client_request->str_transaction_id != NULL) {
				SFINISH_SNFCAT(
					client_request->str_current_response, &client_request->int_current_response_length,
					"transactionid = ", (size_t)16,
					client_request->str_transaction_id, strlen(client_request->str_transaction_id),
					"\012", (size_t)1);
			}
			SFINISH_SREALLOC(client_request->str_current_response, client_request->int_current_response_length + int_len + 6 + 1);

			memcpy(client_request->str_current_response + client_request->int_current_response_length, "FATAL\012", 6);
			client_request->int_current_response_length += 6;

			memcpy(client_request->str_current_response + client_request->int_current_response_length, str_response, int_len);
			client_request->int_current_response_length += int_len;
			client_request->str_current_response[client_request->int_current_response_length] = 0;

			SDEBUG("client_request->str_current_response: >%s<", client_request->str_current_response);
			SDEBUG("client_request->arr_response: >%p<", client_request->arr_response);
			SDEBUG("client_request->arr_response->contents: >%p<", client_request->arr_response->contents);

			WS_sendFrame(EV_A, client_request->parent, true, 0x01, client_request->str_current_response,
				client_request->int_current_response_length);
			DArray_push(client_request->arr_response, client_request->str_current_response);

			client_request->str_current_response = NULL;
			client_request->int_current_response_length = 0;

			if (client_request->int_req_type == POSTAGE_REQ_INSERT) {
				ws_insert_free(client_request->client_request_data);
			} else if (client_request->int_req_type == POSTAGE_REQ_UPDATE) {
				ws_update_free(client_request->client_request_data);
			} else if (client_request->int_req_type == POSTAGE_REQ_SELECT) {
				ws_select_free(client_request->client_request_data);
			}
		}
	}

finish:
	if (bol_error_state == true) {
		bol_error_state = false;
		// Get an error message
		char *_str_response = str_response;
		if (client_request->str_transaction_id != NULL) {
			SFINISH_SNCAT(str_response, &int_response_len,
				"messageid = ", (size_t)12,
				client_request->str_message_id, strlen(client_request->str_message_id),
				"\012transactionid = ", (size_t)17,
				client_request->str_transaction_id, strlen(client_request->str_transaction_id),
				"\012", (size_t)1,
				_str_response, strlen(_str_response));
		} else {
			SFINISH_SNCAT(str_response, &int_response_len,
				"messageid = ", (size_t)12,
				client_request->str_message_id, strlen(client_request->str_message_id),
				"\012", (size_t)1,
				_str_response, strlen(_str_response));
		}
		SFREE(_str_response);

		WS_sendFrame(EV_A, client_request->parent, true, 0x01, str_response, strlen(str_response));
		DArray_push(client_request->arr_response, str_response);
		str_response = NULL;

		if (client_request->int_req_type == POSTAGE_REQ_INSERT) {
			ws_insert_free(client_request->client_request_data);
		} else if (client_request->int_req_type == POSTAGE_REQ_UPDATE) {
			ws_update_free(client_request->client_request_data);
		} else if (client_request->int_req_type == POSTAGE_REQ_SELECT) {
			ws_select_free(client_request->client_request_data);
		}
		return false;
	}
	SFREE(str_response);
	return true;
}

bool http_copy_check_cb(EV_P, bool bol_success, bool bol_last, void *cb_data, char *arg_str_response, size_t int_response_len) {
	if (EV_A != 0) {
	} // get rid of unused parameter warning
	struct sock_ev_client_request *client_request = cb_data;
	struct sock_ev_client *client = client_request->parent;
	SDEFINE_VAR_ALL(str_header, _str_response);
	char *str_response = NULL;
	size_t int_header_len = 0;
	ssize_t int_response_write_len = 0;
	size_t _int_response_len = 0;
	char str_length[50];

	SFINISH_SNCAT(str_response, &int_response_len, arg_str_response, int_response_len);

	memset(str_length, 0, 50);
	SDEBUG("str_response: %s", str_response);
	SFREE(str_global_error);

	if (bol_success) {
		if (client_request->str_current_response == NULL) {
			SFINISH_SALLOC(client_request->str_current_response, int_response_len + 1);
			memcpy(client_request->str_current_response, str_response, int_response_len);
			client_request->str_current_response[int_response_len] = '\0';
			client_request->int_current_response_length = int_response_len;
		} else if (!bol_last) {
			SFINISH_SREALLOC(
				client_request->str_current_response, client_request->int_current_response_length + int_response_len + 1);
			memcpy(client_request->str_current_response + client_request->int_current_response_length, str_response,
				int_response_len);
			client_request->str_current_response[client_request->int_current_response_length + int_response_len] = '\0';
			client_request->int_current_response_length += int_response_len;
		}

		if (bol_last) {
			snprintf(str_length, 50, "%zd", client_request->int_current_response_length);
			SFINISH_SNCAT(str_header, &int_header_len,
				"HTTP/1.1 200 OK\015\012"
				"Server: " SUN_PROGRAM_LOWER_NAME "\015\012"
				"Connection: close\015\012"
				"Content-Length: ",strlen("HTTP/1.1 200 OK\015\012"
					"Server: " SUN_PROGRAM_LOWER_NAME "\015\012"
					"Connection: close\015\012"
					"Content-Length: "),
				str_length, strlen(str_length),
				"\015\012\015\012", (size_t)4);
			SDEBUG("str_header: %s", str_header);

			SFINISH_SALLOC(_str_response, client_request->int_current_response_length + int_header_len + 1);
			memcpy(_str_response, str_header, int_header_len);
			memcpy(_str_response + int_header_len, client_request->str_current_response,
				client_request->int_current_response_length);
			_str_response[client_request->int_current_response_length + int_header_len] = '\0';

			SDEBUG("_str_response: %s", _str_response);
			if ((int_response_write_len = client_write(client, _str_response, client_request->int_current_response_length + int_header_len)) < 0) {
				SERROR_NORESPONSE("client_write() failed");
			}
			SDEBUG("int_response_write_len: %d", int_response_write_len);
			SFREE(_str_response);

			SFINISH_CLIENT_CLOSE(client);
		}

	} else {
		bol_error_state = true;
	}

finish:
	SFREE_ALL();
	if (bol_error_state == true) {
		bol_error_state = false;
		snprintf(str_length, 50, "%zu", strlen(str_response));
		SFINISH_SNCAT(_str_response, &_int_response_len,
			"HTTP/1.1 500 Internal Server Error\015\012"
			"Server: " SUN_PROGRAM_LOWER_NAME "\015\012"
			"Connection: close\015\012"
			"Content-Length: ", strlen("HTTP/1.1 500 Internal Server Error\015\012"
				"Server: " SUN_PROGRAM_LOWER_NAME "\015\012"
				"Connection: close\015\012"
				"Content-Length: "),
			str_length, strlen(str_length),
			"\015\012\015\012", (size_t)4,
			str_response, int_response_len);

		SFREE(str_response);
		if ((int_response_write_len = client_write(client, _str_response, strlen(_str_response) + int_header_len)) < 0) {
			SERROR_NORESPONSE("client_write() failed");
		}
		SFREE(_str_response);

		SFINISH_CLIENT_CLOSE(client);

		return false;
	}
	SFREE(str_response);
	return true;
}

#ifdef ENVELOPE
bool permissions_check(EV_P, DB_conn *conn, char *str_path, void *cb_data, readable_cb_t readable_cb) {
	char *ptr_path = str_path;
	if (*ptr_path == '/') {
		ptr_path++;
	}

	if (strncmp(ptr_path, "role/", 5) == 0 || strncmp(ptr_path, "role", 5) == 0) {
		if (strlen(ptr_path) > 5) {
			return ddl_readable(EV_A, conn, ptr_path + 4, false, cb_data, readable_cb);
		} else {
			return readable_cb(EV_A, cb_data, true);
		}
	} else if (strncmp(ptr_path, "web_root/", 9) == 0 || strncmp(ptr_path, "web_root", 9) == 0) {
		return ddl_readable(EV_A, conn, "developer_g", false, cb_data, readable_cb);
	} else if (strncmp(ptr_path, "app/", 4) == 0 || strncmp(ptr_path, "app", 4) == 0) {
		if (strlen(ptr_path) > 4) {
			return ddl_readable(EV_A, conn, ptr_path + 3, false, cb_data, readable_cb);
		} else {
			return readable_cb(EV_A, cb_data, true);
		}
	} else {
		return false;
	}

	return false;
}

bool permissions_write_check(EV_P, DB_conn *conn, char *str_path, void *cb_data, readable_cb_t readable_cb) {
	char *ptr_path = str_path;
	if (*ptr_path == '/') {
		ptr_path++;
	}

	if (strncmp(ptr_path, "role/", 5) == 0 || strncmp(ptr_path, "role", 5) == 0) {
		if (strlen(ptr_path) > 5) {
			return ddl_readable(EV_A, conn, ptr_path + 4, true, cb_data, readable_cb);
		} else {
			return readable_cb(EV_A, cb_data, true);
		}
	} else if (strncmp(ptr_path, "web_root/", 9) == 0 || strncmp(ptr_path, "web_root", 9) == 0) {
		return ddl_readable(EV_A, conn, "developer_g", false, cb_data, readable_cb);
	} else if (strncmp(ptr_path, "app/", 4) == 0 || strncmp(ptr_path, "app", 4) == 0) {
		if (strlen(ptr_path) > 4) {
			return ddl_readable(EV_A, conn, ptr_path + 3, false, cb_data, readable_cb);
		} else {
			return readable_cb(EV_A, cb_data, true);
		}
	} else {
		return false;
	}

	return false;
}

char *canonical_strip_start(char *str_path) {
	char *str_return = NULL;
	char *ptr_path = str_path;
	size_t int_return_len = 0;
	if (*ptr_path == '/') {
		ptr_path++;
	}

	if (strncmp(ptr_path, "role/", 5) == 0) {
		ptr_path += 5;
	} else if (strncmp(ptr_path, "role", 5) == 0) {
		ptr_path += 4;
	} else if (strncmp(ptr_path, "web_root/", 9) == 0) {
		ptr_path += 9;
	} else if (strncmp(ptr_path, "web_root", 9) == 0) {
		ptr_path += 8;
	} else if (strncmp(ptr_path, "app/", 4) == 0) {
		ptr_path += 4;
	} else if (strncmp(ptr_path, "app", 4) == 0) {
		ptr_path += 3;
	} else {
		SERROR("Starting path not recognized.");
	}

	SERROR_SNCAT(str_return, &int_return_len, ptr_path, strlen(ptr_path));

	return str_return;
error:
	SFREE(str_return);
	return NULL;
}

char *canonical_full_start(char *str_path) {
	char *str_return = NULL;
	char *ptr_path = str_path;
	if (*ptr_path == '/') {
		ptr_path++;
	}
	size_t int_return_len = 0;

	if (strncmp(ptr_path, "role/", 5) == 0 || strncmp(ptr_path, "role", 5) == 0) {
		SERROR_SNCAT(str_return, &int_return_len,
			str_global_role_path, strlen(str_global_role_path));

	} else if (strncmp(ptr_path, "web_root/", 9) == 0 || strncmp(ptr_path, "web_root", 9) == 0) {
		SERROR_SNCAT(str_return, &int_return_len,
			str_global_web_root, strlen(str_global_web_root));

	} else if (strncmp(ptr_path, "app/", 4) == 0 || strncmp(ptr_path, "app", 4) == 0) {
		SERROR_SNCAT(str_return, &int_return_len,
			str_global_app_path, strlen(str_global_app_path));

	} else {
		SERROR("Starting path not recognized.");
	}

	return str_return;
error:
	SFREE(str_return);
	return NULL;
}
#endif // ENVELOPE

static bool ddl_readable_done(EV_P, void *cb_data, DB_result *res);
bool ddl_readable(EV_P, DB_conn *conn, char *str_path, bool bol_writeable, void *cb_data, readable_cb_t readable_cb) {
	SNOTICE("SQL.C READABLE");
	DB_readable_poll *readable_poll = NULL;
	size_t int_folder_write_len = 0;
	size_t int_folder_len = 0;
	size_t int_sql_len = 0;

	SDEFINE_VAR_ALL(str_folder, str_folder_write, str_folder_literal, str_folder_write_literal, str_sql);

	SERROR_CHECK(cb_data != NULL, "cb_data == NULL");
	SERROR_CHECK(readable_cb != NULL, "readable_cb == NULL");

	char *ptr_path = str_path;
	while (*ptr_path == '/') {
		ptr_path++;
	}
	char *ptr_slash = strchr(ptr_path, '/');
	size_t slash_position;
	if (ptr_slash == 0) {
		slash_position = strlen(ptr_path);
	} else {
		slash_position = (size_t)(ptr_slash - ptr_path);
	}
	SDEBUG("str_path      : %p (%s)", str_path, str_path);
	SDEBUG("ptr_path      : %p (%s)", ptr_path, ptr_path);
	SDEBUG("ptr_slash     : %p (%s)", ptr_slash, ptr_slash);
	SDEBUG("slash_position: %d", slash_position);

	if (bol_writeable) {
		SERROR_SNCAT(str_folder_write, &int_folder_write_len,
			ptr_path, strlen(ptr_path));
		str_folder_write[slash_position - 1] = 'w';
		str_folder_write[slash_position] = '\0';
		str_folder_write_literal = DB_escape_literal(conn, str_folder_write, int_folder_write_len);
		SERROR_CHECK(str_folder_write_literal != NULL, "DB_escape_literal failed");
	}

	SERROR_SNCAT(str_folder, &int_folder_len,
		ptr_path, strlen(ptr_path));
	str_folder[slash_position] = '\0';
	str_folder_literal = DB_escape_literal(conn, str_folder, strlen(str_folder));
	SERROR_CHECK(str_folder_literal != NULL, "DB_escape_literal failed");

	SDEBUG(">%s|%s<", ptr_path, str_folder);
	SFREE(str_folder);
	if (DB_connection_driver(conn) == DB_DRIVER_POSTGRES) {
		if (bol_writeable) {
			SERROR_SNCAT(str_sql, &int_sql_len,
				"\
			SELECT CASE WHEN count(*) > 0 OR lower(", (size_t)42,
				str_folder_literal, strlen(str_folder_literal),
				") = 'all' OR lower(", (size_t)19,
				str_folder_literal, strlen(str_folder_literal),
				") = lower(session_user) THEN 'TRUE' ELSE 'FALSE' END::text \
			FROM pg_roles r \
			JOIN pg_auth_members ON r.oid=roleid \
			JOIN pg_roles u ON member = u.oid \
			WHERE (lower(r.rolname) = lower(", (size_t)190,
				str_folder_write_literal, strlen(str_folder_write_literal),
				") OR \
				  lower(r.rolname) = 'developer_g') AND lower(u.rolname) = lower(session_user); \
			", (size_t)92);
		} else {
			SERROR_SNCAT(str_sql, &int_sql_len,
				"\
			SELECT CASE WHEN count(*) > 0 OR 'all' = lower(", (size_t)50,
				str_folder_literal, strlen(str_folder_literal),
				") OR '' = ", (size_t)10,
				str_folder_literal, strlen(str_folder_literal),
				" OR lower(", (size_t)10,
				str_folder_literal, strlen(str_folder_literal),
				") = lower(session_user) THEN 'TRUE' ELSE 'FALSE' END::text \
			FROM pg_roles r \
			JOIN pg_auth_members ON r.oid=roleid \
			JOIN pg_roles u ON member = u.oid \
			WHERE (lower(r.rolname) = lower(", (size_t)190,
				str_folder_literal, strlen(str_folder_literal),
				") OR \
				  lower(r.rolname) = 'developer_g') AND lower(u.rolname) = lower(session_user);", (size_t)88);
		}
	} else {
		if (bol_writeable) {
			SERROR_SNCAT(str_sql, &int_sql_len,
				"SELECT CASE WHEN IS_MEMBER(", (size_t)27,
				str_folder_write_literal, strlen(str_folder_write_literal),
				") = 1 OR 'all' = lower(", (size_t)23,
				str_folder_literal, strlen(str_folder_literal),
				") OR '' = ", (size_t)10,
				str_folder_literal, strlen(str_folder_literal),
				" OR lower(", (size_t)10,
				str_folder_literal, strlen(str_folder_literal),
				") = lower(session_user) THEN 'TRUE' ELSE 'FALSE' END;", (size_t)53);
		} else {
			SERROR_SNCAT(str_sql, &int_sql_len,
				"SELECT CASE WHEN IS_MEMBER(", (size_t)27,
				str_folder_literal, strlen(str_folder_literal),
				") = 1 OR 'all' = lower(", (size_t)23,
				str_folder_literal, strlen(str_folder_literal),
				") OR '' = ", (size_t)10,
				str_folder_literal, strlen(str_folder_literal),
				" OR lower(", (size_t)10,
				str_folder_literal, strlen(str_folder_literal),
				") = lower(session_user) THEN 'TRUE' ELSE 'FALSE' END;", (size_t)53);
		}
	}
	SDEBUG(">%s<", str_sql);
	SFREE(str_folder_literal);
	SFREE(str_folder_write_literal);

	SERROR_SALLOC(readable_poll, sizeof(DB_readable_poll));
	readable_poll->cb_data = cb_data;
	readable_poll->readable_cb = readable_cb;
	DB_exec(EV_A, conn, readable_poll, str_sql, ddl_readable_done);

	SFREE(str_sql);
	SFREE_ALL();
	return true;
error:
	SFREE_ALL();
	return false;
}

static bool ddl_readable_done(EV_P, void *cb_data, DB_result *res) {
	SINFO("SQL.C READABLE END");
	DB_readable_poll *readable_poll = cb_data;
	DArray *arr_row_values = NULL;
	DArray *arr_row_lengths = NULL;
	bool bol_return = true;
	bool bol_result = 0;

	SERROR_CHECK(res != NULL, "Query failed: res == NULL");
	SERROR_CHECK(res->status == DB_RES_TUPLES_OK, "Query failed: %s", DB_get_diagnostic(res->conn, res));

	SERROR_CHECK(DB_fetch_row(res) == DB_FETCH_OK, "DB_fetch_row failed: %s", DB_get_diagnostic(res->conn, res));
	arr_row_values = DB_get_row_values(res);
	arr_row_lengths = DB_get_row_lengths(res);

	SDEBUG("DArray_get(arr_row_values, 0): %s", DArray_get(arr_row_values, 0));
	SDEBUG("result: %s", strncmp(DArray_get(arr_row_values, 0), "TRUE", 4) == 0 ? "true" : "false");
	bol_result = strncmp(DArray_get(arr_row_values, 0), "TRUE", 4) == 0;

	DArray_clear_destroy(arr_row_values);
	DArray_clear_destroy(arr_row_lengths);

	DB_free_result(res);

	bol_return = readable_poll->readable_cb(EV_A, readable_poll->cb_data, bol_result);

	SFREE(readable_poll);
	return bol_return;
error:
	if (arr_row_values != NULL) {
		DArray_clear_destroy(arr_row_values);
	}
	if (arr_row_lengths != NULL) {
		DArray_clear_destroy(arr_row_lengths);
	}
	return false;
}
