/**
 * Collect combined stdout and stderr output from a process.
 *
 * Reads both streams concurrently and appends chunks in observed arrival order,
 * preserving the interleaving of output as it occurred.
 *
 * @param proc - Object with stdout and stderr ReadableStreams
 * @returns Promise resolving to combined output string
 */
export async function collectCombinedOutput(
  proc: { stdout: ReadableStream<Uint8Array>; stderr: ReadableStream<Uint8Array> }
): Promise<string> {
  const decoder = new TextDecoder("utf-8");
  const chunks: string[] = [];

  const readStream = async (stream: ReadableStream<Uint8Array>) => {
    const reader = stream.getReader();
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        chunks.push(decoder.decode(value, { stream: true }));
      }
    } finally {
      reader.releaseLock();
    }
  };

  // Read both streams concurrently
  await Promise.all([readStream(proc.stdout), readStream(proc.stderr)]);

  // Flush any remaining bytes
  chunks.push(decoder.decode());

  return chunks.join("");
}
