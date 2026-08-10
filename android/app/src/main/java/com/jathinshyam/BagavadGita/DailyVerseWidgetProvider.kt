package com.jathinshyam.BagavadGita

import android.app.PendingIntent
import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.util.Log
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
    private const val TAG = "DailyVerseWidget"

    /** Ask the launcher to redraw every placed instance. */
    fun requestUpdate(context: Context) {
      val manager = AppWidgetManager.getInstance(context)
      val component = ComponentName(context, DailyVerseWidgetProvider::class.java)
      val ids = manager.getAppWidgetIds(component)
      if (ids.isEmpty()) return

      val intent = Intent(context, DailyVerseWidgetProvider::class.java).apply {
        action = AppWidgetManager.ACTION_APPWIDGET_UPDATE
        putExtra(AppWidgetManager.EXTRA_APPWIDGET_IDS, ids)
      }
      context.sendBroadcast(intent)
    }
  }

  override fun onReceive(context: Context, intent: Intent) {
    try {
      if (intent.action == ACTION_REFRESH) {
        val manager = AppWidgetManager.getInstance(context)
        val component = ComponentName(context, DailyVerseWidgetProvider::class.java)
        val ids = manager.getAppWidgetIds(component)
        if (ids.isNotEmpty()) {
          onUpdate(context, manager, ids)
        }
        return
      }
      super.onReceive(context, intent)
    } catch (e: Exception) {
      Log.e(TAG, "onReceive failed", e)
    }
  }

  override fun onUpdate(
    context: Context,
    appWidgetManager: AppWidgetManager,
    appWidgetIds: IntArray
  ) {
    if (appWidgetIds.isEmpty()) return

    try {
      val prefs = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
      val widgetData = prefs.getString("widgetData", null)
      val today = todayDateKey()
      val payload = resolveTodayPayload(context, widgetData, today)

      for (appWidgetId in appWidgetIds) {
        try {
          bindMainWidget(context, appWidgetManager, appWidgetId, payload)
        } catch (e: Exception) {
          Log.e(TAG, "Main layout bind failed for $appWidgetId", e)
          bindFallbackWidget(context, appWidgetManager, appWidgetId, payload)
        }
      }
    } catch (e: Exception) {
      Log.e(TAG, "onUpdate failed", e)
      for (appWidgetId in appWidgetIds) {
        bindFallbackWidget(
          context,
          appWidgetManager,
          appWidgetId,
          Payload(
            dateKey = todayDateKey(),
            verseId = "",
            eyebrow = context.getString(R.string.widget_eyebrow_today),
            title = context.getString(R.string.widget_title_placeholder),
            sloka = "",
            meaning = context.getString(R.string.widget_meaning_placeholder)
          )
        )
      }
    }
  }

  private fun bindMainWidget(
    context: Context,
    appWidgetManager: AppWidgetManager,
    appWidgetId: Int,
    payload: Payload
  ) {
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
      if (payload.verseId.isNotEmpty()) {
        context.getString(R.string.widget_cta_read)
      } else {
        context.getString(R.string.widget_cta_open)
      }
    )

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
    views.setOnClickPendingIntent(R.id.widget_root, clickPendingIntent(context, appWidgetId, payload.verseId))

    appWidgetManager.updateAppWidget(appWidgetId, views)
  }

  private fun bindFallbackWidget(
    context: Context,
    appWidgetManager: AppWidgetManager,
    appWidgetId: Int,
    payload: Payload
  ) {
    try {
      val views = RemoteViews(context.packageName, R.layout.daily_verse_widget_fallback)
      views.setTextViewText(
        R.id.widget_fallback_title,
        payload.title.ifBlank { context.getString(R.string.widget_title_placeholder) }
      )
      views.setTextViewText(
        R.id.widget_fallback_body,
        payload.meaning.ifBlank { context.getString(R.string.widget_meaning_placeholder) }
      )
      views.setOnClickPendingIntent(
        R.id.widget_fallback_root,
        clickPendingIntent(context, appWidgetId, payload.verseId)
      )
      appWidgetManager.updateAppWidget(appWidgetId, views)
    } catch (e: Exception) {
      Log.e(TAG, "Fallback bind also failed for $appWidgetId", e)
    }
  }

  private fun clickPendingIntent(context: Context, appWidgetId: Int, verseId: String): PendingIntent {
    val deepLink =
      if (verseId.isNotEmpty()) "bagavadgita://verses/$verseId"
      else "bagavadgita://"
    val clickIntent = Intent(Intent.ACTION_VIEW, Uri.parse(deepLink)).apply {
      setPackage(context.packageName)
      addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP)
    }
    return PendingIntent.getActivity(
      context,
      appWidgetId,
      clickIntent,
      PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
    )
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

  private fun resolveTodayPayload(context: Context, raw: String?, today: String): Payload {
    val fallback = Payload(
      dateKey = today,
      verseId = "",
      eyebrow = context.getString(R.string.widget_eyebrow_today),
      title = context.getString(R.string.widget_title_placeholder),
      sloka = "",
      meaning = context.getString(R.string.widget_meaning_placeholder)
    )
    if (raw.isNullOrBlank()) return fallback

    return try {
      val root = JSONObject(raw)
      if (root.has("days")) {
        val days: JSONArray = root.getJSONArray("days")
        for (i in 0 until days.length()) {
          val day = days.getJSONObject(i)
          if (day.optString("dateKey") == today) {
            return Payload(
              dateKey = today,
              verseId = day.optString("verseId"),
              eyebrow = day.optString("eyebrow", fallback.eyebrow).ifBlank { fallback.eyebrow },
              title = day.optString("title", fallback.title).ifBlank { fallback.title },
              sloka = day.optString("sloka"),
              meaning = day.optString("meaning", fallback.meaning).ifBlank { fallback.meaning }
            )
          }
        }
        return fallback.copy(meaning = context.getString(R.string.widget_refresh_prompt))
      }

      val legacyDate = root.optString("dateKey", "")
      if (legacyDate.isNotEmpty() && legacyDate != today) {
        return fallback.copy(meaning = context.getString(R.string.widget_refresh_prompt))
      }
      Payload(
        dateKey = root.optString("dateKey", today),
        verseId = root.optString("verseId"),
        eyebrow = root.optString("eyebrow", fallback.eyebrow).ifBlank { fallback.eyebrow },
        title = root.optString("title", fallback.title).ifBlank { fallback.title },
        sloka = root.optString("sloka"),
        meaning = root.optString("meaning", fallback.meaning).ifBlank { fallback.meaning }
      )
    } catch (e: Exception) {
      Log.e(TAG, "Failed to parse widget JSON", e)
      fallback
    }
  }
}
