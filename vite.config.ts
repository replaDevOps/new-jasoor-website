import { defineConfig } from 'vite'
import path from 'path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [
    // The React and Tailwind plugins are both required for Make, even if
    // Tailwind is not being actively used – do not remove them
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      // Alias @ to the src directory
      '@': path.resolve(__dirname, './src'),
    },
  },

  // File types to support raw imports. Never add .css, .tsx, or .ts files to this.
  assetsInclude: ['**/*.svg', '**/*.csv'],

  build: {
    // Raise the warning limit slightly (default 500kb is too noisy after splitting)
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        manualChunks: {
          // Core React runtime — cached aggressively by browser
          'vendor-react': ['react', 'react-dom'],
          // Apollo + GraphQL — large, rarely changes
          'vendor-apollo': ['@apollo/client', 'graphql', 'apollo-link-ws', 'subscriptions-transport-ws'],
          // Radix UI primitives — large UI library, split from app code
          'vendor-radix': [
            '@radix-ui/react-accordion', '@radix-ui/react-alert-dialog',
            '@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu',
            '@radix-ui/react-select', '@radix-ui/react-tabs',
            '@radix-ui/react-tooltip', '@radix-ui/react-popover',
          ],
          // Animation library
          'vendor-motion': ['motion'],
          // Charts/date utilities
          'vendor-utils': ['recharts', 'date-fns', 'react-hook-form'],
        },
      },
    },
  },
})
