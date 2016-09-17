#pragma once

#include "common_client_struct.h"
#include "http_main.h"

/*
This is the interface function for this request

When you call this function, it parses the request and figures out what sql
needs to be run, then runs it
*/
void http_export_step1(struct sock_ev_client *client);
