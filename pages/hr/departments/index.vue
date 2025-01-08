<script setup>
import { ref, onMounted, computed, watch } from "vue";
import { useUserStore } from "@/store/user";
import UiParentCard from "@/components/shared/UiParentCard.vue";
import { useRuntimeConfig } from "#app";

// definePageMeta({
//   requiresAdmin: true,
//   title: "Evaluation Report",
// });

const config = useRuntimeConfig();
import {
  VProgressCircular,
  VDialog,
  VTextField,
  VBtn,
  VCardActions,
} from "vuetify/components"; // Import dialog components

const userStore = useUserStore();

const totalCount = ref(0);
const loading = ref(false);
const errorMessage = ref(null);
const successMessage = ref(null);

const currentPage = ref(1);
const pageSize = ref(10);
const totalPages = computed(() => Math.ceil(departmentTotalCount.value / pageSize.value));

const departmentName = ref("");
const departmentId = ref("");

watch(currentPage, (newPage) => {
  console.log("Current Page changed to:", newPage);
  fetchDepartments();
});

const departmentSearchInfo = ref({
  departmentId: "",
  departmentName: "",
});

const newDepartment = ref({
  oodoDepartmentId: "",
  displayName: "",
  name: "",
});

onMounted(() => {
  fetchDepartments();
});

const departments = ref([]);
const fetchDepartments = async () => {
  try {
    const response = await fetch(
      `${config.public.apiUrl}/Department?Page=${currentPage.value}&PageSize=${pageSize.value}&Name=${departmentSearchInfo.value.departmentName}`,
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${userStore.token}`, // Use the token from the store
        },
      }
    );
    const data = await response.json();
    if (!data.error) {
      departments.value = data.data.items;
      departmentTotalCount.value = data.data.totalCount;
    }
  } catch (error) {
    errorMessage.value = "Failed to fetch Departments";
  }
};

const filteredDepartments = computed(() => {
  return departments.value.filter((department) =>
    department.name
      .toLowerCase()
      .includes(departmentSearchInfo.value.departmentName.toLowerCase())
  );
});

// Modal states
const showEmailDialog = ref(false);
const emailTitle = ref("");
const emailMessage = ref("");
const departmentTotalCount = ref(0);


const submitDepartment = async () => {
  loading.value = true;
  errorMessage.value = null;
  successMessage.value = null;

  try {
    const response = await fetch(`${config.public.apiUrl}/Department`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${userStore.token}`,
      },
      body: JSON.stringify(newDepartment.value),
    });

    const data = await response.json().catch(() => null);
    if (response.ok) {
      successMessage.value = "Department created successfully";
      fetchDepartments();
      // reset form
      newDepartment.value = {
        oodoDepartmentId: "",
        displayName: "",
        name: "",
      };
    } else {
      throw new Error(data?.error || "Failed to create Department");
    }
  } catch (error) {
    errorMessage.value = error.message || "Failed to create Department";
  } finally {
    loading.value = false;
  }
};

const openEmailDialog = async (department) => {
  showEmailDialog.value = true;
  departmentName.value = department.name;
  departmentId.value = department.id;
};

const syncdepartments = async () => {
  loading.value = true;
  errorMessage.value = null;
  successMessage.value = "Syncing Departments, this may take a while";
  try {
    const response = await fetch(
      `${config.public.apiUrl}/Odoo/AsynceDepartments`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${userStore.token}`,
        },
      }
    );

    const data = await response.json().catch(() => null);
    if (response.ok) {
      successMessage.value = "departments synced successfully";
      fetchDepartments();
    } else {
      successMessage.value = null;
      throw new Error(data?.error || "Failed to sync Departments");
    }
  } catch (error) {
    successMessage.value = null;
    errorMessage.value = error.message || "Failed to sync Departments";
  } finally {
    loading.value = false;
  }
};

const sendEmail = async () => {
  if (!emailTitle.value || !emailMessage.value) {
    errorMessage.value = "Please fill in email title and message";
    return;
  }

  loading.value = true;
  errorMessage.value = null;
  successMessage.value = null;

  try {
    const response = await fetch(
      `${
        config.public.apiUrl
      }/Employee/SendBulkEmail?title=${encodeURIComponent(
        emailTitle.value
      )}&body=${encodeURIComponent(emailMessage.value)}&departmentId=${
        departmentId.value
      }`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${userStore.token}`,
        },
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      throw new Error(errorData?.error || "Failed to send email");
    }

    successMessage.value = "Email sent successfully";
  } catch (error) {
    errorMessage.value = error.message || "Failed to send email";
  } finally {
    emailMessage.value = "";
    emailTitle.value = "";
    departmentId.value = "";
    loading.value = false;
    showEmailDialog.value = false;
  }
};
</script>

<template>
  <v-row>
    <v-col cols="12" md="12">
      <UiParentCard title="Manage departments" :subtitle="departmentTotalCount">
        <v-alert v-if="errorMessage" type="error" dismissible>{{
          errorMessage
        }}</v-alert>
        <v-alert v-if="successMessage" type="success" dismissible>{{
          successMessage
        }}</v-alert>

        <!-- add new Department form -->

        <v-form @submit.prevent="submitDepartment">
          <v-container class="mb-6">
            <v-row>
              <v-col cols="12" sm="6" md="3">
                <v-text-field
                  v-model="newDepartment.oodoDepartmentId"
                  label="Odoo Department ID"
                  required
                ></v-text-field>
              </v-col>
              <v-col cols="12" sm="6" md="3">
                <v-text-field
                  v-model="newDepartment.displayName"
                  label="Display Name"
                  required
                ></v-text-field>
              </v-col>
              <v-col cols="12" sm="6" md="3">
                <v-text-field
                  v-model="newDepartment.name"
                  label="Department Name"
                  required
                ></v-text-field>
              </v-col>
              <!-- <v-col cols="12" sm="6" md="3">
                <v-text-field
                  v-model="newDepartment.managerId"
                  label="Manager ID"
                  required
                ></v-text-field>
              </v-col> -->
            </v-row>

            <v-row class="mt-4">
              <v-col cols="12">
                <v-btn
                  :loading="loading"
                  type="submit"
                  color="primary"
                  class="mr-2"
                  :disabled="loading"
                >
                  Create Department
                </v-btn>
                <v-btn @click="resetForm" color="secondary" :disabled="loading">
                  Cancel
                </v-btn>
              </v-col>
            </v-row>
          </v-container>
        </v-form>

        <v-container>
          <v-row class="mb-4">
            <v-col
              cols="12"
              sm="12"
              md="12"
              class="d-flex align-center justify-space-between"
            >
              <!-- title -->
              <h2 class="text-h5">Sync Departments</h2>
              <v-btn
                color="primary"
                @click="syncdepartments"
                :loading="loading"
              >
                Sync Departments from Odoo
              </v-btn>
            </v-col>

            <v-col cols="12" sm="6" md="4">
              <v-text-field
                v-model="departmentSearchInfo.departmentName"
                label="Search by department Name"
                @input="fetchdepartments"
              ></v-text-field>
            </v-col>
          </v-row>

          <v-progress-circular
            v-if="loading"
            indeterminate
            color="primary"
            class="d-flex justify-center my-4"
          ></v-progress-circular>

          <div class="department-cards">
  <v-card
    v-for="item in filteredDepartments"
    :key="item.id"
    class="department-card"
    :style="{ borderColor: '#' + (item.departmentColor || 'ccc') }"
    elevation="3"
  >
    <v-card-text>
      <div class="card-header">
        <h3 class="department-title">
          {{ item.name }}
        </h3>
        <span class="department-id">
          ID: {{ item.oodoDepartmentId }}
        </span>
      </div>
      <div class="card-body">
        <p class="department-detail">
          <strong>Display Name:</strong>
          {{ item.displayName === "False" ? "-" : item.name }}
        </p>
        <p class="department-detail">
          <strong>Manager:</strong>
          {{ item.managerEmployee ? item.managerEmployee.name : "-" }}
        </p>
        <p class="department-detail">
          <strong>Created At:</strong>
          {{ item.createdAt.toString().split("T")[0] }}
        </p>
      </div>
    </v-card-text>
    <v-card-actions class="card-footer">
      <v-btn
        color="primary"
        class="action-button"
        @click="openEmailDialog(item)"
      >
        Send Bulk Email
      </v-btn>
    </v-card-actions>
  </v-card>
</div>

          <v-pagination
  v-model="currentPage"
  :length="totalPages"
  class="mt-4"
></v-pagination>
        </v-container>
      </UiParentCard>
    </v-col>
  </v-row>

  <!-- Send Email Modal -->
  <v-dialog v-model="showEmailDialog" max-width="500px">
    <v-card>
      <v-card-title
        >Send Bulk Emails To { {{ departmentName }} } Employees
      </v-card-title>
      <v-card-text>
        <v-text-field label="Email Title" v-model="emailTitle" />
        <v-textarea label="Email Message" v-model="emailMessage" />
      </v-card-text>
      <v-card-actions>
        <v-btn text @click="showEmailDialog = false">Cancel</v-btn>
        <v-btn :loading="loading" color="primary" @click="sendEmail"
          >Send</v-btn
        >
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<style scoped>
.department-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1.5rem;
  padding: 1rem;
}

.department-card {
  border: 2px solid rgb(65 206 226);
  border-radius: 10px;
  background-color: #ffffff;
  box-shadow: 0px 4px 8px rgba(0, 0, 0, 0.1);
  transition: transform 0.3s;
}

.department-card:hover {
  transform: translateY(-5px);
  box-shadow: 0px 8px 12px rgba(0, 0, 0, 0.2);
}

.avatar {
  border-radius: 50%;
  width: 80px;
  height: 80px;
}

.department-info h3 {
  font-size: 1.2rem;
  color: #333;
}

.department-info p {
  font-size: 0.9rem;
  color: #555;
}
</style>
