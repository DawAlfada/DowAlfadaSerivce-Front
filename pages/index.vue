<script setup>
import { useUserStore } from "@/store/user";
// import router from "@/router";

import { useRouter } from 'vue-router';

const userStore = useUserStore();
const router = useRouter();
if (userStore.isLoggedIn) {
    if (userStore.user.role === 1 || userStore.user.role === 4 || userStore.user.role != 5){
        router.push("/dashboards");
    }else{
        router.push("/dashboards/employeeDashboard");
    }

}

definePageMeta({
  layout: "blank",
});

import { 
  VApp,
  VMain,
  VContainer,
  VRow,
  VCol,
  VBtn,
  VCard,
  VCardTitle,
  VCardText,
  VDivider
} from 'vuetify/components'

</script>

<template>
  <VApp>
    <VMain>
      <VContainer>
        <VRow justify="center">
          <VCol cols="12" sm="8" md="6">
            <VCard class="mt-12 pa-6">
              <VCardTitle class="text-h4 font-weight-bold mb-4">
                Welcome to Daw Alfada App
              </VCardTitle>
              <VCardText>
                <p class="text-body-1 text-muted">
                    Daw Alfada was founded in 2015 with the goal of serving the information and communication technology (ICT) market in Iraq. Daw Alfada’s management and employees have vast experience and understanding in the fields of network engineering, communication, information technology and project management
                </p>
                <!-- login -->
                <VBtn
                  color="primary"
                  class="mt-6"
                  @click="router.push('auth/login')"
                >

                  Login
                </VBtn>
              </VCardText>
            </VCard>
          </VCol>
        </VRow>
        <VDivider class="my-12" />
      </VContainer>
    </VMain>
  </VApp>
</template>