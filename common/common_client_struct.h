#pragma once

#include "db_framework.h"
#include "util/util_darray.h"
#include "util/util_list_queue.h"
#include <arpa/inet.h>
#include <ev.h>

#ifdef POSTAGE_INTERFACE_LIBPQ
typedef bool (*sock_ev_client_query_callback_function)(EV_P, PGresult *, ExecStatusType, struct sock_ev_client_request *);
#else
typedef bool (*sock_ev_client_query_callback_function)(EV_P, void *, int, struct sock_ev_client_request *);
#endif

struct sock_ev_client_query_callback_watcher {
	ev_io io;
	struct sock_ev_client_request *client_request;
	sock_ev_client_query_callback_function callback;
};

#define cnxn conn->conn

#ifdef _WIN32
#undef close
#define close _close
#else
#ifndef SOCKET
#define UNDEF_SOCKET
#define SOCKET int
#endif
#endif

#define GET_CLIENT_PQ_SOCKET(A) A->conn->int_sock

/*
This header is just a bunch of structs to represent the client
*/

struct sock_ev_client_cnxn {
	ev_io io;

	struct sock_ev_client *parent;
};

struct sock_ev_client_timeout_prepare {
	ev_prepare prepare;

	ev_tstamp close_time;

	struct sock_ev_client *parent;
};
#define client_timeout_prepare_free(A)                                                                                           \
	_client_timeout_prepare_free(A);                                                                                             \
	A = NULL;
void _client_timeout_prepare_free(struct sock_ev_client_timeout_prepare *client_timeout_prepare);

struct sock_ev_client_paused_request {
	ev_watcher *watcher;
	int revents;
	bool bol_is_db_framework;
};
void client_paused_request_free(struct sock_ev_client_paused_request *client_paused_request);

struct sock_ev_client_request_watcher {
	ev_check check;

	struct sock_ev_client *parent;
};

struct sock_ev_client_notify_watcher {
	ev_io io;

	struct sock_ev_client *parent;
};

typedef struct WSFrame {
	uint64_t int_length;
	uint16_t int_orig_length;
	int int_opcode;
	bool bol_fin;
	bool bol_mask;
	char *str_mask;
	char *str_message;
	struct sock_ev_client *parent;
	void (*cb)(EV_P, struct WSFrame *);
} WSFrame;

struct sock_ev_client_message {
	ev_io io;
	WSFrame *frame;
	bool bol_have_header;
	uint64_t int_message_header_length;
	uint64_t int_length;
	uint64_t int_written;
	uint64_t int_position;
	uint64_t int_message_num;
};

struct sock_ev_client {
	ev_io io;

	connect_cb_t connect_cb;

	bool bol_is_open;
	bool bol_socket_is_open;

	char *str_username;
	char *str_database;
	char *str_connname;
	char *str_connname_folder;
	char *str_conn;
	char *str_cookie;
	char *str_cookie_name;

	size_t int_username_len;
	size_t int_database_len;
	size_t int_connname_len;
	size_t int_connname_folder_len;
	size_t int_conn_len;

	ListNode *node;
	ssize_t int_last_activity_i;
	char str_client_ip[INET_ADDRSTRLEN];
	bool bol_handshake;
	bool bol_connected;

	bool bol_public;

	bool bol_upload;
	char *str_boundary;
	size_t int_boundary_length;

	char *str_request;
	char *str_response;

	SOCKET _int_sock;
#define GET_CLIENT_SOCKET(A) A->int_sock
	int int_sock;
	struct sock_ev_serv *server;
	struct tls *tls_postage_io_context;
	bool bol_fast_close;

	char *str_message;
	char *str_notice;

	Queue *que_message;

	struct sock_ev_client_timeout_prepare *client_timeout_prepare;
	struct sock_ev_client_paused_request *client_paused_request;

	DB_conn *conn;

	struct sock_ev_client_request *cur_request;
	Queue *que_request;
	struct sock_ev_client_request_watcher *client_request_watcher;
	struct sock_ev_client_request_watcher *client_request_watcher_search;
	struct sock_ev_client_copy_check *client_copy_check;
	struct sock_ev_client_copy_io *client_copy_io;
	bool bol_request_in_progress;

	struct sock_ev_client_notify_watcher *notify_watcher;
	struct sock_ev_client_cnxn *reconnect_watcher;

	size_t int_request_len;
};

enum {
	POSTAGE_REQ_SELECT = 0,
	POSTAGE_REQ_INSERT,
	POSTAGE_REQ_UPDATE,
	POSTAGE_REQ_DELETE,
	POSTAGE_REQ_BEGIN,
	POSTAGE_REQ_COMMIT,
	POSTAGE_REQ_ROLLBACK,
	POSTAGE_REQ_RAW,
#ifdef ENVELOPE
	POSTAGE_REQ_FILE,
#else
	POSTAGE_REQ_TAB,
#endif
	POSTAGE_REQ_INFO,
	POSTAGE_REQ_ACTION,
	POSTAGE_REQ_ACCEPT,
	POSTAGE_REQ_AUTH,
	POSTAGE_REQ_STANDARD
};

struct sock_ev_client_request {
	ev_check check;
	struct sock_ev_client *parent;
	struct sock_ev_client_query_callback_watcher *cb_data;

	WSFrame *frame;
	char *str_message_id;
	char *str_transaction_id;
	char *ptr_query;
	DArray *arr_query;
	ssize_t int_response_id;
	DArray *arr_response;
	ssize_t int_i;
	ssize_t int_len;
#ifdef POSTAGE_INTERFACE_LIBPQ
	PGresult *res;
#endif

	void *vod_request_data;
	size_t int_req_type;

	// copy out stuff goes here
	size_t int_num_rows;
	size_t int_row_num;
	size_t int_current_response_length;
	char *str_current_response;
};

struct sock_ev_client_copy_check {
	ev_check check;

	DB_result *res;
	size_t int_i;
	size_t int_len;
	ssize_t int_response_len;
	ssize_t int_written;
	char *str_response;
	struct sock_ev_client_request *client_request;
};

struct sock_ev_client_copy_io {
	ev_io io;

	struct sock_ev_client_copy_check *client_copy_check;
};

#ifdef _WIN32
#else
#ifdef UNDEF_SOCKET
#undef SOCKET
#endif
#endif
