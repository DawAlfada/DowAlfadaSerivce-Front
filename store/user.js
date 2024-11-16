// store/user.js
import { defineStore } from 'pinia';
import { ref } from 'vue';

export const useUserStore = defineStore('user', () => {
  const storedUser = JSON.parse(localStorage.getItem('user')) || {};
  const user = ref(storedUser);
  const token = ref(storedUser.token || '');
  const displayName = ref(storedUser.displayName || '');
  const userPhoto = ref(storedUser.image512 || '');
  const userRole = ref(storedUser.role || '');
  const isLoggedIn = ref(!!storedUser.token); 

  const setUser = (userData) => {
    user.value = userData;
    token.value = userData.token;
    displayName.value = userData.displayName;
    userPhoto.value = userData.image512;
    userRole.value = userData.role;
    isLoggedIn.value = true;

    // Store the full user object in localStorage
    localStorage.setItem('user', JSON.stringify(userData));
  };

  const clearUser = () => {
    user.value = null;
    token.value = '';
    displayName.value = '';
    userPhoto.value = '';
    userRole.value = '';

    // Clear user-related data from localStorage
    localStorage.removeItem('user');
  };

  return {
    isLoggedIn,
    userRole,
    user,
    token,
    displayName,
    userPhoto,
    setUser,
    clearUser,
  };
});
