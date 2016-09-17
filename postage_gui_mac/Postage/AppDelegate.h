//
//  AppDelegate.h
//  Postage
//
//  Created by nunzio on 9/10/16.
//  Copyright © 2016 greyspots. All rights reserved.
//

#import <Cocoa/Cocoa.h>

@interface AppDelegate : NSObject <NSApplicationDelegate>

@property NSStatusItem *statusItem;
@property NSTask *postageTask;
@property NSMutableDictionary *config;
@property bool bolTLS;

- (void)openConnection:(NSMenuItem *)sender;
- (void)about:(NSObject *)sender;
- (void)configFolder:(NSObject *)sender;
- (void)quit:(NSObject *)sender;

@end

