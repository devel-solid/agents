// Private synchronous adapter supervisor. Git arguments are never diagnostics.
import { spawn, execFile } from 'node:child_process';
import { join } from 'node:path';

const timeout = Number(process.argv[2]);
const child = spawn('git', process.argv.slice(3), {
  windowsHide: true,
  detached: process.platform !== 'win32',
  stdio: ['ignore', 'pipe', 'pipe'],
});
let stdout = '',
  stderr = '',
  errorCode: string | undefined;
let timedOut = false,
  cancelled = false,
  overflow = false,
  done = false;
let bytes = 0;
let killGuard: NodeJS.Timeout | undefined;
function finish(status: number | null): void {
  if (done) return;
  done = true;
  clearTimeout(timer);
  if (killGuard) clearTimeout(killGuard);
  process.stdout.write(
    JSON.stringify({
      stdout,
      stderr,
      status,
      errorCode,
      timedOut,
      cancelled,
      overflow,
    }),
  );
}
function terminate(): void {
  if (killGuard || done) return;
  const pid = child.pid;
  if (pid && process.platform === 'win32') {
    // taskkill is part of Windows; /T covers credential, SSH and remote helpers.
    const taskkill = join(
      process.env.SystemRoot ?? 'C:\\Windows',
      'System32',
      'taskkill.exe',
    );
    execFile(
      taskkill,
      ['/PID', String(pid), '/T', '/F'],
      { windowsHide: true, timeout: 2000 },
      () => {
        try {
          child.kill('SIGKILL');
        } catch {
          /* The process may already have exited. */
        }
      },
    );
  } else if (pid) {
    try {
      process.kill(-pid, 'SIGKILL');
    } catch {
      try {
        child.kill('SIGKILL');
      } catch {
        /* Already gone. */
      }
    }
  }
  killGuard = setTimeout(() => {
    try {
      child.kill('SIGKILL');
    } catch {
      /* Already gone. */
    }
    child.stdout.destroy();
    child.stderr.destroy();
    finish(null);
  }, 2500);
}
const timer = setTimeout(() => {
  timedOut = true;
  terminate();
}, timeout);
for (const signal of ['SIGINT', 'SIGTERM'] as const)
  process.on(signal, () => {
    cancelled = true;
    terminate();
  });
function collect(chunk: string, destination: 'stdout' | 'stderr'): void {
  bytes += Buffer.byteLength(chunk);
  if (bytes > 16 * 1024 * 1024) {
    overflow = true;
    terminate();
    return;
  }
  if (destination === 'stdout') stdout += chunk;
  else stderr += chunk;
}
child.stdout
  .setEncoding('utf8')
  .on('data', (chunk: string) => collect(chunk, 'stdout'));
child.stderr
  .setEncoding('utf8')
  .on('data', (chunk: string) => collect(chunk, 'stderr'));
child.on('error', (error) => {
  errorCode = (error as NodeJS.ErrnoException).code;
  finish(null);
});
child.on('close', (status) => finish(status));
