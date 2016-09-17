#include "http_export.h"

#ifdef POSTAGE_INTERFACE_LIBPQ

void http_export_step1(struct sock_ev_client *client) {
	SDEFINE_VAR_ALL(str_temp1, str_sql, str_query, str_attr_name, str_attr_value);
	char *str_temp = NULL;
	char *str_response = NULL;
	char *ptr_attr_header = NULL;
	char *ptr_end_attr_header = NULL;
	char *ptr_attr_values = NULL;
	struct sock_ev_client_request *client_request = NULL;
	size_t int_length;
	size_t int_query_length = 0;

	SDEBUG("client->str_request: %s", client->str_request);

	str_temp = query(client->str_request, client->int_request_len, &int_query_length);
	SFINISH_CHECK(str_temp != NULL, "query failed");
	str_query = uri_to_cstr(str_temp, &int_query_length);
	SFINISH_CHECK(str_query != NULL, "uri_to_cstr failed");
	SFREE(str_temp);

	SFREE(client->str_request);
	client->str_request = str_query;
	str_query = NULL;

	SDEBUG("client->str_request: %s", client->str_request);

	// Get start of the attr headers
	ptr_attr_header = strstr(client->str_request, "\012");
	SFINISH_CHECK(ptr_attr_header != NULL, "could not find start of attr names");
	ptr_attr_header += 1;
	*(ptr_attr_header - 1) = 0;
	// Get end of headers
	ptr_end_attr_header = strstr(ptr_attr_header, "\012");
	SFINISH_CHECK(ptr_end_attr_header != NULL, "could not find end of attr names");

	// Get start of attr values
	ptr_attr_values = ptr_end_attr_header + 1;
	*(ptr_attr_values - 1) = 0;
	int_length = strlen(client->str_request);

	// This will hold the SQL query becuase we are ending the string right before
	// the attr headers start
	str_query = unescape_value(client->str_request);
	SFINISH_CHECK(str_query != NULL, "unescape_value failed");

	// Start building SQL
	SFINISH_CAT_CSTR(str_sql, "COPY (", str_query, ")\012", "\tTO STDOUT\012", "\tWITH (\012");

	int_length = 0;

	// Loop through attributes
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
		str_temp = str_attr_value;
		str_attr_value = unescape_value(str_temp);
		SFINISH_CHECK(str_attr_value != NULL, "unescape_value failed");
		SFREE(str_temp);

		// Add both to the sql
		SFINISH_CAT_APPEND(str_sql, "\t\t", str_toupper(str_attr_name), " ", str_attr_value,
			ptr_attr_header < ptr_end_attr_header ? "," : "", "\012");

		// Free name and value
		SFREE(str_attr_name);
		SFREE(str_attr_value);
	}

	SFINISH_CAT_APPEND(str_sql, "\t);");

	SDEBUG("str_sql: %s", str_sql);

	client_request = create_request(client, NULL, NULL, NULL, NULL, 0, POSTAGE_REQ_STANDARD);
	client->cur_request = client_request;
	SFINISH_CHECK(client_request != NULL, "Could not create request data!");

	SFINISH_CAT_CSTR(client->str_response, "");

	SFINISH_CHECK(
		DB_copy_out(global_loop, client_request->parent->conn, client_request, str_sql, http_copy_check_cb), "DB_exec failed");
	SFREE(str_sql);

	bol_error_state = false;
finish:
	SFREE_ALL();
	if (str_response != NULL) {
		SDEBUG("str_response: %s", str_response);
		char *_str_response = str_response;
		char str_length[50];
		ssize_t int_response_len = 0;
		snprintf(str_length, 50, "%lu", strlen(_str_response));
		str_response = cat_cstr("HTTP/1.1 500 Internal Server Error\015\012"
								"Server: " SUN_PROGRAM_LOWER_NAME "\015\012"
								"Content-Length: ",
			str_length, "\015\012\015\012", _str_response);
		SFREE(_str_response);
		if ((int_response_len = CLIENT_WRITE(client, str_response, strlen(str_response))) < 0) {
			if (bol_tls) {
				SFINISH_LIBTLS_CONTEXT(client->tls_postage_io_context, "tls_write() failed");
			} else {
				SERROR_NORESPONSE("write() failed");
			}
		}
		// This prevents an infinite loop if CLIENT_CLOSE fails
		SFREE(str_response);
		ev_io_stop(global_loop, &client->io);
		SFINISH_CLIENT_CLOSE(client);
	}
}

#endif
