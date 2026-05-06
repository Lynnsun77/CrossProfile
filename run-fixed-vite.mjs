import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import os from 'node:os';
import { fileURLToPath } from 'node:url';

const projectRoot = fileURLToPath(new URL('.', import.meta.url));
const viteBin = fileURLToPath(new URL('./node_modules/vite/bin/vite.js', import.meta.url));
const configPath = fileURLToPath(new URL('./vite.config.ts', import.meta.url));
const nodeExecutable = existsSync(process.execPath) ? process.execPath : 'node';
const port = 5173;
const targetPath = '/marketplace';
const mode = process.argv[2] ?? 'dev';

function rankLanAddress(ip) {
  if (ip.startsWith('192.168.')) return 3;
  if (/^172\.(1[6-9]|2\d|3[0-1])\./.test(ip)) return 2;
  if (ip.startsWith('10.')) return 1;
  return 0;
}

function getLanIp() {
  const candidates = [];
  const interfaces = os.networkInterfaces();

  Object.values(interfaces).forEach((entries) => {
    (entries ?? []).forEach((entry) => {
      if (!entry || entry.internal || entry.family !== 'IPv4' || entry.address.startsWith('169.254.')) return;
      candidates.push(entry.address);
    });
  });

  return [...new Set(candidates)].sort((a, b) => rankLanAddress(b) - rankLanAddress(a))[0] ?? null;
}

function printTrustedUrls() {
  const lanIp = getLanIp();
  console.log('');
  console.log(`Fixed Root:   ${projectRoot}`);
  console.log(`Trusted URL:  http://localhost:${port}${targetPath}`);
  console.log(`Trusted LAN:  ${lanIp ? `http://${lanIp}:${port}${targetPath}` : 'unavailable'}`);
  console.log('');
}

function viteArgs() {
  const shared = ['--config', configPath];
  if (mode === 'build') return ['build', ...shared];
  if (mode === 'preview') return ['preview', ...shared];
  return shared;
}

printTrustedUrls();

const child = spawn(nodeExecutable, [viteBin, ...viteArgs()], {
  cwd: projectRoot,
  stdio: 'inherit',
  env: process.env,
});

child.on('exit', (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }
  process.exit(code ?? 0);
});
