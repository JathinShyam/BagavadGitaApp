import { truncate } from "@/lib/daily-verse";

describe("truncate", () => {
  it("leaves short text alone", () => {
    expect(truncate("Short verse", 120)).toBe("Short verse");
  });

  it("cuts at a word boundary and ends with an ellipsis", () => {
    const en =
      "O best amongst the Bharatas, four kinds of pious people engage in My devotion—the distressed, the seekers of knowledge, the seekers of worldly possessions";
    const out = truncate(en, 120);
    expect(out.length).toBeLessThanOrEqual(120);
    expect(out.endsWith("…")).toBe(true);
    expect(en.startsWith(out.slice(0, -1))).toBe(true);
    expect(en.charAt(out.length - 1)).toMatch(/[\s,—]/);
  });

  it("never splits a Telugu word", () => {
    const te =
      "ఓ భరతశ్రేష్ఠుడా, నాలుగు రకముల ధర్మ-పరాయణులు నా పట్ల భక్తితో నిమగ్నమౌతారు — ఆపదలో ఉన్నవారు, జ్ఞాన సముపార్జన కోసం ప్రయత్నించేవారు, ప్రాపంచిక వస్తువుల సంపాదన కోసం";
    const out = truncate(te, 120);
    const words = out.slice(0, -1).split(" ");
    const last = words[words.length - 1];
    expect(te.split(/\s+/).map((w) => w.replace(/[,;:]$/, ""))).toContain(last);
  });
});
