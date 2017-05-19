#pragma once

#include "common_client.h"
#include "common_util_sql.h"
#include "common_websocket.h"
#include "util/util_idle.h"

struct sock_ev_client_select {
	struct sock_ev_client_request_data self;

	char *str_real_table_name;
	char *str_return_columns;
#ifndef POSTAGE_INTERFACE_LIBPQ
	char *str_return_escaped_columns;
	char *str_sql_escaped_return;
#endif
	char *str_statement_name;
	char *str_sql;
	char *str_row_count;
	char *str_where;
	char *str_order_by;
	char *str_limit;
	char *str_offset;
	DArray *darr_column_types;
	DArray *darr_column_names;

	//variable lengths
	size_t int_statement_name_len;
	size_t int_sql_len;
	size_t int_sql_escaped_return_len;
	size_t int_return_columns_len;
	size_t int_return_escaped_columns_len;
	size_t int_real_table_name_len;
	size_t int_where_len;
	size_t int_group_by_len;
	size_t int_order_by_len;
	size_t int_limit_len;
	size_t int_offset_len;
	size_t int_row_count_len;
};

/*
********************************** REQUEST FORMAT
************************************
SELECT\t[<schemaname>\t]<tablename>
RETURN\t(<tabseperatedcolumns>|*)

[<selectparametername>[\t<selectparametername>[ ... ]]]
[<selectparametervalue>[\t<selectparametervalue>[ ... ]]]
*/

/*
This function will:
1. parse request into variables
2. build select sql
3. prepare statement so that we can get the column types from it
*/
void ws_select_step1(struct sock_ev_client_request *client_request);

/*
results of second query came back
This function will:
1. builds response with column names and types
2. deallocates prepared statement
3. run the copy statement
*/
// bool ws_select_step4(EV_P, PGresult *res, ExecStatusType result, struct
// sock_ev_client_request *client_request);
bool ws_select_step4(EV_P, void *cb_data, DB_result *_res);

/*
This function will free the data associated with the client_select struct
*/
void ws_select_free(struct sock_ev_client_request_data *client_request_data);
