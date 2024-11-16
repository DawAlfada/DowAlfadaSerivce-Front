<script setup>
import { ref, onMounted, computed, watch } from "vue";
import { useUserStore } from "@/store/user";
import UiParentCard from "@/components/shared/UiParentCard.vue";
import { useRuntimeConfig } from '#app';

const config = useRuntimeConfig();
const userStore = useUserStore();
const questions = ref([]);
const evaluateDialog = ref(false);
const totalCount = ref(0);
const loading = ref(false);
const errorMessage = ref(false);
const successMessage = ref(false);
const isSelectingCampaign = ref(false);
const currentPage = ref(1);
const pageSize = ref(10);
const totalPages = computed(() => Math.ceil(totalCount.value / pageSize.value));
const employeeInfo = ref({});
const isHiddenName = ref(false);
const satisfactionEmojis = ref([
  "😭",
  "😢",
  "☹️",
  "🙁",
  "😐",
  "🙂",
  "😊",
  "😁",
  "😄",
  "😍",
]);



const selectedCampaign = (value) => {
  searchInfo.value.campaignId = value;
  newEvaluation.value.campaignId = value;
  isSelectingCampaign.value = true;
  fetchEmployees();
  fetchDepartments();
};

const newEvaluation = ref({
  campaignId: "",
  departmentId: "",
  employeeId: "",
  questionId: "",
  answer: "",
  evaluationDate: "",
  details: [],
});





const selectedDepartment = (value) => {
  employeeSearchInfo.value.departmentId = value;
  searchInfo.value.departmentId = value;
  searchInfo.value.departmentId = Number(value);
  fetchEmployees();
};

const employeeSearchInfo = ref({
  departmentId: "",
  employeeName: "",
});

const openEvaluateDialog = (item) => {
  employeeInfo.value = item;
  searchInfo.value.employeeId = item.id;
  fetchQuestions();
  evaluateDialog.value = true;
};

const searchTerm = ref("");

const searchInfo = ref({
  departmentId: "",
  employeeId: "",
  campaignId: "",
});

onMounted(() => {
  fetchCampaigns();
  fetchEmployees();
});

watch(currentPage, () => {
  fetchEmployees();
});
const handleImageError = (event, fallbackImage) => {
  event.target.src = `data:image/jpeg;base64,${fallbackImage}`;
};


const fetchQuestions = async () => {
  loading.value = true;
  try {
    const response = await fetch(
      `${config.public.apiUrl}/Evaluation/GetQuestionByEmployeeId?employeeId=${searchInfo.value.employeeId}&campaignId=${searchInfo.value.campaignId}`,
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${userStore.token}`,
        },
      }
    );
    const data = await response.json();
    if (!data.error) {
      questions.value = data.data;
      totalCount.value = data.data.totalCount;
    }
  } catch (error) {
    errorMessage.value = "Failed to fetch Questions";
  } finally {
    loading.value = false;
  }
};

const filteredEmployee = computed(() => {
  return employees.value.filter((employee) =>
    employee.name.toLowerCase().includes(searchTerm.value.toLowerCase())
  );
});

const departments = ref([]);
const fetchDepartments = async () => {
  try {
    const response = await fetch(
      `${config.public.apiUrl}/Department?Page=1&PageSize=100`,
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${userStore.token}`,
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
    if (!data.error) {
      employees.value = data.data.items;
      totalCount.value = data.data.totalCount;
    }
  } catch (error) {
    errorMessage.value = "Failed to fetch employees";
  }
};

const updateEvaluationScore = (score, questionId) => {
  const existing = newEvaluation.value.details.find(
    (detail) => detail.questionId === questionId
  );
  if (existing) {
    existing.score = Number(score);
  } else {
    newEvaluation.value.details.push({ questionId, score: Number(score) });
  }
};

const addEvaluation = async () => {

  loading.value = true;
  try {
    const response = await fetch(
      `${config.public.apiUrl}/Evaluation/CreateEvaluation`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${userStore.token}`,
        },
        body: JSON.stringify({
          evaluateeId: employeeInfo.value.id,
          campaignId: newEvaluation.value.campaignId,
          details: newEvaluation.value.details,
          isHiddenName: isHiddenName.value,
        }),
      }
    );
    const data = await response.json();

    if (!data.error) {
      successMessage.value = "Evaluation submitted successfully.";
    } else {
      errorMessage.value = "Failed to submit evaluation.";
    }
  } catch (error) {
    errorMessage.value = "An error occurred while submitting the evaluation.";
  } finally {
    loading.value = false;
    evaluateDialog.value = false;
  }
};

const campaigns = ref([]);
const fetchCampaigns = async () => {
  try {
    const response = await fetch(
      `${config.public.apiUrl}/Evaluation/GetAllEvaluationCampaign?Page=1&PageSize=100&IsActive=true`,
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${userStore.token}`,
        },
      }
    );
    const data = await response.json();
    if (!data.error && Array.isArray(data.data.items)) {
      campaigns.value = data.data.items;
    } else {
      campaigns.value = [];
    }
  } catch (error) {
    errorMessage.value = "Failed to fetch campaigns";
    campaigns.value = [];
  }
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
      <UiParentCard title="Employees">
        <v-alert v-if="errorMessage" type="error" dismissible>{{
          errorMessage
        }}</v-alert>
        <v-alert v-if="successMessage" type="success" dismissible>{{
          successMessage
        }}</v-alert>

        <v-container>
          <v-row class="mb-4">
            <v-col cols="12" sm="6" md="4">
              <v-select
                v-model="newEvaluation.departmentId"
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

            <v-col cols="12" sm="6" md="4">
              <v-text-field
                v-model="searchTerm"
                label="Search by Employee Name"
                @input="fetchEmployees"
              ></v-text-field>
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
              v-for="item in filteredEmployee"
              :key="item.id"
              class="employee-card"
              :style="{ borderColor: '#' + item.departmentColor || '#ccc' }"
            >
              <v-card-text>
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
              <v-card-actions class="justify-center">
                <v-btn color="primary" @click="openEvaluateDialog(item)">
                  Evaluate Employee
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


  <v-dialog v-model="evaluateDialog" max-width="700px">
    <v-card>
      <v-card-title class="text-h5 grey lighten-2">
        {{ employeeInfo?.name }}
      </v-card-title>
      <v-card-text>
        <v-container>
          <div  v-if="questions != null && questions.length > 0" >
          <v-row
            v-for="question in questions"
            :key="question.id"
            class="mb-6"
          >
            <v-col cols="12 question-section">
              <p class="font-weight-medium mb-5">{{ question.text }}</p>
              <v-slider
                v-model="question.currentScore"
                :max="question.points"
                :step="1"
                @click="updateEvaluationScore(question.currentScore, question.id)"
              >
              </v-slider>
              <div class="d-flex justify-space-between">
                <span class="caption font-weight-medium">
                  Score: {{ question.currentScore }} / {{ question.points }}
                </span>
                <span class="caption font-weight-medium">
                  {{
                    satisfactionEmojis[
                      Math.min(
                        Math.floor(
                          (question.currentScore / question.points) * 10
                        ),
                        9
                      )
                    ]
                  }}
                </span>
              </div>
            </v-col>
          
          </v-row>
          <v-row  class="mb-6">
              <v-col cols="12">
                <v-checkbox
                  v-model="isHiddenName"
                  label="Hide My Information"
                  class="font-weight-medium"
                ></v-checkbox>
              </v-col>
          </v-row>
       </div>
          <v-row v-else>
            <v-col cols="12">
              <p class="text-center">No questions found</p>
            </v-col>
          </v-row>
        </v-container>
      </v-card-text>
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn text color="primary" @click="evaluateDialog = false">
          Cancel
        </v-btn>
        <v-btn
          :loading="loading"
          color="primary"
          @click="addEvaluation"
          v-if="questions != null && questions.length > 0"
        >
          Send
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
<style scoped>
.score-display {
  font-weight: 500;
  margin-top: 0.5rem;
}

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

.question-section {
  border: 1px solid #e2e2e2;
  border-radius: 16px;
}
</style>
