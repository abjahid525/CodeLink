const { spawn } = require('node:child_process');

const port = 3100 + Math.floor(Math.random() * 500);
const server = spawn(process.execPath, ['backend/server.js'], {
  env: { ...process.env, NODE_ENV: 'test', PORT: String(port) },
  stdio: ['ignore', 'pipe', 'pipe']
});

let output = '';
server.stdout.on('data', (chunk) => {
  output += chunk.toString();
});
server.stderr.on('data', (chunk) => {
  output += chunk.toString();
});

const stopServer = () => {
  if (!server.killed) server.kill();
};

const fail = (error) => {
  stopServer();
  console.error(error.message);
  if (output) console.error(output);
  process.exitCode = 1;
};

const waitForHealth = async () => {
  const url = `http://127.0.0.1:${port}/api/health`;
  const deadline = Date.now() + 10000;

  while (Date.now() < deadline) {
    try {
      const response = await fetch(url);
      const body = await response.json();
      if (response.ok && body.status === 'ok') {
        const protectedResponse = await fetch(`http://127.0.0.1:${port}/api/admin/users`);
        if (protectedResponse.status !== 401) {
          throw new Error(`Protected admin endpoint returned ${protectedResponse.status} without a token.`);
        }

        console.log('CodeLink health and authorization checks passed.');
        stopServer();
        return;
      }
    } catch {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  }

  throw new Error('CodeLink health endpoint did not become ready.');
};

server.once('error', fail);
waitForHealth().catch(fail);
