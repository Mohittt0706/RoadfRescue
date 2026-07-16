import { execSync } from 'child_process';

const PORT = process.env.PORT || 3001;

try {
  if (process.platform === 'win32') {
    const output = execSync(`netstat -ano | findstr :${PORT}`, { encoding: 'utf-8', stdio: 'pipe' });
    const lines = output.trim().split('\n').filter(l => l.includes('LISTENING'));
    for (const line of lines) {
      const pid = line.trim().split(/\s+/).pop();
      if (pid && pid !== '0') {
        try {
          execSync(`taskkill /F /PID ${pid}`, { stdio: 'pipe' });
          console.log(`[kill-port] Killed process ${pid} on port ${PORT}`);
        } catch {}
      }
    }
  } else {
    try {
      execSync(`lsof -ti:${PORT} | xargs kill -9`, { stdio: 'pipe' });
    } catch {}
  }
} catch {
  // Port not in use - nothing to kill
}
