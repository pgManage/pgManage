#pragma once

#include "http_main.h"

void http_select_step1(struct sock_ev_client *client);
bool http_select_step2(EV_P, void *cb_data, DB_result *res);
bool http_select_step3(EV_P, void *cb_data, DB_result *res);
void http_select_step4(EV_P, ev_check *w, int revents);
void http_select_step5(EV_P, ev_io *w, int revents);
