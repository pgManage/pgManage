#include "http_export.h"

#ifdef POSTAGE_INTERFACE_LIBPQ

void http_export_step1(struct sock_ev_client *client) {
	SDEFINE_VAR_ALL(str_temp1, str_sql, str_query, str_attr_name, str_attr_value);
	char *str_temp = NULL;
	char *str_response = NULL;
	char *ptr_attr_header = NULL;
	char *ptr_end_attr_header = NULL;
	char *ptr_attr_values = NULL;
	char *ptr_end_attr_values = NULL;
	struct sock_ev_client_request *client_request = NULL;
	size_t int_query_len = 0;
	size_t int_sql_len = 0;
	size_t int_attr_header_len = 0;
	size_t int_attr_value_len = 0;
	size_t int_response_len = 0;

	SDEBUG("client->str_request: %s", client->str_request);

	str_temp = query(client->str_request, client->int_request_len, &int_query_len);
	SFINISH_CHECK(str_temp != NULL, "query failed");
	str_query = uri_to_cstr(str_temp, &int_query_len);
	SFINISH_CHECK(str_query != NULL, "uri_to_cstr failed");
	SFREE(str_temp);

	SFREE(client->str_request);
	client->str_request = str_query;
	client->int_request_len = int_query_len;
	int_query_len = 0;
	str_query = NULL;

	SDEBUG("client->str_request: %s", client->str_request);

	// Get start of the attr headers
	ptr_attr_header = bstrstr(client->str_request, client->int_request_len, "\012", (size_t)1);
	SFINISH_CHECK(ptr_attr_header != NULL, "could not find start of attr names");
	ptr_attr_header += 1;
	*(ptr_attr_header - 1) = 0;
	// Re-calculate length of query
	int_query_len = (size_t)((ptr_attr_header - 1) - client->str_request);

	// Get end of headers
	ptr_end_attr_header = bstrstr(ptr_attr_header, client->int_request_len - (size_t)(ptr_attr_header - client->str_request), "\012", (size_t)1);
	SFINISH_CHECK(ptr_end_attr_header != NULL, "could not find end of attr names");

	// Get start of attr values
	ptr_attr_values = ptr_end_attr_header + 1;
	*(ptr_attr_values - 1) = 0;

	ptr_end_attr_values = bstrstr(ptr_attr_values, client->int_request_len - (size_t)(ptr_attr_values - client->str_request), "\012", (size_t)1);
	if (ptr_end_attr_values == NULL) {
		ptr_end_attr_values = ptr_attr_values + (client->int_request_len - (size_t)(ptr_attr_values - client->str_request));
	}

	// This will hold the SQL query becuase we are ending the string right before
	// the attr headers start
	str_query = bunescape_value(client->str_request, &int_query_len);
	SFINISH_CHECK(str_query != NULL, "bunescape_value failed");

	// Start building SQL
	SFINISH_SNCAT(
		str_sql, &int_sql_len,
		"COPY (", (size_t)6,
		str_query, int_query_len,
		")\012\tTO STDOUT\012\tWITH (\012", (size_t)21
	);

	// Loop through attributes
	while (ptr_attr_header < ptr_end_attr_header) {
		// Get attr name
		int_attr_header_len = strncspn(ptr_attr_header, (size_t)(ptr_end_attr_header - ptr_attr_header), "\t\012", (size_t)2);
		SFINISH_SALLOC(str_attr_name, int_attr_header_len + 1);
		memcpy(str_attr_name, ptr_attr_header, int_attr_header_len);
		str_attr_name[int_attr_header_len] = '\0';
		ptr_attr_header += int_attr_header_len + 1;
		bstr_toupper(str_attr_name, int_attr_header_len);

		// Get attr value
		int_attr_value_len = strncspn(ptr_attr_values, (size_t)(ptr_end_attr_values - ptr_attr_values), "\t\012", (size_t)2);
		SFINISH_SALLOC(str_attr_value, int_attr_value_len + 1);
		memcpy(str_attr_value, ptr_attr_values, int_attr_value_len);
		str_attr_value[int_attr_value_len] = '\0';
		ptr_attr_values += int_attr_value_len + 1;

		// Unescape the value
		str_temp = str_attr_value;
		str_attr_value = bunescape_value(str_temp, &int_attr_value_len);
		SFINISH_CHECK(str_attr_value != NULL, "bunescape_value failed");
		SFREE(str_temp);

		// Add both to the sql
		SFINISH_SNFCAT(
			str_sql, &int_sql_len,
			"\t\t", (size_t)2,
			str_attr_name, int_attr_header_len,
			" ", (size_t)1,
			str_attr_value, int_attr_value_len,
			ptr_attr_header < ptr_end_attr_header ? ",\012" : "\012", (size_t)(ptr_attr_header < ptr_end_attr_header ? 2 : 1)
		);

		// Free name and value
		SFREE(str_attr_name);
		SFREE(str_attr_value);
	}

	SFINISH_SNFCAT(str_sql, &int_sql_len, "\t);", (size_t)3);

	SDEBUG("str_sql: %s", str_sql);

	client_request = create_request(client, NULL, NULL, NULL, NULL, 0, POSTAGE_REQ_STANDARD);
	client->cur_request = client_request;
	SFINISH_CHECK(client_request != NULL, "Could not create request data!");

	SFINISH_SALLOC(client->str_response, 1);
	client->str_response[0] = 0;

	SFINISH_CHECK(query_is_safe(str_sql), "SQL Injection detected");
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
		snprintf(str_length, 50, "%zu", (int_response_len != 0 ? int_response_len : strlen(_str_response)));
		char *str_temp =
			"HTTP/1.1 500 Internal Server Error\015\012"
			"Server: " SUN_PROGRAM_LOWER_NAME "\015\012"
			"Connection: close\015\012"
			"Content-Length: ";
		SFINISH_SNCAT(
			str_response, &int_response_len,
			str_temp, strlen(str_temp),
			str_length, strlen(str_length),
			"\015\012\015\012", (size_t)4,
			_str_response, strlen(_str_response)
		);
		SFREE(_str_response);

		if (client_write(client, str_response, int_response_len) < 0) {
			SERROR_NORESPONSE("client_write() failed");
		}
		// This prevents an infinite loop if CLIENT_CLOSE fails
		SFREE(str_response);
		ev_io_stop(global_loop, &client->io);
		SFINISH_CLIENT_CLOSE(client);
	}
}

#endif
