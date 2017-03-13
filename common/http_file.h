#pragma once

#include "http_main.h"
#include <time.h>

struct sock_ev_client_http_file {
	ev_io io;

	char *str_uri;
	size_t int_uri_len;
	char *str_uri_part;
	size_t int_uri_part_len;
#ifdef _WIN32
	HANDLE h_file;
#else
	int int_file_fd;
#endif
	size_t int_response_header_len;
	size_t int_response_len;
	ssize_t int_read;
	ssize_t int_read_len;
	bool bol_download;
	size_t int_written;

	struct sock_ev_client *parent;
};

/*
This is the interface function for this request

When you call this function, it parses the request to figure out:
1. what file needs to be opened
2. whether or not we are downloading it
Then it opens the file.
*/
void http_file_step1(struct sock_ev_client *client);

void http_file_step15_envelope(EV_P, void *cb_data, bool bol_group);

/*
This function is run once when the file is opened and has data ready for us

What it does, is get the length and change stamp of the file, then setup the
next step for reading
*/
void http_file_step2(EV_P, ev_check *w, int revents);

/*
This function is run whenever the file has data ready for us

What it does, is read as much as it can at once, then return control back to the
event loop
Once it has finished reading the file, it will set up the write callback on the
socket
*/
void http_file_step3(EV_P, ev_check *w, int revents);

/*
This function is run whenever the socket is ready for us to send data

What it does, is write as much as it can to the socket, then return control back
to the event loop
Once it has finished writing, it free()s the data associated with this request
*/
void http_file_write_cb(EV_P, ev_io *w, int revents);

/*
This function free()s everything inside an http_file struct
*/
void http_file_free(struct sock_ev_client_http_file *client_http_file);
