import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // Only this checkout: ignored clean-build archives may also contain tests.
    include: ['tests/**/*.test.{ts,mjs}'],
  },
});
