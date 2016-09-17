#pragma once

#include "common_config.h"
#include "http_main.h"
#include "util/util_request.h"

struct sock_ev_client_upload {
	ev_check check;

#ifdef _WIN32
	HANDLE h_file;
#else
	int int_fd;
#endif
	char *str_canonical_start;
	char *str_file_name;
	char *ptr_content;
	ssize_t int_written;

	sun_upload *sun_current_upload;
	struct sock_ev_client *parent;
};

/*
This is the interface function for this request

When you call this function, it parses the request to figure out:
1. what file will be called
2. the file's contents/length

Then it checks the permissions to the folder you are writing to
*/
void http_upload_step1(struct sock_ev_client *client);

/*
once we know the permissions to the folder,
open the file for writing
*/
bool http_upload_step2(EV_P, void *cb_data, bool bol_group);

/*
This function is run whenever the file is ready to write to

What it does, is write as much as it can at once, then return control back to
the event loop
Once it has finished reading the file, it will free() everything associated with
this request
*/
void http_upload_step3(EV_P, ev_check *w, int revents);

/*
This function free()s everything inside a client_upload struct
*/
void http_upload_free(struct sock_ev_client_upload *to_free);
