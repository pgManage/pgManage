#include "http_ev.h"

#ifndef _WIN32
#else
#ifndef EV_SELECT_IS_WINSOCKET
#define EV_SELECT_IS_WINSOCKET 1
#endif
#endif

#define NUMPRI (EV_MAXPRI - EV_MINPRI + 1)
typedef ev_watcher *W;
typedef ev_watcher_list *WL;
typedef ev_watcher_time *WT;
// a heap element
typedef struct {
	ev_tstamp at;
	WT w;
} ANHE;
// file descriptor info structure
typedef struct {
	WL head;
	unsigned char events; // the events watched for
	unsigned char reify;  // flag set when this ANFD needs reification
						  // (NFD_REIFY, EV__IOFDSET)
	unsigned char emask;  // the epoll backend stores the actual kernel mask in here
	unsigned char unused;
#if EV_USE_EPOLL
	unsigned int egen; // generation counter to counter epoll bugs
#endif
#if EV_SELECT_IS_WINSOCKET || EV_USE_IOCP
	SOCKET handle;
#endif
#if EV_USE_IOCP
	OVERLAPPED or, ow;
#endif
} ANFD;
typedef struct {
	W w;
	int events; // the pending event set for the given watcher
} ANPENDING;
struct ev_global_loop {
	ev_tstamp ev_rt_now;
#define ev_rt_now ((global_loop)->ev_rt_now)
#undef VAR
#define VAR(name, decl) decl;
#include "ev_vars.h"
#undef VAR
};

#ifdef _WIN32
void my_invalid_parameter(
	const wchar_t *expression, const wchar_t *function, const wchar_t *file, unsigned int line, uintptr_t pReserved) {
}
#endif

char *cb_to_name(void *cb);

void http_ev_step1(struct sock_ev_client *client) {
	char *str_response = NULL;
	size_t int_response_len = 0;
	size_t int_query_length = 0;
	size_t int_action_length = 0;
	size_t int_w_length = 0;
	struct sock_ev_client_copy_io *client_copy_io = NULL;
	struct sock_ev_client_copy_check *client_copy_check = NULL;
	struct ev_global_loop *_loop = (struct ev_global_loop *)global_loop;
	SDEFINE_VAR_ALL(str_args, str_action, str_w);
	char str_int_i[256] = {0};
	char str_current_address[256] = {0};
	char str_current_priority[256] = {0};
	char str_current_events[256] = {0};
	bool bol_kill = false;
	bool bol_killed = false;

	str_args = query(client->str_request, client->int_request_len, &int_query_length);
	SFINISH_CHECK(str_args != NULL, "query() failed");

	str_action = getpar(str_args, "action", int_query_length, &int_action_length);
	SFINISH_CHECK(str_action != NULL && int_action_length > 0, "Invalid action");
	SDEBUG("str_action: %s", str_action);
	if (strcmp(str_action, "list") == 0) {
		bol_kill = false;
	} else if (strcmp(str_action, "kill") == 0) {
		str_w = getpar(str_args, "w", int_query_length, &int_w_length);
		SFINISH_CHECK(str_w != NULL && int_w_length > 0, "Invalid w");

		bol_kill = true;
	} else {
		SFINISH("Invalid action");
	}

	SFINISH_SALLOC(client_copy_io, sizeof(struct sock_ev_client_copy_io));
	SFINISH_SALLOC(client_copy_check, sizeof(struct sock_ev_client_copy_check));
	client_copy_io->client_copy_check = client_copy_check;

	client->cur_request = create_request(client, NULL, NULL, NULL, NULL, 0, POSTAGE_REQ_STANDARD);
	SFINISH_CHECK(client->cur_request != NULL, "create_request failed!");
	client_copy_check->client_request = client->cur_request;

	SFINISH_SNCAT(client_copy_check->str_response, &int_response_len, "HTTP 200 OK\r\n\r\n", (size_t)15);

	ssize_t pendingpri = NUMPRI - 1;
	while (pendingpri >= 0 && (bol_kill == false || bol_killed == false)) {
		ssize_t int_i = _loop->pendingcnt[pendingpri] - 1;
		while (int_i >= 0 && (bol_kill == false || bol_killed == false)) {
			if (_loop->pendings[pendingpri] == NULL) {
				int_i -= 1;
				continue;
			}

			snprintf(str_current_address, 255, "%p", _loop->pendings[pendingpri][int_i].w);
			snprintf(str_current_priority, 255, "%zu", pendingpri);
			snprintf(str_current_events, 255, "0x%x", _loop->pendings[pendingpri][int_i].events);

			if (bol_kill) {
				if (strcmp(str_current_address, str_w) == 0) {
					ev_check_stop(global_loop, (ev_check *)_loop->pendings[pendingpri][int_i].w);
					bol_killed = true;
				}
			} else {
				char *ptr_cb_name = cb_to_name(_loop->pendings[pendingpri][int_i].w->cb);
				SFINISH_SNFCAT(
					client_copy_check->str_response, &int_response_len,
					"	watcher at ", (size_t)12,
					str_current_address, strlen(str_current_address),
					" with priority ", (size_t)15,
					str_current_priority, strlen(str_current_priority),
					" with callback ", (size_t)15,
					ptr_cb_name, strlen(ptr_cb_name),
					":\n", (size_t)2
				);
				SFINISH_SNFCAT(
					client_copy_check->str_response, &int_response_len,
					"		events: ", (size_t)10,
					str_current_events, strlen(str_current_events),
					"\n", (size_t)1
				);
				SFINISH_SNFCAT(
					client_copy_check->str_response, &int_response_len,
					"			EV_IDLE			: ", (size_t)15,
					_loop->pendings[pendingpri][int_i].events == EV_IDLE ? "true\n" : "false\n", (size_t)(_loop->pendings[pendingpri][int_i].events == EV_IDLE ? 5 : 6)
				);
				SFINISH_SNFCAT(
					client_copy_check->str_response, &int_response_len,
					"			EV_PREPARE		: ", (size_t)17,
					_loop->pendings[pendingpri][int_i].events == EV_PREPARE ? "true\n" : "false\n", (size_t)(_loop->pendings[pendingpri][int_i].events == EV_PREPARE ? 5 : 6)
				);
				SFINISH_SNFCAT(
					client_copy_check->str_response, &int_response_len,
					"			EV_CHECK		: ", (size_t)15,
					_loop->pendings[pendingpri][int_i].events == EV_CHECK ? "true\n\n" : "false\n\n", (size_t)(_loop->pendings[pendingpri][int_i].events == EV_CHECK ? 6 : 7)
				);
			}

			int_i -= 1;
			SDEBUG("client_copy_check->str_response: %s", client_copy_check->str_response);
		}

		pendingpri -= 1;
	}

#ifdef _WIN32
	_invalid_parameter_handler oldHandler = _set_invalid_parameter_handler(my_invalid_parameter);
#endif
	ssize_t int_i = _loop->anfdmax;
	while (int_i >= 0 && (bol_kill == false || bol_killed == false)) {
		ANFD *anfd = &_loop->anfds[int_i];

#ifdef _WIN32
		unsigned long arg = 0;
		if (ioctlsocket(anfd->handle, FIONREAD, &arg) != 0) {
			int_i -= 1;
			continue;
		}
#else
		unsigned long arg = 0;
		// All of our sockets are non-blocking
		if ((fcntl((int)int_i, F_GETFL, &arg) & O_NONBLOCK) == O_NONBLOCK) {
			int_i -= 1;
			continue;
		}
#endif

		ev_io *node = (ev_io *)anfd->head;
		while (node != NULL && (bol_kill == false || bol_killed == false)) {
			snprintf(str_int_i, 255, "%zu", int_i);
			snprintf(str_current_address, 255, "%p", node);
			snprintf(str_current_events, 255, "0x%x", node->events);

			if (bol_kill) {
				if (strcmp(str_current_address, str_w) == 0) {
					ev_io_stop(global_loop, node);
					bol_killed = true;
					break;
				}
			} else {
				char *ptr_cb_name = cb_to_name(node->cb);
				SFINISH_SNFCAT(
					client_copy_check->str_response, &int_response_len,
					"	watcher at ", (size_t)12,
					str_current_address, strlen(str_current_address),
					" on fd ", (size_t)7,
					str_int_i, strlen(str_int_i),
					" with callback ", (size_t)15,
					ptr_cb_name, strlen(ptr_cb_name),
					":\n", (size_t)2
				);
				SFINISH_SNFCAT(
					client_copy_check->str_response, &int_response_len,
					"		events: ", (size_t)10,
					str_current_events, strlen(str_current_events),
					"\n", (size_t)1
				);
				SFINISH_SNFCAT(
					client_copy_check->str_response, &int_response_len,
					"			EV_READ			: ", (size_t)15,
					(node->events & EV_READ) == EV_READ ? "true\n" : "false\n", (size_t)((node->events & EV_READ) == EV_READ ? 5 : 6)
				);
				SFINISH_SNFCAT(
					client_copy_check->str_response, &int_response_len,
					"			EV_WRITE		: ", (size_t)15,
					(node->events & EV_WRITE) == EV_WRITE ? "true\n\n" : "false\n\n", (size_t)((node->events & EV_WRITE) == EV_WRITE ? 6 : 7)
				);
			}

			SDEBUG("client_copy_check->str_response: %s", client_copy_check->str_response);
			node = (ev_io *)((WL)node)->next;
		}
		int_i -= 1;
	}
#ifdef _WIN32
	_set_invalid_parameter_handler(oldHandler);
#endif

	client_copy_check->int_response_len = (ssize_t)int_response_len;

	ev_io_init(&client_copy_io->io, http_ev_step2, GET_CLIENT_SOCKET(client), EV_WRITE);
	ev_io_start(global_loop, &client_copy_io->io);

	bol_error_state = false;
finish:
	if (bol_error_state) {
		bol_error_state = false;

		char *_str_response = str_response;
		char *str_temp =
			"HTTP/1.1 500 Internal Server Error\015\012"
			"Server: " SUN_PROGRAM_LOWER_NAME "\015\012\015\012";
		SFINISH_SNCAT(str_response, &int_response_len, str_temp, strlen(str_temp), _str_response, strlen(_str_response));
		SFREE(_str_response);
	}
	SFREE_ALL();
	ssize_t int_len_response = 0;
	if (str_response != NULL && (int_len_response = CLIENT_WRITE(client, str_response, strlen(str_response))) < 0) {
		SFREE(str_response);
		if (bol_tls) {
			SERROR_NORESPONSE_LIBTLS_CONTEXT(client->tls_postage_io_context, "tls_write() failed");
		} else {
			SERROR_NORESPONSE("write() failed");
		}
		ev_io_stop(global_loop, &client->io);
		SFREE(client->str_request);
		SERROR_CHECK_NORESPONSE(client_close(client), "Error closing Client");
	}
	SFREE(str_response);
}

void http_ev_step2(EV_P, ev_io *w, int revents) {
	if (revents != 0) {
	} // get rid of unused parameter warning
	struct sock_ev_client_copy_io *client_copy_io = (struct sock_ev_client_copy_io *)w;
	struct sock_ev_client_copy_check *client_copy_check = client_copy_io->client_copy_check;
	struct sock_ev_client_request *client_request = client_copy_check->client_request;
	char *str_response = NULL;
	char *_str_response = NULL;

	SDEBUG("client_copy_check->str_response: %s", client_copy_check->str_response);

	ssize_t int_response_len =
		CLIENT_WRITE(client_request->parent, client_copy_check->str_response + client_copy_check->int_written,
			(size_t)(client_copy_check->int_response_len - client_copy_check->int_written));

	SDEBUG("write(%i, %p, %i): %z", client_request->parent->int_sock,
		client_copy_check->str_response + client_copy_check->int_written,
		client_copy_check->int_response_len - client_copy_check->int_written, int_response_len);

	if (int_response_len == -1 && errno != EAGAIN) {
		if (bol_tls) {
			SFINISH_LIBTLS_CONTEXT(client_request->parent->tls_postage_io_context, "tls_write() failed");
		} else {
			SFINISH("write(%i, %p, %i) failed: %i", client_request->parent->int_sock,
				client_copy_check->str_response + client_copy_check->int_written,
				client_copy_check->int_response_len - client_copy_check->int_written, int_response_len);
		}
	} else if (int_response_len == TLS_WANT_POLLIN) {
		ev_io_stop(EV_A, w);
		ev_io_set(w, GET_CLIENT_SOCKET(client_request->parent), EV_READ);
		ev_io_start(EV_A, w);
		bol_error_state = false;
		errno = 0;
		return;

	} else if (int_response_len == TLS_WANT_POLLOUT) {
		ev_io_stop(EV_A, w);
		ev_io_set(w, GET_CLIENT_SOCKET(client_request->parent), EV_WRITE);
		ev_io_start(EV_A, w);
		bol_error_state = false;
		errno = 0;
		return;

	} else {
		// int_response_len can't be negative at this point
		client_copy_check->int_written += (ssize_t)int_response_len;
	}

	if (client_copy_check->int_written == client_copy_check->int_response_len) {
		ev_io_stop(EV_A, w);

		SFREE(client_copy_check->str_response);
		SFREE(client_copy_check);
		SFREE(client_copy_io);

		SDEBUG("DONE");
		struct sock_ev_client *client = client_request->parent;
		SFINISH_CLIENT_CLOSE(client);
		client_request = NULL;
	}

	bol_error_state = false;
finish:
	_str_response = str_response;
	if (bol_error_state) {
		if (client_copy_check != NULL) {
			ev_io_stop(EV_A, w);
			SFREE(client_copy_check->str_response);
			SFREE(client_copy_check);
			SFREE(client_copy_io);
		}
		str_response = NULL;
		bol_error_state = false;

		char *str_temp =
			"HTTP/1.1 500 Internal Server Error\015\012"
			"Server: " SUN_PROGRAM_LOWER_NAME "\015\012\015\012";
		SFINISH_SNCAT(str_response, (size_t *)&int_response_len,
			str_temp, strlen(str_temp),
			_str_response, strlen(_str_response));
		SFREE(_str_response);
	}
	if (str_response != NULL) {
		int_response_len = CLIENT_WRITE(client_request->parent, str_response, strlen(str_response));
		SDEBUG("int_response_len: %d", int_response_len);
		if (int_response_len < 0) {
			if (bol_tls) {
				SERROR_NORESPONSE_LIBTLS_CONTEXT(client_request->parent->tls_postage_io_context, "tls_write() failed");
			} else {
				SERROR_NORESPONSE("write() failed");
			}
		}
		ev_io_stop(EV_A, &client_request->parent->io);
		SFREE(client_request->parent->str_request);
		SDEBUG("ERROR");
		SERROR_CHECK_NORESPONSE(client_close(client_request->parent), "Error closing Client");
	}
	SFREE(str_response);
}

char *cb_to_name(void *cb) {
	// clang-format off
	return
		(cb == http_auth_login_step2) ? "http_auth_login_step2"
		: (cb == http_auth_login_step3) ? "http_auth_login_step3"
		: (cb == http_auth_change_pw_step2) ? "http_auth_change_pw_step2"
		: (cb == http_auth_change_pw_step3) ? "http_auth_change_pw_step3"
		: (cb == http_auth_change_database_step2) ? "http_auth_change_database_step2"
		: (cb == http_file_step2) ? "http_file_step2"
		: (cb == http_file_step3) ? "http_file_step3"
		: (cb == http_file_write_cb) ? "http_file_write_cb"
		: (cb == http_upload_step2) ? "http_upload_step2"
		: (cb == http_upload_step3) ? "http_upload_step3"
		: (cb == client_cb) ? "client_cb"
		: (cb == client_frame_cb) ? "client_frame_cb"
		: (cb == client_send_from_cb) ? "client_send_from_cb"
		: (cb == client_request_queue_cb) ? "client_request_queue_cb"
		: (cb == cnxn_cb) ? "cnxn_cb"
		: (cb == ws_client_info_cb) ? "ws_client_info_cb"
		: (cb == client_cmd_cb) ? "client_cmd_cb"
		: (cb == client_close_timeout_prepare_cb) ? "client_close_timeout_prepare_cb"
		: (cb == server_cb) ? "server_cb"
		: (cb == ws_copy_check_cb) ? "ws_copy_check_cb"
		: (cb == http_copy_check_cb) ? "http_copy_check_cb"
		: (cb == _WS_readFrame) ? "_WS_readFrame"
		: (cb == WS_readFrame_step2) ? "WS_readFrame_step2"
		: (cb == WS_sendFrame) ? "WS_sendFrame"
		: (cb == WS_sendFrame_step2) ? "WS_sendFrame_step2"
		: (cb == ws_delete_step2) ? "ws_delete_step2"
		: (cb == ws_delete_step4) ? "ws_delete_step4"
		: (cb == ws_delete_step5) ? "ws_delete_step5"
		: (cb == ws_delete_step6) ? "ws_delete_step6"
#ifdef ENVELOPE
		: (cb == ws_file_list_step2) ? "ws_file_list_step2"
		: (cb == ws_file_read_step2) ? "ws_file_read_step2"
		: (cb == ws_file_read_step3) ? "ws_file_read_step3"
		: (cb == ws_file_read_step4) ? "ws_file_read_step4"
		: (cb == ws_file_write_step2) ? "ws_file_write_step2"
		: (cb == ws_file_write_step3) ? "ws_file_write_step3"
		: (cb == ws_file_write_step4) ? "ws_file_write_step4"
		: (cb == ws_file_move_step2) ? "ws_file_move_step2"
		: (cb == ws_file_move_step3) ? "ws_file_move_step3"
		: (cb == ws_file_copy_step4) ? "ws_file_copy_step4"
		: (cb == ws_file_copy_step5) ? "ws_file_copy_step5"
		: (cb == ws_file_delete_step2) ? "ws_file_delete_step2"
		: (cb == ws_file_delete_step3) ? "ws_file_delete_step3"
		: (cb == ws_file_delete_step4) ? "ws_file_delete_step4"
		: (cb == ws_file_create_step2) ? "ws_file_create_step2"
		: (cb == ws_file_search_step2) ? "ws_file_search_step2"
		: (cb == ws_file_search_step3) ? "ws_file_search_step3"
#ifndef POSTAGE_INTERFACE_LIBPQ
		: (cb == ws_insert_step15_sql_server) ? "ws_insert_step15_sql_server"
		: (cb == ws_update_step15_sql_server) ? "ws_update_step15_sql_server"
		: (cb == ws_delete_step15_sql_server) ? "ws_delete_step15_sql_server"
#endif
		: (cb == ws_file_search_step4) ? "ws_file_search_step4"
		: (cb == ws_file_search_step5) ? "ws_file_search_step5"
		: (cb == ws_insert_step2) ? "ws_insert_step2"
		: (cb == ws_insert_step4) ? "ws_insert_step4"
		: (cb == ws_insert_step5) ? "ws_insert_step5"
		: (cb == ws_insert_step6) ? "ws_insert_step6"
		: (cb == ws_insert_step7) ? "ws_insert_step7"
		: (cb == http_accept_step2) ? "http_accept_step2"
		: (cb == http_action_step2) ? "http_action_step2"
		: (cb == http_delete_step2) ? "http_delete_step2"
		: (cb == http_delete_step3) ? "http_delete_step3"
		: (cb == http_delete_step4) ? "http_delete_step4"
		: (cb == http_insert_step2) ? "http_insert_step2"
		: (cb == http_insert_step3) ? "http_insert_step3"
		: (cb == http_insert_step4) ? "http_insert_step4"
		: (cb == http_insert_step5) ? "http_insert_step5"
		: (cb == http_insert_step6) ? "http_insert_step6"
		: (cb == http_select_step2) ? "http_select_step2"
		: (cb == http_select_step3) ? "http_select_step3"
		: (cb == http_select_step4) ? "http_select_step4"
		: (cb == http_select_step5) ? "http_select_step5"
		: (cb == http_update_step2) ? "http_update_step2"
		: (cb == http_update_step3) ? "http_update_step3"
		: (cb == http_update_step4) ? "http_update_step4"
		: (cb == http_update_step5) ? "http_update_step5"
		: (cb == canonical_recurse_directory) ? "canonical_recurse_directory"
		: (cb == permissions_check) ? "permissions_check"
		: (cb == permissions_write_check) ? "permissions_write_check"
#else
		: (cb == ws_raw_step2) ? "ws_raw_step2"
		: (cb == ws_raw_step3) ? "ws_raw_step3"
		: (cb == _raw_tuples_callback) ? "_raw_tuples_callback"
		: (cb == _raw_tuples_check_callback) ? "_raw_tuples_check_callback"
		: (cb == ws_tab_list_step2) ? "ws_tab_list_step2"
		: (cb == ws_tab_read_step2) ? "ws_tab_read_step2"
		: (cb == ws_tab_read_step3) ? "ws_tab_read_step3"
		: (cb == ws_tab_read_step4) ? "ws_tab_read_step4"
		: (cb == ws_tab_write_step2) ? "ws_tab_write_step2"
		: (cb == ws_tab_write_step3) ? "ws_tab_write_step3"
		: (cb == ws_tab_write_step4) ? "ws_tab_write_step4"
		: (cb == ws_tab_move_step2) ? "ws_tab_move_step2"
#endif
		: (cb == ws_select_step4) ? "ws_select_step4"
		: (cb == ws_update_step2) ? "ws_update_step2"
		: (cb == ws_update_step4) ? "ws_update_step4"
		: (cb == ws_update_step5) ? "ws_update_step5"
		: (cb == ws_update_step6) ? "ws_update_step6"
		: (cb == DB_connect) ? "DB_connect"
		: (cb == DB_get_column_types_for_query) ? "DB_get_column_types_for_query"
		: (cb == DB_get_column_types) ? "DB_get_column_types"
		: (cb == _increment_idle) ? "_increment_idle"
		: (cb == _decrement_idle) ? "_decrement_idle"
		: (cb == idle_cb) ? "idle_cb"
		: (cb == ddl_readable) ? "ddl_readable"
		: (cb == ev_now) ? "ev_now"
		: (cb == ev_feed_event) ? "ev_feed_event"
		: (cb == ev_feed_fd_event) ? "ev_feed_fd_event"
		: (cb == ev_backend) ? "ev_backend"
		: (cb == ev_iteration) ? "ev_iteration"
		: (cb == ev_depth) ? "ev_depth"
		: (cb == ev_set_io_collect_interval) ? "ev_set_io_collect_interval"
		: (cb == ev_set_timeout_collect_interval) ? "ev_set_timeout_collect_interval"
		: (cb == ev_set_userdata) ? "ev_set_userdata"
		: (cb == ev_userdata) ? "ev_userdata"
		: (cb == ev_set_invoke_pending_cb) ? "ev_set_invoke_pending_cb"
		: (cb == ev_set_loop_release_cb) ? "ev_set_loop_release_cb"
		: (cb == ev_loop_destroy) ? "ev_loop_destroy"
		: (cb == ev_verify) ? "ev_verify"
		: (cb == ev_loop_fork) ? "ev_loop_fork"
		: (cb == ev_invoke) ? "ev_invoke"
		: (cb == ev_pending_count) ? "ev_pending_count"
		: (cb == ev_invoke_pending) ? "ev_invoke_pending"
		: (cb == ev_run) ? "ev_run"
		: (cb == ev_break) ? "ev_break"
		: (cb == ev_ref) ? "ev_ref"
		: (cb == ev_unref) ? "ev_unref"
		: (cb == ev_now_update) ? "ev_now_update"
		: (cb == ev_suspend) ? "ev_suspend"
		: (cb == ev_resume) ? "ev_resume"
		: (cb == ev_clear_pending) ? "ev_clear_pending"
		: (cb == ev_io_start) ? "ev_io_start"
		: (cb == ev_io_stop) ? "ev_io_stop"
		: (cb == ev_timer_start) ? "ev_timer_start"
		: (cb == ev_timer_stop) ? "ev_timer_stop"
		: (cb == ev_timer_again) ? "ev_timer_again"
		: (cb == ev_timer_remaining) ? "ev_timer_remaining"
		: (cb == ev_periodic_start) ? "ev_periodic_start"
		: (cb == ev_periodic_stop) ? "ev_periodic_stop"
		: (cb == ev_periodic_again) ? "ev_periodic_again"
		: (cb == ev_signal_start) ? "ev_signal_start"
		: (cb == ev_signal_stop) ? "ev_signal_stop"
		: (cb == ev_stat_stat) ? "ev_stat_stat"
		: (cb == ev_stat_start) ? "ev_stat_start"
		: (cb == ev_stat_stop) ? "ev_stat_stop"
		: (cb == ev_idle_start) ? "ev_idle_start"
		: (cb == ev_idle_stop) ? "ev_idle_stop"
		: (cb == ev_prepare_start) ? "ev_prepare_start"
		: (cb == ev_prepare_stop) ? "ev_prepare_stop"
		: (cb == ev_check_start) ? "ev_check_start"
		: (cb == ev_check_stop) ? "ev_check_stop"
		: (cb == ev_embed_sweep) ? "ev_embed_sweep"
		: (cb == ev_embed_start) ? "ev_embed_start"
		: (cb == ev_embed_stop) ? "ev_embed_stop"
		: (cb == ev_fork_start) ? "ev_fork_start"
		: (cb == ev_fork_stop) ? "ev_fork_stop"
		: (cb == ev_cleanup_start) ? "ev_cleanup_start"
		: (cb == ev_cleanup_stop) ? "ev_cleanup_stop"
		: (cb == ev_async_start) ? "ev_async_start"
		: (cb == ev_async_stop) ? "ev_async_stop"
		: (cb == ev_async_send) ? "ev_async_send"
		: (cb == ev_once) ? "ev_once"
		: "unknown watcher";
		// clang-format on
}
