#pragma once

#include <stdlib.h>
#include <string.h>

#include "util_request.h"
#include "util_string.h"

#include <fcntl.h>
#include <sys/stat.h>
#include <time.h>
#include <unistd.h>
#ifdef _WIN32
#include <Shlwapi.h>
#include <direct.h>
#include <windows.h>
#endif

#include <sys/param.h>
// If you are reading this because you have an OS that uses a different file,
// then please add the conditional below and initiate a pull request at
// https://github.com/nunziotocci/pgmanage
// Also let us know how it works on your system!
#ifdef __linux__
// linux limits
#include <linux/limits.h>
#elif defined BSD
// bsd limits
#include <limits.h>
#elif defined __APPLE__
// mac limits
#include <sys/syslimits.h>
#else
// sane default limits (also happens to be windows...)
#include <limits.h>
#endif

// ############ PREDEFINES ##############################
/*
canonical uses realpath to make sure that the specified path remains in an area
of your file system.
The first argument is the path to where you don't want your program to get out
of.
The second argument is the path supplied by yourself or the user in the second
arguments.
The third arguments specifies the extra checks you want to do.
If canonical returns a path, it is valid. If it returns NULL there is an error
or a failed check.

Check types:
"write_file"
Check to make sure that the path is a file or doesn't exist. (Up to four parent
folders will be created as necessary to make the rest of
path valid.)

"read_file"
Check to make sure path exists and is a file.

"read_dir"
Check to make sure path exists and is a directory.

"create_dir"
Check to make sure path does not exist and then create it.

"read_dir_or_file"
Check to make sure path exists.

"valid_path"
No extra checks.

A str_check_type of NULL will error. Use "valid_path" instead.
*/
char *canonical(const char *str_file_base, char *_path, char *str_check_type);
