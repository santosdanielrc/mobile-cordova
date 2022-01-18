//
//  JumioMobileSDK.h
//  Jumio Software Development GmbH
//

#import "Cordova/CDVPlugin.h"
@import JumioCore;
@import Netverify;
@import NetverifyFace;

@interface JumioMobileSDK : CDVPlugin <NetverifyViewControllerDelegate>

@property (strong) NetverifyViewController* netverifyViewController;
@property (strong) NetverifyConfiguration* netverifyConfiguration;
@property (strong) NSString* callbackId;

@end
