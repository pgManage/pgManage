#pragma once

#include <stdbool.h>

#include <arpa/inet.h>
#include <ev.h>
#include <inttypes.h>
#include <stdint.h>
#include <unistd.h>

#include "common_ssl.h"
#include "common_client_struct.h"
#include "db_framework.h"

#include "http_main.h"
#include "ws_delete.h"
#include "ws_insert.h"
#include "ws_select.h"
#include "ws_update.h"
#include "ws_raw.h"
#include "ws_tab.h"
#include "common_auth.h"
#include "common_server.h"
#include "common_websocket.h"

/*
This function will:
1. get the notices from the client struct (see pgmanage_client.c around line 15)
and send them to the client
2. ask libpq for notify messages and send them to the client
*/
void _send_notices(struct sock_ev_client *client);
#define send_notices(A)                                                                                                          \
	SDEBUG("send_notices(%p)", A);                                                                                               \
	_send_notices(A);

/*
This function handles notices from libpq
*/
void notice_processor(void *arg, const char *str_notice);
/*
This function is run when we have data on the libpq socket, but we don't have
request running
All it does is consume the data then parse any notifies we got
*/
void client_notify_cb(EV_P, ev_io *w, int revents);

/*
This function is run when we have data on the client socket

If we haven't received the headers yet, it reads them

When we have all of the headers, it figures out if it is a plain http request,
or a websocket handshake
In the case of an http request, it just calls http_main (see http_main.c)
In the case of a handshake:
1. determine if we are recovering another session
  - if so, we need to move the request structures and postgresql connection of
the old session into the new one
2. start the connection to the database

If we know we already have the handshake, we read a frame with client_frame_cb
as the callback
*/
void client_cb(EV_P, ev_io *w, int revents);
/*
This function parses a websocket frame into a request structure and adds it to
the queue
*/
void client_frame_cb(EV_P, WSFrame *frame);

/*
This functions sends all messages from a certain point
		(when we recover a session, the client tells us what the first message
		 they didn't get was, and we send from that point)
*/
void client_send_from_cb(EV_P, ev_check *w, int revents);

/*
This function allocates space for a client_request struct then
	initializes it to have the frame, messageid, transactionid, type, and
request string
*/
struct sock_ev_client_request *create_request(struct sock_ev_client *client, WSFrame *frame, char *str_message_id,
	char *str_transaction_id, char *ptr_query, size_t siz_data, size_t int_req_type, sock_ev_client_request_data_free_func free_func);

/*
This function free()s the memory associated with a client_request struct and
it's members
*/
#define client_request_free(A)                                                                                                   \
	SDEBUG("client_request_free(%p)", (A));                                                                                      \
	_client_request_free(A)
void _client_request_free(struct sock_ev_client_request *client_request);

/*
This function check to see if we are ready to handle another request, and if we
can it fires of the next request
*/
void client_request_queue_cb(EV_P, ev_check *w, int revents);

/*
This function finishes the postgresql connection we started in client_cb
*/
void cnxn_cb(EV_P, void *cb_data, DB_conn *conn);

/*
This function concatinates the group list and sends the info responses
*/
bool ws_client_info_cb(EV_P, void *cb_data, DB_result *res);

/*
This function finishes up BEGIN, COMMIT, and ROLLBACK requests
*/
bool client_cmd_cb(EV_P, void *cb_data, DB_result *res);

#ifdef _WIN32
// Windows won't let us do it though...
#define socket_is_open _socket_is_open
#else
/*
This macro makes it easier to debug the socket_is_open function
*/
#define socket_is_open(S)                                                                                                        \
	({                                                                                                                           \
		SDEBUG("Checking if socket %d is open", S);                                                                              \
		_socket_is_open(S);                                                                                                      \
	})
#endif
/*
This function checks to see if the given socket is still open
*/
bool _socket_is_open(SOCKET int_sock);

#ifdef _WIN32
// Windows won't let us do it though...
#define close_client_if_needed _close_client_if_needed
#else
/*
This macro makes it easier to debug the close_client_if_needed function
*/
#define close_client_if_needed(C, W, E)                                                                                          \
	({                                                                                                                           \
		SDEBUG("close_client_if_needed(%s, %s, %s);", #C, #W, #E);                                                               \
		_close_client_if_needed(C, W, E);                                                                                        \
	})
#endif
/*
This function checks to see if the given client is still open,
if it is closed, it pauses the watcher and stores it for if we recover this
session
then calls client_close
*/
bool _close_client_if_needed(struct sock_ev_client *client, ev_watcher *watcher, int revents);

/*
This function closes the socket to the browser and
  - if it is a websocket start a timer for 30 seconds to call
client_close_immediate
  - if it is not a websocket call client_close_immediate
*/
bool client_close(struct sock_ev_client *client);
/*
This function checks if 30 seconds have passed
	- when it has been 30 seconds, call client_close_immediate
*/
void client_close_timeout_prepare_cb(EV_P, ev_prepare *w, int revents);
/*
This function free()s a client struct and it's members
*/
void client_close_immediate(struct sock_ev_client *client);
/*
These macros makes debugging client_close easier
*/
#define SERROR_CLIENT_CLOSE_NORESPONSE(C)                                                                                        \
	SINFO("**************************************Closing client %p %s", C, C->str_session_id);                                   \
	SERROR_CHECK_NORESPONSE(client_close(C), "Error closing Client");                                                            \
	C = NULL;
#define SERROR_CLIENT_CLOSE(C)                                                                                                   \
	SINFO("**************************************Closing client %p %s", C, C->str_session_id);                                   \
	SERROR_CHECK(client_close(C), "Error closing Client");                                                                       \
	C = NULL;
#define SFINISH_CLIENT_CLOSE(C)                                                                                                  \
	SINFO("**************************************Closing client %p %s", C, C->str_session_id);                                   \
	SFINISH_CHECK(client_close(C), "Error closing Client");                                                                      \
	C = NULL;
