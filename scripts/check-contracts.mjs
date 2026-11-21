import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const specPath = path.join(rootDir, 'docs', 'fase2', '04-contratos', 'openapi.yaml');
const generatedPath = path.join(rootDir, 'apps', 'api', 'src', 'shared', 'openapi.generated.ts');

const require = createRequire(import.meta.url);
const openapiPkgPath = require.resolve('openapi-typescript/package.json', { paths: [rootDir] });
const openapiPkg = JSON.parse(readFileSync(openapiPkgPath, 'utf8'));
const openapiBinRel =
  typeof openapiPkg.bin === 'string' ? openapiPkg.bin : openapiPkg.bin['openapi-typescript'];
const openapiBin = path.resolve(path.dirname(openapiPkgPath), openapiBinRel);

const prettierPkgPath = require.resolve('prettier/package.json', { paths: [rootDir] });
const prettierPkg = JSON.parse(readFileSync(prettierPkgPath, 'utf8'));
const prettierBinRel =
  typeof prettierPkg.bin === 'string' ? prettierPkg.bin : prettierPkg.bin.prettier;
const prettierBin = path.resolve(path.dirname(prettierPkgPath), prettierBinRel);

const tempDir = mkdtempSync(path.join(tmpdir(), 'panelada-contracts-'));
const tempOut = path.join(tempDir, 'openapi.generated.ts');

try {
  execFileSync(process.execPath, [openapiBin, specPath, '-o', tempOut], {
    cwd: rootDir,
    stdio: 'pipe',
  });
  execFileSync(
    process.execPath,
    [prettierBin, '--config', path.join(rootDir, '.prettierrc.json'), '--write', tempOut],
    {
      cwd: rootDir,
      stdio: 'pipe',
    },
  );

  const expected = readFileSync(tempOut, 'utf8');
  let actual = '';
  try {
    actual = readFileSync(generatedPath, 'utf8');
  } catch {
    console.error(
      `Missing generated OpenAPI types at ${path.relative(rootDir, generatedPath)}. Run "pnpm contracts:generate".`,
    );
    process.exit(1);
  }

  if (actual !== expected) {
    console.error(
      'Generated OpenAPI types are out of date with docs/fase2/04-contratos/openapi.yaml.\n' +
        'Run "pnpm contracts:generate" and commit the updated file.',
    );
    process.exit(1);
  }

  console.log('OpenAPI generated types are up to date.');
} finally {
  rmSync(tempDir, { recursive: true, force: true });
}
