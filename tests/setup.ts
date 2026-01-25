import { expect } from "vitest";
import * as matchers from "@testing-library/jest-dom/matchers";

expect.extend(matchers);

// Mock IntersectionObserver for framer-motion
global.IntersectionObserver = class MockIntersectionObserver implements IntersectionObserver {
  readonly root: Element | null = null;
  readonly rootMargin: string = "";
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
