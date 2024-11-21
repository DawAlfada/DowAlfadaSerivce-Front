export default defineNuxtConfig({
  devtools: { enabled: true },
  ssr: false, // Disable Server-Side Rendering
  typescript: {
    shim: false, // Disable TypeScript shims for better IntelliSense
  },
  build: {
    transpile: ["vuetify"], // Ensure Vuetify is properly transpiled
  },
  // vite: {
  //   define: {
  //     "process.env.DEBUG": true, // Enable debugging during development
  //   },
  // },
  runtimeConfig: {
    public: {
      apiUrl: process.env.VUE_APP_API_URL || 'https://default-url.com/api', // Default API URL
    },
    // Add private runtime variables if needed
  },
  plugins: [
    '~/plugins/pinia.js',
    '~/plugins/sweetalert.js', // SweetAlert plugin for notifications
  ],
  hooks: {
    // Add any necessary Nuxt hooks here
  },
});
