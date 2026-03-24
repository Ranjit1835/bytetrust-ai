import { exec, type ChildProcess } from 'child_process';
import { join } from 'path';

interface RunningApp {
  process: ChildProcess;
  port: number;
  projectDir: string;
  startedAt: number;
}

// Track running apps globally
const runningApps = new Map<string, RunningApp>();

/**
 * Start a Flask application and return the localhost URL.
 */
export async function startApp(
  projectDir: string,
  entryPoint: string,
  port: number
): Promise<{ url: string; appId: string }> {
  const appId = `app_${port}`;

  // Stop any existing app on this port
  await stopApp(appId);

  const entryPath = join(projectDir, entryPoint);

  return new Promise((resolve, reject) => {
    const proc = exec(
      `python "${entryPath}"`,
      {
        cwd: projectDir,
        env: {
          ...process.env,
          FLASK_ENV: 'development',
          PYTHONUNBUFFERED: '1',
        },
      }
    );

    const app: RunningApp = {
      process: proc,
      port,
      projectDir,
      startedAt: Date.now(),
    };
    runningApps.set(appId, app);

    // Handle process errors
    proc.stderr?.on('data', (data: Buffer) => {
      const msg = data.toString();
      // Flask prints "Running on http://..." to stderr
      if (msg.includes('Running on') || msg.includes('Serving Flask')) {
        resolve({ url: `http://localhost:${port}`, appId });
      }
    });

    proc.on('error', (err) => {
      runningApps.delete(appId);
      reject(new Error(`Failed to start app: ${err.message}`));
    });

    proc.on('exit', (code) => {
      if (code !== null && code !== 0) {
        runningApps.delete(appId);
      }
    });

    // Fallback: if Flask doesn't print the usual message, check with HTTP after a delay
    setTimeout(async () => {
      try {
        const res = await fetch(`http://localhost:${port}/`);
        if (res.ok) {
          resolve({ url: `http://localhost:${port}`, appId });
        }
      } catch {
        // Server not ready yet, give it more time
      }
    }, 3000);

    // Final timeout
    setTimeout(() => {
      resolve({ url: `http://localhost:${port}`, appId });
    }, 6000);
  });
}

/**
 * Stop a running application.
 */
export async function stopApp(appId: string): Promise<boolean> {
  const app = runningApps.get(appId);
  if (!app) return false;

  try {
    app.process.kill('SIGTERM');
    // Force kill after 2 seconds if still running
    setTimeout(() => {
      try { app.process.kill('SIGKILL'); } catch { /* ignore */ }
    }, 2000);
  } catch {
    /* ignore */
  }

  runningApps.delete(appId);
  return true;
}

/**
 * Get info about a running app.
 */
export function getAppInfo(appId: string) {
  const app = runningApps.get(appId);
  if (!app) return null;
  return {
    appId,
    port: app.port,
    url: `http://localhost:${app.port}`,
    uptime: Date.now() - app.startedAt,
  };
}

/**
 * Stop all running apps.
 */
export async function stopAllApps() {
  for (const [appId] of runningApps) {
    await stopApp(appId);
  }
}
