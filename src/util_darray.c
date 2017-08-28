#include "util_darray.h"

DArray *DArray_create(size_t element_size, size_t initial_max) {
	DArray *array;
	SERROR_SALLOC(array, sizeof(DArray));
	SDEBUG("DArray_create(%p)", array);
	array->max = initial_max;
	SERROR_CHECK(array->max > 0, "You must set an initial_max > 0.");

	SERROR_SALLOC(array->contents, initial_max * sizeof(void *));

	array->end = 0;
	array->element_size = element_size;
	array->expand_rate = DEFAULT_EXPAND_RATE;

	return array;
error:
	SFREE(array);
	return NULL;
}

void DArray_clear(DArray *array) {
	SDEBUG("DArray_clear(%p)", array);
	size_t i = 0;
	if (array->element_size > 0) {
		for (i = 0; i < array->end; i++) {
			SDEBUG("clear: %i", i);
			SFREE(array->contents[i]);
		}
	}
}

static inline bool DArray_resize(DArray *array, size_t newsize) {
	array->max = newsize;
	SERROR_CHECK(array->max > 0, "The newsize must be > 0.");
	SERROR_SREALLOC(array->contents, array->max * sizeof(void *));
	return true;
error:
	return false;
}

bool DArray_expand(DArray *array) {
	size_t old_max = array->max;
	SERROR_CHECK(DArray_resize(array, array->max + array->expand_rate), "DArray_resize failed.");

	memset(array->contents + old_max, 0, array->expand_rate * sizeof(void *));

	return true;
error:
	return false;
}

bool DArray_contract(DArray *array) {
	size_t new_size = array->end < (size_t)array->expand_rate ? (size_t)array->expand_rate : array->end;

	SERROR_CHECK(DArray_resize(array, new_size + 1), "DArray_resize failed.");
	return true;
error:
	return false;
}

void DArray_destroy(DArray *array) {
	SDEBUG("DArray_destroy(%p)", array);
	if (array) {
		SFREE(array->contents);
	}
	SFREE(array);
}

void DArray_clear_destroy(DArray *array) {
	SDEBUG("DArray_clear_destroy(%p)", array);
	DArray_clear(array);
	DArray_destroy(array);
}

size_t DArray_push(DArray *array, void *el) {
	array->contents[array->end] = el;
	array->end++;

	if (DArray_end(array) >= DArray_max(array)) {
		DArray_expand(array);
	}
	return array->end;
}

void *DArray_pop(DArray *array) {
	SERROR_CHECK((ssize_t)array->end - 1 >= 0, "Attempt to pop from empty array.");

	void *el = DArray_remove(array, array->end - 1);
	array->end--;

	if (DArray_end(array) > (size_t)array->expand_rate && DArray_end(array) % array->expand_rate) {
		SERROR_CHECK(DArray_contract(array), "DArray_contract failed.");
	}

	return el;
error:
	return NULL;
}

int darray_strcmp(char **a, char **b) {
	return strncmp(*a, *b, strlen(*a));
}

void DArray_qsort(DArray *array, DArray_compare cmp) {
	qsort(array->contents, DArray_count(array), sizeof(void *), cmp);
}

// You must Darray_clear_destroy what this returns (unless it fails)
DArray *split_cstr(char *str_to_split, const char *str_delim) {
	DArray *darr_ret = DArray_create(sizeof(char *), 1);

	char *str = NULL;
	char *ptr_start = NULL;
	char *ptr_end = NULL;
	char *ptr_delim_pos = NULL;
	char *str_temp = NULL;

	size_t int_len = 0;
	size_t int_temp_len = 0;

	SERROR_SNCAT(str, &int_len,
		str_to_split, strlen(str_to_split));
	ptr_start = str;

	size_t int_length = strlen(str);
	size_t int_delim_length = strlen(str_delim);
	ptr_end = str + int_length;

	while (str < ptr_end) {
		ptr_delim_pos = strstr(str, str_delim);
		if (ptr_delim_pos == NULL) {
			ptr_delim_pos = ptr_end;
		}
		*ptr_delim_pos = '\0';

		SERROR_SNCAT(str_temp, &int_temp_len,
			str, int_len);
		DArray_push(darr_ret, str_temp);
		str_temp = NULL;

		str = ptr_delim_pos + int_delim_length;
	}

	SFREE(ptr_start);

	return darr_ret;
error:
	SFREE(ptr_start);

	return NULL;
}

bool DArray_set(DArray *array, size_t i, void *el) {
	SERROR_CHECK(i < array->max, "darray attempt to set past max.");
	array->contents[i] = el;
	return true;
error:
	return false;
}

void *DArray_get(DArray *array, size_t i) {
	// we're having a "darray attempt to get past max" error occasionally.
	// all I know right now is it doesn't happen much under make test, but
	// seems to happen more frequently when run from an install location.
	// i was working on it and stopped to work on a http_file.c:266 "CERR 46"
	// error
	// if I don't come back and delete this, just leave it here for when it
	// happens again
	SERROR_CHECK(i < array->max, "darray attempt to get past max.");
	return array->contents[i];
error:
	printf("i: %zu, array->max %zu\n", i, array->max);
	return NULL;
}

void *DArray_remove(DArray *array, size_t i) {
	void *el = array->contents[i];

	array->contents[i] = NULL;

	return el;
}

void *DArray_new(DArray *array) {
	void *vod_ptr = NULL;
	SERROR_CHECK(array->element_size > 0, "Can't use DArray_new on 0 size darrays.");
	SERROR_SALLOC(vod_ptr, array->element_size);
	return vod_ptr;
error:
	SFREE(vod_ptr);
	return NULL;
}
