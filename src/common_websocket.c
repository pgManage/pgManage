#include "common_websocket.h"

char *WS_handshakeResponse(char *str_request, size_t int_request_len, size_t *int_response_len) {
	char *str_response = NULL;
	char *str_temp = NULL;
	char *str_temp1 = NULL;

	SDEFINE_VAR_ALL(str_websocket_key, str_websocket_accept);

	SERROR_SNCAT(str_response, int_response_len, "HTTP/1.1 101 Switching Protocols\015\012", (size_t)34,
		"Upgrade: websocket\015\012", (size_t)20,
		"Connection: Upgrade\015\012", (size_t)21,
		"Sec-WebSocket-Accept: ", (size_t)22);

	// The Sec-WebSocket-Accept part is interesting.
	// The server must derive it from the Sec-WebSocket-Key that the client sent.
	// To get it, concatenate the client's Sec-WebSocket-Key and
	// "258EAFA5-E914-47DA-95CA-C5AB0DC85B11" together
	// (it's a "magic string"), take the SHA-1 hash of the result, and return the
	// base64 encoding of the hash.

	// Copy the request
	size_t int_temp1_len = 0;
	str_websocket_key = request_header(str_request, int_request_len, "Sec-WebSocket-Key", &int_temp1_len);
	SERROR_CHECK(str_websocket_key != NULL, "get_header(\"Sec-WebSocket-Key\") failed!");

	// Concat
	SERROR_SNCAT(str_temp1, &int_temp1_len, str_websocket_key, int_temp1_len, "258EAFA5-E914-47DA-95CA-C5AB0DC85B11", (size_t)36);

	// SHA and b64
	SERROR_SALLOC(str_websocket_accept, 20);
	SHA1((unsigned char *)str_temp1, strlen(str_temp1), (unsigned char *)str_websocket_accept);
	str_temp = str_websocket_accept;
	size_t int_len = 20;
	str_websocket_accept = b64encode(str_temp, &int_len);
	SERROR_CHECK(str_websocket_accept != NULL, "b64encode failed");
	SFREE(str_temp);
	SFREE(str_temp1);

	// Add it to the response
	SERROR_SNFCAT(str_response, int_response_len, str_websocket_accept, int_len,
		"\015\012Sec-WebSocket-Version: 13\015\012\015\012", (size_t)31);

	SFREE_ALL();
	bol_error_state = false;
	return str_response;
error:
	SFREE_ALL();
	SFREE(str_response);
	return NULL;
}

void _WS_readFrame(EV_P, struct sock_ev_client *client, void (*cb)(EV_P, WSFrame *)) {
	SDEBUG("_WS_readFrame");
	WSFrame *frame = NULL;
	struct sock_ev_client_message *client_message = NULL;
	SERROR_SALLOC(client_message, sizeof(struct sock_ev_client_message));

	SERROR_SALLOC(frame, sizeof(WSFrame));
	frame->cb = cb;
	client_message->bol_have_header = false;
	frame->str_mask = NULL;
	client_message->frame = frame;
	frame->parent = client;
	client_message->int_position = 0;
	client_message->int_ioctl_count = 0;

	ev_io_stop(EV_A, &client->io);

	Queue_send(client->que_message, client_message);
	ev_io_init(&client_message->io, WS_readFrame_step2, GET_CLIENT_SOCKET(client), EV_READ | (bol_tls ? EV_WRITE : 0));
	ev_io_start(EV_A, &client_message->io);
	if (bol_tls) {
		ev_feed_event(EV_A, &client_message->io, EV_READ | EV_WRITE);
	}
	//SDEBUG("client->str_request: %s", client->str_request);

	bol_error_state = false;
	return;

error:
	if (bol_error_state == true) {
		bol_error_state = false;
		WS_client_message_free(client_message);
		WS_freeFrame(frame);
		List_shift(client->que_message);
	}

	errno = 0;
}

void WS_readFrame_step2(EV_P, ev_io *w, int revents) {
	if (revents != 0) {
	} // get rid of unused parameter warning
	struct sock_ev_client_message *client_message = (struct sock_ev_client_message *)w;
	SDEBUG("client_message: %p", client_message);
	WSFrame *frame = client_message->frame;
	unsigned char *buf = NULL;
	// This was unsigned, but it was messing with the < -1 conditionals below
	int64_t int_request_len = 0;
	SERROR_SALLOC(buf, BUF_LEN + 1);

	errno = 0;

	memset(buf, 0, BUF_LEN + 1);

	if (client_message->bol_have_header == false) {
		if (!bol_tls) {
			int int_avail = 0;
#ifdef _WIN32
			SERROR_CHECK(ioctlsocket(frame->parent->_int_sock, FIONREAD, &int_avail) == 0, "ioctlsocket() failed: %d", WSAGetLastError());
#else
			SERROR_CHECK(ioctl(frame->parent->int_sock, FIONREAD, &int_avail) != -1, "ioctl() failed!");
#endif
			SDEBUG("int_avail: %d", int_avail);
			if (int_avail < WEBSOCKET_HEADER_LENGTH) {
				bol_error_state = false;
				SFREE(buf);
				client_message->int_ioctl_count += (uint8_t)1;
				if (client_message->int_ioctl_count > 100) {
					goto error;
				}
				return;
			}
		}
		int_request_len = client_read(frame->parent, buf, WEBSOCKET_HEADER_LENGTH);
		if (int_request_len < -1) {
			// This is a state where we want to read (or write) but can't
			// Silently ignore it, it will be taken care of below
			goto error;
		}
		SDEBUG("int_request_len    : %d", int_request_len);
		SDEBUG("buf[0]: 0x%02x", buf[0]);
		SDEBUG("buf[1]: 0x%02x", buf[1]);
		SERROR_CHECK(int_request_len == WEBSOCKET_HEADER_LENGTH, "FAILED TO READ WEBSOCKET HEADER");
		// 0x79 == 0b01110000 (RSV bits)
		SERROR_CHECK((buf[0] & 0x70) == 0, "RSV bit set!");

		// clang-format off
		// Get details from the header
		frame->bol_fin         = (buf[0] & 0x80) >> 7;  // 0b10000000
		frame->int_opcode      =  buf[0] & 0x0f;        // 0b00001111
		frame->bol_mask        = (buf[1] & 0x80) >> 7;  // 0b10000000
		frame->int_orig_length =  buf[1] & 0x7f;        // 0b01111111
		// clang-format on
		frame->int_length = frame->int_orig_length;
		client_message->bol_have_header = true;

	}

	memset(buf, 0, BUF_LEN + 1);

	// Extended lengths
	if (frame->int_length == 126) {
		int_request_len = client_read(frame->parent, buf, 2);
		if (int_request_len < -1) {
			// This is a state where we want to read (or write) but can't
			// Silently ignore it, it will be taken care of below
			goto error;
		}
		SDEBUG("int_request_len    : %d", int_request_len);
		SERROR_CHECK(int_request_len == 2, "Could not read from client");

		frame->int_length = (((uint64_t)buf[0]) << 8) | (((uint64_t)buf[1]) << 0);

	} else if (frame->int_length == 127) {
		int_request_len = client_read(frame->parent, buf, 8);
		if (int_request_len < -1) {
			// This is a state where we want to read (or write) but can't
			// Silently ignore it
			goto error;
		}
		SDEBUG("int_request_len    : %d", int_request_len);
		SERROR_CHECK(int_request_len == 8, "Could not read from client");

		frame->int_length = (((uint64_t)buf[0]) << 56) | (((uint64_t)buf[1]) << 48) | (((uint64_t)buf[2]) << 40) |
							(((uint64_t)buf[3]) << 32) | (((uint64_t)buf[4]) << 24) | (((uint64_t)buf[5]) << 16) |
							(((uint64_t)buf[6]) << 8) | (((uint64_t)buf[7]) << 0);
	}

	memset(buf, 0, BUF_LEN + 1);

	if (frame->bol_mask == true && frame->str_mask == NULL) {
		// the mask is four bytes long
		int_request_len = client_read(frame->parent, buf, 4);
		if (int_request_len < -1) {
			// This is a state where we want to read (or write) but can't
			// Silently ignore it, it will be taken care of below
			goto error;
		}
		SDEBUG("int_request_len    : %d", int_request_len);
		SERROR_CHECK(int_request_len == 4, "Could not read from client");

		SERROR_SALLOC(frame->str_mask, 4);
		memcpy(frame->str_mask, buf, 4);
	}

	// Get the length we haven't read yet
	uint64_t int_temp_length = frame->int_length - client_message->int_position;
	if (frame->str_message == NULL) {
		SERROR_SALLOC(frame->str_message, frame->int_length + 1);

		// NULL-terminate
		frame->str_message[frame->int_length] = 0;
	}

	// DEBUG("Reading, position: %u", client_message->int_position);
	// read into buf min(BUF_LEN, int_temp_length) bytes
	uint64_t int_expected_length = BUF_LEN < int_temp_length ? BUF_LEN : int_temp_length;

	if (int_expected_length > 0) {
		int_request_len = client_read(frame->parent, buf, int_expected_length);
		if (int_request_len < -1) {
			// This is a state where we want to read (or write) but can't
			// Silently ignore it, it will be taken care of below
			goto error;
		}
		SDEBUG("int_request_len    : %d", int_request_len);
		SDEBUG("int_expected_length: %d", int_expected_length);
		SERROR_CHECK((uint64_t)int_request_len <= int_expected_length, "Could not read from client");
	} else {
		int_request_len = 0;
	}

	buf[int_request_len] = 0;
	// Copy to the heap
	memcpy(frame->str_message + client_message->int_position, buf, (size_t)int_request_len);
	client_message->int_position = client_message->int_position + (uint64_t)int_request_len;

	if (client_message->int_position == frame->int_length) {
		if (frame->bol_mask) {
			// Decode
			uint64_t int_i;
			for (int_i = 0; int_i < frame->int_length; int_i++) {
				frame->str_message[int_i] = frame->str_message[int_i] ^ frame->str_mask[int_i % 4];
			}
			SFREE(frame->str_mask);
		}

		ev_io_stop(EV_A, w);

		WS_client_message_free(client_message);

		if (frame->parent->int_last_activity_i != -1) {
			struct sock_ev_client_last_activity *client_last_activity = (struct sock_ev_client_last_activity *)DArray_get(
				_server.arr_client_last_activity, (size_t)frame->parent->int_last_activity_i);
			if (client_last_activity != NULL) {
				SDEBUG("client->int_last_activity_i          : %d", frame->parent->int_last_activity_i);
				SDEBUG("ev_now(global_loop)               : %f", ev_now(EV_A));
				SDEBUG("client_last_activity                 : %p", client_last_activity);
				SDEBUG("client_last_activity->last_activity_time: %f", client_last_activity->last_activity_time);
				client_last_activity->last_activity_time = ev_now(EV_A);
			}
		}

		frame->cb(EV_A, frame);
	}

	SDEBUG("int_request_len: %d", int_request_len);
	SDEBUG("client_message->int_position: %d", client_message->int_position);
	SDEBUG("frame->int_length: %d", frame->int_length);
	bol_error_state = false;
	SFREE(buf);
	return;

error:
	SFREE(buf);
	if (bol_tls) {
		if (int_request_len == SOCK_WANT_READ) {
			ev_io_stop(EV_A, w);
			ev_io_set(w, GET_CLIENT_SOCKET(frame->parent), EV_READ);
			ev_io_start(EV_A, w);
			bol_error_state = false;
			errno = 0;
			return;

		} else if (int_request_len == SOCK_WANT_WRITE) {
			ev_io_stop(EV_A, w);
			ev_io_set(w, GET_CLIENT_SOCKET(frame->parent), EV_WRITE);
			ev_io_start(EV_A, w);
			bol_error_state = false;
			errno = 0;
			return;
		}
	}


	if (int_request_len < 0 && errno != EAGAIN) {
		SERROR_NORESPONSE("disconnect");
		SFREE(str_global_error);

		ev_io_stop(EV_A, w);

		struct sock_ev_client *client = frame->parent;
		WS_client_message_free(client_message);
		WS_freeFrame(frame);

		SERROR_CLIENT_CLOSE_NORESPONSE(client);
		bol_error_state = false;
		errno = 0;

	} else if (errno == EAGAIN) {
		SERROR_NORESPONSE("Reached EAGAIN, waiting for more data");
		SERROR_NORESPONSE("should never get to EAGAIN with libev");
		SFREE(str_global_error);
		bol_error_state = false;
		errno = 0;

	} else if (int_request_len == 0 && (errno != 0 || client_message->int_ioctl_count > 100)) {
		SERROR_NORESPONSE("int_request_len == 0?");//" disconnecting");
		SFREE(str_global_error);

		ev_io_stop(EV_A, w);

		struct sock_ev_client *client = frame->parent;
		WS_client_message_free(client_message);
		WS_freeFrame(frame);

		SERROR_CLIENT_CLOSE_NORESPONSE(client);
		bol_error_state = false;
		errno = 0;

		
	}
}

bool WS_sendFrame(EV_P, struct sock_ev_client *client, bool bol_fin, int8_t int_opcode, char *str_message, uint64_t int_length) {
	SDEBUG("WS_sendFrame");
	char *str_response = NULL;

	if (client->bol_is_open == false || client->bol_socket_is_open == false) {
		return true;
	}

	// TODO: split frames for long messages
	int8_t int_orig_length = (int8_t)(int_length > 126 ? int_length > 65535 ? 127 : 126 : int_length);
	struct sock_ev_client_message *client_message = NULL;

	SERROR_SALLOC(client_message, sizeof(struct sock_ev_client_message));
	SERROR_SALLOC(client_message->frame, sizeof(WSFrame));

	client_message->int_message_header_length =
		WEBSOCKET_HEADER_LENGTH + (int_orig_length < 126 ? 0 : int_orig_length == 126 ? 2 : int_orig_length == 127 ? 8 : 0);
	client_message->int_length = int_length;
	client_message->frame->parent = client;
	client_message->frame->int_opcode = int_opcode;

	// Allocate enough space for the message
	SERROR_SALLOC(str_response, client_message->int_message_header_length + client_message->int_length + 1);

	SDEBUG("bol_fin                                        : %d", bol_fin);
	SDEBUG("(bol_fin << 7)                                 : %d", (bol_fin << 7));
	SDEBUG("(bol_fin << 7) | int_opcode                    : %d", (bol_fin << 7) | int_opcode);
	SDEBUG("(bol_fin << 7) | (char)int_opcode)             : %d", ((bol_fin << 7) | (char)int_opcode));
	SDEBUG("((char)bol_fin << 7) | int_opcode)             : %d", (((char)bol_fin << 7) | int_opcode));
	SDEBUG("((char)bol_fin << 7) | (char)int_opcode)       : %d", (((char)bol_fin << 7) | (char)int_opcode));
	SDEBUG("(char)((bol_fin << 7) | int_opcode)            : %d", (char)((bol_fin << 7) | int_opcode));
	SDEBUG("(char)((bol_fin << 7) | (char)int_opcode)      : %d", (char)((bol_fin << 7) | (char)int_opcode));
	SDEBUG("(char)(((char)bol_fin << 7) | int_opcode)      : %d", (char)(((char)bol_fin << 7) | int_opcode));
	SDEBUG("(char)(((char)bol_fin << 7) | (char)int_opcode): %d", (char)(((char)bol_fin << 7) | (char)int_opcode));
	SDEBUG("int_opcode                                     : %d", int_opcode);
	str_response[0] = (char)((bol_fin << 7) | int_opcode); // FIN/OPCODE
	str_response[1] = (char)(0x00 | int_orig_length);	  // MASK/length
	// Extended lengths
	if (int_orig_length == 126) {
		str_response[2] = (char)((int_length & 0xff00) >> 8);
		str_response[3] = (char)((int_length & 0x00ff) >> 0);
	} else if (int_orig_length == 127) {
		str_response[2] = (char)((int_length & 0xff00000000000000) >> 56);
		str_response[3] = (char)((int_length & 0x00ff000000000000) >> 48);
		str_response[4] = (char)((int_length & 0x0000ff0000000000) >> 40);
		str_response[5] = (char)((int_length & 0x000000ff00000000) >> 32);
		str_response[6] = (char)((int_length & 0x00000000ff000000) >> 24);
		str_response[7] = (char)((int_length & 0x0000000000ff0000) >> 16);
		str_response[8] = (char)((int_length & 0x000000000000ff00) >> 8);
		str_response[9] = (char)((int_length & 0x00000000000000ff) >> 0);
	}

	memcpy(str_response + client_message->int_message_header_length, str_message, int_length);
	client_message->frame->str_message = str_response;

	SDEBUG("bol_fin         : %d", bol_fin);
	SDEBUG("int_opcode      : %d", int_opcode);
	SDEBUG("str_response[0] : %d", str_response[0]);
	SDEBUG("str_response[0] : %x", str_response[0]);
	SDEBUG("str_response[1] : %d", str_response[1]);
	SDEBUG("str_response + 2: %s", str_response + 2);

	str_response = NULL;

	Queue_send(client->que_message, client_message);
	ev_io_init(&client_message->io, WS_sendFrame_step2, GET_CLIENT_SOCKET(client), EV_WRITE | (bol_tls ? EV_READ : 0));
	ev_io_start(EV_A, &client_message->io);
	SDEBUG("waiting for writable on client %p", client);

	bol_error_state = false;
	return true;

error:
	SFREE(str_response);
	if (client_message != NULL) {
		WS_client_message_free(client_message);
		WS_freeFrame(client_message->frame);
	}
	return false;
}

void WS_sendFrame_step2(EV_P, ev_io *w, int revents) {
	if (revents != 0) {
	} // get rid of unused parameter warning
	SDEBUG("WS_sendFrame_step2");
	struct sock_ev_client_message *client_message = (struct sock_ev_client_message *)w;
	WSFrame *frame = client_message->frame;
	SDEBUG("got writable on client %p for message %p", client_message->frame->parent, client_message);

	if (client_message->frame->parent->que_message->last->value != (void *)client_message) {
		return;
	}

	if (frame->parent->bol_socket_is_open == false) {
		SDEBUG("frame->parent->bol_socket_is_open == false");
		ev_io_stop(EV_A, w);
		WS_client_message_free(client_message);
		WS_freeFrame(frame);
		return;
	}

	// Send and free
	SDEBUG("attempting to write %d bytes at offset %d",
		(client_message->int_message_header_length + client_message->int_length) - client_message->int_written,
		client_message->int_written);
	ssize_t int_len = client_write(frame->parent, frame->str_message + client_message->int_written,
		(client_message->int_message_header_length + client_message->int_length) - client_message->int_written);
	if (int_len == SOCK_WANT_READ) {
		ev_io_stop(EV_A, w);
		ev_io_set(w, GET_CLIENT_SOCKET(frame->parent), EV_READ);
		ev_io_start(EV_A, w);
		bol_error_state = false;
		return;

	} else if (int_len == SOCK_WANT_WRITE) {
		ev_io_stop(EV_A, w);
		ev_io_set(w, GET_CLIENT_SOCKET(frame->parent), EV_WRITE);
		ev_io_start(EV_A, w);
		bol_error_state = false;
		return;
	} else if (int_len < 0) {
		SERROR("client_write() failed");
	}
	client_message->int_written += (uint64_t)int_len;
	if (client_message->int_written < client_message->int_length) {
		bol_error_state = false;
		return;
	} else {
		if (frame->parent->int_last_activity_i != -1) {
			struct sock_ev_client_last_activity *client_last_activity = (struct sock_ev_client_last_activity *)DArray_get(
				_server.arr_client_last_activity, (size_t)frame->parent->int_last_activity_i);
			if (client_last_activity != NULL) {
				SDEBUG("client->int_last_activity_i          : %d", frame->parent->int_last_activity_i);
				SDEBUG("ev_now(global_loop)               : %f", ev_now(EV_A));
				SDEBUG("client_last_activity                 : %p", client_last_activity);
				SDEBUG("client_last_activity->last_activity_time: %f", client_last_activity->last_activity_time);
				client_last_activity->last_activity_time = ev_now(EV_A);
			}
		}

		SDEBUG("sent message with opcode %x", frame->int_opcode);
		ev_io_stop(EV_A, w);
		WS_client_message_free(client_message);
		WS_freeFrame(frame);
		bol_error_state = false;
		return;
	}

error:
	SERROR_NORESPONSE("errno: %d", errno);
	SERROR_NORESPONSE("EAGAIN: %d", EAGAIN);
	if (errno == EAGAIN) {
		SERROR_NORESPONSE("should never get to EAGAIN with libev");
		SFREE(str_global_error);
		bol_error_state = false;
	} else if (int_len == -1) {
		// This prevents an infinite loop if CLIENT_CLOSE fails
		int_len = 0;
		SDEBUG("disconnect");

		ev_io_stop(EV_A, w);

		struct sock_ev_client *client = frame->parent;
		WS_client_message_free(client_message);
		WS_freeFrame(frame);

		SERROR_CLIENT_CLOSE(client);
		bol_error_state = false;
	}
}

void WS_client_message_free(struct sock_ev_client_message *client_message) {
	QUEUE_FOREACH(client_message->frame->parent->que_message, node) {
		if (client_message == node->value) {
			List_remove(client_message->frame->parent->que_message, node);
			break;
		}
	}
	SFREE(client_message);
}

void _WS_freeFrame(WSFrame *frame) {
	if (frame != NULL) {
		SFREE(frame->str_message);
		SFREE(frame->str_mask);
	}
	SFREE(frame);
}
