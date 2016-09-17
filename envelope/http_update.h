#pragma once

#include "http_main.h"

void http_update_step1(struct sock_ev_client *client);
bool http_update_step2(EV_P, void *cb_data, DB_result *res);
bool http_update_step3(EV_P, void *cb_data, DB_result *res);
bool http_update_step4(EV_P, void *cb_data, DB_result *res);
bool http_update_step5(EV_P, void *cb_data, DB_result *res);