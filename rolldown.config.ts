import { defineConfig } from 'rolldown';
import { builtinModules } from 'node:module';

const nodeBuiltins = new Set([
  ...builtinModules,
  ...builtinModules.map((name) => `node:${name}`),
]);

const external = (id: string) => id.startsWith('node:') || nodeBuiltins.has(id);

export default defineConfig([
  {
    input: 'apps/auth-server/index.ts',
    platform: 'node',
    external,
    output: {
      file: 'dist/auth-server.mjs',
      format: 'esm',
      codeSplitting: false,
    },
  },
  {
    input: 'apps/demo-frontend/index.ts',
    platform: 'node',
    external,
    output: {
      file: 'dist/demo-frontend.mjs',
      format: 'esm',
      codeSplitting: false,
    },
  },
]);
