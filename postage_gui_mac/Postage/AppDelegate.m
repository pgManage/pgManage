//
//  AppDelegate.m
//  Postage
//
//  Created by nunzio on 9/10/16.
//  Copyright © 2016 greyspots. All rights reserved.
//

#import "AppDelegate.h"
#include <stdio.h>

char *str_global_tls_cert = NULL;
char *str_global_tls_key = NULL;
char *str_global_port = NULL;

static int initHandler(void *str_user, const char *str_section, const char *str_name, const char *str_value) {
	if (str_user != NULL) {
	} // get rid of unused variable warning
#define SMATCH(s, n) strcmp(str_section, s) == 0 && strcmp(str_name, n) == 0
#define SFREE(A) if (A != NULL) { free(A); A = NULL; }
	if (SMATCH("", "postage_port")) {
		SFREE(str_global_port);
		str_global_port = strdup(str_value);

	} else if (SMATCH("", "tls_cert")) {
		SFREE(str_global_tls_cert);
		str_global_tls_cert = strdup(str_value);

	} else if (SMATCH("", "tls_key")) {
		SFREE(str_global_tls_key);
		str_global_tls_key = strdup(str_value);

	}
	return 1;
}


@interface AppDelegate ()

- (void)openConnection:(NSMenuItem *)sender;
- (void)about:(NSObject *)sender;
- (void)configFolder:(NSObject *)sender;
- (void)quit:(NSObject *)sender;
@end

@implementation AppDelegate

- (void)applicationDidFinishLaunching:(NSNotification *)aNotification {
	NSBundle *mainBundle = [NSBundle mainBundle];

	NSString *applicationSupportDirectory = [NSSearchPathForDirectoriesInDomains(NSApplicationSupportDirectory, NSUserDomainMask, YES) firstObject];
	NSString *nPostagePath = [[NSArray arrayWithObjects: applicationSupportDirectory, @"/Workflow Products/Postage/", nil] componentsJoinedByString:@""];

	NSString *nConnectionPath = [[NSArray arrayWithObjects: nPostagePath, @"/postage-connections.conf", nil] componentsJoinedByString:@""];
	const char *connectionPath = [nConnectionPath UTF8String];

	NSString *nConfPath = [[NSArray arrayWithObjects: nPostagePath, @"/postage.conf", nil] componentsJoinedByString:@""];
	const char *confPath = [nConfPath UTF8String];

	NSAlert *alert = [[NSAlert alloc] init];
	[alert addButtonWithTitle:@"OK"];
	[alert setAlertStyle: NSCriticalAlertStyle];

	_bolTLS = false;
	_postageTask = [[NSTask alloc] init];
	_postageTask.launchPath = [mainBundle pathForResource:@"postage" ofType:nil];
	_postageTask.arguments = [[NSArray alloc] initWithObjects:
							  @"-c", nConfPath,
							  @"-d", nConnectionPath,
							  @"-r", [mainBundle pathForResource:@"web_root" ofType:nil],
							  nil];

	_statusItem = [[NSStatusBar systemStatusBar] statusItemWithLength: NSSquareStatusItemLength];
	_statusItem.image = [NSImage imageNamed: @"StatusBarButtonImage"];

	NSMenu *menu = [[NSMenu alloc] init];

	errno = 0;
	FILE *fp = fopen(connectionPath, "r");
	if (fp == NULL) {
		[[NSFileManager defaultManager] createDirectoryAtPath:nPostagePath withIntermediateDirectories:TRUE attributes:nil error:nil];

		NSError *error = nil;
		[[NSFileManager defaultManager] copyItemAtPath: [mainBundle pathForResource:@"postage-connections" ofType:@"conf"] toPath:nConnectionPath error:&error];
		if (error != nil) {
			[alert setInformativeText:[error localizedDescription]];
			[alert setMessageText:@"Could not copy connection configuration file"];
			[alert runModal];
			[[NSApplication sharedApplication] terminate: self];
		}

		[[NSFileManager defaultManager] copyItemAtPath: [mainBundle pathForResource:@"postage-conf" ofType:@"conf"] toPath:nConfPath error:&error];
		if (error != nil) {
			[alert setInformativeText:[error localizedDescription]];
			[alert setMessageText:@"Could not copy connection configuration file"];
			[alert runModal];
			[[NSApplication sharedApplication] terminate: self];
		}

		errno = 0;
		fp = fopen(connectionPath, "r");
		if (fp == NULL) {
			[alert setInformativeText:[NSString stringWithCString:strerror(errno) encoding:NSUTF8StringEncoding]];
			[alert setMessageText:@"Could not open connection configuration file"];
			[alert runModal];
			[[NSApplication sharedApplication] terminate: self];
		}
	}

	int bufsize = 1024;
	char *buf = calloc(1, bufsize);
	while (feof(fp) == 0) {
		fgets(buf, bufsize - 1, fp);
		if (buf[0] != '#') {
			char *ptr_colon = strchr(buf, ':');
			if (ptr_colon == nil) {
				continue;
			}
			*ptr_colon = 0;

			[menu addItem: [[NSMenuItem alloc] initWithTitle: [NSString stringWithCString:buf encoding:NSUTF8StringEncoding] action: @selector(openConnection:) keyEquivalent: @""]];
		}
	}
	free(buf);
	fclose(fp);

	char *empty = "";
	ini_parse(confPath, initHandler, &empty);

	_bolTLS = (str_global_tls_key != NULL && str_global_tls_cert != NULL);

	[menu addItem: [NSMenuItem separatorItem]];
	[menu addItem: [[NSMenuItem alloc] initWithTitle: @"About" action: @selector(about:) keyEquivalent: @""]];
	[menu addItem: [[NSMenuItem alloc] initWithTitle: @"Config Folder" action: @selector(configFolder:) keyEquivalent: @""]];
	[menu addItem: [[NSMenuItem alloc] initWithTitle: @"Man page" action: @selector(man:) keyEquivalent: @""]];
	[menu addItem: [NSMenuItem separatorItem]];
	[menu addItem: [[NSMenuItem alloc] initWithTitle: @"Quit" action: @selector(quit:) keyEquivalent: @""]];

	_statusItem.menu = menu;
	[_postageTask launch];

	[NSApp setActivationPolicy: NSApplicationActivationPolicyAccessory];
}

- (void)applicationWillTerminate:(NSNotification *)aNotification {
	[_postageTask terminate];
}


- (void)openConnection:(NSMenuItem *)sender {
	NSString *connname = sender.title;
	NSString *strPort = [NSString stringWithCString:str_global_port encoding:NSUTF8StringEncoding];

	[[NSWorkspace sharedWorkspace] openURL: [[NSURL alloc] initWithString:
		[[NSArray arrayWithObjects:
			@"http", (_bolTLS ? @"s" : @""), @"://127.0.0.1:", strPort,
			@"/postage/index.html?connection=", [connname stringByAddingPercentEscapesUsingEncoding:NSUTF8StringEncoding], nil
		] componentsJoinedByString:@""]]];
}

- (void)about:(NSObject *)sender {
	[[NSWorkspace sharedWorkspace] openURL: [[NSURL alloc] initWithString:
		[[NSArray arrayWithObjects:
			@"https://news.workflowproducts.com/splash/postage.html?version=",
			[NSString stringWithCString:
				#include "../../VERSION"
				encoding:NSUTF8StringEncoding], nil
		] componentsJoinedByString:@""]]];
}

- (void)configFolder:(NSObject *)sender {
	NSString *applicationSupportDirectory = [NSSearchPathForDirectoriesInDomains(NSApplicationSupportDirectory, NSUserDomainMask, YES) firstObject];
	NSString *nPostagePath = [[NSArray arrayWithObjects: applicationSupportDirectory, @"/Workflow Products/Postage/", nil] componentsJoinedByString:@""];

	[[NSWorkspace sharedWorkspace] openURL: [NSURL fileURLWithPath:nPostagePath]];
}

- (void)man:(NSObject *)sender {
	NSBundle *mainBundle = [NSBundle mainBundle];
	[[NSWorkspace sharedWorkspace] openURL: [NSURL fileURLWithPath:[mainBundle pathForResource:@"postage.1" ofType:@"html"]]];
}

- (void)quit:(NSObject *)sender {
	[[NSApplication sharedApplication] terminate: self];
}

@end
