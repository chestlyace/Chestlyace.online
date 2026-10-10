import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  DONE_MS,
  getLoadingPhase,
  resetLoading,
  startLoading,
  stopLoading,
  subscribeLoading,
} from "./loadingStore";

beforeEach(() => {
  vi.useFakeTimers();
  resetLoading();
});
afterEach(() => vi.useRealTimers());

describe("the navigation feedback store", () => {
  it("goes loading, then done, then idle after the bar has finished", () => {
    expect(getLoadingPhase()).toBe("idle");
    startLoading();
    expect(getLoadingPhase()).toBe("loading");
    stopLoading();
    expect(getLoadingPhase()).toBe("done");
    vi.advanceTimersByTime(DONE_MS - 1);
    expect(getLoadingPhase()).toBe("done");
    vi.advanceTimersByTime(1);
    expect(getLoadingPhase()).toBe("idle");
  });

  it("stays loading while any navigation is in flight", () => {
    startLoading();
    startLoading();
    stopLoading();
    expect(getLoadingPhase()).toBe("loading");
    stopLoading();
    expect(getLoadingPhase()).toBe("done");
  });

  it("a new navigation during the finish goes straight back to loading", () => {
    startLoading();
    stopLoading();
    startLoading();
    expect(getLoadingPhase()).toBe("loading");
    vi.advanceTimersByTime(DONE_MS * 2);
    expect(getLoadingPhase()).toBe("loading");
  });

  it("tells its listeners about each change, and only changes", () => {
    const listener = vi.fn();
    const stop = subscribeLoading(listener);
    startLoading();
    startLoading();
    expect(listener).toHaveBeenCalledTimes(1);
    stopLoading();
    stopLoading();
    expect(listener).toHaveBeenCalledTimes(2);
    vi.advanceTimersByTime(DONE_MS);
    expect(listener).toHaveBeenCalledTimes(3);
    stop();
    startLoading();
    expect(listener).toHaveBeenCalledTimes(3);
  });

  it("never goes below zero", () => {
    stopLoading();
    startLoading();
    expect(getLoadingPhase()).toBe("loading");
    stopLoading();
    expect(getLoadingPhase()).toBe("done");
  });
});
