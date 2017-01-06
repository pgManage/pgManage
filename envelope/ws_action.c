#include "ws_select.h"

char *ws_action_step1(struct sock_ev_client_request *client_request) {
	SDEFINE_VAR_ALL(str_schema, str_action_name, str_action_full_name, str_args, str_sql);
	char *str_response = NULL;
	char *ptr_schema = NULL;
	char *ptr_action_name = NULL;
	char *ptr_args = NULL;
	char *ptr_args_end = NULL;
	size_t int_request_length = 0;

	client_request->arr_response = DArray_create(sizeof(char *), 1);
	SFINISH_CHECK(client_request->arr_response != NULL, "DArray_create failed");

	int_request_length =
		(size_t)client_request->frame->int_length - (size_t)(client_request->ptr_query - client_request->frame->str_message);

	ptr_schema = bstrstr(client_request->ptr_query, int_request_length, "\t", 1);
	SFINISH_CHECK(ptr_schema != NULL, "bstrstr failed");
	ptr_schema += 1;

	ptr_action_name = bstrstr(ptr_schema, int_request_length - (size_t)(ptr_schema - client_request->ptr_query), "\t", 1);
	SFINISH_CHECK(ptr_action_name != NULL, "bstrstr failed");
	*ptr_action_name = 0;
	ptr_action_name += 1;

	ptr_args = bstrstr(ptr_action_name, int_request_length - (size_t)(ptr_action_name - client_request->ptr_query), "\t", 1);
	if (ptr_args == NULL) {
		ptr_args = ptr_action_name;
		ptr_action_name = ptr_schema;
		ptr_schema = NULL;
	} else {
		*ptr_args = 0;
		ptr_args += 1;
	}

	ptr_args_end = bstrstr(ptr_args, int_request_length - (size_t)(ptr_args - client_request->ptr_query), "\n", 1);
	SFINISH_CHECK(ptr_args_end != NULL, "bstrstr failed");
	*ptr_args_end = 0;

	SDEBUG("ptr_schema: >%s<", ptr_schema);
	SDEBUG("ptr_action_name: >%s<", ptr_action_name);
	SDEBUG("ptr_args: >%s<", ptr_args);

	SFINISH_CHECK(
		strncmp(ptr_action_name, "action_", 7) == 0, "Invalid action name, action function names must begin with \"action_\"");

	if (ptr_schema != NULL) {
		str_schema = DB_escape_identifier(client_request->parent->conn, ptr_schema, (size_t)(ptr_action_name - ptr_schema));
		SFINISH_CHECK(str_schema != NULL, "DB_escape_identifier failed");
	}
	str_action_name = DB_escape_identifier(client_request->parent->conn, ptr_action_name, (size_t)(ptr_args - ptr_action_name));
	str_args = DB_escape_literal(client_request->parent->conn, ptr_args, (size_t)(ptr_args_end - ptr_args));

	SFINISH_CHECK(str_action_name != NULL, "DB_escape_identifier failed");
	SFINISH_CHECK(str_args != NULL, "DB_escape_literal failed");

	if (str_schema != NULL) {
		SFINISH_CAT_CSTR(str_action_full_name, str_schema, ".", str_action_name);
	} else {
		SFINISH_CAT_CSTR(str_action_full_name, str_action_name);
	}

#ifdef POSTAGE_INTERFACE_LIBPQ
	SFINISH_CAT_CSTR(str_sql, "COPY (SELECT ", str_action_full_name, "(", str_args, ")) TO STDOUT;");
#else
	if (DB_connection_driver(client_request->parent->conn) == DB_DRIVER_POSTGRES) {
		SFINISH_CAT_CSTR(str_sql, "SELECT ", str_action_full_name, "(", str_args, ");");
	} else {
		SFINISH_CAT_CSTR(str_sql, "EXECUTE ", str_action_full_name, " ", str_args, ";");
	}
#endif

	SFINISH_CHECK(
		DB_copy_out(global_loop, client_request->parent->conn, client_request, str_sql, ws_copy_check_cb), "DB_copy_out failed");
	SDEBUG("str_sql: %s", str_sql);

finish:
	if (bol_error_state == true) {
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

		WS_sendFrame(global_loop, client_request->parent, true, 0x01, str_response, strlen(str_response));
		DArray_push(client_request->arr_response, str_response);
	}
	SFREE_ALL();
	return str_response;
}
