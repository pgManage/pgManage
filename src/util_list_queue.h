#pragma once

#include "util_list.h"
/*
Taken from:
https://github.com/zedshaw/liblcthw/blob/master/src/lcthw/queue.h

See also:
http://c.learncodethehardway.org/book/ex42.html

Description:
Lists can be used like queues.

Thank you Zed A. Shaw
*/
typedef List Queue;

#define Queue_create List_create
#define Queue_destroy List_destroy
#define Queue_clear List_clear
#define Queue_clear_destroy List_clear_destroy

#define Queue_send List_unshift
#define Queue_recv List_pop

#define Queue_count List_count
#define Queue_peek List_last

#define QUEUE_FOREACH(Q, V) LIST_FOREACH(Q, last, prev, V)
