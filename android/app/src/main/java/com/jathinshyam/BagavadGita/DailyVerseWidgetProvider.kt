package com.jathinshyam.BagavadGita

import android.app.PendingIntent
import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.view.View
import android.widget.RemoteViews
import org.json.JSONArray
import org.json.JSONObject
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale
import java.util.TimeZone

class DailyVerseWidgetProvider : AppWidgetProvider() {
  companion object {
    const val ACTION_REFRESH = "com.jathinshyam.BagavadGita.DAILY_VERSE_WIDGET_REFRESH"
    private const val PREFS = "dailyVerseWidget"
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

  override fun onUpdate(
    context: Context,
    appWidgetManager: AppWidgetManager,
    appWidgetIds: IntArray
  ) {
    val prefs = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
    val widgetData = prefs.getString("widgetData", null)
    val today = todayDateKey()
    val payload = resolveTodayPayload(widgetData, today)

    for (appWidgetId in appWidgetIds) {
      val views = RemoteViews(context.packageName, R.layout.daily_verse_widget)

      views.setTextViewText(R.id.widget_eyebrow, payload.eyebrow)
      views.setTextViewText(R.id.widget_title, payload.title)
      views.setTextViewText(R.id.widget_meaning, payload.meaning)

      if (payload.sloka.isNotBlank()) {
        views.setViewVisibility(R.id.widget_sloka, View.VISIBLE)
        views.setTextViewText(R.id.widget_sloka, payload.sloka)
      } else {
        views.setViewVisibility(R.id.widget_sloka, View.GONE)
      }

      views.setTextViewText(
        R.id.widget_cta,
        if (payload.verseId.isNotEmpty()) "Read today’s verse →" else "Open Bhagavad Gita →"
      )

      // Accessibility: one spoken summary for the whole card.
      val a11y = buildString {
        append(payload.eyebrow)
        append(". ")
        append(payload.title)
        if (payload.meaning.isNotBlank()) {
          append(". ")
          append(payload.meaning)
        }
      }
      views.setContentDescription(R.id.widget_root, a11y)

      val deepLink =
        if (payload.verseId.isNotEmpty()) "bagavadgita://verses/${payload.verseId}"
        else "bagavadgita://"
      val clickIntent = Intent(Intent.ACTION_VIEW, Uri.parse(deepLink)).apply {
        setPackage(context.packageName)
        addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP)
      }
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

  private data class Payload(
    val dateKey: String,
    val verseId: String,
    val eyebrow: String,
    val title: String,
    val sloka: String,
    val meaning: String
  )

  private fun todayDateKey(): String {
    val fmt = SimpleDateFormat("yyyy-MM-dd", Locale.US)
    fmt.timeZone = TimeZone.getDefault()
    return fmt.format(Date())
  }

  private fun resolveTodayPayload(raw: String?, today: String): Payload {
    val fallback = Payload(
      dateKey = today,
      verseId = "",
      eyebrow = "Today",
      title = "Daily Verse",
      sloka = "",
      meaning = "Open Bhagavad Gita to load today’s verse."
    )
    if (raw.isNullOrBlank()) return fallback

    return try {
      val root = JSONObject(raw)
      // New format: { days: [ { dateKey, verseId, title, sloka, meaning, eyebrow } ] }
      if (root.has("days")) {
        val days: JSONArray = root.getJSONArray("days")
        for (i in 0 until days.length()) {
          val day = days.getJSONObject(i)
          if (day.optString("dateKey") == today) {
            return Payload(
              dateKey = today,
              verseId = day.optString("verseId"),
              eyebrow = day.optString("eyebrow", "Today").ifBlank { "Today" },
              title = day.optString("title", "Daily Verse"),
              sloka = day.optString("sloka"),
              meaning = day.optString("meaning", fallback.meaning)
            )
          }
        }
        // Stale window — show prompt to open app
        return fallback.copy(
          meaning = "Open Bhagavad Gita once to refresh today’s verse."
        )
      }

      // Legacy single-verse format
      val legacyDate = root.optString("dateKey", "")
      if (legacyDate.isNotEmpty() && legacyDate != today) {
        return fallback.copy(
          meaning = "Open Bhagavad Gita once to refresh today’s verse."
        )
      }
      Payload(
        dateKey = root.optString("dateKey", today),
        verseId = root.optString("verseId"),
        eyebrow = root.optString("eyebrow", "Today").ifBlank { "Today" },
        title = root.optString("title", "Daily Verse"),
        sloka = root.optString("sloka"),
        meaning = root.optString("meaning", fallback.meaning)
      )
    } catch (_: Exception) {
      fallback
    }
  }
}
