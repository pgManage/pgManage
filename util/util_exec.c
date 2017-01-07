#include "util_exec.h"

#ifdef _WIN32

typedef struct {
	ev_check check;
	void *cb_data;
	char *str_current_response;
	size_t int_current_response_len;
	exec_callback_t exec_callback;

	HANDLE h_process;

	HANDLE h_output_read_tmp, h_output_read, h_output_write;
	HANDLE h_input_write_tmp, h_input_read, h_input_write;
	HANDLE h_error_write;
	HANDLE h_thread;
	DWORD int_thread_id;
	SECURITY_ATTRIBUTES sa;
} exec_cb_data_t;

void sunny_exec_output_cb(EV_P, ev_check *w, int revents) {
	exec_cb_data_t *exec_cb_data = (exec_cb_data_t *)w;
	DWORD int_exit_code = 0;
	bool bol_get_exit_success = true;
	char buf[2] = {0, 0};
	bool bol_read_file_success = ReadFile(exec_cb_data->h_output_read, buf, 1, NULL, NULL);
	if (bol_read_file_success) {
		// fprintf(stderr, "%c", buf[0]);
		if (exec_cb_data->str_current_response == NULL) {
			SERROR_SNCAT(exec_cb_data->str_current_response, &exec_cb_data->int_current_response_len,
				"", (size_t)0);
		}
		exec_cb_data->int_current_response_len += 1;
		SERROR_SREALLOC(exec_cb_data->str_current_response, exec_cb_data->int_current_response_len + 1);
		exec_cb_data->str_current_response[exec_cb_data->int_current_response_len - 1] = buf[0];
		exec_cb_data->str_current_response[exec_cb_data->int_current_response_len] = 0;
	} else {
		bol_get_exit_success = GetExitCodeProcess(exec_cb_data->h_process, &int_exit_code);
		if (bol_get_exit_success == false || int_exit_code != STILL_ACTIVE) {
			SDEBUG("bol_get_exit_success: %s", bol_get_exit_success ? "true" : "false");
			SDEBUG("STILL_ACTIVE: %d", STILL_ACTIVE);
			SDEBUG("int_exit_code: %d", int_exit_code);

			if (exec_cb_data->str_current_response != NULL) {
				exec_cb_data->exec_callback(EV_A, exec_cb_data->cb_data, false, false, 0, exec_cb_data->str_current_response,
					exec_cb_data->int_current_response_len);
				SFREE(exec_cb_data->str_current_response);
			}

			exec_cb_data->exec_callback(EV_A, exec_cb_data->cb_data, !bol_get_exit_success, true,
				bol_get_exit_success ? int_exit_code : STILL_ACTIVE, NULL, 0);

			if (!CloseHandle(exec_cb_data->h_output_read)) {
				SWARN_NORESPONSE("CloseHandle failed");
			}

			if (!CloseHandle(exec_cb_data->h_input_write)) {
				SWARN_NORESPONSE("CloseHandle failed");
			}

			if (!CloseHandle(exec_cb_data->h_process)) {
				SWARN_NORESPONSE("CloseHandle failed");
			}

			ev_check_stop(EV_A, &exec_cb_data->check);
			decrement_idle(EV_A);
			SFREE(exec_cb_data);
		}
	}
	if (bol_read_file_success) {
		if (buf[0] == '\n') {
			// SDEBUG("exec_cb_data->int_current_response_len: %d", exec_cb_data->int_current_response_len);
			// int int_i = 0;
			// for (; int_i < exec_cb_data->int_current_response_len; int_i += 1) {
			//	fprintf(stderr, "%c", exec_cb_data->str_current_response[int_i]);
			//}
			// SDEBUG("exec_cb_data->int_current_response_len: %d", exec_cb_data->int_current_response_len);
			exec_cb_data->exec_callback(EV_A, exec_cb_data->cb_data, false, false, 0, exec_cb_data->str_current_response,
				exec_cb_data->int_current_response_len);
			SFREE(exec_cb_data->str_current_response);
		}
	}
	return;
error:
	if (!CloseHandle(exec_cb_data->h_output_read)) {
		SWARN_NORESPONSE("CloseHandle failed");
	}

	if (!CloseHandle(exec_cb_data->h_input_write)) {
		SWARN_NORESPONSE("CloseHandle failed");
	}

	if (!CloseHandle(exec_cb_data->h_process)) {
		SWARN_NORESPONSE("CloseHandle failed");
	}

	ev_check_stop(EV_A, &exec_cb_data->check);
	decrement_idle(EV_A);
	SFREE(exec_cb_data->str_current_response);
	SFREE(exec_cb_data);
	return;
}
#else

typedef struct {
	ev_io io;
	void *cb_data;
	char *str_current_response;
	exec_callback_t exec_callback;

	int pfp[2], pid;		   /* the pipe and the process	*/
	int parent_end, child_end; /* of pipe 			*/
} exec_cb_data_t;

#endif

bool s_exec(EV_P, int int_num_args, void *cb_data, exec_callback_t exec_callback, char *_str_binary, ...) {
	SDEBUG("int_num_args: %d", int_num_args);
	va_list ap;
	int int_i = 0;

	size_t int_binary_len = 0;
	size_t int_temp2_len = 0;
	size_t int_temp3_len = 0;

	SDEFINE_VAR_ALL(str_temp2, str_temp3);
	exec_cb_data_t *exec_cb_data = NULL;
#ifdef _WIN32
	PROCESS_INFORMATION pi;
	STARTUPINFOA si;
	size_t int_total_len = strlen(_str_binary) + 3;
	SDEFINE_VAR_MORE(str_binary, str_command_line);
	char **arr_str_argument = NULL;
	char *ptr_command_line = NULL;
#else
#endif
	size_t *arr_int_length = NULL;
	char *str_response = NULL;

	va_start(ap, _str_binary);
	SFINISH_SALLOC(arr_int_length, int_num_args * sizeof(size_t));
#ifdef _WIN32
	SFINISH_SALLOC(arr_str_argument, int_num_args * sizeof(char *));

	SFINISH_SNCAT(str_temp2, &int_temp2_len,
		_str_binary, strlen(_str_binary));
	SFINISH_REPLACE(str_temp2, "\"", "\\\"", "g");
	SFINISH_SNCAT(str_binary, &int_binary_len,
		"\"", (size_t)1,
		str_temp2, strlen(str_temp2),
		"\"", (size_t)1);
	SFREE(str_temp2);
#endif

	// store lengths for the args
	for (int_i = 0; int_i < int_num_args; int_i += 1) {
		char *str_temp = va_arg(ap, char *);
		SDEBUG("str_temp: %s", str_temp);
		size_t int_len = 0;
		if (str_temp != NULL) {
#ifdef _WIN32
			if (str_temp[0] == '/' && str_temp[1] == 'C' && str_temp[2] == ':') {
				SDEBUG("str_temp + 3: %s", str_temp + 3);

				SFINISH_SNCAT(str_temp2, &int_temp2_len,
					str_temp + 3, strlen(str_temp + 3));
				SDEBUG("str_temp2: %s", str_temp2);

				SFINISH_REPLACE(str_temp2, "\"", "\\\"", "g");
				SDEBUG("str_temp2: %s", str_temp2);

				SFINISH_SNCAT(str_temp3, &int_temp3_len,
					" /C:\"", (size_t)5,
					str_temp2, int_temp2_len,
					"\"", (size_t)1);
				SDEBUG("str_temp3: %s", str_temp3);
			} else {
				SFINISH_SNCAT(str_temp2, &int_temp2_len,
					str_temp, strlen(str_temp));
				SFINISH_REPLACE(str_temp2, "\"", "\\\"", "g");
				SFINISH_SNCAT(str_temp3, &int_temp3_len,
					" \"", (size_t)2,
					str_temp2, int_temp2_len,
					"\"", (size_t)1);
			}

			arr_str_argument[int_i] = str_temp3;
			int_len = strlen(str_temp3);

			SFREE(str_temp2);
			str_temp3 = NULL;
			int_total_len += int_len;
#else
			int_len = strlen(str_temp);
			int_total_len += int_len;
#endif
		}
		arr_int_length[int_i] = int_len;
	}
	va_end(ap);

#ifdef _WIN32
	SFINISH_SALLOC(str_command_line, int_total_len + 1);
	ptr_command_line = str_command_line;
	SDEBUG("str_binary: %s", str_binary);
	memcpy(ptr_command_line, str_binary, strlen(str_binary));
	ptr_command_line += strlen(str_binary);
	SDEBUG("str_command_line: %s", str_command_line);

	// fill the new field
	for (int_i = 0; int_i < int_num_args; int_i += 1) {
		SDEBUG("arr_str_argument[%d]: %s", int_i, arr_str_argument[int_i]);
		if (arr_int_length[int_i] > 0 && arr_str_argument[int_i] != NULL) {
			memcpy(ptr_command_line, arr_str_argument[int_i], arr_int_length[int_i]);
			ptr_command_line += arr_int_length[int_i];
		}
	}

	SDEBUG("str_command_line: %s", str_command_line);
#else
#endif

#ifdef _WIN32
	SFINISH_SALLOC(exec_cb_data, sizeof(exec_cb_data_t));
	exec_cb_data->cb_data = cb_data;
	exec_cb_data->exec_callback = exec_callback;

	// Set up the security attributes struct.
	exec_cb_data->sa.nLength = sizeof(SECURITY_ATTRIBUTES);
	exec_cb_data->sa.lpSecurityDescriptor = NULL;
	exec_cb_data->sa.bInheritHandle = true;

	// Create the child output pipe.
	SFINISH_CHECK(
		CreatePipe(&exec_cb_data->h_output_read_tmp, &exec_cb_data->h_output_write, &exec_cb_data->sa, 0), "CreatePipe failed");

	// Create a duplicate of the output write handle for the std error
	// write handle. This is necessary in case the child application
	// closes one of its std output handles.
	SFINISH_CHECK(DuplicateHandle(GetCurrentProcess(), exec_cb_data->h_output_write, GetCurrentProcess(),
					  &exec_cb_data->h_error_write, 0, true, DUPLICATE_SAME_ACCESS),
		"DuplicateHandle failed");

	// Create the child input pipe.
	SFINISH_CHECK(
		CreatePipe(&exec_cb_data->h_input_read, &exec_cb_data->h_input_write_tmp, &exec_cb_data->sa, 0), "CreatePipe failed");

	// Create new output read handle and the input write handles. Set the inherit properties to false. Otherwise, the child
	// inherits the
	// handles and, as a result, non-closeable handles to the pipes are created.
	SFINISH_CHECK(DuplicateHandle(GetCurrentProcess(), exec_cb_data->h_output_read_tmp, GetCurrentProcess(),
					  &exec_cb_data->h_output_read, 0, false, DUPLICATE_SAME_ACCESS),
		"DupliateHandle failed");

	SFINISH_CHECK(DuplicateHandle(GetCurrentProcess(), exec_cb_data->h_input_write_tmp, GetCurrentProcess(),
					  &exec_cb_data->h_input_write, 0, false, DUPLICATE_SAME_ACCESS),
		"DupliateHandle failed");

	// Close inheritable copies of the handles you do not want to be inherited.
	SFINISH_CHECK(CloseHandle(exec_cb_data->h_output_read_tmp), "CloseHandle failed");
	SFINISH_CHECK(CloseHandle(exec_cb_data->h_input_write_tmp), "CloseHandle failed");

	// Set up the start up info struct.
	ZeroMemory(&si, sizeof(STARTUPINFO));
	si.cb = sizeof(STARTUPINFO);
	si.dwFlags = STARTF_USESTDHANDLES | STARTF_USESHOWWINDOW;
	si.hStdOutput = exec_cb_data->h_output_write;
	si.hStdInput = exec_cb_data->h_input_read;
	si.hStdError = exec_cb_data->h_error_write;
	si.wShowWindow = SW_HIDE;

	SFINISH_CHECK(CreateProcessA(NULL, str_command_line, NULL, NULL, TRUE, CREATE_NEW_CONSOLE, NULL, NULL, &si, &pi),
		"CreateProcess failed");

	exec_cb_data->h_process = pi.hProcess;

	// Close any unnecessary handles.
	SFINISH_CHECK(CloseHandle(pi.hThread), "CloseHandle failed");

	// Close pipe handles (do not continue to modify the parent). You need to make sure that no handles to the write end of the
	// output pipe are maintained in this process or else the pipe will not close when the child process exits and the ReadFile
	// will hang.
	SFINISH_CHECK(CloseHandle(exec_cb_data->h_output_write), "CloseHandle failed");
	SFINISH_CHECK(CloseHandle(exec_cb_data->h_input_read), "CloseHandle failed");
	SFINISH_CHECK(CloseHandle(exec_cb_data->h_error_write), "CloseHandle failed");

	ev_check_init(&exec_cb_data->check, sunny_exec_output_cb);
	ev_check_start(EV_A, &exec_cb_data->check);
	increment_idle(EV_A);
	exec_cb_data = NULL;

#else
#endif

finish:
	SFREE(exec_cb_data);

	SFREE_ALL();
#ifdef _WIN32
	for (int_i = 0; int_i < int_num_args; int_i += 1) {
		SFREE(arr_str_argument[int_i]);
	}
	SFREE(arr_str_argument);
#endif
	SFREE(arr_int_length);
	bool bol_ret = bol_error_state;
	bol_error_state = false;
	return bol_ret;
}
