import { getAtRiskMoment } from "@/lib/streak-at-risk";

describe("getAtRiskMoment", () => {
  it("keeps the 18:00 floor for a morning reminder", () => {
    expect(getAtRiskMoment("08:00")).toEqual({ hour: 18, minute: 0 });
    expect(getAtRiskMoment("05:30")).toEqual({ hour: 18, minute: 0 });
  });

  it("moves with an afternoon reminder, keeping its minute", () => {
    expect(getAtRiskMoment("14:30")).toEqual({ hour: 18, minute: 30 });
    expect(getAtRiskMoment("16:45")).toEqual({ hour: 20, minute: 45 });
  });

  it("never starts after 23:00", () => {
    expect(getAtRiskMoment("20:15")).toEqual({ hour: 23, minute: 0 });
    expect(getAtRiskMoment("23:50")).toEqual({ hour: 23, minute: 0 });
  });

  it("falls back to the default for garbage input", () => {
    expect(getAtRiskMoment("nope")).toEqual({ hour: 18, minute: 0 });
  });
});
