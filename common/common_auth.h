#pragma once

#include <time.h>
#include <unistd.h>

#include "common_server.h"
#include "util/util_aes.h"
#include "util/util_cookie.h"
#include "util/util_request.h"
#include "util/util_salloc.h"
#include "util/util_string.h"

#include "common_client.h"

/*
This is function will:
1. take the cookie out of a request
2. make sure that the user's session hasn't expired (based on cookie and ip
address)
3. generate a connection string
*/
DB_conn *set_cnxn(struct sock_ev_client *client, char *request, connect_cb_t connect_cb);
