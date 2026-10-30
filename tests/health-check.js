const { spawn } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const port = 3100 + Math.floor(Math.random() * 500);
const dataDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'codelink-test-'));
const server = spawn(process.execPath, ['backend/server.js'], {
  env: { ...process.env, DATA_DIR: dataDirectory, NODE_ENV: 'test', PORT: String(port) },
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
  fs.rmSync(dataDirectory, { recursive: true, force: true });
};

const verifyProductionSecretRequired = () => new Promise((resolve, reject) => {
  const productionServer = spawn(process.execPath, ['backend/server.js'], {
    env: {
      ...process.env,
      DATA_DIR: dataDirectory,
      NODE_ENV: 'production',
      JWT_SECRET: '',
      PORT: String(port + 1)
    },
    stdio: ['ignore', 'pipe', 'pipe']
  });
  let productionOutput = '';
  const timeout = setTimeout(() => {
    productionServer.kill();
    reject(new Error('CodeLink started in production without JWT_SECRET.'));
  }, 5000);

  productionServer.stdout.on('data', (chunk) => {
    productionOutput += chunk.toString();
  });
  productionServer.stderr.on('data', (chunk) => {
    productionOutput += chunk.toString();
  });
  productionServer.once('error', reject);
  productionServer.once('exit', (code) => {
    clearTimeout(timeout);
    if (code === 0 || !productionOutput.includes('JWT_SECRET must be set')) {
      reject(new Error('CodeLink did not reject missing production JWT_SECRET.'));
      return;
    }
    resolve();
  });
});

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

        await verifyProductionSecretRequired();
        console.log('CodeLink health, authorization, and production configuration checks passed.');
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
