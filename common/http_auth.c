#include "http_auth.h"

// response with redirect
char *http_auth(struct sock_ev_client_auth *client_auth) {
	char *str_response = NULL;
	char *str_session_id_temp = NULL;
	SDEFINE_VAR_ALL(str_form_data, str_expires);
	SDEFINE_VAR_MORE(str_uri_expires, str_cookie_decrypted);
	SDEFINE_VAR_MORE(str_escape_password, str_conn, str_conn_debug, str_body);
	SDEFINE_VAR_MORE(str_email_error, str_user_literal, str_sql);
	SDEFINE_VAR_MORE(str_expiration, str_referer, str_temp);
	SDEFINE_VAR_MORE(str_uri_new_password, str_uri_expiration);
	SDEFINE_VAR_MORE(str_new_cookie, str_user_quote, str_new_password_literal);
	SDEFINE_VAR_MORE(str_uri_timeout, str_one_day_expire, str_cookie_name, str_session_id);
#ifdef ENVELOPE
#else
	char *ptr_conn = NULL;
	char *ptr_conn_end = NULL;
#endif

	SFINISH_SALLOC(str_session_id_temp, 32);
	SFINISH_CHECK(RAND_bytes((unsigned char *)str_session_id_temp, 32), "RAND_bytes failed");
	size_t int_len = 32;
	str_session_id = hexencode(str_session_id_temp, &int_len);
	SFINISH_CHECK(str_session_id != NULL, "hexencode failed");

	char str_buf[101] = {0};
	memcpy(str_buf, client_auth->parent->str_request, 100);
	SDEBUG("str_buf: %s", str_buf);

	size_t int_query_length = 0;
	size_t int_action_length = 0;
	size_t int_expiration_len = 0;
	size_t int_cookie_len = 0;
	size_t int_response_len = 0;
	size_t int_uri_new_password_len = 0;
	size_t int_uri_expiration_len = 0;
	size_t int_referer_len = 0;

	// get form data
	str_form_data = query(client_auth->parent->str_request, client_auth->parent->int_request_len, &int_query_length);
	SFINISH_CHECK(str_form_data != NULL, "str_query failed");

	client_auth->str_action = getpar(str_form_data, "action", int_query_length, &int_action_length);
	SFINISH_CHECK(client_auth->str_action != NULL, "getpar failed");

	SDEBUG("client_auth->str_action: %s", client_auth->str_action);

	// LOGGING IN, SET COOKIE
	if (strncmp(client_auth->str_action, "login", 6) == 0) {
		SNOTICE("REQUEST TYPE: " SUN_PROGRAM_LOWER_NAME " LOGIN");
		client_auth->str_user = getpar(str_form_data, "username", int_query_length, &client_auth->int_user_length);
#ifdef ENVELOPE_ODBC
		if (strncmp(str_global_mode, "msaccess", 9) != 0) {
			SFINISH_CHECK(client_auth->str_user != NULL && client_auth->int_user_length > 0, "no username");
		}
#else
		SFINISH_CHECK(client_auth->str_user != NULL && client_auth->int_user_length > 0, "no username");
#endif
		bstr_tolower(client_auth->str_user, client_auth->int_user_length);
		SFINISH_CHECK(client_auth->str_user != NULL, "str_tolower(client_auth->str_user) failed");

		SNOTICE("REQUEST USERNAME: %s", client_auth->str_user);

		client_auth->str_password = getpar(str_form_data, "password", int_query_length, &client_auth->int_password_length);
// The reason this was removed is because libpq will give an error if a password is required
//#ifdef ENVELOPE_ODBC
//		if (strncmp(str_global_mode, "msaccess", 9) != 0) {
//			SFINISH_CHECK(client_auth->str_password != NULL && client_auth->int_password_length > 0, "no password");
//		}
//#else
//		SFINISH_CHECK(client_auth->str_password != NULL && client_auth->int_password_length > 0, "no password");
//#endif

		SFINISH_CHECK(bstrstr(client_auth->str_user, client_auth->int_user_length, ";", 1) == NULL, "no semi-colons allowed");
		SFINISH_CHECK(
			bstrstr(client_auth->str_password, client_auth->int_password_length, ";", 1) == NULL, "no semi-colons allowed");

#ifdef ENVELOPE
		SFINISH_SNCAT(client_auth->str_connname, &client_auth->int_conn_length, "", (size_t)0);
#else
		client_auth->str_connname = getpar(str_form_data, "connname", int_query_length, &client_auth->int_connname_length);
		SFINISH_CHECK(client_auth->str_connname != NULL, "no connection name");

		client_auth->str_conn = getpar(str_form_data, "conn", int_query_length, &client_auth->int_conn_length);
		if (client_auth->str_conn != NULL && client_auth->int_conn_length == 0) {
			SFREE(client_auth->str_conn);
		} else {
			SFINISH_SNCAT(client_auth->parent->str_conn, &client_auth->int_conn_length, client_auth->str_conn, client_auth->int_conn_length);
		}

		if (bol_global_allow_custom_connections == false) {
			SFINISH_CHECK(client_auth->parent->str_conn == NULL, "Cannot specify a custom connection string with current "
																 "configuration,"
																 "if you wish to do this, change allow_custom_connections "
																 "to true and restart " SUN_PROGRAM_LOWER_NAME "");
		}
#endif
		// cookie expiration
		str_expires = str_expire_two_day();
		SFINISH_CHECK(str_expires != NULL, "str_expire_two_day failed");

		str_one_day_expire = str_expire_one_day();
		SFINISH_CHECK(str_one_day_expire != NULL, "str_expire_one_day failed");
		size_t int_uri_expires_len = 0;
		str_uri_expires = snuri(str_one_day_expire, strlen(str_one_day_expire), &int_uri_expires_len);
		SFREE(str_one_day_expire);
		SFINISH_CHECK(snuri != NULL, "snuri failed");

		SFINISH_SNCAT(
			str_cookie_decrypted, &int_cookie_len,
			str_form_data, int_query_length,
			"&expiration=", (size_t)12,
			str_uri_expires, int_uri_expires_len,
			"&sessionid=", (size_t)11,
			str_session_id, strlen(str_session_id)
		);

#ifdef ENVELOPE
#else
		if (client_auth->str_conn == NULL) {
			char *str_temp = get_connection_database(client_auth->str_connname);
			size_t int_temp = str_temp ? strlen(str_temp) : 0;
			SFINISH_SNCAT(client_auth->str_database, &int_temp, str_temp, int_temp);
			SFINISH_SNFCAT(str_cookie_decrypted, &int_cookie_len, "&dbname=", (size_t)8, client_auth->str_database, int_temp);
		}
#endif

		// COOKIE TIMEOUT INIT
		SFINISH_SALLOC(str_uri_timeout, 50);
		time_t time_current1 = time(&time_current1) + 3600;
		sprintf(str_uri_timeout, "%ld", (long)time_current1);

		SDEBUG("str_uri_timeout: %s", str_uri_timeout);

		SFINISH_SNFCAT(str_cookie_decrypted, &int_cookie_len, "&timeout=", (size_t)9, str_uri_timeout, strlen(str_uri_timeout));
		SFREE(str_uri_timeout);

		// encrypt
		SFREE(str_uri_expires);
		SFREE_PWORD(str_form_data);
		size_t cookie_len = strlen(str_cookie_decrypted);
		client_auth->str_cookie_encrypted = aes_encrypt(str_cookie_decrypted, &cookie_len);
		SFREE_PWORD(str_cookie_decrypted);
		// done encrypting

		// assemble connection string, get cnxn handle
		SFINISH_CHECK(client_auth->str_conn != NULL || exists_connection_info(client_auth->str_connname),
			"There is no connection info with that name.");

		if (client_auth->str_conn != NULL) {
			SFINISH_SNCAT(str_conn, &client_auth->int_conn_length, client_auth->str_conn, client_auth->int_conn_length);
			client_auth->int_connection_index = (int_global_custom_connection_number += 1);
		} else {
			char *str_temp = get_connection_info(client_auth->str_connname, &client_auth->int_connection_index);
			size_t int_temp = strlen(str_temp);
#ifdef POSTAGE_INTERFACE_LIBPQ
			if (client_auth->str_database != NULL) {
				SFINISH_SNCAT(str_conn, &client_auth->int_conn_length, str_temp, int_temp, " dbname=", (size_t)8, client_auth->str_database, strlen(client_auth->str_database));
			} else {
				SFINISH_SNCAT(str_conn, &client_auth->int_conn_length, str_temp, int_temp);
			}
#else
			SFINISH_SNCAT(str_conn, &client_auth->int_conn_length, str_temp, int_temp);
#endif
		}
		SFINISH_SALLOC(client_auth->str_int_connection_index, 20);
		snprintf(client_auth->str_int_connection_index, 20, "%zu", client_auth->int_connection_index);

		SFREE(client_auth->str_conn);

		SDEBUG("client_auth: %p", client_auth);
		SDEBUG("client_auth->parent: %p", client_auth->parent);
		SDEBUG("str_conn: %s", str_conn);

		SFINISH_CHECK((client_auth->parent->conn = DB_connect(global_loop, client_auth, str_conn, client_auth->str_user,
						   client_auth->int_user_length, client_auth->str_password, client_auth->int_password_length, "",
						   http_auth_login_step2)) != NULL,
			"DB_connect failed");
		SFREE_PWORD(client_auth->str_password);

		SDEBUG("client_auth: %p", client_auth);
		SDEBUG("client_auth->parent: %p", client_auth->parent);

		// set up cnxn socket
		// SFINISH_SET_CLIENT_PQ_SOCKET(client_auth->parent);
		// ev_io_init(&client_auth_cnxn->io, http_auth_cnxn_cb,
		// GET_CLIENT_PQ_SOCKET(client_auth->parent), EV_WRITE);
		// ev_io_start(EV_A, &client_auth_cnxn->io);
		SFREE(client_auth->str_action);

		//////
		// CHANGE PW, RESET COOKIE
	} else if (strncmp(client_auth->str_action, "change_pw", 10) == 0) {
		SNOTICE("REQUEST TYPE: PASSWORD CHANGE");
		SFREE(client_auth->str_action);
		client_auth->str_new_password =
			getpar(str_form_data, "password_new", int_query_length, &client_auth->int_new_password_length);
		SFINISH_CHECK(client_auth->str_new_password != NULL, "getpar failed");
		client_auth->str_old_check_password =
			getpar(str_form_data, "password_old", int_query_length, &client_auth->int_old_check_password_length);
		SFINISH_CHECK(client_auth->str_old_check_password != NULL, "getpar failed");

		SDEBUG("client_auth->parent->str_request: %s", client_auth->parent->str_request);
#ifdef ENVELOPE
		size_t int_temp = 0;
		SFINISH_SNCAT(str_cookie_name, &int_temp, "envelope", (size_t)8);
#else
		str_referer = request_header(client_auth->parent->str_request, client_auth->parent->int_request_len, "referer", &int_referer_len);
		SFINISH_CHECK(str_referer != NULL, "No Referer header");
		SDEBUG("str_referer: %s", str_referer);
		ptr_conn = bstrstr(str_referer, int_referer_len, "/postage/", (size_t)9);
		SDEBUG("ptr_conn: %s", ptr_conn);
		SFINISH_CHECK(ptr_conn != NULL, "Invalid Referer header");
		ptr_conn += strlen("/postage/");
		SDEBUG("ptr_conn: %s", ptr_conn);
		ptr_conn_end = bstrstr(ptr_conn, int_referer_len - (size_t)(ptr_conn - str_referer), "/", (size_t)1);
		SFINISH_CHECK(ptr_conn_end != NULL, "Invalid Referer header");
		*ptr_conn_end = 0;
		SDEBUG("ptr_conn: %s", ptr_conn);

		size_t int_temp = 0;
		SFINISH_SNCAT(str_cookie_name, &int_temp, "postage_", (size_t)8, ptr_conn, strlen(ptr_conn));
#endif

		SFREE_PWORD(str_form_data);
		client_auth->str_cookie_encrypted = str_cookie(client_auth->parent->str_request, client_auth->parent->int_request_len, str_cookie_name, &int_cookie_len);
		SFINISH_CHECK(client_auth->str_cookie_encrypted != NULL, "str_cookie failed");
		str_cookie_decrypted = aes_decrypt(client_auth->str_cookie_encrypted, &int_cookie_len);
		SFREE(client_auth->str_cookie_encrypted);
		client_auth->str_user = getpar(str_cookie_decrypted, "username", int_cookie_len, &client_auth->int_user_length);
		client_auth->str_password = getpar(str_cookie_decrypted, "password", int_cookie_len, &client_auth->int_password_length);
		str_expiration = getpar(str_cookie_decrypted, "expiration", int_cookie_len, &int_expiration_len);

#ifdef ENVELOPE
		SFINISH_SNCAT(client_auth->str_connname, &client_auth->int_conn_length, "", (size_t)0);
#else
		client_auth->str_database = getpar(str_cookie_decrypted, "dbname", int_cookie_len, &client_auth->int_dbname_length);
		client_auth->str_connname = getpar(str_cookie_decrypted, "connname", int_cookie_len, &client_auth->int_connname_length);
		SFINISH_CHECK(client_auth->str_connname != NULL, "no connection name");

		client_auth->str_conn = getpar(str_cookie_decrypted, "conn", int_cookie_len, &client_auth->int_conn_length);
		if (client_auth->str_conn != NULL && client_auth->int_conn_length == 0) {
			SFREE(client_auth->str_conn);
		} else {
			SFINISH_SNCAT(client_auth->parent->str_conn, &client_auth->int_conn_length, client_auth->str_conn, client_auth->int_conn_length);
		}

		if (bol_global_allow_custom_connections == false) {
			SFINISH_CHECK(client_auth->parent->str_conn == NULL, "Cannot specify a custom connection string with current "
																 "configuration,"
																 "if you wish to do this, change allow_custom_connections "
																 "to true and restart " SUN_PROGRAM_LOWER_NAME "");
		}
#endif
		SFREE_PWORD(str_cookie_decrypted);

		str_uri_new_password = snuri(client_auth->str_new_password, client_auth->int_new_password_length, &int_uri_new_password_len);
		SFINISH_CHECK(str_uri_new_password != NULL, "snuri failed!");
		str_uri_expiration = snuri(str_expiration, int_expiration_len, &int_uri_expiration_len);
		SFINISH_CHECK(str_uri_expiration != NULL, "snuri failed!");
		SFINISH_SNCAT(
			str_new_cookie, &int_cookie_len,
			"username=", (size_t)9,
			client_auth->str_user, client_auth->int_user_length,
			"&connname=", (size_t)10,
			client_auth->str_connname, client_auth->int_connname_length,
			"&password=", (size_t)10,
			str_uri_new_password, int_uri_new_password_len,
			"&expiration=", (size_t)12,
			str_uri_expiration, int_uri_expiration_len,
			"&dbname=", (size_t)8,
			client_auth->str_database, client_auth->int_dbname_length,
			"&sessionid=", (size_t)11,
			str_session_id, strlen(str_session_id)
		);

		if (client_auth->str_conn != NULL) {
			SFINISH_SNFCAT(str_new_cookie, &int_cookie_len, "&conn=", (size_t)6, client_auth->str_conn, client_auth->int_conn_length);
		}

		// **** WARNING ****
		// DO NOT UNCOMMENT THE NEXT LINE! THAT WILL PUT THE NEW PASSWORD IN THE
		// CLEAR IN THE LOG!!!!
		// SDEBUG("str_new_cookie>%s<", str_new_cookie);
		// SDEBUG("int_cookie_len>%d<", int_cookie_len);
		// **** WARNING ****
		client_auth->str_cookie_encrypted = aes_encrypt(str_new_cookie, &int_cookie_len);
		//SDEBUG("client_auth->str_cookie_encrypted>%s<", client_auth->str_cookie_encrypted);
		//SDEBUG("int_cookie_len>%d<", int_cookie_len);

		SBFREE_PWORD(str_uri_new_password, int_uri_new_password_len);
		SFREE(str_uri_expiration);
		SFREE_PWORD(str_new_cookie);

		bstr_tolower(client_auth->str_user, client_auth->int_user_length);

		SNOTICE("REQUEST USERNAME: %s", client_auth->str_user);

		SFINISH_CHECK(client_auth->str_conn != NULL || exists_connection_info(client_auth->str_connname),
			"There is no connection info with that name.");

		if (client_auth->str_conn != NULL) {
			SFINISH_SNCAT(str_conn, &client_auth->int_conn_length, client_auth->str_conn, client_auth->int_conn_length);
#ifdef ENVELOPE
#else
			size_t int_temp = strlen(str_temp);
			SFINISH_SNCAT(client_auth->str_int_connection_index, &int_temp, ptr_conn, strlen(ptr_conn));
#endif
		} else {
			char *str_temp = get_connection_info(client_auth->str_connname, &client_auth->int_connection_index);
			size_t int_temp = strlen(str_temp);
#ifdef POSTAGE_INTERFACE_LIBPQ
			if (client_auth->str_database != NULL) {
				SFINISH_SNCAT(str_conn, &client_auth->int_conn_length, str_temp, int_temp, " dbname=", (size_t)8, client_auth->str_database, strlen(client_auth->str_database));
			} else {
				SFINISH_SNCAT(str_conn, &client_auth->int_conn_length, str_temp, int_temp);
			}
#else
			SFINISH_SNCAT(str_conn, &client_auth->int_conn_length, str_temp, int_temp);
#endif
			SFINISH_SALLOC(client_auth->str_int_connection_index, 20);
			snprintf(client_auth->str_int_connection_index, 20, "%zu", client_auth->int_connection_index);
		}

		SFINISH_CHECK((client_auth->parent->conn = DB_connect(global_loop, client_auth, str_conn, client_auth->str_user,
						   client_auth->int_user_length, client_auth->str_password, client_auth->int_password_length, "",
						   http_auth_change_pw_step2)) != NULL,
			"DB_connect failed");

		SFREE(client_auth->str_action);

#ifdef ENVELOPE
	} else if (strncmp(client_auth->str_action, "change_database", 16) == 0) {
		SNOTICE("REQUEST TYPE: Not a valid action.");

		char *str_temp =
			"HTTP/1.1 500 Internal Server Error\015\012"
			"Server: " SUN_PROGRAM_LOWER_NAME "\015\012\015\012"
			"The change_database action is useful in postage, but not envelope.";
		SFINISH_SNCAT(str_response, &int_response_len, str_temp, strlen(str_temp));

		SFREE_PWORD(str_form_data);
		http_auth_free(client_auth);
		SFREE(client_auth);
	} else if (strncmp(client_auth->str_action, "list", 16) == 0) {
		SNOTICE("REQUEST TYPE: Not a valid action.");

		char *str_temp =
			"HTTP/1.1 500 Internal Server Error\015\012"
			"Server: " SUN_PROGRAM_LOWER_NAME "\015\012\015\012"
			"The list action is useful in postage, but not envelope.";
		SFINISH_SNCAT(str_response, &int_response_len, str_temp, strlen(str_temp));

		SFREE_PWORD(str_form_data);
		http_auth_free(client_auth);
		SFREE(client_auth);

	} else if (strncmp(client_auth->str_action, "canadd", 16) == 0) {
		SNOTICE("REQUEST TYPE: Not a valid action.");

		char *str_temp =
			"HTTP/1.1 500 Internal Server Error\015\012"
			"Server: " SUN_PROGRAM_LOWER_NAME "\015\012\015\012"
			"The canadd action is useful in postage, but not envelope.";
		SFINISH_SNCAT(str_response, &int_response_len, str_temp, strlen(str_temp));

		SFREE_PWORD(str_form_data);
		http_auth_free(client_auth);
		SFREE(client_auth);
#else
		//////
		// CHANGE DATABASE, RESET COOKIE
	} else if (strncmp(client_auth->str_action, "change_database", 16) == 0) {
		SNOTICE("REQUEST TYPE: DATABASE CHANGE");
		SFREE(client_auth->str_action);
		client_auth->str_database = getpar(str_form_data, "database", int_query_length, &client_auth->int_dbname_length);
		SFINISH_CHECK(client_auth->str_database != NULL, "getpar failed");

		SDEBUG("client_auth->parent->str_request: %s", client_auth->parent->str_request);

		str_referer = request_header(client_auth->parent->str_request, client_auth->parent->int_request_len, "referer", &int_referer_len);
		SFINISH_CHECK(str_referer != NULL, "No Referer header");
		SDEBUG("str_referer: %s", str_referer);
		ptr_conn = bstrstr(str_referer, int_referer_len, "/postage/", (size_t)9);
		SDEBUG("ptr_conn: %s", ptr_conn);
		SFINISH_CHECK(ptr_conn != NULL, "Invalid Referer header");
		ptr_conn += strlen("/postage/");
		SDEBUG("ptr_conn: %s", ptr_conn);
		ptr_conn_end = bstrstr(ptr_conn, int_referer_len - (size_t)(ptr_conn - str_referer), "/", (size_t)1);
		SFINISH_CHECK(ptr_conn_end != NULL, "Invalid Referer header");
		*ptr_conn_end = 0;
		SDEBUG("ptr_conn: %s", ptr_conn);

		size_t int_temp = 0;
		SFINISH_SNCAT(str_cookie_name, &int_temp, "postage_", (size_t)8, ptr_conn, strlen(ptr_conn));

		SFREE_PWORD(str_form_data);
		client_auth->str_cookie_encrypted = str_cookie(client_auth->parent->str_request, client_auth->parent->int_request_len, str_cookie_name, &int_cookie_len);
		SFINISH_CHECK(client_auth->str_cookie_encrypted != NULL, "str_cookie failed");
		str_cookie_decrypted = aes_decrypt(client_auth->str_cookie_encrypted, &int_cookie_len);
		SFREE(client_auth->str_cookie_encrypted);

		client_auth->str_user = getpar(str_cookie_decrypted, "username", int_cookie_len, &client_auth->int_user_length);
		client_auth->str_password = getpar(str_cookie_decrypted, "password", int_cookie_len, &client_auth->int_password_length);
		str_expiration = getpar(str_cookie_decrypted, "expiration", int_cookie_len, &int_expiration_len);

		client_auth->str_connname = getpar(str_cookie_decrypted, "connname", int_cookie_len, &client_auth->int_connname_length);
		client_auth->str_conn = getpar(str_cookie_decrypted, "conn", int_cookie_len, &client_auth->int_conn_length);

		SFREE_PWORD(str_cookie_decrypted);

		SDEBUG("client_auth->str_connname: %s", client_auth->str_connname);
		if (client_auth->str_conn != NULL && strlen(client_auth->str_conn) == 0) {
			SFREE(client_auth->str_conn);
		} else {
			SFINISH_SNCAT(client_auth->parent->str_conn, &client_auth->int_conn_length, client_auth->str_conn, client_auth->int_conn_length);
		}

		if (bol_global_allow_custom_connections == false) {
			SFINISH_CHECK(client_auth->parent->str_conn == NULL, "Cannot specify a custom connection string with current "
																 "configuration, "
																 "if you wish to do this, change allow_custom_connections "
																 "to true and restart " SUN_PROGRAM_LOWER_NAME ".");
		}


		str_uri_new_password = snuri(client_auth->str_password, client_auth->int_password_length, &int_uri_new_password_len);
		SFINISH_CHECK(str_uri_new_password != NULL, "snuri failed!");
		str_uri_expiration = snuri(str_expiration, int_expiration_len, &int_uri_expiration_len);
		SFINISH_CHECK(str_uri_expiration != NULL, "snuri failed!");
		SFINISH_SNCAT(
			str_new_cookie, &int_cookie_len,
			"username=", (size_t)9,
			client_auth->str_user, client_auth->int_user_length,
			"&connname=", (size_t)10,
			client_auth->str_connname, client_auth->int_connname_length,
			"&password=", (size_t)10,
			str_uri_new_password, int_uri_new_password_len,
			"&expiration=", (size_t)12,
			str_uri_expiration, int_uri_expiration_len,
			"&dbname=", (size_t)8,
			client_auth->str_database, client_auth->int_dbname_length,
			"&sessionid=", (size_t)11,
			str_session_id, strlen(str_session_id)
		);

		if (client_auth->str_conn != NULL) {
			SFINISH_SNFCAT(str_new_cookie, &int_cookie_len, "&conn=", 6, client_auth->str_conn, client_auth->int_conn_length);
		}

		// **** WARNING ****
		// DO NOT UNCOMMENT THE NEXT LINE! THAT WILL PUT THE NEW PASSWORD IN THE
		// CLEAR IN THE LOG!!!!
		// DEBUG("str_new_cookie>%s<", str_new_cookie);
		// **** WARNING ****
		client_auth->str_cookie_encrypted = aes_encrypt(str_new_cookie, &int_cookie_len);

		SFREE_PWORD(str_uri_new_password);
		SFREE(str_uri_expiration);
		SFREE(str_new_cookie);

		bstr_tolower(client_auth->str_user, client_auth->int_user_length);

		SNOTICE("REQUEST USERNAME: %s", client_auth->str_user);

		SFINISH_CHECK(client_auth->str_conn != NULL || exists_connection_info(client_auth->str_connname),
			"There is no connection info with that name.");

		if (client_auth->str_conn != NULL) {
			SFINISH_SNCAT(str_conn, &client_auth->int_conn_length, client_auth->str_conn, client_auth->int_conn_length);

			SFINISH_SNCAT(client_auth->str_int_connection_index, &int_temp, ptr_conn, strlen(ptr_conn));
		} else {
			char *str_temp = get_connection_info(client_auth->str_connname, &client_auth->int_connection_index);
			size_t int_temp2 = strlen(str_temp);
			SFINISH_SNCAT(str_conn, &int_temp2, str_temp, int_temp2, " dbname=", 8, client_auth->str_database, client_auth->int_dbname_length);
			SFINISH_SALLOC(client_auth->str_int_connection_index, 20);
			snprintf(client_auth->str_int_connection_index, 20, "%zu", client_auth->int_connection_index);
		}

		client_auth->parent->conn =
			DB_connect(global_loop, client_auth, str_conn, client_auth->str_user, client_auth->int_user_length,
				client_auth->str_password, client_auth->int_password_length, "", http_auth_change_database_step2);

		// set up cnxn socket
		// SFINISH_SET_CLIENT_PQ_SOCKET(client_auth->parent);
		// ev_io_init(&client_auth_cnxn->io, http_auth_cnxn_cb,
		// GET_CLIENT_PQ_SOCKET(client_auth->parent), EV_WRITE);
		// ev_io_start(global_loop, &client_auth_cnxn->io);
		SFREE(client_auth->str_action);

	} else if (strncmp(client_auth->str_action, "list", 5) == 0) {
		char *str_temp =
			"HTTP/1.1 200 OK\015\012"
			"Server: " SUN_PROGRAM_LOWER_NAME "\015\012\015\012";
		size_t int_temp = strlen(str_temp);
		SFINISH_SNCAT(str_response, &int_response_len, str_temp, int_temp);
		struct struct_connection *current_connection;
		size_t i, len;
		for (i = 0, len = DArray_end(darr_global_connection); i < len; i++) {
			current_connection = DArray_get(darr_global_connection, i);
			SFINISH_SNFCAT(
				str_response, &int_response_len,
				current_connection->str_connection_name, strlen(current_connection->str_connection_name),
				i == (len - 1) ? "" : "\012", i == (len - 1) ? (size_t)0 : (size_t)1
			);
			SDEBUG("current_connection->str_connection_name: %s", current_connection->str_connection_name);
		}
		SFREE_PWORD(str_form_data);
		http_auth_free(client_auth);
		SFREE(client_auth);

	} else if (strncmp(client_auth->str_action, "canadd", 7) == 0) {
		char *str_temp =
			"HTTP/1.1 200 OK\015\012"
			"Server: " SUN_PROGRAM_LOWER_NAME "\015\012\015\012";
		size_t int_temp = strlen(str_temp);
		SFINISH_SNCAT(
			str_response, &int_response_len,
			str_temp, int_temp,
			bol_global_allow_custom_connections ? "true"    : "false",
			bol_global_allow_custom_connections ? (size_t)4 : (size_t)5
		);
		http_auth_free(client_auth);
		SFREE(client_auth);
#endif

	} else if (strncmp(client_auth->str_action, "logout", 7) == 0) {
		SNOTICE("REQUEST TYPE: LOGOUT " SUN_PROGRAM_LOWER_NAME "");

#ifdef ENVELOPE
		size_t int_temp = 0;
		SFINISH_SNCAT(str_cookie_name, &int_temp, "envelope", 8);
#else
		SDEBUG("client_auth->parent->str_request: %s", client_auth->parent->str_request);
		str_referer = request_header(client_auth->parent->str_request, client_auth->parent->int_request_len, "referer", &int_referer_len);
		SFINISH_CHECK(str_referer != NULL, "No Referer header");
		SDEBUG("str_referer: %s", str_referer);
		ptr_conn = bstrstr(str_referer, int_referer_len, "/postage/", (size_t)9);
		SDEBUG("ptr_conn: %s", ptr_conn);
		SFINISH_CHECK(ptr_conn != NULL, "Invalid Referer header");
		ptr_conn += strlen("/postage/");
		SDEBUG("ptr_conn: %s", ptr_conn);
		ptr_conn_end = bstrstr(ptr_conn, int_referer_len - (size_t)(ptr_conn - str_referer), "/", (size_t)1);
		SFINISH_CHECK(ptr_conn_end != NULL, "Invalid Referer header");
		*ptr_conn_end = 0;
		SDEBUG("ptr_conn: %s", ptr_conn);

		size_t int_temp = 0;
		SFINISH_SNCAT(str_cookie_name, &int_temp, "postage_", (size_t)8, ptr_conn, strlen(ptr_conn));
#endif

		size_t cookie_len = 0;
		client_auth->str_cookie_encrypted = str_cookie(client_auth->parent->str_request, client_auth->parent->int_request_len, str_cookie_name, &cookie_len);
		if (client_auth->str_cookie_encrypted != NULL) {
			ListNode *node = client_auth->parent->server->list_client->first;
			for (; node != NULL;) {
				struct sock_ev_client *other_client = node->value;
				if (other_client != NULL && other_client != client_auth->parent) {
					SDEBUG("other_client->str_cookie          : %s", other_client->str_cookie);
					SDEBUG("client_auth->str_cookie_encrypted : %s", client_auth->str_cookie_encrypted);
					SDEBUG("other_client->str_client_ip       : %s", other_client->str_client_ip);
					SDEBUG("client_auth->parent->str_client_ip: %s", client_auth->parent->str_client_ip);
					if (other_client->str_cookie != NULL &&
						strcmp(other_client->str_cookie, client_auth->str_cookie_encrypted) == 0 &&
						strcmp(other_client->str_client_ip, client_auth->parent->str_client_ip) == 0) {
						client_timeout_prepare_free(other_client->client_timeout_prepare);
						other_client->bol_fast_close = true;
						SDEBUG("node->next: %p", node->next);
						node = node->next;
						client_close_immediate(other_client);
					} else {
						SDEBUG("node->next: %p", node->next);
						node = node->next;
					}
				} else {
					SDEBUG("node->next: %p", node->next);
					node = node->next;
				}
				SDEBUG("node: %p", node);
			}
		}
#ifdef ENVELOPE
		char *str_temp1 =
			"HTTP/1.1 303 See Other\015\012"
			"Server: " SUN_PROGRAM_LOWER_NAME "\015\012"
			"Set-Cookie: envelope=";
		size_t int_temp1 = strlen(str_temp1);
		char *str_temp2 =
			"; path=/; expires=Tue, 01 Jan 1990 00:00:00 GMT"
			"; HttpOnly\015\012"
			"Location: /index.html\015\012\015\012";
		size_t int_temp2 = strlen(str_temp2);
		SFINISH_SNCAT(
			str_response, &int_response_len,
			str_temp1, int_temp1,
			(bol_tls ? "; secure" : ""), (size_t)(bol_tls ? 8: 0),
			str_temp2, int_temp2
		);
#else
		char *str_temp1 =
			"HTTP/1.1 303 See Other\015\012"
			"Server: " SUN_PROGRAM_LOWER_NAME "\015\012"
			"Set-Cookie: postage_";
		size_t int_temp1 = strlen(str_temp1);
		char *str_temp2 =
			"; path=/; expires=Tue, 01 Jan 1990 00:00:00 GMT"
			"; HttpOnly\015\012"
			"Location: /index.html?connection=";
		size_t int_temp2 = strlen(str_temp2);
		size_t i = (size_t)strtol(ptr_conn, NULL, 10);
		struct struct_connection *current_connection = DArray_get(darr_global_connection, i);

		SFINISH_SNCAT(
			str_response, &int_response_len,
			str_temp1, int_temp1,
			ptr_conn, strlen(ptr_conn),
			(bol_tls ? "; secure" : ""), (size_t)(bol_tls ? 8 : 0),
			str_temp2, int_temp2,
			(current_connection != NULL ? current_connection->str_connection_name : "custom"), (current_connection != NULL ? strlen(current_connection->str_connection_name) : (size_t)6),
			"\015\012\015\012", (size_t)4
		);
#endif
		//client_auth->parent->bol_fast_close = true;
		SFREE_PWORD(str_form_data);
		http_auth_free(client_auth);
		SFREE(client_auth);
	} else {
		SNOTICE("REQUEST TYPE: Not a valid action.");

		char *str_temp =
			"HTTP/1.1 500 Internal Server Error\015\012"
			"Server: " SUN_PROGRAM_LOWER_NAME "\015\012\015\012"
			"Not a valid action.";
		SFINISH_SNCAT(str_response, &int_response_len, str_temp, strlen(str_temp));

		SFREE_PWORD(str_form_data);
		http_auth_free(client_auth);
		SFREE(client_auth);
	}
	bol_error_state = false;
finish:
	if (client_auth != NULL) {
		SDEBUG("client_auth: %p", client_auth);
		SDEBUG("client_auth->parent: %p", client_auth->parent);
	}

	if (bol_error_state && str_response != NULL) {
		char *_str_response = str_response;
		char *str_temp =
			"HTTP/1.1 500 Internal Server Error\015\012"
			"Server: " SUN_PROGRAM_LOWER_NAME "\015\012\015\012";
		SFINISH_SNCAT(str_response, &int_response_len, str_temp, strlen(str_temp), _str_response, strlen(_str_response));
		SFREE(_str_response);
	}
	SFREE_PWORD(str_form_data);
	SFREE_PWORD(str_cookie_decrypted);
	SFREE_PWORD(str_escape_password);
	SFREE_PWORD(str_conn);
	SFREE_PWORD(str_sql);
	SFREE_PWORD(str_uri_new_password);
	SFREE_PWORD(str_new_cookie);
	SFREE_PWORD(str_new_password_literal);
	SBFREE_PWORD(str_session_id_temp, 32);
	SFREE_ALL();
	if (bol_error_state == true) {
		http_auth_free(client_auth);
		SFREE(client_auth);
	}

	return str_response;
}

void http_auth_login_step2(EV_P, void *cb_data, DB_conn *conn) {
	struct sock_ev_client_auth *client_auth = cb_data;
	SDEFINE_VAR_ALL(str_group_literal, str_sql, str_expires, str_temp, str_user_literal, str_int_len);
	char *str_response = NULL;
	size_t int_response_len = 0;
	size_t int_user_literal_len = 0;
	size_t int_group_literal_len = 0;
	SDEBUG("http_auth_login_step2");
	SDEBUG("client_auth: %p", client_auth);
	SDEBUG("client_auth->parent: %p", client_auth->parent);
	SDEBUG("conn->str_response: %p", conn->str_response);
	SDEBUG("conn->str_response: %s", conn->str_response);

	SFINISH_CHECK(conn->int_status == 1, "%s", conn->str_response);

	str_user_literal = DB_escape_literal(client_auth->parent->conn, client_auth->str_user, client_auth->int_user_length);
	SFINISH_CHECK(str_user_literal != NULL, "PQescapeLiteral failed");
	int_user_literal_len = strlen(str_user_literal);
	if (str_global_login_group != NULL) {
		str_temp = DB_escape_literal(client_auth->parent->conn, str_global_login_group, strlen(str_global_login_group));
		SFINISH_CHECK(str_temp != NULL, "PQescapeLiteral failed");
		SFINISH_SNCAT(str_group_literal, &int_group_literal_len, str_temp, strlen(str_temp));
		SFREE(str_temp);
		str_temp = NULL;
	} else {
		SFINISH_SNCAT(str_group_literal, &int_group_literal_len, "''", (size_t)2);
	}
	if (DB_connection_driver(client_auth->parent->conn) == DB_DRIVER_POSTGRES) {
		size_t int_temp = 0;
		char *str_temp1 =
			"SELECT CASE WHEN rolsuper THEN 'TRUE' ELSE 'FALSE' END AS result "
			"FROM pg_catalog.pg_roles WHERE rolname = ";
		char *str_temp2 =
			" UNION ALL "
			"SELECT CASE WHEN count(pg_roles.rolname) > 0 THEN 'TRUE' ELSE 'FALSE' "
			"END "
			"FROM pg_user "
			"LEFT JOIN pg_auth_members on pg_user.usesysid = pg_auth_members.member "
			"LEFT JOIN pg_roles on pg_roles.oid = pg_auth_members.roleid "
			"WHERE pg_user.usename = ";
		SFINISH_SNCAT(
			str_sql, &int_temp,
			str_temp1, strlen(str_temp1),
			str_user_literal, int_user_literal_len,
			str_temp2, strlen(str_temp2),
			str_user_literal, int_user_literal_len,
			" AND pg_roles.rolname = ", (size_t)24,
			str_group_literal, int_group_literal_len
		);
	} else if (DB_connection_driver(client_auth->parent->conn) == DB_DRIVER_SQL_SERVER) {
		size_t int_temp = 0;
		char *str_temp1 =
			"SELECT CASE WHEN IS_SRVROLEMEMBER('sysadmin') = 1 THEN 'TRUE' ELSE 'FALSE' END"
			" UNION ALL SELECT CASE WHEN IS_MEMBER(";
		char *str_temp2 =
			") = 1 THEN 'TRUE' ELSE 'FALSE' END;";
		SFINISH_SNCAT(
			str_sql, &int_temp,
			str_temp1, strlen(str_temp1),
			str_group_literal, int_group_literal_len,
			str_temp2, strlen(str_temp2)
		);
	} else {
		char *str_temp1 =
			"HTTP/1.1 200 OK\015\012"
			"Server: " SUN_PROGRAM_LOWER_NAME "\015\012"
			"Set-Cookie: envelope=";
		char *str_temp2 =
			"; HttpOnly;\015\012Set-Cookie: DB=SS; path=/;\015\012Content-Length: 48\015\012\015\012"
			"{\"stat\": true, \"dat\": \"/env/app/all/index.html\"}";
		str_expires = str_expire_one_day();
		SFINISH_SNCAT(
			str_response, &int_response_len,
			str_temp1, strlen(str_temp1),
			client_auth->str_cookie_encrypted,
			"; path=/; expires=",
			str_expires, strlen(str_expires),
			(bol_tls ? "; secure" : ""), (size_t)(bol_tls ? 8 : 0),
			str_temp2, strlen(str_temp2)
		);

		struct sock_ev_client *client = client_auth->parent;
		size_t int_i, int_len;
		client->int_last_activity_i = -1;
		struct sock_ev_client_last_activity *client_last_activity;
		for (int_i = 0, int_len = DArray_end(client->server->arr_client_last_activity); int_i < int_len; int_i += 1) {
			client_last_activity =
				(struct sock_ev_client_last_activity *)DArray_get(client->server->arr_client_last_activity, int_i);
			if (client_last_activity != NULL &&
				strncmp(client_last_activity->str_client_ip, client->str_client_ip, INET_ADDRSTRLEN) == 0 &&
				strncmp(client_last_activity->str_cookie, client_auth->str_cookie_encrypted,
					strlen(client_auth->str_cookie_encrypted)) == 0) {
				client->int_last_activity_i = (ssize_t)int_i;
				break;
			}
		}
		if (client->int_last_activity_i == -1) {
			SFINISH_SALLOC(client_last_activity, sizeof(struct sock_ev_client_last_activity));
			memcpy(client_last_activity->str_client_ip, client_auth->parent->str_client_ip, INET_ADDRSTRLEN);
			size_t int_temp = 0;
			SFINISH_SNCAT(client_last_activity->str_cookie, &int_temp, client_auth->str_cookie_encrypted, strlen(client_auth->str_cookie_encrypted));
			client_last_activity->last_activity_time = ev_now(EV_A);
			client_auth->parent->int_last_activity_i =
				(ssize_t)DArray_push(client_auth->parent->server->arr_client_last_activity, client_last_activity);
		}

		SFREE(str_user_literal);
		SFREE(str_group_literal);

		bol_error_state = false;
		goto finish;
	}
	SFREE(str_user_literal);
	SFREE(str_group_literal);

	struct sock_ev_client_request *client_request =
		create_request(client_auth->parent, NULL, NULL, NULL, NULL, 0, POSTAGE_REQ_AUTH);
	SFINISH_CHECK(client_request != NULL, "Could not create request data!");
	client_request->vod_request_data = client_auth;
	SFINISH_CHECK(DB_exec(EV_A, client_auth->parent->conn, client_request, str_sql, http_auth_login_step3), "DB_exec failed");
	SFREE(str_sql);

	bol_error_state = false;
finish:
	SFREE(conn->str_response);
	ssize_t int_len = 0;
	if (bol_error_state == true) {
		SDEBUG("str_response: %s", str_response);
		char *_str_response = str_response;
		char str_length[50];
		snprintf(str_length, 50, "%zu", (int_response_len != 0 ? int_response_len : strlen(_str_response)));
		char *str_temp =
			"HTTP/1.1 500 Internal Server Error\015\012"
			"Server: " SUN_PROGRAM_LOWER_NAME "\015\012"
			"Content-Length: ";
		SFINISH_SNCAT(
			str_response, &int_response_len,
			str_temp, strlen(str_temp),
			str_length, strlen(str_length),
			"\015\012\015\012", (size_t)4,
			_str_response, (int_response_len != 0 ? int_response_len : strlen(_str_response))
		);
		SFREE(_str_response);
	}
	if (str_response != NULL) {
		if ((int_len = CLIENT_WRITE(client_auth->parent, str_response, (int_response_len != 0 ? int_response_len : strlen(str_response)))) < 0) {
			SFREE(str_response);
			if (bol_tls) {
				SERROR_NORESPONSE_LIBTLS_CONTEXT(client_auth->parent->tls_postage_io_context, "tls_write() failed");
			} else {
				SERROR_NORESPONSE("write() failed");
			}
		}
		SFREE(str_response);

		SERROR_CLIENT_CLOSE_NORESPONSE(client_auth->parent);
		http_auth_free(client_auth);
		SFREE(client_auth);
	}
	bol_error_state = false;
	SFREE_ALL();
}

bool http_auth_login_step3(EV_P, void *cb_data, DB_result *res) {
	struct sock_ev_client_request *client_request = cb_data;
	struct sock_ev_client_auth *client_auth = (struct sock_ev_client_auth *)(client_request->vod_request_data);
	SDEFINE_VAR_ALL(str_user_literal, str_temp1, str_expires, str_int_len);
	SDEFINE_VAR_MORE(str_content_length, str_connstring, str_user, str_open);
	SDEFINE_VAR_MORE(str_closed, str_temp_connstring, str_rolsuper, str_rolgroup, str_temp);
	char *str_response = NULL;
	DArray *arr_row_values = NULL;
	DArray *arr_row_lengths = NULL;
	size_t int_temp = 0;
	size_t int_response_len = 0;
	DB_fetch_status status = 0;
	SDEBUG("http_auth_login_step3");

	SFINISH_CHECK(res != NULL, "DB_exec failed");
	SFINISH_CHECK(res->status == DB_RES_TUPLES_OK, "DB_exec failed");

	SFINISH_CHECK((status = DB_fetch_row(res)) == DB_FETCH_OK, "DB_fetch_row failed");
	arr_row_values = DB_get_row_values(res);
	arr_row_lengths = DB_get_row_lengths(res);

	SFINISH_SNCAT(str_rolsuper, &int_temp, DArray_get(arr_row_values, 0), *(size_t *)DArray_get(arr_row_lengths, 0));

	DArray_clear_destroy(arr_row_values);
	arr_row_values = NULL;
	DArray_clear_destroy(arr_row_lengths);
	arr_row_lengths = NULL;

	SFINISH_CHECK((status = DB_fetch_row(res)) == DB_FETCH_OK, "DB_fetch_row failed");
	arr_row_values = DB_get_row_values(res);
	arr_row_lengths = DB_get_row_lengths(res);

	SFINISH_SNCAT(str_rolgroup, &int_temp, DArray_get(arr_row_values, 0), *(size_t *)DArray_get(arr_row_lengths, 0));

	DArray_clear_destroy(arr_row_values);
	arr_row_values = NULL;
	DArray_clear_destroy(arr_row_lengths);
	arr_row_lengths = NULL;

	SFINISH_CHECK((status = DB_fetch_row(res)) == DB_FETCH_END, "DB_fetch_row failed");

	DB_free_result(res);

#ifdef ENVELOPE
#else
	if (bol_global_super_only == true && strncmp(str_rolsuper, "FALSE", 5) == 0) {
		char *str_temp1 = "{\"stat\": false, \"dat\": \"You must login as a super user to use Postage. If you would like to use a non-superuser role, change the `super_only` parameter to false\"}";
		SFINISH_SNCAT(str_temp, &int_temp, str_temp1, strlen(str_temp1));
		char str_length[50];
		snprintf(str_length, 50, "%zu", strlen(str_temp));
		str_temp1 =
			"HTTP/1.1 403 Forbidden\015\012"
			"Server: " SUN_PROGRAM_LOWER_NAME "\015\012"
			"Content-Length: ";
		SFINISH_SNCAT(
			str_response, &int_response_len,
			str_temp1, strlen(str_temp1),
			str_length, strlen(str_length),
			"\015\012\015\012", (size_t)4,
			str_temp, strlen(str_temp)
		);
		SFREE(str_temp)
	} else if (str_global_login_group != NULL && strncmp(str_rolgroup, "FALSE", 5) == 0) {
		size_t int_content_length = 83 + strlen(str_global_login_group);
		// 255 chars should be enough
		SFINISH_SALLOC(str_content_length, 255 + 1);
		snprintf(str_content_length, 255, "%zu", int_content_length);
		str_content_length[255] = 0;

		char *str_temp1 =
			"HTTP/1.1 403 Forbidden\015\012"
			"Server: " SUN_PROGRAM_LOWER_NAME "\015\012"
			"Content-Length: ";
		char *str_temp2 =
			"{\"stat\": false, \"dat\": \"You must login as a member "
			"of the group '";
		char *str_temp3 =
			"' to use Postage\"}";
		SFINISH_SNCAT(
			str_response, &int_response_len,
			str_temp1, strlen(str_temp1),
			str_content_length, strlen(str_content_length),
			"\015\012\015\012", (size_t)4,
			str_temp2, strlen(str_temp2),
			str_global_login_group, strlen(str_global_login_group),
			str_temp3, strlen(str_temp3)
		);

		SFREE(str_content_length);
	} else
#endif
	{
		str_expires = str_expire_one_day();
#ifdef ENVELOPE
		char *str_temp1 =
			"HTTP/1.1 200 OK\015\012"
			"Server: " SUN_PROGRAM_LOWER_NAME "\015\012"
			"Set-Cookie: envelope=";
		char *str_temp2 =
			"; HttpOnly;\015\012Set-Cookie: DB=";
		char *str_temp3 =
			"; path=/;\015\012Content-Length: 48\015\012\015\012"
			"{\"stat\": true, \"dat\": \"/env/app/all/index.html\"}";
		SFINISH_SNCAT(
			str_response, &int_response_len,
			str_temp1, strlen(str_temp1),
			client_auth->str_cookie_encrypted, strlen(client_auth->str_cookie_encrypted),
			"; path=/; expires=", (size_t)18,
			str_expires, strlen(str_expires),
			str_temp2, strlen(str_temp2),
			(bol_tls ? "; secure" : ""), (size_t)(bol_tls ? 8 : 0),
			(DB_connection_driver(client_auth->parent->conn) == DB_DRIVER_POSTGRES ? "PG" : "SS"), (size_t)2,
			str_temp3, strlen(str_temp3)
		);
#else
		SFINISH_SALLOC(str_int_len, 20);
		snprintf(str_int_len, 20, "%zu", 45 + strlen(client_auth->str_int_connection_index));

		char *str_temp1 =
			"HTTP/1.1 200 OK\015\012"
			"Server: " SUN_PROGRAM_LOWER_NAME "\015\012"
			"Set-Cookie: postage_";
		char *str_temp2 =
			"; HttpOnly;\015\012Set-Cookie: DB=";
		char *str_temp3 =
			"; path=/;\015\012Content-Length: ";
		char *str_temp4 =
			"\015\012\015\012"
			"{\"stat\": true, \"dat\": \"/postage/";
		char *str_temp5 =
			"/index.html\"}";
		SFINISH_SNCAT(
			str_response, &int_response_len,
			str_temp1, strlen(str_temp1),
			client_auth->str_int_connection_index, strlen(client_auth->str_int_connection_index),
			"=", (size_t)1,
			client_auth->str_cookie_encrypted, strlen(client_auth->str_cookie_encrypted),
			"; path=/; expires=", (size_t)18,
			str_expires, strlen(str_expires),
			str_temp2, strlen(str_temp2),
			(bol_tls ? "; secure" : ""), (size_t)(bol_tls ? 8 : 0),
			(DB_connection_driver(client_auth->parent->conn) == DB_DRIVER_POSTGRES ? "PG" : "SS"), (size_t)2,
			str_temp3, strlen(str_temp3),
			str_int_len, strlen(str_int_len),
			str_temp4, strlen(str_temp4),
			client_auth->str_int_connection_index, strlen(client_auth->str_int_connection_index),
			str_temp5, strlen(str_temp5)
		);
#endif
		SFREE(str_expires);

		struct sock_ev_client *client = client_auth->parent;
		size_t int_i, int_len;
		client->int_last_activity_i = -1;
		struct sock_ev_client_last_activity *client_last_activity;
		for (int_i = 0, int_len = DArray_end(client->server->arr_client_last_activity); int_i < int_len; int_i += 1) {
			client_last_activity =
				(struct sock_ev_client_last_activity *)DArray_get(client->server->arr_client_last_activity, int_i);
			if (client_last_activity != NULL &&
				strncmp(client_last_activity->str_client_ip, client->str_client_ip, INET_ADDRSTRLEN) == 0 &&
				strncmp(client_last_activity->str_cookie, client_auth->str_cookie_encrypted,
					strlen(client_auth->str_cookie_encrypted)) == 0) {
				client->int_last_activity_i = (ssize_t)int_i;
				break;
			}
		}
		if (client->int_last_activity_i == -1) {
			SFINISH_SALLOC(client_last_activity, sizeof(struct sock_ev_client_last_activity));
			memcpy(client_last_activity->str_client_ip, client_auth->parent->str_client_ip, INET_ADDRSTRLEN);
			SFINISH_SNCAT(client_last_activity->str_cookie, &int_temp, client_auth->str_cookie_encrypted, strlen(client_auth->str_cookie_encrypted));
			client_last_activity->last_activity_time = ev_now(EV_A);
			client_auth->parent->int_last_activity_i =
				(ssize_t)DArray_push(client_auth->parent->server->arr_client_last_activity, client_last_activity);
		}
		SDEBUG("" SUN_PROGRAM_LOWER_NAME " COOKIE SET");
#ifdef ENVELOPE
#else
		if (client_request->parent->str_conn != NULL) {
			client_auth->int_connection_index = (int_global_custom_connection_number += 1);
		}

		SFINISH_SNCAT(client_request->parent->str_connname_folder, &int_temp, client_auth->str_connname, client_auth->int_connname_length);
		if (client_auth->str_database != NULL) {
			SFINISH_SNFCAT(client_request->parent->str_connname_folder, &int_temp, "_", (size_t)1, client_auth->str_database, strlen(client_auth->str_database));
		}
		if (client_request->parent->str_conn != NULL) {
			SFINISH_SNFCAT(client_request->parent->str_connname_folder, &int_temp, "_", (size_t)1, client_request->parent->str_conn, strlen(client_request->parent->str_conn));
		}
		int_i = 0;
		int_len = strlen(client_request->parent->str_connname_folder);
		while (int_i < int_len) {
			if (!isalnum(client_request->parent->str_connname_folder[int_i])) {
				client_request->parent->str_connname_folder[int_i] = '_';
			}

			int_i++;
		}

		str_temp1 = client_auth->str_user;
		SFINISH_CHECK((client_auth->str_user = snuri(str_temp1, client_auth->int_user_length, &client_auth->int_user_length)) != NULL, "snuri failed");
		SFREE(str_temp1);

		SFINISH_SNCAT(
			str_user, &int_temp,
			client_request->parent->str_connname_folder, strlen(client_request->parent->str_connname_folder),
			"/", (size_t)1,
			client_auth->str_user, client_auth->int_user_length
		);
		SFINISH_SNCAT(
			str_open, &int_temp,
			client_request->parent->str_connname_folder, strlen(client_request->parent->str_connname_folder),
			"/", (size_t)1,
			client_auth->str_user, client_auth->int_user_length,
			"/open", (size_t)5
		);
		SFINISH_SNCAT(
			str_closed, &int_temp,
			client_request->parent->str_connname_folder, strlen(client_request->parent->str_connname_folder),
			"/", (size_t)1,
			client_auth->str_user, client_auth->int_user_length,
			"/closed", (size_t)7
		);

		// connection folder
		char *str_temp = canonical(str_global_sql_root, client_request->parent->str_connname_folder, "read_dir");
		if (str_temp == NULL) {
			str_temp = canonical(str_global_sql_root, client_request->parent->str_connname_folder, "create_dir");
			SFINISH_CHECK(str_temp != NULL, "Could not create directory >%s/%s<", str_global_sql_root, str_connstring);
		}
		SFREE(str_temp);
		str_temp = canonical(str_global_sql_root, client_request->parent->str_connname_folder, "read_dir");
		SFINISH_ERROR_CHECK(str_temp != NULL, "Could not create directory >%s/%s<", str_global_sql_root, str_connstring);
		SFREE(str_temp);

		// connection/user folder
		str_temp = canonical(str_global_sql_root, str_user, "read_dir");
		if (str_temp == NULL) {
			str_temp = canonical(str_global_sql_root, str_user, "create_dir");
			SFINISH_CHECK(str_temp != NULL, "Could not create directory %s", str_user);
		}
		SFREE(str_temp);
		str_temp = canonical(str_global_sql_root, str_user, "read_dir");
		SFINISH_ERROR_CHECK(str_temp != NULL, "Could not create directory >%s/%s<", str_global_sql_root, str_user);
		SFREE(str_temp);

		// connection/user/open folder
		str_temp = canonical(str_global_sql_root, str_open, "read_dir");
		if (str_temp == NULL) {
			str_temp = canonical(str_global_sql_root, str_open, "create_dir");
			SFINISH_CHECK(str_temp != NULL, "Could not create directory %s", str_open);
		}
		SFREE(str_temp);
		str_temp = canonical(str_global_sql_root, str_open, "read_dir");
		SFINISH_ERROR_CHECK(str_temp != NULL, "Could not create directory >%s/%s<", str_global_sql_root, str_open);
		SFREE(str_temp);

		// connection/user/closed folder
		str_temp = canonical(str_global_sql_root, str_closed, "read_dir");
		if (str_temp == NULL) {
			str_temp = canonical(str_global_sql_root, str_closed, "create_dir");
			SFINISH_CHECK(str_temp != NULL, "Could not create directory %s", str_closed);
		}
		SFREE(str_temp);
		str_temp = canonical(str_global_sql_root, str_closed, "read_dir");
		SFINISH_ERROR_CHECK(str_temp != NULL, "Could not create directory >%s/%s<", str_global_sql_root, str_closed);
		SFREE(str_temp);
		SFREE(str_global_error);
#endif
	}

	SDEBUG("str_response: %s", str_response);
	SDEBUG("LOGIN END");

	bol_error_state = false;
finish:
	DB_free_result(res);
	if (arr_row_values != NULL) {
		DArray_clear_destroy(arr_row_values);
	}
	if (arr_row_lengths != NULL) {
		DArray_clear_destroy(arr_row_lengths);
	}
	SFREE_ALL();

	ssize_t int_len = 0;

	if (bol_error_state == true) {
		SDEBUG("str_response: %s", str_response);
		char *_str_response = str_response;
		char str_length[50];
		snprintf(str_length, 50, "%zu", strlen(_str_response));
		char *str_temp =
			"HTTP/1.1 500 Internal Server Error\015\012"
			"Server: " SUN_PROGRAM_LOWER_NAME "\015\012"
			"Content-Length: ";
		SFINISH_SNCAT(
			str_response, &int_response_len,
			str_temp, strlen(str_temp),
			str_length, strlen(str_length),
			"\015\012\015\012", (size_t)4,
			_str_response, (int_response_len != 0 ? int_response_len : strlen(_str_response))
		);
		SFREE(_str_response);
		if (client_request->parent->conn->str_response != NULL && client_request->parent->conn->str_response[0] != 0) {
			SFINISH_SNFCAT(
				str_response, &int_response_len,
				":\n", (size_t)2,
				client_request->parent->conn->str_response, strlen(client_request->parent->conn->str_response)
			);
		}
		SFREE(client_request->parent->conn->str_response);
	}

	if ((int_len = CLIENT_WRITE(client_request->parent, str_response, strlen(str_response))) < 0) {
		if (bol_tls) {
			SERROR_NORESPONSE_LIBTLS_CONTEXT(client_request->parent->tls_postage_io_context, "tls_write() failed");
		} else {
			SERROR_NORESPONSE("write() failed");
		}
	}
	SFREE(str_response);
	struct sock_ev_client *client = client_request->parent;
	http_auth_free(client_auth);
	client_request_free(client_request);
	SFINISH_CLIENT_CLOSE(client);

	bol_error_state = false;
	// This causes query_callback to stop looping
	return true;
}

void http_auth_change_pw_step2(EV_P, void *cb_data, DB_conn *conn) {
	struct sock_ev_client_auth *client_auth = cb_data;
	SDEFINE_VAR_ALL(str_sql, str_user_quote, str_old_password_literal, str_new_password_literal);
	char *str_response = NULL;
	size_t int_response_len = 0;
	size_t int_temp = 0;

	SFINISH_CHECK(conn->int_status == 1, "%s", conn->str_response);

	str_user_quote = DB_escape_identifier(client_auth->parent->conn, client_auth->str_user, strlen(client_auth->str_user));
	SDEBUG("str_user_quote: %s", str_user_quote);

	// **** WARNING ****
	// DO NOT UNCOMMENT THE NEXT LINE! THAT WILL PUT THE NEW PASSWORD IN THE CLEAR
	// IN THE LOG!!!!
	// DEBUG("pw check>%s|%s|%i<", str_password_old, pword,
	// strncmp(str_password_old, pword, strlen(pword)));
	// **** WARNING ****
	SFINISH_CHECK(strncmp(client_auth->str_old_check_password, client_auth->str_password, strlen(client_auth->str_password)) == 0,
		"Old password does not match.");
	SFREE_PWORD(client_auth->str_password);

	str_new_password_literal =
		DB_escape_literal(client_auth->parent->conn, client_auth->str_new_password, strlen(client_auth->str_new_password));
	SFREE_PWORD(client_auth->str_new_password);
	if (DB_connection_driver(client_auth->parent->conn) == DB_DRIVER_POSTGRES) {
		SFINISH_SNCAT(
			str_sql, &int_temp,
			"ALTER ROLE ", (size_t)11,
			str_user_quote, strlen(str_user_quote),
			" PASSWORD ", (size_t)10,
			str_new_password_literal, strlen(str_new_password_literal),
			";", (size_t)1
		);
	} else {
		str_old_password_literal = DB_escape_literal(
			client_auth->parent->conn, client_auth->str_old_check_password, strlen(client_auth->str_old_check_password));
		SFINISH_SNCAT(
			str_sql, &int_temp,
			"ALTER LOGIN ", (size_t)12,
			str_user_quote, strlen(str_user_quote),
			" WITH PASSWORD = ", (size_t)17,
			str_new_password_literal, strlen(str_new_password_literal),
			" OLD_PASSWORD = ", (size_t)16,
			str_old_password_literal, strlen(str_old_password_literal),
			";", (size_t)1
		);
		SDEBUG("str_sql: %s", str_sql);
	}
	SFREE_PWORD(client_auth->str_old_check_password);
	SFREE(client_auth->str_user);
	// **** WARNING ****
	// DO NOT UNCOMMENT THE NEXT LINE! THAT WILL PUT THE NEW PASSWORD IN THE CLEAR
	// IN THE LOG!!!!
	// DEBUG("str_sql>%s<", str_sql);
	// **** WARNING ****
	SFREE(str_user_quote);
	SFREE(str_new_password_literal);
	str_new_password_literal = NULL;

	struct sock_ev_client_request *client_request =
		create_request(client_auth->parent, NULL, NULL, NULL, NULL, 0, POSTAGE_REQ_AUTH);
	SFINISH_CHECK(client_request != NULL, "Could not create request data!");
	client_request->vod_request_data = client_auth;

	SFINISH_CHECK(
		DB_exec(EV_A, client_request->parent->conn, client_request, str_sql, http_auth_change_pw_step3), "DB_exec failed");
	SFREE(str_sql);
	/*
	int int_status = PQsendQuery(client_auth->parent->cnxn, str_sql);
	if (int_status != 1) {
		SFINISH("count failed: %s", PQerrorMessage(client_auth->parent->cnxn));
	}
	query_callback(client_request, http_auth_change_pw_step3);
	*/
	bol_error_state = false;
finish:
	SFREE_PWORD_ALL();

	if (str_response != NULL) {
		SDEBUG("str_response: %s", str_response);
		char *_str_response = str_response;
		char str_length[50];
		ssize_t int_len = 0;
		snprintf(str_length, 50, "%zu", strlen(_str_response));
		char *str_temp =
			"HTTP/1.1 500 Internal Server Error\015\012"
			"Server: " SUN_PROGRAM_LOWER_NAME "\015\012"
			"Content-Length: ";
		SFINISH_SNCAT(
			str_response, &int_response_len,
			str_temp, strlen(str_temp),
			str_length, strlen(str_length),
			"\015\012\015\012", (size_t)4,
			_str_response, strlen(_str_response)
		);
		SFREE(_str_response);
		if ((int_len = CLIENT_WRITE(client_auth->parent, str_response, int_response_len)) < 0) {
			SFREE(str_response);
			if (bol_tls) {
				SERROR_NORESPONSE_LIBTLS_CONTEXT(client_auth->parent->tls_postage_io_context, "tls_write() failed");
			} else {
				SERROR_NORESPONSE("write() failed");
			}
		}
		// This prevents an infinite loop if CLIENT_CLOSE fails
		SFREE(str_response);
		SFINISH_CLIENT_CLOSE(client_auth->parent);
		http_auth_free(client_auth);
		SFREE(client_auth);
	}
	bol_error_state = false;
}

bool http_auth_change_pw_step3(EV_P, void *cb_data, DB_result *res) {
	struct sock_ev_client_request *client_request = cb_data;
	struct sock_ev_client_auth *client_auth = (struct sock_ev_client_auth *)(client_request->vod_request_data);
	char *str_response = NULL;
	size_t int_response_len = 0;
	size_t int_temp = 0;
	SDEFINE_VAR_ALL(str_expires);

	SDEBUG("res->status: %d", res->status);

	SFINISH_CHECK(res != NULL, "DB_exec failed");
	SFINISH_CHECK(res->status == DB_RES_COMMAND_OK, "DB_exec failed");

	DB_free_result(res);

	size_t int_len = 0, int_i = 0, int_cookie_len = 0;

	int_cookie_len = strlen(client_auth->str_cookie_encrypted);

	SDEBUG("PASSWORD CHANGE");
	str_expires = str_expire_one_day();

#ifdef ENVELOPE
	char *str_temp1 =
		"HTTP/1.1 200 OK\015\012"
		"Server: " SUN_PROGRAM_LOWER_NAME "\015\012Content-Type: application/json; charset=UTF-8\015\012"
		"Set-Cookie: envelope=";
	char *str_temp2 = "; HttpOnly\015\012\015\012{\"stat\": true, \"dat\": \"OK\"}";
	SFINISH_SNCAT(str_response, &int_response_len,
		str_temp1, strlen(str_temp1),
		client_auth->str_cookie_encrypted, strlen(client_auth->str_cookie_encrypted),
		"; path=/; expires=", (size_t)18,
		str_expires, strlen(str_expires),
		(bol_tls ? "; secure" : ""), (size_t)(bol_tls ? 8 : 0),
		str_temp2, strlen(str_temp2));
#else
	char *str_temp1 =
		"HTTP/1.1 200 OK\015\012"
		"Server: " SUN_PROGRAM_LOWER_NAME "\015\012Content-Type: application/json; charset=UTF-8\015\012"
		"Set-Cookie: postage_";
	char *str_temp2 = "; HttpOnly\015\012\015\012{\"stat\": true, \"dat\": \"OK\"}";
	SFINISH_SNCAT(str_response, &int_response_len,
		str_temp1, strlen(str_temp1),
		client_auth->str_int_connection_index, strlen(client_auth->str_int_connection_index),
		"=", (size_t)1,
		client_auth->str_cookie_encrypted, strlen(client_auth->str_cookie_encrypted),
		"; path=/; expires=", (size_t)18,
		str_expires, strlen(str_expires),
		(bol_tls ? "; secure" : ""), (size_t)(bol_tls ? 8 : 0),
		str_temp2, strlen(str_temp2));
#endif

	client_auth->parent->int_last_activity_i = -1;
	for (int_i = 0, int_len = DArray_end(client_auth->parent->server->arr_client_last_activity); int_i < int_len; int_i += 1) {
		struct sock_ev_client_last_activity *client_last_activity =
			(struct sock_ev_client_last_activity *)DArray_get(client_auth->parent->server->arr_client_last_activity, int_i);
		if (client_last_activity &&
			strncmp(client_last_activity->str_client_ip, client_auth->parent->str_client_ip, INET_ADDRSTRLEN) == 0 &&
			strncmp(client_last_activity->str_cookie, client_auth->str_cookie_encrypted, int_cookie_len) == 0) {
			client_auth->parent->int_last_activity_i = (ssize_t)int_i;
			break;
		}
	}
	SDEBUG("client_auth->parent->int_last_activity_i: %d", client_auth->parent->int_last_activity_i);
	if (client_auth->parent->int_last_activity_i != -1) {
		struct sock_ev_client_last_activity *client_last_activity = (struct sock_ev_client_last_activity *)DArray_get(
			client_auth->parent->server->arr_client_last_activity, (size_t)client_auth->parent->int_last_activity_i);
		SFREE(client_last_activity->str_cookie);
		SFINISH_SNCAT(client_last_activity->str_cookie, &int_temp, client_auth->str_cookie_encrypted, strlen(client_auth->str_cookie_encrypted));
		SDEBUG("New cookie is %s", client_last_activity->str_cookie);
	} else {
		struct sock_ev_client_last_activity *client_last_activity;
		SFINISH_SALLOC(client_last_activity, sizeof(struct sock_ev_client_last_activity));
		memcpy(client_last_activity->str_client_ip, client_auth->parent->str_client_ip, INET_ADDRSTRLEN);
		SFINISH_SNCAT(client_last_activity->str_cookie, &int_temp, client_auth->str_cookie_encrypted, strlen(client_auth->str_cookie_encrypted));
		client_last_activity->last_activity_time = ev_now(EV_A);
		client_auth->parent->int_last_activity_i =
			(ssize_t)DArray_push(client_auth->parent->server->arr_client_last_activity, client_last_activity);
		SDEBUG("New cookie is %s", client_last_activity->str_cookie);
	}

	bol_error_state = false;
finish:

	SFREE_ALL();
	http_auth_free(client_auth);

	if (bol_error_state == true) {
		SDEBUG("str_response: %s", str_response);
		char *_str_response = str_response;
		str_response = DB_get_diagnostic(client_request->parent->conn, res);
		int_response_len = strlen(_str_response);
		SFINISH_SNFCAT(_str_response, &int_response_len, ":\n", (size_t)2, str_response, strlen(str_response));
		SFREE(str_response);
		char str_length[50];
		snprintf(str_length, 50, "%zu", strlen(_str_response));
		char *str_temp =
			"HTTP/1.1 500 Internal Server Error\015\012"
			"Server: " SUN_PROGRAM_LOWER_NAME "\015\012"
			"Content-Length: ";
		SFINISH_SNCAT(
			str_response, &int_response_len,
			str_temp, strlen(str_temp),
			str_length, strlen(str_length),
			"\015\012\015\012", (size_t)4,
			_str_response, int_response_len
		);
		SFREE(_str_response);
	}
	DB_free_result(res);

	if (CLIENT_WRITE(client_request->parent, str_response, int_response_len) < 0) {
		if (bol_tls) {
			SERROR_NORESPONSE_LIBTLS_CONTEXT(client_request->parent->tls_postage_io_context, "tls_write() failed");
		} else {
			SERROR_NORESPONSE("write() failed");
		}
	}
	SFREE(str_response);
	struct sock_ev_client *client = client_request->parent;
	client_request_free(client_request);
	SFINISH_CLIENT_CLOSE(client);
	bol_error_state = false;
	// This causes query_callback to stop looping
	return true;
}

void http_auth_change_database_step2(EV_P, void *cb_data, DB_conn *conn) {
	struct sock_ev_client_auth *client_auth = cb_data;
	SDEFINE_VAR_ALL(str_expires, str_temp1, str_user, str_open, str_closed);
	char *str_response = NULL;
	size_t int_response_len = 0;
	size_t int_temp = 0;

	SFINISH_CHECK(conn->int_status == 1, "%s", conn->str_response);

	size_t int_len = 0, int_i = 0, int_cookie_len = 0;

	int_cookie_len = strlen(client_auth->str_cookie_encrypted);

	SDEBUG("DATABASE CHANGE");
	str_expires = str_expire_one_day();

#ifdef ENVELOPE
	char *str_temp2 =
		"HTTP/1.1 200 OK\015\012"
		"Server: " SUN_PROGRAM_LOWER_NAME "\015\012"
		"Content-Type: application/json; charset=UTF-8\015\012"
		"Set-Cookie: envelope=";
	char *str_temp3 =
		"; HttpOnly\015\012"
		"Content-Length: 27\015\012\015\012"
		"{\"stat\": true, \"dat\": \"OK\"}";
	SFINISH_SNFCAT(
		str_response, &int_response_len,
		str_temp2, strlen(str_temp2),
		client_auth->str_cookie_encrypted, strlen(client_auth->str_cookie_encrypted),
		"; path=/; expires=", (size_t)18,
		str_expires, strlen(str_expires),
		(bol_tls ? "; secure" : ""), (size_t)(bol_tls ? 8 : 0),
		str_temp3, strlen(str_temp3)
	);
#else
	char *str_temp2 =
		"HTTP/1.1 200 OK\015\012"
		"Server: " SUN_PROGRAM_LOWER_NAME "\015\012"
		"Content-Type: application/json; charset=UTF-8\015\012"
		"Set-Cookie: postage_";
	char *str_temp3 =
		"; HttpOnly\015\012"
		"Content-Length: 27\015\012\015\012"
		"{\"stat\": true, \"dat\": \"OK\"}";
	SFINISH_SNCAT(
		str_response, &int_response_len,
		str_temp2, strlen(str_temp2),
		client_auth->str_int_connection_index, strlen(client_auth->str_int_connection_index),
		"=", (size_t)1,
		client_auth->str_cookie_encrypted, strlen(client_auth->str_cookie_encrypted),
		"; path=/; expires=", (size_t)18,
		str_expires, strlen(str_expires),
		(bol_tls ? "; secure" : ""), (size_t)(bol_tls ? 8 : 0),
		str_temp3, strlen(str_temp3)
	);
#endif

	client_auth->parent->int_last_activity_i = -1;
	for (int_i = 0, int_len = DArray_end(client_auth->parent->server->arr_client_last_activity); int_i < int_len; int_i += 1) {
		struct sock_ev_client_last_activity *client_last_activity =
			(struct sock_ev_client_last_activity *)DArray_get(client_auth->parent->server->arr_client_last_activity, int_i);
		if (client_last_activity &&
			strncmp(client_last_activity->str_client_ip, client_auth->parent->str_client_ip, INET_ADDRSTRLEN) == 0 &&
			strncmp(client_last_activity->str_cookie, client_auth->str_cookie_encrypted, int_cookie_len) == 0) {
			client_auth->parent->int_last_activity_i = (ssize_t)int_i;
			break;
		}
	}
	SDEBUG("client_auth->parent->int_last_activity_i: %d", client_auth->parent->int_last_activity_i);
	if (client_auth->parent->int_last_activity_i != -1) {
		struct sock_ev_client_last_activity *client_last_activity = (struct sock_ev_client_last_activity *)DArray_get(
			client_auth->parent->server->arr_client_last_activity, (size_t)client_auth->parent->int_last_activity_i);
		SFREE(client_last_activity->str_cookie);
		SFINISH_SNCAT(client_last_activity->str_cookie, &int_temp, client_auth->str_cookie_encrypted, strlen(client_auth->str_cookie_encrypted));
		SDEBUG("New cookie is %s", client_last_activity->str_cookie);
	} else {
		struct sock_ev_client_last_activity *client_last_activity;
		SFINISH_SALLOC(client_last_activity, sizeof(struct sock_ev_client_last_activity));
		memcpy(client_last_activity->str_client_ip, client_auth->parent->str_client_ip, INET_ADDRSTRLEN);
		SFINISH_SNCAT(client_last_activity->str_cookie, &int_temp, client_auth->str_cookie_encrypted, strlen(client_auth->str_cookie_encrypted));
		client_last_activity->last_activity_time = ev_now(EV_A);
		client_auth->parent->int_last_activity_i =
			(ssize_t)DArray_push(client_auth->parent->server->arr_client_last_activity, client_last_activity);
		SDEBUG("New cookie is %s", client_last_activity->str_cookie);
	}

	SFINISH_SNCAT(
		client_auth->parent->str_connname_folder, &int_temp,
		client_auth->str_connname, client_auth->int_connname_length,
		"_", (size_t)1,
		client_auth->str_database, strlen(client_auth->str_database)
	);
	if (client_auth->str_conn != NULL) {
		SFINISH_SNFCAT(
			client_auth->parent->str_connname_folder, &int_temp,
			"_", (size_t)1,
			client_auth->str_conn, client_auth->int_conn_length
		);
	}
	int_i = 0;
	int_len = strlen(client_auth->parent->str_connname_folder);
	while (int_i < int_len) {
		if (!isalnum(client_auth->parent->str_connname_folder[int_i])) {
			client_auth->parent->str_connname_folder[int_i] = '_';
		}

		int_i++;
	}

	str_temp1 = client_auth->str_user;
	SFINISH_CHECK((client_auth->str_user = snuri(str_temp1, client_auth->int_user_length, &client_auth->int_user_length)) != NULL, "snuri failed");
	SFREE(str_temp1);

	SFINISH_SNCAT(
		str_user, &int_temp,
		client_auth->parent->str_connname_folder, strlen(client_auth->parent->str_connname_folder),
		"/", (size_t)1,
		client_auth->str_user, client_auth->int_user_length
	);
	SFINISH_SNCAT(
		str_open, &int_temp,
		client_auth->parent->str_connname_folder, strlen(client_auth->parent->str_connname_folder),
		"/", (size_t)1,
		client_auth->str_user, client_auth->int_user_length,
		"/open", (size_t)5
	);
	SFINISH_SNCAT(
		str_closed, &int_temp,
		client_auth->parent->str_connname_folder, strlen(client_auth->parent->str_connname_folder),
		"/", (size_t)1,
		client_auth->str_user, client_auth->int_user_length,
		"/closed", (size_t)7
	);

#ifdef ENVELOPE
#else
	// connection folder
	char *str_temp = canonical(str_global_sql_root, client_auth->parent->str_connname_folder, "read_dir");
	if (str_temp == NULL) {
		str_temp = canonical(str_global_sql_root, client_auth->parent->str_connname_folder, "create_dir");
		SFINISH_CHECK(str_temp != NULL, "Could not create directory %s", client_auth->parent->str_connname_folder);
	}
	SFREE(str_temp);
	str_temp = canonical(str_global_sql_root, client_auth->parent->str_connname_folder, "read_dir");
	SFINISH_ERROR_CHECK(str_temp != NULL, "Could not create directory >%s/%s<", str_global_sql_root, client_auth->parent->str_connname_folder);
	SFREE(str_temp);

	// connection/user folder
	str_temp = canonical(str_global_sql_root, str_user, "read_dir");
	if (str_temp == NULL) {
		str_temp = canonical(str_global_sql_root, str_user, "create_dir");
		SFINISH_CHECK(str_temp != NULL, "Could not create directory %s", str_user);
	}
	SFREE(str_temp);
	str_temp = canonical(str_global_sql_root, str_user, "read_dir");
	SFINISH_ERROR_CHECK(str_temp != NULL, "Could not create directory >%s/%s<", str_global_sql_root, str_user);
	SFREE(str_temp);

	// connection/user/open folder
	str_temp = canonical(str_global_sql_root, str_open, "read_dir");
	if (str_temp == NULL) {
		str_temp = canonical(str_global_sql_root, str_open, "create_dir");
		SFINISH_CHECK(str_temp != NULL, "Could not create directory %s", str_open);
	}
	SFREE(str_temp);
	str_temp = canonical(str_global_sql_root, str_open, "read_dir");
	SFINISH_ERROR_CHECK(str_temp != NULL, "Could not create directory >%s/%s<", str_global_sql_root, str_open);
	SFREE(str_temp);

	// connection/user/closed folder
	str_temp = canonical(str_global_sql_root, str_closed, "read_dir");
	if (str_temp == NULL) {
		str_temp = canonical(str_global_sql_root, str_closed, "create_dir");
		SFINISH_CHECK(str_temp != NULL, "Could not create directory %s", str_closed);
	}
	SFREE(str_temp);
	str_temp = canonical(str_global_sql_root, str_closed, "read_dir");
	SFINISH_ERROR_CHECK(str_temp != NULL, "Could not create directory >%s/%s<", str_global_sql_root, str_closed);
	SFREE(str_temp);
	SFREE(str_global_error);
#endif

	bol_error_state = false;
finish:

	SFREE_ALL();

	if (bol_error_state == true) {
		SDEBUG("str_response: %s", str_response);
		char *_str_response = str_response;
		char str_length[50];
		snprintf(str_length, 50, "%zu", strlen(_str_response));
		char *str_temp =
			"HTTP/1.1 500 Internal Server Error\015\012"
			"Server: " SUN_PROGRAM_LOWER_NAME "\015\012"
			"Content-Length: ";
		SFINISH_SNCAT(
			str_response, &int_response_len,
			str_temp, strlen(str_temp),
			str_length, strlen(str_length),
			"\015\012\015\012", (size_t)4,
			_str_response, (int_response_len != 0 ? int_response_len : strlen(_str_response))
		);
		SFREE(_str_response);
	}

	if (CLIENT_WRITE(client_auth->parent, str_response, int_response_len) < 0) {
		if (bol_tls) {
			SERROR_NORESPONSE_LIBTLS_CONTEXT(client_auth->parent->tls_postage_io_context, "tls_write() failed");
		} else {
			SERROR_NORESPONSE("write() failed");
		}
	}
	SFREE(str_response);
	struct sock_ev_client *client = client_auth->parent;
	http_auth_free(client_auth);
	SFREE(client_auth);
	SFINISH_CLIENT_CLOSE(client);
	bol_error_state = false;
}

void http_auth_free(struct sock_ev_client_auth *client_auth) {
	if (client_auth != NULL) {
		if (client_auth->io.fd != 0) {
			ev_io_stop(global_loop, &client_auth->io);
		}
		SFREE(client_auth->str_action);
		SFREE_PWORD(client_auth->str_cookie_encrypted);
		SFREE(client_auth->str_connname);
		SFREE(client_auth->str_conn);
		SFREE(client_auth->str_user);
		SFREE(client_auth->str_database);
		SFREE_PWORD(client_auth->str_old_check_password);
		SFREE_PWORD(client_auth->str_password);
		SFREE_PWORD(client_auth->str_new_password);
		SFREE_PWORD(client_auth->str_int_connection_index);
	}
}
