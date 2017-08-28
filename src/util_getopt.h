#pragma once
/*
Windows only, there is no windows getopt, so we make one.
*/

#include <stddef.h>
#include <string.h>

#define no_argument 0
#define required_argument 1
#define optional_argument 2

extern char *optarg;
extern int optind, opterr, optopt;

struct option {
	const char *name;
	int has_arg;
	int *flag;
	int val;
};

int getopt(int argc, char *const argv[], const char *optstring);

int getopt_long(int argc, char *const argv[], const char *optstring, const struct option *longopts, __int64 *longindex);
