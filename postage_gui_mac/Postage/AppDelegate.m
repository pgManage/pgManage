//
//  AppDelegate.m
//  Postage
//
//  Created by nunzio on 9/10/16.
//  Copyright © 2016 greyspots. All rights reserved.
//

#import "AppDelegate.h"
#include <stdio.h>

@interface AppDelegate ()

- (void)openConnection:(NSMenuItem *)sender;
- (void)about:(NSObject *)sender;
- (void)configFolder:(NSObject *)sender;
- (void)quit:(NSObject *)sender;
@end

@implementation AppDelegate

- (void)applicationDidFinishLaunching:(NSNotification *)aNotification {
	NSBundle *mainBundle = [NSBundle mainBundle];
	
	_bolTLS = false;
	_postageTask = [[NSTask alloc] init];
	_postageTask.launchPath = [mainBundle pathForResource:@"postage" ofType:NULL];
	_postageTask.arguments = [[NSArray alloc] initWithObjects:
							  @"-c", @"~/Library/Application Support/Workflow Products/Postage/postage.conf",
							  @"-d", @"~/Library/Application Support/Workflow Products/Postage/postage-connections.conf",
							  @"-r", [mainBundle pathForResource:@"web_root" ofType:NULL],
							  nil];
	
	_statusItem = [[NSStatusBar systemStatusBar] statusItemWithLength: NSSquareStatusItemLength];
	_statusItem.image = [NSImage imageNamed: @"StatusBarButtonImage"];
	
	[NSApp setActivationPolicy: NSApplicationActivationPolicyAccessory];
	
	NSMenu *menu = [[NSMenu alloc] init];
	
	FILE *fp = fopen("~/Library/Application Support/Workflow Products/Postage/postage-connections.conf", "r");
	if (fp == NULL) {
		[[NSFileManager defaultManager] createDirectoryAtPath:@"~/Library/Application Support/Workflow Products/Postage/" withIntermediateDirectories:TRUE attributes:NULL error:NULL];
		
		[[NSFileManager defaultManager] copyItemAtPath:
		 [mainBundle pathForResource:@"postage-connections" ofType:@"conf"] toPath:@"~/Library/Application Support/Workflow Products/Postage/postage-connections.conf" error:NULL];
		[[NSFileManager defaultManager] copyItemAtPath:
		 [mainBundle pathForResource:@"postage" ofType:@"conf"] toPath:@"~/Library/Application Support/Workflow Products/Postage/postage" error:NULL];
		errno = 0;
		fp = fopen("~/Library/Application Support/Workflow Products/Postage/postage-connections.conf", "r");
		if (fp == NULL) {
			NSAlert *alert = [[NSAlert alloc] init];
			[alert addButtonWithTitle:@"OK"];
			[alert setMessageText:@"Could not open connection configuration file"];
			[alert setInformativeText:[NSString stringWithCString:strerror(errno) encoding:NSUTF8StringEncoding]];
			[alert setAlertStyle: NSCriticalAlertStyle];
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
			if (ptr_colon == NULL) {
				continue;
			}
			*ptr_colon = 0;
			
			[menu addItem: [[NSMenuItem alloc] initWithTitle: [NSString stringWithCString:buf encoding:NSUTF8StringEncoding] action: @selector(openConnection:) keyEquivalent: @""]];
		}
	}
	free(buf);
	
	fclose(fp);
	
	[menu addItem: [NSMenuItem separatorItem]];
	[menu addItem: [[NSMenuItem alloc] initWithTitle: @"About" action: @selector(about:) keyEquivalent: @""]];
	[menu addItem: [NSMenuItem separatorItem]];
	[menu addItem: [[NSMenuItem alloc] initWithTitle: @"Config Folder" action: @selector(configFolder:) keyEquivalent: @""]];
	[menu addItem: [NSMenuItem separatorItem]];
	[menu addItem: [[NSMenuItem alloc] initWithTitle: @"Quit" action: @selector(quit:) keyEquivalent: @""]];
	
	_statusItem.menu = menu;
	[_postageTask launch];
}

- (void)applicationWillTerminate:(NSNotification *)aNotification {
	[_postageTask terminate];
}


- (void)openConnection:(NSMenuItem *)sender {
	
	NSString *connname = sender.title;
	NSString *strPort = @"8080";
	//NSWorkspace.sharedWorkspace().openURL(NSURL(
	
	[[NSWorkspace sharedWorkspace] openURL: [[NSURL alloc] initWithString: [[NSArray arrayWithObjects: @"http", (_bolTLS ? @"s" : @""), @"://127.0.0.1:", strPort, @"/postage/index.html?connection=", [connname stringByAddingPercentEscapesUsingEncoding:NSUTF8StringEncoding], nil] componentsJoinedByString:@""]]];
}

- (void)about:(NSObject *)sender {
	
}

- (void)configFolder:(NSObject *)sender {
	
}

- (void)quit:(NSObject *)sender {
	[[NSApplication sharedApplication] terminate: self];
}

@end
