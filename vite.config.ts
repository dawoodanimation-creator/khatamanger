import { execSync } from 'node:child_process';
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

let commitHash = 'dev';
try {
  commitHash = execSync('git rev-parse --short HEAD').toString().trim();
} catch {
  // ignore
}

export default defineConfig({
  base: process.env.VITE_BASE || '/',
  plugins: [react()],
  define: {
    __COMMIT_HASH__: JSON.stringify(commitHash),
  },
  server: { host: '0.0.0.0', port: 5173, strictPort: true, allowedHosts: true },
  test: { environment: 'node', include: ['src/**/*.test.{ts,tsx}'] },
});
