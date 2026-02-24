/**
 * Collect combined stdout and stderr output from a process.
 *
 * Reads both streams concurrently and appends chunks in observed arrival order,
 * preserving the interleaving of output as it occurred. Uses separate TextDecoder
 * instances per stream to prevent UTF-8 corruption when chunks interleave.
 *
 * @param proc - Object with stdout and stderr ReadableStreams
 * @returns Promise resolving to combined output string
 */
export async function collectCombinedOutput(
  proc: { stdout: ReadableStream<Uint8Array>; stderr: ReadableStream<Uint8Array> }
): Promise<string> {
  const chunks: Array<{ text: string; order: number }> = [];
  let order = 0;

  const readStream = async (
    stream: ReadableStream<Uint8Array>,
    decoder: TextDecoder
  ) => {
    const reader = stream.getReader();
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const text = decoder.decode(value, { stream: true });
        chunks.push({ text, order: order++ });
      }
    } finally {
      reader.releaseLock();
    }
  };

  // Use separate decoders for each stream to prevent UTF-8 corruption
  const stdoutDecoder = new TextDecoder("utf-8");
  const stderrDecoder = new TextDecoder("utf-8");

  // Read both streams concurrently
  await Promise.all([
    readStream(proc.stdout, stdoutDecoder),
    readStream(proc.stderr, stderrDecoder),
  ]);

  // Sort by arrival order
  chunks.sort((a, b) => a.order - b.order);

  // Join chunks and flush any remaining bytes from both decoders
  return (
    chunks.map((c) => c.text).join("") +
    stdoutDecoder.decode() +
    stderrDecoder.decode()
  );
}
