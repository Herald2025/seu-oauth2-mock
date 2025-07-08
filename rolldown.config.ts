import { defineConfig } from 'rolldown';

export default defineConfig({
  input: 'src/index.ts',
  external: [
    /^node:.*/,
    'express',
    'body-parser', 
    'oauth2-server',
    'fs',
    'path',
    'util',
    'url',
    'crypto',
    'buffer',
    'querystring',
    'stream',
    'string_decoder',
  ],
  output: {
    file: 'dist/main.js',
    minify: true
  }
});
