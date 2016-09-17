#pragma once

#include "http_main.h"

void http_delete_step1(struct sock_ev_client *client);
bool http_delete_step2(EV_P, void *cb_data, DB_result *res);
bool http_delete_step3(EV_P, void *cb_data, DB_result *res);
bool http_delete_step4(EV_P, void *cb_data, DB_result *res);
