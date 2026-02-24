import { describe, it, expect } from "bun:test";
import { collectCombinedOutput } from "../src/tools/output.js";

/**
 * Create a synthetic ReadableStream from an array of string chunks.
 * Each chunk is encoded as UTF-8 and yielded with a small delay to
 * simulate realistic interleaving behavior.
 */
function createSyntheticStream(chunks: string[]): ReadableStream<Uint8Array> {
  return new ReadableStream<Uint8Array>({
    async start(controller) {
      for (const chunk of chunks) {
        const encoder = new TextEncoder();
        controller.enqueue(encoder.encode(chunk));
        // Small delay to allow interleaving
        await new Promise((resolve) => setTimeout(resolve, 1));
      }
      controller.close();
    },
  });
}

/**
 * Create a synthetic ReadableStream that errors after yielding some chunks.
 */
function createErrorStream(chunks: string[], errorMessage: string): ReadableStream<Uint8Array> {
  return new ReadableStream<Uint8Array>({
    async start(controller) {
      for (const chunk of chunks) {
        const encoder = new TextEncoder();
        controller.enqueue(encoder.encode(chunk));
      }
      controller.error(new Error(errorMessage));
    },
  });
}

describe("collectCombinedOutput", () => {
  describe("basic output collection", () => {
    it("collects stdout output", async () => {
      const stdout = createSyntheticStream(["Hello from stdout"]);
      const stderr = createSyntheticStream([]);

      const result = await collectCombinedOutput({ stdout, stderr });

      expect(result).toBe("Hello from stdout");
    });

    it("collects stderr output", async () => {
      const stdout = createSyntheticStream([]);
      const stderr = createSyntheticStream(["Error from stderr"]);

      const result = await collectCombinedOutput({ stdout, stderr });

      expect(result).toBe("Error from stderr");
    });

    it("combines stdout and stderr", async () => {
      const stdout = createSyntheticStream(["stdout line 1\n"]);
      const stderr = createSyntheticStream(["stderr line 1\n"]);

      const result = await collectCombinedOutput({ stdout, stderr });

      expect(result).toContain("stdout line 1");
      expect(result).toContain("stderr line 1");
    });
  });

  describe("interleaved output order", () => {
    it("preserves arrival order of interleaved chunks", async () => {
      // Create streams with multiple small chunks to encourage interleaving
      const stdout = createSyntheticStream([
        "stdout-1 ",
        "stdout-2 ",
        "stdout-3",
      ]);
      const stderr = createSyntheticStream([
        "stderr-1 ",
        "stderr-2 ",
        "stderr-3",
      ]);

      const result = await collectCombinedOutput({ stdout, stderr });

      // All content should be present
      expect(result).toContain("stdout-1");
      expect(result).toContain("stdout-2");
      expect(result).toContain("stdout-3");
      expect(result).toContain("stderr-1");
      expect(result).toContain("stderr-2");
      expect(result).toContain("stderr-3");
    });

    it("handles rapid interleaving", async () => {
      const stdoutChunks: string[] = [];
      const stderrChunks: string[] = [];

      // Create many small chunks
      for (let i = 0; i < 10; i++) {
        stdoutChunks.push(`O${i}`);
        stderrChunks.push(`E${i}`);
      }

      const stdout = createSyntheticStream(stdoutChunks);
      const stderr = createSyntheticStream(stderrChunks);

      const result = await collectCombinedOutput({ stdout, stderr });

      // Verify all stdout markers are present
      for (let i = 0; i < 10; i++) {
        expect(result).toContain(`O${i}`);
      }

      // Verify all stderr markers are present
      for (let i = 0; i < 10; i++) {
        expect(result).toContain(`E${i}`);
      }
    });
  });

  describe("UTF-8 decoding", () => {
    it("decodes ASCII characters correctly", async () => {
      const stdout = createSyntheticStream(["Hello World"]);
      const stderr = createSyntheticStream([]);

      const result = await collectCombinedOutput({ stdout, stderr });

      expect(result).toBe("Hello World");
    });

    it("decodes multi-byte UTF-8 characters", async () => {
      const stdout = createSyntheticStream(["Hello 世界 🌍"]);
      const stderr = createSyntheticStream([]);

      const result = await collectCombinedOutput({ stdout, stderr });

      expect(result).toBe("Hello 世界 🌍");
    });

    it("decodes emoji characters", async () => {
      const stdout = createSyntheticStream(["🎉 🚀 💻 ✅"]);
      const stderr = createSyntheticStream([]);

      const result = await collectCombinedOutput({ stdout, stderr });

      expect(result).toBe("🎉 🚀 💻 ✅");
    });

    it("decodes special characters", async () => {
      const stdout = createSyntheticStream(["Café résumé naïve"]);
      const stderr = createSyntheticStream([]);

      const result = await collectCombinedOutput({ stdout, stderr });

      expect(result).toBe("Café résumé naïve");
    });

    it("handles UTF-8 across chunk boundaries", async () => {
      // Split a multi-byte character across chunks
      const encoder = new TextEncoder();
      const text = "世界"; // Each character is 3 bytes in UTF-8
      const bytes = encoder.encode(text);

      // Split the bytes in the middle of the second character
      const chunk1 = new Uint8Array(bytes.slice(0, 4)); // 世 + partial 界
      const chunk2 = new Uint8Array(bytes.slice(4)); // rest of 界

      const stdout = new ReadableStream<Uint8Array>({
        start(controller) {
          controller.enqueue(chunk1);
          controller.enqueue(chunk2);
          controller.close();
        },
      });
      const stderr = createSyntheticStream([]);

      const result = await collectCombinedOutput({ stdout, stderr });

      expect(result).toBe("世界");
    });
  });

  describe("empty streams", () => {
    it("returns empty string for empty streams", async () => {
      const stdout = createSyntheticStream([]);
      const stderr = createSyntheticStream([]);

      const result = await collectCombinedOutput({ stdout, stderr });

      expect(result).toBe("");
    });

    it("handles empty stdout with non-empty stderr", async () => {
      const stdout = createSyntheticStream([]);
      const stderr = createSyntheticStream(["error message"]);

      const result = await collectCombinedOutput({ stdout, stderr });

      expect(result).toBe("error message");
    });

    it("handles empty stderr with non-empty stdout", async () => {
      const stdout = createSyntheticStream(["output message"]);
      const stderr = createSyntheticStream([]);

      const result = await collectCombinedOutput({ stdout, stderr });

      expect(result).toBe("output message");
    });
  });

  describe("large output", () => {
    it("handles large output strings", async () => {
      const largeContent = "x".repeat(10000);
      const stdout = createSyntheticStream([largeContent]);
      const stderr = createSyntheticStream([]);

      const result = await collectCombinedOutput({ stdout, stderr });

      expect(result).toBe(largeContent);
      expect(result.length).toBe(10000);
    });

    it("handles many small chunks", async () => {
      const chunks: string[] = [];
      for (let i = 0; i < 100; i++) {
        chunks.push(`chunk-${i}-`);
      }

      const stdout = createSyntheticStream(chunks);
      const stderr = createSyntheticStream([]);

      const result = await collectCombinedOutput({ stdout, stderr });

      for (let i = 0; i < 100; i++) {
        expect(result).toContain(`chunk-${i}-`);
      }
    });
  });

  describe("stream error handling", () => {
    it("propagates stream errors", async () => {
      const stdout = createErrorStream(["partial "], "stdout error");
      const stderr = createSyntheticStream([]);

      await expect(collectCombinedOutput({ stdout, stderr })).rejects.toThrow("stdout error");
    });

    it("propagates stderr stream errors", async () => {
      const stdout = createSyntheticStream([]);
      const stderr = createErrorStream(["partial "], "stderr error");

      await expect(collectCombinedOutput({ stdout, stderr })).rejects.toThrow("stderr error");
    });
  });

  describe("line endings", () => {
    it("preserves Unix line endings", async () => {
      const stdout = createSyntheticStream(["line1\nline2\nline3"]);
      const stderr = createSyntheticStream([]);

      const result = await collectCombinedOutput({ stdout, stderr });

      expect(result).toBe("line1\nline2\nline3");
    });

    it("preserves Windows line endings", async () => {
      const stdout = createSyntheticStream(["line1\r\nline2\r\nline3"]);
      const stderr = createSyntheticStream([]);

      const result = await collectCombinedOutput({ stdout, stderr });

      expect(result).toBe("line1\r\nline2\r\nline3");
    });

    it("preserves mixed line endings", async () => {
      const stdout = createSyntheticStream(["unix\nwindows\r\nmixed\r\n"]);
      const stderr = createSyntheticStream([]);

      const result = await collectCombinedOutput({ stdout, stderr });

      expect(result).toBe("unix\nwindows\r\nmixed\r\n");
    });
  });
});
