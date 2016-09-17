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
#include "util/util_error.h"
#include "util/util_request.h"
#include "util/util_string.h"
#include <stdlib.h>
#include <sys/stat.h>
#include <sys/types.h>
#include <unistd.h>
#ifdef ENVELOPE
#include "../envelope/http_accept.h"
#include "../envelope/http_action.h"
#include "../envelope/http_delete.h"
#include "../envelope/http_insert.h"
#include "../envelope/http_select.h"
#include "../envelope/http_update.h"
#endif
#include "http_upload.h"

/*
This function does three things:
1. parse request
2. authenticate if in /postage or /download
3. delegate work to http_auth/http_export/http_file/http_upload
*/
void http_main(struct sock_ev_client *client);
