import "@testing-library/jest-dom/vitest";

// Mock IntersectionObserver for framer-motion
global.IntersectionObserver = class MockIntersectionObserver implements IntersectionObserver {
  readonly root: Element | null = null;
  readonly rootMargin: string = "";
  readonly scrollMargin: string = "";
  readonly thresholds: readonly number[] = [];

  observe(): void {
    // noop
  }
  unobserve(): void {
    // noop
  }
  disconnect(): void {
    // noop
  }
  takeRecords(): IntersectionObserverEntry[] {
    return [];
  }
};

// Mock ResizeObserver
global.ResizeObserver = class MockResizeObserver implements ResizeObserver {
  observe(): void {
    // noop
  }
  unobserve(): void {
    // noop
  }
  disconnect(): void {
    // noop
  }
};

// jsdom >= 30.1 reports Document as focus relatedTarget, which MUI FocusTrap tries to refocus
if (typeof (Document.prototype as { focus?: unknown }).focus !== "function") {
  Object.defineProperty(Document.prototype, "focus", { value: () => undefined, configurable: true });
}
