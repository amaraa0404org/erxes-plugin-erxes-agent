// @ts-check

import { ModuleFederationPlugin } from '@module-federation/enhanced/rspack';
import { defineConfig } from '@rspack/cli';
import { rspack } from '@rspack/core';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import mfConfig from './module-federation.config.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  entry: './src/main.ts',
  devServer: {
    port: Number(process.env.PORT || 3016),
    historyApiFallback: true,
    headers: { 'Access-Control-Allow-Origin': '*' },
  },
  resolve: {
    extensions: ['.ts', '.tsx', '.js', '.jsx'],
    alias: {
      '~': resolve(__dirname, 'src'),
      '@': resolve(__dirname, 'src/modules'),
    },
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: {
          loader: 'builtin:swc-loader',
          options: {
            jsc: {
              parser: { syntax: 'typescript', tsx: true },
              transform: { react: { runtime: 'automatic' } },
            },
          },
        },
        type: 'javascript/auto',
      },
      {
        test: /\.css$/,
        use: ['postcss-loader'],
        type: 'css',
      },
    ],
  },
  plugins: [
    new rspack.HtmlRspackPlugin({ template: './src/index.html' }),
    new ModuleFederationPlugin(mfConfig),
  ],
  experiments: { css: true },
  output: {
    uniqueName: 'erxes_agent_ui',
    publicPath: 'auto',
  },
});
