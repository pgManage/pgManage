#pragma once

#include "common_client.h"
#include "common_util_sql.h"
#include "common_websocket.h"
#include "util/util_idle.h"

/*
********************************** REQUEST FORMAT************************************
ACTION\t[<schemaname>\t]<actionname>\t<functionargument>\n

where actionname begins with action_*
*/

char *ws_action_step1(struct sock_ev_client_request *client_request);
