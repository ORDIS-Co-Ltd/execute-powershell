const requiredFiles = [
  "dist/index.js",
  "dist/index.d.ts",
  "README.md",
  "LICENSE",
  "package.json",
];

interface PackFile {
  path: string;
}

interface PackResult {
  files: PackFile[];
}

export async function main(): Promise<void> {
  const proc = Bun.spawn(["npm", "pack", "--dry-run", "--json"]);
  const output = await new Response(proc.stdout).text();
  const packResult: PackResult[] = JSON.parse(output);
  const files = packResult[0].files.map((f: PackFile) => f.path);

  const missing = requiredFiles.filter((f) => !files.includes(f));
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
