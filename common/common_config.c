#include "common_config.h"

char *str_global_config_file = NULL;
char *str_global_connection_file = NULL;
char *str_global_login_group = NULL;
char *str_global_web_root = NULL;
char *str_global_data_root = NULL;
char *str_global_tls_cert = NULL;
char *str_global_tls_key = NULL;
char *str_global_port = NULL;
bool bol_global_local_only = false;


#ifdef ENVELOPE
bool bol_global_super_only = false;
#else
bool bol_global_super_only = true;
#endif

size_t int_global_login_timeout = 3600;
size_t int_global_custom_connection_number = 0;
uint64_t int_global_session_id = 0;

DArray *darr_global_connection = NULL;

#ifdef ENVELOPE
char *str_global_public_username = NULL;
char *str_global_public_password = NULL;
bool bol_global_set_user = false;

bool bol_global_allow_origin = false;

char *str_global_app_path = NULL;
char *str_global_role_path = NULL;
#else
bool bol_global_allow_custom_connections = false;
char *str_global_sql_root = NULL;
#endif

// size_t int_global_cookie_timeout = 86400;
char cwd[1024];

#ifdef _WIN32
const char *VERSION =
#include "../VERSION"
	;
char *POSTAGE_PREFIX = NULL;
#endif

// clang-format off
// VAR									CONFIG NAME						COMMAND-LINE SHORT NAME		COMMAND-LINE FULL NAME
// str_global_config_file				NULL							c							config-file
// str_global_connection_file			connection_file					d							connection-file
// str_global_login_group				login_group						g							login-group
// str_global_app_path					app_path						y							app-path
// str_global_role_path					role_path						z							role-path
// str_global_web_root					web_root						r							web-root
// str_global_port						postage_port OR envelope_port	p							postage-port OR envelope-port
// str_global_tls_cert					tls_cert						j							tls-cert
// str_global_tls_key					tls_key							k							tls-key
// bol_global_local_only				NULL							x							local-only
// bol_global_super_only				super_only						s							super-only
// bol_global_allow_custom_connections	allow_custom_connections		n							allow-custom-connections
// int_global_login_timeout	 			login_timeout					t							login-timeout
// str_global_log_level					log_level						l							log-level
// str_global_logfile					log_file						o							log-file
// str_global_public_username			public_username					u							public-username
// str_global_public_password			public_password					w							public-password
// bol_global_allow_origin				allow_origin					i							allow-origin
// clang-format on

/*
This function is called for each directive in the ini file
*/
static int handler(void *str_user, const char *str_section, const char *str_name, const char *str_value) {
	if (str_user != NULL) {
	} // get rid of unused variable warning

	size_t int_len = 0;

#define SMATCH(s, n) strcmp(str_section, s) == 0 && strcmp(str_name, n) == 0
	if (SMATCH("", "connection_file")) {
		SFREE(str_global_connection_file);
		SERROR_SNCAT(str_global_connection_file, &int_len,
			str_value, strlen(str_value));

	} else if (SMATCH("", "login_group")) {
		SFREE(str_global_login_group);
		SERROR_SNCAT(str_global_login_group, &int_len,
			str_value, strlen(str_value));

#ifdef ENVELOPE
	} else if (SMATCH("", "app_path")) {
		SFREE(str_global_app_path);
		SERROR_SNCAT(str_global_app_path, &int_len,
			str_value, strlen(str_value));

	} else if (SMATCH("", "role_path")) {
		SFREE(str_global_role_path);
		SERROR_SNCAT(str_global_role_path, &int_len,
			str_value, strlen(str_value));

	} else if (SMATCH("", "public_username")) {
		SFREE(str_global_public_username);
		SERROR_SNCAT(str_global_public_username, &int_len,
			str_value, strlen(str_value));

	} else if (SMATCH("", "public_password")) {
		SFREE(str_global_public_password);
		SERROR_SNCAT(str_global_public_password, &int_len,
			str_value, strlen(str_value));

	} else if (SMATCH("", "allow_origin")) {
		bol_global_allow_origin = *str_value == 'T' || *str_value == 't';

#endif
	} else if (SMATCH("", "mode")) {
#ifdef ENVELOPE_ODBC
		SFREE(str_global_mode);
		SERROR_SNCAT(str_global_mode, &int_len,
			str_value, strlen(str_value));
#endif

	} else if (SMATCH("", "web_root")) {
		SFREE(str_global_web_root);
		SERROR_SNCAT(str_global_web_root, &int_len,
			str_value, strlen(str_value));

	} else if (SMATCH("", "data_root")) {
		SFREE(str_global_data_root);
		SERROR_SNCAT(str_global_data_root, &int_len,
			str_value, strlen(str_value));

	} else if (SMATCH("", "" SUN_PROGRAM_LOWER_NAME "_port")) {
		SFREE(str_global_port);
		SERROR_SNCAT(str_global_port, &int_len,
			str_value, strlen(str_value));

	} else if (SMATCH("", "tls_cert")) {
		SFREE(str_global_tls_cert);
		SERROR_SNCAT(str_global_tls_cert, &int_len,
			str_value, strlen(str_value));

	} else if (SMATCH("", "tls_key")) {
		SFREE(str_global_tls_key);
		SERROR_SNCAT(str_global_tls_key, &int_len,
			str_value, strlen(str_value));

	} else if (SMATCH("", "super_only")) {
		bol_global_super_only = *str_value == 'T' || *str_value == 't';

	} else if (SMATCH("", "log_level")) {
		SFREE(str_global_log_level);
		SERROR_SNCAT(str_global_log_level, &int_len,
			str_value, strlen(str_value));

#ifdef ENVELOPE
#else
	} else if (SMATCH("", "allow_custom_connections")) {
		bol_global_allow_custom_connections = *str_value == 'T' || *str_value == 't';
#endif

	} else if (SMATCH("", "login_timeout")) {
		SINFO("str_value: %s", str_value);
		int_global_login_timeout = (size_t)strtol(str_value, NULL, 10);

	} else if (SMATCH("", "log_file")) {
		SFREE(str_global_logfile);
		SERROR_SNCAT(str_global_logfile, &int_len,
			str_value, strlen(str_value));

	} else {
		SERROR("Unknown config section/name: %s %s", str_section, str_name);
	}
	bol_error_state = false;
	return 1;
error:
	bol_error_state = false;
	return 0;
}

bool exists_connection_info(char *str_connection_name) {
	struct struct_connection *temp_connection = NULL;
#ifdef ENVELOPE
	if (str_connection_name != NULL) {
	} // get rid of unused parameter warning

	temp_connection = DArray_get(darr_global_connection, 0);
	return temp_connection != NULL;
#else
	size_t i, int_length;

	for (i = 0, int_length = DArray_count(darr_global_connection); i < int_length; i++) {
		temp_connection = DArray_get(darr_global_connection, i);
		if (strncmp(temp_connection->str_connection_name, str_connection_name, strlen(str_connection_name) + 1) == 0) {
			return true;
		}
	}

	return false;
#endif
}

char *get_connection_info(char *str_connection_name, size_t *int_connection_index) {
	struct struct_connection *temp_connection = NULL;
#ifdef ENVELOPE
	if (str_connection_name != NULL) {
	} // get rid of unused parameter warning

	if (int_connection_index != NULL) {
	} // get rid of unused parameter warning

	temp_connection = DArray_get(darr_global_connection, 0);
	return temp_connection != NULL ? temp_connection->str_connection_info : NULL;
#else
	size_t i, int_length;

	for (i = 0, int_length = DArray_count(darr_global_connection); i < int_length; i++) {
		temp_connection = DArray_get(darr_global_connection, i);
		if (strncmp(temp_connection->str_connection_name, str_connection_name, strlen(str_connection_name)) == 0) {
			if (int_connection_index != NULL) {
				*int_connection_index = i;
			}
			return temp_connection->str_connection_info;
		}
	}

	if (int_connection_index != NULL) {
		*int_connection_index = 0;
	}
	return NULL;
#endif
}

char *get_connection_database(char *str_connection_name) {
	struct struct_connection *temp_connection = NULL;
#ifdef ENVELOPE
	if (str_connection_name != NULL) {
	} // get rid of unused parameter warning

	temp_connection = DArray_get(darr_global_connection, 0);
	return temp_connection != NULL ? temp_connection->str_connection_database : NULL;
#else
	size_t i, int_length;

	for (i = 0, int_length = DArray_count(darr_global_connection); i < int_length; i++) {
		temp_connection = DArray_get(darr_global_connection, i);
		if (strncmp(temp_connection->str_connection_name, str_connection_name, strlen(str_connection_name)) == 0) {
			return temp_connection->str_connection_database;
		}
	}

	return NULL;
#endif
}

bool parse_connection_file() {
	darr_global_connection = DArray_create(sizeof(struct struct_connection *), 1);
	struct struct_connection *temp_connection;
	char *ptr_temp = NULL;
	char *ptr_content = NULL;
	char *ptr_end_content = NULL;

	size_t int_temp_len = 0;
	size_t int_line_length = 0;
	ssize_t int_ftell = 0;
	size_t int_length = 0;
#ifdef ENVELOPE
#else
	size_t int_param_len = 0;
	size_t int_equals_len = 0;
	size_t int_temp1_len = 0;
#endif
	size_t int_i = 0;
	size_t int_len = 0;
	size_t int_chunk_len = 0;

	size_t int_connection_info_len = 0;

	FILE *fp = NULL;
	SDEFINE_VAR_ALL(str_content, str_temp, str_temp1);

	//// Open file
	fp = fopen(str_global_connection_file, "r");
	SERROR_CHECK(fp != NULL, "Failed to open %s for reading: %d (%s)", str_global_connection_file, errno, strerror(errno));

	//// Get file length
	fseek(fp, 0, SEEK_END);
	int_ftell = ftell(fp);
	fseek(fp, 0, SEEK_SET);
	SERROR_CHECK(int_ftell >= 0, "ftell() failed");
	int_length = (size_t)int_ftell;

	//// Read file into variable
	SERROR_SALLOC(str_content, int_length + 1);
	fread(str_content, 1, int_length, fp);
	str_content[int_length] = '\0';

	SERROR_CHECK(!fclose(fp), "Error closing file: %d (%s).", errno, strerror(errno));
	fp = NULL;

	SERROR_CHECK(str_content != NULL, "Failed to load connection list from file: %s", str_global_connection_file);

	ptr_content = str_content;
	ptr_end_content = str_content + strlen(str_content);

	while (ptr_content < ptr_end_content) {
		int_line_length = strcspn(ptr_content, "#:\012");
		if (*(ptr_content + int_line_length) == '#') {
			int_line_length = strcspn(ptr_content, "\012");
			ptr_content += int_line_length + 1;
		} else if (*(ptr_content + int_line_length) == '\012') {
			ptr_content += int_line_length + 1;
		} else {
			SERROR_SALLOC(temp_connection, sizeof(struct struct_connection));

			// get name
			int_line_length = strcspn(ptr_content, "#:");
			if (*(ptr_content + int_line_length) == '#') {
				SFREE(temp_connection);
				int_line_length = strcspn(ptr_content, "\012");
				ptr_content += int_line_length + 1;
			} else {
				SERROR_SALLOC(temp_connection->str_connection_name, int_line_length + 1);

				memcpy(temp_connection->str_connection_name, ptr_content, int_line_length);
				temp_connection->str_connection_name[int_line_length] = '\0';
				ptr_content += int_line_length + 1;

				// get connection string
				int_line_length = strcspn(ptr_content, "#\015\012");
				SERROR_SALLOC(temp_connection->str_connection_info, int_line_length + 1);

				memcpy(temp_connection->str_connection_info, ptr_content, int_line_length);
				temp_connection->str_connection_info[int_line_length] = '\0';

				SERROR_SNCAT(str_temp, &int_temp_len,
					temp_connection->str_connection_info, strlen(temp_connection->str_connection_info));
				ptr_temp = str_temp;
				int_i = 0;
				int_len = int_line_length;
				while (int_i < int_len) {
					int_chunk_len = 1;

					// If it is a space
					if (isspace(*ptr_temp)) {
// Do nothing

// Else, we check if it is user or password and
// remove those (postage only) and keep the others
#ifdef ENVELOPE
					} else if (strncmp(ptr_temp, "user", 4) == 0) {
						bol_global_set_user = true;
#else
					} else if (strncmp(ptr_temp, "user", 4) == 0 || strncmp(ptr_temp, "password", 8) == 0 ||
							   strncmp(ptr_temp, "dbname", 6) == 0) {
						int_param_len = strcspn(ptr_temp, "=");
						int_equals_len = int_param_len;
						do {
							int_param_len += 1;
						} while (isspace(ptr_temp[int_param_len]));
						if (ptr_temp[int_param_len] == '\'') {
							int_param_len += 1;
							do {
								int_param_len += 1;
							} while (ptr_temp[int_param_len] != '\'' || (ptr_temp[int_param_len - 1] == '\\' && ptr_temp[int_param_len - 2] != '\\'));
							int_param_len += 1;
						} else {
							int_param_len += strcspn(ptr_temp + int_param_len, " ");
						}

						SDEBUG("ptr_temp: %s, ptr_temp + int_equals_len + 1: %s", ptr_temp, ptr_temp + int_equals_len + 1);
						if (strncmp(ptr_temp, "dbname", 6) == 0) {
							SERROR_SALLOC(temp_connection->str_connection_database, int_param_len - int_equals_len);
							memcpy(temp_connection->str_connection_database, ptr_temp + int_equals_len + 1,
								int_param_len - (int_equals_len + 1));
							temp_connection->str_connection_database[int_param_len - (int_equals_len + 1)] = '\0';

							SDEBUG("str_connection_database: %s", temp_connection->str_connection_database);
						}

						SERROR_SNCAT(str_temp1, &int_temp1_len,
							ptr_temp + int_param_len, strlen(ptr_temp + int_param_len));
						memcpy(ptr_temp, str_temp1, (int_line_length - int_i) - int_param_len);
						SFREE(str_temp1);
						memset(ptr_temp + ((int_line_length - int_i) - int_param_len), 0, int_param_len);

						int_i += int_param_len;

#endif
					} else {
						int_chunk_len = strcspn(ptr_temp, "=");
						do {
							int_chunk_len += 1;
						} while (isspace(ptr_temp[int_chunk_len]));
						if (ptr_temp[int_chunk_len] == '\'') {
							do {
								int_chunk_len += 1;
							} while (ptr_temp[int_chunk_len] != '\'' ||
									 ((ptr_temp[int_chunk_len - 1] == '\\' && ptr_temp[int_chunk_len - 2] != '\\') ||
										 (ptr_temp[int_chunk_len + 1] == '\'' && ptr_temp[int_chunk_len] == '\'') ||
										 (ptr_temp[int_chunk_len - 1] == '\'' && ptr_temp[int_chunk_len - 2] != '\'' &&
											 ptr_temp[int_chunk_len - 2] != '\\')));
							int_chunk_len += 1;
						} else {
							int_chunk_len += strcspn(ptr_temp + int_chunk_len, " ");
						}
					}

					int_i += int_chunk_len;
					ptr_temp += int_chunk_len;
				}
				SFREE(temp_connection->str_connection_info);
				SERROR_SNCAT(temp_connection->str_connection_info, &int_connection_info_len,
					str_temp, strlen(str_temp));
				SFREE(str_temp);

				int_line_length = strcspn(ptr_content, "\012");
				ptr_content += int_line_length + 1;

				SDEBUG(">%s|%s<", temp_connection->str_connection_name, temp_connection->str_connection_info);

				DArray_push(darr_global_connection, temp_connection);
			}
		}
	}

	int_global_custom_connection_number = DArray_end(darr_global_connection) + 1;

	bol_error_state = false;
	SFREE_ALL();
	return true;
error:
	bol_error_state = false;
	SFREE_ALL();
	return false;
}

bool parse_options(int argc, char *const *argv) {
	// Removed because it is confusing
	// if (argc < 2) {
	//		 usage();
	//		 abort();
	// }
	size_t int_global_len = 0;
	size_t int_global_logfile_len = 0;
	size_t int_prefix_len = 0;
	size_t int_temp_len = 0;

	SERROR_SNCAT(str_global_log_level, &int_global_len,
		"error", (size_t)5);

#ifdef ENVELOPE_ODBC
	SERROR_SNCAT(str_global_mode, &int_global_len,
		"", (size_t)0);
#endif

	int ch;
#ifdef _WIN32
#else
	ssize_t bufsize;
#endif

#ifdef _WIN32
#ifdef _WIN64
	SERROR_SNCAT(POSTAGE_PREFIX, &int_prefix_len,
		"\\Program Files\\Workflow Products", (size_t)32);
#else
	BOOL bolWow64 = FALSE;
	if (IsWow64Process(GetCurrentProcess(), &bolWow64) != FALSE && bolWow64 == TRUE) {
		SERROR_SNCAT(POSTAGE_PREFIX, &int_prefix_len,
			"\\Program Files (x86)\\Workflow Products", (size_t)38);
	} else {
		SERROR_SNCAT(POSTAGE_PREFIX, &int_prefix_len,
			"\\Program Files\\Workflow Products", (size_t)32);
	}
#endif
#else
	int_prefix_len = strlen(POSTAGE_PREFIX);
#endif

#ifdef _WIN32
	SERROR_SNCAT(
		str_global_config_file, &int_global_len,
		POSTAGE_PREFIX, int_prefix_len,
		"\\" SUN_PROGRAM_WORD_NAME "\\config\\" SUN_PROGRAM_LOWER_NAME ".conf",
			strlen("\\" SUN_PROGRAM_WORD_NAME "\\config\\" SUN_PROGRAM_LOWER_NAME ".conf"));
	SERROR_SNCAT(
		str_global_connection_file, &int_global_len,
		POSTAGE_PREFIX, int_prefix_len,
		"\\" SUN_PROGRAM_WORD_NAME "\\config\\" SUN_PROGRAM_LOWER_NAME "-connections.conf",
			strlen("\\" SUN_PROGRAM_WORD_NAME "\\config\\" SUN_PROGRAM_LOWER_NAME "-connections.conf"));
#else
	SERROR_SNCAT(
		str_global_config_file, &int_global_len,
		POSTAGE_PREFIX, int_prefix_len,
		"/etc/" SUN_PROGRAM_LOWER_NAME "/" SUN_PROGRAM_LOWER_NAME ".conf",
			strlen("/etc/" SUN_PROGRAM_LOWER_NAME "/" SUN_PROGRAM_LOWER_NAME ".conf"));
	SERROR_SNCAT(
		str_global_connection_file, &int_global_len,
		POSTAGE_PREFIX, int_prefix_len,
		"/etc/" SUN_PROGRAM_LOWER_NAME "/" SUN_PROGRAM_LOWER_NAME "-connections.conf",
			strlen("/etc/" SUN_PROGRAM_LOWER_NAME "/" SUN_PROGRAM_LOWER_NAME "-connections.conf"));
#endif
#ifdef ENVELOPE
	SERROR_SNCAT(str_global_public_username, &int_global_len,
		"", (size_t)0);
	SERROR_SNCAT(str_global_public_password, &int_global_len,
		"", (size_t)0);

	SERROR_SNCAT(str_global_port, &int_global_len,
		"8888", (size_t)4);
#else
	SERROR_SNCAT(str_global_port, &int_global_len,
		"8080", (size_t)4);
#endif

	// options descriptor
	// clang-format off
	static struct option longopts[22] = {
		{"help",							no_argument,			NULL,	'h'},
		{"version",							no_argument,			NULL,	'v'},
		{"config-file",						required_argument,		NULL,	'c'},
		{"connection-file",					required_argument,		NULL,	'd'},
		{"login-group",						required_argument,		NULL,	'g'},
#ifdef ENVELOPE
		{"app-path",						required_argument,		NULL,	'y'},
		{"role-path",						required_argument,		NULL,	'z'},
		{"public-username",					required_argument,		NULL,	'u'},
		{"public-password",					required_argument,		NULL,	'w'},
		{"allow-origin",					required_argument,		NULL,	'i'},
#else
		{"allow-custom-connections",		required_argument,		NULL,	'n'},
#endif
		{"local-only",						required_argument,		NULL,	'x'},
		{"web-root",						required_argument,		NULL,	'r'},
		{"data-root",						required_argument,		NULL,	'a'},
		{""SUN_PROGRAM_LOWER_NAME"-port",	required_argument,		NULL,	'p'},
		{"tls-cert",						required_argument,		NULL,	'j'},
		{"tls-key",							required_argument,		NULL,	'k'},
		{"super-only",						required_argument,		NULL,	's'},
		{"login-timeout",					required_argument,		NULL,	't'},
		{"log-level",						required_argument,		NULL,	'l'},
		{"log-file",						required_argument,		NULL,	'o'},
		{NULL,								0,						NULL,	0}
	};
// clang-format on

#ifdef ENVELOPE
	while ((ch = getopt_long(argc, argv, "hvc:d:g:y:z:u:w:i:x:r:p:j:k:s:t:l:o:", longopts, NULL)) != -1) {
#else
	while ((ch = getopt_long(argc, argv, "hvc:d:g:n:x:r:p:j:k:s:t:l:o:", longopts, NULL)) != -1) {
#endif
		if (ch == '?') {
			// getopt_long prints an error in this case
			goto error;

		} else if (ch == 'h') {
			usage();
			goto error;
		} else if (ch == 'v') {
			printf(SUN_PROGRAM_WORD_NAME " %s\n", VERSION);
			goto error;
		} else if (ch == 'c') {
			SFREE(str_global_config_file);
			SERROR_SNCAT(str_global_config_file, &int_global_len,
				optarg, strlen(optarg));
		}
	}

	opterr = 0;
	optind = 1;

	char *str_config_empty = "";
	ini_parse(str_global_config_file, handler, &str_config_empty);

#ifdef ENVELOPE
	while ((ch = getopt_long(argc, argv, "hvc:d:g:y:z:u:w:i:x:r:p:j:k:s:t:l:o:", longopts, NULL)) != -1) {
#else
	while ((ch = getopt_long(argc, argv, "hvc:d:g:n:x:r:p:j:k:s:t:l:o:", longopts, NULL)) != -1) {
#endif
		if (ch == '?') {
			// getopt_long prints an error in this case
			goto error;

		} else if (ch == 'h') {
		} else if (ch == 'v') {
		} else if (ch == 'c') {
		} else if (ch == 'd') {
			SFREE(str_global_connection_file);
			SERROR_SALLOC(str_global_connection_file, strlen(optarg) + 1);
			memcpy(str_global_connection_file, optarg, strlen(optarg));
			str_global_connection_file[strlen(optarg)] = '\0';

		} else if (ch == 'g') {
			SFREE(str_global_login_group);
			SERROR_SNCAT(str_global_login_group, &int_global_len,
				optarg, strlen(optarg));

#ifdef ENVELOPE
		} else if (ch == 'y') {
			SFREE(str_global_app_path);
			SERROR_SNCAT(str_global_app_path, &int_global_len,
				optarg, strlen(optarg));

		} else if (ch == 'z') {
			SFREE(str_global_role_path);
			SERROR_SNCAT(str_global_role_path, &int_global_len,
				optarg, strlen(optarg));

		} else if (ch == 'u') {
			SFREE(str_global_public_username);
			SERROR_SNCAT(str_global_public_username, &int_global_len,
				optarg, strlen(optarg));

		} else if (ch == 'w') {
			SFREE(str_global_public_password);
			SERROR_SNCAT(str_global_public_password, &int_global_len,
				optarg, strlen(optarg));

		} else if (ch == 'i') {
			bol_global_allow_origin = *optarg == 'T' || *optarg == 't';
#else
		} else if (ch == 'n') {
			bol_global_allow_custom_connections = *optarg == 'T' || *optarg == 't';

#endif
		} else if (ch == 'x') {
			bol_global_local_only = *optarg == 'T' || *optarg == 't';

		} else if (ch == 'r') {
			SFREE(str_global_web_root);
			SERROR_SNCAT(str_global_web_root, &int_global_len,
				optarg, strlen(optarg));

		} else if (ch == 'a') {
			SFREE(str_global_data_root);
			SERROR_SNCAT(str_global_data_root, &int_global_len,
				optarg, strlen(optarg));

		} else if (ch == 'p') {
			SFREE(str_global_port);
			SERROR_SNCAT(str_global_port, &int_global_len,
				optarg, strlen(optarg));

		} else if (ch == 'j') {
			SFREE(str_global_tls_cert);
			SERROR_SNCAT(str_global_tls_cert, &int_global_len,
				optarg, strlen(optarg));

		} else if (ch == 'k') {
			SFREE(str_global_tls_key);
			SERROR_SNCAT(str_global_tls_key, &int_global_len,
				optarg, strlen(optarg));

		} else if (ch == 's') {
			bol_global_super_only = *optarg == 'T' || *optarg == 't';

		} else if (ch == 't') {
			int_global_login_timeout = (size_t)strtol(optarg, NULL, 10);

		} else if (ch == 'l') {
			SFREE(str_global_log_level);
			SERROR_SNCAT(str_global_log_level, &int_global_len,
				optarg, strlen(optarg));

		} else if (ch == 'o') {
			SFREE(str_global_logfile);
			SERROR_SNCAT(str_global_logfile, &int_global_logfile_len,
				optarg, strlen(optarg));

		} else if (ch == 0) {
			fprintf(stderr, "no options");
			goto error;
		} else {
			usage();
			goto error;
		}
	}
	argc -= optind;
	argv += optind;

	char *str_temp = NULL;

#ifdef ENVELOPE
	if (str_global_login_group == NULL) {
		SERROR_SNCAT(str_global_login_group, &int_global_len,
			"envelope_g", (size_t)10);
	}

	if (str_global_app_path == NULL) {
#ifdef _WIN32
		SERROR_SNCAT(str_global_app_path, &int_global_len,
			POSTAGE_PREFIX, int_prefix_len,
			"\\" SUN_PROGRAM_WORD_NAME "\\app",
				strlen("\\" SUN_PROGRAM_WORD_NAME "\\app"));
#else
		SERROR_SNCAT(str_global_app_path, &int_global_len,
			POSTAGE_PREFIX, int_prefix_len,
			"/etc/" SUN_PROGRAM_LOWER_NAME "/app",
				strlen("/etc/" SUN_PROGRAM_LOWER_NAME "/app"));
#endif //_WIN32
	}

	if (str_global_role_path == NULL) {
#ifdef _WIN32
		SERROR_SNCAT(str_global_role_path, &int_global_len,
			POSTAGE_PREFIX, int_prefix_len,
			"\\" SUN_PROGRAM_WORD_NAME "\\role",
				strlen("\\" SUN_PROGRAM_WORD_NAME "\\role"));
#else
		SERROR_SNCAT(str_global_role_path, &int_global_len,
			POSTAGE_PREFIX, int_prefix_len,
			"/etc/" SUN_PROGRAM_LOWER_NAME "/role",
				strlen("/etc/" SUN_PROGRAM_LOWER_NAME "/role"));
#endif //_WIN32
	}
#endif // ENVELOPE

	if (str_global_web_root == NULL) {
#ifdef _WIN32
		SERROR_SNCAT(str_global_web_root, &int_global_len,
			POSTAGE_PREFIX, int_prefix_len,
			"\\" SUN_PROGRAM_WORD_NAME "\\web_root",
				strlen("\\" SUN_PROGRAM_WORD_NAME "\\web_root"));
#else
		SERROR_SNCAT(str_global_web_root, &int_global_len,
			POSTAGE_PREFIX, int_prefix_len,
			"/etc/" SUN_PROGRAM_LOWER_NAME "/web_root",
				strlen("/etc/" SUN_PROGRAM_LOWER_NAME "/web_root"));
#endif //_WIN32
	}

	if (str_global_data_root == NULL) {
#ifdef _WIN32
		char *str_app_data = getenv("AppData"); // NULL;
		SDEBUG("str_app_data: %s", str_app_data);
		SERROR_SNCAT(str_global_data_root, &int_global_len,
			((char *)str_app_data) + 2, strlen(((char *)str_app_data) + 2),
			str_app_data[strlen(str_app_data) - 1] == '\\' ? "\\" SUN_PROGRAM_LOWER_NAME : "\\" SUN_PROGRAM_LOWER_NAME,
				strlen(str_app_data[strlen(str_app_data) - 1] == '\\' ? "\\" SUN_PROGRAM_LOWER_NAME : "\\" SUN_PROGRAM_LOWER_NAME));
#else
		// free MUST NOT be called on this struct
		struct passwd pw_result;
		struct passwd *pw = &pw_result;
		bufsize = sysconf(_SC_GETPW_R_SIZE_MAX);

		if (bufsize == -1) {
			bufsize = 16384;
		}
		SERROR_SALLOC(str_temp, (size_t)bufsize + 1);
		getpwuid_r(getuid(), pw, str_temp, (size_t)bufsize, &pw);

		SERROR_SNCAT(str_global_data_root, &int_global_len,
			pw->pw_dir, strlen(pw->pw_dir),
			pw->pw_dir[strlen(pw->pw_dir) - 1] == '/' ? "." SUN_PROGRAM_LOWER_NAME : "/." SUN_PROGRAM_LOWER_NAME,
				strlen(pw->pw_dir[strlen(pw->pw_dir) - 1] == '/' ? "." SUN_PROGRAM_LOWER_NAME : "/." SUN_PROGRAM_LOWER_NAME));
		SFREE(str_temp);
#endif
	}

#ifdef ENVELOPE
#else
	// If the directory exists this function will error if given "create_dir"
	//	 but if the directory exists, we don't want the error
	//	 so we just ignore it
	str_temp = canonical("", str_global_data_root, "read_dir");
	if (str_temp == NULL) {
		str_temp = canonical("", str_global_data_root, "create_dir");
	}
	SFREE(str_temp);

	str_temp = canonical("", str_global_data_root, "read_dir");
	SERROR_CHECK(str_temp != NULL, "canonical failed!");
	SFREE(str_temp);

	SDEBUG("str_global_sql_root: %s", str_global_sql_root);
	if (str_global_sql_root == NULL) {
		SERROR_SNCAT(str_global_sql_root, &int_global_len,
			str_global_data_root, strlen(str_global_data_root),
			str_global_data_root[strlen(str_global_data_root) - 1] == '/' ? "sql" : "/sql",
				strlen(str_global_data_root[strlen(str_global_data_root) - 1] == '/' ? "sql" : "/sql"));
	}
	SDEBUG("str_global_sql_root: %s", str_global_sql_root);

	str_temp = canonical("", str_global_sql_root, "read_dir");
	if (str_temp == NULL) {
		str_temp = canonical("", str_global_sql_root, "create_dir");
	}
	SFREE(str_temp);
	str_temp = canonical("", str_global_sql_root, "read_dir");
	SERROR_CHECK(str_temp != NULL, "canonical failed!");
	SFREE(str_global_sql_root);
	str_global_sql_root = str_temp;
	str_temp = NULL;
	bol_error_state = false;
#endif

	// This is because if there is a symoblic link, we want the resolved path
	SFREE(str_global_data_root);
	str_global_data_root = str_temp;
	str_temp = NULL;

#ifdef _WIN32
	if (str_global_web_root[1] != ':' && str_global_web_root[0] != '\\' && str_global_web_root[0] != '/') {
#else
	if (str_global_web_root[0] != '/') {
#endif
#ifdef _WIN32
		SERROR_SNCAT(str_temp, &int_temp_len,
			cwd + 2, strlen(cwd + 2),
			"/", (size_t)1,
			str_global_web_root, strlen(str_global_web_root));
#else
		SERROR_SNCAT(str_temp, &int_temp_len,
			cwd, strlen(cwd),
			"/", (size_t)1,
			str_global_web_root, strlen(str_global_web_root));
#endif
		SDEBUG("str_temp: %s", str_temp);
		SFREE(str_global_web_root);
		str_global_web_root = canonical("", str_temp, "valid_path");
		SFREE(str_temp);
#ifdef _WIN32
	} else if (str_global_web_root[1] == ':') {
		str_temp = str_global_web_root;
		SERROR_SNCAT(str_global_web_root, &int_global_len,
			str_global_web_root + 2, strlen(str_global_web_root) - 2);
		SFREE(str_temp);
	}
#else
	}
#endif
	SDEBUG("str_global_web_root: %s", str_global_web_root);

#ifdef ENVELOPE
#ifdef _WIN32
	if (str_global_app_path[1] != ':' && str_global_app_path[0] != '\\' && str_global_app_path[0] != '/') {
#else
	if (str_global_app_path[0] != '/') {
#endif // _WIN32
#ifdef _WIN32
		SERROR_SNCAT(str_temp, &int_temp_len,
			cwd + 2, strlen(cwd + 2),
			"/", (size_t)1,
			str_global_app_path, strlen(str_global_role_path));
#else
		SERROR_SNCAT(str_temp, &int_temp_len,
			cwd, strlen(cwd),
			"/", (size_t)1,
			str_global_app_path, strlen(str_global_role_path));
#endif // _WIN32
		SDEBUG("str_temp: %s", str_temp);
		SFREE(str_global_app_path);
		str_global_app_path = canonical("", str_temp, "valid_path");
		SFREE(str_temp);
#ifdef _WIN32
	} else if (str_global_app_path[1] == ':') {
		str_temp = str_global_app_path;
		SERROR_SNCAT(str_global_app_path, &int_global_len,
			str_global_app_path + 2, strlen(str_global_role_path) - 2);
		SFREE(str_temp);
	}
#else
	}
#endif // _WIN32
	SDEBUG("str_global_app_path: %s", str_global_app_path);

#ifdef _WIN32
	if (str_global_role_path[1] != ':' && str_global_role_path[0] != '\\' && str_global_role_path[0] != '/') {
#else
	if (str_global_role_path[0] != '/') {
#endif // _WIN32
#ifdef _WIN32
		SERROR_SNCAT(str_temp, &int_temp_len,
			cwd + 2, strlen(cwd + 2),
			"\\", (size_t)1,
			str_global_role_path, strlen(str_global_role_path));
#else
		SERROR_SNCAT(str_temp, &int_temp_len,
			cwd, strlen(cwd),
			"/", (size_t)1,
			str_global_role_path, strlen(str_global_role_path));
#endif // _WIN32
		SDEBUG("str_temp: %s", str_temp);
		SFREE(str_global_role_path);
		str_global_role_path = canonical("", str_temp, "valid_path");
		SFREE(str_temp);
#ifdef _WIN32
	} else if (str_global_role_path[1] == ':') {
		str_temp = str_global_role_path;
		SERROR_SNCAT(str_global_role_path, &int_global_len,
			str_global_role_path + 2, strlen(str_global_role_path) - 2);
		SFREE(str_temp);
	}
#else
	}
#endif // _WIN32
#endif // ENVELOPE

#ifdef _WIN32
	if (str_global_logfile == NULL) {
		SERROR_SNCAT(str_global_logfile, &int_global_logfile_len,
			POSTAGE_PREFIX, int_prefix_len,
			"\\" SUN_PROGRAM_WORD_NAME "\\log\\" SUN_PROGRAM_WORD_NAME ".log",
				strlen("\\" SUN_PROGRAM_WORD_NAME "\\log\\" SUN_PROGRAM_WORD_NAME ".log"));
	}
	if (strcmp(str_global_logfile, "stderr") != 0) {
		if (str_global_logfile[1] != ':' && str_global_logfile[0] != '\\' && str_global_logfile[0] != '/') {
			SERROR_SNCAT(str_temp, &int_temp_len,
				cwd + 2, strlen(cwd + 2),
				"/", (size_t)1,
				str_global_logfile, int_global_logfile_len);
			SDEBUG("str_temp: %s", str_temp);
			SFREE(str_global_logfile);
			str_global_logfile = canonical("", str_temp, "valid_path");
			SFREE(str_temp);

		} else if (str_global_logfile[1] == ':') {
			str_temp = str_global_logfile;
			SERROR_SNCAT(str_global_logfile, &int_global_logfile_len,
				str_global_logfile + 2, int_global_logfile_len - 2);
			SFREE(str_temp);
		}
	}
	printf("str_global_logfile: %s\n", str_global_logfile);
	SDEBUG("str_global_logfile: %s", str_global_logfile);
#endif
	SDEBUG("str_global_tls_cert: %s", str_global_tls_cert);
	SDEBUG("str_global_tls_key: %s", str_global_tls_key);

	SERROR_CHECK(parse_connection_file() == true, "Configuration failed");

	bol_error_state = false;
	return true;
error:
	bol_error_state = false;
	return false;
}

void usage() {
	printf("Usage: " SUN_PROGRAM_LOWER_NAME "\012");
	printf("\t[-h | --help]\012");
	printf("\t[-v | --version]\012");
	printf("\t[-c <config-file>				  \t| --config-file=<config-file>]\012");
	printf("\t[-d <connection-file>			  \t| --connection-file=<connection-file>]\012");
	printf("\t[-g <login-group>				  \t| --login-group=<login-group>]\012");
#ifdef ENVELOPE
	printf("\t[-y <app-path>					 \t| --app-path=<app-path>]\012");
	printf("\t[-z <role-path>					\t| --role-path=<role-path>]\012");
#else
	printf("\t[-n <allow-custom-connections>	\t| --allow-custom-connections=<allow-custom-connections>]\012");
#endif
	printf("\t[-r <web-root>					 \t| --web-root=<web-root>]\012");
	printf("\t[-p <" SUN_PROGRAM_LOWER_NAME "-port>\t| --" SUN_PROGRAM_LOWER_NAME "-port=<" SUN_PROGRAM_LOWER_NAME "-port>]\012");
	printf("\t[-j <tls-cert>					 \t| --tls-cert=<tls-cert>]\012");
	printf("\t[-k <tls-key>					  \t| --tls-key=<tls-key>]\012");
	printf("\t[-s <super-only>				   \t| --super-only=<super-only>]\012");
	printf("\t[-l <log-level>					\t| --log-level=<log-level>]\012");
	printf("\t[-o <log-file>					 \t| --log-file=<log-file>]\012");
	printf("\012");
	printf("For more information, run `man " SUN_PROGRAM_LOWER_NAME "`\012");
}

void connection_free(struct struct_connection *connection) {
	if (connection != NULL) {
		SFREE(connection->str_connection_name);
		SFREE(connection->str_connection_info);
		SFREE(connection->str_connection_database);
	}
	SFREE(connection);
}
