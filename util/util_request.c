#include "util_request.h"

char *query(char *str_request, size_t int_request_length, size_t *int_query_length) {
	char *str_return = NULL;
	SDEFINE_VAR_ALL(str_uri);

	// find the form_data by request type
	if (strncmp(str_request, "GET ", 4) == 0) {
		size_t int_uri_length = 0;
		str_uri = str_uri_path(str_request, int_request_length, &int_uri_length);
		SERROR_CHECK(str_uri != NULL, "str_uri_path failed");

		char *ptr_query = bstrstr(str_uri, int_uri_length, "?", 1);
		if (ptr_query != NULL) {
			*int_query_length = (int_uri_length - (size_t)((ptr_query + 1) - str_uri));
			char *ptr_temp = bstrstr(ptr_query + 1, *int_query_length, "#", 1);
			if (ptr_temp != NULL) {
				*int_query_length -= (size_t)(ptr_temp - (ptr_query + 1));
			}
			SERROR_SALLOC(str_return, *int_query_length + 1);
			memcpy(str_return, ptr_query + 1, *int_query_length);
			str_return[*int_query_length] = 0;
		}

	} else {
		// rewritten to work with safari, still doesn't work
		char *temp1 = bstrstr(str_request, int_request_length, "\015\012\015\012", 4);
		char *temp2 = bstrstr(str_request, int_request_length, "\012\012", 2);
		SDEBUG("temp1: %d", temp1);
		SDEBUG("temp2: %d", temp2);
		char *ptr_query = NULL;
		if (temp1 != 0 && temp2 == 0) {
			ptr_query = temp1 + 4;
		} else if (temp1 == 0 && temp2 != 0) {
			ptr_query = temp2 + 2;
		} else {
			if (temp1 < temp2) {
				ptr_query = temp1 + 4;
			} else {
				ptr_query = temp2 + 2;
			}
		}
		if (ptr_query != NULL) {
			*int_query_length = int_request_length - (size_t)(ptr_query - str_request);
			SERROR_SALLOC(str_return, *int_query_length + 1);
			memcpy(str_return, ptr_query, *int_query_length);
			str_return[*int_query_length] = 0;
		}
	}

	// return just the form_data
	SFREE_ALL();
	return str_return;
error:
	SFREE_ALL();
	return NULL;
}

char *request_header(char *str_request, char *str_name) {
	char *str_return = NULL;

	SDEFINE_VAR_ALL(str_upper_name, str_upper_request);
	SERROR_CAT_CSTR(str_upper_name, str_name);
	SERROR_CAT_CSTR(str_upper_request, str_request);
	// str_toupper operates in place
	str_toupper(str_upper_name);
	str_toupper(str_upper_request);

	size_t int_name_len = strlen(str_name);
	size_t int_header_len = 0;

	// Find the uppercased header in the uppercased request
	char *ptr_upper_header = strstr(str_upper_request, str_upper_name);

	SWARN_CHECK(ptr_upper_header != NULL, "strstr failed", str_name);
	ptr_upper_header += int_name_len;

	// Use the offset of the uppercased header in the uppercased request to find
	// it in the real
	// request
	char *ptr_header = str_request + (ptr_upper_header - str_upper_request);

	while (*ptr_header != ':' && !isspace(*ptr_header)) {
		ptr_upper_header = strstr(ptr_upper_header, str_upper_name);

		SWARN_CHECK(ptr_upper_header != NULL, "strstr failed", str_name);
		ptr_upper_header += int_name_len;

		ptr_header = str_request + (ptr_upper_header - str_upper_request);
	}

	ptr_header = strchr(ptr_header, ':');
	ptr_header += 1;
	while (isspace(*ptr_header)) {
		ptr_header += 1;
	}
	while (ptr_header[int_header_len] != '\015' && ptr_header[int_header_len] != '\012') {
		int_header_len += 1;
	}

	SERROR_SALLOC(str_return, int_header_len + 1);
	memcpy(str_return, ptr_header, int_header_len);
	str_return[int_header_len] = '\0';

	// find the header
	/*char *ptr_header = strstr(str_request, str_full_name);
	SWARN_CHECK(ptr_header != NULL, "no %s found", str_name);

	ptr_header = ptr_header + strlen(str_full_name); // advance cursor past
	"<name>: "

	// get header length
	char *ptr_header_end_return = strstr(ptr_header, "\015\012");
	int int_header_len;
	if (ptr_header_end_return == NULL) {
			ptr_header_end_return = strstr(ptr_header, "\015");
			if (ptr_header_end_return == NULL) {
					ptr_header_end_return = strstr(ptr_header, "\012");
					if (ptr_header_end_return == NULL) {
							int_header_len = strlen(ptr_header);
					} else {
							int_header_len = ptr_header_end_return - ptr_header;
					}
			} else {
					int_header_len = ptr_header_end_return - ptr_header;
			}
	} else {
			int_header_len = ptr_header_end_return - ptr_header;
	}

	// return just the header
	SERROR_SALLOC(str_return, int_header_len + 1);
	memcpy(str_return, ptr_header, int_header_len);
	str_return[int_header_len] = '\0';*/

	SFREE_ALL();
	return str_return;
error:

	SFREE_ALL();
	SFREE(str_return);
	return NULL;
}

char *str_cookie(char *str_request, char *str_cookie_name) {
	char *str_return = NULL;
	char *ptr_cookie_end_semi = NULL;
	size_t int_cookie_end_semi = 0;
	size_t int_cookie_len = 0;
	SDEFINE_VAR_ALL(str_cookie, str_full_cookie);

	SDEBUG("str_cookie 1");

	SERROR_CAT_CSTR(str_full_cookie, str_cookie_name, "=");

	SDEBUG("str_cookie 2");

	// find the cookie
	str_cookie = request_header(str_request, "Cookie");
	SWARN_CHECK(str_cookie != NULL, "no cookie found");
	char *ptr_cookie = strstr(str_cookie, str_full_cookie);
	SWARN_CHECK(ptr_cookie != NULL, "no cookie found");
	ptr_cookie = ptr_cookie + strlen(str_full_cookie); // advance cursor past cookie=
	SFREE(str_full_cookie);

	SDEBUG("str_cookie 3");

	// get cookie length
	ptr_cookie_end_semi = strstr(ptr_cookie, ";");
	int_cookie_end_semi = (size_t)(ptr_cookie_end_semi - ptr_cookie);
	int_cookie_len = strlen(ptr_cookie);
	int_cookie_len = ptr_cookie_end_semi != NULL && int_cookie_end_semi < int_cookie_len ? int_cookie_end_semi : int_cookie_len;

	SDEBUG("str_cookie 4 int_cookie_len: %d", int_cookie_len);

	// return just the cookie
	SERROR_SALLOC(str_return, int_cookie_len + 1);
	memcpy(str_return, ptr_cookie, int_cookie_len);
	str_return[int_cookie_len] = '\0';

	SDEBUG("str_cookie 5");

	SFREE_PWORD_ALL();
	return str_return;
error:
	SFREE_PWORD_ALL();
	SFREE_PWORD(str_return);
	return NULL;
}

char *str_uri_path(char *str_request, size_t int_request_length, size_t *int_uri_length) {
	char *str_return = NULL;
	char *ptr_uri = NULL;
	char *ptr_uri_end = NULL;

	// if the request is not long enough to have a URI then abort
	SERROR_CHECK(int_request_length >= 5, "request too short to parse;");

	// find uri start character
	if (strncmp(str_request, "GET ", 4) == 0) {
		ptr_uri = str_request + 4;
	} else if (strncmp(str_request, "HEAD ", 5) == 0 || strncmp(str_request, "POST ", 5) == 0) {
		ptr_uri = str_request + 5;
	} else {
		char str_temp[11] = {0};
		memcpy(str_temp, str_request, 10);
		SERROR("unknown request type, first ten chars of request: %s", str_temp);
	}

	// return just the Request-URI
	ptr_uri_end = bstrstr(ptr_uri, (int_request_length - (size_t)(ptr_uri - str_request)), " ", 1);
	*int_uri_length = (size_t)(ptr_uri_end - ptr_uri);

	SDEBUG("*int_uri_length: %i", *int_uri_length);

	SERROR_SALLOC(str_return, *int_uri_length + 1);
	memcpy(str_return, ptr_uri, *int_uri_length);
	str_return[*int_uri_length] = '\0';
	return str_return;
error:
	SFREE(str_return);
	return NULL;
}

sun_upload *get_sun_upload(char *str_request, size_t int_request_length) {
	sun_upload *sun_return = NULL;
	char *boundary_ptr = NULL;
	char *boundary_end_ptr = NULL;
	size_t int_boundary_length = 0;
	SDEFINE_VAR_ALL(str_boundary, str_content_type, str_name, str_file_content, str_upper_request);
	SERROR_SALLOC(str_upper_request, int_request_length + 1);
	memcpy(str_upper_request, str_request, int_request_length);
	str_upper_request[int_request_length] = 0;
	// str_toupper operates in place
	bstr_toupper(str_upper_request, int_request_length);

	SDEBUG("str_request: %s", str_request);
	SDEBUG("str_upper_request: %s", str_upper_request);

	////GET BOUNDARY
	boundary_ptr = strstr(str_upper_request, "CONTENT-TYPE: MULTIPART/FORM-DATA; BOUNDARY=");
	SERROR_CHECK(boundary_ptr != NULL, "Cannot find boundary for request");
	boundary_ptr = str_request + 44 + (boundary_ptr - str_upper_request);

	boundary_end_ptr = strchr(boundary_ptr, 13) != 0 ? strchr(boundary_ptr, 13) : strchr(boundary_ptr, 10);
	int_boundary_length = (size_t)((boundary_end_ptr - boundary_ptr) + 2);

	SERROR_SALLOC(str_boundary, int_boundary_length + 1); // null byte
	memcpy(str_boundary + 2, boundary_ptr, int_boundary_length - 2);
	// This was adding two dashes to the end, but that was actually not working
	// (the file name was coming in after the file content),
	// and now I found out that you need them at the beginning instead (they are
	// added to the the end as well, but only for the last boundary)
	// - Nunzio on Wed Feb 17 at 2:26 PM
	str_boundary[0] = '-';
	str_boundary[1] = '-';
	str_boundary[int_boundary_length] = '\0';

	SDEBUG(">BOUNDARY|%s<", str_boundary);

	////GET FILE NAME
	// get file name
	char *ptr_name = bstrstr(str_upper_request, int_request_length, "CONTENT-DISPOSITION: FORM-DATA; NAME=\"FILE_NAME\"", 48);
	SERROR_CHECK(ptr_name != NULL, "No Content Disposition for File Name, (Maybe there is no file name?)");
	ptr_name = str_request + (ptr_name - str_upper_request);
	ptr_name = ptr_name + 48;

	char *ptr_name_dos = strstr(ptr_name, "\015\012\015\012");
	char *ptr_name_unix = strstr(ptr_name, "\012\012");
	char *ptr_name_mac = strstr(ptr_name, "\015\015");
	// clang-format off
	ptr_name =
		ptr_name_dos > ptr_name_unix	? ptr_name_dos  + 4 :
		ptr_name_dos > ptr_name_mac		? ptr_name_dos  + 4 :
		ptr_name_unix > ptr_name_mac	? ptr_name_unix + 2 :
											ptr_name_mac  + 2;
	// clang-format on

	// copy file name
	size_t int_name_carriage = (size_t)(strchr(ptr_name, '\015') - ptr_name);
	size_t int_name_newline = (size_t)(strchr(ptr_name, '\012') - ptr_name);
	size_t int_name_boundary = (size_t)(strstr(ptr_name, str_boundary) - ptr_name);
	// clang-format off
	size_t int_name_length =
		int_name_carriage < int_name_newline	? int_name_carriage :
		int_name_carriage < int_name_boundary	? int_name_carriage :
		int_name_boundary < int_name_carriage	? int_name_boundary :
													int_name_boundary;
	// clang-format on
	SERROR_SALLOC(str_name, int_name_length + 1);
	memcpy(str_name, ptr_name, int_name_length);
	str_name[int_name_length] = '\0';
	SDEBUG(">FILE NAME|%s<", str_name);

	////GET FILE
	// get file content
	SDEBUG("str_request: %20.20s", str_request);

	char *ptr_file_content =
		bstrstr(str_upper_request, int_request_length, "CONTENT-DISPOSITION: FORM-DATA; NAME=\"FILE_CONTENT\"", 51);
	SERROR_CHECK(ptr_file_content != NULL, "No Content Disposition for File "
										   "Content, (Maybe there is no file "
										   "content?)");
	ptr_file_content = ptr_file_content + 51;
	ptr_file_content = str_request + (ptr_file_content - str_upper_request);

	SDEBUG("str_request + int_request_length d: %d", str_request + int_request_length);
	SDEBUG("ptr_file_content: %20.20s", ptr_file_content);

	char *ptr_file_content_dos = strstr(ptr_file_content, "\015\012\015\012");
	char *ptr_file_content_unix = strstr(ptr_file_content, "\012\012");
	char *ptr_file_content_mac = strstr(ptr_file_content, "\015\015");
	// clang-format off
    ptr_file_content =
            ptr_file_content_dos  > ptr_file_content_unix   ? ptr_file_content_dos  + 4 :
            ptr_file_content_dos  > ptr_file_content_mac    ? ptr_file_content_dos  + 4 :
            ptr_file_content_unix > ptr_file_content_mac    ? ptr_file_content_unix + 2 :
                                                              ptr_file_content_mac  + 2;
	// clang-format on

	// copy file content
	size_t int_file_content_length =
		(size_t)(bstrstr(ptr_file_content, (size_t)((str_request + int_request_length) - ptr_file_content), str_boundary,
					 int_boundary_length) -
				 ptr_file_content);
	// clang-format off
    // This is because the browser sends a newline after the file content
    // - Nunzio on Wed Feb 17 at 2:26 PM
    int_file_content_length -=
            ptr_file_content_dos  > ptr_file_content_unix   ? 2 :
            ptr_file_content_dos  > ptr_file_content_mac    ? 2 :
            ptr_file_content_unix > ptr_file_content_mac    ? 1 :
                                                              1;
	// clang-format on
	SERROR_SALLOC(str_file_content, int_file_content_length + 1);
	memcpy(str_file_content, ptr_file_content, int_file_content_length);
	str_file_content[int_file_content_length] = '\0';
	SDEBUG(">FILE CONTENT|%s<", str_file_content);
	SDEBUG(">FILE CONTENT LENGTH|%i<", int_file_content_length);

	////RETURN
	SERROR_SALLOC(sun_return, sizeof(sun_upload));
	SFREE(str_boundary);
	sun_return->str_name = str_name;
	str_name = NULL;
	sun_return->str_file_content = str_file_content;
	str_file_content = NULL;
	sun_return->int_file_content_length = int_file_content_length;

	SFREE_ALL();
	return sun_return;
error:
	SFREE_ALL();
	SFREE(sun_return);
	return NULL;
}

void free_sun_upload(sun_upload *sun_current_upload) {
	SFREE(sun_current_upload->str_name);
	SFREE(sun_current_upload->str_file_content);
	SFREE(sun_current_upload);
}
