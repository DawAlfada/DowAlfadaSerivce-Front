<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useUserStore } from '../../store/user';
import { useRuntimeConfig } from '#app';

const config = useRuntimeConfig();
const email = ref('');
const password = ref('');
const checkbox = ref(true);
const loading = ref(false); 
const errorMessage = ref(''); 
const router = useRouter();
const userStore = useUserStore();

const login = async () => {
  errorMessage.value = '';
  if (!email.value || !password.value) {
    errorMessage.value = 'Email and password are required';
    return;
  }
  loading.value = true;

  try {
    const response = await fetch(`${config.public.apiUrl}/Auth/Login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: email.value,
        password: password.value
      })
    });

    if (!response.ok) {
      throw new Error('Login failed');
    }

    const data = await response.json();
    userStore.setUser(data);
    userStore.isLoggedIn = true;  
    console.log(data); 
    console.log(data.role); 
    if(data.role === 1 || data.role === 4 || data.role === 5){
      router.push('/dashboards');
    } else {
      router.push('/dashboards/employeeDashboard');
    }
   
  } catch (error) {
    errorMessage.value = 'Login failed. Please check your credentials.';
  } finally {
    loading.value = false; 
  }
};
</script>

<template>
  <v-row class="d-flex mb-3">
    <v-col cols="12">
      <v-label class="font-weight-bold mb-1">Email</v-label>
      <v-text-field
        v-model="email"
        variant="outlined"
        hide-details
    

      ></v-text-field>
    </v-col>
    <v-col cols="12">
      <v-label class="font-weight-bold mb-1">Password</v-label>
      <v-text-field
        v-model="password"
        variant="outlined"
        type="password"
        hide-details
      ></v-text-field>
    </v-col>
    <v-col cols="12" class="pt-0">
      <div class="d-flex flex-wrap align-center ml-n2">
        <v-checkbox v-model="checkbox" color="primary" hide-details>
          <template v-slot:label class="text-body-1">Remember this Device</template>
        </v-checkbox>
        <div class="ml-sm-auto">
          <!-- <NuxtLink to="/" class="text-primary text-decoration-none text-body-1 opacity-1 font-weight-medium">
            Forgot Password?
          </NuxtLink> -->
        </div>
      </div>
    </v-col>
    <v-col cols="12" v-if="errorMessage" class="text-danger font-weight-bold mb-3 errormessage">
      {{ errorMessage }}
    </v-col>

    <v-col cols="12" class="pt-0">
      <v-btn @click="login" :loading="loading" color="primary" size="large" block flat>
        Sign in
      </v-btn>
    </v-col>
  </v-row>
</template>
