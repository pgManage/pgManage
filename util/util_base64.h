#pragma once

#include <stdlib.h>

// INTERFACE FUNCTIONS
char *b64encode(const char *input, size_t *plen);
char *b64decode(const char *input, size_t *plen);
