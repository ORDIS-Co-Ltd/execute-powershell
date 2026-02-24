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
  const files = packResult[0].files.map((f: PackFile) => f.path);
  return REQUIRED_FILES.filter((f) => !files.includes(f));
}

export async function main(): Promise<void> {
  const proc = Bun.spawn(["npm", "pack", "--dry-run", "--json"]);
  const output = await new Response(proc.stdout).text();
  const packResult: PackResult[] = JSON.parse(output);

  const missing = validatePackFiles(packResult);
  if (missing.length > 0) {
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
