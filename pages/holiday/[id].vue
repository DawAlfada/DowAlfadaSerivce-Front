<script setup>
import { ref, onMounted } from "vue";
import { useUserStore } from "@/store/user";
import UiParentCard from "@/components/shared/UiParentCard.vue";
import { useRuntimeConfig } from "#app";
import { useRoute, useRouter } from "vue-router";

const config = useRuntimeConfig();
const userStore = useUserStore();
const route = useRoute();
const router = useRouter();

const holiday = ref(null);
const loading = ref(false);
const errorMessage = ref("");
const successMessage = ref("");
const isEditing = ref(false);

const editedHoliday = ref({
  name: "",
  date: "",
  toDate: "",
  description: "",
});

const fetchHoliday = async () => {
  loading.value = true;
  try {
    const response = await fetch(
      `${config.public.apiUrl}/Holiday/${route.params.id}`,
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${userStore.token}`,
        },
      }
    );
    const data = await response.json();
    if (!data.error) {
      holiday.value = data.data;
      editedHoliday.value = {
        name: data.data.name,
        date: data.data.date.split('T')[0],
        toDate: data.data.toDate ? data.data.toDate.split('T')[0] : '',
        description: data.data.description,
      };
    } else {
      errorMessage.value = data.message || "Failed to fetch holiday";
    }
  } catch (error) {
    errorMessage.value = "Failed to fetch holiday";
    console.error("Error fetching holiday:", error);
  } finally {
    loading.value = false;
  }
};

const updateHoliday = async () => {
  loading.value = true;
  try {
    const response = await fetch(`${config.public.apiUrl}/Holiday/${route.params.id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${userStore.token}`,
      },
      body: JSON.stringify(editedHoliday.value),
    });
    const data = await response.json();
    if (!data.error) {
      successMessage.value = "Holiday updated successfully";
      isEditing.value = false;
      fetchHoliday();
    } else {
      errorMessage.value = data.message || "Failed to update holiday";
    }
  } catch (error) {
    errorMessage.value = "Failed to update holiday";
    console.error("Error updating holiday:", error);
  } finally {
    loading.value = false;
  }
};

const deleteHoliday = async () => {
  if (!confirm("Are you sure you want to delete this holiday?")) return;
  
  loading.value = true;
  try {
    const response = await fetch(`${config.public.apiUrl}/Holiday/${route.params.id}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${userStore.token}`,
      },
    });
    const data = await response.json();
    if (!data.error) {
      successMessage.value = "Holiday deleted successfully";
      router.push('/holiday');
    } else {
      errorMessage.value = data.message || "Failed to delete holiday";
    }
  } catch (error) {
    errorMessage.value = "Failed to delete holiday";
    console.error("Error deleting holiday:", error);
  } finally {
    loading.value = false;
  }
};

const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long'
  });
};

const getStatusColor = (holiday) => {
  if (holiday.isUpcoming) return 'success';
  if (holiday.isPast) return 'grey';
  return 'primary';
};

const getStatusText = (holiday) => {
  if (holiday.isUpcoming) return 'Upcoming';
  if (holiday.isPast) return 'Past';
  return 'Today';
};

onMounted(() => {
  fetchHoliday();
});
</script>

<template>
  <div>
    <!-- Alert Messages -->
    <v-alert
      v-if="errorMessage"
      type="error"
      variant="tonal"
      closable
      class="mb-4"
    >
      {{ errorMessage }}
    </v-alert>

    <v-alert
      v-if="successMessage"
      type="success"
      variant="tonal"
      closable
      class="mb-4"
    >
      {{ successMessage }}
    </v-alert>

    <v-row>
      <v-col cols="12">
        <UiParentCard title="Holiday Details">
          <v-container>
            <div v-if="loading" class="d-flex justify-center pa-4">
              <v-progress-circular indeterminate color="primary" />
            </div>

            <div v-else-if="holiday">
              <!-- Holiday Information -->
              <v-row>
                <v-col cols="12">
                  <v-card variant="outlined">
                    <v-card-title class="d-flex justify-space-between align-center">
                      <span class="text-h5">{{ holiday.name }}</span>
                      <div class="d-flex gap-2">
                        <v-btn
                          v-if="!isEditing && (userStore.user.role === 1 || userStore.user.role === 4 || userStore.user.role === 5)"
                          color="primary"
                          @click="isEditing = true"
                          prepend-icon="mdi-pencil"
                        >
                          Edit
                        </v-btn>
                        <v-btn
                          v-if="!isEditing && (userStore.user.role === 1 || userStore.user.role === 4 || userStore.user.role === 5)"
                          color="error"
                          @click="deleteHoliday"
                          prepend-icon="mdi-delete"
                        >
                          Delete
                        </v-btn>
                        <v-btn
                          v-if="isEditing"
                          color="success"
                          @click="updateHoliday"
                          :loading="loading"
                          prepend-icon="mdi-check"
                        >
                          Save
                        </v-btn>
                        <v-btn
                          v-if="isEditing"
                          variant="outlined"
                          @click="isEditing = false"
                          prepend-icon="mdi-close"
                        >
                          Cancel
                        </v-btn>
                      </div>
                    </v-card-title>
                    <v-divider />
                    <v-card-text>
                      <v-row>
                        <v-col cols="12" md="6">
                          <v-list>
                            <v-list-item>
                              <template v-slot:prepend>
                                <v-icon color="primary">mdi-calendar</v-icon>
                              </template>
                              <v-list-item-title>
                                <strong>From Date:</strong>
                              </v-list-item-title>
                              <v-list-item-subtitle v-if="!isEditing">
                                {{ formatDate(holiday.date) }}
                              </v-list-item-subtitle>
                              <template v-slot:append v-if="isEditing">
                                <v-text-field
                                  v-model="editedHoliday.date"
                                  type="date"
                                  style="max-width: 200px"
                                />
                              </template>
                            </v-list-item>

                            <v-list-item>
                              <template v-slot:prepend>
                                <v-icon color="primary">mdi-calendar-end</v-icon>
                              </template>
                              <v-list-item-title>
                                <strong>To Date:</strong>
                              </v-list-item-title>
                              <v-list-item-subtitle v-if="!isEditing">
                                {{ formatDate(holiday.toDate) }}
                              </v-list-item-subtitle>
                              <template v-slot:append v-if="isEditing">
                                <v-text-field
                                  v-model="editedHoliday.toDate"
                                  type="date"
                                  style="max-width: 200px"
                                />
                              </template>
                            </v-list-item>

                            <v-list-item>
                              <template v-slot:prepend>
                                <v-icon color="primary">mdi-information</v-icon>
                              </template>
                              <v-list-item-title>
                                <strong>Description:</strong>
                              </v-list-item-title>
                              <v-list-item-subtitle v-if="!isEditing">
                                {{ holiday.description || 'No description provided' }}
                              </v-list-item-subtitle>
                              <template v-slot:append v-if="isEditing">
                                <v-textarea
                                  v-model="editedHoliday.description"
                                  variant="outlined"
                                  density="compact"
                                  rows="3"
                                  style="max-width: 300px"
                                />
                              </template>
                            </v-list-item>

                            <v-list-item>
                              <template v-slot:prepend>
                                <v-icon color="primary">mdi-flag</v-icon>
                              </template>
                              <v-list-item-title>
                                <strong>Status:</strong>
                              </v-list-item-title>
                              <v-list-item-subtitle>
                                <v-chip
                                  :color="getStatusColor(holiday)"
                                  size="small"
                                  variant="tonal"
                                >
                                  {{ getStatusText(holiday) }}
                                </v-chip>
                              </v-list-item-subtitle>
                            </v-list-item>

                            <v-list-item>
                              <template v-slot:prepend>
                                <v-icon color="primary">mdi-calendar-clock</v-icon>
                              </template>
                              <v-list-item-title>
                                <strong>Remaining Days:</strong>
                              </v-list-item-title>
                              <v-list-item-subtitle>
                                <v-chip
                                  :color="holiday.remainingDays > 0 ? 'success' : 'grey'"
                                  size="small"
                                  variant="tonal"
                                >
                                  {{ holiday.remainingDays }} days
                                </v-chip>
                              </v-list-item-subtitle>
                            </v-list-item>
                          </v-list>
                        </v-col>

                        <v-col cols="12" md="6">
                          <v-card variant="outlined">
                            <v-card-title class="text-h6">Additional Information</v-card-title>
                            <v-card-text>
                              <v-list>
                                <v-list-item>
                                  <template v-slot:prepend>
                                    <v-icon color="grey">mdi-identifier</v-icon>
                                  </template>
                                  <v-list-item-title>
                                    <strong>ID:</strong> {{ holiday.id }}
                                  </v-list-item-title>
                                </v-list-item>

                                <v-list-item>
                                  <template v-slot:prepend>
                                    <v-icon color="grey">mdi-calendar-plus</v-icon>
                                  </template>
                                  <v-list-item-title>
                                    <strong>Created:</strong>
                                  </v-list-item-title>
                                  <v-list-item-subtitle>
                                    {{ formatDate(holiday.createdAt) }}
                                  </v-list-item-subtitle>
                                </v-list-item>

                                <v-list-item v-if="holiday.modifiedAt">
                                  <template v-slot:prepend>
                                    <v-icon color="grey">mdi-calendar-edit</v-icon>
                                  </template>
                                  <v-list-item-title>
                                    <strong>Last Modified:</strong>
                                  </v-list-item-title>
                                  <v-list-item-subtitle>
                                    {{ formatDate(holiday.modifiedAt) }}
                                  </v-list-item-subtitle>
                                </v-list-item>
                              </v-list>
                            </v-card-text>
                          </v-card>
                        </v-col>
                      </v-row>
                    </v-card-text>
                  </v-card>
                </v-col>
              </v-row>

              <!-- Back Button -->
              <v-row class="mt-4">
                <v-col cols="12">
                  <v-btn
                    variant="outlined"
                    @click="router.push('/holiday')"
                    prepend-icon="mdi-arrow-left"
                  >
                    Back to Holidays
                  </v-btn>
                </v-col>
              </v-row>
            </div>

            <div v-else class="text-center pa-4">
              <v-icon size="64" color="grey">mdi-calendar-remove</v-icon>
              <p class="text-h6 mt-4">Holiday not found</p>
              <v-btn
                color="primary"
                @click="router.push('/holiday')"
                class="mt-2"
              >
                Back to Holidays
              </v-btn>
            </div>
          </v-container>
        </UiParentCard>
      </v-col>
    </v-row>
  </div>
</template>

<style scoped>
.gap-2 {
  gap: 8px;
}
</style> 