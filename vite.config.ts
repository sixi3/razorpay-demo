import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // Honour the PORT assigned by the harness/preview tooling when present so
    // the dev server lands on the port that's actually being watched.
    port: process.env.PORT ? Number(process.env.PORT) : undefined,
  },
})
