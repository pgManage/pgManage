#pragma once

#include "common_client.h"
#include "common_util_sql.h"
#include "common_websocket.h"
#include "util/util_idle.h"

struct sock_ev_client_update {
	char *ptr_query;

	char *str_return_columns;
#ifndef POSTAGE_INTERFACE_LIBPQ
	char *str_return_escaped_columns;
	size_t int_return_escaped_columns_len;
	char *str_insert_column_names;
	char *str_insert_parameter_markers;
#endif
	char *str_pk_join_clause;
	char *str_pk_return_join_clause;
	char *str_pk_where_clause;
	char *str_pk_return_where_clause;
	char *str_hash_where_clause;
	char *str_temp_col_list;
	char *str_set_col_list;
	char *str_real_table_name;
	char *str_temp_table_name;
	char *str_sql;
	char *str_return_order_by;
	size_t int_return_order_by_len;

	char *str_columns;
	size_t int_columns_length;
	char *str_type_sql;
	char *str_col;
	size_t int_col_length;
	char *str_value;
	size_t int_value_length;
	char *str_col_data_type;
	char *str_u_where;
	char *str_where;
	DArray *darr_where_column;
	DArray *darr_where_value;
	char *str_sequence_name;
	char *str_result;
	char *str_identity_column_name;

	size_t int_update_count;

	size_t int_update_columns;

	//variable lengths for SFINISH_SNCAT
	size_t int_temp_table_name_len;
	size_t int_real_table_name_len;
	size_t int_insert_column_names_len;
	size_t int_insert_parameter_markers_len;
	size_t int_pk_join_clause_len;
	size_t int_pk_return_join_clause_len;
	size_t int_pk_where_clause_len;
	size_t int_pk_return_where_clause_len;
	size_t int_hash_where_clause_len;
	size_t int_set_col_list_len;
	size_t int_return_columns_len;
	size_t int_col_data_type_len;
};

/*
********************************** REQUEST FORMAT ************************************
UPDATE\t[<schemaname>\t]<tablename>
HARH\t(<tabseperatedcolumns>|*)
RETURN\t(<tabseperatedcolumns>|*)
[ORDER BY\t<returnorderby>]

(pk|hash|set)[\t(pk|hash|set)[...]]
<columnname>[\t<columnname>[...]]
<columnvalue>[\t<columnvalue>[...]]
[<columnvalue>[\t<columnvalue>[...]]]
[...]
*/

/*
This function will:
1. parse request into variables (including 1-2 where clauses, hash (optional)
and pk)
2. create first temp table to hold data the client sent
*/
void ws_update_step1(struct sock_ev_client_request *client_request);

#ifndef POSTAGE_INTERFACE_LIBPQ
/*
This function will drop the identity column we make
*/
bool ws_update_step15_sql_server(EV_P, void *cb_data, DB_result *res);
#endif

/*
create first temp table query came back
This function will send copy command to send data into the first temp table
*/
bool ws_update_step2(EV_P, void *cb_data, DB_result *res);

/*
copy came back
This function will get the count of rows currently in the database matching the
hash and pk where clauses generated from the input
*/
bool ws_update_step4(EV_P, void *cb_data, DB_result *res);

/*
the count of rows query came back
This function will:
1. check returned counts against the number of rows the user gives us
2. update the actual table
*/
bool ws_update_step5(EV_P, void *cb_data, DB_result *res);

/*
update query came back
This function will start copy command from the real table (using the pk where
clause)
*/
bool ws_update_step6(EV_P, void *cb_data, DB_result *res);

/*
This function will free the data associated with the client_update struct
*/
void ws_update_free(struct sock_ev_client_update *to_free);
