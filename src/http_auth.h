#pragma once

#include "http_main.h"
#include <openssl/md5.h>

struct sock_ev_client_auth_cnxn {
	ev_io io;

	struct sock_ev_client_auth *parent;
};

struct sock_ev_client_auth {
	struct sock_ev_client_request_data self;

	char *str_action;
	char *str_cookie_encrypted;
	size_t int_cookie_encrypted_len;
	char *str_connname;
	size_t int_connname_length;
	char *str_conn;
	size_t int_conn_length;
	char *str_user;
	size_t int_user_length;
	char *str_old_check_password;
	size_t int_old_check_password_length;
	char *str_password;
	size_t int_password_length;
	char *str_new_password;
	size_t int_new_password_length;
	char *str_database;
	size_t int_dbname_length;
	size_t int_connection_index;
	char *str_int_connection_index;

	void (*connect_callback)(struct sock_ev_client_auth *client_auth);

	struct sock_ev_client *parent;
};

/*
This is the interface function for this request

When you call this function, it parses the request and figures out what exactly
the client wants

This can be:
can we use a custom connection?
list the stored connections
login
change password
change database
logout

In the case of login, change_pw and change_database:
This function will gather all of the needed information from the request, then
initiate a postgresql connection

In all other cases:
This function will gather what the client wants, then just send it
*/
void http_auth(struct sock_ev_client_auth *client_auth);

/*
These three functions handle the steps of login after authentication

http_auth_login_step2 will initiate a query to:
1. check if they are a super user
2. check if they are a member of the "login_group" group (see postage(1) or envelope(1) for
details)

http_auth_login_step3 will:
1. check these results against your configurations
2. create all of the needed directories for sql scripts (if they aren't already
there)
3. finally, it will tell the browser what url to go to
*/
void http_auth_login_step2(EV_P, void *cb_data, DB_conn *conn);
bool http_auth_login_step3(EV_P, void *cb_data, DB_result *res);

/*
These two functions handle the steps of change password after authentication

http_auth_change_pw_step2 will:
1. check if the old password matches the one in your cookie
2. send the query to change the password

http_auth_change_pw_step3 will:
1. update our internal data structures to reflect the new cookie
2. then tell the browser we had a success and give them the new cookie
*/
void http_auth_change_pw_step2(EV_P, void *cb_data, DB_conn *conn);
bool http_auth_change_pw_step3(EV_P, void *cb_data, DB_result *res);

/*
These two functions handle the steps of change database after authentication

http_auth_change_database_step2 will:
1. update our internal data structures to reflect the new cookie
2. then tell the browser we had a success and give them the new cookie
*/
void http_auth_change_database_step2(EV_P, void *cb_data, DB_conn *conn);

/*
This function free()s the members of the struct that you give it, and then
free()s the struct
*/
void http_auth_free(struct sock_ev_client_request_data *client_request_data);
