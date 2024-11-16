<script setup lang="ts">
import { ref, shallowRef } from "vue";
import sidebarItems from "@/components/layout/full/vertical-sidebar/sidebarItem";
import { Menu2Icon } from "vue-tabler-icons";
const sidebarMenu = shallowRef(sidebarItems);
const sDrawer = ref(true);
import { useUserStore } from "@/store/user";
const userStore = useUserStore();

// Get the current user's role
const userRole = ref(userStore.user?.role);

// Function to check if the user has permission to view the item
const hasPermission = (roles: number[]) => {
  return roles ? roles.includes(userRole.value) : true; // If no roles are defined, show the item
};
</script>

<template>
  <!------Sidebar-------->
  <v-navigation-drawer
    left
    elevation="0"
    app
    class="leftSidebar"
    v-model="sDrawer"
  >
    <div class="sidebarMenuLogo">
      <img src="../../../assets/images/logo.png" alt="" width="200" />
    </div>

    <div>
      <perfect-scrollbar class="scrollnavbar">
        <v-list class="pa-6">
          <!---Menu Loop -->
          <template v-for="(item, i) in sidebarMenu">
            <!---Item Sub Header -->
            <LayoutFullVerticalSidebarNavGroup
              :item="item"
              :key="item.title"
              v-if="item.header && hasPermission(item.roles)"
            />

            <!---Single Item-->
            <LayoutFullVerticalSidebarNavItem
              :item="item"
              v-else
              class="leftPadding"
              v-if="hasPermission(item.roles)"
            />
          </template>
        </v-list>
      </perfect-scrollbar>
    </div>
  </v-navigation-drawer>

  <!------Header-------->
  <v-app-bar elevation="0" height="70">
    <div class="d-flex align-center justify-space-between w-100">
      <div>
        <v-btn
          class="hidden-lg-and-up ms-md-3 ms-sm-5 ms-3 text-muted"
          @click="sDrawer = !sDrawer"
          icon
          variant="flat"
          size="small"
        >
          <Menu2Icon size="20" stroke-width="1.5" />
        </v-btn>
        <!-- Notification -->
        <LayoutFullVerticalHeaderNotificationDD />
      </div>
      <div>
        <!-- User Profile -->
        <LayoutFullVerticalHeaderProfileDD />
      </div>
    </div>
  </v-app-bar>
</template>
