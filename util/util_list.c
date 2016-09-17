#include "util_list.h"

List *List_create() {
	List *ret_list = NULL;
	SERROR_SALLOC(ret_list, sizeof(List));
	return ret_list;
error:
	return NULL;
}

void List_destroy(List *list) {
	LIST_FOREACH(list, first, next, cur) {
		if (cur->prev) {
			SFREE(cur->prev);
		}
	}

	SFREE(list->last);
	SFREE(list);
}

void List_clear(List *list) {
	LIST_FOREACH(list, first, next, cur) {
		SFREE(cur->value);
	}
}

void List_clear_destroy(List *list) {
	List_clear(list);
	List_destroy(list);
}

bool List_push(List *list, void *value) {
	ListNode *node = NULL;
	SERROR_SALLOC(node, sizeof(ListNode));

	node->value = value;
	node->next = NULL;
	node->prev = NULL;

	if (list->last == NULL) {
		list->first = node;
		list->last = node;
	} else {
		list->last->next = node;
		node->prev = list->last;
		list->last = node;
	}

	list->count++;

	return true;
error:
	SFREE(node);
	return false;
}

void *List_pop(List *list) {
	ListNode *node = list->last;
	return node != NULL ? List_remove(list, node) : NULL;
}

bool List_unshift(List *list, void *value) {
	ListNode *node = NULL;
	SERROR_SALLOC(node, sizeof(ListNode));

	node->value = value;
	node->next = NULL;
	node->prev = NULL;
	if (list->first == NULL) {
		list->first = node;
		list->last = node;
	} else {
		node->next = list->first;
		list->first->prev = node;
		list->first = node;
	}

	list->count++;

	return true;
error:
	SFREE(node);
	return false;
}

void *List_shift(List *list) {
	ListNode *node = list->first;
	return node != NULL ? List_remove(list, node) : NULL;
}

void *List_remove(List *list, ListNode *node) {
	void *result = NULL;

	SERROR_CHECK(list->first != NULL && list->last != NULL, "List is empty.");
	SERROR_CHECK(node != NULL, "node can't be NULL");

	if (node == list->first && node == list->last) {
		list->first = NULL;
		list->last = NULL;
	} else if (node == list->first) {
		list->first = node->next;
		SERROR_CHECK(list->first != NULL, "Invalid list, somehow got a first that is NULL.");
		list->first->prev = NULL;
	} else if (node == list->last) {
		list->last = node->prev;
		SERROR_CHECK(list->last != NULL, "Invalid list, somehow got a last that is NULL.");
		list->last->next = NULL;
	} else {
		ListNode *after = node->next;
		ListNode *before = node->prev;
		after->prev = before;
		before->next = after;
	}

	list->count--;
	result = node->value;
	SFREE(node);

	return result;
error:
	return NULL;
}
