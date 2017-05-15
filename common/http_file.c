#include "http_file.h"

static const char *str_date_format = "%a, %d %b %Y %H:%M:%S GMT";

void http_file_step1(struct sock_ev_client *client) {
	SDEBUG("http_file_step1");
	char *str_response = NULL;
	size_t int_response_len = 0;
	char *ptr_end_uri = NULL;
#ifdef _WIN32
	LPTSTR strErrorText = NULL;
#endif

	struct sock_ev_client_copy_check *client_copy_check = NULL;
	struct sock_ev_client_http_file *client_http_file = NULL;
	SDEFINE_VAR_ALL(str_temp, str_temp1, str_uri_temp, str_canonical_start, str_uri_for_permission_check);
#ifdef ENVELOPE
	size_t int_uri_for_permission_check_len = 0;
#endif

	SFINISH_SALLOC(client_http_file, sizeof(struct sock_ev_client_http_file));
	client_http_file->parent = client;
	client_http_file->str_uri_part = NULL;
#ifdef _WIN32
	client_http_file->h_file = INVALID_HANDLE_VALUE;
#else
	client_http_file->int_file_fd = -1;
#endif
	client_http_file->int_response_header_len = 0;
	client_http_file->int_response_len = 0;
	client_http_file->int_read = 0;
	client_http_file->int_read_len = 0;
	client_http_file->bol_download = 0;
	client_http_file->int_written = 0;
	client_http_file->io.fd = INVALID_SOCKET;

	// get path
	client_http_file->str_uri = str_uri_path(client->str_request, client->int_request_len, &client_http_file->int_uri_len);
	SFINISH_CHECK(client_http_file->str_uri, "str_uri_path failed");
	ptr_end_uri = strchr(client_http_file->str_uri, '?');
	if (ptr_end_uri != NULL) {
		*ptr_end_uri = 0;
		client_http_file->int_uri_len = (size_t)(ptr_end_uri - client_http_file->str_uri);
	}
	ptr_end_uri = strchr(client_http_file->str_uri, '#');
	if (ptr_end_uri != NULL) {
		*ptr_end_uri = 0;
		client_http_file->int_uri_len = (size_t)(ptr_end_uri - client_http_file->str_uri);
	}

	client_http_file->bol_download = false;
#ifdef ENVELOPE
	client_http_file->str_uri_part = client_http_file->str_uri;
	client_http_file->int_uri_part_len = client_http_file->int_uri_len;
	client_http_file->int_uri_len = 0;
	client_http_file->str_uri = NULL;
#else
	if (isdigit(client_http_file->str_uri[9])) {
		str_uri_temp = client_http_file->str_uri;
		str_temp = strchr(str_uri_temp + 9, '/');
		SFINISH_CHECK(str_temp != NULL, "strchr failed");
		SFINISH_SNCAT(
			client_http_file->str_uri, &client_http_file->int_uri_len,
			"/postage/app", (size_t)12,
			str_temp, client_http_file->int_uri_len - (size_t)(str_temp - str_uri_temp)
		);
		SFREE(str_uri_temp);
	}

	if (strncmp(client_http_file->str_uri, "/postage/app/download", 21) == 0) {
		SFINISH_SNCAT(
			client_http_file->str_uri_part, &client_http_file->int_uri_part_len,
			client->str_connname_folder, client->int_connname_folder_len,
			"/", (size_t)1,
			client->str_username, client->int_username_len,
			// we need to go past "/postage/app/download"
			client_http_file->str_uri + 21, client_http_file->int_uri_len - 21
		);
		SFREE(client_http_file->str_uri);

		client_http_file->bol_download = true;
	} else {
		client_http_file->str_uri_part = client_http_file->str_uri;
		client_http_file->int_uri_part_len = client_http_file->int_uri_len;
		client_http_file->int_uri_len = 0;
		client_http_file->str_uri = NULL;

		// empty url, default to index.html in directories
		str_temp = canonical(str_global_web_root, client_http_file->str_uri_part, "read_dir");
		if (strlen(client_http_file->str_uri_part) <= 1 || str_temp != NULL) {
			if (*(client_http_file->str_uri_part + strlen(client_http_file->str_uri_part) - 1) == '/') {
				SFINISH_SNFCAT(client_http_file->str_uri_part, &client_http_file->int_uri_part_len, "index.html", (size_t)10);
			} else {
				SFINISH_SNFCAT(client_http_file->str_uri_part, &client_http_file->int_uri_part_len, "/index.html", (size_t)10);
			}
		}
		SFREE(str_global_error);
		SFREE(str_temp);
	}
#endif

	str_temp = uri_to_cstr(client_http_file->str_uri_part, &client_http_file->int_uri_part_len);
	SFREE(client_http_file->str_uri_part);
	client_http_file->str_uri_part = str_temp;
	str_temp = NULL;

#ifdef ENVELOPE
#else
	if (client_http_file->bol_download) {
		str_temp1 = client_http_file->str_uri_part;
		SFINISH_CHECK((client_http_file->str_uri_part = snuri(str_temp1, client_http_file->int_uri_part_len, &client_http_file->int_uri_part_len)) != NULL, "snuri failed");
		SFREE(str_temp1);

		SFINISH_CHECK(client_http_file->str_uri = canonical(str_global_sql_root, client_http_file->str_uri_part, "valid_path"),
			"canonical failed");
	} else {
#endif
#ifdef ENVELOPE
	str_uri_temp = client_http_file->str_uri_part;
	SDEBUG("str_uri_temp: %s", str_uri_temp);
	client_http_file->str_uri_part = NULL;
	bool bol_permission_check = false;
	if (strncmp(str_uri_temp, "/env/app/", 9) == 0) {
		str_canonical_start = canonical_full_start("/app/");
		SFINISH_CHECK(str_canonical_start != NULL, "canonical_full_start failed");
		SFINISH_SNCAT(
			str_uri_for_permission_check, &int_uri_for_permission_check_len,
			str_uri_temp + 4, client_http_file->int_uri_part_len - 4
		);
		SFINISH_SNCAT(
			client_http_file->str_uri_part, &client_http_file->int_uri_part_len,
			str_uri_temp + 9, client_http_file->int_uri_part_len - 9
		);
		bol_permission_check = true;

	} else if (strncmp(str_uri_temp, "/env/role/", 10) == 0) {
		str_canonical_start = canonical_full_start("/role/");
		SFINISH_CHECK(str_canonical_start != NULL, "canonical_full_start failed");
		SFINISH_SNCAT(
			str_uri_for_permission_check, &int_uri_for_permission_check_len,
			str_uri_temp + 4, client_http_file->int_uri_part_len - 4
		);
		SFINISH_SNCAT(
			client_http_file->str_uri_part, &client_http_file->int_uri_part_len,
			str_uri_temp + 10, client_http_file->int_uri_part_len - 10
		);
		bol_permission_check = true;

	} else {
		str_canonical_start = canonical_full_start("/web_root/");
		SFINISH_CHECK(str_canonical_start != NULL, "canonical_full_start failed");
		SFINISH_SNCAT(
			client_http_file->str_uri_part, &client_http_file->int_uri_part_len,
			str_uri_temp, client_http_file->int_uri_part_len
		);
	}
	SFREE(str_uri_temp);

	SDEBUG("str_canonical_start: %s", str_canonical_start);
	SDEBUG("client_http_file->str_uri_part: %s", client_http_file->str_uri_part);

	// empty url, default to index.html in directories
	str_temp = canonical(str_canonical_start, client_http_file->str_uri_part, "read_dir");
	if (strlen(client_http_file->str_uri_part) <= 1 || str_temp != NULL) {
		if (*(client_http_file->str_uri_part + strlen(client_http_file->str_uri_part) - 1) == '/') {
			SFINISH_SNFCAT(
				client_http_file->str_uri_part, &client_http_file->int_uri_part_len,
				"index.html", (size_t)10
			);
		} else {
			SFINISH_SNFCAT(
				client_http_file->str_uri_part, &client_http_file->int_uri_part_len,
				"/index.html", (size_t)11
			);
		}
	}
	SFREE(str_global_error);
	SFREE(str_temp);

	str_uri_temp = client_http_file->str_uri_part;
	client_http_file->str_uri_part = NULL;
	if (strncmp(str_uri_temp, "/download", 9) == 0) {
		client_http_file->bol_download = true;
		SFINISH_SNCAT(
			client_http_file->str_uri_part, &client_http_file->int_uri_part_len,
			str_uri_temp + 9, client_http_file->int_uri_part_len - 9
		);
	} else {
		SFINISH_SNCAT(
			client_http_file->str_uri_part, &client_http_file->int_uri_part_len,
			str_uri_temp, client_http_file->int_uri_part_len
		);
	}
	SFREE(str_uri_temp);

	SFREE(client_http_file->str_uri);
	SDEBUG("client_http_file->str_uri_part: %s", client_http_file->str_uri_part);
	client_http_file->str_uri = canonical(str_canonical_start, client_http_file->str_uri_part, "valid_path");
	SFINISH_CHECK(client_http_file->str_uri != NULL, "Bad file path");
	SFREE(str_canonical_start);
#else
		client_http_file->str_uri = canonical(str_global_web_root, client_http_file->str_uri_part, "valid_path");
		SFINISH_CHECK(client_http_file->str_uri != NULL, "Bad file path");
#endif
#ifdef ENVELOPE
#else
	}
#endif
	SDEBUG("client_http_file->str_uri: %s", client_http_file->str_uri);

#ifdef ENVELOPE
	if (bol_permission_check == true) {
		SINFO("client_http_file->str_uri_part: %s", client_http_file->str_uri_part);
		SFINISH_CHECK(permissions_check(global_loop, client_http_file->parent->conn, str_uri_for_permission_check,
			client_http_file, http_file_step15_envelope),
			"permissions_check() failed");
	} else {
#endif
#ifdef _WIN32
		SetLastError(0);
		client_http_file->h_file =
			CreateFileA(client_http_file->str_uri, GENERIC_READ, FILE_SHARE_READ, NULL, OPEN_EXISTING, FILE_ATTRIBUTE_NORMAL, NULL);
		if (client_http_file->h_file == INVALID_HANDLE_VALUE) {
			int int_err = GetLastError();
			if (int_err == ERROR_FILE_NOT_FOUND || int_err == ERROR_PATH_NOT_FOUND) {
				SFREE(str_response);
				SERROR_NORESPONSE("CreateFileA failed!");
				SFREE(str_global_error);
				char *str_temp =
					"HTTP/1.1 404 Not Found\015\012"
					"Server: " SUN_PROGRAM_LOWER_NAME "\015\012"
					"Connection: close\015\012"
					"Content-Length: 40\015\012"
					"Content-Type: text/plain\015\012"
					"\015\012"
					"The file you are requesting is not here.";
				SFINISH_SNCAT(str_response, &int_response_len, str_temp, strlen(str_temp));
				bol_error_state = false;
				goto finish;
			}
			FormatMessageA(FORMAT_MESSAGE_FROM_SYSTEM | FORMAT_MESSAGE_ALLOCATE_BUFFER | FORMAT_MESSAGE_IGNORE_INSERTS, NULL, int_err,
				MAKELANGID(LANG_NEUTRAL, SUBLANG_DEFAULT), (LPSTR)&strErrorText, 0, NULL);

			if (strErrorText != NULL) {
				SFINISH_ERROR("CreateFile failed: 0x%X (%s)", int_err, strErrorText);
			}
		}
#else
	client_http_file->int_file_fd = open(client_http_file->str_uri, O_RDONLY | O_NONBLOCK);
	if (client_http_file->int_file_fd == -1) {
		SFREE(str_response);
		SERROR_NORESPONSE("open failed! %d (%s)", errno, strerror(errno));
		SFREE(str_global_error);
		char *str_temp =
			"HTTP/1.1 404 Not Found\015\012"
			"Server: " SUN_PROGRAM_LOWER_NAME "\015\012"
			"Connection: close\015\012"
			"Content-Length: 40\015\012"
			"Content-Type: text/plain\015\012"
			"\015\012"
			"The file you are requesting is not here.";
		SFINISH_SNCAT(str_response, &int_response_len, str_temp, strlen(str_temp));
		bol_error_state = false;
		goto finish;
	}
#endif
		SFINISH_SALLOC(client_copy_check, sizeof(struct sock_ev_client_copy_check));
		client_copy_check->client_request = (struct sock_ev_client_request *)client_http_file;

		increment_idle(global_loop);
		ev_check_init(&client_copy_check->check, http_file_step2);
		ev_check_start(global_loop, &client_copy_check->check);
#ifdef ENVELOPE
	}
#endif
	bol_error_state = false;
finish:
#ifdef _WIN32
	if (strErrorText != NULL) {
		LocalFree(strErrorText);
		strErrorText = NULL;
	}
#endif

	SFREE_ALL();
	if (bol_error_state) {
		bol_error_state = false;
		http_file_free(client_http_file);
		client_http_file = NULL;

		char *str_temp =
			"HTTP/1.1 500 Internal Server Error\015\012"
			"Server: " SUN_PROGRAM_LOWER_NAME "\015\012"
			"Connection: close\015\012\015\012";
		char *_str_response = str_response;
		SFINISH_SNCAT(str_response, &int_response_len, str_temp, strlen(str_temp), _str_response, strlen(_str_response));
		SFREE(_str_response);
	}
	if (str_response != NULL && client_write(client, str_response, int_response_len) < 0) {
		SFREE(str_response);
		http_file_free(client_http_file);
		client_http_file = NULL;
		SERROR_NORESPONSE("client_write() failed");
	}
	SFREE(str_response);
	if (int_response_len != 0) {
		http_file_free(client_http_file);
		client_http_file = NULL;
		ev_io_stop(global_loop, &client->io);
		SFREE(client->str_request);
		SERROR_CHECK_NORESPONSE(client_close(client), "Error closing Client");
	}
}

#ifdef ENVELOPE
bool http_file_step15_envelope(EV_P, void *cb_data, bool bol_group) {
	  // SDEBUG("http_file_step3");
	struct sock_ev_client_copy_check *client_copy_check = NULL;
	struct sock_ev_client_http_file *client_http_file = cb_data;
	struct sock_ev_client *client = client_http_file->parent;
	char *str_response = NULL;
	size_t int_response_len = 0;
#ifdef _WIN32
	LPTSTR strErrorText = NULL;
#endif

	SFINISH_CHECK(bol_group, "You don't have the necessary permissions for this folder.");

#ifdef _WIN32
	SetLastError(0);
	client_http_file->h_file =
		CreateFileA(client_http_file->str_uri, GENERIC_READ, FILE_SHARE_READ, NULL, OPEN_EXISTING, FILE_ATTRIBUTE_NORMAL, NULL);
	if (client_http_file->h_file == INVALID_HANDLE_VALUE) {
		int int_err = GetLastError();
		if (int_err == ERROR_FILE_NOT_FOUND || int_err == ERROR_PATH_NOT_FOUND) {
			SFREE(str_response);
			SERROR_NORESPONSE("CreateFileA failed!");
			SFREE(str_global_error);
			char *str_temp =
				"HTTP/1.1 404 Not Found\015\012"
				"Server: " SUN_PROGRAM_LOWER_NAME "\015\012"
				"Connection: close\015\012"
				"Content-Length: 40\015\012"
				"Content-Type: text/plain\015\012"
				"\015\012"
				"The file you are requesting is not here.";
			SFINISH_SNCAT(str_response, &int_response_len, str_temp, strlen(str_temp));
			bol_error_state = false;
			goto finish;
		}
		FormatMessageA(FORMAT_MESSAGE_FROM_SYSTEM | FORMAT_MESSAGE_ALLOCATE_BUFFER | FORMAT_MESSAGE_IGNORE_INSERTS, NULL, int_err,
			MAKELANGID(LANG_NEUTRAL, SUBLANG_DEFAULT), (LPSTR)&strErrorText, 0, NULL);

		if (strErrorText != NULL) {
			SFINISH_ERROR("CreateFile failed: 0x%X (%s)", int_err, strErrorText);
		}
	}
#else
	client_http_file->int_file_fd = open(client_http_file->str_uri, O_RDONLY | O_NONBLOCK);
	if (client_http_file->int_file_fd == -1) {
		SFREE(str_response);
		SERROR_NORESPONSE("open failed! %d (%s)", errno, strerror(errno));
		SFREE(str_global_error);
		char *str_temp =
			"HTTP/1.1 404 Not Found\015\012"
			"Server: " SUN_PROGRAM_LOWER_NAME "\015\012"
			"Connection: close\015\012"
			"Content-Length: 40\015\012"
			"Content-Type: text/plain\015\012"
			"\015\012"
			"The file you are requesting is not here.";
		SFINISH_SNCAT(str_response, &int_response_len, str_temp, strlen(str_temp));
		bol_error_state = false;
		goto finish;
	}
#endif
	SFINISH_SALLOC(client_copy_check, sizeof(struct sock_ev_client_copy_check));
	client_copy_check->client_request = (struct sock_ev_client_request *)client_http_file;

	increment_idle(EV_A);
	ev_check_init(&client_copy_check->check, http_file_step2);
	ev_check_start(EV_A, &client_copy_check->check);

	bol_error_state = false;
finish:
#ifdef _WIN32
	if (strErrorText != NULL) {
		LocalFree(strErrorText);
		strErrorText = NULL;
	}
#endif

	if (bol_error_state) {
		bol_error_state = false;
		http_file_free(client_http_file);
		client_http_file = NULL;

		char *str_temp =
			"HTTP/1.1 500 Internal Server Error\015\012"
			"Server: " SUN_PROGRAM_LOWER_NAME "\015\012"
			"Connection: close\015\012\015\012";
		char *_str_response = str_response;
		SFINISH_SNCAT(str_response, &int_response_len, str_temp, strlen(str_temp), _str_response, strlen(_str_response));
		SFREE(_str_response);
	}
	if (str_response != NULL && client_write(client, str_response, int_response_len) < 0) {
		SFREE(str_response);
		http_file_free(client_http_file);
		client_http_file = NULL;
		SERROR_NORESPONSE("client_write() failed");
	}
	SFREE(str_response);
	if (int_response_len != 0) {
		http_file_free(client_http_file);
		client_http_file = NULL;
		ev_io_stop(global_loop, &client->io);
		SFREE(client->str_request);
		SERROR_CHECK_NORESPONSE(client_close(client), "Error closing Client");
	}
	return true;
}
#endif

void http_file_step2(EV_P, ev_check *w, int revents) {
	if (revents != 0) {
	} // get rid of unused parameter warning
	SDEBUG("http_file_step2");
	SDEFINE_VAR_ALL(str_etag, str_last_modified, str_if_modified_since);
	char *str_content_type = NULL;
	struct tm *tm_change_stamp = NULL;
	struct tm *tm_if_modified_by = NULL;
	struct sock_ev_client_copy_check *client_copy_check = (struct sock_ev_client_copy_check *)w;
	struct sock_ev_client_http_file *client_http_file = (struct sock_ev_client_http_file *)(client_copy_check->client_request);
	struct sock_ev_client *client = client_http_file->parent;
	bool bol_not_modified = false;

	struct stat *statdata = NULL;
	SERROR_SALLOC(statdata, sizeof(struct stat));
	stat(client_http_file->str_uri, statdata);
	SDEBUG("client_http_file->str_uri: %s", client_http_file->str_uri);

#ifdef _WIN32
	client_http_file->int_read_len = GetFileSize(client_http_file->h_file, NULL);
#else
	client_http_file->int_read_len = (ssize_t)lseek(client_http_file->int_file_fd, 0, SEEK_END);
	SERROR_CHECK(client_http_file->int_read_len != -1, "lseek(0, SEEK_END) failed");
	SERROR_CHECK(lseek(client_http_file->int_file_fd, 0, SEEK_SET) != -1, "lseek(0, SEEK_SET) failed");
#endif

	SERROR_SALLOC(tm_change_stamp, sizeof(struct tm));
#ifdef _WIN32
	gmtime_s(tm_change_stamp, &(statdata->st_mtime));
#else
	gmtime_r(&(statdata->st_mtime), tm_change_stamp);
#endif
	SERROR_CHECK(tm_change_stamp != NULL, "gmtime() failed");
	tm_change_stamp->tm_isdst = 0;

	SERROR_SALLOC(str_last_modified, 101)
	SERROR_CHECK(strftime(str_last_modified, 100, str_date_format, tm_change_stamp) != 0, "strftime() failed");

	size_t int_if_modified_since_len = 0;
	str_if_modified_since = request_header(client->str_request, client->int_request_len, "If-Modified-Since", &int_if_modified_since_len);
	if (str_if_modified_since != NULL) {
		bol_not_modified = strncmp(str_last_modified, str_if_modified_since, int_if_modified_since_len) == 0;
	} else {
		SFREE(str_global_error);
	}

	char str_length[50];
	sprintf(str_length, "%zu", client_http_file->int_read_len);

	str_content_type = contenttype(client_http_file->str_uri_part);
	SERROR_CHECK(str_content_type, "contenttype failed");

	SERROR_SALLOC(str_etag, 100);
#ifdef st_mtime
#ifdef __linux__
	sprintf(str_etag, "%li.%li", statdata->st_ctim.tv_sec, statdata->st_ctim.tv_nsec);
#else
	sprintf(str_etag, "%li.%li", statdata->st_mtimespec.tv_sec, statdata->st_mtimespec.tv_nsec);
#endif
#else
	sprintf(str_etag, "%lu", (long)statdata->st_mtime);
#endif

	char *str_maybe_download = client_http_file->bol_download ? "Content-Disposition: attachment\015\012" : "";

	if (strncmp(str_content_type, "text/html", 9) != 0 && bol_not_modified) {
		char *str_temp1 = "HTTP/1.1 304 Not Modified\015\012ETag: \"";
		char *str_temp2 = "\"\015\012Last-Modified: ";
		char *str_temp3 = "\015\012Server: " SUN_PROGRAM_LOWER_NAME "\015\012"
			"Connection: close\015\012\015\012";
		SERROR_SNCAT(
			client->str_response, &client_http_file->int_response_len,
			str_temp1, strlen(str_temp1),
			str_etag, strlen(str_etag),
			str_temp2, strlen(str_temp2),
			str_last_modified, strlen(str_last_modified),
			str_temp3, strlen(str_temp3)
		);

		client_http_file->int_read = 0;
		client_http_file->int_response_header_len = strlen(client->str_response);
		client_http_file->int_response_len = client_http_file->int_response_header_len;

		ev_check_stop(EV_A, &client_copy_check->check);
		SFREE(client_copy_check);
		decrement_idle(EV_A);
		ev_io_init(&client_http_file->io, http_file_write_cb, client->io.fd, EV_WRITE);
		ev_io_start(EV_A, &client_http_file->io);
	} else {
		SERROR_SNCAT(
			client->str_response, &client_http_file->int_response_len,
			"HTTP/1.1 200 OK\015\012", (size_t)17,
			str_maybe_download, strlen(str_maybe_download)
		);

		if (strncmp(str_content_type, "text/html", 9) == 0) {
			SERROR_SNFCAT(
				client->str_response, &client_http_file->int_response_len,
				"Cache-Control: no-cache\015\012", (size_t)25
			);
		} else {
			SERROR_SNFCAT(
				client->str_response, &client_http_file->int_response_len,
				"ETag: \"", (size_t)7,
				str_etag, strlen(str_etag),
				"\"\015\012", (size_t)3,
				"Last-Modified: ", (size_t)15,
				str_last_modified, strlen(str_last_modified),
				"\015\012", (size_t)2,
				"Connection: close\015\012", (size_t)19
				// Not needed right now, but here it is in case we do later.
				//"Cache-Control: no-store\015\012"
			);
		}

		char *str_temp4 = "Server: " SUN_PROGRAM_LOWER_NAME "\015\012Content-Length: ";
		SERROR_SNFCAT(
			client->str_response, &client_http_file->int_response_len,
			str_temp4, strlen(str_temp4),
			str_length, strlen(str_length),
			"\015\012Content-Type:", (size_t)15,
			str_content_type, strlen(str_content_type),
			"\015\012\015\012", (size_t)4
		);

		client_http_file->int_read = 0;
		client_http_file->int_response_header_len = client_http_file->int_response_len;
		client_http_file->int_response_len =
			client_http_file->int_response_header_len + (size_t)client_http_file->int_read_len;
		SERROR_SREALLOC(
			client->str_response, client_http_file->int_response_header_len + (size_t)client_http_file->int_read_len + 1);
		memset(client->str_response + client_http_file->int_response_header_len, 0,
			(size_t)client_http_file->int_read_len + 1);
		client->str_response[client_http_file->int_response_header_len + (size_t)client_http_file->int_read_len] = 0;

		ev_check_stop(EV_A, &client_copy_check->check);
		ev_check_init(&client_copy_check->check, http_file_step3);
		ev_check_start(EV_A, &client_copy_check->check);
	}

	SFREE(statdata);
	SFREE(tm_if_modified_by);
	SFREE(tm_change_stamp);
	SFREE_ALL();
	bol_error_state = false;
	return;
error:
	SFREE(statdata);
	SFREE(tm_if_modified_by);
	SFREE(tm_change_stamp);
	SFREE_ALL();
	http_file_free(client_http_file);
	bol_error_state = false;
	ev_io_stop(EV_A, &client->io);
	ev_check_stop(EV_A, &client_copy_check->check);
	decrement_idle(EV_A);
	SERROR_CLIENT_CLOSE_NORESPONSE(client);
}

void http_file_step3(EV_P, ev_check *w, int revents) {
	if (revents != 0) {
	} // get rid of unused parameter warning
	// SDEBUG("http_file_step3");
	struct sock_ev_client_copy_check *client_copy_check = (struct sock_ev_client_copy_check *)w;
	struct sock_ev_client_http_file *client_http_file = (struct sock_ev_client_http_file *)(client_copy_check->client_request);
	struct sock_ev_client *client = client_http_file->parent;
#ifdef _WIN32
	LPTSTR strErrorText = NULL;
#endif

	SDEBUG("client_http_file->int_response_header_len: %d", client_http_file->int_response_header_len);
	SDEBUG("client_http_file->int_read: %d", client_http_file->int_read);
	SDEBUG("client_http_file->int_read_len: %d", client_http_file->int_read_len);
	if (client_http_file->int_read == client_http_file->int_read_len) {
		ev_check_stop(EV_A, &client_copy_check->check);
		SFREE(client_copy_check);
		decrement_idle(EV_A);
		ev_io_init(&client_http_file->io, http_file_write_cb, client->io.fd, EV_WRITE);
		ev_io_start(EV_A, &client_http_file->io);

#ifdef _WIN32
		CloseHandle(client_http_file->h_file);
		client_http_file->h_file = INVALID_HANDLE_VALUE;
#else
		close(client_http_file->int_file_fd);
		client_http_file->int_file_fd = -1;
#endif

	} else {
#ifdef _WIN32
		DWORD int_read = 0;
		BOOL bol_result = ReadFile(client_http_file->h_file,
			client->str_response + client_http_file->int_response_header_len + client_http_file->int_read,
			(DWORD)(client_http_file->int_read_len - client_http_file->int_read), &int_read, NULL);
		if (bol_result == FALSE) {
			int int_err = GetLastError();
			FormatMessageA(FORMAT_MESSAGE_FROM_SYSTEM | FORMAT_MESSAGE_ALLOCATE_BUFFER | FORMAT_MESSAGE_IGNORE_INSERTS, NULL,
				int_err, MAKELANGID(LANG_NEUTRAL, SUBLANG_DEFAULT), (LPSTR)&strErrorText, 0, NULL);

			if (strErrorText != NULL) {
				SERROR("ReadFile failed: 0x%X (%s)", int_err, strErrorText);
			}
		}
#else
		lseek(client_http_file->int_file_fd, (off_t)client_http_file->int_read, SEEK_SET);
		ssize_t int_read = read(client_http_file->int_file_fd,
			client->str_response + (off_t)client_http_file->int_response_header_len + client_http_file->int_read,
			(size_t)(client_http_file->int_read_len - client_http_file->int_read));
		// SDEBUG("int_read: %d", int_read);
		// SDEBUG("client->str_response +
		// client_http_file->int_response_header_len +
		// client_http_file->int_read:\n>%s<",
		// client->str_response + client_http_file->int_response_header_len +
		// client_http_file->int_read);
		SERROR_CHECK(int_read > 0, "Read failed: %d (%s)", errno, strerror(errno));
#endif
		client_http_file->int_read += int_read;
	}

	bol_error_state = false;
	return;
error:
	http_file_free(client_http_file);
	bol_error_state = false;
	ev_io_stop(EV_A, &client->io);
	if (client_copy_check != NULL) {
		ev_check_stop(EV_A, &client_copy_check->check);
		decrement_idle(EV_A);
	}
	SERROR_CLIENT_CLOSE_NORESPONSE(client);
}

void http_file_write_cb(EV_P, ev_io *w, int revents) {
	if (revents != 0) {
	} // get rid of unused parameter warning
	SDEBUG("http_file_check_cb");
	struct sock_ev_client_http_file *client_http_file = (struct sock_ev_client_http_file *)w;
	struct sock_ev_client *client = client_http_file->parent;
	ssize_t int_response_len = (ssize_t)client_http_file->int_response_len - (ssize_t)client_http_file->int_written;
	if (int_response_len > MB) {
		int_response_len = MB;
	}

	//        DEBUG("write(%i, %p, %i)",
	//              client->int_sock,
	//              client->str_response + int_written,
	//              client->int_response_length - int_written);
	int_response_len = client_write(client, client->str_response + client_http_file->int_written, (size_t)int_response_len);

	SDEBUG("write(%i, %p, %i): %i", client->int_sock, client->str_response + client_http_file->int_written,
		client_http_file->int_response_len - client_http_file->int_written, int_response_len);

	if (int_response_len == SOCK_WANT_READ) {
		ev_io_stop(EV_A, w);
		ev_io_set(w, GET_CLIENT_SOCKET(client), EV_READ);
		ev_io_start(EV_A, w);
		bol_error_state = false;
		errno = 0;
		return;

	} else if (int_response_len == SOCK_WANT_WRITE) {
		ev_io_stop(EV_A, w);
		ev_io_set(w, GET_CLIENT_SOCKET(client), EV_WRITE);
		ev_io_start(EV_A, w);
		bol_error_state = false;
		errno = 0;
		return;

	} else if (int_response_len < 0 && errno != EAGAIN) {
		SERROR("client_write(%i, %p, %i) failed: %i", client->int_sock, client->str_response + client_http_file->int_written,
				client_http_file->int_response_len - client_http_file->int_written, int_response_len);
	} else {
		client_http_file->int_written += (size_t)int_response_len;
	}

	if (client_http_file->int_written == client_http_file->int_response_len) {
		SFREE(client->str_response);
		ev_io_stop(EV_A, &client_http_file->parent->io);
		ev_io_stop(EV_A, w);
		http_file_free(client_http_file);
		client_http_file = NULL;
		SERROR_CLIENT_CLOSE(client);
	}
	bol_error_state = false;
	errno = 0;
	return;
error:
	SFREE(client->str_response);
	http_file_free(client_http_file);
	SERROR_CLIENT_CLOSE_NORESPONSE(client);
	bol_error_state = false;
	errno = 0;
}

void http_file_free(struct sock_ev_client_http_file *client_http_file) {
	if (client_http_file != NULL) {
		if (client_http_file->io.fd != INVALID_SOCKET) {
			SDEBUG("test");
			ev_io_stop(global_loop, &client_http_file->io);
		}
#ifdef _WIN32
		if (client_http_file->h_file != INVALID_HANDLE_VALUE) {
			CloseHandle(client_http_file->h_file);
			client_http_file->h_file = INVALID_HANDLE_VALUE;
		}
#else
		if (client_http_file->int_file_fd > -1) {
			close(client_http_file->int_file_fd);
			client_http_file->int_file_fd = -1;
		}
#endif
		SFREE(client_http_file->str_uri_part);
		SFREE(client_http_file->str_uri);
		SFREE(client_http_file);
	}
}
