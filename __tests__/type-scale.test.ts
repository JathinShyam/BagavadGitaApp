import { Type } from "@/theme/design-tokens";
import { verseScreenStyles } from "@/theme/screen-styles";
import { getScriptureFont } from "@/lib/scripture-font";

describe("type scale (BUG-026)", () => {
  it("exposes exactly the eight named tokens", () => {
    expect(Object.keys(Type).sort()).toEqual([
      "body",
      "bodySm",
      "caption",
      "display",
      "heading",
      "label",
      "sloka",
      "title",
    ]);
  });

  it("sets the sloka at 24/38", () => {
    expect(Type.sloka.fontSize).toBe(24);
    expect(Type.sloka.lineHeight).toBe(38);
  });

  it("keeps tracking off every token", () => {
    for (const style of Object.values(Type)) {
      expect(style).not.toHaveProperty("letterSpacing");
    }
  });

  it.each([
    ["teluguSlokaText", verseScreenStyles.teluguSlokaText],
    ["meaningStyle", verseScreenStyles.meaningStyle],
    ["commentaryText", verseScreenStyles.commentaryText],
  ])("%s has no letter-spacing", (_name, style) => {
    expect(style).not.toHaveProperty("letterSpacing");
  });
});

describe("scripture font selection (BUG-026)", () => {
  it("uses Playfair Italic for the Latin sloka", () => {
    expect(getScriptureFont("en")).toBe("PlayfairDisplay_400Regular_Italic");
  });

  it.each(["te", "hi", "ta"] as const)(
    "uses a platform serif for %s",
    (language) => {
      expect(getScriptureFont(language)).not.toContain("Playfair");
    }
  );
});
