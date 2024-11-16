<script setup>
import { ref, onMounted, computed, watch } from "vue";
import { useUserStore } from "@/store/user";
import UiParentCard from "@/components/shared/UiParentCard.vue";
import { useRuntimeConfig } from "#app";

const config = useRuntimeConfig();
const userStore = useUserStore();

const Evaluation = ref([]);
const totalCount = ref(0);
const loading = ref(false);
const errorMessage = ref(false);
const successMessage = ref(false);
const isSelectingCampaign = ref(false);
const currentPage = ref(1);
const pageSize = ref(10);
const showDetailsDialog = ref(false);
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
const handleImageError = (event, fallbackImage) => {
  event.target.src = `data:image/jpeg;base64,${fallbackImage}`;
};
const selectedCampaign = (value) => {
  searchInfo.value.campaignId = value;
  isSelectingCampaign.value = true;
  fetchAllEvaluation();
  fetchDepartments();
};

const selectedDepartment = (value) => {
  employeeSearchInfo.value.departmentId = value;
  searchInfo.value.departmentId = value;
  searchInfo.value.departmentId = Number(value);
  if (value == null) {
    fetchAllEvaluation();
    employees.value = [];
  } else {
    fetchAllEvaluation();
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
  if (percentage >= 80) return "success";
  if (percentage >= 60) return "warning";
  return "error";
};
const fetchAllEvaluation = async () => {
  console.log(searchInfo.value.departmentId);

  loading.value = true;
  try {
    const baseUrl = props.isAll
      ? `${config.public.apiUrl}/Evaluation/GetAllEvaluation`
      : `${config.public.apiUrl}/Evaluation/MyEvaluations`;

    const queryParams = new URLSearchParams({
      Page: currentPage.value,
      PageSize: pageSize.value,
      EvaluatorId: searchInfo.value.employeeId,
      EvaluationCampaignId: searchInfo.value.campaignId,
      EvaluatorDepartmentId:
        searchInfo.value.departmentId === 0
          ? ""
          : searchInfo.value.departmentId,
    });

    if (!props.isAll) {
      queryParams.append("IsRescived", props.isReceived);
    }

    const response = await fetch(`${baseUrl}?${queryParams}`, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${userStore.token}`,
      },
    });

    const data = await response.json();

    if (response.ok && !data.error) {
      Evaluation.value = data.data.items;
      totalCount.value = data.data.totalCount;
    } else {
      errorMessage.value = data.message || "Failed to fetch evaluations.";
    }
  } catch (error) {
    errorMessage.value = "An error occurred while fetching evaluations.";
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
      `${config.public.apiUrl}/Employee?Page=1&PageSize=100&DepartmentId=${
        employeeSearchInfo.value.departmentId == null
          ? ""
          : employeeSearchInfo.value.departmentId
      }`,
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
        <v-alert v-if="errorMessage" type="error" dismissible>{{
          errorMessage
        }}</v-alert>
        <v-alert v-if="successMessage" type="success" dismissible>{{
          successMessage
        }}</v-alert>
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
                v-model="searchInfo.employeeId"
                :items="employees"
                item-title="displayName"
                item-value="id"
                label="Employee"
                clearable
                outlined
                dense
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
        </v-container>

        <v-container>
          <v-table>
            <thead>
              <tr>
                <th class="text-left">Evaluator</th>
                <th class="text-left">Deparment</th>
                <th class="text-left">Evaluatee</th>
                <th class="text-left">Deparment</th>
                <th class="text-left">Questions</th>

                <th class="text-left">Date</th>
                <th class="text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in Evaluation" :key="item.id">
                <td>
                  <div class="employee-table-info">
                    <v-avatar
                      size="40"
                      class="mr-4"
                      v-if="item.evaluator.image512 != 'Anonymous'"
                    >
                      <img
                        :src="
                          item.evaluator.image512
                            ? `data:image/svg+xml;base64,${item.evaluator.image512}`
                            : 'fallback-image-url.jpg'
                        "
                        @error="
                          handleImageError($event, item.evaluator.image512)
                        "
                        width="40"
                        height="40"
                        alt="user"
                        class="avatar"
                      />
                    </v-avatar>
                    <v-avatar size="40" class="mr-4" v-else>
                      <img
                        src="../../assets/images/anonymous.png"
                        width="40"
                        height="40"
                        alt="user"
                        class="avatar"
                      />
                    </v-avatar>

                    <div>
                      {{ item.evaluator.name }}
                      <v-icon v-if="item.isManager" class="mr-2 managerIcon" color="primary"
                        >mdi-star</v-icon
                      >
                      <v-icon v-else class="mr-2 managerIcon" color="primary"
                        >mdi-account</v-icon
                      ><br /><span class="jot-title">{{
                        item.evaluator.jobTitle
                      }}</span>
                    </div>
                  </div>
                </td>
                <td>{{ item.evaluator.departmentName }}</td>
                <td>
                  <div class="employee-table-info">
                    <v-avatar
                      size="40"
                      class="mr-4"
                      v-if="item.evaluatee.image512 != 'Anonymous'"
                    >
                      <img
                        :src="
                          item.evaluator.image512
                            ? `data:image/svg+xml;base64,${item.evaluatee.image512}`
                            : 'fallback-image-url.jpg'
                        "
                        @error="
                          handleImageError($event, item.evaluatee.image512)
                        "
                        width="40"
                        height="40"
                        alt="user"
                        class="avatar"
                      />
                    </v-avatar>
                    <v-avatar size="40" class="mr-4" v-else>
                      <img
                        src="../../../assets/images/anonymous.png"
                        width="40"
                        height="40"
                        alt="user"
                        class="avatar"
                      />
                    </v-avatar>

                    <div>
                      {{ item.evaluatee.name }}
                      <v-icon v-if="item.isManager" class="mr-2 managerIcon" color="primary"
                        >mdi-star</v-icon
                      >
                      <v-icon v-else class="mr-2 managerIcon" color="primary"
                        >mdi-account</v-icon
                      ><br /><span class="jot-title">{{
                        item.evaluatee.jobTitle
                      }}</span>
                    </div>
                  </div>
                </td>

                <td>{{ item.evaluatee.departmentName }}</td>
                <td>{{ item.details != null ? item.details.length : 0 }}</td>
                <td>{{ item.createdAt.toString().split("T")[0] }}</td>
                <!-- show result  -->
                <td>
                  <v-btn color="primary" @click="showResult(item)">
                    Show Result
                  </v-btn>
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
        <v-dialog v-model="showDetailsDialog" max-width="900px">
          <v-card>
            <v-card-title class="primary white--text text-h5 py-4">
              Evaluation Details
            </v-card-title>

            <v-card-text class="pa-6">
              <v-row>
                <v-col cols="12" md="6">
                  <v-card outlined class="pa-4 rounded-lg">
                    <div class="text-h6 primary--text mb-4">
                      Evaluator Information
                    </div>
                    <v-list-item two-line>
                      <v-list-item-content>
                        <v-list-item-subtitle class="text-caption mb-1"
                          >Name</v-list-item-subtitle
                        >
                        <v-list-item-title class="font-weight-medium">
                          {{ selectedEvaluation.evaluator.name }}
                        </v-list-item-title>
                      </v-list-item-content>
                    </v-list-item>
                    <v-divider class="my-2"></v-divider>
                    <v-list-item two-line>
                      <v-list-item-content>
                        <v-list-item-subtitle class="text-caption mb-1"
                          >Department</v-list-item-subtitle
                        >
                        <v-list-item-title class="font-weight-medium">
                          {{ selectedEvaluation.evaluator.departmentName }}
                        </v-list-item-title>
                      </v-list-item-content>
                    </v-list-item>
                  </v-card>
                </v-col>

                <!-- Evaluatee Card -->
                <v-col cols="12" md="6">
                  <v-card outlined class="pa-4 rounded-lg">
                    <div class="text-h6 primary--text mb-4">
                      Evaluatee Information
                    </div>
                    <v-list-item two-line>
                      <v-list-item-content>
                        <v-list-item-subtitle class="text-caption mb-1"
                          >Name</v-list-item-subtitle
                        >
                        <v-list-item-title class="font-weight-medium">
                          {{ selectedEvaluation.evaluatee.name }}
                        </v-list-item-title>
                      </v-list-item-content>
                    </v-list-item>
                    <v-divider class="my-2"></v-divider>
                    <v-list-item two-line>
                      <v-list-item-content>
                        <v-list-item-subtitle class="text-caption mb-1"
                          >Department</v-list-item-subtitle
                        >
                        <v-list-item-title class="font-weight-medium">
                          {{ selectedEvaluation.evaluatee.departmentName }}
                        </v-list-item-title>
                      </v-list-item-content>
                    </v-list-item>
                  </v-card>
                </v-col>
              </v-row>

              <!-- Questions Section -->
              <div class="text-h6 primary--text mt-6 mb-4">
                Questions and Assessment
              </div>
              <v-card
                v-for="(detail, index) in selectedEvaluation.details"
                :key="index"
                outlined
                class="mb-4 rounded-lg"
              >
                <v-card-text>
                  <v-row align="center" no-gutters>
                    <v-col cols="12" md="8">
                      <div class="text-subtitle-1 font-weight-medium">
                        {{ detail.question.text }}
                      </div>
                    </v-col>

                    <v-col cols="6" md="2" class="text-center">
                      <v-chip label outlined color="primary" class="ma-2">
                        <v-icon left small>mdi-star</v-icon>
                        Points: {{ detail.question.points }}
                      </v-chip>
                    </v-col>

                    <v-col cols="6" md="2" class="text-center">
                      <v-chip
                        label
                        :color="
                          getScoreColor(detail.score, detail.question.points)
                        "
                        dark
                        class="ma-2"
                      >
                        <v-icon left small>mdi-check</v-icon>
                        Score: {{ detail.score }}
                      </v-chip>
                    </v-col>
                  </v-row>
                </v-card-text>
              </v-card>
            </v-card-text>

            <v-card-actions class="pa-6 pt-0">
              <v-spacer></v-spacer>
              <v-btn color="primary" text @click="showDetailsDialog = false">
                Close
              </v-btn>
            </v-card-actions>
          </v-card>
        </v-dialog>
      </UiParentCard>
    </v-col>
  </v-row>

  <!-- result d -->
</template>
