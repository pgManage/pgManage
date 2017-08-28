#pragma once

#include <stdio.h>
#include <string.h>

#include "util_salloc.h"
#include "util_string.h"

/*
Gets the request data.
If the request is a GET then is grabs the uri parameters.
If the request is a POST then is grabs the main body.
*/
char *query(char *str_request, size_t int_request_length, size_t *int_query_length);

/*
Returns the value for a header in the request.
*/
char *request_header(char *str_request, size_t int_request_len, char *str_header_name, size_t *int_header_value_len);

/*
Returns the value for a cookie in the request.
*/
char *str_cookie(char *str_request, size_t int_request_len, char *str_cookie_name, size_t *int_cookie_value_len);

/*
Returns the uri for a request.
*/
char *str_uri_path(char *str_request, size_t int_request_length, size_t *int_uri_length);

typedef struct {
	char *str_name;
	char *str_file_content;
	
	//variable lengths
	size_t int_name_len;
	size_t int_file_content_len;
} sun_upload;

/*
Returns a struct with all of the relevent information for an upload.
*/
sun_upload *get_sun_upload(char *str_request, size_t int_request_length);

/*
Free a upload struct.
*/
void free_sun_upload(sun_upload *sun_current_upload);
#define SFREE_SUN_UPLOAD(A)                                                                                                      \
	if (A != NULL) {                                                                                                             \
		free_sun_upload(A);                                                                                                      \
		A = NULL;                                                                                                                \
	}
