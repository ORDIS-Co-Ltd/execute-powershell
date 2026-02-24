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
  if (!packResult || !packResult[0] || !packResult[0].files) {
    return REQUIRED_FILES; // All files missing if payload malformed
  }
  const files = packResult[0].files.map((f: PackFile) => f.path);
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
