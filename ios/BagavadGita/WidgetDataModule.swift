import Foundation
import React
import WidgetKit

@objc(WidgetDataModule)
class WidgetDataModule: NSObject, RCTBridgeModule {
  static func moduleName() -> String! { "WidgetDataModule" }
  static func requiresMainQueueSetup() -> Bool { false }

  /// Must match the App Group declared in both targets' entitlements.
  private static let appGroupIdentifier = "group.com.bhagavadgita.ios"

  @objc(setWidgetData:resolver:rejecter:)
  func setWidgetData(_ json: String,
                     resolver resolve: RCTPromiseResolveBlock,
                     rejecter reject: RCTPromiseRejectBlock) {
    guard let defaults = UserDefaults(suiteName: Self.appGroupIdentifier) else {
      // A build without the App Group capability: fail loudly to JS rather
      // than writing to a suite the widget can never read.
      reject(
        "WIDGET_SUITE_UNAVAILABLE",
        "App Group \(Self.appGroupIdentifier) is not available",
        nil
      )
      return
    }

    defaults.set(json, forKey: "dailyVerseWidgetData")
    defaults.set(Date().timeIntervalSince1970, forKey: "dailyVerseWidgetUpdatedAt")

    // Flush before asking another process to read the shared defaults.
    defaults.synchronize()

    // Ask WidgetKit to rebuild from the new payload immediately.
    WidgetCenter.shared.reloadAllTimelines()
    resolve(true)
  }
}
