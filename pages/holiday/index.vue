<script setup>
import { ref, onMounted, computed, watch } from "vue";
import { useUserStore } from "@/store/user";
import UiParentCard from "@/components/shared/UiParentCard.vue";
import UiTableCard from "@/components/shared/UiTableCard.vue";
import { useRuntimeConfig } from "#app";

const config = useRuntimeConfig();
const userStore = useUserStore();
const holidays = ref([]);
const totalCount = ref(0);
const loading = ref(false);
const errorMessage = ref("");
const successMessage = ref("");
const dialogStatus = ref(false);
const searchTerm = ref("");
const sortBy = ref("date"); // Default sort by date

// Holiday form data
const newHoliday = ref({
  name: "",
  date: "",
  toDate: "",
  description: "",
});

const isEditing = ref(false);
const editingHolidayId = ref(null);

// Delete confirmation
const deleteDialog = ref(false);
const holidayToDelete = ref(null);

// Search filters
const searchByInfo = ref({
  name: "",
  date: "",
  toDate: "",
  description: "",
  isUpcoming: "",
  isPast: "",
});

// Computed property for sorted holidays
const sortedHolidays = computed(() => {
  if (!holidays.value.length) return [];
  
  const sorted = [...holidays.value];
  const [field, direction] = sortBy.value.startsWith('-') 
    ? [sortBy.value.slice(1), 'desc'] 
    : [sortBy.value, 'asc'];
  
  sorted.sort((a, b) => {
    let aVal, bVal;
    
    switch (field) {
      case 'name':
        aVal = a.name?.toLowerCase() || '';
        bVal = b.name?.toLowerCase() || '';
        break;
      case 'date':
        aVal = new Date(a.date);
        bVal = new Date(b.date);
        break;
      case 'toDate':
        aVal = new Date(a.toDate);
        bVal = new Date(b.toDate);
        break;
      case 'status':
        aVal = a.isUpcoming ? 2 : a.isPast ? 0 : 1;
        bVal = b.isUpcoming ? 2 : b.isPast ? 0 : 1;
        break;
      case 'remainingDays':
        aVal = a.remainingDays || 0;
        bVal = b.remainingDays || 0;
        break;
      default:
        aVal = a[field];
        bVal = b[field];
    }
    
    if (direction === 'asc') {
      return aVal > bVal ? 1 : aVal < bVal ? -1 : 0;
    } else {
      return aVal < bVal ? 1 : aVal > bVal ? -1 : 0;
    }
  });
  
  return sorted;
});

watch(
  searchByInfo,
  () => {
    fetchHolidays();
  },
  { deep: true }
);

watch([errorMessage, successMessage], () => {
  if (errorMessage.value || successMessage.value) {
    setTimeout(() => {
      errorMessage.value = null;
      successMessage.value = null;
    }, 4000);
  }
});

const fetchHolidays = async () => {
  loading.value = true;
  try {
    const queryParams = new URLSearchParams();

    // Add search filters
    if (searchByInfo.value.name) queryParams.append('Name', searchByInfo.value.name);
    if (searchByInfo.value.date) queryParams.append('Date', searchByInfo.value.date);
    if (searchByInfo.value.toDate) queryParams.append('ToDate', searchByInfo.value.toDate);
    if (searchByInfo.value.description) queryParams.append('Description', searchByInfo.value.description);
    if (searchByInfo.value.isUpcoming !== "") queryParams.append('IsUpcoming', searchByInfo.value.isUpcoming);
    if (searchByInfo.value.isPast !== "") queryParams.append('IsPast', searchByInfo.value.isPast);
    
    // Add current year
    const currentYear = new Date().getFullYear();
    queryParams.append('year', currentYear.toString());

    const response = await fetch(
      `${config.public.apiUrl}/Holiday/GetAllThisYear?${queryParams.toString()}`,
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${userStore.token}`,
        },
      }
    );
    const data = await response.json();
    if (!data.error) {
      console.log(data.data);
      holidays.value = data.data;
      totalCount.value = data.data.length;
    } else {
      errorMessage.value = data.message || "Failed to fetch holidays";
    }
  } catch (error) {
    errorMessage.value = "Failed to fetch holidays";
    console.error("Error fetching holidays:", error);
  } finally {
    loading.value = false;
  }
};

const createHoliday = async () => {
  loading.value = true;
  try {
    const response = await fetch(`${config.public.apiUrl}/Holiday`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${userStore.token}`,
      },
      body: JSON.stringify(newHoliday.value),
    });
    const data = await response.json();
    if (!data.error) {
      successMessage.value = "Holiday created successfully";
      resetForm();
      fetchHolidays();
    } else {
      errorMessage.value = data.message || "Failed to create holiday";
    }
  } catch (error) {
    errorMessage.value = "Failed to create holiday";
    console.error("Error creating holiday:", error);
  } finally {
    loading.value = false;
  }
};

const updateHoliday = async () => {
  loading.value = true;
  try {
    const response = await fetch(`${config.public.apiUrl}/Holiday/${editingHolidayId.value}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${userStore.token}`,
      },
      body: JSON.stringify(newHoliday.value),
    });
    const data = await response.json();
    if (!data.error) {
      successMessage.value = "Holiday updated successfully";
      resetForm();
      fetchHolidays();
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
  loading.value = true;
  try {
    const response = await fetch(`${config.public.apiUrl}/Holiday/${holidayToDelete.value.id}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${userStore.token}`,
      },
    });
    const data = await response.json();
    if (!data.error) {
      successMessage.value = "Holiday deleted successfully";
      deleteDialog.value = false;
      holidayToDelete.value = null;
      fetchHolidays();
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

const editHoliday = (holiday) => {
  isEditing.value = true;
  editingHolidayId.value = holiday.id;
  newHoliday.value = {
    name: holiday.name,
    date: holiday.date.split('T')[0], // Convert to date format
    toDate: holiday.toDate.split('T')[0], // Convert to date format
    description: holiday.description,
  };
};

const confirmDelete = (holiday) => {
  holidayToDelete.value = holiday;
  deleteDialog.value = true;
};

const resetForm = () => {
  newHoliday.value = {
    name: "",
    date: "",
    toDate: "",
    description: "",
  };
  isEditing.value = false;
  editingHolidayId.value = null;
};

const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
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
  fetchHolidays();
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
        <UiParentCard title="Holiday Management">
          <v-container>
            <!-- Search and Filter Section -->
            <v-row>
              <v-col cols="12" md="3">
                <v-text-field
                  v-model="searchByInfo.name"
                  label="Search by Name"
                  clearable
                  prepend-inner-icon="mdi-magnify"
                />
              </v-col>
              <v-col cols="12" md="2">
                <v-text-field
                  v-model="searchByInfo.date"
                  label="From Date"
                  type="date"
                  clearable
                />
              </v-col>
              <v-col cols="12" md="2">
                <v-text-field
                  v-model="searchByInfo.toDate"
                  label="To Date"
                  type="date"
                  clearable
                />
              </v-col>
              <v-col cols="12" md="2">
                <v-select
                  v-model="searchByInfo.isUpcoming"
                  label="Status"
                  :items="[
                    { title: 'All', value: '' },
                    { title: 'Upcoming', value: 'true' },
                    { title: 'Past', value: 'false' }
                  ]"
                  item-title="title"
                  item-value="value"
                  clearable
                />
              </v-col>
              <v-col cols="12" md="3" class="d-flex align-center">
                <v-btn
                  color="primary"
                  @click="fetchHolidays"
                  :loading="loading"
                  prepend-icon="mdi-refresh"
                >
                  Refresh
                </v-btn>
                <v-btn
                  color="secondary"
                  @click="$router.push('/holiday/calendar')"
                  prepend-icon="mdi-calendar"
                  class="ml-2"
                >
                  Calendar View
                </v-btn>
              </v-col>
            </v-row>

            <!-- Add/Edit Holiday Form - Only for Super Admin, HR and CEO -->
            <v-row v-if="userStore.user.role === 1 || userStore.user.role === 4 || userStore.user.role === 5" class="mt-4">
              <v-col cols="12">
                <UiParentCard :title="isEditing ? 'Edit Holiday' : 'Add New Holiday'">
                  <v-card-text>
                    <v-row>
                      <v-col cols="12" md="4">
                        <v-text-field
                          v-model="newHoliday.name"
                          label="Holiday Name"
                          required
                        />
                      </v-col>
                      <v-col cols="12" md="4">
                        <v-text-field
                          v-model="newHoliday.date"
                          label="From Date"
                          type="date"
                          required
                        />
                      </v-col>
                      <v-col cols="12" md="4">
                        <v-text-field
                          v-model="newHoliday.toDate"
                          label="To Date"
                          type="date"
                          required
                        />
                      </v-col>
                      <v-col cols="12" md="4">
                        <v-textarea
                          v-model="newHoliday.description"
                          label="Description"
                          rows="1"
                          auto-grow
                        />
                      </v-col>
                    </v-row>
                    <v-row>
                      <v-col cols="12" class="d-flex gap-2">
                        <v-btn
                          color="primary"
                          @click="isEditing ? updateHoliday() : createHoliday()"
                          :loading="loading"
                          :disabled="!newHoliday.name || !newHoliday.date || !newHoliday.toDate"
                        >
                          {{ isEditing ? 'Update' : 'Create' }} Holiday
                        </v-btn>
                        <v-btn
                          variant="outlined"
                          @click="resetForm"
                          :disabled="loading"
                        >
                          Cancel
                        </v-btn>
                      </v-col>
                    </v-row>
                  </v-card-text>
                </UiParentCard>
              </v-col>
            </v-row>

            <!-- Holidays Table -->
            <v-row class="mt-4">
              <v-col cols="12">
                <v-table density="compact">
                  <thead>
                    <tr>
                      <th class="text-left">
                        <v-btn
                          variant="text"
                          @click="sortBy = sortBy === 'name' ? '-name' : 'name'"
                          class="text-none"
                        >
                          Name
                          <v-icon v-if="sortBy === 'name'" size="small">mdi-arrow-up</v-icon>
                          <v-icon v-else-if="sortBy === '-name'" size="small">mdi-arrow-down</v-icon>
                        </v-btn>
                      </th>
                      <th class="text-left">
                        <v-btn
                          variant="text"
                          @click="sortBy = sortBy === 'date' ? '-date' : 'date'"
                          class="text-none"
                        >
                          From Date
                          <v-icon v-if="sortBy === 'date'" size="small">mdi-arrow-up</v-icon>
                          <v-icon v-else-if="sortBy === '-date'" size="small">mdi-arrow-down</v-icon>
                        </v-btn>
                      </th>
                      <th class="text-left">
                        <v-btn
                          variant="text"
                          @click="sortBy = sortBy === 'toDate' ? '-toDate' : 'toDate'"
                          class="text-none"
                        >
                          To Date
                          <v-icon v-if="sortBy === 'toDate'" size="small">mdi-arrow-up</v-icon>
                          <v-icon v-else-if="sortBy === '-toDate'" size="small">mdi-arrow-down</v-icon>
                        </v-btn>
                      </th>
                      <th class="text-left">Description</th>
                      <th class="text-left">
                        <v-btn
                          variant="text"
                          @click="sortBy = sortBy === 'status' ? '-status' : 'status'"
                          class="text-none"
                        >
                          Status
                          <v-icon v-if="sortBy === 'status'" size="small">mdi-arrow-up</v-icon>
                          <v-icon v-else-if="sortBy === '-status'" size="small">mdi-arrow-down</v-icon>
                        </v-btn>
                      </th>
                      <th class="text-left">
                        <v-btn
                          variant="text"
                          @click="sortBy = sortBy === 'remainingDays' ? '-remainingDays' : 'remainingDays'"
                          class="text-none"
                        >
                          Remaining Days
                          <v-icon v-if="sortBy === 'remainingDays'" size="small">mdi-arrow-up</v-icon>
                          <v-icon v-else-if="sortBy === '-remainingDays'" size="small">mdi-arrow-down</v-icon>
                        </v-btn>
                      </th>
                      <th class="text-left">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-if="loading">
                      <td colspan="7" class="text-center pa-4">
                        <v-progress-circular indeterminate color="primary" />
                      </td>
                    </tr>
                    <tr v-else-if="holidays.length === 0">
                      <td colspan="7" class="text-center pa-4">
                        <v-icon size="48" color="grey">mdi-calendar-remove</v-icon>
                        <p class="text-body-1 mt-2">No holidays found</p>
                      </td>
                    </tr>
                    <tr v-else v-for="holiday in sortedHolidays" :key="holiday.id" class="hover:bg-gray-100">
                      <td>{{ holiday.name }}</td>
                      <td>{{ formatDate(holiday.date) }}</td>
                      <td>{{ formatDate(holiday.toDate) }}</td>
                      <td>{{ holiday.description || 'No description' }}</td>
                      <td>
                        <v-chip
                          :color="getStatusColor(holiday)"
                          size="small"
                          variant="tonal"
                        >
                          {{ getStatusText(holiday) }}
                        </v-chip>
                      </td>
                      <td>
                        <v-chip
                          :color="holiday.remainingDays > 0 ? 'success' : 'grey'"
                          size="small"
                          variant="tonal"
                        >
                          {{ holiday.remainingDays }} days
                        </v-chip>
                      </td>
                      <td>
                        <v-btn
                          icon="mdi-open-in-new"
                          size="default"
                          variant="elevated"
                          color="success"
                          @click="$router.push(`/holiday/${holiday.id}`)"
                          class="ma-2"
                        />
                        <v-btn
                          v-if="userStore.user.role === 1 || userStore.user.role === 4 || userStore.user.role === 5"
                          icon="mdi-pencil"
                          size="default"
                          variant="elevated"
                          color="primary"
                          @click="editHoliday(holiday)"
                          class="ma-2"
                        />
                        <v-btn
                          v-if="userStore.user.role === 1 || userStore.user.role === 4 || userStore.user.role === 5"
                          icon="mdi-delete"
                          size="default"
                          variant="elevated"
                          color="error"
                          @click="confirmDelete(holiday)"
                          class="ma-2"
                        />
                      </td>
                    </tr>
                  </tbody>
                </v-table>
              </v-col>
            </v-row>
          </v-container>
        </UiParentCard>
      </v-col>
    </v-row>

    <!-- Delete Confirmation Dialog -->
    <v-dialog v-model="deleteDialog" max-width="400">
      <UiParentCard title="Confirm Deletion">
        <v-card-text>Are you sure you want to delete the holiday "{{ holidayToDelete?.name }}"? This action cannot be undone.</v-card-text>
        <v-card-actions>
          <v-btn color="primary" text @click="deleteDialog = false">Cancel</v-btn>
          <v-btn color="red" text @click="deleteHoliday" :loading="loading">Delete</v-btn>
        </v-card-actions>
      </UiParentCard>
    </v-dialog>
  </div>
</template>

<style scoped>
.gap-2 {
  gap: 8px;
}
</style> 