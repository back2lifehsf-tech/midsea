import { defineConfig } from 'vitest/config';
import path from 'node:path';

/**
 * Vitest config — Epic 01 §8.
 *
 * Alias `server-only` a un módulo vacío para que las utilidades server-side
 * (password.ts, student-pin.ts) sean testeables sin levantar Next.
 * Path alias `@/*` paralelo a tsconfig.
 */
export default defineConfig({
  resolve: {
    alias: {
      'server-only': path.resolve(__dirname, 'tests/server-only-stub.ts'),
      '@': path.resolve(__dirname, 'src')
    }
  },
  test: {
    environment: 'node',
    include: [
      'src/**/*.test.ts',
      'src/**/*.test.tsx',
      'scripts/**/*.test.mjs'
    ]
  }
});
