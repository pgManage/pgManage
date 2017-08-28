#include "util_idle.h"

int int_idle_count = 0;
int int_temp = 0;
ev_idle idle_watcher;

void idle_cb(EV_P, ev_idle *w, int revents) {
	if (EV_A != NULL) {
	} // get rid of unused parameter warning
	if (w != NULL) {
	} // get rid of unused parameter warning
	if (revents != 0) {
	} // get rid of unused parameter warning
	int_temp += 1;
	int_temp *= int_temp;
	int_temp /= int_temp;
	int_temp -= 1;
}

void _increment_idle(EV_P) {
	int_idle_count += 1;
	if (int_idle_count == 1) {
		ev_idle_init(&idle_watcher, idle_cb);
		ev_idle_start(EV_A, &idle_watcher);
	}
}

void _decrement_idle(EV_P) {
	if (int_idle_count == 0) {
		SERROR_NORESPONSE("Cannot decrement idle any further.");
		return;
	}
	if (int_idle_count == 1) {
		ev_idle_stop(EV_A, &idle_watcher);
	}
	int_idle_count -= 1;
	int_idle_count = int_idle_count < 0 ? 0 : int_idle_count;
}
