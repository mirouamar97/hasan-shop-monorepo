#!/usr/bin/env node
/**
 * Cross-platform CI entry point.
 * - Windows: runs scripts/ci/run-ci.ps1
 * - Unix: runs scripts/ci/run-ci.sh
 */
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '../..');

if (process.platform === 'win32') {
  const ps1 = path.join(__dirname, 'run-ci.ps1');
  const result = spawnSync(
    'powershell',
    ['-ExecutionPolicy', 'Bypass', '-File', ps1],
    { stdio: 'inherit', cwd: root },
  );
  process.exit(result.status ?? 1);
}

const sh = path.join(__dirname, 'run-ci.sh');
const result = spawnSync('bash', [sh], { stdio: 'inherit', cwd: root });
process.exit(result.status ?? 1);
