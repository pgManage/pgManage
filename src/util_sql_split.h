#pragma once

#include <string.h>

#include "util_darray.h"
#include "util_salloc.h"
#include "util_string.h"

/*
Splits sql on the semicolons, ignore comments, strings and such. Removes empty
last query if applicable.
Meaning this:
SELECT 'test1';
SELECT 'test2';
--Empty query!

Will return two elements just like this will
SELECT 'test1';
SELECT 'test2'
*/
DArray *DArray_sql_split(char *str_form_data);
