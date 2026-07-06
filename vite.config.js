import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { createRequire } from 'module'

const require = createRequire(import.meta.url)
const tailwindcss = require('tailwindcss')
const autoprefixer = require('autoprefixer')
const postcss = require('postcss')

export default defineConfig({
  plugins: [vue()],
  meteor: {
    clientEntry: 'imports/ui/main.js',
  },
  css: {
    postcss: {
      plugins: [
        {
          postcssPlugin: 'skip-tailwind-in-node-modules',
          Once(root, { result }) {
            const file = root.source && root.source.input && root.source.input.file;
            if (file && (file.includes('node_modules') || !file.includes(process.cwd()))) {
              return;
            }
            return postcss([tailwindcss()]).process(root.toString(), { from: file }).then(res => {
              root.removeAll();
              root.append(postcss.parse(res.css));
            });
          }
        },
        autoprefixer()
      ]
    }
  },
  optimizeDeps: {
    exclude: ['vue-meteor-tracker'],
    esbuildOptions: {
      target: 'esnext',
      supported: {
        bigint: true,
      },
    },
  },
  build: {
    target: 'esnext',
  },
  esbuild: {
    target: 'esnext',
  },
})
// Force config reload updated

