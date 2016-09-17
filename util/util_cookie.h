#pragma once

#include <string.h>
#include <time.h>

#include "util_salloc.h"

/*
return date formatted for cookie
date is midnight for tomorrow
*/
char *str_expire_two_day();
/*
return date formatted for cookie
date is midnight for two days from now
*/
char *str_expire_one_day();
