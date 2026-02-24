export interface PackFile {
  path: string;
}

export interface PackResult {
  files: PackFile[];
}

export const REQUIRED_FILES = [
  "dist/index.js",
  "dist/index.d.ts",
  "README.md",
  "LICENSE",
  "package.json",
];

export function validatePackFiles(packResult: PackResult[]): string[] {
  // Validate packResult structure
  if (!Array.isArray(packResult) || packResult.length === 0) {
    return REQUIRED_FILES;
  }

  const result = packResult[0];
  if (!result || typeof result !== "object") {
    return REQUIRED_FILES;
  }

  // Validate files is an array
  if (!Array.isArray(result.files)) {
    return REQUIRED_FILES;
  }

  // Safely extract paths, handling non-object items
  const files: string[] = [];
  for (const item of result.files) {
    if (item && typeof item === "object" && typeof item.path === "string") {
      files.push(item.path);
    }
  }

  return REQUIRED_FILES.filter((f) => !files.includes(f));
}

export async function runCheck(): Promise<{ success: boolean; missing: string[] }> {
  const proc = Bun.spawn(["npm", "pack", "--dry-run", "--json"]);
  const output = await new Response(proc.stdout).text();

  try {
    const packResult: PackResult[] = JSON.parse(output);
    const missing = validatePackFiles(packResult);
    return { success: missing.length === 0, missing };
  } catch {
    return { success: false, missing: REQUIRED_FILES };
  }
}

export async function main(
  checkFn: () => Promise<{ success: boolean; missing: string[] }> = runCheck
): Promise<void> {
  const { success, missing } = await checkFn();
  if (!success) {
    console.error("Missing required files:", missing);
    process.exit(1);
  }
  console.log("✓ All required files present");
}

if (import.meta.main) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
