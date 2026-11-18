#import <React/RCTBridgeModule.h>

// Registers the Swift WidgetDataModule with the React Native bridge. The Swift
// class alone is not discovered: RCTRegisterModule runs from the Objective-C
// constructor that this macro emits.
@interface RCT_EXTERN_MODULE(WidgetDataModule, NSObject)

RCT_EXTERN_METHOD(setWidgetData:(NSString *)json
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

@end
