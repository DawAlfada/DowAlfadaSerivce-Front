<script setup>
import { ref, onMounted, computed, watch } from "vue";
import { useUserStore } from "@/store/user";
import UiParentCard from "@/components/shared/UiParentCard.vue";
import { useRuntimeConfig } from '#app';


definePageMeta({
  requiresAdmin: true, 
  title: "Evaluation Questions",
});


const config = useRuntimeConfig();

const userStore = useUserStore();

const Questions = ref([]);
const totalCount = ref(0);
const loading = ref(false);
const errorMessage = ref(false);
const successMessage = ref(false);
const isSelectingCampaign = ref(false);
const currentPage = ref(1);
const campaignId  = ref(null);
const pageSize = ref(10);
const totalPages = computed(() => Math.ceil(totalCount.value / pageSize.value));
watch(currentPage, () => {
  fetchQuestions();
});

const selectedCampaign = (value) => {
  searchInfo.value.campaignId = value;
  newQuestion.value.campaignId = value;
  campaignId.value = value;
  isSelectingCampaign.value = true;
  fetchQuestions();
  fetchDepartments();
};

const selectedDepartment = (value) => {
  employeeSearchInfo.value.departmentId = value;
  searchInfo.value.departmentId = Number(value);
  if (value == null) {
    newQuestion.value.employeeId = "";
    employees.value = [];
    fetchQuestions(); 

  }else{
    fetchEmployees();
    fetchQuestions(); 
  }
};

const employeeSearchInfo = ref({
  departmentId: "",
  employeeName: "",
});

const searchTerm = ref("");

const searchInfo = ref({
  departmentId: "",
  employeeId: "",
  campaignId: "",
});

const newQuestion = ref({
  text: "",
  points: "",
  departmentId: "",
  employeeId: "",
  campaignId: "",
});

onMounted(() => {
  fetchCampaigns();
});

const isEditing = ref(false);
const editingQuestionId = ref(null);

const deleteDialog = ref(false);
const QuestionToDelete = ref(null);

const fetchQuestions = async () => {
  console.log(searchInfo.value.departmentId);

  loading.value = true;
  try {
    const response = await fetch(
      `${config.public.apiUrl}/Evaluation/GetAllQuestion?Page=${currentPage.value}
      &PageSize=${pageSize.value}
      &Text=${searchTerm.value}
      &DepartmentId=${searchInfo.value.departmentId == null || searchInfo.value.departmentId == 0 ? "" : searchInfo.value.departmentId}
      &EmployeeId=${searchInfo.value.employeeId}
      &CampaignId=${searchInfo.value.campaignId}`,
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${userStore.token}`, // Use the token from the store
        },
      }
    );
    const data = await response.json();
    if (!data.error) {
      Questions.value = data.data.items;
      totalCount.value = data.data.totalCount;
    }
  } catch (error) {
    errorMessage.value = "Failed to fetch Questions";
  } finally {
    loading.value = false;
  }
};

const filteredQuestions = computed(() => {
  return Questions.value.filter((Question) =>
    Question.text.toLowerCase().includes(searchTerm.value.toLowerCase())
  );
});

const submitQuestion = async () => {
  errorMessage.value = ""; 
  successMessage.value = "";


  if (!newQuestion.value.text || !newQuestion.value.points) {
    errorMessage.value = "Please fill in Text and Points the fields";
    return;
  }

  if (!newQuestion.value.departmentId || newQuestion.value.departmentId == null) {
    errorMessage.value = "Please fill Deparment fields";
    return;
  }
  
  

  loading.value = true;
  try {
    const url = isEditing.value
      ? `${config.public.apiUrl}/Evaluation/UpdateQuestion?id=${editingQuestionId.value}`
      : `${config.public.apiUrl}/Evaluation/CreateQuestion`;

    const method = isEditing.value ? "PUT" : "POST";
    const response = await fetch(url, {
      method,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${userStore.token}`, 
      },
      body: JSON.stringify(newQuestion.value),
    });

    const data = await response.json();
    if (!data.error) {
      successMessage.value = data.message;
      resetForm();
      fetchQuestions();
    } else {
      throw new Error(data.message);
    }
  } catch (error) {
    errorMessage.value = error.message || "Failed to submit Question";
  } finally {
    loading.value = false;
  }
};

const confirmDeleteQuestion = (Question) => {
  QuestionToDelete.value = Question;
  deleteDialog.value = true;
};

const deleteQuestion = async () => {
  loading.value = true;
  deleteDialog.value = false;
  try {
    const response = await fetch(
      `${config.public.apiUrl}/Evaluation/DeleteQuestion?id=${QuestionToDelete.value.id}`,
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
      fetchQuestions();
    } else {
      throw new Error(data.message);
    }
  } catch (error) {
    errorMessage.value = error.message || "Failed to delete Question";
  } finally {
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

const employees = ref([]);
const fetchEmployees = async () => {
  try {
    const response = await fetch(
      `${config.public.apiUrl}/Employee?Page=1&PageSize=100&DepartmentId=${employeeSearchInfo.value.departmentId == null ? "" : employeeSearchInfo.value.departmentId}`,
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${userStore.token}`, // Use the token from the store
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

const campaigns = ref([]);
const fetchCampaigns = async () => {
  try {
    const response = await fetch(
      `${config.public.apiUrl}/Evaluation/GetAllEvaluationCampaign?Page=1&PageSize=100`,
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${userStore.token}`, // Use the token from the store
        },
      }
    );
    const data = await response.json();
    if (!data.error && Array.isArray(data.data.items)) {
      campaigns.value = data.data.items;
    } else {
      campaigns.value = []; // Fallback to an empty array if items is not available
    }
  } catch (error) {
    errorMessage.value = "Failed to fetch campaigns";
    campaigns.value = []; // Fallback to an empty array on error
  }
};

const resetForm = () => {
  newQuestion.value = {
    text: "",
    points: "",
    departmentId: "",
    employeeId: "",
    campaignId: campaignId.value,
  };
  isEditing.value = false;
  editingQuestionId.value = null;
};
</script>

<template>
  <v-row>
    <v-col cols="12" md="12">
      <UiParentCard title="First Select Campaign">
        <v-col cols="12" sm="12" md="12">
          <v-select
            :items="campaigns"
            label="Campaign Name"
            item-title="campaignName"
            item-value="id"
            required
            @update:model-value="selectedCampaign($event)"
          ></v-select>
        </v-col>
      </UiParentCard>
    </v-col>
  </v-row>

  <v-row v-if="isSelectingCampaign">
    <v-col cols="12" md="12">
      <UiParentCard title="Manage Questions">
        <v-alert v-if="errorMessage" type="error" dismissible>{{
          errorMessage
        }}</v-alert>
        <v-alert v-if="successMessage" type="success" dismissible>{{
          successMessage
        }}</v-alert>

        <v-form @submit.prevent="submitQuestion">
          <v-container class="mb-6">
            <v-row>
              <v-col cols="12" sm="6" md="3">
                <v-text-field
                  v-model="newQuestion.text"
                  label="Text"
                  required
                ></v-text-field>
              </v-col>

              <v-col cols="12" sm="6" md="3">
                <v-text-field
                  v-model="newQuestion.points"
                  label="Points"
                  required
                  type="number"
                ></v-text-field>
              </v-col>

              <v-col cols="12" sm="6" md="3">

                <v-select
                  v-model="newQuestion.departmentId"
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

              <v-col cols="12" sm="6" md="3">
                <v-select
                  v-model="newQuestion.employeeId"
                  :items="employees"
                  item-title="displayName"
                  item-value="id"
                  label="Employee"
                  clearable
                  outlined
                  dense
                  messages="An employee is selected only if the question is specific to him"
                >
                  <template v-slot:item="{ props, item }">
                    <v-list-item v-bind="props">
                      <v-list-item-content>
                        <v-list-item-title>{{
                          item.displayName
                        }}</v-list-item-title>
                        <v-list-item-subtitle>{{
                          item.raw.name
                        }}</v-list-item-subtitle>
                      </v-list-item-content>
                    </v-list-item>
                  </template>
                </v-select>
              </v-col>
            </v-row>
            <v-btn
              :loading="loading"
              type="submit"
              color="primary"
              class="mr-2"
            >
              {{ isEditing ? "Update Question" : "Create Question" }}
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
                label="Search by Question Name"
                @input="fetchQuestions"
              ></v-text-field>
            </v-col>
          </v-row>

          <v-table density="compact">
            <thead>
              <tr>
                <th class="text-left">Question Text</th>
                <th class="text-left">Point</th>
                <th class="text-left">Deparment</th>
                <th class="text-left">Employee</th>
                <th class="text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in filteredQuestions" :key="item.id">
            <td>{{ item.text }}</td>
            <td>{{ item.points }}</td>
            <td>{{ item.department.name }}</td>
            <td>{{ item.employeeId != null ? item.employee.name : "-" }}</td>
            <td>{{ item.createdAt.toString().split("T")[0] }}</td>
  
            <td>
            
              <v-btn
                density="default"
                icon="mdi-open-in-new"
                @click="
                  isEditing = true;
                  editingQuestionId = item.id;
                  newQuestion = { ...item };
                "
                color="success"
                class="ma-2"
              ></v-btn>

              <v-btn
                density="default"
                icon="mdi-delete"
                @click="confirmDeleteQuestion(item)"
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
            @input="fetchQuestions"
            class="mt-4"
          ></v-pagination>
        </v-container>
      </UiParentCard>
    </v-col>
  </v-row>

  <v-dialog v-model="deleteDialog" max-width="400">
    <v-card>
      <v-card-title class="headline">Confirm Deletion</v-card-title>
      <v-card-text>Are you sure you want to delete this Question?</v-card-text>
      <v-card-actions>
        <v-btn color="primary" text @click="deleteDialog = false">Cancel</v-btn>
        <v-btn color="red" text @click="deleteQuestion">Delete</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
