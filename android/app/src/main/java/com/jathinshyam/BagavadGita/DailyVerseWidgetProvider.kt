package com.jathinshyam.BagavadGita

import android.app.PendingIntent
import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.widget.RemoteViews

class DailyVerseWidgetProvider : AppWidgetProvider() {
  companion object {
    const val ACTION_REFRESH = "com.jathinshyam.BagavadGita.DAILY_VERSE_WIDGET_REFRESH"
  }

  override fun onReceive(context: Context, intent: Intent) {
    super.onReceive(context, intent)
    if (intent.action == ACTION_REFRESH) {
      val appWidgetManager = AppWidgetManager.getInstance(context)
      val component = android.content.ComponentName(context, DailyVerseWidgetProvider::class.java)
      val ids = appWidgetManager.getAppWidgetIds(component)
      onUpdate(context, appWidgetManager, ids)
    }
  }

  override fun onUpdate(context: Context, appWidgetManager: AppWidgetManager, appWidgetIds: IntArray) {
    val prefs = context.getSharedPreferences("dailyVerseWidget", Context.MODE_PRIVATE)
    val widgetData = prefs.getString("widgetData", null)

    for (appWidgetId in appWidgetIds) {
      val views = RemoteViews(context.packageName, R.layout.daily_verse_widget)

      // Very light parsing (no JSON dependency). We just display placeholders if missing.
      val title = widgetData?.substringAfter("\"title\":\"")?.substringBefore("\"") ?: "Daily Verse"
      val meaning = widgetData?.substringAfter("\"meaning\":\"")?.substringBefore("\"") ?: "Open the app to read today's verse."
      val verseId = widgetData?.substringAfter("\"verseId\":\"")?.substringBefore("\"") ?: ""

      views.setTextViewText(R.id.widget_title, title)
      views.setTextViewText(R.id.widget_meaning, meaning)

      val deepLink = if (verseId.isNotEmpty()) "myapp://verses/$verseId" else "myapp://(main)/"
      val clickIntent = Intent(Intent.ACTION_VIEW, Uri.parse(deepLink))
      val pendingIntent = PendingIntent.getActivity(
        context,
        appWidgetId,
        clickIntent,
        PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
      )
      views.setOnClickPendingIntent(R.id.widget_root, pendingIntent)

      appWidgetManager.updateAppWidget(appWidgetId, views)
    }
  }
}

