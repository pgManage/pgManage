#pragma once

#include "http_main.h"

void http_ev_step1(struct sock_ev_client *client);
void http_ev_step2(EV_P, ev_io *w, int revents);
