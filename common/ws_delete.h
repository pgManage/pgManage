#pragma once

#include "common_client.h"
#include "common_util_sql.h"
#include "common_websocket.h"

struct sock_ev_client_delete {
	char *ptr_query;

	char *str_pk_where_clause;
	char *str_hash_where_clause;
	char *str_real_table_name;
	size_t int_real_table_name_length;
	char *str_temp_table_name;
	char *str_sql;
#ifndef POSTAGE_INTERFACE_LIBPQ
	char *str_insert_column_names;
	char *str_insert_parameter_markers;
#endif
	char *str_identity_column_name;

	size_t int_delete_count;
};

/*
********************************** REQUEST FORMAT
************************************
DELETE\t[<schemaname>\t]<tablename>

(pk|hash)[\t(pk|hash)[...]]
<columnname>[\t<columnname>[...]]
<columnvalue>[\t<columnvalue>[...]]
[<columnvalue>[\t<columnvalue>[...]]]
[...]
*/

/*
This function will:
1. parse the request into variables (including 1-2 where clauses, hash
(optional) and pk)
2. create temp table to hold data the client sent
*/
char *ws_delete_step1(struct sock_ev_client_request *client_request);

#ifndef POSTAGE_INTERFACE_LIBPQ
/*
This function will drop the identity column we make
*/
bool ws_delete_step15_sql_server(EV_P, void *cb_data, DB_result *res);
#endif

/*
This function will:
1. create temp table query came back
2. run copy command to send data into the temp table
*/
bool ws_delete_step2(EV_P, void *cb_data, DB_result *res);

/*
Copy came back
This function will get the count of rows currently in the database matching the
hash and pk where clauses generated from the input
*/
bool ws_delete_step4(EV_P, void *cb_data, DB_result *res);

/*
This function will:
1. get the count of rows query came back
2. check returned counts against the number of rows the user gives us
3. delete from the real table
*/
bool ws_delete_step5(EV_P, void *cb_data, DB_result *res);

/*
This function will get the number of rows deleted and tell the client
*/
bool ws_delete_step6(EV_P, void *cb_data, DB_result *res);

/*
This function will free the data associated with the client_delete struct
*/
void ws_delete_free(struct sock_ev_client_delete *to_free);
