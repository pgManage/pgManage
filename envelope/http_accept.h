#pragma once

#include "http_main.h"

void http_accept_step1(struct sock_ev_client *client);
bool http_accept_step2(EV_P, void *cb_data, DB_result *res);
void http_accept_step3(EV_P, ev_io *w, int revents);
