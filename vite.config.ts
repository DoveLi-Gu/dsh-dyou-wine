import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    host: '127.0.0.1', port: 4179, strictPort: true,
    watch: { ignored: ['**/.qa/**', '**/.test-dsh-home/**', '**/test-results/**', '**/playwright-report/**', '**/*.tgz'] },
  },
});
