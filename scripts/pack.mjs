#!/usr/bin/env node
/**
 * Packs the plugin release artifact the erxes plugin host downloads and runs:
 *
 *   dist-artifact/<name>-<version>.tgz
 *     plugin.json
 *     api/dist/main.js
 *     api/package.json
 *     api/node_modules/   (production deps, self-contained)
 *     ui/dist/            (when the repo has a ui/ package)
 *
 * Prints the tarball's sha256 — paste it into plugin.json `artifact.sha256`.
 * Zero dependencies; requires node >= 18 and pnpm + tar on PATH.
 */

import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import {
  cpSync,
  existsSync,
  lstatSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  realpathSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const manifest = JSON.parse(readFileSync(path.join(root, 'plugin.json'), 'utf8'));
const { name, version } = manifest;

if (!name || !version) {
  console.error('plugin.json must declare name and version');
  process.exit(1);
}

const hasApi = existsSync(path.join(root, 'api', 'package.json'));
const hasUi = existsSync(path.join(root, 'ui', 'package.json'));

if (!hasApi && !hasUi) {
  console.error('Nothing to pack: no api/ or ui/ package found');
  process.exit(1);
}

const run = (cmd, args, cwd = root) => {
  console.log(`$ ${cmd} ${args.join(' ')}`);
  execFileSync(cmd, args, { cwd, stdio: 'inherit' });
};

const runQuiet = (cmd, args, cwd = root) => {
  try {
    execFileSync(cmd, args, { cwd, stdio: 'pipe' });
    return true;
  } catch {
    return false;
  }
};

// Absolute-ize relative file: deps (e.g. file:../vendor/sdk.tgz) so a pnpm
// install inside the staging dir resolves them against the real repo.
const absolutizeFileDeps = (pkgPath, pkgDir) => {
  const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'));
  let touched = false;

  for (const section of ['dependencies', 'devDependencies']) {
    for (const [dep, spec] of Object.entries(pkg[section] || {})) {
      if (typeof spec === 'string' && spec.startsWith('file:') && !path.isAbsolute(spec.slice(5))) {
        pkg[section][dep] = `file:${path.resolve(pkgDir, spec.slice(5))}`;
        touched = true;
      }
    }
  }

  if (touched) {
    writeFileSync(pkgPath, JSON.stringify(pkg, null, 2));
  }

  return pkg;
};

const assertNoEscapingSymlinks = (dir) => {
  // realpath both sides: the staging dir itself may sit under a symlinked
  // prefix (macOS /var -> /private/var), which would falsely flag in-tree links.
  const rootResolved = realpathSync(dir);
  const stack = [rootResolved];

  while (stack.length) {
    const current = stack.pop();
    for (const entry of readdirSync(current, { withFileTypes: true })) {
      const full = path.join(current, entry.name);
      if (lstatSync(full).isSymbolicLink()) {
        const rel = path.relative(rootResolved, realpathSync(full));
        if (rel.startsWith('..') || path.isAbsolute(rel)) {
          throw new Error(`Symlink escapes the staging dir: ${full} -> ${realpathSync(full)}`);
        }
      } else if (entry.isDirectory()) {
        stack.push(full);
      }
    }
  }
};

// --- 1. build ---
if (hasApi) {
  run('pnpm', ['--dir', 'api', 'build']);
}
if (hasUi) {
  run('pnpm', ['--dir', 'ui', 'build']);
}

// --- 2. stage ---
const staging = mkdtempSync(path.join(tmpdir(), `${name}-pack-`));
try {
  cpSync(path.join(root, 'plugin.json'), path.join(staging, 'plugin.json'));

  if (hasApi) {
    const stagingApi = path.join(staging, 'api');

    // Prefer pnpm deploy: it copies the package and installs production deps
    // resolving file:/workspace: specs into real folders. Falls back to a
    // prod install in-place when deploy is unavailable (non-workspace repo).
    const deployed = runQuiet('pnpm', ['--dir', 'api', 'deploy', '--prod', '--legacy', stagingApi]);

    if (!deployed) {
      mkdirSync(stagingApi, { recursive: true });
      cpSync(path.join(root, 'api', 'package.json'), path.join(stagingApi, 'package.json'));

      const original = readFileSync(path.join(stagingApi, 'package.json'), 'utf8');
      absolutizeFileDeps(path.join(stagingApi, 'package.json'), path.join(root, 'api'));
      run('pnpm', ['--dir', stagingApi, 'install', '--prod', '--no-frozen-lockfile']);
      // Ship the pristine manifest, not the path-rewritten install copy.
      writeFileSync(path.join(stagingApi, 'package.json'), original);
    }

    if (!existsSync(path.join(stagingApi, 'dist', 'main.js'))) {
      cpSync(path.join(root, 'api', 'dist'), path.join(stagingApi, 'dist'), { recursive: true });
    }
    if (!existsSync(path.join(stagingApi, 'node_modules'))) {
      throw new Error('api/node_modules missing in staging — production install failed');
    }
  }

  if (hasUi && existsSync(path.join(root, 'ui', 'dist'))) {
    cpSync(path.join(root, 'ui', 'dist'), path.join(staging, 'ui', 'dist'), { recursive: true });
  }

  assertNoEscapingSymlinks(staging);

  // --- 3. tarball ---
  const outDir = path.join(root, 'dist-artifact');
  mkdirSync(outDir, { recursive: true });
  const outFile = path.join(outDir, `${name}-${version}.tgz`);

  // -h dereferences symlinks so the extracted tree is fully self-contained.
  run('tar', ['-czhf', outFile, '-C', staging, '.']);

  const sha256 = createHash('sha256').update(readFileSync(outFile)).digest('hex');
  console.log(`\nArtifact: ${outFile}`);
  console.log(`sha256:   ${sha256}`);
} finally {
  rmSync(staging, { recursive: true, force: true });
}
