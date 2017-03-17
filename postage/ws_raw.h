#pragma once

#include <sys/time.h>

#include "common_client.h"
#include "common_util_sql.h"
#include "common_websocket.h"
#include "postage_callback.h"
#include "util/util_sql_split.h"

struct sock_ev_client_raw {
	bool bol_autocommit;
	PGresult *res;
	struct sock_ev_client_copy_check *copy_check;
};

/*
********************************** REQUEST FORMAT
************************************
RAW[\tAUTOCOMMIT]\n
<sql>
*/

/*
This function will:
1. parse request into variables
2. split raw into several queries
3. send begin (or first query if autocommit) query
*/
void ws_raw_step1(struct sock_ev_client_request *client_request);

#ifdef POSTAGE_INTERFACE_LIBPQ
/*
This function will:
- if response contains tuples then call run a query to get the column type names
with
					 _raw_tuples_callback as the callback
- if not then send response back
Then call itself with next query
*/
bool ws_raw_step2(EV_P, PGresult *res, ExecStatusType result, struct sock_ev_client_request *client_request);

/*
This function is just here to do nothing after we rollback
*/
bool ws_raw_step3(EV_P, PGresult *res, ExecStatusType result, struct sock_ev_client_request *client_request);

/*
This function will:
1. send the header
2. initialize a check callback to send the tuples to the client
*/
bool _raw_tuples_callback(EV_P, PGresult *res, ExecStatusType result, struct sock_ev_client_request *client_request);

/*
This function just sends data to the client
*/
void _raw_tuples_check_callback(EV_P, ev_check *w, int revents);
#endif
