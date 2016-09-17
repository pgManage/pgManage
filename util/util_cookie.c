#include "util_cookie.h"

// return date formatted for cookie, midnight
// must be free'd
char *str_expire_one_day() {
	// malloc return string
	char *str_return = NULL;

	SERROR_SALLOC(str_return, 50);

	// get time zone
	time_t time_next_day;
	time(&time_next_day);

	// advance 24 hours
	time_next_day = time_next_day + (24 * 60 * 60); // next day

	// convert to localtime
	struct tm *tm_next_day = localtime(&time_next_day);

	// set to midnight
	tm_next_day->tm_sec = 0;
	tm_next_day->tm_min = 0;
	tm_next_day->tm_hour = 0;

	// back to time_t type
	time_t return_time_t = mktime(tm_next_day);

	// convert to gmt time
	struct tm *tm_return_time = gmtime(&return_time_t);

	// convert to string
	strftime(str_return, 50, "%a, %d %b %Y %H:%M:%S %Z", tm_return_time);

	// HARK YE ONLOOKER: GOOGLE CHROME DOES NOT UNDERSTAND ANYTHING BUT GMT TIME
	// ZONES! DO NOT USE OTHER TIME ZONES!
	return str_return;

error:
	SFREE(str_return);
	return NULL;
}

// return date formatted for cookie, midnight
// must be free'd
char *str_expire_two_day() {
	// malloc return string
	char *str_return = NULL;

	SERROR_SALLOC(str_return, 50);

	// get time zone
	time_t time_next_day;
	time(&time_next_day);

	// advance 48 hours
	time_next_day = time_next_day + (2 * 24 * 60 * 60); // day after next

	// convert to localtime
	struct tm tm_next_day_result;
	struct tm *tm_next_day = &tm_next_day_result;
#ifdef _WIN32
	localtime_s(tm_next_day, &time_next_day);
#else
	localtime_r(&time_next_day, tm_next_day);
#endif

	// set to midnight
	tm_next_day->tm_sec = 0;
	tm_next_day->tm_min = 0;
	tm_next_day->tm_hour = 0;

	// back to time_t type
	time_t return_time_t = mktime(tm_next_day);

	// convert to gmt time
	struct tm tm_return_time_result;
	struct tm *tm_return_time = &tm_return_time_result;
#ifdef _WIN32
	gmtime_s(tm_return_time, &return_time_t);
#else
	gmtime_r(&return_time_t, tm_return_time);
#endif
	// convert to string
	strftime(str_return, 50, "%a, %d %b %Y %H:%M:%S %Z", tm_return_time);

	// HARK YE ONLOOKER: GOOGLE CHROME DOES NOT UNDERSTAND ANYTHING BUT GMT TIME
	// ZONES! DO NOT
	// USE OTHER TIME ZONES!
	return str_return;
error:
	SFREE(str_return);
	return NULL;
}
