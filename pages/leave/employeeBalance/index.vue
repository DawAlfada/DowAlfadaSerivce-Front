<script setup>
import { ref, onMounted, computed, watch } from "vue";
import UiParentCard from "@/components/shared/UiParentCard.vue";
import { useRuntimeConfig } from "#app";
import { useUserStore } from "@/store/user";
const config = useRuntimeConfig();
const userStore = useUserStore();

// definePageMeta({
//   requiresAdmin: false,
//   title: "Evaluation Balance",
// });

const Balance = ref([]);
const totalCount = ref(0);
const loading = ref(false);
const errorMessage = ref(false);
const successMessage = ref(false);
const employees = ref([]);

watch([errorMessage, successMessage], () => {
  if (errorMessage.value || successMessage.value) {
    setTimeout(() => {
      errorMessage.value = null;
      successMessage.value = null;
    }, 4000);
  }
});

const model = ref(new Date().toISOString().substr(0, 10));

const currentPage = ref(1);
const pageSize = ref(10);
const totalPages = computed(() => Math.ceil(totalCount.value / pageSize.value));
watch(currentPage, () => {
  fetchBalance();
});

const searchTerm = ref("");
const searchInfo = ref({
  year: new Date().getFullYear(),
});

const newBalance = ref({
  id: null,
  balance: 0,
  leaveBased: 0, // 0: Days, 1: Hours
});
const isEditing = ref(false);
const editingBalanceId = ref(null);

const deleteDialog = ref(false);
const BalanceToDelete = ref(null);

const fetchBalance = async () => {
  loading.value = true;
  try {
    const response = await fetch(
      `${config.public.apiUrl}/EmployeeLeave/GetBalance?Page=${currentPage.value}&PageSize=${pageSize.value}&Year=${searchInfo.value.year}`,
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${userStore.token}`, // Use the token from the store
        },
      }
    );
    const data = await response.json();
    if (!data.error) {
      Balance.value = data.data.items;
      totalCount.value = data.data.totalCount;
    }
  } catch (error) {
    errorMessage.value = "Failed to fetch Balance";
  } finally {
    loading.value = false;
  }
};

const fetchEmployees = async () => {
  try {
    const response = await fetch(
      `${config.public.apiUrl}/Employee?Page=1&PageSize=100`,
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${userStore.token}`,
        },
      }
    );
    const data = await response.json();
    if (!data.error) {
      employees.value = data.data.items;
    }
  } catch (error) {
    errorMessage.value = "Failed to fetch employees";
  }
};

const filteredBalance = computed(() => {
  return Balance.value.filter((Balance) =>
    Balance.employee.name.toLowerCase().includes(searchTerm.value.toLowerCase())
  );
});

const searchText = ref("");

const submitBalance = async () => {
  errorMessage.value = "";
  successMessage.value = "";

  if (!newBalance.value.id) {
    errorMessage.value = "Please select an employee";
    return;
  }
  if (newBalance.value.balance === null || newBalance.value.balance === undefined) {
    errorMessage.value = "Please enter a valid balance";
    return;
  }

  loading.value = true;
  try {
    const url = isEditing.value
      ? `${config.public.apiUrl}/EmployeeLeave/AddBalance?id=${editingBalanceId.value}&balance=${newBalance.value.balance}&leaveBased=${newBalance.value.leaveBased}`
      : `${config.public.apiUrl}/EmployeeLeave/AddBalance?id=${newBalance.value.id}&balance=${newBalance.value.balance}&leaveBased=${newBalance.value.leaveBased}`;

    const method = isEditing.value ? "PUT" : "POST";
    const response = await fetch(url, {
      method,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${userStore.token}`,
      },
    });

    const data = await response.json();
    if (!data.error) {
      successMessage.value = data.message;
      resetForm();
      fetchBalance();
    } else {
      throw new Error(data.message);
    }
  } catch (error) {
    errorMessage.value = error.message || "Failed to submit Balance";
  } finally {
    loading.value = false;
  }
};

const confirmDeleteBalance = (Balance) => {
  BalanceToDelete.value = Balance;
  deleteDialog.value = true;
};

const deleteBalance = async () => {
  console.log("BalanceToDelete:", BalanceToDelete.value);
  loading.value = true;
  deleteDialog.value = false;
  try {
    const response = await fetch(
      `${config.public.apiUrl}/EmployeeLeave/DeleteBalance?id=${BalanceToDelete.value.id}`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${userStore.token}`,
        },
      }
    );
    const data = await response.json();
    if (!data.error) {
      successMessage.value = data.message;
      fetchBalance();
    } else {
      throw new Error(data.message);
    }
  } catch (error) {
    errorMessage.value = error.message || "Failed to delete Balance";
  } finally {
    loading.value = false;
  }
};

const resetForm = () => {
  newBalance.value = {
    id: null,
    balance: 0,
    leaveBased: 0,
  };
  isEditing.value = false;
  editingBalanceId.value = null;
};

onMounted(() => {
  fetchBalance();
  fetchEmployees();
});
</script>

<template>
  <v-row>
    <v-col cols="12" md="12">
      <UiParentCard title="Employee Leave Balance">
        <v-alert v-if="errorMessage" type="error" dismissible>{{
          errorMessage
        }}</v-alert>
        <v-alert v-if="successMessage" type="success" dismissible>{{
          successMessage
        }}</v-alert>

        <v-form
          @submit.prevent="submitBalance"
          v-if="
            userStore.user.role == 1 ||
            userStore.user.role == 4 ||
            userStore.user.role == 5
          "
        >
          <v-container class="mb-6">
            <v-row>
              <v-col cols="12" sm="6" md="3">
                <v-autocomplete
                  v-model="newBalance.id"
                  :items="employees"
                  item-title="displayName"
                  item-value="id"
                  label="Employee"
                  placeholder="Search employees..."
                  clearable
                  outlined
                  dense
                  :search-input.sync="searchText"
                  :filter="(item, queryText, itemText) => {
                    const displayName = item.displayName ? item.displayName.toLowerCase() : '';
                    const name = item.name ? item.name.toLowerCase() : '';
                    const query = queryText.toLowerCase();
                    return displayName.includes(query) || name.includes(query);
                  }"
                  no-data-text="No employees found"
                >
                  <template v-slot:item="{ props, item }">
                    <v-list-item v-bind="props">
                      <v-list-item-content>
                        <v-list-item-title>{{
                          item.raw.displayName
                        }}</v-list-item-title>
                        <v-list-item-subtitle>{{
                          item.raw.name
                        }}</v-list-item-subtitle>
                      </v-list-item-content>
                    </v-list-item>
                  </template>
                </v-autocomplete>
              </v-col>
              <v-col cols="12" sm="6" md="3">
                <v-text-field
                  v-model="newBalance.balance"
                  type="number"
                  label="Balance"
                  required
                ></v-text-field>
              </v-col>
              <v-col cols="12" sm="6" md="3">
                <v-select
                  v-model="newBalance.leaveBased"
                  :items="[
                    { text: 'Days', value: 0 },
                    { text: 'Hours', value: 1 }
                  ]"
                  label="Leave Based"
                  item-title="text"
                  item-value="value"
                  required
                ></v-select>
              </v-col>
            </v-row>
            <v-btn
              :loading="loading"
              type="submit"
              color="primary"
              class="mr-2"
            >
              {{ isEditing ? "Update Leave Type" : "Create Balance" }}
            </v-btn>
            <v-btn @click="resetForm" color="secondary" :disabled="loading"
              >Cancel</v-btn
            >
          </v-container>
        </v-form>

        <v-container>
            <v-table density="compact" class="custom-table">
              <thead>
                <tr>
                  <th class="text-left">Employee Name</th>
                  <th class="text-left">Balance</th>
                  <th class="text-left">Leave Based</th>
                  <th class="text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="item in Balance" :key="item.id">
                  <td>{{ item.employee.name }}</td>
                  <td>{{ item.balance }}</td>
                  <td>
                    <span v-if="item.leaveBased === 0">Days</span>
                    <span v-else-if="item.leaveBased === 1">Hours</span>
                  </td>
                  <td>
                    <v-btn
                      icon="mdi-delete"
                      size="default"
                      variant="elevated"
                      color="error"
                      @click="confirmDeleteBalance(item)"
                      class="ma-2"
                    />
                  </td>
                </tr>
              </tbody>
            </v-table>

          <v-pagination
            v-model="currentPage"
            :length="totalPages"
            @input="fetchBalance"
            class="mt-4"
          ></v-pagination>
        </v-container>
      </UiParentCard>
    </v-col>
  </v-row>

  <v-dialog v-model="deleteDialog" max-width="400">
    <v-card>
      <v-card-title class="headline">Confirm Deletion</v-card-title>
      <v-card-text>Are you sure you want to delete this Balance?</v-card-text>
      <v-card-actions>
        <v-btn color="primary" text @click="deleteDialog = false">Cancel</v-btn>
        <v-btn color="red" text @click="deleteBalance">Delete</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
<style scoped>
.custom-table .clickable-text {
  color: #007bff;
  cursor: pointer;
  text-decoration: none;
}

.custom-table .highlight-row {
  background-color: #e6f7ff;
}

.custom-table .default-row {
  background-color: #ffffff;
}

.custom-table .day-based {
  font-weight: bold;
  color: #4caf50;
}

.custom-table .hour-based {
  font-weight: bold;
  color: #ff9800;
}

.custom-table tr:hover {
  background-color: #f1f1f1;
}

.custom-table v-btn {
  transition: transform 0.2s ease;
}

.custom-table v-btn:hover {
  transform: scale(1.1);
}
</style>
