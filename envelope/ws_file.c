#define UTIL_DEBUG
#include "ws_file.h"

#ifdef ENVELOPE
static const char *str_date_format = "%Y-%m-%d %H:%M:%S";

struct custom_check_callback {
	ev_check check;
	struct sock_ev_client_request *client_request;
};

char *ws_file_step1(struct sock_ev_client_request *client_request) {
	SDEFINE_VAR_ALL(str_path_temp, str_path, str_connstring, str_local_path_root, str_temp_connstring, str_change_stamp,
		str_query, str_search_temp);
	struct sock_ev_client_file *client_file = (struct sock_ev_client_file *)(client_request->vod_request_data);
	char *str_response = NULL;
	char *str_temp = NULL;
	char *ptr_change_stamp = NULL;
	char *str_request_type = NULL;
	char *ptr_query = NULL;
	size_t int_response_len = 0;
	size_t int_query_len = 0;
	size_t int_input_path_len = 0;
	size_t int_input_path_to_len = 0;
	size_t int_change_stamp_len = 0;

	client_request->int_response_id = 0;
	client_request->arr_response = DArray_create(sizeof(char *), 1);

	client_file->str_input_path = NULL;
	client_file->str_partial_path = NULL;
	client_file->str_canonical_start = NULL;
	client_file->str_path = NULL;
	client_file->str_input_path_to = NULL;
	client_file->str_partial_path_to = NULL;
	client_file->str_canonical_start_to = NULL;
	client_file->str_path_to = NULL;
	client_file->str_content = NULL;
	client_file->arr_contents = NULL;
#ifdef _WIN32
	client_file->h_file = INVALID_HANDLE_VALUE;
#else
	client_file->int_fd = -1;
#endif

	SDEBUG("FILE API");

	// right after FILE\t
	SFINISH_CHECK(strlen(client_request->ptr_query) > 5, "Invalid Request");
	str_request_type = client_request->ptr_query + 5;
	// right after TYPE\t
	ptr_query = strstr(str_request_type, "\t");
	SFINISH_CHECK(ptr_query != NULL, "Invalid Request");
	ptr_query += 1;
	*(ptr_query - 1) = 0;

	if (strcmp(str_request_type, "LIST") == 0) {
		client_file->file_type = POSTAGE_FILE_LIST;

		client_file->str_input_path = ptr_query;
		/*
		ptr_query = strstr(client_file->str_input_path, "\012");
		if (ptr_query != NULL) {
			*ptr_query = 0;
		} else {
			ptr_query = client_file->str_input_path + strlen(client_file->str_input_path);
		}
		*/
		ptr_query = ptr_query + strcspn(client_file->str_input_path, "\012");
		if (*ptr_query == '\012') {
			*ptr_query = '\0';
		}

		str_temp = client_file->str_input_path;
		int_input_path_len = strlen(str_temp);
		client_file->str_input_path = bunescape_value(str_temp, &int_input_path_len);
		SFINISH_CHECK(client_file->str_input_path != NULL, "bunescape_value failed");

		SDEBUG("client_file->str_input_path: %s", client_file->str_input_path);
		if (strncmp(client_file->str_input_path, "/", 2) != 0 && strlen(client_file->str_input_path) > 1) {
			client_file->str_canonical_start = canonical_full_start(client_file->str_input_path);
			SFINISH_CHECK(client_file->str_canonical_start != NULL, "Invalid Path");
			client_file->str_partial_path = canonical_strip_start(client_file->str_input_path);
			SFINISH_CHECK(client_file->str_partial_path != NULL, "canonical_strip_start failed");

			client_file->str_path = canonical(client_file->str_canonical_start, client_file->str_partial_path, "read_dir");
			SFINISH_CHECK(client_file->str_path != NULL, "Failed to get canonical path: >%s|%s<",
				client_file->str_canonical_start, client_file->str_partial_path);

			SFINISH_CHECK(permissions_check(global_loop, client_request->parent->conn, client_file->str_input_path,
							  client_request, ws_file_list_step2),
				"permissions_check() failed");
		} else {
			SFINISH_SNCAT(
				str_response, &int_response_len,
				"/app/\tfolder\012/role/\tfolder\012/web_root/\tfolder\012", strlen("/app/\tfolder\012/role/\tfolder\012/web_root/\tfolder\012")
			);
			ws_file_free(client_file);
		}

	} else if (strcmp(str_request_type, "READ") == 0) {
		client_file->file_type = POSTAGE_FILE_READ;
		client_file->str_input_path = ptr_query;
		ptr_query = strstr(client_file->str_input_path, "\012");
		if (ptr_query != NULL) {
			*ptr_query = 0;
		} else {
			ptr_query = client_file->str_input_path + strlen(client_file->str_input_path);
		}

		str_temp = client_file->str_input_path;
		int_input_path_len = strlen(str_temp);
		client_file->str_input_path = bunescape_value(str_temp, &int_input_path_len);
		SFINISH_CHECK(client_file->str_input_path != NULL, "bunescape_value failed");

		client_file->str_canonical_start = canonical_full_start(client_file->str_input_path);
		SFINISH_CHECK(client_file->str_canonical_start != NULL, "Invalid Path");
		client_file->str_partial_path = canonical_strip_start(client_file->str_input_path);
		SFINISH_CHECK(client_file->str_partial_path != NULL, "canonical_strip_start failed");

		client_file->str_path = canonical(client_file->str_canonical_start, client_file->str_partial_path, "read_file");
		SFINISH_CHECK(client_file->str_path != NULL, "Failed to get canonical path: >%s|%s<", client_file->str_canonical_start,
			client_file->str_partial_path);

		SFINISH_CHECK(permissions_check(global_loop, client_request->parent->conn, client_file->str_input_path, client_request,
						  ws_file_read_step2),
			"permissions_check() failed");

	} else if (strcmp(str_request_type, "WRITE") == 0) {
		client_file->file_type = POSTAGE_FILE_WRITE;
		SNOTICE("FILE WRITE");
		client_file->ptr_content = strstr(ptr_query, "\012") + 1;
		SFINISH_SNCAT(
			str_query, &int_query_len,
			ptr_query, (size_t)(client_request->frame->int_length - (size_t)(ptr_query - client_request->frame->str_message))
		);
		ptr_query = strstr(str_query, "\t");
		SFINISH_CHECK(ptr_query != NULL, "Invalid Request");
		*ptr_query = 0;
		ptr_change_stamp = ptr_query + 1;
		ptr_query = strstr(ptr_change_stamp, "\012");
		if (ptr_query != NULL) {
			*ptr_query = 0;
		}

		int_input_path_len = strlen(str_query);
		client_file->str_input_path = bunescape_value(str_query, &int_input_path_len);
		SFINISH_CHECK(client_file->str_input_path != NULL, "bunescape_value failed");

		int_change_stamp_len = strlen(ptr_change_stamp);
		client_file->str_change_stamp = bunescape_value(ptr_change_stamp, &int_change_stamp_len);
		SFINISH_CHECK(client_file->str_change_stamp != NULL, "bunescape_value failed");

		client_file->str_canonical_start = canonical_full_start(client_file->str_input_path);
		SFINISH_CHECK(client_file->str_canonical_start != NULL, "Invalid Path");
		client_file->str_partial_path = canonical_strip_start(client_file->str_input_path);
		SFINISH_CHECK(client_file->str_partial_path != NULL, "canonical_strip_start failed");

		client_file->str_path = canonical(client_file->str_canonical_start, client_file->str_partial_path, "write_file");
		SFINISH_CHECK(client_file->str_path != NULL, "Failed to get canonical path: >%s|%s<", client_file->str_canonical_start,
			client_file->str_partial_path);

		SFINISH_CHECK(permissions_check(global_loop, client_request->parent->conn, client_file->str_input_path, client_request, ws_file_write_step2),
			"permissions_check() failed");

	} else if (strcmp(str_request_type, "MOVE") == 0 || strcmp(str_request_type, "COPY") == 0) {
		client_file->file_type = strcmp(str_request_type, "MOVE") == 0 ? POSTAGE_FILE_MOVE : POSTAGE_FILE_COPY;
		SNOTICE("FILE %s", client_file->file_type == POSTAGE_FILE_MOVE ? "MOVE" : "COPY");
		str_temp = ptr_query;
		ptr_query = strstr(str_temp, "\t");
		SFINISH_CHECK(ptr_query != NULL, "Invalid Request");
		if (ptr_query != NULL) {
			*ptr_query = 0;
		} else {
			ptr_query = client_file->str_input_path + strlen(client_file->str_input_path);
		}

		int_input_path_len = strlen(str_temp);
		client_file->str_input_path = bunescape_value(str_temp, &int_input_path_len);
		SFINISH_CHECK(client_file->str_input_path != NULL, "bunescape_value failed");

		str_temp = ptr_query + 1;
		ptr_query = strstr(str_temp, "\012");
		if (ptr_query != NULL) {
			*ptr_query = 0;
		} else {
			ptr_query = client_file->str_input_path + strlen(client_file->str_input_path);
		}

		int_input_path_to_len = strlen(str_temp);
		client_file->str_input_path_to = bunescape_value(str_temp, &int_input_path_to_len);
		SFINISH_CHECK(client_file->str_input_path_to != NULL, "bunescape_value failed");

		client_file->str_canonical_start = canonical_full_start(client_file->str_input_path);
		SFINISH_CHECK(client_file->str_canonical_start != NULL, "Invalid Path");
		client_file->str_partial_path = canonical_strip_start(client_file->str_input_path);
		SFINISH_CHECK(client_file->str_partial_path != NULL, "canonical_strip_start failed");

		client_file->str_canonical_start_to = canonical_full_start(client_file->str_input_path_to);
		SFINISH_CHECK(client_file->str_canonical_start_to != NULL, "Invalid Path");
		client_file->str_partial_path_to = canonical_strip_start(client_file->str_input_path_to);
		SFINISH_CHECK(client_file->str_partial_path_to != NULL, "canonical_strip_start failed");

		client_file->str_path = canonical(client_file->str_canonical_start, client_file->str_partial_path, "read_file");
		if (client_file->str_path == NULL) {
			client_file->str_path = canonical(client_file->str_canonical_start, client_file->str_partial_path, "read_dir");
			SFINISH_CHECK(client_file->str_path != NULL, "Failed to get canonical path: >%s|%s<",
				client_file->str_canonical_start, client_file->str_partial_path);
		}

		client_file->str_path_to = canonical(client_file->str_canonical_start_to, client_file->str_partial_path_to, "valid_path");
		SFINISH_CHECK(client_file->str_path_to != NULL, "Failed to get canonical path: >%s|%s<",
			client_file->str_canonical_start_to, client_file->str_partial_path_to);

		if (client_file->file_type == POSTAGE_FILE_MOVE) {
			SDEBUG("client_file->str_path: %s", client_file->str_path);
			SFINISH_CHECK(permissions_check(global_loop, client_request->parent->conn, client_file->str_input_path,
							  client_request, ws_file_move_step2),
				"permissions_check() failed");
		} else {
			SDEBUG("client_file->str_path: %s", client_file->str_path);
			SFINISH_CHECK(permissions_write_check(global_loop, client_request->parent->conn, client_file->str_input_path,
							  client_request, ws_file_move_step2),
				"permissions_write_check() failed");
		}

	} else if (strcmp(str_request_type, "DELETE") == 0) {
		client_file->file_type = POSTAGE_FILE_DELETE;
		SNOTICE("FILE DELETE");
		SDEBUG("ptr_query: %s", ptr_query);
		str_temp = ptr_query;
		ptr_query = strstr(str_temp, "\012");
		if (ptr_query != NULL) {
			*ptr_query = 0;
		}

		int_input_path_len = strlen(str_temp);
		client_file->str_input_path = bunescape_value(str_temp, &int_input_path_len);
		SFINISH_CHECK(client_file->str_input_path != NULL, "bunescape_value failed");

		client_file->str_canonical_start = canonical_full_start(client_file->str_input_path);
		SFINISH_CHECK(client_file->str_canonical_start != NULL, "Invalid Path");
		client_file->str_partial_path = canonical_strip_start(client_file->str_input_path);
		SFINISH_CHECK(client_file->str_partial_path != NULL, "canonical_strip_start failed");

		client_file->str_path = canonical(client_file->str_canonical_start, client_file->str_partial_path, "valid_path");
		SFINISH_CHECK(client_file->str_path != NULL, "Failed to get canonical path: >%s|%s<", client_file->str_canonical_start,
			client_file->str_partial_path);

		SFINISH_CHECK(permissions_write_check(global_loop, client_request->parent->conn, client_file->str_input_path,
						  client_request, ws_file_delete_step2),
			"permissions_write_check() failed");

	} else if (strcmp(str_request_type, "CREATE_FOLDER") == 0 || strcmp(str_request_type, "CREATE_FILE") == 0) {
		client_file->file_type =
			strcmp(str_request_type, "CREATE_FOLDER") == 0 ? POSTAGE_FILE_CREATE_FOLDER : POSTAGE_FILE_CREATE_FILE;
		SNOTICE("FILE %s", client_file->file_type == POSTAGE_FILE_CREATE_FOLDER ? "CREATE_FOLDER" : "CREATE_FILE");
		SDEBUG("ptr_query: %s", ptr_query);
		str_temp = ptr_query;
		ptr_query = strstr(str_temp, "\012");
		if (ptr_query != NULL) {
			*ptr_query = 0;
		}

		int_input_path_len = strlen(str_temp);
		client_file->str_input_path = bunescape_value(str_temp, &int_input_path_len);
		SFINISH_CHECK(client_file->str_input_path != NULL, "bunescape_value failed");

		client_file->str_canonical_start = canonical_full_start(client_file->str_input_path);
		SFINISH_CHECK(client_file->str_canonical_start != NULL, "Invalid Path");
		client_file->str_partial_path = canonical_strip_start(client_file->str_input_path);
		SFINISH_CHECK(client_file->str_partial_path != NULL, "canonical_strip_start failed");

		client_file->str_path = canonical(client_file->str_canonical_start, client_file->str_partial_path, "valid_path");
		SFINISH_CHECK(client_file->str_path != NULL, "Failed to get canonical path: >%s|%s<", client_file->str_canonical_start,
			client_file->str_partial_path);

		SDEBUG("client_file->str_path: %s", client_file->str_path);
		if (client_file->file_type == POSTAGE_FILE_CREATE_FOLDER) {
			SFINISH_CHECK(permissions_write_check(global_loop, client_request->parent->conn, client_file->str_input_path,
							  client_request, ws_file_create_step2),
				"permissions_write_check() failed");
		} else {
			client_file->ptr_content = "";
			SFINISH_CHECK(permissions_write_check(global_loop, client_request->parent->conn, client_file->str_input_path,
							  client_request, ws_file_write_step2),
				"permissions_write_check() failed");
		}

	} else if (strcmp(str_request_type, "SEARCH") == 0) {
		client_file->file_type = POSTAGE_FILE_SEARCH;
		SNOTICE("FILE SEARCH");
		SDEBUG("ptr_query: %s", ptr_query);
		str_temp = ptr_query;
		ptr_query = strstr(str_temp, "\t");
		SFINISH_CHECK(ptr_query != NULL, "Invalid Request");
		ptr_query += 1;
		*(ptr_query - 1) = 0;

		int_input_path_len = strlen(str_temp);
		client_file->str_input_path = bunescape_value(str_temp, &int_input_path_len);
		SFINISH_CHECK(client_file->str_input_path != NULL, "bunescape_value failed");

		client_file->str_canonical_start = canonical_full_start(client_file->str_input_path);
		SFINISH_CHECK(client_file->str_canonical_start != NULL, "Invalid Path");
		client_file->str_partial_path = canonical_strip_start(client_file->str_input_path);
		SFINISH_CHECK(client_file->str_partial_path != NULL, "canonical_strip_start failed");

		client_file->str_path = canonical(client_file->str_canonical_start, client_file->str_partial_path, "read_dir");
		SFINISH_CHECK(client_file->str_path != NULL, "Failed to get canonical path: >%s|%s<", client_file->str_canonical_start,
			client_file->str_partial_path);

		SDEBUG("ptr_query: %s", ptr_query);
		str_temp = ptr_query;
		ptr_query = ptr_query + strcspn(str_temp, "\012");
		if (*ptr_query == '\012') {
			*ptr_query = 0;
			ptr_query += 1;
		}

		int_input_path_to_len = strlen(str_temp);
		str_search_temp = bunescape_value(str_temp, &int_input_path_to_len);
		SFINISH_CHECK(str_search_temp != NULL, "bunescape_value failed");

		SFINISH_SNCAT(
			client_file->str_search, &client_file->int_search_len,
			str_search_temp, strlen(str_search_temp)
		);

		SDEBUG("ptr_query: %s", ptr_query);
		SDEBUG("client_file->str_path: %s", client_file->str_path);
		SDEBUG("client_file->str_search: %s", client_file->str_search);

		while (*ptr_query != '\012' && *ptr_query != '\0') {
			if (*ptr_query == '\t') {
				ptr_query += 1;
			} else if (strncmp(ptr_query, "RECURSIVE", 9) == 0) {
				client_file->bol_recursive = true;
				ptr_query += 9;
			} else if (strncmp(ptr_query, "INSENSITIVE", 11) == 0) {
				client_file->bol_case_insensitive = true;
				ptr_query += 11;
			} else if (strncmp(ptr_query, "REGEX", 5) == 0) {
				client_file->bol_regex = true;
				ptr_query += 5;
			} else {
				char *ptr_temp = ptr_query + strcspn(ptr_query, "\t\012");
				if (ptr_temp > ptr_query) {
					*ptr_temp = 0;
				}
				SFINISH("Invalid search parameter \"%s\"", ptr_query);
			}
		}

		SFINISH_CHECK(permissions_write_check(global_loop, client_request->parent->conn, client_file->str_input_path,
						  client_request, ws_file_search_step2),
			"permissions_write_check() failed");

	} else {
		SFINISH("Unknown FILE request type %s", str_request_type);
	}

	bol_error_state = false;
finish:
	SFREE_ALL();

	SDEBUG("bol_error_state == %s", bol_error_state == true ? "true" : "false");
	if (bol_error_state == true) {
		ws_file_free(client_file);
		// client_request_free(client_request);
		// client_request_free takes care of this
		// SFREE(client_file);
		bol_error_state = false;
	}

	if (str_response != NULL) {
		char *_str_response = str_response;
		client_request->int_response_id += 1;
		char str_temp1[101] = {0};
		snprintf(str_temp1, 100, "%zd", client_request->int_response_id);
		SFINISH_SNCAT(
			str_response, &int_response_len,
			"messageid = ", (size_t)12,
			client_request->str_message_id, strlen(client_request->str_message_id),
			"\012responsenumber = ", (size_t)18,
			str_temp1, strlen(str_temp1),
			"\012", (size_t)1,
			_str_response, strlen(_str_response)
		);
		WS_sendFrame(global_loop, client_request->parent, true, 0x01, str_response, int_response_len);
		DArray_push(client_request->arr_response, str_response);
		SFREE(_str_response);

		client_request->int_response_id += 1;
		memset(str_temp1, 0, 101);
		snprintf(str_temp1, 100, "%zd", client_request->int_response_id);
		SFINISH_SNCAT(
			str_response, &int_response_len,
			"messageid = ", (size_t)12,
			client_request->str_message_id, strlen(client_request->str_message_id),
			"\012responsenumber = ", (size_t)18,
			str_temp1, strlen(str_temp1),
			"\012TRANSACTION COMPLETED", (size_t)22
		);
		WS_sendFrame(global_loop, client_request->parent, true, 0x01, str_response, int_response_len);
		DArray_push(client_request->arr_response, str_response);
	}
	return str_response;
}

// **************************************************************************************
// **************************************************************************************
// **************************************** LIST ****************************************
// **************************************************************************************
// **************************************************************************************

struct list_dirent_ent {
	char *str_name;
	time_t int_change_stamp;
	char *str_type;
};

int ws_file_list_sort(const void *arg1, const void *arg2) {
	struct list_dirent_ent *ent1 = *((struct list_dirent_ent **)arg1);
	struct list_dirent_ent *ent2 = *((struct list_dirent_ent **)arg2);
	return ent2->int_change_stamp < ent1->int_change_stamp ? -1 : 1;
}

bool ws_file_list_step2(EV_P, void *cb_data, bool bol_group) {
	struct sock_ev_client_request *client_request = cb_data;
	char *str_response = NULL;
	SDEFINE_VAR_ALL(str_temp_path, str_temp1, str_name, str_canonical_name);

	struct sock_ev_client_file *client_file = (struct sock_ev_client_file *)(client_request->vod_request_data);
	client_file->arr_contents = DArray_create(sizeof(struct list_dirent_ent), 100);
	struct list_dirent_ent *ent = NULL;
	struct stat *statdata = NULL;
	char str_temp[101] = {0};
	DIR *dirp = NULL;
	struct dirent *dp = NULL;
	size_t int_i = 0, int_len = 0;
	size_t int_name_len = 0;
	size_t int_response_len = 0;

	SFINISH_CHECK(bol_group, "You don't have the necessary permissions for this folder.");

	dirp = opendir(client_file->str_path);
	SFINISH_ERROR_CHECK(dirp != NULL, "opendir failed");

	while (dirp) {
		errno = 0;
		if ((dp = readdir(dirp)) != NULL) {
			// dp->d_name
			SFINISH_SNCAT(str_name, &int_name_len, dp->d_name, strlen(dp->d_name));
			if (strncmp(str_name, "..", 3) != 0 && strncmp(str_name, ".", 2) != 0) {
				str_canonical_name = canonical(client_file->str_path, str_name, "valid_path");
				SFINISH_CHECK(str_canonical_name != NULL, "canonical failed");
				SFINISH_SALLOC(statdata, sizeof(struct stat));
				stat(str_canonical_name, statdata);

#ifndef _WIN32
				SFINISH_CHECK(S_ISREG(statdata->st_mode) != 0 || S_ISDIR(statdata->st_mode) != 0,
					"Only regular files and folders allowed.");
#endif
				// TODO: add check watcher

				SFINISH_SALLOC(ent, sizeof(struct list_dirent_ent));
				ent->str_name = str_name;
				ent->int_change_stamp = statdata->st_mtime;
#ifdef _WIN32
				ent->str_type = PathIsDirectoryA(str_canonical_name) == false ? "file" : "folder";
#else
				ent->str_type = S_ISREG(statdata->st_mode) != 0 ? "file" : S_ISDIR(statdata->st_mode) != 0 ? "folder" : "unknown";
#endif
				SDEBUG("Adding >%s|%s<", str_name, ent->str_type);
				DArray_push(client_file->arr_contents, ent);
				SFREE(str_canonical_name);
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

	DArray_qsort(client_file->arr_contents, (DArray_compare)ws_file_list_sort);

	client_request->int_response_id += 1;
	snprintf(str_temp, 100, "%zd", client_request->int_response_id);
	SFINISH_SNCAT(
		str_response, &int_response_len,
		"messageid = ", (size_t)12,
		client_request->str_message_id, strlen(client_request->str_message_id),
		"\012responsenumber = ", (size_t)18,
		str_temp, strlen(str_temp),
		"\012", (size_t)1
	);
	int_len = DArray_end(client_file->arr_contents);
	for (int_i = 0; int_i < int_len; int_i += 1) {
		ent = DArray_get(client_file->arr_contents, int_i);
		SDEBUG("%p->arr_contents[%d]->str_name        : %s", client_file, int_i, ent->str_name);
		SDEBUG("%p->arr_contents[%d]->int_change_stamp: %d", client_file, int_i, ent->int_change_stamp);
		SDEBUG("%p->arr_contents[%d]->str_type        : %s", client_file, int_i, ent->str_type);
		SFINISH_SNFCAT(
			str_response, &int_response_len,
			ent->str_name, strlen(ent->str_name),
			"\t", (size_t)1,
			ent->str_type, strlen(ent->str_type),
			"\012", (size_t)1
		);
		ent = NULL;
	}
	WS_sendFrame(EV_A, client_request->parent, true, 0x01, str_response, int_response_len);
	DArray_push(client_request->arr_response, str_response);

	client_request->int_response_id += 1;
	memset(str_temp, 0, 101);
	snprintf(str_temp, 100, "%zd", client_request->int_response_id);
	SFINISH_SNCAT(
		str_response, &int_response_len,
		"messageid = ", (size_t)12,
		client_request->str_message_id, strlen(client_request->str_message_id),
		"\012responsenumber = ", (size_t)18,
		str_temp, strlen(str_temp),
		"\012TRANSACTION COMPLETED", (size_t)22
	);
	WS_sendFrame(EV_A, client_request->parent, true, 0x01, str_response, int_response_len);
	DArray_push(client_request->arr_response, str_response);

	str_response = NULL;

	bol_error_state = false;
finish:
	SFREE(ent);
	SFREE_ALL();
	// client_request_free(client_request);
	// client_request_free takes care of this
	// SFREE(client_file);
	if (bol_error_state == true) {
		bol_error_state = false;

		client_request->int_response_id = (ssize_t)DArray_end(client_request->arr_response) + 1;
		memset(str_temp, 0, 101);
		snprintf(str_temp, 100, "%zd", client_request->int_response_id);
		char *_str_response = NULL;
		SFINISH_SNCAT(
			str_response, &int_response_len,
			"messageid = ", (size_t)12,
			client_request->str_message_id, strlen(client_request->str_message_id),
			"\012responsenumber = ", (size_t)18,
			str_temp, strlen(str_temp),
			"\012FATAL\012", (size_t)7,
			"Failed to list directory ", (size_t)25,
			client_file->str_path, strlen(client_file->str_path),
			": ", (size_t)2,
			strerror(errno), strlen(strerror(errno))
		);
		WS_sendFrame(EV_A, client_request->parent, true, 0x01, _str_response, int_response_len);
		DArray_push(client_request->arr_response, _str_response);

		if (client_file->arr_contents != NULL) {
			DArray_clear_destroy(client_file->arr_contents);
			client_file->arr_contents = NULL;
		}
	}
	SFREE(str_response);
	ws_file_free(client_file);
	return true;
}

// **************************************************************************************
// **************************************************************************************
// **************************************** READ ****************************************
// **************************************************************************************
// **************************************************************************************

bool ws_file_read_step2(EV_P, void *cb_data, bool bol_group) {
	struct sock_ev_client_request *client_request = cb_data;
	char *str_response = NULL;
	struct sock_ev_client_file *client_file = (struct sock_ev_client_file *)(client_request->vod_request_data);
#ifdef _WIN32
	LPSTR strErrorText = NULL;
#else
	struct stat *statdata = NULL;
	char *str_nanoseconds = NULL;
#endif
	size_t int_response_len = 0;

	SFINISH_CHECK(bol_group, "You don't have the necessary permissions for this folder.");

#ifdef _WIN32
	SetLastError(0);
	client_file->h_file =
		CreateFileA(client_file->str_path, GENERIC_READ, FILE_SHARE_READ, NULL, OPEN_EXISTING, FILE_ATTRIBUTE_NORMAL, NULL);
	if (client_file->h_file == INVALID_HANDLE_VALUE) {
		int int_err = GetLastError();
		FormatMessageA(FORMAT_MESSAGE_FROM_SYSTEM | FORMAT_MESSAGE_ALLOCATE_BUFFER | FORMAT_MESSAGE_IGNORE_INSERTS, NULL, int_err,
			MAKELANGID(LANG_NEUTRAL, SUBLANG_DEFAULT), (LPSTR)&strErrorText, 0, NULL);

		if (strErrorText != NULL) {
			SFINISH("CreateFile failed: 0x%X (%s)", int_err, strErrorText);
		}
	}

	FILETIME ft_last_write_time;
	SFINISH_CHECK(GetFileTime(client_file->h_file, NULL, NULL, &ft_last_write_time) != 0, "GetFileTime failed");
	SYSTEMTIME st_last_write_time;
	SFINISH_CHECK(FileTimeToSystemTime(&ft_last_write_time, &st_last_write_time) != 0, "FileTimeToSystemTime failed");

	SFINISH_SALLOC(client_file->str_change_stamp, 101);
	SFINISH_CHECK(
		snprintf(client_file->str_change_stamp, 100, "%d-%d-%d %d:%d:%d.%d",
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
	client_file->str_change_stamp[100] = 0;
#else
	client_file->int_fd = open(client_file->str_path, O_RDONLY | O_NONBLOCK);
	SFINISH_CHECK(client_file->int_fd != -1, "open failed!");
#endif

#ifdef _WIN32
	client_file->int_length = GetFileSize(client_file->h_file, NULL);
#else
	client_file->int_length = lseek(client_file->int_fd, 0, SEEK_END);
	SFINISH_CHECK(client_file->int_length != -1, "lseek(0, SEEK_END) failed");
	SFINISH_CHECK(lseek(client_file->int_fd, 0, SEEK_SET) != -1, "lseek(0, SEEK_SET) failed");

	SFINISH_SALLOC(statdata, sizeof(struct stat));
	stat(client_file->str_path, statdata);

	SFINISH_SALLOC(client_file->str_change_stamp, 101);
	struct tm *tm_change_stamp = localtime(&(statdata->st_mtime));
	SFINISH_CHECK(tm_change_stamp != NULL, "localtime() failed");
	SFINISH_CHECK(strftime(client_file->str_change_stamp, 100, str_date_format, tm_change_stamp) != 0, "strftime() failed");
	client_file->str_change_stamp[100] = 0;
#ifdef st_mtime
	SFINISH_SALLOC(str_nanoseconds, 101);
#ifdef __APPLE__
	SFINISH_CHECK(snprintf(str_nanoseconds, 100, "%ld", statdata->st_mtimespec.tv_nsec) > 0, "snprintf() failed");
#else
	SFINISH_CHECK(snprintf(str_nanoseconds, 100, "%ld", statdata->st_mtim.tv_nsec) > 0, "snprintf() failed");
#endif
	str_nanoseconds[100] = 0;

	size_t int_temp = strlen(client_file->str_change_stamp);
	SFINISH_SNFCAT(
		client_file->str_change_stamp, &int_temp,
		".", (size_t)1,
		str_nanoseconds, strlen(str_nanoseconds)
	);
#endif
#endif

	SFINISH_SALLOC(client_file->str_content, (size_t)client_file->int_length + 1);
	client_file->str_content[client_file->int_length] = 0;

	client_file->int_read = 0;
	ev_check_init(&client_request->check, ws_file_read_step3);
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
			SFINISH_SNCAT(
				str_response, &int_response_len,
				"messageid = ", (size_t)12,
				client_request->str_message_id, strlen(client_request->str_message_id),
				"\012responsenumber = ", (size_t)18,
				str_temp, strlen(str_temp),
				"\012FATAL\012", (size_t)7,
				"Failed to open file ", (size_t)16,
				client_file->str_path, strlen(client_file->str_path),
				": ", (size_t)2,
				strerror(errno), strlen(strerror(errno))
			);
		} else {
			char *_str_response = str_response;
			SFINISH_SNCAT(
				str_response, &int_response_len,
				"messageid = ", (size_t)12,
				client_request->str_message_id, strlen(client_request->str_message_id),
				"\012responsenumber = ", (size_t)18,
				str_temp, strlen(str_temp),
				"\012", (size_t)1,
				_str_response, strlen(_str_response)
			);
			SFREE(_str_response);
		}

		WS_sendFrame(EV_A, client_request->parent, true, 0x01, str_response, int_response_len);
		DArray_push(client_request->arr_response, str_response);

		ws_file_free(client_file);
		// client_request_free(client_request);
		// client_request_free takes care of this
		// SFREE(client_file);
	}
	return true;
}

void ws_file_read_step3(EV_P, ev_check *w, int revents) {
	if (revents != 0) {
	} // get rid of unused parameter warning
	char *str_response = NULL;
	struct sock_ev_client_request *client_request = (struct sock_ev_client_request *)w;
	struct sock_ev_client_file *client_file = (struct sock_ev_client_file *)(client_request->vod_request_data);
#ifdef _WIN32
	LPSTR strErrorText = NULL;
#endif
	size_t int_response_len = 0;

#ifdef _WIN32
	DWORD int_temp = 0;
	BOOL bol_result = ReadFile(client_file->h_file, client_file->str_content + client_file->int_read,
		(DWORD)(client_file->int_length - client_file->int_read), &int_temp, NULL);
	if (bol_result == FALSE) {
		int int_err = GetLastError();
		FormatMessageA(FORMAT_MESSAGE_FROM_SYSTEM | FORMAT_MESSAGE_ALLOCATE_BUFFER | FORMAT_MESSAGE_IGNORE_INSERTS, NULL, int_err,
			MAKELANGID(LANG_NEUTRAL, SUBLANG_DEFAULT), (LPSTR)&strErrorText, 0, NULL);

		if (strErrorText != NULL) {
			SFINISH("ReadFile failed: 0x%X (%s)", int_err, strErrorText);
		}
	}
#else
	ssize_t int_temp = read(client_file->int_fd, client_file->str_content + client_file->int_read,
		(size_t)(client_file->int_length - client_file->int_read));
	SFINISH_ERROR_CHECK(int_temp >= 0, "read failed");
#endif
	client_file->int_read += int_temp;

	if (int_temp <= 0 || client_file->int_read == client_file->int_length) {
		ev_check_stop(EV_A, &client_request->check);
		decrement_idle(EV_A);
		ws_file_read_step4(EV_A, client_request);
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
			SFINISH_SNCAT(
				str_response, &int_response_len,
				"messageid = ", (size_t)12,
				client_request->str_message_id, strlen(client_request->str_message_id),
				"\012responsenumber = ", (size_t)18,
				str_temp, strlen(str_temp),
				"\012FATAL\012", (size_t)7,
				"Failed to read file ", (size_t)16,
				client_file->str_path, strlen(client_file->str_path),
				": ", (size_t)2,
				strerror(errno), strlen(strerror(errno))
			);
		} else {
			char *_str_response = str_response;
			SFINISH_SNCAT(
				str_response, &int_response_len,
				"messageid = ", (size_t)12,
				client_request->str_message_id, strlen(client_request->str_message_id),
				"\012responsenumber = ", (size_t)18,
				str_temp, strlen(str_temp),
				"\012", (size_t)1,
				_str_response, strlen(_str_response)
			);
			SFREE(_str_response);
		}

		WS_sendFrame(EV_A, client_request->parent, true, 0x01, str_response, int_response_len);
		DArray_push(client_request->arr_response, str_response);

		ws_file_free(client_file);
		// client_request_free(client_request);
		// client_request_free takes care of this
		// SFREE(client_file);
	}
}

void ws_file_read_step4(EV_P, struct sock_ev_client_request *client_request) {
	char *str_response = NULL;
	struct sock_ev_client_file *client_file = (struct sock_ev_client_file *)(client_request->vod_request_data);
	size_t int_response_len = 0;

	client_request->int_response_id += 1;
	char str_temp[101] = {0};
	snprintf(str_temp, 100, "%zd", client_request->int_response_id);
	SFINISH_SNCAT(
		str_response, &int_response_len,
		"messageid = ", (size_t)12,
		client_request->str_message_id, strlen(client_request->str_message_id),
		"\012responsenumber = ", (size_t)18,
		str_temp, strlen(str_temp),
		"\012", (size_t)1,
		client_file->str_change_stamp, strlen(client_file->str_change_stamp),
		"\012", (size_t)1,
		client_file->str_content, client_file->int_length
	);
	WS_sendFrame(EV_A, client_request->parent, true, 0x01, str_response, int_response_len);
	DArray_push(client_request->arr_response, str_response);

	client_request->int_response_id += 1;
	memset(str_temp, 0, 101);
	snprintf(str_temp, 100, "%zd", client_request->int_response_id);
	SFINISH_SNCAT(
		str_response, &int_response_len,
		"messageid = ", (size_t)12,
		client_request->str_message_id, strlen(client_request->str_message_id),
		"\012responsenumber = ", (size_t)18,
		str_temp, strlen(str_temp),
		"\012TRANSACTION COMPLETED", (size_t)22
	);
	WS_sendFrame(EV_A, client_request->parent, true, 0x01, str_response, int_response_len);
	DArray_push(client_request->arr_response, str_response);

	str_response = NULL;

#ifdef _WIN32
	CloseHandle(client_file->h_file);
	client_file->h_file = INVALID_HANDLE_VALUE;
#else
	close(client_file->int_fd);
	client_file->int_fd = -1;
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
			SFINISH_SNCAT(
				str_response, &int_response_len,
				"messageid = ", (size_t)12,
				client_request->str_message_id, strlen(client_request->str_message_id),
				"\012responsenumber = ", (size_t)18,
				str_temp, strlen(str_temp),
				"\012FATAL\012", (size_t)7,
				"Failed to read file ", (size_t)16,
				client_file->str_path, strlen(client_file->str_path),
				": ", (size_t)2,
				strerror(errno), strlen(strerror(errno))
			);
		} else {
			char *_str_response = str_response;
			SFINISH_SNCAT(
				str_response, &int_response_len,
				"messageid = ", (size_t)12,
				client_request->str_message_id, strlen(client_request->str_message_id),
				"\012responsenumber = ", (size_t)18,
				str_temp, strlen(str_temp),
				"\012", (size_t)1,
				_str_response, strlen(_str_response)
			);
			SFREE(_str_response);
		}

		WS_sendFrame(EV_A, client_request->parent, true, 0x01, str_response, int_response_len);
		DArray_push(client_request->arr_response, str_response);

		ws_file_free(client_file);
		// client_request_free(client_request);
		// client_request_free takes care of this
		// SFREE(client_file);
	} else {
		ws_file_free(client_file);
		// client_request_free(client_request);
	}
}

// ***************************************************************************************
// ***************************************************************************************
// **************************************** WRITE ****************************************
// ***************************************************************************************
// ***************************************************************************************

bool ws_file_write_step2(EV_P, void *cb_data, bool bol_group) {
	struct sock_ev_client_request *client_request = cb_data;
	char *str_response = NULL;
	struct sock_ev_client_file *client_file = (struct sock_ev_client_file *)(client_request->vod_request_data);
	char *str_change_stamp = NULL;
#ifdef _WIN32
	LPSTR strErrorText = NULL;
#else
	struct stat *statdata = NULL;
	char *str_nanoseconds = NULL;
#endif
	size_t int_response_len = 0;

	SFINISH_CHECK(bol_group, "You don't have the necessary permissions for this folder.");

#ifdef _WIN32
	if (client_file->file_type == POSTAGE_FILE_WRITE) {
		SetLastError(0);
		client_file->h_file =
			CreateFileA(client_file->str_path, GENERIC_READ, FILE_SHARE_READ, NULL, OPEN_EXISTING, FILE_ATTRIBUTE_NORMAL, NULL);
		if (client_file->h_file == INVALID_HANDLE_VALUE) {
			int int_err = GetLastError();
			if (int_err != 2) {
				FormatMessageA(FORMAT_MESSAGE_FROM_SYSTEM | FORMAT_MESSAGE_ALLOCATE_BUFFER | FORMAT_MESSAGE_IGNORE_INSERTS, NULL, int_err,
					MAKELANGID(LANG_NEUTRAL, SUBLANG_DEFAULT), (LPSTR)&strErrorText, 0, NULL);

				if (strErrorText != NULL) {
					SFINISH("CreateFile failed: 0x%X (%s)", int_err, strErrorText);
				}
			}
		}
		if (client_file->h_file != INVALID_HANDLE_VALUE && client_file->str_change_stamp != NULL && strncmp(client_file->str_change_stamp, "0", 2) != 0) {
			FILETIME ft_last_write_time;
			SFINISH_CHECK(GetFileTime(client_file->h_file, NULL, NULL, &ft_last_write_time) != 0, "GetFileTime failed");

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

			SDEBUG("client_file->str_change_stamp: %s", client_file->str_change_stamp);
			SDEBUG("str_change_stamp             : %s", str_change_stamp);
			if (strncmp(client_file->str_change_stamp, str_change_stamp, strlen(str_change_stamp)) != 0) {
				SFINISH("Someone updated this file before you.");
			}
		}
		if (client_file->h_file != INVALID_HANDLE_VALUE) {
			CloseHandle(client_file->h_file);
		}
	}
#else
	SFINISH_SALLOC(statdata, sizeof(struct stat));
	int int_status = stat(client_file->str_path, statdata);
	if (client_file->file_type == POSTAGE_FILE_WRITE) {
		if (int_status == 0 && client_file->str_change_stamp != NULL && strncmp(client_file->str_change_stamp, "0", 2) != 0) {
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

			size_t int_temp = strlen(client_file->str_change_stamp);
			SFINISH_SNFCAT(
				client_file->str_change_stamp, &int_temp,
				".", (size_t)1,
				str_nanoseconds, strlen(str_nanoseconds)
			);
#endif

			if (strncmp(client_file->str_change_stamp, str_change_stamp, strlen(str_change_stamp)) != 0) {
				SFINISH("Someone updated this file before you.");
			}
		}
	} else if (client_file->file_type == POSTAGE_FILE_CREATE_FILE) {
		SFINISH_CHECK(int_status != 0, "File already exists.");
	}
#endif

#ifdef _WIN32
	SetLastError(0);
	client_file->h_file = CreateFileA(client_file->str_path, GENERIC_WRITE, 0, NULL, CREATE_NEW, FILE_ATTRIBUTE_NORMAL, NULL);
	if (client_file->h_file == INVALID_HANDLE_VALUE) {
		int int_err = GetLastError();
		if (int_err == 0x50 && client_file->file_type == POSTAGE_FILE_WRITE) {
			// CreateFileA return "File exists" if you give it CREATE_NEW and it finds
			// the file already there
			// In this case, we need to truncate the existing file
			SetLastError(0);
			client_file->h_file =
				CreateFileA(client_file->str_path, GENERIC_WRITE, 0, NULL, TRUNCATE_EXISTING, FILE_ATTRIBUTE_NORMAL, NULL);
		}
		if (client_file->h_file == INVALID_HANDLE_VALUE) {
			int_err = GetLastError();
			FormatMessageA(FORMAT_MESSAGE_FROM_SYSTEM | FORMAT_MESSAGE_ALLOCATE_BUFFER | FORMAT_MESSAGE_IGNORE_INSERTS, NULL,
				int_err, MAKELANGID(LANG_NEUTRAL, SUBLANG_DEFAULT), (LPSTR)&strErrorText, 0, NULL);

			if (strErrorText != NULL) {
				SFINISH("CreateFile failed: 0x%X (%s)", int_err, strErrorText);
			}
		}
	}
#else
	client_file->int_fd = open(client_file->str_path, O_TRUNC | O_WRONLY | O_CREAT, 0770);
	SFINISH_CHECK(client_file->int_fd > 0, "open() failed!");
#endif

	ev_check_init(&client_request->check, ws_file_write_step3);
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
			SFINISH_SNCAT(
				str_response, &int_response_len,
				"messageid = ", (size_t)12,
				client_request->str_message_id, strlen(client_request->str_message_id),
				"\012responsenumber = ", (size_t)18,
				str_temp, strlen(str_temp),
				"\012FATAL\012", (size_t)7,
				"Failed to open file for writing ", (size_t)30,
				client_file->str_path, strlen(client_file->str_path),
				": ", (size_t)2,
				strerror(errno), strlen(strerror(errno))
			);
		} else {
			char *_str_response = str_response;
			SFINISH_SNCAT(
				str_response, &int_response_len,
				"messageid = ", (size_t)12,
				client_request->str_message_id, strlen(client_request->str_message_id),
				"\012responsenumber = ", (size_t)18,
				str_temp, strlen(str_temp),
				"\012", (size_t)1,
				_str_response, strlen(_str_response)
			);
			SFREE(_str_response);
		}

		WS_sendFrame(EV_A, client_request->parent, true, 0x01, str_response, int_response_len);
		DArray_push(client_request->arr_response, str_response);

		ws_file_free(client_file);
		// client_request_free(client_request);
		// client_request_free takes care of this
		// SFREE(client_file);
	}
	return true;
}

void ws_file_write_step3(EV_P, ev_check *w, int revents) {
	if (revents != 0) {
	} // get rid of unused parameter warning
	char *str_response = NULL;
	char str_temp[101] = {0};
	struct sock_ev_client_request *client_request = (struct sock_ev_client_request *)w;
	struct sock_ev_client_file *client_file = (struct sock_ev_client_file *)(client_request->vod_request_data);
#ifdef _WIN32
	LPSTR strErrorText = NULL;
#endif
	size_t int_response_len = 0;

#ifdef _WIN32
	int int_temp = 0;
	BOOL bol_result = WriteFile(client_file->h_file, client_file->ptr_content + client_file->int_written,
		(DWORD)(strlen(client_file->ptr_content) - client_file->int_written), &int_temp, NULL);
	if (bol_result == FALSE) {
		int int_err = GetLastError();
		FormatMessageA(FORMAT_MESSAGE_FROM_SYSTEM | FORMAT_MESSAGE_ALLOCATE_BUFFER | FORMAT_MESSAGE_IGNORE_INSERTS, NULL, int_err,
			MAKELANGID(LANG_NEUTRAL, SUBLANG_DEFAULT), (LPSTR)&strErrorText, 0, NULL);

		if (strErrorText != NULL) {
			SFINISH("WriteFile failed: 0x%X (%s)", int_err, strErrorText);
		}
	}
#else
	ssize_t int_temp = write(client_file->int_fd, client_file->ptr_content + client_file->int_written,
		strlen(client_file->ptr_content) - (size_t)client_file->int_written);
	SFINISH_CHECK(int_temp != -1, "write failed");
#endif
	client_file->int_written += int_temp;

	if ((size_t)client_file->int_written == strlen(client_file->ptr_content)) {
		ev_check_stop(EV_A, &client_request->check);
		decrement_idle(EV_A);
		ws_file_write_step4(EV_A, client_request);
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
		snprintf(str_temp, 100, "%zd", client_request->int_response_id);
		if (errno != 0) {
			SFREE(str_response);
			SFINISH_SNCAT(
				str_response, &int_response_len,
				"messageid = ", (size_t)12,
				client_request->str_message_id, strlen(client_request->str_message_id),
				"\012responsenumber = ", (size_t)18,
				str_temp, strlen(str_temp),
				"\012FATAL\012", (size_t)7,
				"Failed to write to file ", (size_t)20,
				client_file->str_path, strlen(client_file->str_path),
				": ", (size_t)2,
				strerror(errno), strlen(strerror(errno))
			);
		} else {
			char *_str_response = str_response;
			SFINISH_SNCAT(
				str_response, &int_response_len,
				"messageid = ", (size_t)12,
				client_request->str_message_id, strlen(client_request->str_message_id),
				"\012responsenumber = ", (size_t)18,
				str_temp, strlen(str_temp),
				"\012", (size_t)1,
				_str_response, strlen(_str_response)
			);
			SFREE(_str_response);
		}

		WS_sendFrame(EV_A, client_request->parent, true, 0x01, str_response, int_response_len);
		DArray_push(client_request->arr_response, str_response);

		ws_file_free(client_file);
		// client_request_free(client_request);
		// client_request_free takes care of this
		// SFREE(client_file);
	}
}

void ws_file_write_step4(EV_P, struct sock_ev_client_request *client_request) {
	char *str_response = NULL;
	struct sock_ev_client_file *client_file = (struct sock_ev_client_file *)(client_request->vod_request_data);
#ifdef _WIN32
	LPSTR strErrorText = NULL;
#else
	struct stat *statdata = NULL;
	char *str_nanoseconds = NULL;
#endif
	size_t int_response_len = 0;

	SFINISH_SALLOC(str_response, 101);
#ifdef _WIN32
	CloseHandle(client_file->h_file);
	SetLastError(0);
	client_file->h_file =
		CreateFileA(client_file->str_path, GENERIC_READ, FILE_SHARE_READ, NULL, OPEN_EXISTING, FILE_ATTRIBUTE_NORMAL, NULL);
	if (client_file->h_file == INVALID_HANDLE_VALUE) {
		int int_err = GetLastError();
		FormatMessageA(FORMAT_MESSAGE_FROM_SYSTEM | FORMAT_MESSAGE_ALLOCATE_BUFFER | FORMAT_MESSAGE_IGNORE_INSERTS, NULL, int_err,
			MAKELANGID(LANG_NEUTRAL, SUBLANG_DEFAULT), (LPSTR)&strErrorText, 0, NULL);

		if (strErrorText != NULL) {
			SFINISH("CreateFile failed: 0x%X (%s)", int_err, strErrorText);
		}
	}

	FILETIME ft_last_write_time;
	SFINISH_CHECK(GetFileTime(client_file->h_file, NULL, NULL, &ft_last_write_time) != 0, "GetFileTime failed");

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
	int_response_len = strlen(str_response);
#else
	SFINISH_SALLOC(statdata, sizeof(struct stat));
	if (stat(client_file->str_path, statdata) == 0) {
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

		int_response_len = strlen(str_response);
		SINFO("int_response_len: %zu", int_response_len);
		SFINISH_SNFCAT(
			str_response, &int_response_len,
			".", (size_t)1,
			str_nanoseconds, strlen(str_nanoseconds)
		);
		SINFO("int_response_len: %zu", int_response_len);
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
			SFINISH_SNCAT(
				str_response, &int_response_len,
				"messageid = ", (size_t)12,
				client_request->str_message_id, strlen(client_request->str_message_id),
				"\012responsenumber = ", (size_t)18,
				str_temp, strlen(str_temp),
				"\012FATAL\012", (size_t)7,
				"Failed to stat file ", (size_t)16,
				client_file->str_path, strlen(client_file->str_path),
				": ", (size_t)2,
				strerror(errno), strlen(strerror(errno))
			);
		} else {
			char *_str_response = str_response;
			SFINISH_SNCAT(
				str_response, &int_response_len,
				"messageid = ", (size_t)12,
				client_request->str_message_id, strlen(client_request->str_message_id),
				"\012responsenumber = ", (size_t)18,
				str_temp, strlen(str_temp),
				"\012", (size_t)1,
				_str_response, strlen(_str_response)
			);
			SFREE(_str_response);
		}

		WS_sendFrame(EV_A, client_request->parent, true, 0x01, str_response, int_response_len);
		DArray_push(client_request->arr_response, str_response);

		WS_sendFrame(EV_A, client_request->parent, true, 0x01, str_response, int_response_len);
		DArray_push(client_request->arr_response, str_response);

		ws_file_free(client_file);
		// client_request_free(client_request);
		// client_request_free takes care of this
		// SFREE(client_file);
	} else {
		client_request->int_response_id += 1;
		char str_temp[101] = {0};
		snprintf(str_temp, 100, "%zd", client_request->int_response_id);
		char *_str_response = str_response;
		SINFO("int_response_len: %zu", int_response_len);
		SFINISH_SNCAT(
			str_response, &int_response_len,
			"messageid = ", (size_t)12,
			client_request->str_message_id, strlen(client_request->str_message_id),
			"\012responsenumber = ", (size_t)18,
			str_temp, strlen(str_temp),
			"\012", (size_t)1,
			_str_response, int_response_len
		);
		SINFO("_str_response: %s", _str_response);
		SINFO("str_response: %s", str_response);
		SFREE(_str_response);
		WS_sendFrame(EV_A, client_request->parent, true, 0x01, str_response, int_response_len);
		DArray_push(client_request->arr_response, str_response);

		client_request->int_response_id += 1;
		memset(str_temp, 0, 101);
		snprintf(str_temp, 100, "%zd", client_request->int_response_id);
		SFINISH_SNCAT(
			str_response, &int_response_len,
			"messageid = ", (size_t)12,
			client_request->str_message_id, strlen(client_request->str_message_id),
			"\012responsenumber = ", (size_t)18,
			str_temp, strlen(str_temp),
			"\012TRANSACTION COMPLETED", (size_t)22
		);
		WS_sendFrame(EV_A, client_request->parent, true, 0x01, str_response, int_response_len);
		DArray_push(client_request->arr_response, str_response);

		str_response = NULL;

		ws_file_free(client_file);
		// client_request_free(client_request);
	}
}

// ***************************************************************************************
// ***************************************************************************************
// **************************************** MOVE *****************************************
// ***************************************************************************************
// ***************************************************************************************

bool ws_file_move_step2(EV_P, void *cb_data, bool bol_group) {
	struct sock_ev_client_request *client_request = cb_data;
	struct sock_ev_client_file *client_file = (struct sock_ev_client_file *)(client_request->vod_request_data);

	char *str_response = NULL;
	size_t int_response_len = 0;

	SFINISH_CHECK(bol_group, "You don't have the necessary permissions for this folder.");

	SDEBUG("client_file->str_path: %s", client_file->str_path);
	SFINISH_CHECK(permissions_write_check(
					  EV_A, client_request->parent->conn, client_file->str_input_path_to, client_request, ws_file_move_step3),
		"permissions_write_check() failed");

	bol_error_state = false;
finish:
	if (bol_error_state) {
		bol_error_state = false;
		client_request->int_response_id = (ssize_t)DArray_end(client_request->arr_response) + 1;
		char str_temp[101] = {0};
		snprintf(str_temp, 100, "%zd", client_request->int_response_id);
		char *_str_response = str_response;
		SFINISH_SNCAT(
			str_response, &int_response_len,
			"messageid = ", (size_t)12,
			client_request->str_message_id, strlen(client_request->str_message_id),
			"\012responsenumber = ", (size_t)18,
			str_temp, strlen(str_temp),
			"\012", (size_t)1,
			_str_response, strlen(_str_response)
		);
		SFREE(_str_response);

		WS_sendFrame(EV_A, client_request->parent, true, 0x01, str_response, int_response_len);
		DArray_push(client_request->arr_response, str_response);

		ws_file_free(client_file);
		// client_request_free(client_request);
		// client_request_free takes care of this
		// SFREE(client_file);
	}
	return true;
}

bool ws_file_move_step3(EV_P, void *cb_data, bool bol_group) {
	struct sock_ev_client_request *client_request = cb_data;
	struct sock_ev_client_file *client_file = (struct sock_ev_client_file *)(client_request->vod_request_data);
	size_t int_response_len = 0;

	char *str_response = NULL;
#ifdef _WIN32
	LPTSTR strErrorText = NULL;
#else
	struct stat *statdata = NULL;
	char *str_nanoseconds = NULL;
#endif

	SFINISH_CHECK(bol_group, "You don't have the necessary permissions for this folder.");

	if (client_file->file_type == POSTAGE_FILE_MOVE) {
		SFINISH_CHECK(
			rename(client_file->str_path, client_file->str_path_to) == 0, "rename failed (%d): %s", errno, strerror(errno));

		SFINISH_SALLOC(str_response, 101);
#ifdef _WIN32
		CloseHandle(client_file->h_file);
		SetLastError(0);
		client_file->h_file =
			CreateFileA(client_file->str_path_to, GENERIC_READ, FILE_SHARE_READ, NULL, OPEN_EXISTING, FILE_ATTRIBUTE_NORMAL, NULL);
		if (client_file->h_file == INVALID_HANDLE_VALUE) {
			int int_err = GetLastError();
			FormatMessageA(FORMAT_MESSAGE_FROM_SYSTEM | FORMAT_MESSAGE_ALLOCATE_BUFFER | FORMAT_MESSAGE_IGNORE_INSERTS, NULL, int_err,
				MAKELANGID(LANG_NEUTRAL, SUBLANG_DEFAULT), (LPSTR)&strErrorText, 0, NULL);

			if (strErrorText != NULL) {
				SFINISH("CreateFile failed: 0x%X (%s)", int_err, strErrorText);
			}
		}

		FILETIME ft_last_write_time;
		SFINISH_CHECK(GetFileTime(client_file->h_file, NULL, NULL, &ft_last_write_time) != 0, "GetFileTime failed");

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
		int_response_len = strlen(str_response);
#else
		SFINISH_SALLOC(statdata, sizeof(struct stat));
		if (stat(client_file->str_path_to, statdata) == 0) {
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

			int_response_len = strlen(str_response);
			SFINISH_SNFCAT(
				str_response, &int_response_len,
				".", (size_t)1,
				str_nanoseconds, strlen(str_nanoseconds)
			);
#endif
		} else {
			SFINISH("stat failed");
		}
#endif
	} else {
		SFREE(client_file->str_path);
		client_file->str_path = canonical(client_file->str_canonical_start, client_file->str_partial_path, "read_file");
		if (client_file->str_path != NULL) {
			SFINISH_CHECK(canonical_copy(client_file->str_canonical_start, client_file->str_partial_path,
							  client_file->str_canonical_start_to, client_file->str_partial_path_to),
				"canonical_copy failed");

			SFINISH_SALLOC(str_response, 101);
#ifdef _WIN32
			CloseHandle(client_file->h_file);
			SetLastError(0);
			client_file->h_file =
				CreateFileA(client_file->str_path_to, GENERIC_READ, FILE_SHARE_READ, NULL, OPEN_EXISTING, FILE_ATTRIBUTE_NORMAL, NULL);
			if (client_file->h_file == INVALID_HANDLE_VALUE) {
				int int_err = GetLastError();
				FormatMessageA(FORMAT_MESSAGE_FROM_SYSTEM | FORMAT_MESSAGE_ALLOCATE_BUFFER | FORMAT_MESSAGE_IGNORE_INSERTS, NULL, int_err,
					MAKELANGID(LANG_NEUTRAL, SUBLANG_DEFAULT), (LPSTR)&strErrorText, 0, NULL);

				if (strErrorText != NULL) {
					SFINISH("CreateFile failed: 0x%X (%s)", int_err, strErrorText);
				}
			}

			FILETIME ft_last_write_time;
			SFINISH_CHECK(GetFileTime(client_file->h_file, NULL, NULL, &ft_last_write_time) != 0, "GetFileTime failed");

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
			int_response_len = strlen(str_response);
#else
			SFINISH_SALLOC(statdata, sizeof(struct stat));
			if (stat(client_file->str_path_to, statdata) == 0) {
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

				int_response_len = strlen(str_response);
				SFINISH_SNFCAT(
					str_response, &int_response_len,
					".", (size_t)1,
					str_nanoseconds, strlen(str_nanoseconds)
				);
#endif
			} else {
				SFINISH("stat failed");
			}
#endif

		} else {
			SDEBUG("client_file->str_partial_path: %s", client_file->str_partial_path);
			SDEBUG("client_file->str_partial_path_to: %s", client_file->str_partial_path_to);
			client_file->str_path = canonical(client_file->str_canonical_start, client_file->str_partial_path, "read_dir");
			SFINISH_CHECK(client_file->str_path != NULL, "canonical failed");
			SFINISH_CHECK(canonical_recurse_directory(EV_A, client_file->str_canonical_start, client_file->str_partial_path,
							  client_request, ws_file_copy_step4, ws_file_copy_step5),
				"canonical_delete failed");
			client_file = NULL;
		}
	}

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
			SFINISH_SNCAT(
				str_response, &int_response_len,
				"messageid = ", (size_t)12,
				client_request->str_message_id, strlen(client_request->str_message_id),
				"\012responsenumber = ", (size_t)18,
				str_temp, strlen(str_temp),
				"\012FATAL\012", (size_t)7,
				"Failed to stat file ", (size_t)16,
				client_file->str_path, strlen(client_file->str_path),
				": ", (size_t)2,
				strerror(errno), strlen(strerror(errno))
			);
		} else {
			char *_str_response = str_response;
			SFINISH_SNCAT(
				str_response, &int_response_len,
				"messageid = ", (size_t)12,
				client_request->str_message_id, strlen(client_request->str_message_id),
				"\012responsenumber = ", (size_t)18,
				str_temp, strlen(str_temp),
				"\012", (size_t)1,
				_str_response, strlen(_str_response)
			);
			SFREE(_str_response);
		}

		WS_sendFrame(EV_A, client_request->parent, true, 0x01, str_response, int_response_len);
		DArray_push(client_request->arr_response, str_response);

		if (client_file != NULL) {
			ws_file_free(client_file);
		}
		// client_request_free(client_request);
		// client_request_free takes care of this
		// SFREE(client_file);
	} else {
		if (str_response != NULL) {
			client_request->int_response_id += 1;
			char str_temp[101] = {0};
			snprintf(str_temp, 100, "%zd", client_request->int_response_id);
			char *_str_response = str_response;
			SFINISH_SNCAT(
				str_response, &int_response_len,
				"messageid = ", (size_t)12,
				client_request->str_message_id, strlen(client_request->str_message_id),
				"\012responsenumber = ", (size_t)18,
				str_temp, strlen(str_temp),
				"\012", (size_t)1,
				_str_response, strlen(_str_response)
			);
			SFREE(_str_response);
			WS_sendFrame(EV_A, client_request->parent, true, 0x01, str_response, int_response_len);
			DArray_push(client_request->arr_response, str_response);

			client_request->int_response_id += 1;
			memset(str_temp, 0, 101);
			snprintf(str_temp, 100, "%zd", client_request->int_response_id);
			SFINISH_SNCAT(
				str_response, &int_response_len,
				"messageid = ", (size_t)12,
				client_request->str_message_id, strlen(client_request->str_message_id),
				"\012responsenumber = ", (size_t)18,
				str_temp, strlen(str_temp),
				"\012TRANSACTION COMPLETED", (size_t)22
			);
			WS_sendFrame(EV_A, client_request->parent, true, 0x01, str_response, int_response_len);
			DArray_push(client_request->arr_response, str_response);

			str_response = NULL;
			// client_request_free(client_request);
		}
		if (client_file != NULL) {
			ws_file_free(client_file);
		}
	}
	return true;
}

bool ws_file_copy_step4(EV_P, void *cb_data, char *str_path) {
	SDEBUG("ws_file_copy_step4");
	struct sock_ev_client_request *client_request = cb_data;
	struct sock_ev_client_file *client_file = (struct sock_ev_client_file *)(client_request->vod_request_data);
	bool bol_ret = true;
	char *str_response = NULL;
	size_t int_response_len = 0;
	SDEFINE_VAR_ALL(str_new_path, str_new_path_to, str_result_path);
	if (*(client_file->str_partial_path + strlen(client_file->str_partial_path) - 1) == '/') {
		*(client_file->str_partial_path + strlen(client_file->str_partial_path) - 1) = '\0';
	}
	if (*(client_file->str_partial_path_to + strlen(client_file->str_partial_path_to) - 1) == '/') {
		*(client_file->str_partial_path_to + strlen(client_file->str_partial_path_to) - 1) = '\0';
	}
	size_t int_new_path_len = 0;
	size_t int_new_path_to_len = 0;
	if (*str_path == '/') {
		SFINISH_SNCAT(
			str_new_path, &int_new_path_len,
			client_file->str_partial_path, strlen(client_file->str_partial_path),
			str_path, strlen(str_path)
		);
		SFINISH_SNCAT(
			str_new_path_to, &int_new_path_to_len,
			client_file->str_partial_path_to, strlen(client_file->str_partial_path),
			str_path, strlen(str_path)
		);
	} else {
		SFINISH_SNCAT(
			str_new_path, &int_new_path_len,
			client_file->str_partial_path, strlen(client_file->str_partial_path),
			"/", (size_t)1,
			str_path, strlen(str_path)
		);
		SFINISH_SNCAT(
			str_new_path_to, &int_new_path_to_len,
			client_file->str_partial_path_to, strlen(client_file->str_partial_path),
			"/", (size_t)1,
			str_path, strlen(str_path)
		);
	}

	str_result_path = canonical(client_file->str_canonical_start, str_new_path, "read_file");
	if (str_result_path != NULL) {
		SFINISH_CHECK(
			canonical_copy(client_file->str_canonical_start, str_new_path, client_file->str_canonical_start_to, str_new_path_to),
			"canonical_copy failed");
		SFREE(str_result_path);
	} else {
		str_result_path = canonical(client_file->str_canonical_start_to, str_new_path_to, "read_dir");
		if (str_result_path == NULL) {
			str_result_path = canonical(client_file->str_canonical_start_to, str_new_path_to, "create_dir");
			SFINISH_CHECK(str_result_path != NULL, "canonical failed");
		}
	}
finish:
	if (bol_error_state) {
		bol_error_state = false;
		client_request->int_response_id = (ssize_t)DArray_end(client_request->arr_response) + 1;
		char str_temp[101] = {0};
		snprintf(str_temp, 100, "%zd", client_request->int_response_id);
		if (errno != 0) {
			SFREE(str_response);
			SFINISH_SNCAT(
				str_response, &int_response_len,
				"messageid = ", (size_t)12,
				client_request->str_message_id, strlen(client_request->str_message_id),
				"\012responsenumber = ", (size_t)18,
				str_temp, strlen(str_temp),
				"\012FATAL\012", (size_t)7,
				"Failed to delete file ", (size_t)18,
				client_file->str_path, strlen(client_file->str_path),
				": ", (size_t)2,
				strerror(errno), strlen(strerror(errno))
			);
		} else {
			char *_str_response = str_response;
			SFINISH_SNCAT(
				str_response, &int_response_len,
				"messageid = ", (size_t)12,
				client_request->str_message_id, strlen(client_request->str_message_id),
				"\012responsenumber = ", (size_t)18,
				str_temp, strlen(str_temp),
				"\012", (size_t)1,
				_str_response, strlen(_str_response)
			);
			SFREE(_str_response);
		}

		WS_sendFrame(EV_A, client_request->parent, true, 0x01, str_response, int_response_len);
		DArray_push(client_request->arr_response, str_response);

		// This is handled in step5
		// ws_file_free(client_file);

		// client_request_free(client_request);
		// client_request_free takes care of this
		// SFREE(client_file);
		bol_ret = false;
	}
	SFREE_ALL();
	return bol_ret;
}

bool ws_file_copy_step5(EV_P, void *cb_data, bool bol_success) {
	SDEBUG("ws_file_copy_step5");
	struct sock_ev_client_request *client_request = cb_data;
	struct sock_ev_client_file *client_file = (struct sock_ev_client_file *)(client_request->vod_request_data);

	struct tm *tm_change_stamp = NULL;
	struct stat statbuf;

	char *str_response = NULL;
	size_t int_response_len = 0;

	SFINISH_CHECK(bol_success, "Error in canonical_copy");

	stat(client_file->str_path_to, &statbuf);

	SFINISH_SALLOC(str_response, 101);
	tm_change_stamp = localtime(&(statbuf.st_mtime));
	SFINISH_CHECK(tm_change_stamp != NULL, "localtime() failed");
	SFINISH_CHECK(strftime(str_response, 100, str_date_format, tm_change_stamp) != 0, "strftime() failed");
	str_response[100] = 0;

	bol_error_state = false;
finish:
	if (bol_error_state) {
		bol_error_state = false;
		client_request->int_response_id = (ssize_t)DArray_end(client_request->arr_response) + 1;
		char str_temp[101] = {0};
		snprintf(str_temp, 100, "%zd", client_request->int_response_id);
		if (errno != 0) {
			SFREE(str_response);
			SFINISH_SNCAT(
				str_response, &int_response_len,
				"messageid = ", (size_t)12,
				client_request->str_message_id, strlen(client_request->str_message_id),
				"\012responsenumber = ", (size_t)18,
				str_temp, strlen(str_temp),
				"\012FATAL\012", (size_t)7,
				"Failed to stat file ", (size_t)16,
				client_file->str_path, strlen(client_file->str_path),
				": ", (size_t)2,
				strerror(errno), strlen(strerror(errno))
			);
		} else {
			char *_str_response = str_response;
			SFINISH_SNCAT(
				str_response, &int_response_len,
				"messageid = ", (size_t)12,
				client_request->str_message_id, strlen(client_request->str_message_id),
				"\012responsenumber = ", (size_t)18,
				str_temp, strlen(str_temp),
				"\012", (size_t)1,
				_str_response, strlen(_str_response)
			);
			SFREE(_str_response);
		}

		WS_sendFrame(EV_A, client_request->parent, true, 0x01, str_response, int_response_len);
		DArray_push(client_request->arr_response, str_response);

		ws_file_free(client_file);
		// client_request_free(client_request);
		// client_request_free takes care of this
		// SFREE(client_file);
	} else {
		client_request->int_response_id += 1;
		char str_temp[101] = {0};
		snprintf(str_temp, 100, "%zd", client_request->int_response_id);
		char *_str_response = str_response;
		SFINISH_SNCAT(
			str_response, &int_response_len,
			"messageid = ", (size_t)12,
			client_request->str_message_id, strlen(client_request->str_message_id),
			"\012responsenumber = ", (size_t)18,
			str_temp, strlen(str_temp),
			"\012", (size_t)1,
			_str_response, strlen(_str_response)
		);
		SFREE(_str_response);
		WS_sendFrame(EV_A, client_request->parent, true, 0x01, str_response, int_response_len);
		DArray_push(client_request->arr_response, str_response);

		client_request->int_response_id += 1;
		memset(str_temp, 0, 101);
		snprintf(str_temp, 100, "%zd", client_request->int_response_id);
		SFINISH_SNCAT(
			str_response, &int_response_len,
			"messageid = ", (size_t)12,
			client_request->str_message_id, strlen(client_request->str_message_id),
			"\012responsenumber = ", (size_t)18,
			str_temp, strlen(str_temp),
			"\012TRANSACTION COMPLETED", (size_t)22
		);
		WS_sendFrame(EV_A, client_request->parent, true, 0x01, str_response, int_response_len);
		DArray_push(client_request->arr_response, str_response);

		str_response = NULL;

		ws_file_free(client_file);
		// client_request_free(client_request);
	}
	return true;
}

// ***************************************************************************************
// ***************************************************************************************
// *************************************** DELETE ****************************************
// ***************************************************************************************
// ***************************************************************************************

bool ws_file_delete_step2(EV_P, void *cb_data, bool bol_group) {
	SDEBUG("ws_file_delete_step2");
	struct sock_ev_client_request *client_request = cb_data;
	struct sock_ev_client_file *client_file = (struct sock_ev_client_file *)(client_request->vod_request_data);

	char *str_response = NULL;
	size_t int_response_len = 0;

	SFINISH_CHECK(bol_group, "You don't have the necessary permissions for this folder.");

	SFREE(client_file->str_path);

	client_file->str_path = canonical(client_file->str_canonical_start, client_file->str_partial_path, "read_file");
	if (client_file->str_path != NULL) {
		SFINISH_CHECK(unlink(client_file->str_path) == 0, "unlink failed");
		SFINISH_SNCAT(
			str_response, &int_response_len,
			"OK", (size_t)2
		);
	} else {
		SFREE(str_global_error);
		client_file->str_path = canonical(client_file->str_canonical_start, client_file->str_partial_path, "read_dir");
		SFINISH_CHECK(client_file->str_path != NULL, "canonical failed");
		SFINISH_CHECK(canonical_recurse_directory(EV_A, client_file->str_canonical_start, client_file->str_partial_path,
						  client_request, ws_file_delete_step3, ws_file_delete_step4),
			"canonical_delete failed");
	}
	SFREE(str_global_error);

	bol_error_state = false;
finish:
	if (bol_error_state) {
		bol_error_state = false;
		client_request->int_response_id = (ssize_t)DArray_end(client_request->arr_response) + 1;
		char str_temp[101] = {0};
		snprintf(str_temp, 100, "%zd", client_request->int_response_id);
		if (errno != 0) {
			SFREE(str_response);
			SFINISH_SNCAT(
				str_response, &int_response_len,
				"messageid = ", (size_t)12,
				client_request->str_message_id, strlen(client_request->str_message_id),
				"\012responsenumber = ", (size_t)18,
				str_temp, strlen(str_temp),
				"\012FATAL\012", (size_t)7,
				"Failed to stat file ", (size_t)16,
				client_file->str_path, strlen(client_file->str_path),
				": ", (size_t)2,
				strerror(errno), strlen(strerror(errno))
			);
		} else {
			char *_str_response = str_response;
			SFINISH_SNCAT(
				str_response, &int_response_len,
				"messageid = ", (size_t)12,
				client_request->str_message_id, strlen(client_request->str_message_id),
				"\012responsenumber = ", (size_t)18,
				str_temp, strlen(str_temp),
				"\012", (size_t)1,
				_str_response, strlen(_str_response)
			);
			SFREE(_str_response);
		}

		WS_sendFrame(EV_A, client_request->parent, true, 0x01, str_response, int_response_len);
		DArray_push(client_request->arr_response, str_response);

		ws_file_free(client_file);
		// client_request_free(client_request);
		// client_request_free takes care of this
		// SFREE(client_file);
	} else if (str_response != NULL) {
		client_request->int_response_id += 1;
		char str_temp[101] = {0};
		snprintf(str_temp, 100, "%zd", client_request->int_response_id);
		char *_str_response = str_response;
		SFINISH_SNCAT(
			str_response, &int_response_len,
			"messageid = ", (size_t)12,
			client_request->str_message_id, strlen(client_request->str_message_id),
			"\012responsenumber = ", (size_t)18,
			str_temp, strlen(str_temp),
			"\012", (size_t)1,
			_str_response, strlen(_str_response)
		);
		SFREE(_str_response);
		WS_sendFrame(EV_A, client_request->parent, true, 0x01, str_response, int_response_len);
		DArray_push(client_request->arr_response, str_response);

		client_request->int_response_id += 1;
		memset(str_temp, 0, 101);
		snprintf(str_temp, 100, "%zd", client_request->int_response_id);
		SFINISH_SNCAT(
			str_response, &int_response_len,
			"messageid = ", (size_t)12,
			client_request->str_message_id, strlen(client_request->str_message_id),
			"\012responsenumber = ", (size_t)18,
			str_temp, strlen(str_temp),
			"\012TRANSACTION COMPLETED", (size_t)22
		);
		WS_sendFrame(EV_A, client_request->parent, true, 0x01, str_response, int_response_len);
		DArray_push(client_request->arr_response, str_response);

		str_response = NULL;

		ws_file_free(client_file);
		// client_request_free(client_request);
	}
	return true;
}

bool ws_file_delete_step3(EV_P, void *cb_data, char *str_path) {
	SDEBUG("ws_file_delete_step3");
	struct sock_ev_client_request *client_request = cb_data;
	struct sock_ev_client_file *client_file = (struct sock_ev_client_file *)(client_request->vod_request_data);
	bool bol_ret = true;
	char *str_response = NULL;
	size_t int_response_len = 0;
	SDEFINE_VAR_ALL(str_new_path);
	if (*(client_file->str_partial_path + strlen(client_file->str_partial_path) - 1) == '/') {
		*(client_file->str_partial_path + strlen(client_file->str_partial_path) - 1) = '\0';
	}
	size_t int_new_path_len = 0;
	if (*str_path == '/') {
		SFINISH_SNCAT(
			str_new_path, &int_new_path_len,
			client_file->str_partial_path, strlen(client_file->str_partial_path),
			str_path, strlen(str_path)
		);
	} else {
		SFINISH_SNCAT(
			str_new_path, &int_new_path_len,
			client_file->str_partial_path, strlen(client_file->str_partial_path),
			"/", (size_t)1,
			str_path, strlen(str_path)
		);
	}

	SDEBUG("client_file->str_canonical_start: %s", client_file->str_canonical_start);
	SDEBUG("client_file->str_partial_path: %s", client_file->str_partial_path);
	SDEBUG("str_path: %s", str_path);
	SDEBUG("str_new_path: %s", str_new_path);

	SFINISH_CHECK(canonical_delete(client_file->str_canonical_start, str_new_path), "canonical_delete failed");
finish:
	if (bol_error_state) {
		bol_error_state = false;
		client_request->int_response_id = (ssize_t)DArray_end(client_request->arr_response) + 1;
		char str_temp[101] = {0};
		snprintf(str_temp, 100, "%zd", client_request->int_response_id);
		if (errno != 0) {
			SFREE(str_response);
			SFINISH_SNCAT(
				str_response, &int_response_len,
				"messageid = ", (size_t)12,
				client_request->str_message_id, strlen(client_request->str_message_id),
				"\012responsenumber = ", (size_t)18,
				str_temp, strlen(str_temp),
				"\012FATAL\012", (size_t)7,
				"Failed to delete file ", (size_t)18,
				client_file->str_path, strlen(client_file->str_path),
				": ", (size_t)2,
				strerror(errno), strlen(strerror(errno))
			);
		} else {
			char *_str_response = str_response;
			SFINISH_SNCAT(
				str_response, &int_response_len,
				"messageid = ", (size_t)12,
				client_request->str_message_id, strlen(client_request->str_message_id),
				"\012responsenumber = ", (size_t)18,
				str_temp, strlen(str_temp),
				"\012", (size_t)1,
				_str_response, strlen(_str_response)
			);
			SFREE(_str_response);
		}

		WS_sendFrame(EV_A, client_request->parent, true, 0x01, str_response, int_response_len);
		DArray_push(client_request->arr_response, str_response);

		ws_file_free(client_file);
		// client_request_free(client_request);
		// client_request_free takes care of this
		// SFREE(client_file);
		bol_ret = false;
	}
	SFREE_ALL();
	return bol_ret;
}

bool ws_file_delete_step4(EV_P, void *cb_data, bool bol_success) {
	SDEBUG("ws_file_delete_step4");
	struct sock_ev_client_request *client_request = cb_data;
	struct sock_ev_client_file *client_file = (struct sock_ev_client_file *)(client_request->vod_request_data);

	char *str_response = NULL;
	size_t int_response_len = 0;

	SFINISH_CHECK(bol_success, "Error in canonical_delete");

	SFINISH_SNCAT(
		str_response, &int_response_len,
		"OK", (size_t)2
	);

	bol_error_state = false;
finish:
	if (bol_error_state) {
		bol_error_state = false;
		client_request->int_response_id = (ssize_t)DArray_end(client_request->arr_response) + 1;
		char str_temp[101] = {0};
		snprintf(str_temp, 100, "%zd", client_request->int_response_id);
		if (errno != 0) {
			SFREE(str_response);
			SFINISH_SNCAT(
				str_response, &int_response_len,
				"messageid = ", (size_t)12,
				client_request->str_message_id, strlen(client_request->str_message_id),
				"\012responsenumber = ", (size_t)18,
				str_temp, strlen(str_temp),
				"\012FATAL\012", (size_t)7,
				"Failed to stat file ", (size_t)16,
				client_file->str_path, strlen(client_file->str_path),
				": ", (size_t)2,
				strerror(errno), strlen(strerror(errno))
			);
		} else {
			char *_str_response = str_response;
			SFINISH_SNCAT(
				str_response, &int_response_len,
				"messageid = ", (size_t)12,
				client_request->str_message_id, strlen(client_request->str_message_id),
				"\012responsenumber = ", (size_t)18,
				str_temp, strlen(str_temp),
				"\012", (size_t)1,
				_str_response, strlen(_str_response)
			);
			SFREE(_str_response);
		}

		WS_sendFrame(EV_A, client_request->parent, true, 0x01, str_response, int_response_len);
		DArray_push(client_request->arr_response, str_response);

		ws_file_free(client_file);
		// client_request_free(client_request);
		// client_request_free takes care of this
		// SFREE(client_file);
	} else if (str_response != NULL) {
		client_request->int_response_id += 1;
		char str_temp[101] = { 0 };
		snprintf(str_temp, 100, "%zd", client_request->int_response_id);
		char *_str_response = str_response;
		SFINISH_SNCAT(
			str_response, &int_response_len,
			"messageid = ", (size_t)12,
			client_request->str_message_id, strlen(client_request->str_message_id),
			"\012responsenumber = ", (size_t)18,
			str_temp, strlen(str_temp),
			"\012", (size_t)1,
			_str_response, strlen(_str_response)
		);
		SFREE(_str_response);
		WS_sendFrame(EV_A, client_request->parent, true, 0x01, str_response, int_response_len);
		DArray_push(client_request->arr_response, str_response);

		client_request->int_response_id += 1;
		memset(str_temp, 0, 101);
		snprintf(str_temp, 100, "%zd", client_request->int_response_id);
		SFINISH_SNCAT(
			str_response, &int_response_len,
			"messageid = ", (size_t)12,
			client_request->str_message_id, strlen(client_request->str_message_id),
			"\012responsenumber = ", (size_t)18,
			str_temp, strlen(str_temp),
			"\012TRANSACTION COMPLETED", (size_t)22
		);
		WS_sendFrame(EV_A, client_request->parent, true, 0x01, str_response, int_response_len);
		DArray_push(client_request->arr_response, str_response);

		str_response = NULL;

		ws_file_free(client_file);
		// client_request_free(client_request);
	}
	return true;
}

// ***************************************************************************************
// ***************************************************************************************
// *************************************** CREATE ****************************************
// ***************************************************************************************
// ***************************************************************************************

bool ws_file_create_step2(EV_P, void *cb_data, bool bol_group) {
	struct sock_ev_client_request *client_request = cb_data;
	struct sock_ev_client_file *client_file = (struct sock_ev_client_file *)(client_request->vod_request_data);

	char *str_response = NULL;
	size_t int_response_len = 0;
	struct stat statbuf;
	memset(&statbuf, 0, sizeof(statbuf));

	SFINISH_CHECK(bol_group, "You don't have the necessary permissions for this folder.");

	SFREE(client_file->str_path);
	client_file->str_path = canonical(client_file->str_canonical_start, client_file->str_partial_path, "create_dir");
	SFINISH_CHECK(client_file->str_path != NULL, "canonical failed");

	stat(client_file->str_path, &statbuf);

	SFINISH_SALLOC(str_response, 101);
	struct tm *tm_change_stamp = localtime(&(statbuf.st_mtime));
	SFINISH_CHECK(tm_change_stamp != NULL, "localtime() failed");
	SFINISH_CHECK(strftime(str_response, 100, str_date_format, tm_change_stamp) != 0, "strftime() failed");
	str_response[100] = 0;

	bol_error_state = false;
finish:
	if (bol_error_state) {
		bol_error_state = false;
		client_request->int_response_id = (ssize_t)DArray_end(client_request->arr_response) + 1;
		char str_temp[101] = {0};
		snprintf(str_temp, 100, "%zd", client_request->int_response_id);
		if (errno != 0) {
			SFREE(str_response);
			SFINISH_SNCAT(
				str_response, &int_response_len,
				"messageid = ", (size_t)12,
				client_request->str_message_id, strlen(client_request->str_message_id),
				"\012responsenumber = ", (size_t)18,
				str_temp, strlen(str_temp),
				"\012FATAL\012", (size_t)7,
				"Failed to stat file ", (size_t)16,
				client_file->str_path, strlen(client_file->str_path),
				": ", (size_t)2,
				strerror(errno), strlen(strerror(errno))
			);
		} else {
			char *_str_response = str_response;
			SFINISH_SNCAT(
				str_response, &int_response_len,
				"messageid = ", (size_t)12,
				client_request->str_message_id, strlen(client_request->str_message_id),
				"\012responsenumber = ", (size_t)18,
				str_temp, strlen(str_temp),
				"\012", (size_t)1,
				_str_response, strlen(_str_response)
			);
			SFREE(_str_response);
		}

		WS_sendFrame(EV_A, client_request->parent, true, 0x01, str_response, int_response_len);
		DArray_push(client_request->arr_response, str_response);

		ws_file_free(client_file);
		// client_request_free(client_request);
		// client_request_free takes care of this
		// SFREE(client_file);
	} else {
		client_request->int_response_id += 1;
		char str_temp[101] = {0};
		snprintf(str_temp, 100, "%zd", client_request->int_response_id);
		char *_str_response = str_response;
		SFINISH_SNCAT(
			str_response, &int_response_len,
			"messageid = ", (size_t)12,
			client_request->str_message_id, strlen(client_request->str_message_id),
			"\012responsenumber = ", (size_t)18,
			str_temp, strlen(str_temp),
			"\012", (size_t)1,
			_str_response, strlen(_str_response)
		);
		SFREE(_str_response);
		WS_sendFrame(EV_A, client_request->parent, true, 0x01, str_response, int_response_len);
		DArray_push(client_request->arr_response, str_response);

		client_request->int_response_id += 1;
		memset(str_temp, 0, 101);
		snprintf(str_temp, 100, "%zd", client_request->int_response_id);
		SFINISH_SNCAT(
			str_response, &int_response_len,
			"messageid = ", (size_t)12,
			client_request->str_message_id, strlen(client_request->str_message_id),
			"\012responsenumber = ", (size_t)18,
			str_temp, strlen(str_temp),
			"\012TRANSACTION COMPLETED", (size_t)22
		);
		WS_sendFrame(EV_A, client_request->parent, true, 0x01, str_response, int_response_len);
		DArray_push(client_request->arr_response, str_response);

		str_response = NULL;

		ws_file_free(client_file);
		// client_request_free(client_request);
	}
	return true;
}

// ***************************************************************************************
// ***************************************************************************************
// *************************************** SEARCH ****************************************
// ***************************************************************************************
// ***************************************************************************************

bool ws_file_search_step2(EV_P, void *cb_data, bool bol_group) {
	struct sock_ev_client_request *client_request = cb_data;
	struct sock_ev_client_file *client_file = (struct sock_ev_client_file *)(client_request->vod_request_data);

	DIR *dirp = NULL;
	struct stat *statdata = NULL;
	struct dirent *dp = NULL;
	struct sock_ev_client_request_watcher *client_request_watcher = NULL;

	char *str_response = NULL;
	size_t int_response_len = 0;
	SDEFINE_VAR_ALL(str_canonical_name, str_name, str_path);

	SFINISH_CHECK(bol_group, "You don't have the necessary permissions for this folder.");

	client_file->que_file = Queue_create();
	SFINISH_CHECK(client_file->que_file != NULL, "Queue_create failed");

	if (client_file->bol_regex) {
		int int_err;
		if ((int_err = tre_regcomp(&client_file->reg, client_file->str_search,
				 REG_EXTENDED | (client_file->bol_case_insensitive ? REG_ICASE : 0) | REG_NOSUB | REG_NEWLINE)) != 0) {
			char str_temp[256];
			memset(str_temp, 0, 256);
			tre_regerror(int_err, &client_file->reg, str_temp, 255);
			SFINISH("regcomp failed: %d (%s)", int_err, str_temp);
		}
	}

	if (client_file->bol_recursive) {
		SFINISH_CHECK(canonical_recurse_directory(EV_A, client_file->str_canonical_start, client_file->str_partial_path,
						  client_request, ws_file_search_step3, ws_file_search_step4),
			"canonical_recurse_directory failed");
	} else {
		size_t int_len = strlen(client_file->str_path);
		if (client_file->str_path[int_len - 1] == '\\') {
			client_file->str_path[int_len - 1] = 0;
		}
		SFINISH_CHECK((str_path = canonical(client_file->str_canonical_start, client_file->str_partial_path, "read_dir")),
			"canonical failed");
		dirp = opendir(str_path);
		SFINISH_ERROR_CHECK(dirp != NULL, "opendir failed");

		size_t int_name_len = 0;
		while (dirp) {
			errno = 0;
			if ((dp = readdir(dirp)) != NULL) {
				// dp->d_name
				SFINISH_SNCAT(str_name, &int_name_len, dp->d_name, strlen(dp->d_name));
				if (strncmp(str_name, "..", 3) != 0 && strncmp(str_name, ".", 2) != 0) {
					str_canonical_name = canonical(str_path, str_name, "valid_path");
					SFINISH_CHECK(str_canonical_name != NULL, "canonical failed");
					SFINISH_SALLOC(statdata, sizeof(struct stat));
					stat(str_canonical_name, statdata);

					if (S_ISREG(statdata->st_mode) != 0) {
						Queue_send(client_file->que_file, str_canonical_name);
						str_canonical_name = NULL;
					}
					SFREE(str_canonical_name);
				}
				SFREE(str_name);
				SFREE(statdata);
			} else {
				SFINISH_ERROR_CHECK(errno == 0, "readdir failed");
				// no error, and no file, we've reached the end so close
				closedir(dirp);
				dirp = NULL;
			}
		}

		SFINISH_SALLOC(client_request_watcher, sizeof(struct sock_ev_client_request_watcher));
		client_request_watcher->parent = client_request->parent;

		increment_idle(EV_A);
		ev_check_init(&client_request_watcher->check, ws_file_search_step5);
		ev_check_start(EV_A, &client_request_watcher->check);
	}

	bol_error_state = false;
finish:
	SFREE_ALL();
	if (bol_error_state) {
		bol_error_state = false;
		client_request->int_response_id = (ssize_t)DArray_end(client_request->arr_response) + 1;
		char str_temp[101] = {0};
		snprintf(str_temp, 100, "%zd", client_request->int_response_id);

		char *_str_response = str_response;
		SFINISH_SNCAT(
			str_response, &int_response_len,
			"messageid = ", (size_t)12,
			client_request->str_message_id, strlen(client_request->str_message_id),
			"\012responsenumber = ", (size_t)18,
			str_temp, strlen(str_temp),
			"\012", (size_t)1,
			_str_response, strlen(_str_response)
		);
		SFREE(_str_response);

		WS_sendFrame(EV_A, client_request->parent, true, 0x01, str_response, int_response_len);
		DArray_push(client_request->arr_response, str_response);

		SFREE(client_request_watcher);
		ws_file_free(client_file);
		// client_request_free(client_request);
		// client_request_free takes care of this
		// SFREE(client_file);
	}
	return true;
}

bool ws_file_search_step3(EV_P, void *cb_data, char *_str_file_name) {
	struct sock_ev_client_request *client_request = cb_data;
	struct sock_ev_client_file *client_file = (struct sock_ev_client_file *)(client_request->vod_request_data);
	char *str_response = NULL;
	char *str_file_name = NULL;
	char *ptr_extension = NULL;
	struct stat *statdata = NULL;
	size_t int_response_len = 0;
	size_t int_file_name_len = 0;
	ptr_extension = strrchr(_str_file_name, '.');
	if (ptr_extension != NULL) {
		ptr_extension += 1;
		if (false || strcmp(ptr_extension, "eot") == 0 || strcmp(ptr_extension, "ico") == 0 ||
			strcmp(ptr_extension, "jpg") == 0 || strcmp(ptr_extension, "mov") == 0 || strcmp(ptr_extension, "mp3") == 0 ||
			strcmp(ptr_extension, "otf") == 0 || strcmp(ptr_extension, "pdf") == 0 || strcmp(ptr_extension, "png") == 0 ||
			strcmp(ptr_extension, "pkg") == 0 || strcmp(ptr_extension, "svg") == 0 || strcmp(ptr_extension, "ttf") == 0 ||
			strcmp(ptr_extension, "woff") == 0 || strcmp(ptr_extension, "woff2") == 0 || strcmp(ptr_extension, "zip") == 0) {
			goto finish;
		}
	}

#ifdef _WIN32
	SFINISH_SNCAT(
		str_file_name, &int_file_name_len,
		client_file->str_path, strlen(client_file->str_path),
		"\\", (size_t)1,
		_str_file_name, strlen(_str_file_name)
	);
	SFINISH_SALLOC(statdata, sizeof(struct stat));
	stat(str_file_name, statdata);

	if (S_ISREG(statdata->st_mode) != 0) {
		Queue_send(client_file->que_file, str_file_name);
	}
#else
	SFINISH_SNCAT(
		str_file_name, &int_file_name_len,
		client_file->str_path, strlen(client_file->str_path),
		"/", (size_t)1,
		_str_file_name, strlen(_str_file_name)
	);
	Queue_send(client_file->que_file, str_file_name);
#endif


finish:
	SFREE(statdata);
	if (str_response != NULL) {
		bol_error_state = false;
		client_request->int_response_id = (ssize_t)DArray_end(client_request->arr_response) + 1;
		char str_temp[101] = {0};
		snprintf(str_temp, 100, "%zd", client_request->int_response_id);

		char *_str_response = str_response;
		SFINISH_SNCAT(
			str_response, &int_response_len,
			"messageid = ", (size_t)12,
			client_request->str_message_id, strlen(client_request->str_message_id),
			"\012responsenumber = ", (size_t)18,
			str_temp, strlen(str_temp),
			"\012", (size_t)1,
			_str_response, strlen(_str_response)
		);
		SFREE(_str_response);

		WS_sendFrame(EV_A, client_request->parent, true, 0x01, str_response, int_response_len);
		DArray_push(client_request->arr_response, str_response);

		ws_file_free(client_file);
		// client_request_free(client_request);
		// client_request_free takes care of this
		// SFREE(client_file);
	}
	return true;
}

bool ws_file_search_step4(EV_P, void *cb_data, bool bol_success) {
	struct sock_ev_client_request *client_request = cb_data;
	struct sock_ev_client_file *client_file = (struct sock_ev_client_file *)(client_request->vod_request_data);
	char *str_response = NULL;
	size_t int_response_len = 0;
	struct sock_ev_client_request_watcher *client_request_watcher = NULL;

	SFINISH_CHECK(bol_success, "canonical_recurse failed");

	SFINISH_SALLOC(client_request_watcher, sizeof(struct sock_ev_client_request_watcher));
	client_request_watcher->parent = client_request->parent;

	increment_idle(EV_A);
	ev_check_init(&client_request_watcher->check, ws_file_search_step5);
	ev_check_start(EV_A, &client_request_watcher->check);

finish:
	if (str_response != NULL) {
		bol_error_state = false;
		client_request->int_response_id = (ssize_t)DArray_end(client_request->arr_response) + 1;
		char str_temp[101] = {0};
		snprintf(str_temp, 100, "%zd", client_request->int_response_id);

		char *_str_response = str_response;
		SFINISH_SNCAT(
			str_response, &int_response_len,
			"messageid = ", (size_t)12,
			client_request->str_message_id, strlen(client_request->str_message_id),
			"\012responsenumber = ", (size_t)18,
			str_temp, strlen(str_temp),
			"\012", (size_t)1,
			_str_response, strlen(_str_response)
		);
		SFREE(_str_response);

		WS_sendFrame(EV_A, client_request->parent, true, 0x01, str_response, int_response_len);
		DArray_push(client_request->arr_response, str_response);

		ws_file_free(client_file);
		// client_request_free(client_request);
		// client_request_free takes care of this
		// SFREE(client_file);
	}
	return false;
}

#define MAX_LINE_SIZE (1024 * 1024)
void ws_file_search_step5(EV_P, ev_check *w, int revents) {
	if (revents != 0) {
	} // get rid of unused parameter warning
	struct sock_ev_client_request_watcher *client_request_watcher = (void *)w;
	struct sock_ev_client_request *client_request = client_request_watcher->parent->cur_request;
	struct sock_ev_client_file *client_file = (struct sock_ev_client_file *)(client_request->vod_request_data);
	char *str_response = NULL;
	size_t int_response_len = 0;
	char *str_current_file_name = NULL;
	size_t int_end_pos;
	size_t int_line_length;
	int int_err;
	size_t int_start_pos;
	char *ptr_line = NULL;
	char str_temp[256];
	char *str_line = NULL;
	SDEFINE_VAR_ALL(str_line_copy);
	str_current_file_name = Queue_peek(client_file->que_file);
	memset(str_temp, 0, 101);

	if (client_file->str_line == NULL) {
		SFINISH_SALLOC(client_file->str_line, MAX_LINE_SIZE + 1);
	}
	str_line = client_file->str_line;

	if (str_current_file_name == NULL) {
		client_request->int_response_id = (ssize_t)DArray_end(client_request->arr_response) + 1;
		snprintf(str_temp, 100, "%zd", client_request->int_response_id);

		SFINISH_SNCAT(
			str_response, &int_response_len,
			"messageid = ", (size_t)12,
			client_request->str_message_id, strlen(client_request->str_message_id),
			"\012responsenumber = ", (size_t)18,
			str_temp, strlen(str_temp),
			"\012TRANSACTION COMPLETED", (size_t)22
		);

		WS_sendFrame(EV_A, client_request->parent, true, 0x01, str_response, int_response_len);
		DArray_push(client_request->arr_response, str_response);
		str_response = NULL;

		decrement_idle(EV_A);
		ev_check_stop(EV_A, w);
		SFREE(client_request_watcher);

		ws_file_free(client_file);

	} else if (client_file->fp == NULL) {
		errno = 0;
		SDEBUG("str_current_file_name: %s", str_current_file_name);
		client_file->fp = fopen(str_current_file_name, "r");
		SFINISH_CHECK(client_file->fp != NULL, "failed to open file %s", str_current_file_name);
		client_file->int_line_number = 1;
	} else {
		errno = 0;
		int_start_pos = (size_t)ftell(client_file->fp);
		ptr_line = fgets(str_line, MAX_LINE_SIZE, client_file->fp);

		// end of file
		if (ptr_line == NULL) {
			Queue_recv(client_file->que_file);
			SFREE(str_current_file_name);
			fclose(client_file->fp);
			client_file->fp = NULL;

			SFINISH_CHECK(errno == 0 || errno == EISDIR, "fgets failed");
			goto finish;

			// we have a line
		} else {
			int_end_pos = (size_t)ftell(client_file->fp);
			int_line_length = int_end_pos - int_start_pos;

			// commented because we had a file that was excluded we did not want to be excluded
			/*if (strlen(str_line) < int_line_length) {
				// binary file, skip
				Queue_recv(client_file->que_file);
				SFREE(str_current_file_name);
				fclose(client_file->fp);
				client_file->fp = NULL;
				goto finish;
			}*/

			bool bol_match = false;
			if (!client_file->bol_regex) {
				SFINISH_SNCAT(
					str_line_copy, &int_line_length,
					str_line, int_line_length
				);
				if (client_file->bol_case_insensitive) {
					bstr_toupper(str_line_copy, int_line_length);
					bstr_toupper(client_file->str_search, strlen(client_file->str_search));
				}
				bol_match = strstr(str_line_copy, client_file->str_search) != NULL;
			} else {
				int_err = tre_regexec(&client_file->reg, str_line, 0, NULL, 0);
				if (int_err != 0 && int_err != 1) {
					memset(str_temp, 0, 256);
					tre_regerror(int_err, &client_file->reg, str_temp, 255);
					SFINISH("regexec failed: %d (%s)", int_err, str_temp);
				}
				bol_match = int_err == 0;
			}

			if (bol_match) {
				client_request->int_response_id = (ssize_t)DArray_end(client_request->arr_response) + 1;
				snprintf(str_temp, 100, "%zd", client_request->int_response_id);

				SFINISH_SNCAT(
					str_response, &int_response_len,
					"messageid = ", (size_t)12,
					client_request->str_message_id, strlen(client_request->str_message_id),
					"\012responsenumber = ", (size_t)18,
					str_temp, strlen(str_temp),
					"\012", (size_t)1,
					str_current_file_name + strlen(client_file->str_path), strlen(str_current_file_name) - strlen(client_file->str_path),
					":", (size_t)1
				);

				snprintf(str_temp, 100, "%zd", client_file->int_line_number);

				SFINISH_SNFCAT(
					str_response, &int_response_len,
					str_temp, strlen(str_temp),
					":", (size_t)1,
					str_line, int_line_length
				);

				WS_sendFrame(EV_A, client_request->parent, true, 0x01, str_response, int_response_len);
				DArray_push(client_request->arr_response, str_response);
				str_response = NULL;
			}

			client_file->int_line_number += 1;
		}
	}

finish:
	SFREE_ALL();
	if (str_response != NULL) {
		bol_error_state = false;
		client_request->int_response_id = (ssize_t)DArray_end(client_request->arr_response) + 1;
		memset(str_temp, 0, 101);
		snprintf(str_temp, 100, "%zd", client_request->int_response_id);

		char *_str_response = str_response;
		SFINISH_SNCAT(
			str_response, &int_response_len,
			"messageid = ", (size_t)12,
			client_request->str_message_id, strlen(client_request->str_message_id),
			"\012responsenumber = ", (size_t)18,
			str_temp, strlen(str_temp),
			"\012", (size_t)1,
			_str_response, strlen(_str_response)
		);
		SFREE(_str_response);

		WS_sendFrame(EV_A, client_request->parent, true, 0x01, str_response, int_response_len);
		DArray_push(client_request->arr_response, str_response);

		decrement_idle(EV_A);
		ev_check_stop(EV_A, w);
		SFREE(client_request_watcher);

		ws_file_free(client_file);
		// client_request_free(client_request);
		// client_request_free takes care of this
		// SFREE(client_file);
	}
}

void ws_file_free(struct sock_ev_client_file *to_free) {
	SFREE(to_free->str_input_path);
	SFREE(to_free->str_partial_path);
	SFREE(to_free->str_canonical_start);
	SFREE(to_free->str_path);
	SFREE(to_free->str_search);
	SFREE(to_free->str_input_path_to);
	SFREE(to_free->str_partial_path_to);
	SFREE(to_free->str_canonical_start_to);
	SFREE(to_free->str_path_to);
	SFREE(to_free->str_content);
	SFREE(to_free->str_change_stamp);
	size_t int_i, int_len;
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
	if (to_free->arr_contents != NULL) {
		for (int_i = 0, int_len = DArray_end(to_free->arr_contents); int_i < int_len; int_i += 1) {
			struct list_dirent_ent *ent = DArray_get(to_free->arr_contents, int_i);
			SFREE(ent->str_name);
			SFREE(ent);
		}
		DArray_destroy(to_free->arr_contents);
		to_free->arr_contents = NULL;
	}
	if (to_free->que_file) {
		Queue_clear_destroy(to_free->que_file);
		to_free->que_file = NULL;
	}
	tre_regfree(&to_free->reg);
	SFREE(to_free->str_line);
}
#endif
