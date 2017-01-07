#include "util_error.h"
bool bol_error_state = false;
char *str_global_log_level = NULL;
char *str_global_logfile = NULL;
char *str_global_error = NULL;

void sunlogf_root(
	char *str_file, int int_line_no, char *str_function, int int_error_level, const char *str_format, va_list va_arg1);

void info_root(char *str_file, int int_line_no, char *str_function, char *str_error, ...) {
	va_list va_arg1;
	va_start(va_arg1, str_error);

	sunlogf_root(str_file, int_line_no, str_function, 6, str_error, va_arg1);
}

void notice_root(char *str_file, int int_line_no, char *str_function, char *str_error, ...) {
	va_list va_arg1;
	va_start(va_arg1, str_error);

	sunlogf_root(str_file, int_line_no, str_function, 5, str_error, va_arg1);
}

void warn_root(char *str_file, int int_line_no, char *str_function, char *str_error, ...) {
	size_t int_global_error_len = 0;
	char *str_response = NULL;

	va_list va_arg1;
	va_start(va_arg1, str_error);
	va_list va_arg2;
	va_copy(va_arg2, va_arg1);
	va_list va_arg3;
	va_copy(va_arg3, va_arg1);

	SERROR_SALLOC(str_response, 2);
	size_t int_len = (size_t)vsnprintf(str_response, 1, str_error, va_arg2);
	SERROR_SREALLOC(str_response, int_len + 2);
	memset(str_response, 0, int_len + 2);
	vsnprintf(str_response, int_len + 1, str_error, va_arg3);

	SFREE(str_global_error);
	SERROR_SNCAT(str_global_error, &int_global_error_len,
		str_file, strlen(str_file),
		":", (size_t)1,
		str_function, strlen(str_function),
		": ", (size_t)2,
		str_response, strlen(str_response),
		"\n", (size_t)1);

	sunlogf_root(str_file, int_line_no, str_function, 4, str_error, va_arg1);
	SFREE_PWORD(str_response);
	return;
error:
	perror("TOTAL FAILURE! CANNOT EVEN ERROR CORRECTLY!");
	SFREE_PWORD(str_response);
	return;
}

void debug_root(char *str_file, int int_line_no, char *str_function, char *str_error, ...) {
	va_list va_arg1;
	va_start(va_arg1, str_error);

	sunlogf_root(str_file, int_line_no, str_function, 3, str_error, va_arg1);
}

void var_root(char *str_file, int int_line_no, char *str_function, char *str_error, ...) {
	va_list va_arg1;
	va_start(va_arg1, str_error);

	sunlogf_root(str_file, int_line_no, str_function, 2, str_error, va_arg1);
}

void error_noresponse_root(char *str_file, int int_line_no, char *str_function, char *str_error, ...) {
	size_t int_global_error_len = 0;
	char *str_response = NULL;

	va_list va_arg1;
	va_start(va_arg1, str_error);
	va_list va_arg2;
	va_copy(va_arg2, va_arg1);
	va_list va_arg3;
	va_copy(va_arg3, va_arg1);

	SERROR_SALLOC(str_response, 2);
	size_t int_len = (size_t)vsnprintf(str_response, 1, str_error, va_arg2);
	SERROR_SREALLOC(str_response, int_len + 2);
	memset(str_response, 0, int_len + 2);
	vsnprintf(str_response, int_len + 1, str_error, va_arg3);

	SFREE(str_global_error);
	SERROR_SNCAT(str_global_error, &int_global_error_len,
		str_file, strlen(str_file),
		":", (size_t)1,
		str_function, strlen(str_function),
		": ", (size_t)2,
		str_response, strlen(str_response),
		"\n", (size_t)1);

	sunlogf_root(str_file, int_line_no, str_function, 1, str_error, va_arg1);
	SFREE_PWORD(str_response);
	return;
error:
	perror("TOTAL FAILURE! CANNOT EVEN ERROR CORRECTLY!");
	SFREE_PWORD(str_response);
	return;
}

char *error_response_root(char *str_file, int int_line_no, char *str_function, char *str_error, ...) {
	char *str_response = NULL;
	size_t int_response_len = 0;

	va_list va_arg1;
	va_start(va_arg1, str_error);
	va_list va_arg2;
	va_copy(va_arg2, va_arg1);
	va_list va_arg3;
	va_copy(va_arg3, va_arg1);

	SERROR_SALLOC(str_response, 2);
	size_t int_len = (size_t)vsnprintf(str_response, 1, str_error, va_arg2);
	SERROR_SREALLOC(str_response, int_len + 2);
	memset(str_response, 0, int_len + 2);
	vsnprintf(str_response, int_len + 1, str_error, va_arg3);

	char *str_temp = NULL;
	str_temp = str_response;
	if (str_global_error == NULL) {
		SERROR_SNCAT(str_response, &int_response_len,
			"FATAL\012", (size_t)6,
			str_temp, strlen(str_temp));
	} else {
		SERROR_SNCAT(str_response, &int_response_len,
			"FATAL\012", (size_t)6,
			str_global_error, strlen(str_global_error),
			str_temp, strlen(str_temp));
		SFREE(str_global_error);
	}
	SFREE(str_temp);
	SERROR_CHECK(str_response, "SNFCAT FAILED");

	SDEBUG("str_file >%s<", str_file);
	SDEBUG("int_line_no >%d<", int_line_no);
	SDEBUG("str_function >%s<", str_function);
	SDEBUG("str_error >%s<", str_error);
	sunlogf_root(str_file, int_line_no, str_function, 1, str_error, va_arg1);
	return str_response;
error:
	perror("TOTAL FAILURE! CANNOT EVEN ERROR CORRECTLY!");
	SFREE_PWORD(str_response);
	return NULL;
}

char *warn_response_root(char *str_file, int int_line_no, char *str_function, char *str_error, ...) {
	char *str_response = NULL;
	size_t int_response_len = 0;

	va_list va_arg1;
	va_start(va_arg1, str_error);
	va_list va_arg2;
	va_copy(va_arg2, va_arg1);
	va_list va_arg3;
	va_copy(va_arg3, va_arg1);

	SERROR_SALLOC(str_response, 2);
	size_t int_len = (size_t)vsnprintf(str_response, 1, str_error, va_arg2);
	SERROR_SREALLOC(str_response, int_len + 2);
	memset(str_response, 0, int_len + 2);
	vsnprintf(str_response, int_len + 1, str_error, va_arg3);

	char *str_temp = NULL;
	str_temp = str_response;
	if (str_global_error == NULL) {
		SERROR_SNCAT(str_response, &int_response_len,
			"FATAL\012", (size_t)6,
			str_temp, strlen(str_temp));
	} else {
		SERROR_SNCAT(str_response, &int_response_len,
			"FATAL\012", (size_t)6,
			str_global_error, strlen(str_global_error),
			str_temp, strlen(str_temp));
		SFREE(str_global_error);
	}
	SFREE(str_temp);
	SERROR_CHECK(str_response, "SNCAT FAILED");

	SDEBUG("str_file >%s<", str_file);
	SDEBUG("int_line_no >%d<", int_line_no);
	SDEBUG("str_function >%s<", str_function);
	SDEBUG("str_error >%s<", str_error);
	sunlogf_root(str_file, int_line_no, str_function, 4, str_error, va_arg1);
	return str_response;
error:
	perror("TOTAL FAILURE! CANNOT EVEN ERROR CORRECTLY!");
	SFREE_PWORD(str_response);
	return NULL;
}

/*
Logger function, send to STDERR.
*/
static const char *str_date_format = "%a, %d %b %Y %H:%M:%S";
void sunlogf_root(
	char *str_file, int int_line_no, char *str_function, int int_error_level, const char *str_format, va_list va_arg1) {
	char str_new_format[512];

	char str_error[256];
	if (errno != 0 && (int_error_level == 1 || int_error_level == 4)) {
		char buf[256] = {0};
		strerror_r(errno, buf, 255);
		snprintf(str_error, 256, "CERR: %d (%s) === ", errno, buf);
	} else {
		str_error[0] = '\0'; // empty string
	}

	// time
	time_t tim_rawtime;
	struct tm tm_timeinfo;

	time(&tim_rawtime);
#ifdef _WIN32
	SERROR_CHECK_NORESPONSE(localtime_s(&tm_timeinfo, &tim_rawtime) == 0, "localtime_s %d (%s)", errno, strerror(errno));
#else
	SERROR_CHECK_NORESPONSE(localtime_r(&tim_rawtime, &tm_timeinfo) != NULL, "localtime_r %d (%s)", errno, strerror(errno));
#endif
	char str_current_time[256] = {0};
	SERROR_CHECK_NORESPONSE(strftime(str_current_time, 255, str_date_format, &tm_timeinfo) != 0, "strftime() failed");

	// str_pid format
	char str_pid[256] = "0000000"; // was 4 but that seemed small- justin
	char str_file_full[256];
	snprintf(str_file_full, 256, "%s:%d:%s()", str_file, int_line_no, str_function);
	snprintf(str_pid, 256, "%s PID: %-7d FILE: %-55s", str_current_time, getpid(), str_file_full);

	// all strings so no need to free
	// clang-format off
    char *log_level =
            int_error_level == 1 ?  " ERROR      === " :
            int_error_level == 2 ?  "    VAR     === " :
            int_error_level == 3 ?  "   DEBUG    === " :
            int_error_level == 4 ?  "     WARN   === " :
            int_error_level == 5 ?  "    NOTICE  === " :
                                    "       INFO === ";
	// clang-format on

	snprintf(str_new_format, 512, "%s%s%s%s\012", str_pid, log_level, str_error, str_format);

	if (
		str_global_log_level != NULL &&
		strncmp(str_global_log_level, "none", 5) != 0 &&
		(
			(
				str_global_log_level != NULL &&
				strncmp(str_global_log_level, "info", 5) == 0 &&
				int_error_level <= 6
			) ||
			(
				str_global_log_level != NULL &&
				strncmp(str_global_log_level, "notice", 7) == 0 &&
				int_error_level <= 5
			) ||
			(
				str_global_log_level != NULL &&
				strncmp(str_global_log_level, "warn", 5) == 0 &&
				int_error_level <= 4
			) ||
			int_error_level <= 3
		)
	) {
#ifdef _WIN32
		FILE *fp = NULL;
		if (strcmp(str_global_logfile, "stderr") != 0 || str_global_logfile == NULL) {
			fp = fopen(str_global_logfile, "a");
		}
		if (fp != NULL) {
			vfprintf(fp, str_new_format, va_arg1);
			fclose(fp);
		} else {
			vfprintf(stderr, str_new_format, va_arg1);
		}
#else
		vfprintf(stderr, str_new_format, va_arg1);
#endif
	}

	va_end(va_arg1);

	return;
}
