#ifndef ENVELOPE

#include "ws_tab.h"

static const char *str_date_format = "%Y-%m-%d %H:%M:%S";

struct custom_check_callback {
	ev_check check;
	struct sock_ev_client_request *client_request;
};

char *ws_tab_step1(struct sock_ev_client_request *client_request) {
	SDEFINE_VAR_ALL(str_path_temp, str_local_path_root, str_change_stamp, str_query);
	struct sock_ev_client_tab *client_tab = (struct sock_ev_client_tab *)(client_request->vod_request_data);
	char *str_response = NULL;
	char *str_temp = NULL;
	char *ptr_change_stamp = NULL;
	char *str_request_type = NULL;
	char *ptr_query = NULL;

	client_request->int_response_id = 0;
	client_request->arr_response = DArray_create(sizeof(char *), 1);

	client_tab->str_path = NULL;
	client_tab->str_path_to = NULL;
	client_tab->str_content = NULL;
	client_tab->arr_contents = NULL;
#ifdef _WIN32
	client_tab->h_file = INVALID_HANDLE_VALUE;
#else
	client_tab->int_fd = -1;
#endif

	// right after TAB\t
	str_request_type = client_request->ptr_query + 4;
	// right after TYPE\t
	ptr_query = strstr(str_request_type, "\t");
	SFINISH_CHECK(ptr_query != NULL, "strstr failed");
	ptr_query += 1;
	*(ptr_query - 1) = 0;

	// canonical username
	str_path_temp = canonical(str_global_sql_root, client_request->parent->str_connname_folder, "read_dir");
	SFINISH_CHECK(str_path_temp != NULL, "Failed to get canonical path: >%s|%s<", str_global_sql_root, client_request->parent->str_connname_folder);

	str_local_path_root = canonical(str_path_temp, client_request->parent->str_username, "read_dir");
	SFREE(str_path_temp);
	SFINISH_CHECK(str_local_path_root != NULL, "Failed to get canonical path: >%s|%s<", str_path_temp,
		client_request->parent->str_username);

	if (strcmp(str_request_type, "LIST") == 0) {
		client_tab->str_path = ptr_query;
		ptr_query = strstr(client_tab->str_path, "\012");
		if (ptr_query != NULL) {
			*ptr_query = 0;
		}

		str_temp = client_tab->str_path;
		client_tab->str_path = unescape_value(str_temp);
		SFINISH_CHECK(client_tab->str_path != NULL, "unescape_value failed");

		str_path_temp = client_tab->str_path;
		client_tab->str_path = canonical(str_local_path_root, str_path_temp, "read_dir");
		SFINISH_CHECK(client_tab->str_path != NULL, "Failed to get canonical path: >%s|%s<", str_local_path_root, str_path_temp);
		SFREE(str_path_temp);

		ws_tab_list_step2(global_loop, client_request);

	} else if (strcmp(str_request_type, "READ") == 0) {
		client_tab->str_path = ptr_query;
		ptr_query = strstr(client_tab->str_path, "\012");
		if (ptr_query != NULL) {
			*ptr_query = 0;
		}

		str_temp = client_tab->str_path;
		client_tab->str_path = unescape_value(str_temp);
		SFINISH_CHECK(client_tab->str_path != NULL, "unescape_value failed");

		str_path_temp = client_tab->str_path;
		client_tab->str_path = canonical(str_local_path_root, str_path_temp, "read_file");
		SFINISH_CHECK(client_tab->str_path != NULL, "Failed to get canonical path: >%s|%s<", str_local_path_root, str_path_temp);
		SFREE(str_path_temp);

		ws_tab_read_step2(global_loop, client_request);

	} else if (strcmp(str_request_type, "WRITE") == 0) {
		client_tab->ptr_content = strstr(ptr_query, "\012") + 1;
		SFINISH_CAT_CSTR(str_query, ptr_query);
		ptr_query = strstr(str_query, "\t");
		SFINISH_CHECK(ptr_query != NULL, "strstr failed");
		*ptr_query = 0;
		ptr_change_stamp = ptr_query + 1;
		ptr_query = strstr(ptr_change_stamp, "\012");
		if (ptr_query != NULL) {
			*ptr_query = 0;
		}

		client_tab->str_path = unescape_value(str_query);
		SFINISH_CHECK(client_tab->str_path != NULL, "unescape_value failed");

		client_tab->str_change_stamp = unescape_value(ptr_change_stamp);
		SFINISH_CHECK(client_tab->str_change_stamp != NULL, "unescape_value failed");

		str_path_temp = client_tab->str_path;
		client_tab->str_path = canonical(str_local_path_root, str_path_temp, "write_file");
		SFINISH_CHECK(client_tab->str_path != NULL, "Failed to get canonical path: >%s|%s<", str_local_path_root, str_path_temp);
		SFREE(str_path_temp);

		ws_tab_write_step2(global_loop, client_request);

	} else if (strcmp(str_request_type, "MOVE") == 0) {
		str_temp = ptr_query;
		ptr_query = strstr(str_temp, "\t");
		SFINISH_CHECK(ptr_query != NULL, "strstr failed");
		if (ptr_query != NULL) {
			*ptr_query = 0;
		}

		client_tab->str_path = unescape_value(str_temp);
		SFINISH_CHECK(client_tab->str_path != NULL, "unescape_value failed");

		str_temp = ptr_query + 1;
		ptr_query = strstr(str_temp, "\012");
		if (ptr_query != NULL) {
			*ptr_query = 0;
		}

		client_tab->str_path_to = unescape_value(str_temp);
		SFINISH_CHECK(client_tab->str_path_to != NULL, "unescape_value failed");

		str_path_temp = client_tab->str_path;
		client_tab->str_path = canonical(str_local_path_root, str_path_temp, "read_file");
		SFINISH_CHECK(client_tab->str_path != NULL, "Failed to get canonical path: >%s|%s<", str_local_path_root, str_path_temp);
		SFREE(str_path_temp);

		str_path_temp = client_tab->str_path_to;
		client_tab->str_path_to = canonical(str_local_path_root, str_path_temp, "valid_path");
		SFINISH_CHECK(
			client_tab->str_path_to != NULL, "Failed to get canonical path: >%s|%s<", str_local_path_root, str_path_temp);
		SFREE(str_path_temp);

		SDEBUG("client_tab->str_path   : %s", client_tab->str_path);
		SDEBUG("client_tab->str_path_to: %s", client_tab->str_path_to);
		int int_ret = rename(client_tab->str_path, client_tab->str_path_to);
		SFINISH_CHECK(int_ret == 0, "rename failed: %d, %d (%s)", int_ret, errno, strerror(errno));

		struct custom_check_callback *cb_data = NULL;
		SFINISH_SALLOC(cb_data, sizeof(struct custom_check_callback));
		cb_data->client_request = client_request;

		increment_idle(global_loop);
		ev_check_init(&cb_data->check, ws_tab_move_step2);
		ev_check_start(global_loop, &cb_data->check);

	} else {
		SFINISH("Unknown TAB request type %s", str_request_type);
	}

	bol_error_state = false;
finish:
	SFREE_ALL();

	SDEBUG("bol_error_state == %s", bol_error_state == true ? "true" : "false");
	if (bol_error_state == true) {
		ws_tab_free(client_tab);
		// client_request_free(client_request);
		// client_request_free takes care of this
		// SFREE(client_tab);
		bol_error_state = false;
	}

	if (str_response != NULL) {
		char *_str_response = str_response;
		client_request->int_response_id += 1;
		char str_temp1[101] = {0};
		snprintf(str_temp1, 100, "%zd", client_request->int_response_id);
		SFINISH_CAT_CSTR(str_response, "messageid = ", client_request->str_message_id, "\012"
																					   "responsenumber = ",
			str_temp1, "\012", _str_response);
		WS_sendFrame(global_loop, client_request->parent, true, 0x01, str_response, strlen(str_response));
		DArray_push(client_request->arr_response, str_response);
		SFREE(_str_response);

		client_request->int_response_id += 1;
		memset(str_temp1, 0, 101);
		snprintf(str_temp1, 100, "%zd", client_request->int_response_id);
		SFINISH_CAT_CSTR(str_response, "messageid = ", client_request->str_message_id, "\012"
																					   "responsenumber = ",
			str_temp1, "\012TRANSACTION COMPLETED");
		WS_sendFrame(global_loop, client_request->parent, true, 0x01, str_response, strlen(str_response));
		DArray_push(client_request->arr_response, str_response);
	}
	return str_response;
}

// **************************************************************************************
// **************************************************************************************
// **************************************** LIST
// ****************************************
// **************************************************************************************
// **************************************************************************************

struct list_dirent_ent {
	char *str_name;
	time_t int_change_stamp;
};

int ws_tab_list_sort(const void *arg1, const void *arg2) {
	struct list_dirent_ent *ent1 = *((struct list_dirent_ent **)arg1);
	struct list_dirent_ent *ent2 = *((struct list_dirent_ent **)arg2);
	return ent2->int_change_stamp < ent1->int_change_stamp ? -1 : 1;
}

void ws_tab_list_step2(EV_P, struct sock_ev_client_request *client_request) {
	char *str_response = NULL;
	struct sock_ev_client_tab *client_tab = (struct sock_ev_client_tab *)(client_request->vod_request_data);
	client_tab->arr_contents = DArray_create(sizeof(struct list_dirent_ent), 100);
	SDEFINE_VAR_ALL(str_temp_path, str_temp1, str_name, str_canonical_name);
	struct list_dirent_ent *ent = NULL;
	struct stat *statdata = NULL;

	DIR *dirp = NULL;
	struct dirent *dp = NULL;
	dirp = opendir(client_tab->str_path);
	SFINISH_ERROR_CHECK(dirp != NULL, "opendir failed");

	while (dirp) {
		errno = 0;
		if ((dp = readdir(dirp)) != NULL) {
			// dp->d_name
			SFINISH_CAT_CSTR(str_name, dp->d_name);
			if (strncmp(str_name, "..", 3) != 0 && strncmp(str_name, ".", 2) != 0) {
				str_canonical_name = canonical(client_tab->str_path, str_name, "valid_path");
				SFINISH_CHECK(str_canonical_name != NULL, "canonical failed");
				SFINISH_SALLOC(statdata, sizeof(struct stat));
				stat(str_canonical_name, statdata);
				SFREE(str_canonical_name);

				// TODO: add check watcher

				SFINISH_SALLOC(ent, sizeof(struct list_dirent_ent));
				ent->str_name = str_name;
				ent->int_change_stamp = statdata->st_mtime;
				SDEBUG("Adding >%s<", str_name);
				DArray_push(client_tab->arr_contents, ent);
			} else {
				SFREE(str_name);
			}
			// HARK YE ONLOOKER:
			// DO NOT UNCOMMENT!!! WE ARE PUSHING TO AN ARRAY!!!
			// SFREE(str_name);
			// SFREE(ent);
			str_name = NULL;
			ent = NULL;
			SFREE(statdata);
		} else {
			SFINISH_ERROR_CHECK(errno == 0, "readdir failed");
			// no error, and no file, we've reached the end so close
			closedir(dirp);
			dirp = NULL;
		}
	}

	DArray_qsort(client_tab->arr_contents, (DArray_compare)ws_tab_list_sort);

	client_request->int_response_id += 1;
	char str_temp[101] = {0};
	snprintf(str_temp, 100, "%zu", client_request->int_response_id);
	SFINISH_CAT_CSTR(str_response, "messageid = ", client_request->str_message_id, "\012", "responsenumber = ", str_temp, "\012");
	size_t int_i, int_len = DArray_end(client_tab->arr_contents);
	for (int_i = 0; int_i < int_len; int_i += 1) {
		struct list_dirent_ent *ent1 = DArray_get(client_tab->arr_contents, int_i);
		SDEBUG("%p->arr_contents[%d]->str_name        : %s", client_tab, int_i, ent1->str_name);
		SDEBUG("%p->arr_contents[%d]->int_change_stamp: %d", client_tab, int_i, ent1->int_change_stamp);
		SFINISH_CAT_APPEND(str_response, ent1->str_name, "\012");
	}
	WS_sendFrame(EV_A, client_request->parent, true, 0x01, str_response, strlen(str_response));
	DArray_push(client_request->arr_response, str_response);

	client_request->int_response_id += 1;
	memset(str_temp, 0, 101);
	snprintf(str_temp, 100, "%zd", client_request->int_response_id);
	SFINISH_CAT_CSTR(str_response, "messageid = ", client_request->str_message_id, "\012"
																				   "responsenumber = ",
		str_temp, "\012"
				  "TRANSACTION COMPLETED");
	WS_sendFrame(EV_A, client_request->parent, true, 0x01, str_response, strlen(str_response));
	DArray_push(client_request->arr_response, str_response);

	str_response = NULL;

	bol_error_state = false;
finish:
	SFREE(ent);
	SFREE_ALL();
	ws_tab_free(client_tab);
	// client_request_free(client_request);
	// client_request_free takes care of this
	// SFREE(client_tab);
	if (bol_error_state == true) {
		bol_error_state = false;

		SFREE(str_response);
		client_request->int_response_id = (ssize_t)DArray_end(client_request->arr_response) + 1;
		memset(str_temp, 0, 101);
		snprintf(str_temp, 100, "%zd", client_request->int_response_id);
		SFINISH_CAT_CSTR(str_response, "messageid = ", client_request->str_message_id, "\012"
																					   "responsenumber = ",
			str_temp, "\012"
					  "FATAL\012",
			"Failed to list directory ", client_tab->str_path, ": ", strerror(errno));
		WS_sendFrame(EV_A, client_request->parent, true, 0x01, str_response, strlen(str_response));
		DArray_push(client_request->arr_response, str_response);

		if (client_tab->arr_contents != NULL) {
			DArray_clear_destroy(client_tab->arr_contents);
			client_tab->arr_contents = NULL;
		}
	}
}

// **************************************************************************************
// **************************************************************************************
// **************************************** READ
// ****************************************
// **************************************************************************************
// **************************************************************************************

void ws_tab_read_step2(EV_P, struct sock_ev_client_request *client_request) {
	char *str_response = NULL;
	struct sock_ev_client_tab *client_tab = (struct sock_ev_client_tab *)(client_request->vod_request_data);
#ifdef _WIN32
	LPTSTR strErrorText = NULL;
#else
	struct stat *statdata = NULL;
	char *str_nanoseconds = NULL;
#endif

#ifdef _WIN32
	SetLastError(0);
	client_tab->h_file =
		CreateFileA(client_tab->str_path, GENERIC_READ, FILE_SHARE_READ, NULL, OPEN_EXISTING, FILE_ATTRIBUTE_NORMAL, NULL);
	if (client_tab->h_file == INVALID_HANDLE_VALUE) {
		int int_err = GetLastError();
		FormatMessageA(FORMAT_MESSAGE_FROM_SYSTEM | FORMAT_MESSAGE_ALLOCATE_BUFFER | FORMAT_MESSAGE_IGNORE_INSERTS, NULL, int_err,
			MAKELANGID(LANG_NEUTRAL, SUBLANG_DEFAULT), (LPSTR)&strErrorText, 0, NULL);

		if (strErrorText != NULL) {
			SFINISH("CreateFile failed: 0x%X (%s)", int_err, strErrorText);
		}
	}

	SFINISH_SALLOC(client_tab->str_change_stamp, 101);
	FILETIME ft_last_write_time;
	SFINISH_CHECK(GetFileTime(client_tab->h_file, NULL, NULL, &ft_last_write_time) != 0, "GetFileTime failed");
	SYSTEMTIME st_last_write_time;
	SFINISH_CHECK(FileTimeToSystemTime(&ft_last_write_time, &st_last_write_time) != 0, "FileTimeToSystemTime failed");

	SFINISH_CHECK(
		snprintf(client_tab->str_change_stamp, 100, "%d-%d-%d %d:%d:%d.%d",
			st_last_write_time.wYear,
			st_last_write_time.wMonth,
			st_last_write_time.wDay,
			st_last_write_time.wHour,
			st_last_write_time.wMinute,
			st_last_write_time.wSecond,
			st_last_write_time.wMilliseconds
		) > 0,
		"snprintf() failed"
	);
	client_tab->str_change_stamp[100] = 0;
#else
	client_tab->int_fd = open(client_tab->str_path, O_RDONLY | O_NONBLOCK);
	SFINISH_CHECK(client_tab->int_fd != -1, "open failed!");
#endif

#ifdef _WIN32
	client_tab->int_length = GetFileSize(client_tab->h_file, NULL);
#else
	client_tab->int_length = lseek(client_tab->int_fd, 0, SEEK_END);
	SFINISH_CHECK(client_tab->int_length != -1, "lseek(0, SEEK_END) failed");
	SFINISH_CHECK(lseek(client_tab->int_fd, 0, SEEK_SET) != -1, "lseek(0, SEEK_SET) failed");

	SFINISH_SALLOC(statdata, sizeof(struct stat));
	stat(client_tab->str_path, statdata);

	SFINISH_SALLOC(client_tab->str_change_stamp, 101);
	struct tm *tm_change_stamp = localtime(&(statdata->st_mtime));
	SFINISH_CHECK(tm_change_stamp != NULL, "localtime() failed");
	SFINISH_CHECK(strftime(client_tab->str_change_stamp, 100, str_date_format, tm_change_stamp) != 0, "strftime() failed");
	client_tab->str_change_stamp[100] = 0;
#ifdef st_mtime
	SFINISH_SALLOC(str_nanoseconds, 101);
#ifdef __APPLE__
	SFINISH_CHECK(snprintf(str_nanoseconds, 100, "%ld", statdata->st_mtimespec.tv_nsec) > 0, "snprintf() failed");
#else
	SFINISH_CHECK(snprintf(str_nanoseconds, 100, "%ld", statdata->st_mtim.tv_nsec) > 0, "snprintf() failed");
#endif
	str_nanoseconds[100] = 0;

	SFINISH_CAT_APPEND(client_tab->str_change_stamp, ".", str_nanoseconds);
#endif
#endif

	SFINISH_SALLOC(client_tab->str_content, (size_t)client_tab->int_length + 1);
	client_tab->str_content[client_tab->int_length] = 0;

	client_tab->int_read = 0;
	ev_check_init(&client_request->check, ws_tab_read_step3);
	ev_check_start(EV_A, &client_request->check);
	increment_idle(EV_A);

finish:
#ifdef _WIN32
	if (strErrorText != NULL) {
		LocalFree(strErrorText);
		strErrorText = NULL;
	}
#else
	SFREE(str_nanoseconds);
	SFREE(statdata);
#endif
	if (bol_error_state) {
		bol_error_state = false;
		client_request->int_response_id = (ssize_t)DArray_end(client_request->arr_response) + 1;
		char str_temp[101] = {0};
		snprintf(str_temp, 100, "%zd", client_request->int_response_id);
		if (errno != 0) {
			SFREE(str_response);
			SFINISH_CAT_CSTR(str_response, "messageid = ", client_request->str_message_id, "\012"
																						   "responsenumber = ",
				str_temp, "\012"
						  "FATAL\012",
				"Failed to open file ", client_tab->str_path, " ", strerror(errno));
		} else {
			char *_str_response = str_response;
			SFINISH_CAT_CSTR(str_response, "messageid = ", client_request->str_message_id, "\012"
																						   "responsenumber = ",
				str_temp, "\012", _str_response);
			SFREE(_str_response);
		}

		WS_sendFrame(EV_A, client_request->parent, true, 0x01, str_response, strlen(str_response));
		DArray_push(client_request->arr_response, str_response);

		ws_tab_free(client_tab);
		// client_request_free(client_request);
		// client_request_free takes care of this
		// SFREE(client_tab);
	}
}

void ws_tab_read_step3(EV_P, ev_check *w, int revents) {
	if (revents != 0) {
	} // get rid of unused parameter warning
	char *str_response = NULL;
	struct sock_ev_client_request *client_request = (struct sock_ev_client_request *)w;
	struct sock_ev_client_tab *client_tab = (struct sock_ev_client_tab *)(client_request->vod_request_data);
#ifdef _WIN32
	LPTSTR strErrorText = NULL;
#endif

#ifdef _WIN32
	int int_temp = 0;
	BOOL bol_result = ReadFile(client_tab->h_file, client_tab->str_content + client_tab->int_read,
		(DWORD)(client_tab->int_length - client_tab->int_read), &int_temp, NULL);
	if (bol_result == FALSE) {
		int int_err = GetLastError();
		FormatMessageA(FORMAT_MESSAGE_FROM_SYSTEM | FORMAT_MESSAGE_ALLOCATE_BUFFER | FORMAT_MESSAGE_IGNORE_INSERTS, NULL, int_err,
			MAKELANGID(LANG_NEUTRAL, SUBLANG_DEFAULT), (LPSTR)&strErrorText, 0, NULL);

		if (strErrorText != NULL) {
			SFINISH("ReadFile failed: 0x%X (%s)", int_err, strErrorText);
		}
	}
#else
	ssize_t int_temp = read(client_tab->int_fd, client_tab->str_content + client_tab->int_read,
		(size_t)(client_tab->int_length - client_tab->int_read));
	SFINISH_ERROR_CHECK(int_temp >= 0, "read failed");
#endif
	client_tab->int_read += (ssize_t)int_temp;

	if (int_temp <= 0 || client_tab->int_read == client_tab->int_length) {
		ev_check_stop(EV_A, &client_request->check);
		decrement_idle(EV_A);
		ws_tab_read_step4(EV_A, client_request);
	}

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
		client_request->int_response_id = (ssize_t)DArray_end(client_request->arr_response) + 1;
		char str_temp[101] = {0};
		snprintf(str_temp, 100, "%zd", client_request->int_response_id);
		if (errno != 0) {
			SFREE(str_response);
			SFINISH_CAT_CSTR(str_response, "messageid = ", client_request->str_message_id, "\012"
																						   "responsenumber = ",
				str_temp, "\012"
						  "FATAL\012",
				"Failed to read file ", client_tab->str_path, " ", strerror(errno));
		} else {
			char *_str_response = str_response;
			SFINISH_CAT_CSTR(str_response, "messageid = ", client_request->str_message_id, "\012"
																						   "responsenumber = ",
				str_temp, "\012", _str_response);
			SFREE(_str_response);
		}

		WS_sendFrame(EV_A, client_request->parent, true, 0x01, str_response, strlen(str_response));
		DArray_push(client_request->arr_response, str_response);

		ws_tab_free(client_tab);
		// client_request_free(client_request);
		// client_request_free takes care of this
		// SFREE(client_tab);
	}
}

void ws_tab_read_step4(EV_P, struct sock_ev_client_request *client_request) {
	char *str_response = NULL;
	struct sock_ev_client_tab *client_tab = (struct sock_ev_client_tab *)(client_request->vod_request_data);

	client_request->int_response_id += 1;
	char str_temp[101] = {0};
	snprintf(str_temp, 100, "%zd", client_request->int_response_id);
	SFINISH_CAT_CSTR(str_response, "messageid = ", client_request->str_message_id, "\012"
																				   "responsenumber = ",
		str_temp, "\012", client_tab->str_change_stamp, "\012", client_tab->str_content);
	WS_sendFrame(EV_A, client_request->parent, true, 0x01, str_response, strlen(str_response));
	DArray_push(client_request->arr_response, str_response);

	client_request->int_response_id += 1;
	memset(str_temp, 0, 101);
	snprintf(str_temp, 100, "%zd", client_request->int_response_id);
	SFINISH_CAT_CSTR(str_response, "messageid = ", client_request->str_message_id, "\012"
																				   "responsenumber = ",
		str_temp, "\012TRANSACTION COMPLETED");
	WS_sendFrame(EV_A, client_request->parent, true, 0x01, str_response, strlen(str_response));
	DArray_push(client_request->arr_response, str_response);

	str_response = NULL;

#ifdef _WIN32
	CloseHandle(client_tab->h_file);
	client_tab->h_file = INVALID_HANDLE_VALUE;
#else
	close(client_tab->int_fd);
	client_tab->int_fd = -1;
#endif

	bol_error_state = false;
finish:
	if (bol_error_state) {
		bol_error_state = false;
		client_request->int_response_id = (ssize_t)DArray_end(client_request->arr_response) + 1;
		memset(str_temp, 0, 101);
		snprintf(str_temp, 100, "%zd", client_request->int_response_id);
		if (errno != 0) {
			SFREE(str_response);
			SFINISH_CAT_CSTR(str_response, "messageid = ", client_request->str_message_id, "\012"
																						   "responsenumber = ",
				str_temp, "\012"
						  "FATAL\012",
				"Failed to read file ", client_tab->str_path, " ", strerror(errno));
		} else {
			char *_str_response = str_response;
			SFINISH_CAT_CSTR(str_response, "messageid = ", client_request->str_message_id, "\012"
																						   "responsenumber = ",
				str_temp, "\012", _str_response);
			SFREE(_str_response);
		}

		WS_sendFrame(EV_A, client_request->parent, true, 0x01, str_response, strlen(str_response));
		DArray_push(client_request->arr_response, str_response);

		ws_tab_free(client_tab);
		// client_request_free(client_request);
		// client_request_free takes care of this
		// SFREE(client_tab);
	} else {
		ws_tab_free(client_tab);
		// client_request_free(client_request);
	}
}

// ***************************************************************************************
// ***************************************************************************************
// **************************************** WRITE
// ****************************************
// ***************************************************************************************
// ***************************************************************************************

void ws_tab_write_step2(EV_P, struct sock_ev_client_request *client_request) {
	char *str_response = NULL;
	struct sock_ev_client_tab *client_tab = (struct sock_ev_client_tab *)(client_request->vod_request_data);
#ifdef _WIN32
	LPTSTR strErrorText = NULL;
#else
	struct stat *statdata = NULL;
	char *str_nanoseconds = NULL;
#endif
	char *str_change_stamp = NULL;

#ifdef _WIN32
	if (strncmp(client_tab->str_change_stamp, "0", 2) != 0) {
		SetLastError(0);
		client_tab->h_file =
			CreateFileA(client_tab->str_path, GENERIC_READ, FILE_SHARE_READ, NULL, OPEN_EXISTING, FILE_ATTRIBUTE_NORMAL, NULL);
		if (client_tab->h_file == INVALID_HANDLE_VALUE) {
			int int_err = GetLastError();
			FormatMessageA(FORMAT_MESSAGE_FROM_SYSTEM | FORMAT_MESSAGE_ALLOCATE_BUFFER | FORMAT_MESSAGE_IGNORE_INSERTS, NULL, int_err,
				MAKELANGID(LANG_NEUTRAL, SUBLANG_DEFAULT), (LPSTR)&strErrorText, 0, NULL);

			if (strErrorText != NULL) {
				SFINISH("CreateFile failed: 0x%X (%s)", int_err, strErrorText);
			}
		}

		FILETIME ft_last_write_time;
		SFINISH_CHECK(GetFileTime(client_tab->h_file, NULL, NULL, &ft_last_write_time) != 0, "GetFileTime failed");

		SYSTEMTIME st_last_write_time;
		SFINISH_CHECK(FileTimeToSystemTime(&ft_last_write_time, &st_last_write_time) != 0, "FileTimeToSystemTime failed");

		SFINISH_SALLOC(str_change_stamp, 101);
		SFINISH_CHECK(
			snprintf(str_change_stamp, 100, "%d-%d-%d %d:%d:%d.%d",
				st_last_write_time.wYear,
				st_last_write_time.wMonth,
				st_last_write_time.wDay,
				st_last_write_time.wHour,
				st_last_write_time.wMinute,
				st_last_write_time.wSecond,
				st_last_write_time.wMilliseconds
			) > 0,
			"snprintf() failed"
		);
		str_change_stamp[100] = 0;

		SDEBUG("client_tab->str_change_stamp: %s", client_tab->str_change_stamp);
		SDEBUG("str_change_stamp            : %s", str_change_stamp);
		if (strncmp(client_tab->str_change_stamp, str_change_stamp, strlen(str_change_stamp)) != 0) {
			SFINISH("Someone updated this file before you.");
		}
		CloseHandle(client_tab->h_file);
	}
#else
	SFINISH_SALLOC(statdata, sizeof(struct stat));
	if (strncmp(client_tab->str_change_stamp, "0", 2) != 0 && stat(client_tab->str_path, statdata) == 0) {
		SFINISH_SALLOC(str_change_stamp, 101);
		struct tm *tm_change_stamp = localtime(&(statdata->st_mtime));
		SFINISH_CHECK(tm_change_stamp != NULL, "localtime() failed");
		SFINISH_CHECK(strftime(str_change_stamp, 100, str_date_format, tm_change_stamp) != 0, "strftime() failed");
		str_change_stamp[100] = 0;
#ifdef st_mtime
		SFINISH_SALLOC(str_nanoseconds, 101);
#ifdef __APPLE__
		SFINISH_CHECK(snprintf(str_nanoseconds, 100, "%ld", statdata->st_mtimespec.tv_nsec) > 0, "snprintf() failed");
#else
		SFINISH_CHECK(snprintf(str_nanoseconds, 100, "%ld", statdata->st_mtim.tv_nsec) > 0, "snprintf() failed");
#endif
		str_nanoseconds[100] = 0;

		SFINISH_CAT_APPEND(str_change_stamp, ".", str_nanoseconds);
#endif

		if (strncmp(client_tab->str_change_stamp, str_change_stamp, strlen(str_change_stamp)) != 0) {
			SFINISH("Someone updated this file before you.");
		}
	}
#endif

#ifdef _WIN32
	SetLastError(0);
	client_tab->h_file = CreateFileA(client_tab->str_path, GENERIC_WRITE, 0, NULL, CREATE_NEW, FILE_ATTRIBUTE_NORMAL, NULL);
	if (client_tab->h_file == INVALID_HANDLE_VALUE) {
		int int_err = GetLastError();
		if (int_err == 0x50) {
			// CreateFileA return "File exists" if you give it CREATE_NEW and it finds
			// the file already there
			// In this case, we need to truncate the existing file
			SetLastError(0);
			client_tab->h_file =
				CreateFileA(client_tab->str_path, GENERIC_WRITE, 0, NULL, TRUNCATE_EXISTING, FILE_ATTRIBUTE_NORMAL, NULL);
		}
		if (client_tab->h_file == INVALID_HANDLE_VALUE) {
			int_err = GetLastError();
			FormatMessageA(FORMAT_MESSAGE_FROM_SYSTEM | FORMAT_MESSAGE_ALLOCATE_BUFFER | FORMAT_MESSAGE_IGNORE_INSERTS, NULL,
				int_err, MAKELANGID(LANG_NEUTRAL, SUBLANG_DEFAULT), (LPSTR)&strErrorText, 0, NULL);

			if (strErrorText != NULL) {
				SFINISH("CreateFile failed: 0x%X (%s)", int_err, strErrorText);
			}
		}
	}
#else
	client_tab->int_fd = open(client_tab->str_path, O_TRUNC | O_WRONLY | O_CREAT, 0770);
	SFINISH_CHECK(client_tab->int_fd > 0, "open() failed!");
#endif

	ev_check_init(&client_request->check, ws_tab_write_step3);
	ev_check_start(EV_A, &client_request->check);
	increment_idle(EV_A);

	bol_error_state = false;
finish:
#ifdef _WIN32
	if (strErrorText != NULL) {
		LocalFree(strErrorText);
		strErrorText = NULL;
	}
#else
	SFREE(statdata);
	SFREE(str_nanoseconds);
#endif
	SFREE(str_change_stamp);
	if (bol_error_state) {
		bol_error_state = false;
		client_request->int_response_id = (ssize_t)DArray_end(client_request->arr_response) + 1;
		char str_temp[101] = {0};
		snprintf(str_temp, 100, "%zd", client_request->int_response_id);
		if (errno != 0) {
			SFREE(str_response);
			SFINISH_CAT_CSTR(str_response, "messageid = ", client_request->str_message_id, "\012"
																						   "responsenumber = ",
				str_temp, "\012"
						  "FATAL\012",
				"Failed to open file for writing ", client_tab->str_path, " ", strerror(errno));
		} else {
			char *_str_response = str_response;
			SFINISH_CAT_CSTR(str_response, "messageid = ", client_request->str_message_id, "\012"
																						   "responsenumber = ",
				str_temp, "\012", _str_response);
			SFREE(_str_response);
		}

		WS_sendFrame(EV_A, client_request->parent, true, 0x01, str_response, strlen(str_response));
		DArray_push(client_request->arr_response, str_response);

		ws_tab_free(client_tab);
		// client_request_free(client_request);
		// client_request_free takes care of this
		// SFREE(client_tab);
	}
}

void ws_tab_write_step3(EV_P, ev_check *w, int revents) {
	if (revents != 0) {
	} // get rid of unused parameter warning
	char *str_response = NULL;
	struct sock_ev_client_request *client_request = (struct sock_ev_client_request *)w;
	struct sock_ev_client_tab *client_tab = (struct sock_ev_client_tab *)(client_request->vod_request_data);
#ifdef _WIN32
	LPTSTR strErrorText = NULL;
#endif

#ifdef _WIN32
	int int_temp = 0;
	BOOL bol_result = WriteFile(client_tab->h_file, client_tab->ptr_content + client_tab->int_written,
		(DWORD)(strlen(client_tab->ptr_content) - client_tab->int_written), &int_temp, NULL);
	if (bol_result == FALSE) {
		int int_err = GetLastError();
		FormatMessageA(FORMAT_MESSAGE_FROM_SYSTEM | FORMAT_MESSAGE_ALLOCATE_BUFFER | FORMAT_MESSAGE_IGNORE_INSERTS, NULL, int_err,
			MAKELANGID(LANG_NEUTRAL, SUBLANG_DEFAULT), (LPSTR)&strErrorText, 0, NULL);

		if (strErrorText != NULL) {
			SFINISH("WriteFile failed: 0x%X (%s)", int_err, strErrorText);
		}
	}
#else
	ssize_t int_temp = write(client_tab->int_fd, client_tab->ptr_content + client_tab->int_written,
		strlen(client_tab->ptr_content) - (size_t)client_tab->int_written);
	SFINISH_CHECK(int_temp != -1, "write failed");
#endif
	client_tab->int_written += int_temp;

	if (client_tab->int_written == (ssize_t)strlen(client_tab->ptr_content)) {
		ev_check_stop(EV_A, &client_request->check);
		decrement_idle(EV_A);
		ws_tab_write_step4(EV_A, client_request);
	}

	bol_error_state = false;
finish:
#ifdef _WIN32
	if (strErrorText != NULL) {
		LocalFree(strErrorText);
		strErrorText = NULL;
	}
#endif
	if (bol_error_state) {
		ev_check_stop(EV_A, &client_request->check);
		bol_error_state = false;
		client_request->int_response_id = (ssize_t)DArray_end(client_request->arr_response) + 1;
		char str_temp[101] = {0};
		snprintf(str_temp, 100, "%zd", client_request->int_response_id);
		if (errno != 0) {
			SFREE(str_response);
			SFINISH_CAT_CSTR(str_response, "messageid = ", client_request->str_message_id, "\012"
																						   "responsenumber = ",
				str_temp, "\012"
						  "FATAL\012",
				"Failed to write to file ", client_tab->str_path, " ", strerror(errno));
		} else {
			char *_str_response = str_response;
			SFINISH_CAT_CSTR(str_response, "messageid = ", client_request->str_message_id, "\012"
																						   "responsenumber = ",
				str_temp, "\012", _str_response);
			SFREE(_str_response);
		}

		WS_sendFrame(EV_A, client_request->parent, true, 0x01, str_response, strlen(str_response));
		DArray_push(client_request->arr_response, str_response);

		ws_tab_free(client_tab);
		// client_request_free(client_request);
		// client_request_free takes care of this
		// SFREE(client_tab);
	}
}

void ws_tab_write_step4(EV_P, struct sock_ev_client_request *client_request) {
	char *str_response = NULL;
	struct sock_ev_client_tab *client_tab = (struct sock_ev_client_tab *)(client_request->vod_request_data);
#ifdef _WIN32
	LPTSTR strErrorText = NULL;
#else
	struct stat *statdata = NULL;
	char *str_nanoseconds = NULL;
#endif

	SFINISH_SALLOC(str_response, 101);
#ifdef _WIN32
	CloseHandle(client_tab->h_file);
	SetLastError(0);
	client_tab->h_file =
		CreateFileA(client_tab->str_path, GENERIC_READ, FILE_SHARE_READ, NULL, OPEN_EXISTING, FILE_ATTRIBUTE_NORMAL, NULL);
	if (client_tab->h_file == INVALID_HANDLE_VALUE) {
		int int_err = GetLastError();
		FormatMessageA(FORMAT_MESSAGE_FROM_SYSTEM | FORMAT_MESSAGE_ALLOCATE_BUFFER | FORMAT_MESSAGE_IGNORE_INSERTS, NULL, int_err,
			MAKELANGID(LANG_NEUTRAL, SUBLANG_DEFAULT), (LPSTR)&strErrorText, 0, NULL);

		if (strErrorText != NULL) {
			SFINISH("CreateFile failed: 0x%X (%s)", int_err, strErrorText);
		}
	}

	FILETIME ft_last_write_time;
	SFINISH_CHECK(GetFileTime(client_tab->h_file, NULL, NULL, &ft_last_write_time) != 0, "GetFileTime failed");

	SYSTEMTIME st_last_write_time;
	SFINISH_CHECK(FileTimeToSystemTime(&ft_last_write_time, &st_last_write_time) != 0, "FileTimeToSystemTime failed");

	SFINISH_CHECK(
		snprintf(str_response, 100, "%d-%d-%d %d:%d:%d.%d",
			st_last_write_time.wYear,
			st_last_write_time.wMonth,
			st_last_write_time.wDay,
			st_last_write_time.wHour,
			st_last_write_time.wMinute,
			st_last_write_time.wSecond,
			st_last_write_time.wMilliseconds
		) > 0,
		"snprintf() failed"
	);
		str_response[100] = 0;
#else
	SFINISH_SALLOC(statdata, sizeof(struct stat));
	if (stat(client_tab->str_path, statdata) == 0) {
		struct tm *tm_change_stamp = localtime(&(statdata->st_mtime));
		SFINISH_CHECK(tm_change_stamp != NULL, "localtime() failed");
		SFINISH_CHECK(strftime(str_response, 100, str_date_format, tm_change_stamp) != 0, "strftime() failed");
		str_response[100] = 0;
#ifdef st_mtime
		SFINISH_SALLOC(str_nanoseconds, 101);
#ifdef __APPLE__
		SFINISH_CHECK(snprintf(str_nanoseconds, 100, "%ld", statdata->st_mtimespec.tv_nsec) > 0, "snprintf() failed");
#else
		SFINISH_CHECK(snprintf(str_nanoseconds, 100, "%ld", statdata->st_mtim.tv_nsec) > 0, "snprintf() failed");
#endif
		str_nanoseconds[100] = 0;

		SFINISH_CAT_APPEND(str_response, ".", str_nanoseconds);
#endif
	} else {
		SFINISH("stat failed");
	}
#endif

	bol_error_state = false;
finish:
#ifdef _WIN32
	if (strErrorText != NULL) {
		LocalFree(strErrorText);
		strErrorText = NULL;
	}
#else
	SFREE(statdata);
	SFREE(str_nanoseconds);
#endif

	if (bol_error_state) {
		bol_error_state = false;
		client_request->int_response_id = (ssize_t)DArray_end(client_request->arr_response) + 1;
		char str_temp[101] = {0};
		snprintf(str_temp, 100, "%zd", client_request->int_response_id);
		if (errno != 0) {
			SFREE(str_response);
			SFINISH_CAT_CSTR(str_response, "messageid = ", client_request->str_message_id, "\012"
																						   "responsenumber = ",
				str_temp, "\012"
						  "FATAL\012",
				"Failed to stat file ", client_tab->str_path, " ", strerror(errno));
		} else {
			char *_str_response = str_response;
			SFINISH_CAT_CSTR(str_response, "messageid = ", client_request->str_message_id, "\012"
																						   "responsenumber = ",
				str_temp, "\012", _str_response);
			SFREE(_str_response);
		}

		WS_sendFrame(EV_A, client_request->parent, true, 0x01, str_response, strlen(str_response));
		DArray_push(client_request->arr_response, str_response);

		ws_tab_free(client_tab);
		// client_request_free(client_request);
		// client_request_free takes care of this
		// SFREE(client_tab);
	} else {
		client_request->int_response_id += 1;
		char str_temp[101] = {0};
		snprintf(str_temp, 100, "%zd", client_request->int_response_id);
		char *_str_response = str_response;
		SFINISH_CAT_CSTR(str_response, "messageid = ", client_request->str_message_id, "\012"
																					   "responsenumber = ",
			str_temp, "\012", _str_response);
		SFREE(_str_response);
		WS_sendFrame(EV_A, client_request->parent, true, 0x01, str_response, strlen(str_response));
		DArray_push(client_request->arr_response, str_response);

		client_request->int_response_id += 1;
		memset(str_temp, 0, 101);
		snprintf(str_temp, 100, "%zd", client_request->int_response_id);
		SFINISH_CAT_CSTR(str_response, "messageid = ", client_request->str_message_id, "\012"
																					   "responsenumber = ",
			str_temp, "\012TRANSACTION COMPLETED");
		WS_sendFrame(EV_A, client_request->parent, true, 0x01, str_response, strlen(str_response));
		DArray_push(client_request->arr_response, str_response);

		str_response = NULL;

		ws_tab_free(client_tab);
		// client_request_free(client_request);
	}
}

// ***************************************************************************************
// ***************************************************************************************
// **************************************** MOVE
// *****************************************
// ***************************************************************************************
// ***************************************************************************************

void ws_tab_move_step2(EV_P, ev_check *w, int revents) {
	if (revents != 0) {
	} // get rid of unused parameter warning
	struct custom_check_callback *cb_data = (struct custom_check_callback *)w;
	struct sock_ev_client_request *client_request = cb_data->client_request;
	struct sock_ev_client_tab *client_tab = (struct sock_ev_client_tab *)(client_request->vod_request_data);
#ifdef _WIN32
	LPTSTR strErrorText = NULL;
#else
	struct stat *statdata = NULL;
	char *str_nanoseconds = NULL;
#endif

	char *str_response = NULL;
	ev_check_stop(EV_A, w);
	decrement_idle(EV_A);

	SFINISH_SALLOC(str_response, 101);
#ifdef _WIN32
	CloseHandle(client_tab->h_file);
	SetLastError(0);
	client_tab->h_file =
		CreateFileA(client_tab->str_path_to, GENERIC_READ, FILE_SHARE_READ, NULL, OPEN_EXISTING, FILE_ATTRIBUTE_NORMAL, NULL);
	if (client_tab->h_file == INVALID_HANDLE_VALUE) {
		int int_err = GetLastError();
		FormatMessageA(FORMAT_MESSAGE_FROM_SYSTEM | FORMAT_MESSAGE_ALLOCATE_BUFFER | FORMAT_MESSAGE_IGNORE_INSERTS, NULL, int_err,
			MAKELANGID(LANG_NEUTRAL, SUBLANG_DEFAULT), (LPSTR)&strErrorText, 0, NULL);

		if (strErrorText != NULL) {
			SFINISH("CreateFile failed: 0x%X (%s)", int_err, strErrorText);
		}
	}

	FILETIME ft_last_write_time;
	SFINISH_CHECK(GetFileTime(client_tab->h_file, NULL, NULL, &ft_last_write_time) != 0, "GetFileTime failed");

	SYSTEMTIME st_last_write_time;
	SFINISH_CHECK(FileTimeToSystemTime(&ft_last_write_time, &st_last_write_time) != 0, "FileTimeToSystemTime failed");

	SFINISH_CHECK(
		snprintf(str_response, 100, "%d-%d-%d %d:%d:%d.%d",
			st_last_write_time.wYear,
			st_last_write_time.wMonth,
			st_last_write_time.wDay,
			st_last_write_time.wHour,
			st_last_write_time.wMinute,
			st_last_write_time.wSecond,
			st_last_write_time.wMilliseconds
		) > 0,
		"snprintf() failed"
	);
	str_response[100] = 0;
#else
	SFINISH_SALLOC(statdata, sizeof(struct stat));
	if (stat(client_tab->str_path_to, statdata) == 0) {
		struct tm *tm_change_stamp = localtime(&(statdata->st_mtime));
		SFINISH_CHECK(tm_change_stamp != NULL, "localtime() failed");
		SFINISH_CHECK(strftime(str_response, 100, str_date_format, tm_change_stamp) != 0, "strftime() failed");
		str_response[100] = 0;
#ifdef st_mtime
		SFINISH_SALLOC(str_nanoseconds, 101);
#ifdef __APPLE__
		SFINISH_CHECK(snprintf(str_nanoseconds, 100, "%ld", statdata->st_mtimespec.tv_nsec) > 0, "snprintf() failed");
#else
		SFINISH_CHECK(snprintf(str_nanoseconds, 100, "%ld", statdata->st_mtim.tv_nsec) > 0, "snprintf() failed");
#endif
		str_nanoseconds[100] = 0;

		SFINISH_CAT_APPEND(str_response, ".", str_nanoseconds);
#endif
	} else {
		SFINISH("stat failed");
	}
#endif

	bol_error_state = false;
finish:
	SFREE(cb_data);
#ifdef _WIN32
	if (strErrorText != NULL) {
		LocalFree(strErrorText);
		strErrorText = NULL;
	}
#else
	SFREE(statdata);
	SFREE(str_nanoseconds);
#endif
	if (bol_error_state) {
		bol_error_state = false;
		client_request->int_response_id = (ssize_t)DArray_end(client_request->arr_response) + 1;
		char str_temp[101] = {0};
		snprintf(str_temp, 100, "%zd", client_request->int_response_id);
		if (errno != 0) {
			SFREE(str_response);
			SFINISH_CAT_CSTR(str_response, "messageid = ", client_request->str_message_id, "\012"
																						   "responsenumber = ",
				str_temp, "\012"
						  "FATAL\012",
				"Failed to stat file ", client_tab->str_path, " ", strerror(errno));
		} else {
			char *_str_response = str_response;
			SFINISH_CAT_CSTR(str_response, "messageid = ", client_request->str_message_id, "\012"
																						   "responsenumber = ",
				str_temp, "\012", _str_response);
			SFREE(_str_response);
		}

		WS_sendFrame(EV_A, client_request->parent, true, 0x01, str_response, strlen(str_response));
		DArray_push(client_request->arr_response, str_response);

		ws_tab_free(client_tab);
		// client_request_free(client_request);
		// client_request_free takes care of this
		// SFREE(client_tab);
	} else {
		client_request->int_response_id += 1;
		char str_temp[101] = {0};
		snprintf(str_temp, 100, "%zd", client_request->int_response_id);
		char *_str_response = str_response;
		SFINISH_CAT_CSTR(str_response, "messageid = ", client_request->str_message_id, "\012"
																					   "responsenumber = ",
			str_temp, "\012", _str_response);
		SFREE(_str_response);
		WS_sendFrame(EV_A, client_request->parent, true, 0x01, str_response, strlen(str_response));
		DArray_push(client_request->arr_response, str_response);

		client_request->int_response_id += 1;
		memset(str_temp, 0, 101);
		snprintf(str_temp, 100, "%zd", client_request->int_response_id);
		SFINISH_CAT_CSTR(str_response, "messageid = ", client_request->str_message_id, "\012"
																					   "responsenumber = ",
			str_temp, "\012TRANSACTION COMPLETED");
		WS_sendFrame(EV_A, client_request->parent, true, 0x01, str_response, strlen(str_response));
		DArray_push(client_request->arr_response, str_response);

		str_response = NULL;

		ws_tab_free(client_tab);
		// client_request_free(client_request);
	}
}

void ws_tab_free(struct sock_ev_client_tab *to_free) {
	SFREE(to_free->str_path);
	SFREE(to_free->str_path_to);
	SFREE(to_free->str_content);
	SFREE(to_free->str_change_stamp);
#ifdef _WIN32
	if (to_free->h_file != INVALID_HANDLE_VALUE) {
		CloseHandle(to_free->h_file);
		to_free->h_file = INVALID_HANDLE_VALUE;
	}
#else
	if (to_free->int_fd > -1) {
		close(to_free->int_fd);
		to_free->int_fd = -1;
	}
#endif
	if (to_free->arr_contents) {
		size_t int_i, int_len;
		for (int_i = 0, int_len = DArray_end(to_free->arr_contents); int_i < int_len; int_i += 1) {
			struct list_dirent_ent *ent = DArray_get(to_free->arr_contents, int_i);
			SFREE(ent->str_name);
			SFREE(ent);
		}
		DArray_destroy(to_free->arr_contents);
		to_free->arr_contents = NULL;
	};
}

#endif
