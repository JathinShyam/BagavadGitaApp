package com.jathinshyam.BagavadGita

import android.content.Context
import androidx.core.content.edit
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod

class WidgetDataModule(private val reactContext: ReactApplicationContext) :
  ReactContextBaseJavaModule(reactContext) {

  override fun getName(): String = "WidgetDataModule"

  @ReactMethod
  fun setWidgetData(json: String, promise: Promise) {
    try {
      val prefs = reactContext.getSharedPreferences("dailyVerseWidget", Context.MODE_PRIVATE)
      prefs.edit(commit = true) {
        putString("widgetData", json)
        putLong("updatedAt", System.currentTimeMillis())
      }

      // Prefer the standard AppWidget UPDATE path over a custom broadcast.
      DailyVerseWidgetProvider.requestUpdate(reactContext)

      promise.resolve(true)
    } catch (e: Exception) {
      promise.reject("WIDGET_DATA_ERROR", e)
    }
  }
}
