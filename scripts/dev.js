/**
 * Starts the backend API and the Next.js dashboard together, so the dashboard always
 * has something to fetch from. Ctrl+C stops both.
 *
 *   npm run dev            (from the project root)
 *
 * No dependencies: plain child_process.
 */
import { spawn } from 'node:child_process';
import { connect } from 'node:net';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

const SERVICES = [
  { name: 'backend ', cwd: join(root, 'backend'), port: 4000, color: '\x1b[36m' },
  { name: 'frontend', cwd: join(root, 'frontend'), port: 3000, color: '\x1b[35m' },
];

const RESET = '\x1b[0m';
const children = [];

/**
 * Is anything answering on this port? Windows lets a second socket bind 127.0.0.1
 * while another listens on 0.0.0.0, so probe with a connection rather than a bind.
 */
const portFree = (port) =>
  new Promise((resolve) => {
    const socket = connect({ port, host: '127.0.0.1' })
      .setTimeout(1000)
      .once('connect', () => socket.destroy(resolve(false)))
      .once('timeout', () => socket.destroy(resolve(true)))
      .once('error', () => resolve(true));
  });

for (const service of SERVICES) {
  if (!(await portFree(service.port))) {
    console.log(
      `${service.color}${service.name}${RESET} | port ${service.port} is already in use — skipping (something is already running there)`,
    );
    continue;
  }

  const child = spawn('npm', ['run', 'dev'], { cwd: service.cwd, shell: true });
  children.push(child);

  const prefix = (line) => `${service.color}${service.name}${RESET} | ${line}`;
  const pipe = (stream, out) => {
    let buffer = '';
    stream.on('data', (chunk) => {
      buffer += chunk;
      const lines = buffer.split('\n');
      buffer = lines.pop() ?? '';
      for (const line of lines) if (line.trim()) out(prefix(line));
    });
  };
  pipe(child.stdout, console.log);
  pipe(child.stderr, console.error);

  // One service failing shouldn't take the other down — it usually restarts itself on save.
  child.on('exit', (code) => console.log(prefix(`exited with code ${code}`)));
}

if (!children.length) {
  console.log('\nBoth ports are already in use — nothing to start.\n');
  process.exit(0);
}

console.log('\n  Dashboard → http://localhost:3000     API → http://localhost:4000/health\n  Ctrl+C stops both.\n');

function shutdown(code = 0) {
  for (const child of children) child.kill();
  process.exit(code);
}
process.on('SIGINT', () => shutdown(0));
process.on('SIGTERM', () => shutdown(0));
