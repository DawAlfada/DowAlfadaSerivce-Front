<script setup>
import { ref, onMounted, computed, watch } from "vue";
import { useUserStore } from "@/store/user"; // Import the store
import UiParentCard from "@/components/shared/UiParentCard.vue";
import { useRuntimeConfig } from "#app";

const config = useRuntimeConfig();
const userStore = useUserStore();

// definePageMeta({
//   requiresAdmin: true,
//   title: "Evaluation VacationType",
// });

const VacationType = ref([]);
const totalCount = ref(0);
const loading = ref(false);
const errorMessage = ref(false);
const successMessage = ref(false);
const workTypeDialog = ref(false);
const worktype = ref([]);
const workTypes = ref([]);

const showWorkTypes = (workTypes) => {
  workTypeDialog.value = true;
  worktype.value = workTypes;
};

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
  fetchVacationType();
});

const searchTerm = ref("");

const newVacationType = ref({
  name: "",
  workDaysInWeek: "",
  leaveDaysInYear: "",
  leaveBased: 0,
  isWithoutSalary: false,
  isDependVacationBalance: false,
  workTypeIds: [],
  leaveDaysInYear: null,
  hoursPerMonth: null,
  isActive: true,
  
});
const isEditing = ref(false);
const editingVacationTypeId = ref(null);

const deleteDialog = ref(false);
const VacationTypeToDelete = ref(null);

const fetchVacationType = async () => {
  loading.value = true;
  try {
    const response = await fetch(
      `${config.public.apiUrl}/VacationType?Page=${currentPage.value}&PageSize=${pageSize.value}&Name=${searchTerm.value}`,
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${userStore.token}`, // Use the token from the store
        },
      }
    );
    const data = await response.json();
    if (!data.error) {
      VacationType.value = data.data.items;
      totalCount.value = data.data.totalCount;
    }
  } catch (error) {
    errorMessage.value = "Failed to fetch VacationType";
  } finally {
    loading.value = false;
  }
};

const filteredVacationType = computed(() => {
  return VacationType.value.filter((VacationType) =>
    VacationType.name.toLowerCase().includes(searchTerm.value.toLowerCase())
  );
});

const submitVacationType = async () => {
  errorMessage.value = "";
  successMessage.value = "";

  // Validate required fields
  if (!newVacationType.value.name) {
    errorMessage.value = "Please fill in Leave Type Name field";
    return;
  }

  if (
    newVacationType.value.leaveBased === 0 &&
    !newVacationType.value.isDependVacationBalance
  ) {
    if (!newVacationType.value.leaveDaysInYear) {
      errorMessage.value = "Please fill in Leave Days In Year field";
      return;
    }

    if (
      (!newVacationType.value.workTypeIds ||
        newVacationType.value.workTypeIds.length === 0)
    ) {
      errorMessage.value = "Please select at least one Work Type";
      return;
    }
  }

  if (
    newVacationType.value.leaveBased === 1 &&
    !newVacationType.value.isDependVacationBalance
  ) {
    if (!newVacationType.value.hoursPerMonth) {
      errorMessage.value = "Please fill in Hours Per Month field";
      return;
    }
  }

  loading.value = true;
  try {
    const url = isEditing.value
      ? `${config.public.apiUrl}/VacationType/${editingVacationTypeId.value}`
      : `${config.public.apiUrl}/VacationType`;

    const method = isEditing.value ? "PUT" : "POST";
    const response = await fetch(url, {
      method,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${userStore.token}`, // Use the token for authorization
      },
      body: JSON.stringify(newVacationType.value),
    });

    const data = await response.json();
    if (!data.error) {
      successMessage.value = data.message;
      resetForm();
      fetchVacationType();
    } else {
      throw new Error(data.message);
    }
  } catch (error) {
    errorMessage.value = error.message || "Failed to submit VacationType";
  } finally {
    loading.value = false;
  }
};

const confirmDeleteVacationType = (VacationType) => {
  VacationTypeToDelete.value = VacationType;
  deleteDialog.value = true;
};

const deleteVacationType = async () => {
  loading.value = true;
  deleteDialog.value = false;
  try {
    const response = await fetch(
      `${config.public.apiUrl}/VacationType/${VacationTypeToDelete.value.id}`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${userStore.token}`, // Use the token here as well
        },
      }
    );
    const data = await response.json();
    if (!data.error) {
      successMessage.value = data.message;
      fetchVacationType();
    } else {
      throw new Error(data.message);
    }
  } catch (error) {
    errorMessage.value = error.message || "Failed to delete VacationType";
  } finally {
    loading.value = false;
  }
};

const resetForm = () => {
  newVacationType.value = {
    VacationTypeName: "",
    startDate: "",
    endDate: "",
    isActive: true,
  };
  isEditing.value = false;
  editingVacationTypeId.value = null;
};

const fetchWorkTypes = async () => {
  loading.value = true;
  try {
    const response = await fetch(
      `${config.public.apiUrl}/WorkType?Page=${currentPage.value}&PageSize=50`,
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${userStore.token}`,
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

onMounted(() => {
  fetchVacationType();
  fetchWorkTypes();
});
</script>

<template>
  <v-row>
    <v-col cols="12" md="12">
      <UiParentCard title="Manage Leave Types">
        <v-alert v-if="errorMessage" type="error" dismissible>{{
          errorMessage
        }}</v-alert>
        <v-alert v-if="successMessage" type="success" dismissible>{{
          successMessage
        }}</v-alert>

        <v-form @submit.prevent="submitVacationType">
          <v-container class="mb-6">
            <v-row>
              <v-col cols="12" sm="6" md="3">
                <v-text-field
                  v-model="newVacationType.name"
                  label="Leave Type Name"
                  required
                ></v-text-field>
              </v-col>

              <v-col cols="12" sm="6" md="3">
                <v-select
                  v-model="newVacationType.leaveBased"
                  :items="[
                    { text: 'Day Based Leave', value: 0 },
                    { text: 'Hour Based Leave', value: 1 },
                  ]"
                  label="Leave Based"
                  item-title="text"
                  item-value="value"
                  required
                ></v-select>
              </v-col>

              <v-col
                cols="12"
                sm="6"
                md="3"
                v-if="newVacationType.leaveBased == 0"
              >
                <v-select
                  v-model="newVacationType.workTypeIds"
                  :items="workTypes"
                  item-title="name"
                  item-value="id"
                  label="Work Type"
                  multiple
                >
                </v-select>
              </v-col>

              <v-col cols="12" sm="6" md="3">
                <v-select
                  v-model="newVacationType.isWithoutSalary"
                  :items="[
                    { text: 'With Out Salary', value: true },
                    { text: 'With Salary', value: false },
                  ]"
                  label="Is Without Salary"
                  item-title="text"
                  item-value="value"
                  required
                ></v-select>
              </v-col>

              <!-- IsDependVacationBalance -->
              <v-col cols="12" sm="6" md="3">
                <v-select
                  v-model="newVacationType.isDependVacationBalance"
                  :items="[
                    { text: 'Depend Vacation Balance', value: true },
                    { text: 'Not Depend Vacation Balance', value: false },
                  ]"
                  label="Is Depend Vacation Balance"
                  item-title="text"
                  item-value="value"
                  required
                ></v-select>
              </v-col>
              <v-col
              
                cols="12"
                sm="6"
                md="3"
                v-if="
                  (newVacationType.workTypeIds == null ||
                    newVacationType.workTypeIds.length == 0) &
                  (newVacationType.leaveBased == 0 & newVacationType.isDependVacationBalance == false)
                "
              >
                <v-text-field
                  type="number"
                  v-model="newVacationType.leaveDaysInYear"
                  label="Leave Days In Year"
                  required
                ></v-text-field>
              </v-col>

              <v-col
                cols="12"
                sm="6"
                md="3"
                v-if="newVacationType.leaveBased == 1 & newVacationType.isDependVacationBalance == false"
              >
                <v-text-field
                  type="number"
                  v-model="newVacationType.hoursPerMonth"
                  label="Hours Per Month"
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
              {{ isEditing ? "Update Leave Type" : "Create Leave Type" }}
            </v-btn>
            <v-btn @click="resetForm" color="secondary" :disabled="loading"
              >Cancel</v-btn
            >
          </v-container>
        </v-form>
        <v-container>
          <v-row class="mb-4">
            <v-col cols="12" sm="6" md="4">
              <v-text-field
                v-model="searchTerm"
                label="Search by VacationType Name"
                @input="fetchVacationType"
              ></v-text-field>
            </v-col>
          </v-row>

          <v-table density="compact" class="custom-table">
            <thead>
              <tr>
                <th class="text-left">Name</th>
                <th class="text-left">Leave Days In Year</th>
                <th class="text-left">Hours Per Month</th>
                <th class="text-left">Leave Based</th>
                <th class="text-left">Is Depend Vacation Balance</th>
                <th class="text-left">Insert Date</th>
                <th class="text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="item in filteredVacationType"
                :key="item.id"
                :class="{
                  'highlight-row': item.leaveBased === 0,
                  'default-row': item.leaveBased !== 0,
                }"
              >
                <td>{{ item.name }}</td>
                <td>
                  <span
                    v-if="
                      item.vacationTypeWorkTypes &&
                      item.vacationTypeWorkTypes.length > 0 &&
                      item.leaveBased === 0
                    "
                    @click="showWorkTypes(item.vacationTypeWorkTypes)"
                    class="clickable-text"
                  >
                    Depends on the type of work
                  </span>
                  <span v-else-if="item.leaveBased === 0"
                    >{{ item.leaveDaysInYear }} Day</span
                  >
                  <span v-else>-</span>
                </td>
                <td>
                  <span
                    v-if="item.hoursPerMonth === null && item.leaveBased === 0"
                    >-</span
                  >
                  <span v-else>{{ item.hoursPerMonth }} Hour</span>
                </td>
                <td>
                  <span v-if="item.leaveBased === 0" class="day-based"
                    >Day Based Leave</span
                  >
                  <span v-else class="hour-based">Hour Based Leave</span>
                </td>
                <td>
                  <span
                    v-if="item.isDependVacationBalance"
                    class="day-based"
                    >Depend Vacation Balance</span
                  >
                  <span
                    v-else
                    class="hour-based"
                    >Not Depend Vacation Balance</span
                  >
                </td>
                <td>{{ item.createdAt.split("T")[0] }}</td>
                <td>
                  <v-btn
                    density="default"
                    icon="mdi-open-in-new"
                    @click="
                      isEditing = true;
                      editingVacationTypeId = item.id;
                      newVacationType = { ...item };
                    "
                    color="success"
                    class="ma-2"
                  ></v-btn>
                  <v-btn
                    density="default"
                    icon="mdi-delete"
                    @click="confirmDeleteVacationType(item)"
                    color="red"
                    class="ma-2"
                  ></v-btn>
                </td>
              </tr>
            </tbody>
          </v-table>

          <v-pagination
            v-model="currentPage"
            :length="totalPages"
            @input="fetchVacationType"
            class="mt-4"
          ></v-pagination>
        </v-container>
      </UiParentCard>
    </v-col>
  </v-row>
  <!--  worktype dialog -->
  <v-dialog v-model="workTypeDialog" max-width="600">
    <v-card>
      <v-card-title class="headline"> </v-card-title>
      <v-card-text>
        <!-- list of worktype -->
        <v-list>
          <v-list-item-group>
            <v-list-item
              v-for="item in worktype"
              :key="item.id"
              @click="workTypeDialog = false"
            >
              <v-list-item-content>
                <v-list-item-title
                  >{{ item.workType.name }} 
                  <v-chip v-if="item.workType.workDaysInWeek"
                    append-icon="mdi-checkbox-marked-circle"
                    class="ma-2"
                    color="primary"
                  >
                  -  Work days in week ( {{ item.workType.workDaysInWeek }} )
                  </v-chip>
               
                  <v-chip v-if="item.workType.leaveDaysInYear"
                    append-icon="mdi-checkbox-marked-circle"
                    class="ma-2"
                    color="primary"
                  >
                  - Leave days in year( {{ item.workType.leaveDaysInYear }} )
                  </v-chip>
                
                </v-list-item-title>
              </v-list-item-content>
            </v-list-item>
          </v-list-item-group>
        </v-list>
      </v-card-text>
      <v-card-actions>
        <v-btn color="primary" text @click="workTypeDialog = false"
          >Cancel</v-btn
        >
      </v-card-actions>
    </v-card>
  </v-dialog>

  <v-dialog v-model="deleteDialog" max-width="400">
    <v-card>
      <v-card-title class="headline">Confirm Deletion</v-card-title>
      <v-card-text
        >Are you sure you want to delete this VacationType?</v-card-text
      >
      <v-card-actions>
        <v-btn color="primary" text @click="deleteDialog = false">Cancel</v-btn>
        <v-btn color="red" text @click="deleteVacationType">Delete</v-btn>
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
