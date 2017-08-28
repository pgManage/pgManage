#pragma once

#include <stdbool.h>

#include <ev.h>

#include "common_client.h"
#include "common_client_struct.h"
#include "db_framework.h"
#include "http_auth.h"
#include "http_ev.h"
#include "http_export.h"
#include "http_file.h"
#include "util_error.h"
#include "util_request.h"
#include "util_string.h"
#include <stdlib.h>
#include <sys/stat.h>
#include <sys/types.h>
#include <unistd.h>
#include "http_upload.h"

/*
This function does three things:
1. parse request
2. authenticate if in /postage or /download
3. delegate work to http_auth/http_export/http_file/http_upload
*/
void http_main(struct sock_ev_client *client);
