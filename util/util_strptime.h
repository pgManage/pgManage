#include <ctype.h>
#include <stdbool.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <time.h>

// http://stackoverflow.com/a/13277456
char *strptime(const char *s, const char *format, struct tm *tm);