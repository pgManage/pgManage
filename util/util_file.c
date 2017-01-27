#define UTIL_DEBUG
#include "util_file.h"

void canonical_recurse_directory_check_cb(EV_P, ev_check *w, int revents);
void free_recursive_callback_data(recursive_callback_data *rec_data);
void free_recursive_directory_data(recursive_directory_data *dir_data);

bool canonical_recurse_directory(EV_P, char *str_canonical_start, char *str_partial_path, void *cb_data, recursive_step_callback_t step_callback, recursive_finish_callback_t finish_callback) {
	SDEBUG("canonical_recurse_directory");
	recursive_callback_data *rec_data = NULL;
	recursive_directory_data *dir_data = NULL;
	SERROR_SALLOC(rec_data, sizeof(recursive_callback_data));

	rec_data->step_callback = step_callback;
	rec_data->finish_callback = finish_callback;
	rec_data->cb_data = cb_data;
	SERROR_SNCAT(rec_data->str_canonical_start, &rec_data->int_canonical_start_len,
		str_canonical_start, strlen(str_canonical_start));

	rec_data->str_path = canonical(str_canonical_start, str_partial_path, "valid_path");
	SERROR_CHECK(rec_data->str_path != NULL, "canonical failed");
	rec_data->int_path_len = strlen(rec_data->str_path);

	if (rec_data->str_path[strlen(rec_data->str_path) - 1] != '/') {
		SERROR_SNFCAT(rec_data->str_path, &rec_data->int_path_len,
			"/", (size_t)1);
	}

	rec_data->darr_directory = DArray_create(sizeof(recursive_directory_data *), 10);
	SERROR_CHECK(rec_data->darr_directory != NULL, "canonical failed");

	SERROR_SALLOC(dir_data, sizeof(recursive_directory_data));
	DArray_push(rec_data->darr_directory, dir_data);
#ifdef _WIN32
	dir_data->h_find = INVALID_HANDLE_VALUE;
#endif
	SERROR_SNCAT(dir_data->str_partial_path, &dir_data->int_partial_path_len,
		"", (size_t)0);
	SERROR_SNCAT(dir_data->str_path, &dir_data->int_path_len,
		rec_data->str_path, rec_data->int_path_len);

	ev_check_init(&rec_data->check, canonical_recurse_directory_check_cb);
	ev_check_start(EV_A, &rec_data->check);

	increment_idle(EV_A);

	return true;
error:
	free_recursive_callback_data(rec_data);
	return false;
}

void canonical_recurse_directory_check_cb(EV_P, ev_check *w, int revents) {
	if (revents != 0) {
	} // get rid of unused parameter warning
	SDEBUG("################################################################################################");
	SDEBUG("################################################ canonical_recurse_directory_check_cb");
	SDEBUG("################################################################################################");
	recursive_callback_data *rec_data = (recursive_callback_data *)w;
	bool bol_res = true;
	// Get directory we are working on
	size_t int_i = DArray_end(rec_data->darr_directory);

#ifdef _WIN32
	size_t int_path_len = 0;
#endif
	size_t int_partial_path_len = 0;

	if (int_i == 0) {
		rec_data->finish_callback(EV_A, rec_data->cb_data, true);
		decrement_idle(EV_A);
		ev_check_stop(EV_A, &rec_data->check);
		free_recursive_callback_data(rec_data);
		return;
	}
	int_i -= 1;
	recursive_directory_data *dir_data = DArray_get(rec_data->darr_directory, int_i);
	SDEFINE_VAR_ALL(str_path, str_partial_path);

	if (dir_data != NULL && dir_data->bol_done) {
		bol_res = rec_data->step_callback(EV_A, rec_data->cb_data, dir_data->str_partial_path);
		SFREE_ALL();
		if (DArray_end(rec_data->darr_directory) == 0 || bol_res == false) {
			rec_data->finish_callback(EV_A, rec_data->cb_data, false);
			decrement_idle(EV_A);
			ev_check_stop(EV_A, &rec_data->check);
			free_recursive_callback_data(rec_data);
			return;
		}
		DArray_pop(rec_data->darr_directory);
		free_recursive_directory_data(dir_data);
		return;
	}

#ifdef _WIN32
	SDEBUG("dir_data->str_partial_path: %s", dir_data->str_partial_path);
	SDEBUG("dir_data->str_path: %s", dir_data->str_path);
	SERROR_SNCAT(str_path, &int_path_len,
		dir_data->str_path, dir_data->int_path_len,
		"*.*", (size_t)3);
	SERROR_CHECK((dir_data->h_find = FindFirstFileA(str_path, &dir_data->find_data)) != INVALID_HANDLE_VALUE,
		"path not found: %s", str_path);
	do {
		// Find first file will always return "."
		//    and ".." as the first two directories.
		if (strcmp(dir_data->find_data.cFileName, ".") != 0 && strcmp(dir_data->find_data.cFileName, "..") != 0 &&
			strcmp(dir_data->find_data.cFileName, "") != 0) {
			// Is the entity a File or Folder?
			if (dir_data->find_data.dwFileAttributes & FILE_ATTRIBUTE_DIRECTORY) {
				recursive_directory_data *new_dir_data = NULL;
				SERROR_SALLOC(new_dir_data, sizeof(recursive_directory_data));
				new_dir_data->h_find = INVALID_HANDLE_VALUE;
				DArray_push(rec_data->darr_directory, new_dir_data);
				SERROR_SNCAT(new_dir_data->str_partial_path, &new_dir_data->int_partial_path_len,
					dir_data->str_partial_path, dir_data->int_partial_path_len,
					dir_data->find_data.cFileName, strlen(dir_data->find_data.cFileName),
					"\\", (size_t)1);
				SERROR_SNCAT(new_dir_data->str_path, &new_dir_data->int_path_len,
					rec_data->str_path, rec_data->int_path_len,
					new_dir_data->str_partial_path, new_dir_data->int_partial_path_len);

				SDEBUG("Directory: >%s<", dir_data->find_data.cFileName);
			} else {
				SERROR_SNCAT(str_partial_path, &int_partial_path_len,
					dir_data->str_partial_path, dir_data->int_partial_path_len,
					dir_data->find_data.cFileName, strlen(dir_data->find_data.cFileName));
				SDEBUG("File: >%s<", str_partial_path);
				bol_res = rec_data->step_callback(EV_A, rec_data->cb_data, str_partial_path);
				SFREE(str_partial_path);
			}
		}
	} while (bol_res && FindNextFileA(dir_data->h_find, &dir_data->find_data));
#else
	SDEBUG("dir_data->str_partial_path: %s", dir_data->str_partial_path);
	SDEBUG("dir_data->str_path: %s", dir_data->str_path);
	// files and folders
	if (dir_data->dirp == NULL) {
		dir_data->dirp = opendir(dir_data->str_path);
		SERROR_CHECK(dir_data->dirp != NULL, "opendir failed: %d (%s)", errno, strerror(errno));
	}

	while (dir_data->dirp) {
		errno = 0;
		if ((dir_data->dp = readdir(dir_data->dirp)) != NULL) {
			// dir_data->dp->d_name
			if (strncmp(dir_data->dp->d_name, "..", 3) != 0 && strncmp(dir_data->dp->d_name, ".", 2) != 0) {
				SERROR_SNCAT(str_partial_path, &int_partial_path_len,
					dir_data->str_partial_path, dir_data->int_partial_path_len,
					dir_data->dp->d_name, strlen(dir_data->dp->d_name));
				str_path = canonical(rec_data->str_path, str_partial_path, "read_file");
				if (str_path != NULL) {
					SDEBUG("File: >%s<", str_partial_path);
					bol_res = rec_data->step_callback(EV_A, rec_data->cb_data, str_partial_path);
				} else {
					SDEBUG("Directory: >%s|%s<", rec_data->str_path, str_partial_path);
					SFREE(str_global_error);
					str_path = canonical(rec_data->str_path, str_partial_path, "read_dir");
					SERROR_CHECK(str_path != NULL, "canonical failed");
					recursive_directory_data *new_dir_data = NULL;
					SERROR_SALLOC(new_dir_data, sizeof(recursive_directory_data));
					DArray_push(rec_data->darr_directory, new_dir_data);
					SERROR_SNCAT(new_dir_data->str_partial_path, &new_dir_data->int_partial_path_len,
						dir_data->str_partial_path, dir_data->int_partial_path_len,
						dir_data->dp->d_name, strlen(dir_data->dp->d_name),
						"/", (size_t)1);
					SERROR_SNCAT(new_dir_data->str_path, &new_dir_data->int_path_len,
						rec_data->str_path, rec_data->int_path_len,
						new_dir_data->str_partial_path, new_dir_data->int_partial_path_len);

					SDEBUG("Directory: >%s|%s<", new_dir_data->str_path, new_dir_data->str_partial_path);
				}
				SFREE(str_path);
				SFREE(str_partial_path);
			}

		} else {
			SERROR_CHECK(errno == 0, "opendir error: %d (%s)", errno, strerror(errno));
			// no error, and no file, we've reached the end so close
			closedir(dir_data->dirp);
			dir_data->dirp = NULL;
		}
	}
#endif
	dir_data->bol_done = true;
	// bol_res = rec_data->step_callback(rec_data->cb_data, dir_data->str_path);
	if (DArray_end(rec_data->darr_directory) == 0 || bol_res == false) {
		rec_data->finish_callback(EV_A, rec_data->cb_data, bol_res);
		decrement_idle(EV_A);
		ev_check_stop(EV_A, &rec_data->check);
		free_recursive_callback_data(rec_data);
		SFREE_ALL();
		return;
	}

	SFREE_ALL();
	return;
error:
	SFREE_ALL();
	rec_data->finish_callback(EV_A, rec_data->cb_data, false);
	decrement_idle(EV_A);
	ev_check_stop(EV_A, &rec_data->check);
	free_recursive_callback_data(rec_data);
	return;
}

bool canonical_delete(char *str_canonical_start, char *str_partial_path) {
	SDEFINE_VAR_ALL(str_path);

	str_path = canonical(str_canonical_start, str_partial_path, "read_file");
	if (str_path != NULL) {
		SERROR_CHECK(unlink(str_path) == 0, "unlink failed");
	} else {
		SFREE(str_global_error);
		str_path = canonical(str_canonical_start, str_partial_path, "read_dir");
		SERROR_CHECK(str_path != NULL, "canonical failed");
		SERROR_CHECK(rmdir(str_path) == 0, "rmdir failed");
	}

	SFREE_ALL();
	return true;
error:
	SFREE_ALL();
	return false;
}

bool canonical_move(char *str_canonical_start, char *str_partial_path, char *str_canonical_start_to, char *str_partial_path_to) {
	SDEFINE_VAR_ALL(str_path, str_path_to);

	str_path = canonical(str_canonical_start, str_partial_path, "read_file");
	if (str_path == NULL) {
		SFREE(str_global_error);
		str_path = canonical(str_canonical_start, str_partial_path, "read_dir");
		SERROR_CHECK(str_path != NULL, "canonical failed");
	}

	str_path_to = canonical(str_canonical_start_to, str_partial_path_to, "read_file");
	if (str_path_to == NULL) {
		SFREE(str_global_error);
		str_path_to = canonical(str_canonical_start_to, str_partial_path_to, "read_dir");
		SERROR_CHECK(str_path_to != NULL, "canonical failed");
	}

	SERROR_CHECK(rename(str_path, str_path_to) == 0, "rename failed");

	SFREE_ALL();
	return true;
error:
	SFREE_ALL();
	return false;
}

char *canonical_read(char *str_base_path, char *str_file_path, size_t *int_ptr_file_length) {
	SNOTICE("FILE.C READ FILE");
	//// Make sure path exists and is canonical
	char *str_return = NULL;
	FILE *fp = NULL;
	SDEFINE_VAR_ALL(str_canonical_path);

	str_canonical_path = canonical(str_base_path, str_file_path, "read_file");
	SERROR_CHECK(str_canonical_path != NULL, "Failed to get canonical path: %s %s", str_base_path, str_file_path);

	//// Open file
	fp = fopen(str_canonical_path, "r");
	SERROR_CHECK(fp != NULL, "Failed to open %s for reading: %d (%s)", str_canonical_path, errno, strerror(errno));

	//// Get file length
	fseek(fp, 0, SEEK_END);
	*int_ptr_file_length = (size_t)ftell(fp);
	fseek(fp, 0, SEEK_SET);

	//// Read file into variable
	SERROR_SALLOC(str_return, *int_ptr_file_length + 1);
	fread(str_return, 1, *int_ptr_file_length, fp);
	str_return[*int_ptr_file_length] = '\0';

	//// Clean up variables and return
	SERROR_CHECK(!fclose(fp), "Error closing file: %d (%s).", errno, strerror(errno));
	fp = NULL;

	SFREE(str_canonical_path);

	SINFO("FILE.C READ FILE END");
	SFREE_ALL();
	return str_return;
error:
	if (fp != NULL)
		fclose(fp);
	SFREE_ALL();
	SFREE(str_return);
	return NULL;
}

bool canonical_write(char *str_base_path, char *str_file_path, char *str_new_content, size_t int_new_content_length) {
	SNOTICE("FILE.C WRITE FILE");
	SDEFINE_VAR_ALL(str_canonical_path);
	//// Make sure path exists and is canonical
	FILE *fp = NULL;
	str_canonical_path = canonical(str_base_path, str_file_path, "write_file");
	SDEBUG("Writing to %s (%s|%s)", str_canonical_path, str_base_path, str_file_path);
	SERROR_CHECK(str_canonical_path != NULL, "Failed to get canonical path: %s %s, %d: (%s)", str_base_path, str_file_path, errno,
		strerror(errno));

	//// Open file
	fp = fopen(str_canonical_path, "w");
	SERROR_CHECK(fp != NULL, "Failed to open %s for writing.", str_canonical_path);

	//// Write content
	SERROR_CHECK(!((fwrite(str_new_content, 1, int_new_content_length, fp) == 0 && int_new_content_length > 0) || ferror(fp)),
		"Error writing to file: %d \"%s\".\n", errno, strerror(errno));

	SERROR_CHECK(!fclose(fp), "Error closing file: %d (%s).", errno, strerror(errno));
	fp = NULL;

	//// Clean up variables
	SFREE(str_canonical_path);

	SINFO("FILE.C WRITE FILE END");

	SFREE_ALL();

	return true;
error:
	if (fp != NULL)
		fclose(fp);
	SFREE_ALL();
	return false;
}

bool canonical_copy(char *str_canonical_start, char *str_partial_path, char *str_canonical_start_to, char *str_partial_path_to) {
	SNOTICE("FILE.C COPY FILE");
	size_t int_content_length = 0;
	// TODO: possible optimize this, read 255 chars from file, then write, etc
	// probably only do that if we have a salloc error from this function
	SDEFINE_VAR_ALL(str_content, str_path, str_path_to);

	str_path = canonical(str_canonical_start, str_partial_path, "read_file");
	SERROR_CHECK(str_path != NULL, "Path from does not exist. %s %s", str_canonical_start, str_partial_path);
	SFREE(str_path);

	str_path_to = canonical(str_canonical_start_to, str_partial_path_to, "read_file");
	SERROR_CHECK(str_path_to == NULL, "Path to already exists. %s %s", str_canonical_start_to, str_partial_path_to);

	str_content = canonical_read(str_canonical_start, str_partial_path, &int_content_length);
	SERROR_CHECK(str_content != NULL, "canonical_read_file failed");
	bool bol_result = canonical_write(str_canonical_start_to, str_partial_path_to, str_content, int_content_length);
	SFREE(str_content);

	SINFO("FILE.C COPY FILE END");
	SFREE_ALL();
	return bol_result;
error:
	SFREE_ALL();
	return false;
}

void free_recursive_callback_data(recursive_callback_data *rec_data) {
	size_t int_i = 0, int_len = DArray_end(rec_data->darr_directory);
	for (; int_i < int_len; int_i += 1) {
		free_recursive_directory_data(DArray_get(rec_data->darr_directory, int_i));
	}
	DArray_destroy(rec_data->darr_directory);
	SFREE(rec_data->str_canonical_start);
	SFREE(rec_data->str_path);
	SFREE(rec_data);
}

void free_recursive_directory_data(recursive_directory_data *dir_data) {
	if (dir_data != NULL) {
#ifdef _WIN32
		if (dir_data->h_find != INVALID_HANDLE_VALUE) {
			FindClose(dir_data->h_find);
		}
#else
		if (dir_data->dirp != NULL) {
			closedir(dir_data->dirp);
			dir_data->dirp = NULL;
		}
#endif
		SFREE(dir_data->str_partial_path);
		SFREE(dir_data->str_path);
		SFREE(dir_data);
	}
}
