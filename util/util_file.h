#pragma once

#ifdef _WIN32
#include <windows.h>
#endif

#include "util_canonical.h"
#include "util_darray.h"
#include "util_error.h"
#include "util_idle.h"
#include <dirent.h>
#include <ev.h>

typedef bool (*recursive_step_callback_t)(EV_P, void *cb_data, char *str_path);
typedef bool (*recursive_finish_callback_t)(EV_P, void *cb_data, bool bol_success);

typedef struct {
#ifdef _WIN32
	WIN32_FIND_DATAA find_data;
	HANDLE h_find;
#else
	DIR *dirp;
	struct dirent *dp;
#endif
	char *str_path;
	char *str_partial_path;
	bool bol_done;
} recursive_directory_data;

typedef struct {
	ev_check check;
	void *cb_data;
	DArray *darr_directory;
	char *str_path;
	recursive_step_callback_t step_callback;
	recursive_finish_callback_t finish_callback;
	char *str_canonical_start;
} recursive_callback_data;

bool canonical_recurse_directory(EV_P, char *str_canonical_start, char *str_partial_path, void *cb_data,
	recursive_step_callback_t step_callback, recursive_finish_callback_t finish_callback);

bool canonical_delete(char *str_canonical_start, char *str_partial_path);
bool canonical_move(char *str_canonical_start, char *str_partial_path, char *str_canonical_start_to, char *str_partial_path_to);
char *canonical_read(char *str_base_path, char *str_file_path, size_t *int_ptr_file_length);
bool canonical_write(char *str_base_path, char *str_file_path, char *str_new_content, size_t int_new_content_length);
bool canonical_copy(char *str_canonical_start, char *str_partial_path, char *str_canonical_start_to, char *str_partial_path_to);
