#pragma once

#ifdef _WIN32
#include <windows.h>
#include <winsock2.h>
#endif

#include "../util/util_darray.h"
#include "../util/util_idle.h"
#include "../util/util_salloc.h"
#include "../util/util_string.h"
#include <ev.h>
#include <libpq-fe.h>
#include <stdbool.h>

extern const char *const WONT_GUESS;

bool DB_init_framework();

typedef struct DB_conn *DB_connp;

typedef void (*connect_cb_t)(EV_P, void *cb_data, DB_connp conn);

typedef struct DB_conn {
	ev_check check;
	int int_status;
	char *str_response;
	char *str_literal_context_data;

	PGconn *conn;

	int int_sock;

#ifdef _WIN32
#define GET_CONN_PQ_SOCKET(A) A->int_sock
#define SERROR_SET_CONN_PQ_SOCKET(A)                                                                                             \
	HANDLE h_dup_handle = 0;                                                                                                     \
	SERROR_CHECK(DuplicateHandle(GetCurrentProcess(), PQsocket(A->conn), GetCurrentProcess(), &h_dup_handle, 0, TRUE,            \
					 DUPLICATE_SAME_ACCESS),                                                                                     \
		"DuplicateHandle failed!");                                                                                              \
	A->int_sock = _open_osfhandle(h_dup_handle, 0);                                                                              \
	SERROR_CHECK(A->int_sock != -1, "_open_osfhandle failed!")
#define SFINISH_SET_CONN_PQ_SOCKET(A)                                                                                            \
	HANDLE h_dup_handle = 0;                                                                                                     \
	SFINISH_CHECK(DuplicateHandle(GetCurrentProcess(), PQsocket(A->conn), GetCurrentProcess(), &h_dup_handle, 0, TRUE,           \
					  DUPLICATE_SAME_ACCESS),                                                                                    \
		"DuplicateHandle failed!");                                                                                              \
	A->int_sock = _open_osfhandle(h_dup_handle, 0);                                                                              \
	SFINISH_CHECK(A->int_sock != -1, "_open_osfhandle failed!")
#else
#define GET_CONN_PQ_SOCKET(A) A->int_sock
#define SERROR_SET_CONN_PQ_SOCKET(A) A->int_sock = PQsocket(A->conn);
#define SFINISH_SET_CONN_PQ_SOCKET(A) A->int_sock = PQsocket(A->conn);
#endif

	// ONLY FOR db_conn_error_cb!!!!
	void *cb_data;
	connect_cb_t connect_cb;
} DB_conn;

typedef struct {
	ev_io io;
	DB_conn *conn;
	void *cb_data;
	connect_cb_t connect_cb;
} DB_poll;

DB_conn *DB_connect(EV_P, void *cb_data, char *str_connstring, char *str_user, size_t int_user_length, char *str_password,
	size_t int_password_length, char *str_context_data, connect_cb_t connect_cb);

typedef enum { DB_DRIVER_POSTGRES = 1 } DB_driver;
#define DB_connection_driver(conn) DB_DRIVER_POSTGRES

typedef enum {
	DB_RES_TUPLES_OK = 1,
	DB_RES_COMMAND_OK = 2,
	DB_RES_COPY_OUT = 3,
	DB_RES_COPY_IN = 4,
	DB_RES_FATAL_ERROR = 5,
	DB_RES_NONFATAL_ERROR = 6,
	DB_RES_BAD_RESPONSE = 7,
	DB_RES_EMPTY_QUERY = 8,
	DB_RES_UTIL_ERROR = 9
} DB_result_status;
typedef struct {
	DB_result_status status;
	DB_conn *conn;
	// library specific stuff follows
	PGresult *res;
	bool bol_first_row;
	int int_row;
	long int_len;
} DB_result;
typedef bool (*query_cb_t)(EV_P, void *cb_data, DB_result *res);
typedef bool (*copy_cb_t)(EV_P, bool bol_success, bool bol_last, void *cb_data, char *str_response, size_t int_len);
typedef struct {
	ev_io io;
	DB_conn *conn;
	void *cb_data;
	query_cb_t query_cb;
	copy_cb_t copy_cb;
	bool bol_prepared;
	char *str_query;
	DB_result *res;
	char *str_data;
	int int_len;
} DB_result_poll;
typedef struct {
	ev_check check;
	void *cb_data;
	copy_cb_t copy_cb;
	DB_conn *conn;
	PGresult *res;

	int int_i;
	int int_len;
	unsigned long int_response_len;
	struct sock_ev_client_request *client_request;
} DB_copy_check;
bool _DB_exec(
	EV_P, DB_conn *conn, void *cb_data, char *str_data, size_t int_len, char *str_query, query_cb_t query_cb, copy_cb_t copy_cb);
#define DB_exec(A, B, C, D, E) _DB_exec(A, B, C, NULL, 0, D, E, NULL)
#define DB_copy_in(A, B, C, D, E, F, G) _DB_exec(A, B, C, D, E, F, G, NULL)
#define DB_copy_out(A, B, C, D, E) _DB_exec(A, B, C, NULL, 0, D, NULL, E)

// Takes a result, returns ana array of the column names for the result
DArray *DB_get_column_names(DB_result *res);

// Takes sql, will eventually callback with a result of the column types in one row.
// The sql does not get run, it gets prepared and then we get the description of the result, not the result.
// Then we run format_type for each type using DB_exec, then we run the callback with that result.
bool DB_get_column_types_for_query(EV_P, DB_conn *conn, char *str_sql, void *cb_data, query_cb_t column_type_cb);

// Get the column types of a query, and callback with the result
bool DB_get_column_types(EV_P, DB_result *res, void *cb_data, query_cb_t column_type_cb);

typedef enum { DB_FETCH_ERROR = 0, DB_FETCH_OK = 1, DB_FETCH_END = 2 } DB_fetch_status;
// Move to the next row of the result
DB_fetch_status DB_fetch_row(DB_result *res);

// Get values of the current row
DArray *DB_get_row_values(DB_result *res);

// Get lengths for each value of the current row
DArray *DB_get_row_lengths(DB_result *res);

// Get the number of results
#define DB_rows_affected(A) (size_t) strtol(PQcmdTuples(A->res), NULL, 10)

// Free the result
void _DB_free_result(DB_result *res);
#define DB_free_result(A)                                                                                                        \
	_DB_free_result(A);                                                                                                          \
	A = NULL;

char *DB_get_diagnostic(DB_conn *conn, DB_result *_res);

// Escape string for use in a query
char *DB_escape_literal(DB_conn *conn, char *str, size_t int_len); // make sure to copy and do pqfreemem

// Escape object name for use in a query
char *DB_escape_identifier(DB_conn *conn, char *str, size_t int_len); // make sure to copy and do pqfreemem

void _DB_finish(DB_conn *conn);
#define DB_finish(A)                                                                                                             \
	_DB_finish(A);                                                                                                               \
	A = NULL;

#define DB_finish_framework()

/*
Escapes a string for use in a postgresql connection string.
*/
char *escape_conninfo_value(char *str_src, size_t *int_len);
