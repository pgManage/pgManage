#pragma once

#include <dirent.h>

#include "common_client.h"
#include "common_websocket.h"

#ifdef _WIN32
#include "util/util_strptime.h"
#undef rename
#endif

struct sock_ev_client_tab {
	struct sock_ev_client_request_data self;

	char *str_path;
	char *str_path_to;
	time_t int_change_stamp;
	char *ptr_content;
	char *str_content;
	char *str_change_stamp;
#ifdef _WIN32
	HANDLE h_file;
#else
	int int_fd;
#endif
	ssize_t int_read;
	ssize_t int_written;
	ssize_t int_length;
	DArray *arr_contents;
};

/*
The documentation for this file is a little different due to the branching of
the request

So we are just showing what all of a request's steps look like, then all of the
functions
*/

void ws_tab_step1(struct sock_ev_client_request *client_request);

/*
********************************** REQUEST FORMAT
************************************
TAB\tLIST\t<path>
********************************** STEP OVERVIEW
*************************************
Step 1:
		make sure path is a directory
		run step 2

Step 2:
		open directory for reading
		loop through objects in directory and add them to array
		qsort array
		respond array
*/

void ws_tab_list_step2(EV_P, struct sock_ev_client_request *client_request);

/*
********************************** REQUEST FORMAT
************************************
TAB\tREAD\t<path>
********************************** STEP OVERVIEW
*************************************
Step 1:
		make sure path is a file

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

void ws_tab_read_step2(EV_P, struct sock_ev_client_request *client_request);
void ws_tab_read_step3(EV_P, ev_check *w, int revents);
void ws_tab_read_step4(EV_P, struct sock_ev_client_request *client_request);

/*
********************************** REQUEST FORMAT
************************************
TAB\tWRITE\t<path>\t<change stamp>
<contents of file>
********************************** STEP OVERVIEW
*************************************
Step 1:
		if there is a change stamp, format it
		make sure it is a file if it already exists

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

void ws_tab_write_step2(EV_P, struct sock_ev_client_request *client_request);
void ws_tab_write_step3(EV_P, ev_check *w, int revents);
void ws_tab_write_step4(EV_P, struct sock_ev_client_request *client_request);

/*
********************************** REQUEST FORMAT
************************************
TAB\tMOVE\t<path from>\t<path to>
********************************** STEP OVERVIEW
*************************************
Step 1:
		make sure first path is a file
		make sure second path is valid
		move file

Step 2:
		send new change stamp

*/

void ws_tab_move_step2(EV_P, ev_check *w, int revents);

/*
This function will free the data associated with the client_tab struct
*/
void ws_tab_free(struct sock_ev_client_request_data *client_request_data);
