import * as Haptics from "expo-haptics";

import { haptics, setHapticsEnabled } from "@/lib/haptics";

jest.mock("expo-haptics", () => ({
  impactAsync: jest.fn(() => Promise.resolve()),
  selectionAsync: jest.fn(() => Promise.resolve()),
  notificationAsync: jest.fn(() => Promise.resolve()),
  ImpactFeedbackStyle: { Light: "light", Medium: "medium", Heavy: "heavy" },
  NotificationFeedbackType: { Success: "success", Warning: "warning", Error: "error" },
}));

const impact = Haptics.impactAsync as jest.Mock;
const selection = Haptics.selectionAsync as jest.Mock;
const notification = Haptics.notificationAsync as jest.Mock;

beforeEach(() => {
  jest.clearAllMocks();
  setHapticsEnabled(true);
});

describe("haptics wrapper", () => {
  it("maps each helper to the right native primitive", () => {
    haptics.light();
    haptics.medium();
    haptics.heavy();
    haptics.selection();
    haptics.success();

    expect(impact.mock.calls).toEqual([["light"], ["medium"], ["heavy"]]);
    expect(selection).toHaveBeenCalledTimes(1);
    expect(notification).toHaveBeenCalledWith("success");
  });

  it("swallows rejections instead of surfacing an unhandled promise", async () => {
    impact.mockImplementationOnce(() => Promise.reject(new Error("no motor")));
    expect(() => haptics.light()).not.toThrow();
    // Let the rejection handler run.
    await Promise.resolve();
    expect(impact).toHaveBeenCalledTimes(1);
  });

  it("fires nothing when Reduce Motion switched haptics off", () => {
    setHapticsEnabled(false);
    haptics.medium();
    expect(impact).not.toHaveBeenCalled();
  });
});
