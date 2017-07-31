#include "postage_callback.h"

void query_callback_handler(EV_P, ev_io *w, int revents);

#ifdef POSTAGE_INTERFACE_LIBPQ

void _query_callback(EV_P, struct sock_ev_client_request *client_request, sock_ev_client_query_callback_function callback) {
	struct sock_ev_client_query_callback_watcher *cb_data = salloc(sizeof(struct sock_ev_client_query_callback_watcher));

	cb_data->client_request = client_request;
	cb_data->client_request->cb_data = cb_data;
	cb_data->callback = callback;

	SDEBUG("GET_CLIENT_PQ_SOCKET(cb_data->client_request->parent): %d", GET_CLIENT_PQ_SOCKET(cb_data->client_request->parent));
	SDEBUG("cb_data %p", cb_data);
	// The EV_WRITE is because if you have a query longer than SSL allows, then you're going to have a bad time
	ev_io_init(&cb_data->io, query_callback_handler, GET_CLIENT_PQ_SOCKET(cb_data->client_request->parent), EV_READ | EV_WRITE);
	ev_io_start(EV_A, &cb_data->io);
	SDEBUG("_query_callback");
}

/*
This function is what will actually get the data from libpq and send it to the callback
*/
void query_callback_handler(EV_P, ev_io *w, int revents) {
	SDEBUG("query_callback_handler");
	struct sock_ev_client_query_callback_watcher *cb_data = (struct sock_ev_client_query_callback_watcher *)w;
	struct sock_ev_client_request *client_request = cb_data->client_request;
	struct sock_ev_client *client = client_request->parent;

	if (close_client_if_needed(client, (ev_watcher *)w, revents)) {
		cb_data->client_request->cb_data = NULL;
		ev_io_stop(EV_A, w);
		return;
	}

	PGresult *res = NULL;
	DArray *arr_res = NULL;

	ExecStatusType result = 0;
	int int_status = 1;
	int int_status2 = 1;
	bool bol_result;
	size_t int_i;
	size_t int_len;


	if ((revents & EV_WRITE) == EV_WRITE) {
		if (PQflush(client->cnxn) == 0) {
			ev_io_set(w, w->fd, EV_READ);
		}
	}
	if ((revents & EV_READ) == EV_READ) {
		int_status = PQconsumeInput(client->cnxn);
		if (int_status != 1) {
			SERROR_NORESPONSE("PQconsumeInput failed %s", PQerrorMessage(client->cnxn));
			// Don't put the ev_io_stop after the callback, it causes a bug that makes RAW hang
			// I don't know why, but this works
			ev_io_stop(EV_A, &cb_data->io);
			cb_data->callback(EV_A, NULL, 0, cb_data->client_request);
			cb_data->client_request->cb_data = NULL;
			SFREE(cb_data);
			return;
		}
	}

	int_status2 = PQisBusy(client->cnxn);
	send_notices(client);

	SDEBUG("int_status2: %d", int_status2);
	if (int_status2 != 1) {
		arr_res = DArray_create(sizeof(PGresult *), 1);
		res = PQgetResult(client->cnxn);
		result = PQresultStatus(res);
		send_notices(client);

		sock_ev_client_query_callback_function callback = cb_data->callback;
		client_request->cb_data = NULL;
		ev_io_stop(EV_A, &cb_data->io);
		SFREE(cb_data);

		unsigned int int_j = 0;
		while (res != NULL && (int_j == 0 || (result != PGRES_COPY_OUT && result != PGRES_COPY_IN))) {
			SDEBUG("res = %p", res);
			SDEBUG("result == %s", PQresStatus(result));
			DArray_push(arr_res, res);
			res = PQgetResult(client->cnxn);
			result = PQresultStatus(res);
			send_notices(client);
			int_j += 1;
		}
		if (res != NULL) {
			// This is only reached in the case of a copy, in which case, this needs
			// to be cleared
			PQclear(res);
		}
		int_len = DArray_end(arr_res);
		for (int_i = 0; int_i < int_len; int_i += 1) {
			res = DArray_get(arr_res, int_i);
			result = PQresultStatus(res);

			SDEBUG("result == %s", PQresStatus(result));
			SDEBUG("res = %p", res);

			bol_result = callback(EV_A, res, result, client_request);
			if (bol_result == false) {
				break;
			}
			send_notices(client);
		}
		while (int_i < int_len) {
			SDEBUG("result == %s", PQresStatus(result));
			SDEBUG("res = %p", res);

			res = DArray_get(arr_res, int_i);
			if (res != NULL) {
				PQclear(res);
			}
			int_i++;
		}

		DArray_destroy(arr_res);
	}

	errno = 0;
	bol_error_state = false;
}

#endif
