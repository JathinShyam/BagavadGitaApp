import Foundation
import React

@objc(WidgetDataModule)
class WidgetDataModule: NSObject, RCTBridgeModule {
  static func moduleName() -> String! { "WidgetDataModule" }
  static func requiresMainQueueSetup() -> Bool { false }

  @objc(setWidgetData:resolver:rejecter:)
  func setWidgetData(_ json: String,
                     resolver resolve: RCTPromiseResolveBlock,
                     rejecter reject: RCTPromiseRejectBlock) {
    // For iOS widget extensions, you should set an App Group and write to UserDefaults(suiteName:).
    // We default to standard defaults so the module works even before widget extension is added.
    let defaults = UserDefaults.standard
    defaults.set(json, forKey: "dailyVerseWidgetData")
    defaults.set(Date().timeIntervalSince1970, forKey: "dailyVerseWidgetUpdatedAt")
    defaults.synchronize()
    resolve(true)
  }
}

