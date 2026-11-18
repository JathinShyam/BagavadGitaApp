import SwiftUI
import WidgetKit

/// Shared App Group: the React Native bridge (`WidgetDataModule.swift`) writes
/// the rolling 30-day payload here. Keep in sync with both entitlements files.
private let appGroupIdentifier = "group.com.bhagavadgita.ios"
private let payloadKey = "dailyVerseWidgetData"
private let widgetKind = "DailyVerseWidget"

struct WidgetDay: Decodable {
  let dateKey: String
  let verseId: String
  let eyebrow: String
  let title: String
  let sloka: String
  let meaning: String
}

/// Localized fallback copy, carried in the same payload so a stale widget
/// speaks the reader's language without shipping a string catalogue.
struct WidgetStrings: Decodable {
  let refreshTitle: String
  let refreshBody: String
  let appTitle: String
}

struct WidgetPayload: Decodable {
  let days: [WidgetDay]
  let updatedAt: Double?
  let strings: WidgetStrings?
}

enum WidgetStore {
  static func load() -> WidgetPayload? {
    guard let defaults = UserDefaults(suiteName: appGroupIdentifier),
          let raw = defaults.string(forKey: payloadKey),
          let data = raw.data(using: .utf8) else { return nil }
    return try? JSONDecoder().decode(WidgetPayload.self, from: data)
  }
}

private func localDateKey(for date: Date) -> String {
  let formatter = DateFormatter()
  formatter.locale = Locale(identifier: "en_US_POSIX")
  formatter.timeZone = .current
  formatter.dateFormat = "yyyy-MM-dd"
  return formatter.string(from: date)
}

private func startOfDay(for dateKey: String) -> Date? {
  let formatter = DateFormatter()
  formatter.locale = Locale(identifier: "en_US_POSIX")
  formatter.timeZone = .current
  formatter.dateFormat = "yyyy-MM-dd"
  return formatter.date(from: dateKey)
}

private func nextMidnight(after date: Date) -> Date {
  let calendar = Calendar.current
  let start = calendar.startOfDay(for: date)
  return calendar.date(byAdding: .day, value: 1, to: start)
    ?? date.addingTimeInterval(86_400)
}

private func deepLink(for day: WidgetDay?) -> URL? {
  guard let day = day, !day.verseId.isEmpty else {
    return URL(string: "bagavadgita://")
  }
  return URL(string: "bagavadgita://verses/\(day.verseId)")
}

struct DailyVerseEntry: TimelineEntry {
  let date: Date
  let day: WidgetDay?
  let strings: WidgetStrings?
}

struct DailyVerseProvider: TimelineProvider {
  func placeholder(in context: Context) -> DailyVerseEntry {
    DailyVerseEntry(date: Date(), day: .placeholder, strings: nil)
  }

  func getSnapshot(
    in context: Context,
    completion: @escaping (DailyVerseEntry) -> Void
  ) {
    if context.isPreview {
      completion(placeholder(in: context))
      return
    }
    let payload = WidgetStore.load()
    completion(entry(for: Date(), payload: payload))
  }

  func getTimeline(
    in context: Context,
    completion: @escaping (Timeline<DailyVerseEntry>) -> Void
  ) {
    let now = Date()
    let payload = WidgetStore.load()
    let today = localDateKey(for: now)

    // One entry per remaining day, each at local midnight, so the widget rolls
    // over for a month without the app being opened (BUG-021 on iOS).
    var entries: [DailyVerseEntry] = []
    var lastDayKey: String?

    for day in payload?.days ?? [] where day.dateKey >= today {
      let midnight = startOfDay(for: day.dateKey)
      entries.append(
        DailyVerseEntry(
          date: max(midnight ?? now, now),
          day: day,
          strings: payload?.strings
        )
      )
      lastDayKey = day.dateKey
    }

    if let lastDayKey = lastDayKey, let lastMidnight = startOfDay(for: lastDayKey) {
      // The day after the payload ends: say so honestly instead of freezing on
      // yesterday's verse, then ask WidgetKit to try again at midnight.
      entries.append(
        DailyVerseEntry(
          date: nextMidnight(after: lastMidnight),
          day: nil,
          strings: payload?.strings
        )
      )
    }

    if entries.isEmpty {
      // No usable payload (first install, or the app has not been opened for
      // over a month). Retry at midnight rather than atEnd, which would ask
      // WidgetKit to reload immediately and loop.
      completion(
        Timeline(
          entries: [
            DailyVerseEntry(date: now, day: nil, strings: payload?.strings),
          ],
          policy: .after(nextMidnight(after: now))
        )
      )
      return
    }

    completion(Timeline(entries: entries, policy: .atEnd))
  }

  private func entry(for date: Date, payload: WidgetPayload?) -> DailyVerseEntry {
    let today = localDateKey(for: date)
    let day = payload?.days.first { $0.dateKey == today }
    return DailyVerseEntry(date: date, day: day, strings: payload?.strings)
  }
}

private enum WidgetPalette {
  static let cream = Color(red: 1.0, green: 0.973, blue: 0.906) // #FFF8E7
  static let ink = Color(red: 0.180, green: 0.165, blue: 0.141) // #2E2A24
  static let gold = Color(red: 0.722, green: 0.525, blue: 0.043) // #B8860B
  static let night = Color(red: 0.043, green: 0.039, blue: 0.035) // #0B0A09
  static let nightInk = Color(red: 0.949, green: 0.925, blue: 0.855) // #F2ECDA
  static let nightGold = Color(red: 0.902, green: 0.718, blue: 0.290) // #E6B74A
}

private struct Diamond: View {
  let color: Color

  var body: some View {
    Rectangle()
      .fill(color)
      .frame(width: 5, height: 5)
      .rotationEffect(.degrees(45))
  }
}

struct DailyVerseWidgetEntryView: View {
  @Environment(\.widgetFamily) private var family
  @Environment(\.colorScheme) private var colorScheme

  let entry: DailyVerseEntry

  private var background: Color {
    colorScheme == .dark ? WidgetPalette.night : WidgetPalette.cream
  }

  private var ink: Color {
    colorScheme == .dark ? WidgetPalette.nightInk : WidgetPalette.ink
  }

  private var gold: Color {
    colorScheme == .dark ? WidgetPalette.nightGold : WidgetPalette.gold
  }

  private var appTitle: String {
    entry.strings?.appTitle ?? "Bhagavad Gita"
  }

  var body: some View {
    if #available(iOSApplicationExtension 16.0, *) {
      switch family {
      case .accessoryInline:
        accessoryInline
      case .accessoryCircular:
        accessoryCircular
      case .accessoryRectangular:
        accessoryRectangular
      default:
        systemWidget
      }
    } else {
      systemWidget
    }
  }

  @ViewBuilder
  private var systemWidget: some View {
    Group {
      if let day = entry.day {
        if family == .systemMedium {
          mediumLayout(day)
        } else {
          smallLayout(day)
        }
      } else {
        refreshLayout
      }
    }
    .widgetURL(deepLink(for: entry.day))
    .widgetBackground(background)
  }

  private func smallLayout(_ day: WidgetDay) -> some View {
    VStack(alignment: .leading, spacing: 6) {
      header(day)
      Text(day.title)
        .font(.system(size: 15, weight: .bold, design: .serif))
        .foregroundStyle(ink)
        .lineLimit(1)
      Text(day.sloka)
        .font(.system(size: 13, design: .serif))
        .foregroundStyle(ink.opacity(0.92))
        .lineLimit(3)
        .minimumScaleFactor(0.8)
      Spacer(minLength: 2)
      brand
    }
    .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
  }

  private func mediumLayout(_ day: WidgetDay) -> some View {
    VStack(alignment: .leading, spacing: 6) {
      header(day)
      Text(day.title)
        .font(.system(size: 16, weight: .bold, design: .serif))
        .foregroundStyle(ink)
        .lineLimit(1)
      HStack(alignment: .top, spacing: 14) {
        Text(day.sloka)
          .font(.system(size: 13, design: .serif))
          .foregroundStyle(ink.opacity(0.92))
          .lineLimit(3)
          .minimumScaleFactor(0.8)
          .frame(maxWidth: .infinity, alignment: .topLeading)
        Text(day.meaning)
          .font(.system(size: 12))
          .foregroundStyle(ink.opacity(0.7))
          .lineLimit(3)
          .frame(maxWidth: .infinity, alignment: .topLeading)
      }
      Spacer(minLength: 2)
      brand
    }
    .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
  }

  private var refreshLayout: some View {
    VStack(alignment: .leading, spacing: 6) {
      Diamond(color: gold)
      Text(entry.strings?.refreshTitle ?? "Open the app for today’s verse")
        .font(.system(size: 15, weight: .bold, design: .serif))
        .foregroundStyle(ink)
        .lineLimit(3)
        .minimumScaleFactor(0.85)
      if family != .systemSmall {
        Text(
          entry.strings?.refreshBody
            ?? "Your daily verse returns when you next open Bhagavad Gita."
        )
        .font(.system(size: 12))
        .foregroundStyle(ink.opacity(0.7))
        .lineLimit(3)
      }
      Spacer(minLength: 0)
      brand
    }
    .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
  }

  private func header(_ day: WidgetDay) -> some View {
    HStack(spacing: 5) {
      Diamond(color: gold)
      Text(day.eyebrow)
        .font(.system(size: 9, weight: .semibold))
        .foregroundStyle(gold)
        .lineLimit(1)
      Spacer(minLength: 0)
    }
  }

  private var brand: some View {
    HStack(spacing: 5) {
      Diamond(color: gold.opacity(0.8))
      Text(appTitle)
        .font(.system(size: 9, weight: .semibold))
        .foregroundStyle(gold.opacity(0.9))
        .lineLimit(1)
    }
  }

  @available(iOSApplicationExtension 16.0, *)
  @ViewBuilder
  private var accessoryInline: some View {
    if let day = entry.day {
      Text("\(day.title) · \(day.sloka)")
    } else {
      Text(entry.strings?.refreshTitle ?? appTitle)
    }
  }

  @available(iOSApplicationExtension 16.0, *)
  private var accessoryCircular: some View {
    ZStack {
      AccessoryWidgetBackground()
      if let day = entry.day {
        VStack(spacing: 0) {
          Text(reference(for: day))
            .font(.system(size: 15, weight: .bold, design: .serif))
            .lineLimit(1)
            .minimumScaleFactor(0.7)
          Text(appTitle)
            .font(.system(size: 8, weight: .semibold))
            .lineLimit(1)
            .minimumScaleFactor(0.7)
        }
        .padding(6)
      } else {
        Image(systemName: "book")
          .font(.system(size: 18, weight: .semibold))
      }
    }
    .widgetURL(deepLink(for: entry.day))
  }

  @available(iOSApplicationExtension 16.0, *)
  @ViewBuilder
  private var accessoryRectangular: some View {
    if let day = entry.day {
      VStack(alignment: .leading, spacing: 1) {
        Text(day.title)
          .font(.system(size: 11, weight: .semibold, design: .serif))
          .lineLimit(1)
        Text(day.sloka)
          .font(.system(size: 11, design: .serif))
          .lineLimit(3)
          .minimumScaleFactor(0.8)
      }
      .frame(maxWidth: .infinity, alignment: .leading)
      .widgetURL(deepLink(for: day))
    } else {
      Text(entry.strings?.refreshTitle ?? "Open the app for today’s verse")
        .font(.system(size: 12, weight: .semibold))
        .lineLimit(2)
        .widgetURL(deepLink(for: nil))
    }
  }

  private func reference(for day: WidgetDay) -> String {
    let parts = day.verseId.split(separator: "-")
    guard parts.count >= 2 else { return appTitle }
    return "\(parts[0])·\(parts[1])"
  }
}

private struct WidgetBackgroundModifier: ViewModifier {
  let color: Color

  func body(content: Content) -> some View {
    if #available(iOSApplicationExtension 17.0, *) {
      content.containerBackground(for: .widget) { color }
    } else {
      ZStack {
        color
        content
      }
    }
  }
}

private extension View {
  func widgetBackground(_ color: Color) -> some View {
    modifier(WidgetBackgroundModifier(color: color))
  }
}

extension WidgetDay {
  static let placeholder = WidgetDay(
    dateKey: "",
    verseId: "",
    eyebrow: "Bhagavad Gita",
    title: "Your daily verse",
    sloka: "A verse for today appears here.",
    meaning: "Open the app to read the full verse with its meaning."
  )
}

struct DailyVerseWidget: Widget {
  var body: some WidgetConfiguration {
    StaticConfiguration(kind: widgetKind, provider: DailyVerseProvider()) { entry in
      DailyVerseWidgetEntryView(entry: entry)
    }
    .configurationDisplayName("Daily Verse")
    .description("Today’s verse from the Bhagavad Gita.")
    .supportedFamilies(supportedFamilies)
  }

  private var supportedFamilies: [WidgetFamily] {
    if #available(iOSApplicationExtension 16.0, *) {
      return [
        .systemSmall,
        .systemMedium,
        .accessoryRectangular,
        .accessoryInline,
        .accessoryCircular,
      ]
    }
    return [.systemSmall, .systemMedium]
  }
}

@main
struct DailyVerseWidgetBundle: WidgetBundle {
  var body: some Widget {
    DailyVerseWidget()
  }
}
