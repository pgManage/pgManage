#pragma once

#include "db_framework.h"
#include "util_salloc.h"
#include <ev.h>

#include "common_client.h"

/*
This function will start listening on a postgresql connection, then run the
callback with the results of a query
*/
void _query_callback(EV_P, struct sock_ev_client_request *client_request, sock_ev_client_query_callback_function callback);
#define query_callback(A, B, C)                                                                                                  \
	SDEBUG("query_callback(%p, %p, %p)", A, B, C);                                                                               \
	_query_callback(A, B, C);
