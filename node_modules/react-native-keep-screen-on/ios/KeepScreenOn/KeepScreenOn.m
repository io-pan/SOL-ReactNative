//
//  KeepScreenOn.m
//  KeepScreenOn
//
//  Created by Mark Jamieson on 2016-10-18.
//  Copyright © 2016 Mark Jamieson. All rights reserved.
//

#import "KeepScreenOn.h"

@implementation KeepScreenOn

RCT_EXPORT_MODULE();

RCT_EXPORT_METHOD(setKeepScreenOn:(BOOL)screenShouldBeKeptOn)
{
    [[UIApplication sharedApplication] setIdleTimerDisabled:screenShouldBeKeptOn];
}

@end
