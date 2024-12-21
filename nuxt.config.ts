export default defineNuxtConfig({
  devtools: { enabled: true },
  ssr: false,
  typescript: {
    shim: false,
  },

  vite: {
    server: {
      hmr: {
        clientPort: 3000, 
      },
    },
  },

  app: {
    baseURL: '/',
    buildAssetsDir: '/_nuxt/',
  },
  
  nitro: {
    preset: 'static',
    output: {
      publicDir: '.output/public'
    }
  },
  
  router: {
    options: {
      hashMode: true 
    },

  },
  runtimeConfig: {
    public: {
      apiUrl: process.env.VUE_APP_API_URL || 'https://default-url.com/api',
    },
  },
  plugins: [
    '~/plugins/pinia.js',
    '~/plugins/sweetalert.js',
  ],
});
