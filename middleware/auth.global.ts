import { useUserStore } from "@/store/user"; // Import the store

export default defineNuxtRouteMiddleware((to, from) => {
  
    const userStore = useUserStore(); 
      if (!userStore.isLoggedIn && to.name !== 'login') {
      return navigateTo('/auth/login');
    }
      if (to.meta.requiresAdmin && userStore.userRole !== 1 && userStore.userRole !== 4 && userStore.userRole !== 5) {
      return navigateTo('/auth/login');
    }
  });