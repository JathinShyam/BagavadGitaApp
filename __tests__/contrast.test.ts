import { Palette } from "@/theme/design-tokens";

/**
 * WCAG 2.x relative luminance and contrast ratio.
 * https://www.w3.org/TR/WCAG21/#dfn-relative-luminance
 */
function channel(value: number): number {
  const c = value / 255;
  return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

function luminance(hex: string): number {
  const value = hex.replace("#", "");
  const r = parseInt(value.slice(0, 2), 16);
  const g = parseInt(value.slice(2, 4), 16);
  const b = parseInt(value.slice(4, 6), 16);
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

function contrastRatio(foreground: string, background: string): number {
  const a = luminance(foreground);
  const b = luminance(background);
  const [light, dark] = a >= b ? [a, b] : [b, a];
  return (light + 0.05) / (dark + 0.05);
}

/** WCAG AA for normal text (1.4.3). */
const AA_TEXT = 4.5;
/** WCAG AA for meaningful graphics and large text (1.4.11 / 1.4.3). */
const AA_GRAPHIC = 3;

describe("light palette contrast (BUG-025)", () => {
  const { background, surface } = Palette.light;

  it.each([
    ["brandText", Palette.light.brandText],
    ["text", Palette.light.text],
    ["textMuted", Palette.light.textMuted],
    ["success", Palette.light.success],
    ["danger", Palette.light.danger],
  ])("%s passes AA on background and surface", (_name, color) => {
    expect(contrastRatio(color, background)).toBeGreaterThanOrEqual(AA_TEXT);
    expect(contrastRatio(color, surface)).toBeGreaterThanOrEqual(AA_TEXT);
  });

  it("the primary CTA label passes AA on its fill", () => {
    expect(
      contrastRatio(Palette.light.onPrimary, Palette.light.brandText)
    ).toBeGreaterThanOrEqual(AA_TEXT);
  });

  it("warning is legible as a graphic", () => {
    expect(contrastRatio(Palette.light.warning, background)).toBeGreaterThanOrEqual(
      AA_GRAPHIC
    );
    expect(contrastRatio(Palette.light.warning, surface)).toBeGreaterThanOrEqual(
      AA_GRAPHIC
    );
  });

  it("keeps decorative brand gold separate from text gold", () => {
    expect(Palette.light.brand).not.toBe(Palette.light.brandText);
    expect(contrastRatio(Palette.light.brand, background)).toBeLessThan(AA_TEXT);
  });
});

describe("dark palette contrast", () => {
  const { background, surface } = Palette.dark;

  it.each([
    ["brandText", Palette.dark.brandText],
    ["text", Palette.dark.text],
    ["textMuted", Palette.dark.textMuted],
    ["success", Palette.dark.success],
    ["warning", Palette.dark.warning],
    ["danger", Palette.dark.danger],
  ])("%s passes AA on background and surface", (_name, color) => {
    expect(contrastRatio(color, background)).toBeGreaterThanOrEqual(AA_TEXT);
    expect(contrastRatio(color, surface)).toBeGreaterThanOrEqual(AA_TEXT);
  });

  it("the primary CTA label passes AA on its fill", () => {
    expect(
      contrastRatio(Palette.dark.onPrimary, Palette.dark.brandText)
    ).toBeGreaterThanOrEqual(AA_TEXT);
  });
});
