import * as Haptics from "expo-haptics";

/**
 * Haptics are best-effort: unsupported devices, web, and denied permissions
 * all reject. One wrapper keeps those rejections from becoming unhandled
 * promise warnings and lets the app switch haptics off under Reduce Motion.
 */
let enabled = true;

export function setHapticsEnabled(next: boolean): void {
  enabled = next;
}

function fire(trigger: () => Promise<void>): void {
  if (!enabled) return;
  trigger().catch(() => {
    // Ignore — haptics are a garnish, never a requirement.
  });
}

export const haptics = {
  light: () => fire(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)),
  medium: () => fire(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)),
  heavy: () => fire(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy)),
  selection: () => fire(() => Haptics.selectionAsync()),
  success: () =>
    fire(() =>
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
    ),
};

export default haptics;
