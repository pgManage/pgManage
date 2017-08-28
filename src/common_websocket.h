#pragma once

#include <sys/ioctl.h>
#include <openssl/sha.h>
#include <stdbool.h>
#include <time.h>
#include <unistd.h>

#include "common_client.h"
#include "common_server.h"
#include "util_base64.h"
#include "util_request.h"
#include "util_salloc.h"
#include "util_string.h"

#define WEBSOCKET_HEADER_LENGTH 2

#define BUF_LEN 1048576

/*
This function generates a websocket handshake response based on the request
*/
char *WS_handshakeResponse(char *str_request, size_t int_request_len, size_t *int_response_len);

/*
This function prepares a client_message structure for the incoming data, then
waits for readable on the socket
*/
void _WS_readFrame(EV_P, struct sock_ev_client *client, void (*cb)(EV_P, WSFrame *));
#define WS_readFrame(A, B, C)                                                                                                    \
	SDEBUG("WS_readFrame(%p, %p, %p)", A, B, C);                                                                                 \
	_WS_readFrame(A, B, C);
/*
This function reads a frame from the socket, then runs the callback
*/
void WS_readFrame_step2(EV_P, ev_io *w, int revents);

/*
This function prepares a client_message structure for the outgoing data, then
waits for writable on the socket
*/
bool WS_sendFrame(EV_P, struct sock_ev_client *client, bool bol_fin, int8_t int_opcode, char *str_message, uint64_t int_length);
/*
This function sends as much data as it can then returns, until there is no more
data to write
*/
void WS_sendFrame_step2(EV_P, ev_io *w, int revents);

/*
These functions free the memory of the given structs
*/
void WS_client_message_free(struct sock_ev_client_message *client_message);
#define WS_freeFrame(frame) _WS_freeFrame(frame); frame = NULL
void _WS_freeFrame(WSFrame *frame);
