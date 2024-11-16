<script setup>
import { ref, onMounted, computed, watch } from "vue";
import { useUserStore } from "@/store/user";
import UiParentCard from "@/components/shared/UiParentCard.vue";
import { useRuntimeConfig } from '#app';


definePageMeta({
  requiresAdmin: true, 
  title: "Feedbacks",
});


const config = useRuntimeConfig();
import {
  VProgressCircular,
  VDialog,
  VTextField,
  VBtn,
  VCardActions,
  VCard,
  VCardText,
  VPagination,
} from "vuetify/components"; // Ensure required components are imported

const userStore = useUserStore();

const totalCount = ref(0);
const loading = ref(false);
const errorMessage = ref(null);
const successMessage = ref(null);

const currentPage = ref(1);
const pageSize = ref(10);
const totalPages = computed(() => Math.ceil(totalCount.value / pageSize.value));

watch(currentPage, () => {
  fetchFeedbacks();
});

const feedbackSearchInfo = ref({
  feedbackText: "",
});

onMounted(() => {
  fetchFeedbacks();
});

const feedbacks = ref([]);
const fetchFeedbacks = async () => {
  loading.value = true; // Add loading state
  try {
    const response = await fetch(
      `${config.public.apiUrl}/Feedback?Page=${currentPage.value}&PageSize=${pageSize.value}&Name=${feedbackSearchInfo.value.feedbackText}`,
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${userStore.token}`, // Use token from the store
        },
      }
    );
    const data = await response.json();
    if (!data.error) {
      feedbacks.value = data.data.items;
      totalCount.value = data.data.totalCount;
    }
  } catch (error) {
    errorMessage.value = "Failed to fetch feedbacks";
  } finally {
    loading.value = false;
  }
};

const filteredFeedbacks = computed(() => {
  return feedbacks.value.filter((feedback) =>
    feedback.feedbackText
      .toLowerCase()
      .includes(feedbackSearchInfo.value.feedbackText.toLowerCase())
  );
});

</script>

<template>
  <v-row>
    <v-col cols="12" md="12">
      <UiParentCard title="Manage Feedbacks" :subtitle="totalCount">
       
        <v-alert v-if="errorMessage" type="error" dismissible>{{ errorMessage }}</v-alert>
        <v-alert v-if="successMessage" type="success" dismissible>{{ successMessage }}</v-alert>

        <v-container>
          <v-row class="mb-4">
            <v-col cols="12" sm="6" md="4">
              <v-text-field
                v-model="feedbackSearchInfo.feedbackText"
                label="Search by Feedback Name"
                @input="fetchFeedbacks"
              ></v-text-field>
            </v-col>
          </v-row>

          <v-progress-circular
            v-if="loading"
            indeterminate
            color="primary"
            class="d-flex justify-center my-4"
          ></v-progress-circular>

          <div class="feedbacks-cards">
            <v-card
              v-for="item in filteredFeedbacks"
              :key="item.id"
              class="feedbacks-card"
            >
              <v-card-text>
                <div class="feedbacks-info">
                  <h3 class="feedback-title"><bdi>{{ item.feedbackText }}</bdi></h3>
                  <p class="feedback-date">
                    <strong>Created At:</strong>
                    {{ item.createdAt.toString().split("T")[0] }}
                  </p>
                </div>
              </v-card-text>
            </v-card>
          </div>

          <v-pagination
            v-model="currentPage"
            :length="totalPages"
            @input="fetchFeedbacks"
            class="mt-4"
          ></v-pagination>
        </v-container>
      </UiParentCard>
    </v-col>
  </v-row>
</template>

<style scoped>
.feedbacks-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1.5rem;
  padding: 1rem;
}

.feedbacks-card {
  border: 2px solid #41CEE2;
  border-radius: 12px;
  background-color: #ffffff;
  box-shadow: 0px 6px 12px rgba(0, 0, 0, 0.15);
  transition: transform 0.3s, box-shadow 0.3s;
}

.feedbacks-card:hover {
  transform: translateY(-7px);
  box-shadow: 0px 12px 18px rgba(0, 0, 0, 0.25);
}

.feedbacks-info {
  padding: 1rem;
}

.feedback-title {
    margin-bottom: 13px;
  font-size: 1.2rem;
  font-weight: bold;
  color: #333;
}

.feedback-date {
  font-size: 0.9rem;
  color: #666;
}
</style>
