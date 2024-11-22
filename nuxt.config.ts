export default defineNuxtConfig({
  devtools: { enabled: true },
  ssr: false,
  typescript: {
    shim: false,
  },
  build: {
    transpile: ["vuetify"],
  },
  vite: {
    server: {
      hmr: {
        clientPort: 3000, // Replace with the desired port number (default: 3000)
      },
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
