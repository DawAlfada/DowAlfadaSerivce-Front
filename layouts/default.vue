<script setup lang="ts">

const title = ref("DawAlfadal - Service");
useHead({
  meta: [{ content: title }],
  titleTemplate: (titleChunk) => {
    return titleChunk
      ? `${titleChunk} - DawAlfadal`
      : "DawAlfadal - Service";
  },
});
</script>

<template>
    <v-locale-provider >
        <v-app>
            <LayoutFullMain/>
            <v-main>
                <v-container fluid class="page-wrapper">
                    <div class="maxWidth">
                        <NuxtPage  />
                    </div>
                </v-container>
            </v-main>
        </v-app>
    </v-locale-provider>
</template>
