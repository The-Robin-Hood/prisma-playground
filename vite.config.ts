import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('@uiw/react-codemirror')) {
            return 'codemirror';
          }
          if (id.includes('@uiw/codemirror-theme-github')) {
            return 'codemirror-theme';
          }
          if (id.includes('@codemirror')) {
            return 'codemirror-addons';
          }
        }
      }
    }
  }
})
