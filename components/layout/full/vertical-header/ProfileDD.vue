<script setup lang="ts">
import { UserIcon } from 'vue-tabler-icons';
import { useUserStore } from "@/store/user";
import { useRouter } from 'vue-router';

const router = useRouter();
const userStore = useUserStore();

// Get reactive properties from the store
const displayName = userStore.displayName;
const userPhoto = userStore.userPhoto;

// Handle image load error by setting a fallback source
const handleImageError = (e: Event) => {
    (e.target as HTMLImageElement).src = `data:image/jpeg;base64,${userPhoto}`;
};

const Logout = () => {
  userStore.clearUser();
  router.push('/auth/login');
};
</script>

<template>
  <v-menu :close-on-content-click="false">
    <template v-slot:activator="{ props }">
      <v-btn class="profileBtn custom-hover-primary" variant="text" v-bind="props" icon>
        <v-avatar size="35">
          <img 
            :src="userPhoto ? `data:image/svg+xml;base64,${userPhoto}` : 'fallback-image-url.jpg'"
            @error="handleImageError"
            width="35"
            height="35" 
            alt="user" 
          />
        </v-avatar>
      </v-btn>
    </template>
    <v-sheet rounded="md" width="200" elevation="10" class="mt-2">
      <v-list class="py-0" lines="one" density="compact">
        <v-list-item value="item1" active-color="primary" to="/profile">
          <template v-slot:prepend>
            <UserIcon stroke-width="1.5" size="20" />
          </template>
          <v-list-item-title class="pl-4 text-body-1">
            {{ displayName || 'My Profile' }}
          </v-list-item-title>
        </v-list-item>
      </v-list>
      <div class="pt-4 pb-4 px-5 text-center">
        <v-btn @click="Logout" color="primary" variant="outlined" block>Logout</v-btn>
      </div>
    </v-sheet>
  </v-menu>
</template>