#pragma once

#include <stdbool.h>
#include <stdio.h>
#include "db_framework.h"
#ifdef _WIN32
#include "util/util_getopt.h"
#include <windows.h>
//#include <WinBase.h>
#else
#include <getopt.h>
#include <pwd.h>
#endif
#include "util/util_canonical.h"
#include "util/util_darray.h"
#include "util/util_error.h"
#include "util/util_ini.h"

#ifdef ENVELOPE
#define SUN_PROGRAM_LOWER_NAME "envelope"
#define SUN_PROGRAM_WORD_NAME "Envelope"
#define SUN_PROGRAM_UPPER_NAME "ENVELOPE"
#else
#define SUN_PROGRAM_LOWER_NAME "postage"
#define SUN_PROGRAM_WORD_NAME "Postage"
#define SUN_PROGRAM_UPPER_NAME "POSTAGE"
#endif

extern char *str_global_config_file;
extern char *str_global_connection_file;
extern char *str_global_login_group;
extern char *str_global_web_root;
extern char *str_global_data_root;
extern char *str_global_tls_cert;
extern char *str_global_tls_key;
extern char *str_global_port;
extern bool bol_global_local_only;
extern bool bol_global_super_only;
extern bool bol_global_allow_custom_connections;
extern char *str_global_public_username;
extern char *str_global_public_password;

extern DArray *darr_global_connection;
extern size_t int_global_login_timeout;
extern size_t int_global_custom_connection_number;
extern bool bol_global_set_user;

#ifdef ENVELOPE
extern char *str_global_app_path;
extern char *str_global_role_path;
#else
extern char *str_global_sql_root;
#endif

extern char cwd[1024];
#ifdef _WIN32
extern const char *VERSION;
extern char *POSTAGE_PREFIX;
#endif

struct struct_connection {
	char *str_connection_name;
	char *str_connection_info;
	char *str_connection_database;
};
/*
This function free()s a struct_connection and it's members
*/
void connection_free(struct struct_connection *connection);

/*
This function checks to see if a connection name is linked to a connection
string
*/
bool exists_connection_info(char *str_connection_name);

/*
This function gets the connection string and index a connection name is linked
to
int_connection_index can be NULL
*/
char *get_connection_info(char *str_connection_name, size_t *int_connection_index);

/*
This function gets the database name a connection name is linked to
*/
char *get_connection_database(char *str_connection_name);

/*
This function parses the connection file the user supplied
*/
bool parse_connection_file();

/*
This function reads the options from the command line and the config file
*/
bool parse_options(int argc, char *const *argv);

/*
This function prints the usage and exits
*/
void usage();
