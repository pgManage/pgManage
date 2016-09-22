#pragma once

#include "common_client.h"
#include "common_websocket.h"
#include "util/util_exec.h"
#include "util/util_file.h"
#include <dirent.h>
#include "tre/tre.h"

#ifdef _WIN32
#include "util/util_strptime.h"
#undef rename
#endif

typedef enum {
	POSTAGE_FILE_LIST = 0,
	POSTAGE_FILE_READ,
	POSTAGE_FILE_WRITE,
	POSTAGE_FILE_MOVE,
	POSTAGE_FILE_COPY,
	POSTAGE_FILE_DELETE,
	POSTAGE_FILE_CREATE_FILE,
	POSTAGE_FILE_CREATE_FOLDER,
	POSTAGE_FILE_SEARCH
} POSTAGE_FILE_TYPES;
struct sock_ev_client_file {
	char *str_input_path;
	char *str_partial_path;
	char *str_canonical_start;
	char *str_path;
	char *str_input_path_to;
	char *str_partial_path_to;
	char *str_canonical_start_to;
	char *str_path_to;
	time_t int_change_stamp;
	char *str_change_stamp;
	char *ptr_content;
	char *str_content;
	char *str_search;
	bool bol_case_insensitive;
	bool bol_recursive;
	bool bol_regex;
	POSTAGE_FILE_TYPES file_type;
#ifdef _WIN32
	HANDLE h_file;
#else
	int int_fd;
#endif
	ssize_t int_read;
	ssize_t int_written;
	ssize_t int_length;
	DArray *arr_contents;

	regex_t reg;
	Queue *que_file;
	FILE *fp;
	size_t int_line_number;
	char *str_line;
};

/*
The documentation for this file is a little different due to the branching of
the request

So we are just showing what all of a request's steps look like, then all of the
functions
*/

char *ws_file_step1(struct sock_ev_client_request *client_request);

/*
********************************** REQUEST FORMAT
************************************
FILE\tLIST\t<path>
********************************** STEP OVERVIEW
*************************************
Step 1:
		make sure path is a directory
		check for permissions on path

Step 2:
		open directory for reading
		loop through objects in directory and add them to array
		qsort array
		respond array
*/

bool ws_file_list_step2(EV_P, void *cb_data, bool bol_group);

/*
********************************** REQUEST FORMAT
************************************
FILE\tREAD\t<path>
********************************** STEP OVERVIEW
*************************************
Step 1:
		make sure path is a file
		check for permissions on path

Step 2:
		open file
		start reading chunks

Step 3:
		read chunk
		if finished, stop reading and go to step 4

Step 4:
		send response
		close file
*/

bool ws_file_read_step2(EV_P, void *cb_data, bool bol_group);
void ws_file_read_step3(EV_P, ev_check *w, int revents);
void ws_file_read_step4(EV_P, struct sock_ev_client_request *client_request);

/*
********************************** REQUEST FORMAT
************************************
FILE\tWRITE\t<path>\t<change stamp>
<contents of file>
********************************** STEP OVERVIEW
*************************************
Step 1:
		if there is a change stamp, format it
		make sure it is a file if it already exists
		check for permissions on path

Step 2:
		stat file to check change stamp
		open file
		start writing chunks

Step 3:
		write chunk
		if finished, then close file, stop writing and go to step 4

Step 4:
		send new change stamp
*/

bool ws_file_write_step2(EV_P, void *cb_data, bool bol_group);
void ws_file_write_step3(EV_P, ev_check *w, int revents);
void ws_file_write_step4(EV_P, struct sock_ev_client_request *client_request);

/*
********************************** REQUEST FORMAT
************************************
FILE\tMOVE\t<path from>\t<path to>
FILE\tCOPY\t<path from>\t<path to>
********************************** STEP OVERVIEW
*************************************
Step 1:
		make sure first path is a file
		make sure second path is valid
		check for permissions on first path

Step 2:
		check for permissions on second path

Step 3:
		move file
		send new change stamp

*/

bool ws_file_move_step2(EV_P, void *cb_data, bool bol_group);
bool ws_file_move_step3(EV_P, void *cb_data, bool bol_group);
bool ws_file_copy_step4(EV_P, void *cb_data, char *str_path);
bool ws_file_copy_step5(EV_P, void *cb_data, bool bol_success);

/*
********************************** REQUEST FORMAT
************************************
FILE\tDELETE\t<path>
********************************** STEP OVERVIEW
*************************************
Step 1:
		make sure first path is valid
		check for permissions on path

Step 2:
		run canonical_recurse which will call step 3 for each file/directory, then step 4 when it is finished

Step 3:
		Delete a file

Step 4:
		Tell the client success or error

*/

bool ws_file_delete_step2(EV_P, void *cb_data, bool bol_group);
bool ws_file_delete_step3(EV_P, void *cb_data, char *str_path);
bool ws_file_delete_step4(EV_P, void *cb_data, bool bol_success);

/*
********************************** REQUEST FORMAT
************************************
FILE\tCREATE_FILE\t<path>
FILE\tCREATE_FOLDER\t<path>
********************************** STEP OVERVIEW
*************************************
Step 1:
		make sure first path is valid
		check for permissions on path

Step 2:
		remove file
		send new change stamp

*/

bool ws_file_create_step2(EV_P, void *cb_data, bool bol_group);

/*
TODO: document
*/

bool ws_file_search_step2(EV_P, void *cb_data, bool bol_group);
bool ws_file_search_step3(EV_P, void *cb_data, char *str_path);
bool ws_file_search_step4(EV_P, void *cb_data, bool bol_success);
void ws_file_search_step5(EV_P, ev_check *w, int revents);

/*
This function will free the data associated with the client_file struct
*/
void ws_file_free(struct sock_ev_client_file *to_free);
