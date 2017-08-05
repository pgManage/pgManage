#include "util_canonical.h"

static bool path_valid_char(char *path);
static bool is_file(char *filepath);
static bool is_dir(char *str_filepath);

#ifdef _WIN32
#define PATH_MAX MAX_PATH
char *realpath(char *N, char *R) {
	char *ret = _fullpath((R), (N), PATH_MAX);
	if (ret != NULL) {
		struct stat s;
		stat(ret, &s);
	}

	return ret;
}

int mkpath(char *file_path) {
	char *p;
	for (p = strchr(file_path + (file_path[1] == ':' ? 3 : 1), '\\'); p; p = strchr(p + 1, '\\')) {
		SDEBUG("p: %s", p);
		*p = 0;
		SDEBUG("mkdir(%s)", file_path);
		errno = 0;
		if (mkdir(file_path) == -1) {
			if (errno != EEXIST) {
				*p = '\\';
				return -1;
			}
		}
		errno = 0;
		*p = '\\';
	}
	return 0;
}

#pragma comment(lib, "Shlwapi.lib")
#endif

// ############ EXTERNAL FUNCTION DEFINITIONS ####################

char *canonical(const char *file_base, char *_path, char *check_type) {
	SDEFINE_VAR_ALL(str_file_base, str, path, path2, canonical_filename, str_temp);

	char *str_return = NULL;
	char *ptr_path = _path;

	bool bol_path_exists = false;

	size_t int_file_base_len = 0;
	size_t int_path_len = 0;
	size_t int_len = 0;
	size_t int_return_len = 0;
	size_t int_canonical_filename_len = 0;

	SERROR_SNCAT(str_file_base, &int_file_base_len,
		file_base, strlen(file_base));

#ifdef _WIN32
	if ((int_file_base_len == 0 || str_file_base[int_file_base_len - 1] != '\\') &&
		(int_file_base_len == 0 || str_file_base[int_file_base_len - 1] != '/')) {
		SERROR_SNFCAT(str_file_base, &int_file_base_len,
			"\\", (size_t)1);
	}
	if (ptr_path[1] == ':') {
		ptr_path += 2;
	}
	while (ptr_path[0] == '\\' || ptr_path[0] == '/') {
		ptr_path += 1;
	}
	SERROR_SNCAT(path, &int_path_len,
		ptr_path, strlen(ptr_path));
	ptr_path = path;
	while (*ptr_path != 0) {
		if (*ptr_path == '/') {
			*ptr_path = '\\';
		}
		ptr_path += 1;
	}

	if (str_file_base[1] != ':') {
		char *str_system_drive = getenv("SystemDrive");
		SERROR_CHECK(str_system_drive != NULL, "getenv for SystemDrive failed!");

		SERROR_SNCAT(str_temp, &int_file_base_len,
			str_system_drive, strlen(str_system_drive),
			str_file_base, int_file_base_len);

		str_file_base = str_temp;
		str_temp = NULL;
	}
#else
	SERROR_SNCAT(path, &int_path_len,
		ptr_path, strlen(ptr_path));
	if (int_file_base_len == 0 || str_file_base[int_file_base_len - 1] != '/') {
		SERROR_SNFCAT(str_file_base, &int_file_base_len,
			"/", (size_t)1);
	}
	while (path[0] == '/') {
		ptr_path += 1;
		path2 = path;
		SERROR_SNCAT(path, &int_path_len,
			ptr_path, strlen(ptr_path));
		SFREE(path2);
	}
#endif

	SERROR_SNCAT(str, &int_len,
		str_file_base, int_file_base_len,
		path, int_path_len);
	// SDEBUG("\"%s\" + \"%s\" = \"%s\"", str_file_base, path, str);

	// if no path to canonicalize was provided then just return the file_base
	if (path[0] == 0) {
		SERROR_SNCAT(str_return, &int_return_len,
			str_file_base, int_file_base_len);
		SFREE_ALL();
		return str_return;
	}

	errno = 0;

	// check for invalid path chars
	SWARN_CHECK(path_valid_char(str), "%s is a bad path. Path contains invalid characters.\012", path);

	// check path length
	SWARN_CHECK(!(strlen(str) > PATH_MAX - 1), "%s is a bad path. Path exceeds maximum length.\012", path);

	// get resolved path
	errno = 0;
	SERROR_SALLOC(canonical_filename, PATH_MAX);
	char *realpath_res = realpath(str, canonical_filename);
	// 2 is ENOENT, 22 is EINVAL
#ifdef __OpenBSD__
	SWARN_CHECK((errno == 0 && realpath_res != NULL) || errno == 2 || errno == 22, "realpath failed: %d (%s)", errno, strerror(errno));
#else
	SWARN_CHECK((errno == 0 && realpath_res != NULL) || errno == 2, "realpath failed: %d (%s)", errno, strerror(errno));
#endif

	errno = 0;
	struct stat statdata;
	memset(&statdata, 0, sizeof(struct stat));
	stat(canonical_filename, &statdata);

	// save whether or not we found a file/folder at the path (errno = 2 means file does not exist)
	if (errno == 2) {
		bol_path_exists = false;
	} else if (errno == 0) {
		bol_path_exists = true;
	} else {
		SWARN("stat failed: %d (%s)", errno, strerror(errno));
	}
	int_canonical_filename_len = strlen(canonical_filename);

	// DO NOT COMMENT, THIS IS SO THAT THE ERROR DOES NOT PROPOGATE
	errno = 0;

	// check base of the resolved path with file_base if they do not match
	//      the path is out of the allowed directory therefore we must error
	// SDEBUG("canonical_filename: %s", canonical_filename);
	SWARN_CHECK(canonical_filename[0] != 0 && strncmp(canonical_filename, str_file_base, strlen(str_file_base)) == 0,
		"%s|%s is a bad path. Path is not in a valid base directory "
		"(resolves to >%s<).\012",
		str_file_base, path, canonical_filename);

	if (strncmp(check_type, "write_file", 11) == 0) {
		// check to make sure it is a file (or does not exist)
		if (bol_path_exists) {
			SWARN_CHECK(is_file((char *)canonical_filename), "%s|%s is a bad path. Path is not a file.\012", file_base, path);

			// if no such file exists create any dirs that are needed
		} else {
#ifdef _WIN32
			SERROR_SNCAT(str_temp, &int_canonical_filename_len,
				canonical_filename, int_canonical_filename_len);
			char *ptr_last_slash = strrchr(str_temp, '\\');
			SDEBUG("str_temp>%s<", str_temp);
			SDEBUG("ptr_last_slash: %s", str_temp);
			SERROR_CHECK(ptr_last_slash != NULL, "strrchr failed");
			*(ptr_last_slash + 1) = 0;
			SDEBUG("mkpath>%s<", str_temp);
			mkpath(str_temp);
#else
			int limit_mkdir = 4;
			// DEBUG("test1>%s|%s|%s<", canonical_filename, str_file_base, str);
			// if (strncmp(canonical_filename, str_file_base, strlen(str_file_base))
			// !=
			// 0) {
			// DEBUG("test2");
			while (strncmp(canonical_filename, str, strlen(str)) != 0 && limit_mkdir > 0) {
				SDEBUG("mkdir>%s|%s<", canonical_filename, str);
				SERROR_CHECK(
					mkdir(canonical_filename, S_IRWXU | S_IRWXG) == 0, "%s is a bad path. Directory creation error.\012", path);
				realpath(str, canonical_filename);
				limit_mkdir -= 1;
			}
// SDEBUG("test3");
//}
// SDEBUG("test4");
#endif
			errno = 0;
			SERROR_SNCAT(str_return, &int_return_len,
				str, int_len);
			SFREE_ALL();
			return str_return;
		}

	} else if (strncmp(check_type, "read_file", 10) == 0) {
		// check to make sure path exists if it does not: error
		SWARN_CHECK(bol_path_exists, "%s: %s|%s is a bad path. Path does not exist.\012", check_type, str_file_base, path);

		// check to make sure path is a file if it is not: error
		SWARN_CHECK(is_file((char *)canonical_filename), "%s: %s|%s is a bad path. Path is not a file.\012", check_type,
			str_file_base, path);

	} else if (strncmp(check_type, "read_dir", 9) == 0) {
		// check to make sure path exists if it does not: error
		SWARN_CHECK(bol_path_exists, "%s: %s|%s is a bad path. Path does not exist.\012", check_type, str_file_base, path);

		SWARN_CHECK(is_dir((char *)canonical_filename), "%s: %s|%s is a bad path. Path is not a folder.\012", check_type,
			str_file_base, path);

	} else if (strncmp(check_type, "create_dir", 10) == 0) {
		// check to make sure path does not exist if it does: error
		SWARN_CHECK(!bol_path_exists, "%s: %s|%s is a bad path. Path already exists.\012", check_type, str_file_base, path);

// if no such directory exists: create it
#ifdef _WIN32
		SERROR_CHECK(0 == mkpath(canonical_filename), "%s: %s|%s is a bad path. Directory creation error.\012", check_type,
			str_file_base, path);
		errno = 0;
		SERROR_CHECK(0 == _mkdir(canonical_filename) || errno == EEXIST, "%s: %s|%s is a bad path. Directory creation error.\012",
			check_type, str_file_base, path);
#else
		SERROR_CHECK(0 == mkdir(canonical_filename, S_IRWXU | S_IRWXG), "%s: %s|%s is a bad path. Directory creation error.\012",
			check_type, str_file_base, path);
#endif

	} else if (strncmp(check_type, "read_dir_or_file", 17) == 0) {
		// check to make sure path exists if it does not: error
		SWARN_CHECK(bol_path_exists, "%s: %s|%s is a bad path. Path does not exist.\012", check_type, str_file_base, path);

	} else if (strncmp(check_type, "valid_path", 10) == 0) {
	} else {
		// error canonical type does not exist
		SERROR("%s is not a valid canonical type.\012", check_type);
	}

	SERROR_SNCAT(str_return, &int_return_len,
		canonical_filename, int_canonical_filename_len);
	SFREE_ALL();
	return str_return;
error:
	SFREE_ALL();
	SFREE(str_return);
	return NULL;
}

// ###############################################################################################################
// ###############################################################################################################
// ######################################## INTERNAL FUNCTION DEFINITIONS
// ########################################
// ###############################################################################################################
// ###############################################################################################################

// check to see if path is a file
static bool is_file(char *str_filepath) {
#ifdef _WIN32
	return PathIsDirectoryA(str_filepath) != FILE_ATTRIBUTE_DIRECTORY;
#else
	struct stat st;
	errno = 0;
	int fd = open(str_filepath, O_NOFOLLOW | O_RDONLY);
	SWARN_CHECK(fd != -1, "open failed: %d (%s)", errno, strerror(errno));

	// ######### CHECK LINKS #########
	SWARN_CHECK(fstat(fd, &st) == 0, "fstat failed: %d (%s)", errno, strerror(errno));

	// ######### EXCLUDE MULTIPLE HARD LINKS #########
	SWARN_CHECK(st.st_nlink <= 1, "Multiple Hard Links");

	// ######### EXCLUDE SYMBOLIC LINKS #########
	SWARN_CHECK(S_ISREG(st.st_mode), "Symbolic Links");

	return close(fd) == 0;

error:
	if (fd) {
		close(fd);
	}
	errno = 0;
	return false;
#endif
}

// check to see if path is a directory
static bool is_dir(char *str_filepath) {
#ifdef _WIN32
	return PathIsDirectoryA(str_filepath) == FILE_ATTRIBUTE_DIRECTORY;
#else
	struct stat st;
	errno = 0;

	// ######### CHECK LINKS #########
	SWARN_CHECK(stat(str_filepath, &st) == 0, "fstat failed: %d (%s)", errno, strerror(errno));

	// ######### EXCLUDE SYMBOLIC LINKS #########
	SWARN_CHECK(S_ISDIR(st.st_mode), "Symbolic Links");

	return true;

error:
	errno = 0;
	return false;
#endif
}

// check for invalid characters in path
static bool path_valid_char(char *str_path) {
	// ######### EXCLUDE NON-ASCII ######
	char *ptr_path = str_path;
	char *ptr_path_end = str_path + strlen(str_path);
	char chr_path;

	while (ptr_path < ptr_path_end) {
		chr_path = *ptr_path;
		if (!((chr_path >= 'a' && chr_path <= 'z') || (chr_path >= 'A' && chr_path <= 'Z') ||
				(chr_path >= '0' && chr_path <= '9') || chr_path == '%' || chr_path == '&' || chr_path == '+' ||
				chr_path == ',' || chr_path == '.' || chr_path == ':' || chr_path == '=' || chr_path == '_' || chr_path == '/' ||
				chr_path == ' ' || chr_path == '-' || chr_path == '\\'
#ifdef _WIN32
				|| chr_path == '(' || chr_path == ')'
#endif
				)) {
			SWARN("%s is a bad path. Only standard ascii characters are allowed. (%c)", str_path, *ptr_path);
		}
		ptr_path++;
	}

	// SWARN_CHECK(sunny_regex("^([A-Za-z0-9\%&+,.:=_/ -])*$", str_path),
	//	"%s is a bad path. Only standard ascii characters are allowed.",
	// str_path);

	// ######### EXCLUDE ".GIT" #########
	SWARN_CHECK(strstr(str_path, ".git") == NULL, "%s is a bad path. '.git' not allowed.", str_path);
	// SWARN_CHECK(!sunny_regex("\\.git", str_path), "%s is a bad path. '.git' not
	// allowed.",
	// str_path);

	// ######### EXCLUDE "--"   #########
	SWARN_CHECK(strstr(str_path, "--") == NULL, "%s is a bad path. '--' not allowed.", str_path);
	// SWARN_CHECK(!sunny_regex("--", str_path), "%s is a bad path. '--' not
	// allowed.",
	// str_path);

	// ######### EXCLUDE "//"   #########
	SWARN_CHECK(strstr(str_path, "\\\\") == NULL, "%s is a bad path. '\\\\' not allowed.", str_path);
	SWARN_CHECK(strstr(str_path, "//") == NULL, "%s is a bad path. '//' not allowed.", str_path);
	// SWARN_CHECK(!sunny_regex("//", str_path), "%s is a bad path. '//' not
	// allowed.",
	// str_path);

	return true;
error:
	return false;
}
