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

      expect(result).toBe("stdout line 1\nstderr line 1\n");
    });
  });

  describe("interleaved output order", () => {
    it("preserves arrival order of interleaved chunks", async () => {
      // Create streams with multiple small chunks to encourage interleaving
      // Using deterministic delay to ensure predictable interleaving
      const stdout = new ReadableStream<Uint8Array>({
        async start(controller) {
          const encoder = new TextEncoder();
          controller.enqueue(encoder.encode("stdout-1 "));
          await new Promise((resolve) => setTimeout(resolve, 1));
          controller.enqueue(encoder.encode("stdout-2 "));
          await new Promise((resolve) => setTimeout(resolve, 1));
          controller.enqueue(encoder.encode("stdout-3"));
          controller.close();
        },
      });
      const stderr = new ReadableStream<Uint8Array>({
        async start(controller) {
          const encoder = new TextEncoder();
          controller.enqueue(encoder.encode("stderr-1 "));
          await new Promise((resolve) => setTimeout(resolve, 1));
          controller.enqueue(encoder.encode("stderr-2 "));
          await new Promise((resolve) => setTimeout(resolve, 1));
          controller.enqueue(encoder.encode("stderr-3"));
          controller.close();
        },
      });

      const result = await collectCombinedOutput({ stdout, stderr });

      // Verify all content is present in correct relative order
      // stdout chunks should be in order, stderr chunks should be in order
      expect(result.indexOf("stdout-1")).toBeLessThan(result.indexOf("stdout-2"));
      expect(result.indexOf("stdout-2")).toBeLessThan(result.indexOf("stdout-3"));
      expect(result.indexOf("stderr-1")).toBeLessThan(result.indexOf("stderr-2"));
      expect(result.indexOf("stderr-2")).toBeLessThan(result.indexOf("stderr-3"));
      // All content should be present
      expect(result).toContain("stdout-1");
      expect(result).toContain("stdout-2");
      expect(result).toContain("stdout-3");
      expect(result).toContain("stderr-1");
      expect(result).toContain("stderr-2");
      expect(result).toContain("stderr-3");
    });

    it("handles rapid interleaving", async () => {
      // Create a deterministic interleaved stream where we can predict exact order
      const encoder = new TextEncoder();
      const chunks: Array<{ source: "stdout" | "stderr"; data: Uint8Array }> =
        [];

      // Create alternating chunks: O0, E0, O1, E1, etc.
      for (let i = 0; i < 10; i++) {
        chunks.push({ source: "stdout", data: encoder.encode(`O${i}`) });
        chunks.push({ source: "stderr", data: encoder.encode(`E${i}`) });
      }

      const stdout = new ReadableStream<Uint8Array>({
        async start(controller) {
          for (const chunk of chunks.filter((c) => c.source === "stdout")) {
            controller.enqueue(chunk.data);
            await new Promise((resolve) => setTimeout(resolve, 1));
          }
          controller.close();
        },
      });

      const stderr = new ReadableStream<Uint8Array>({
        async start(controller) {
          for (const chunk of chunks.filter((c) => c.source === "stderr")) {
            controller.enqueue(chunk.data);
            await new Promise((resolve) => setTimeout(resolve, 1));
          }
          controller.close();
        },
      });

      const result = await collectCombinedOutput({ stdout, stderr });

      // With synchronous starts and same delays, they interleave as: O0 E0 O1 E1...
      const expected: string[] = [];
      for (let i = 0; i < 10; i++) {
        expected.push(`O${i}`);
        expected.push(`E${i}`);
      }
      expect(result).toBe(expected.join(""));
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

    it("handles multi-byte UTF-8 split across chunks with interleaving", async () => {
      // Regression test: UTF-8 corruption when chunks interleave
      // This tests that separate decoders per stream prevent state bleeding
      const encoder = new TextEncoder();

      // 世界 is 6 bytes total (3 bytes per character)
      // We'll split stdout bytes and interleave with stderr
      const stdoutText = "世界";
      const stdoutBytes = encoder.encode(stdoutText);

      // stderr has simple ASCII
      const stderrText = "AB";
      const stderrBytes = encoder.encode(stderrText);

      // Create streams that interleave: stdout chunk 1, stderr chunk 1, stdout chunk 2, stderr chunk 2
      const stdoutChunk1 = new Uint8Array(stdoutBytes.slice(0, 4)); // 世 + partial 界
      const stdoutChunk2 = new Uint8Array(stdoutBytes.slice(4)); // rest of 界

      const stderrChunk1 = new Uint8Array([stderrBytes[0]]); // A
      const stderrChunk2 = new Uint8Array([stderrBytes[1]]); // B

      const stdout = new ReadableStream<Uint8Array>({
        async start(controller) {
          controller.enqueue(stdoutChunk1);
          await new Promise((resolve) => setTimeout(resolve, 1));
          controller.enqueue(stdoutChunk2);
          controller.close();
        },
      });

      const stderr = new ReadableStream<Uint8Array>({
        async start(controller) {
          controller.enqueue(stderrChunk1);
          await new Promise((resolve) => setTimeout(resolve, 1));
          controller.enqueue(stderrChunk2);
          controller.close();
        },
      });

      const result = await collectCombinedOutput({ stdout, stderr });

      // The key assertion: UTF-8 characters must decode correctly despite interleaving
      // With separate decoders, the multi-byte character "界" should be intact
      // not corrupted by decoder state bleeding from stderr chunks
      expect(result).toContain("世");
      expect(result).toContain("界");
      expect(result).toContain("A");
      expect(result).toContain("B");

      // Verify the characters appear in the correct relative order
      const indexOfWorld = result.indexOf("世");
      const indexOfBoundary = result.indexOf("界");
      const indexOfA = result.indexOf("A");
      const indexOfB = result.indexOf("B");

      expect(indexOfWorld).toBeLessThan(indexOfBoundary);
      expect(indexOfA).toBeLessThan(indexOfB);
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

      expect(result).toBe(chunks.join(""));
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
