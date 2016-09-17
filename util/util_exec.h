#pragma once

#ifdef _WIN32
#include <windows.h>
#endif

#include "util_canonical.h"
#include "util_darray.h"
#include "util_error.h"
#include "util_idle.h"
#include <dirent.h>
#include <ev.h>
#include <stdarg.h>

typedef void (*exec_callback_t)(
	EV_P, void *cb_data, bool bol_error, bool bol_finish, int int_exit_code, char *str_output, size_t int_len);

#define sunny_exec(A, B, C, D, ...) s_exec(A, VA_NUM_ARGS(__VA_ARGS__), B, C, D, ##__VA_ARGS__)
bool s_exec(EV_P, int int_num_args, void *cb_data, exec_callback_t exec_callback, char *str_binary, ...);
