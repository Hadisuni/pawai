import path from 'node:path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
  },
  resolve: {
    // Mirrors tsconfig's "@/*" -> "./src/*" so tests import app modules the
    // same way the app does.
    alias: { '@': path.resolve(__dirname, 'src') },
  },
});
