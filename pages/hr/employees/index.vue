<script setup>
import { ref, onMounted, computed, watch } from "vue";
import { useUserStore } from "@/store/user";
import UiParentCard from "@/components/shared/UiParentCard.vue";
import { useRuntimeConfig } from '#app';


definePageMeta({
  requiresAdmin: true, 
  title: "Evaluation Report",
});


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
const showEditInfoDialog = ref(false);
const currentPage = ref(1);
const pageSize = ref(10);
const totalPages = computed(() => Math.ceil(totalCount.value / pageSize.value));

const handleImageError = (event, fallbackImage) => {
  event.target.src = `data:image/jpeg;base64,${fallbackImage}`;
};
watch(currentPage, () => {
  fetchEmployees();
});

const employeeSearchInfo = ref({
  departmentId: "",
  employeeName: "",
});

onMounted(() => {
  fetchEmployees();
  fetchDepartments();
});

const selectedDepartment = (departmentId) => {
  employeeSearchInfo.value.departmentId = departmentId;
  fetchEmployees();
};


// upload employee role



const roles = [
  { name: "Admin", value: 1 },
  { name: "Employee", value: 2 },  
  { name: "Manager", value: 3 },  
  { name: "CEO", value: 4 },  
  { name: "Hr", value: 5 },  
  { name: "It", value: 6 },  
  { name: "Finance", value: 7 },  
];


const GetRoleName = (roleId) => {
  return roles.find((role) => role.value === roleId)?.name || "-";
};


const updateInfo = async () => {
  loading.value = true;
  errorMessage.value = null;
  successMessage.value = null;

  try {
    const response = await fetch(
      `${config.public.apiUrl}/Employee/EditRole?id=${editingEmployee.value.id}&role=${editingEmployee.value.role}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${userStore.token}`,
        },
      }
    );

    const data = await response.json().catch(() => null);
    if (response.ok) {
      successMessage.value = "Role updated successfully";
    } else {
      throw new Error(data?.error || "Failed to update role");
    }
  } catch (error) {
    errorMessage.value = error.message || "Failed to update role";
  } finally {
    showEditInfoDialog.value = false;
    loading.value = false;
  }
};


watch([errorMessage, successMessage], () => {
  if (errorMessage.value || successMessage.value) {
    setTimeout(() => {
      errorMessage.value = null;
      successMessage.value = null;
    }, 4000);
  }
});


const employees = ref([]);
const fetchEmployees = async () => {
  loading.value = true;
  errorMessage.value = null;

  try {
    const response = await fetch(
      `${config.public.apiUrl}/Employee?Page=${currentPage.value}
       &Name=${employeeSearchInfo.value.employeeName}
       &PageSize=${pageSize.value}&DepartmentId=${
        employeeSearchInfo.value.departmentId || ""
      }`,
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${userStore.token}`,
        },
      }
    );

    const data = await response.json();
    if (response.ok) {
      employees.value = data.data.items;
      employeeTotalCount.value = data.data.totalCount;
      totalCount.value = data.data.totalCount;
    } else {
      throw new Error(data.error || "Failed to fetch employees");
    }
  } catch (error) {
    errorMessage.value = error.message || "Failed to fetch employees";
  } finally {
    loading.value = false;
  }
};

const filteredEmployees = computed(() => {
  return employees.value.filter((employee) =>
    employee.name
      .toLowerCase()
      .includes(employeeSearchInfo.value.employeeName.toLowerCase())
  );
});



// Modal states
const showEditDialog = ref(false);
const showEmailDialog = ref(false);
const showDetailsDialog = ref(false);
const editingEmployee = ref(null);
const employeeDetails = ref(null);
const emailTitle = ref("");
const emailMessage = ref("");
const employeeTotalCount = ref(0);


const  syncEmployees = async () => {
  loading.value = true;
  errorMessage.value = null;
 
  // add message to show that the employees are being synced and may take a while
  successMessage.value = "Syncing employees, this may take a while";
  try {
    const response = await fetch(
      `${config.public.apiUrl}/Odoo/AsynceEmployee`,
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
      successMessage.value = "Employees synced successfully";
      fetchEmployees();
    } else {
      successMessage.value = null;
      throw new Error(data?.error || "Failed to sync employees");

    }
  } catch (error) {
    successMessage.value = null;
    errorMessage.value = error.message || "Failed to sync employees";
  } finally {
    loading.value = false;
  }
};



const openEmailDialog = async (employee) => {
  console.log(`Open email dialog for employee: ${employee.name}`);
  showEmailDialog.value = true;
  editingEmployee.value = employee;
};

const showDetails = async (employee) => {
  console.log(`Show details for employee: ${employee.name}`);
  showDetailsDialog.value = true;
  employeeDetails.value = employee;
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
      `${config.public.apiUrl}/Employee/SendEmail?title=${encodeURIComponent(
        emailTitle.value
      )}&body=${encodeURIComponent(emailMessage.value)}&employeeId=${
        editingEmployee.value.id
      }`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${userStore.token}`,
        },
      }
    );

    const data = await response.json().catch(() => null);
    if (response.ok) {
      successMessage.value = "Email sent successfully";
    } else {
      throw new Error(data?.error || "Failed to send email");
    }
  } catch (error) {
    errorMessage.value = error.message || "Failed to send email";
  } finally {
    loading.value = false;
    showEmailDialog.value = false;
  }
};

const updatePassword = async () => {
  loading.value = true;
  errorMessage.value = null;
  successMessage.value = null;

  if (!editingEmployee.value.password) {
    errorMessage.value = "Please enter a new password";
    loading.value = false;
    return;
  }

  try {
    const response = await fetch(
      `${config.public.apiUrl}/Employee/UpdatePassword?id=${editingEmployee.value.id}&newPassword=${editingEmployee.value.password}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${userStore.token}`,
        },
      }
    );

    const data = await response.json().catch(() => null);
    if (response.ok) {
      successMessage.value = "Password updated successfully";
    } else {
      throw new Error(data?.error || "Failed to update password");
    }
  } catch (error) {
    errorMessage.value = error.message || "Failed to update password";
  } finally {
    showEditDialog.value = false;
    loading.value = false;
  }
};

const departments = ref([]);
const fetchDepartments = async () => {
  try {
    const response = await fetch(
      `${config.public.apiUrl}/Department?Page=1&PageSize=100`,
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
    }
  } catch (error) {
    errorMessage.value = "Failed to fetch departments";
  }
};
</script>

<template>
  <v-row>
    <v-col cols="12" md="12">
      <UiParentCard title="Manage Employees" :subtitle="employeeTotalCount">
       
        <v-alert v-if="errorMessage" type="error" dismissible>{{
          errorMessage
        }}</v-alert>
        <v-alert v-if="successMessage" type="success" dismissible>{{
          successMessage
        }}</v-alert>

        <v-container>
          <v-row class="mb-4">
            <v-col cols="12" sm="12" md="12" class="d-flex align-center justify-space-between">
              <!-- title -->
              <h2 class="text-h5">Sync Employees</h2>
              <v-btn
                color="primary"
                @click="syncEmployees"
                :loading="loading"
              >
                Sync Employees from Odoo
              </v-btn>
            </v-col>

            <v-col cols="12" sm="6" md="4">
              <v-text-field
                v-model="employeeSearchInfo.employeeName"
                label="Search by Employee Name"
                @input="fetchEmployees"
              ></v-text-field>
            </v-col>
            <v-col cols="12" sm="6" md="4">
              <v-select
                v-model="employeeSearchInfo.departmentId"
                :items="departments"
                item-title="name"
                item-value="oodoDepartmentId"
                label="Department"
                clearable
                @update:model-value="selectedDepartment($event)"
              >
                <template v-slot:item="{ props, item }">
                  <v-list-item
                    v-bind="props"
                    :subtitle="item.raw.displayName"
                  ></v-list-item>
                </template>
              </v-select>
            </v-col>
          </v-row>

          <v-progress-circular
            v-if="loading"
            indeterminate
            color="primary"
            class="d-flex justify-center my-4"
          ></v-progress-circular>

          <div class="employee-cards">
            <v-card
              v-for="item in filteredEmployees"
              :key="item.id"
              class="employee-card"
              :style="{ borderColor: '#' + item.departmentColor || '#ccc' }"
            >
              <v-card-text>
                <!-- star icon for managers  -->
                <v-icon
                  v-if="item.isManager"
                  class="mr-2"
                  color="primary"
                  >mdi-star</v-icon
                >
                <v-icon
                  v-else
                  class="mr-2"
                  color="primary"
                  >mdi-account</v-icon
                >
                <div class="d-flex align-center">
                  <v-avatar size="80" class="mr-4">
                    <img
                      :src="
                        item.image512
                          ? `data:image/svg+xml;base64,${item.image512}`
                          : 'fallback-image-url.jpg'
                      "
                      @error="handleImageError($event, item.image512)"
                      width="35"
                      height="35"
                      alt="user"
                      class="avatar"
                    />
                  </v-avatar>
                  <div class="employee-info">
                    <h3 class="mb-2">{{ item.name }}</h3>
                    <p class="mb-1">
                      <strong>Job Title:</strong>
                      {{ item.jobTitle == "False" ? "-" : item.jobTitle }}
                    </p>
                    <p class="mb-1">
                      <strong>Department:</strong>
                      {{ item.department == null ? "-" : item.department.name }}
                    </p>
                    <p class="mb-0">
                      <strong>Created At:</strong>
                      {{ item.createdAt.toString().split("T")[0] }}
                    </p>
                  </div>
                </div>
              </v-card-text>
              <v-card-actions class="justify-space-between pa-4">
  <v-btn
    color="primary"
    outlined
    class="mx-2"
    @click="
      showEditInfoDialog = true;
      editingEmployee = item;
    "
  >
    <v-icon left>mdi-pencil</v-icon>
    Update Info
  </v-btn>
  <v-btn
    color="secondary"
    outlined
    class="mx-2"
    @click="
      showEditDialog = true;
      editingEmployee = item;
    "
  >
    <v-icon left>mdi-key</v-icon>
    Edit Password
  </v-btn>
  <v-btn
    color="success"
    outlined
    class="mx-2"
    @click="openEmailDialog(item)"
  >
    <v-icon left>mdi-email</v-icon>
    Send Email
  </v-btn>
  <v-btn
    color="info"
    outlined
    class="mx-2"
    @click="showDetails(item)"
  >
    <v-icon left>mdi-information-outline</v-icon>
    Details
  </v-btn>
</v-card-actions>

            </v-card>
          </div>

          <v-pagination
            v-model="currentPage"
            :length="totalPages"
            @input="fetchEmployees"
            class="mt-4"
          ></v-pagination>
        </v-container>
      </UiParentCard>
    </v-col>
  </v-row>

  <!-- showEditInfoDialog -->
  <v-dialog v-model="showEditInfoDialog" max-width="500px">
    <v-card>
      <v-card-title>Edit Info for {{ editingEmployee?.name }}</v-card-title>
      <v-card-text>
        <div>
          <v-select
          v-model="editingEmployee.role"
          :items="roles"
          item-title="name"
          item-value="value"
          label="Role"
        ></v-select>
        
        </div>
      
      </v-card-text>
      <v-card-actions>
        <v-btn text @click="showEditInfoDialog = false">Cancel</v-btn>
        <v-btn :loading="loading" color="primary" @click="updateInfo"
          >Save</v-btn
        >
      </v-card-actions>
    </v-card>
  </v-dialog>

  <!-- Details Modal -->
  <v-dialog v-model="showDetailsDialog" max-width="700px">
    <v-card class="elevation-3">
      <v-card-title class="primary--text font-weight-bold text-h6">
        <v-icon left class="mr-2">mdi-account</v-icon>
        Employee Details: {{ employeeDetails?.displayName || "-" }}
      </v-card-title>

      <v-divider></v-divider>

      <v-card-text>
        <v-row>
          <v-col cols="6">
            <p>
              <strong>Job Title:</strong> {{ employeeDetails?.jobTitle || "-" }}
            </p>
            <p>
              <strong>Rols In System :</strong> {{ GetRoleName(employeeDetails?.role) || "-" }}
            </p>
            <p>
              <strong>Department:</strong>
              {{ employeeDetails?.department?.name || "-" }}
            </p>
            <p>
              <strong>Full Department Name:</strong>
              {{ employeeDetails?.department?.displayName || "-" }}
            </p>
          </v-col>
          <v-col cols="6">
            <p>
              <strong>Manager:</strong>
              {{ employeeDetails?.department?.managerName || "-" }}
            </p>
            <p>
              <strong>Odoo Employee ID:</strong>
              {{ employeeDetails?.odooEmployeeId || "-" }}
            </p>
            <p><strong>Gender:</strong> {{ employeeDetails?.gender || "-" }}</p>
          </v-col>
        </v-row>

        <v-divider class="my-4"></v-divider>

        <v-row>
          <v-col cols="6">
            <p>
              <strong>Work Phone:</strong>
              {{ employeeDetails?.workPhone || "-" }}
            </p>
            <p>
              <strong>Mobile Phone:</strong>
              {{ employeeDetails?.mobilePhone || "-" }}
            </p>
            <p>
              <strong>Email:</strong> {{ employeeDetails?.workEmail || "-" }}
            </p>
          </v-col>
          <v-col cols="6">
            <p>
              <strong>Department Color:</strong>
              <span
                :style="{ color: `#${employeeDetails?.departmentColor}` }"
                >{{ employeeDetails?.departmentColor || "-" }}</span
              >
            </p>
            <p>
              <strong>Created At:</strong>
              {{ employeeDetails?.createdAt?.split("T")[0] || "-" }}
            </p>
          </v-col>
        </v-row>
      </v-card-text>

      <v-divider></v-divider>

      <v-card-actions class="d-flex justify-end">
        <v-btn color="primary" text @click="showDetailsDialog = false">
          Close
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>

  <!-- Edit Password Modal -->
  <v-dialog v-model="showEditDialog" max-width="500px">
    <v-card>
      <!-- messages -->
      <v-alert v-if="errorMessage" type="error" dismissible>{{
        errorMessage
      }}</v-alert>
      <v-alert v-if="successMessage" type="success" dismissible>{{
        successMessage
      }}</v-alert>
      <v-card-title>Edit Password for {{ editingEmployee?.name }}</v-card-title>
      <v-card-text>
        <v-text-field
          label="New Password"
          type="password"
          v-model="editingEmployee.password"
        />
      </v-card-text>
      <v-card-actions>
        <v-btn text @click="showEditDialog = false">Cancel</v-btn>
        <v-btn :loading="loading" color="primary" @click="updatePassword"
          >Save</v-btn
        >
      </v-card-actions>
    </v-card>
  </v-dialog>

  <!-- Send Email Modal -->
  <v-dialog v-model="showEmailDialog" max-width="500px">
    <v-card>
      <v-card-title>Send Email to {{ editingEmployee?.name }}</v-card-title>
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
.employee-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
  gap: 1.5rem;
  padding: 1rem;
}

.employee-card {
  border: 2px solid rgb(65 206 226);
  border-radius: 10px;
  background-color: #ffffff;
  box-shadow: 0px 4px 8px rgba(0, 0, 0, 0.1);
  transition: transform 0.3s;
}

.employee-card:hover {
  transform: translateY(-5px);
  box-shadow: 0px 8px 12px rgba(0, 0, 0, 0.2);
}

.avatar {
  border-radius: 50%;
  width: 80px;
  height: 80px;
}

.employee-info h3 {
  font-size: 1.2rem;
  color: #333;
}

.employee-info p {
  font-size: 0.9rem;
  color: #555;
}

.v-btn {
  border-radius: 20px;
  font-weight: bold;
  transition: all 0.3s ease;
}

.v-btn:hover {
  box-shadow: 0px 4px 10px rgba(0, 0, 0, 0.2);
}

.v-card-actions {
  flex-wrap: wrap;
  gap: 10px;
}
</style>
