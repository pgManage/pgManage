#pragma once

#include <errno.h>
#include <fcntl.h>
#include <stdlib.h>
#include <string.h>

#include <arpa/inet.h>
#include <netdb.h>
#include <netinet/in.h>
#include <sys/socket.h>
#include <sys/types.h>

#include <ev.h>

#include "db_framework.h"

#include <unistd.h>

#ifdef _WIN32
#else
#define SOCKET int
#define INVALID_SOCKET -1
#endif

#include "common_ssl.h"
#include "common_client.h"
#include "common_config.h"
#include "http_main.h"
#include "util_darray.h"
#include "util_request.h"

// 1MB
#define MAX_BUFFER 1048576

extern struct ev_loop *global_loop;
extern bool bol_tls;
extern struct sock_ev_serv _server;

/*
This function sets the non-blocking flag on a socket
*/
int setnonblock(SOCKET int_sock);
/*
This function is called every time the listening socket has a connection ready

It will create a client struct for every accept()ed socket.
*/
void server_cb(EV_P, ev_io *w, int revents);

struct sock_ev_client_last_activity {
	char str_client_ip[INET_ADDRSTRLEN];
	char *str_cookie;
	ev_tstamp last_activity_time;
};
/*
This function free()s everything inside a client_last_activity struct
*/
void client_last_activity_free(struct sock_ev_client_last_activity *client_last_activity);

struct sock_ev_serv {
	ev_io io;
	bool bol_tls;
	SOCKET int_sock;
	List *list_client;
	DArray *arr_client_last_activity;
	SSL_CTX *ssl_ctx;
};

//#define _close(A) SDEBUG("_close(%s (%d))", #A, A); _close(A);
//#define close(A) SDEBUG("close(%s (%d))", #A, A); close(A);
