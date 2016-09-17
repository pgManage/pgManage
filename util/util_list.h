#pragma once

#include <stdlib.h>

#include "util_error.h"
#include "util_salloc.h"

struct ListNode;

typedef struct ListNode {
	struct ListNode *next;
	struct ListNode *prev;
	void *value;
} ListNode;

typedef struct List {
	int count;
	ListNode *first;
	ListNode *last;
} List;
/*
Taken from:
https://github.com/zedshaw/liblcthw/blob/master/src/lcthw/list.h

See also:
http://http://c.learncodethehardway.org/book/ex32.html

Description:
Lists are double-linked lists.

Thank you Zed A. Shaw
*/
List *List_create();
void List_destroy(List *list);
void List_clear(List *list);
void List_clear_destroy(List *list);

#define List_count(A) ((A)->count)
#define List_first(A) ((A)->first != NULL ? (A)->first->value : NULL)
#define List_last(A) ((A)->last != NULL ? (A)->last->value : NULL)

bool List_push(List *list, void *value);
void *List_pop(List *list);

bool List_unshift(List *list, void *value);
void *List_shift(List *list);

void *List_remove(List *list, ListNode *node);

#define LIST_FOREACH(L, S, M, V)                                                                                                 \
	ListNode *_node = NULL;                                                                                                      \
	ListNode *V = NULL;                                                                                                          \
	for (V = _node = L->S; _node != NULL; V = _node = _node != NULL ? _node->M : NULL)
