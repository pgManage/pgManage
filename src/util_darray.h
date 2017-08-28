#pragma once

#include <assert.h>
#include <stdbool.h>
#include <stdlib.h>

#include "util_error.h"
#include "util_salloc.h"

typedef struct DArray {
	size_t end;
	size_t max;
	size_t element_size;
	size_t expand_rate;
	void **contents;
} DArray;
/*
Taken from:
https://github.com/zedshaw/liblcthw/blob/master/src/lcthw/darray.h

See also:
http://c.learncodethehardway.org/book/ex34.html

Description:
DArrays are dynamic length arrays.

Thank you Zed A. Shaw
*/
DArray *DArray_create(size_t element_size, size_t initial_max);
void DArray_destroy(DArray *array);
void DArray_clear(DArray *array);
bool DArray_expand(DArray *array);
bool DArray_contract(DArray *array);
size_t DArray_push(DArray *array, void *el);
void *DArray_pop(DArray *array);
void DArray_clear_destroy(DArray *array);
bool DArray_set(DArray *array, size_t i, void *el);
void *DArray_get(DArray *array, size_t i);
void *DArray_remove(DArray *array, size_t i);
void *DArray_new(DArray *array);

#define DArray_last(A) ((A)->contents[(A)->end - 1])
#define DArray_first(A) ((A)->contents[0])
#define DArray_end(A) ((A)->end)
#define DArray_count(A) DArray_end(A)
#define DArray_max(A) ((A)->max)

#define DEFAULT_EXPAND_RATE 300

#define DArray_free(E) free((E))

typedef int (*DArray_compare)(const void *a, const void *b);

int darray_strcmp(char **a, char **b);

void DArray_qsort(DArray *array, DArray_compare cmp);

DArray *split_cstr(char *str_to_split, const char *str_delim);
