import { describe, it, expect, beforeEach, afterEach } from "bun:test";
import { createTerminationSignal } from "../src/tools/process";

describe("createTerminationSignal", () => {
  describe("timeout behavior", () => {
    it("triggers abort after specified timeout", async () => {
      const signal = createTerminationSignal(undefined, 100);

      expect(signal.signal.aborted).toBe(false);

      // Wait for timeout
      await new Promise((resolve) => setTimeout(resolve, 150));

      expect(signal.signal.aborted).toBe(true);
      expect(signal.getEndedBy()).toBe("timeout");
    });

    it("does not abort before timeout expires", async () => {
      const signal = createTerminationSignal(undefined, 500);

      expect(signal.signal.aborted).toBe(false);
      expect(signal.getEndedBy()).toBe("exit");

      // Wait less than timeout
      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(signal.signal.aborted).toBe(false);
      expect(signal.getEndedBy()).toBe("exit");
    });

    it("disables timer when timeoutMs is 0", async () => {
      const signal = createTerminationSignal(undefined, 0);

      expect(signal.signal.aborted).toBe(false);

      // Wait some time to verify no timeout occurs
      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(signal.signal.aborted).toBe(false);
      expect(signal.getEndedBy()).toBe("exit");
    });
  });

  describe("context abort behavior", () => {
    it("triggers abort when context is cancelled", () => {
      const contextController = new AbortController();
      const signal = createTerminationSignal(contextController.signal, 5000);

      expect(signal.signal.aborted).toBe(false);

      // Abort the context
      contextController.abort();

      expect(signal.signal.aborted).toBe(true);
      expect(signal.getEndedBy()).toBe("abort");
    });

    it("reports endedBy as abort (not timeout) when context aborts", () => {
      const contextController = new AbortController();
      const signal = createTerminationSignal(contextController.signal, 5000);

      contextController.abort();

      expect(signal.getEndedBy()).toBe("abort");
    });
  });

  describe("endedBy state tracking", () => {
    it('defaults to "exit" before any abort', () => {
      const signal = createTerminationSignal(undefined, 1000);

      expect(signal.getEndedBy()).toBe("exit");
    });

    it('reports "timeout" when timeout fires first', async () => {
      const contextController = new AbortController();
      const signal = createTerminationSignal(contextController.signal, 100);

      await new Promise((resolve) => setTimeout(resolve, 200));

      expect(signal.getEndedBy()).toBe("timeout");
    });

    it('reports "abort" when context abort fires first', () => {
      const contextController = new AbortController();
      const signal = createTerminationSignal(contextController.signal, 5000);

      contextController.abort();

      expect(signal.getEndedBy()).toBe("abort");
    });
  });

  describe("signal cleanup", () => {
    it("cleans up timeout when signal is aborted via context", async () => {
      const contextController = new AbortController();
      const signal = createTerminationSignal(contextController.signal, 500);

      contextController.abort();

      // Wait past the original timeout
      await new Promise((resolve) => setTimeout(resolve, 600));

      // Should still be aborted with "abort" (not overwritten to "timeout")
      expect(signal.signal.aborted).toBe(true);
      expect(signal.getEndedBy()).toBe("abort");
    });
  });

  describe("no context abort signal", () => {
    it("works without context abort signal", async () => {
      const signal = createTerminationSignal(undefined, 100);

      expect(signal.signal.aborted).toBe(false);
      expect(signal.getEndedBy()).toBe("exit");

      await new Promise((resolve) => setTimeout(resolve, 150));

      expect(signal.signal.aborted).toBe(true);
      expect(signal.getEndedBy()).toBe("timeout");
    });
  });
});
