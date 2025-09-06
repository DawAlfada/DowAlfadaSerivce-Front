<script setup>
import { ref, onMounted, computed, watch } from "vue";
import { useUserStore } from "@/store/user"; // Import the store
import UiParentCard from "@/components/shared/UiParentCard.vue";
import { useRuntimeConfig } from '#app';

const config = useRuntimeConfig();
const userStore = useUserStore();

// definePageMeta({
//   requiresAdmin: true, 
//   title: "Evaluation workTypes",
// });


const workTypes = ref([]);
const totalCount = ref(0);
const loading = ref(false);
const errorMessage = ref(false);
const successMessage = ref(false);

const model = ref(new Date().toISOString().substr(0, 10));

const currentPage = ref(1);
const pageSize = ref(10);
const totalPages = computed(() => Math.ceil(totalCount.value / pageSize.value));
watch(currentPage, () => {
  fetchWorkTypes();
});

const searchTerm = ref("");

const newWorkType = ref({
  name: "",
  workHoursInWeek: "",
  workHoursInYear: "",
  monthlyIncreaseHours: "",
});

// لم يعد هناك حساب تلقائي لساعات الأسبوع

const isEditing = ref(false);
const editingWorkTypeId = ref(null);

const deleteDialog = ref(false);
const workTypeToDelete = ref(null);

const fetchWorkTypes = async () => {
  loading.value = true;
  try {
    const response = await fetch(
      `${config.public.apiUrl}/WorkType?Page=${currentPage.value}&PageSize=${pageSize.value}&Name=${searchTerm.value}`,
      {
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${userStore.token}`, // Use the token from the store
        },
      }
    );
    const data = await response.json();
    if (!data.error) {
      workTypes.value = data.data.items;
      totalCount.value = data.data.totalCount;
    }
  } catch (error) {
    errorMessage.value = "Failed to fetch workTypes";
  } finally {
    loading.value = false;
  }
};

const filteredWorkTypes = computed(() => {
  return workTypes.value.filter((workType) =>
    workType.name.toLowerCase().includes(searchTerm.value.toLowerCase())
  );
});

const submitworkType = async () => {
   errorMessage.value = ""; 
   successMessage.value = "";

  if (!newWorkType.value.name) {
    errorMessage.value = "Please fill in Work Type Name field";
    return;
  }
  if (!newWorkType.value.workHoursInWeek) {
    errorMessage.value = "Please fill in Work Hours In Week field";
    return;
  }
  if (!newWorkType.value.workHoursInYear) {
    errorMessage.value = "Please fill in Work Hours In Year field";
    return;
  }
  if (!newWorkType.value.monthlyIncreaseHours) {
    errorMessage.value = "Please fill in Monthly Increase Hours field";
    return;
  }

  loading.value = true;
  try {
    const url = isEditing.value
      ? `${config.public.apiUrl}/WorkType/${editingWorkTypeId.value}`
      : `${config.public.apiUrl}/WorkType`;

    const method = isEditing.value ? "PUT" : "POST";
    const response = await fetch(url, {
      method,
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${userStore.token}`, // Use the token for authorization
      },
      body: JSON.stringify(newWorkType.value),
    });

    const data = await response.json();
    if (!data.error) {
      successMessage.value = data.message;
      resetForm();
      fetchWorkTypes();
    } else {
      throw new Error(data.message);
    }
  } catch (error) {
    errorMessage.value = error.message || "Failed to submit workType";
  } finally {
    loading.value = false;
  }
};

const confirmdeleteWorkType = (workType) => {
  workTypeToDelete.value = workType;
  deleteDialog.value = true;
};

const deleteWorkType = async () => {
  loading.value = true;
  deleteDialog.value = false;
  try {
    const response = await fetch(
      `${config.public.apiUrl}/WorkType/${workTypeToDelete.value.id}`,
      {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${userStore.token}`, // Use the token here as well
        },
      }
    );
    const data = await response.json();
    if (!data.error) {
      successMessage.value = data.message;
      fetchWorkTypes();
    } else {
      throw new Error(data.message);
    }
  } catch (error) {
    errorMessage.value = error.message || "Failed to delete workType";
  } finally {
    loading.value = false;
  }
};

const resetForm = () => {
  newWorkType.value = {
    name: "",
    workHoursInWeek: "",
    workHoursInYear: "",
    monthlyIncreaseHours: "",
  };
  isEditing.value = false;
  editingWorkTypeId.value = null;
};

onMounted(() => {
    fetchWorkTypes();
});
</script>

<template>
  <v-row>
    <v-col cols="12" md="12">
      <UiParentCard title="Manage Work Types">
        <v-alert v-if="errorMessage" type="error" dismissible>{{
          errorMessage
        }}</v-alert>
        <v-alert v-if="successMessage" type="success" dismissible>{{
          successMessage
        }}</v-alert>

<v-form @submit.prevent="submitworkType">
      <v-container class="mb-6">
        <v-row>
          <v-col cols="12" sm="6" md="3">
            <v-text-field
              v-model="newWorkType.name"
              label="Work Type Name"
              required
            ></v-text-field>
          </v-col>
          <v-col cols="12" sm="6" md="3">
            <v-text-field
              v-model="newWorkType.workHoursInWeek"
              type="text"
              label="Work Hours In Week (TimeSpan)"
              placeholder="مثال: 08:00:00"
              required
            ></v-text-field>
          </v-col>
          <v-col cols="12" sm="6" md="3">
            <v-text-field
              v-model="newWorkType.workHoursInYear"
              type="text"
              label="Work Hours In Year (TimeSpan)"
              placeholder="مثال: 2080:00:00"
              required
            ></v-text-field>
          </v-col>
          <v-col cols="12" sm="6" md="3">
            <v-text-field
              v-model="newWorkType.monthlyIncreaseHours"
              type="text"
              label="Monthly Increase Hours (TimeSpan)"
              placeholder="مثال: 02:00:00"
              required
            ></v-text-field>
          </v-col>
        </v-row>
        <v-btn
          :loading="loading"
          type="submit"
          color="primary"
          class="mr-2"
        >
          {{ isEditing ? "Update Work Type" : "Create Work Type" }}
        </v-btn>
        <v-btn @click="resetForm" color="secondary" :disabled="loading"
          >Cancel</v-btn>
      </v-container>
    </v-form>
    <v-container>
      <v-row class="mb-4">
        <v-col cols="12" sm="6" md="4">
          <v-text-field
            v-model="searchTerm"
            label="Search by workType Name"
            @input="fetchworkTypes"
          ></v-text-field>
        </v-col>
      </v-row>

      <v-table density="compact">
        <thead>
          <tr>
            <th class="text-left">Name</th>
            <th class="text-left">Work Hours In Week</th>
            <th class="text-left">Work Hours In Year</th>
            <th class="text-left">Monthly Increase Hours</th>
            <th class="text-left">Insert Date</th>
            <th class="text-left">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in filteredWorkTypes" :key="item.id">
            <td>{{ item.name }}</td>
            <td>{{ item.workHoursInWeek }}</td>
            <td>{{ item.workHoursInYear }}</td>
            <td>{{ item.monthlyIncreaseHours }}</td>
            <td>{{ item.createdAt?.toString().split("T")[0] }}</td>
            <td>
              <v-btn
                icon="mdi-open-in-new"
                size="default"
                variant="elevated"
                color="success"
                @click="
                  isEditing = true;
                  editingWorkTypeId = item.id;
                  newWorkType = { ...item };
                "
                class="ma-2"
              />
              <v-btn
                icon="mdi-delete"
                size="default"
                variant="elevated"
                color="error"
                @click="confirmdeleteWorkType(item)"
                class="ma-2"
              />
            </td>
          </tr>
        </tbody>
      </v-table>
      <v-pagination
        v-model="currentPage"
        :length="totalPages"
        @input="fetchworkTypes"
        class="mt-4"
      ></v-pagination>
    </v-container>
  </UiParentCard>
</v-col>
  </v-row>

  <v-dialog v-model="deleteDialog" max-width="400">
    <v-card>
      <v-card-title class="headline">Confirm Deletion</v-card-title>
      <v-card-text>Are you sure you want to delete this workType?</v-card-text>
      <v-card-actions>
        <v-btn color="primary" text @click="deleteDialog = false">Cancel</v-btn>
        <v-btn color="red" text @click="deleteWorkType">Delete</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>