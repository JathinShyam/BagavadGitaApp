import AsyncStorage from "@react-native-async-storage/async-storage";

// The native review module is loaded lazily by `lib/review-prompt`; mock it so
// no Expo module is needed under Jest.
const mockHasAction = jest.fn<Promise<boolean>, []>();
const mockRequestReview = jest.fn<Promise<void>, []>();

jest.mock("expo-store-review", () => ({
  hasAction: () => mockHasAction(),
  requestReview: () => mockRequestReview(),
}));

jest.mock("@react-native-async-storage/async-storage", () => {
  const store = new Map<string, string>();
  return {
    __esModule: true,
    default: {
      getItem: jest.fn((key: string) => Promise.resolve(store.get(key) ?? null)),
      setItem: jest.fn((key: string, value: string) => {
        store.set(key, value);
        return Promise.resolve();
      }),
      clear: jest.fn(() => {
        store.clear();
        return Promise.resolve();
      }),
    },
  };
});

// Imported after the mocks so the module picks them up.
// eslint-disable-next-line import/first -- the mocks above must exist first
import { STORAGE_KEYS } from "@/constants/storage-keys";
// eslint-disable-next-line import/first -- the mocks above must exist first
import {
  MIN_POSITIVE_EVENTS,
  PROMPT_COOLDOWN_DAYS,
  maybeRequestReview,
  notePositiveEvent,
  parseReviewState,
  shouldRequestReview,
} from "@/lib/review-prompt";

const NOW = new Date(2026, 10, 18, 12).getTime();
const DAY_MS = 24 * 60 * 60 * 1000;

async function storedState() {
  return parseReviewState(
    await AsyncStorage.getItem(STORAGE_KEYS.REVIEW_PROMPT)
  );
}

beforeEach(async () => {
  await AsyncStorage.clear();
  jest.clearAllMocks();
  mockHasAction.mockResolvedValue(true);
  mockRequestReview.mockResolvedValue(undefined);
});

describe("review prompt state", () => {
  it("treats missing, corrupt and nonsensical values as no wins", () => {
    expect(parseReviewState(null)).toEqual({
      positiveEvents: 0,
      lastPromptAt: null,
    });
    expect(parseReviewState("not json")).toEqual({
      positiveEvents: 0,
      lastPromptAt: null,
    });
    expect(
      parseReviewState(
        JSON.stringify({ positiveEvents: -3, lastPromptAt: "soon" })
      )
    ).toEqual({ positiveEvents: 0, lastPromptAt: null });
  });

  it("needs two wins before asking", () => {
    expect(
      shouldRequestReview(
        { positiveEvents: MIN_POSITIVE_EVENTS - 1, lastPromptAt: null },
        NOW
      )
    ).toBe(false);
    expect(
      shouldRequestReview(
        { positiveEvents: MIN_POSITIVE_EVENTS, lastPromptAt: null },
        NOW
      )
    ).toBe(true);
  });

  it("stays quiet for the cooldown after asking", () => {
    const asked = { positiveEvents: MIN_POSITIVE_EVENTS, lastPromptAt: NOW };

    expect(shouldRequestReview(asked, NOW + 89 * DAY_MS)).toBe(false);
    expect(
      shouldRequestReview(asked, NOW + PROMPT_COOLDOWN_DAYS * DAY_MS)
    ).toBe(true);
  });
});

describe("maybeRequestReview", () => {
  it("does not ask after the first win", async () => {
    await notePositiveEvent();

    await expect(maybeRequestReview(NOW)).resolves.toBe(false);
    expect(mockHasAction).not.toHaveBeenCalled();
    expect(mockRequestReview).not.toHaveBeenCalled();
  });

  it("asks after the second win and remembers when", async () => {
    await notePositiveEvent();
    await notePositiveEvent();

    await expect(maybeRequestReview(NOW)).resolves.toBe(true);
    expect(mockRequestReview).toHaveBeenCalledTimes(1);

    const state = await storedState();
    expect(state.positiveEvents).toBe(2);
    expect(state.lastPromptAt).toBe(NOW);
  });

  it("does not ask again inside the cooldown", async () => {
    await notePositiveEvent();
    await notePositiveEvent();
    await maybeRequestReview(NOW);

    await notePositiveEvent();
    await expect(
      maybeRequestReview(NOW + 10 * DAY_MS)
    ).resolves.toBe(false);
    expect(mockRequestReview).toHaveBeenCalledTimes(1);
  });

  it("does not record a prompt the OS refused to show", async () => {
    await notePositiveEvent();
    await notePositiveEvent();
    mockHasAction.mockResolvedValueOnce(false);

    await expect(maybeRequestReview(NOW)).resolves.toBe(false);
    expect(mockRequestReview).not.toHaveBeenCalled();
    expect((await storedState()).lastPromptAt).toBeNull();

    // A later eligible moment is not burned by the refusal.
    await expect(maybeRequestReview(NOW + DAY_MS)).resolves.toBe(true);
  });

  it("swallows a rejected request", async () => {
    await notePositiveEvent();
    await notePositiveEvent();
    mockRequestReview.mockRejectedValueOnce(new Error("nothing to present"));

    await expect(maybeRequestReview(NOW)).resolves.toBe(false);
    expect((await storedState()).lastPromptAt).toBeNull();
  });

  it("never rejects when storage fails", async () => {
    jest
      .mocked(AsyncStorage.setItem)
      .mockRejectedValueOnce(new Error("disk full"));

    await expect(notePositiveEvent()).resolves.toBeUndefined();
  });
});
