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
const userStore = useUserStore();

const EvaluationResult = ref([]);
const totalCount = ref(0);
const loading = ref(false);
const errorMessage = ref(false);
const successMessage = ref(false);
const isSelectingCampaign = ref(false);
const currentPage = ref(1);
const pageSize = ref(10);
const selectedEvaluation = ref(null);
const totalPages = computed(() => Math.ceil(totalCount.value / pageSize.value));

const props = defineProps({
  isReceived: {
    type: Boolean,
    default: false,
  },
  isAll: {
    type: Boolean,
    default: false,
  },
});

watch(currentPage, () => {
  fetchQuestions();
});

onMounted(() => {
  fetchCampaigns();
});

const showResult = (item) => {
  selectedEvaluation.value = item;
  showDetailsDialog.value = true;
};

const selectedCampaign = (value) => {
  searchInfo.value.campaignId = value;
  isSelectingCampaign.value = true;
  fetchAllGetEvaluationResult();
  fetchDepartments();
};

const selectedDepartment = (value) => {
  employeeSearchInfo.value.departmentId = value;
  searchInfo.value.departmentId = Number(value);
  if (value == null) {
    fetchAllGetEvaluationResult();
    employees.value = [];
  } else {
    fetchAllGetEvaluationResult();
    fetchEmployees();
  }
};

const employeeSearchInfo = ref({
  departmentId: "",
  employeeName: "",
});

const searchInfo = ref({
  departmentId: "",
  employeeId: "",
  campaignId: "",
});

const getScoreColor = (score, maxPoints) => {
  const percentage = (score / maxPoints) * 100;
  if (percentage >= 80) return "text-success";
  if (percentage >= 60) return "text-warning";
  return "text-error";
};

const fetchAllGetEvaluationResult = async () => {
  loading.value = true;
  try {
    const baseUrl = `${config.public.apiUrl}/Evaluation/GetEvaluationResult`;
    const queryParams = new URLSearchParams({
      Page: currentPage.value,
      PageSize: pageSize.value,
      employeeName: searchInfo.value.employeeId,
      campaignId: searchInfo.value.campaignId,
      departmentId: searchInfo.value.departmentId === 0 ? "" : searchInfo.value.departmentId,
    });

    if (!props.isAll) {
      queryParams.append("IsReceived", props.isReceived);
    }

    const response = await fetch(`${baseUrl}?${queryParams}`, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${userStore.token}`,
      },
    });

    const data = await response.json();

    if (response.ok && !data.error) {
      EvaluationResult.value = data.data.items;
      totalCount.value = data.data.totalCount;
    } else {
      errorMessage.value = data.message || "Failed to fetch EvaluationResult.";
    }
  } catch (error) {
    errorMessage.value = "An error occurred while fetching EvaluationResult.";
  } finally {
    loading.value = false;
  }
};

const formattedScore = (value) => Number(value).toFixed(2);

const departments = ref([]);
const fetchDepartments = async () => {
  try {
    const response = await fetch(`${config.public.apiUrl}/Department?Page=1&PageSize=100`, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${userStore.token}`,
      },
    });
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
      `${config.public.apiUrl}/Employee?Page=1&PageSize=100&DepartmentId=${
        employeeSearchInfo.value.departmentId == null ? "" : employeeSearchInfo.value.departmentId
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
      <UiParentCard title="My Evaluation">
        <v-alert v-if="errorMessage" type="error" dismissible>{{ errorMessage }}</v-alert>
        <v-alert v-if="successMessage" type="success" dismissible>{{ successMessage }}</v-alert>
        <v-container>
          <v-row>
            <v-col cols="12" sm="6" md="3">
              <v-select
                v-model="searchInfo.departmentId"
                :items="departments"
                item-title="name"
                item-value="oodoDepartmentId"
                label="Department"
                clearable
                @update:model-value="selectedDepartment($event)"
              ></v-select>
            </v-col>

            <v-col cols="12" sm="6" md="3">
              <v-select
                v-model="searchInfo.employeeId"
                :items="employees"
                item-title="displayName"
                item-value="id"
                label="Employee"
                clearable
                outlined
                dense
              ></v-select>
            </v-col>
          </v-row>
        </v-container>

        <v-container>
          <v-table>
            <thead>
              <tr>
                <th class="text-left">Employee Name</th>
                <th class="text-left">Count Of Evaluation</th>
                <th class="text-left">Question Total Point</th>
                <th class="text-left">Evaluation Total Score</th>
                <th class="text-left">Final Result</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in EvaluationResult" :key="item.id">
                <td>{{ item.employeeName }}</td>
                <td>{{ item.countOfEvaluation }}</td>
                <td>{{ item.questionTotalPoint }}</td>
                <td>{{ item.evaluationTotalScore }}</td>
                <td>
                  <span :class="getScoreColor(formattedScore(item.finalResult), item.questionTotalPoint)">
                    {{ formattedScore(item.finalResult) }}
                  </span>
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
</template>
