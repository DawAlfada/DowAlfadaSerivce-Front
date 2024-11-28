<script setup>
import { ref, onMounted, computed, watch } from "vue";
import { useUserStore } from "@/store/user";
import UiParentCard from "@/components/shared/UiParentCard.vue";
import { useRuntimeConfig } from "#app";

const config = useRuntimeConfig();
const userStore = useUserStore();

definePageMeta({
  requiresAdmin: true,
  title: "Evaluation Report",
});

const Report = ref([]);
const totalCount = ref(0);
const loading = ref(false);
const errorMessage = ref(false);
const successMessage = ref(false);

const downloadAttachment = (url) => {
  window.open(url, "_blank");
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
  fetchReport();
});

const searchTerm = ref("");
const searchInfo = ref({});
const employeeName = ref("");
const startDate = ref("");
const endDate = ref("");
const leaveBased = ref("");
const vacationTypeId = ref("");

const formatDate = (date) => date.toString().split("T")[0];

const LeaveDescription = ref("");
const showDesDialog = ref(false);

const showDes = (description) => {
  LeaveDescription.value = description;
  showDesDialog.value = true;
};

const formatTime = (time) => {
  const [hours, minutes] = time.split(":");
  const period = hours >= 12 ? "PM" : "AM";
  const adjustedHours = hours % 12 || 12;
  return `${adjustedHours}:${minutes} ${period}`;
};

const fetchReport = async () => {
  loading.value = true;
  try {
    const response = await fetch(
      `${config.public.apiUrl}/EmployeeLeave/GetReport?Page=${currentPage.value}&PageSize=${pageSize.value}&EmployeeName=${employeeName.value}&StartDate=${startDate.value}&EndDate=${endDate.value}&LeaveBased=${leaveBased.value}&VacationTypeId=${vacationTypeId.value}`,
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${userStore.token}`,
        },
      }
    );
    const data = await response.json();
    if (!data.error) {
      Report.value = data.data.items;
      totalCount.value = data.data.totalCount;
    }
  } catch (error) {
    errorMessage.value = "Failed to fetch Report";
  } finally {
    loading.value = false;
  }
};

const filteredReport = computed(() =>
  Report.value.filter((Report) =>
    Report.employee.name.toLowerCase().includes(searchTerm.value.toLowerCase())
  )
);

onMounted(() => {
  fetchReport();
});
</script>

<template>
  <v-row>
    <v-col cols="12" md="12">
      <UiParentCard title="Employee Leave Report">
        <v-alert v-if="errorMessage" type="error" dismissible>{{
          errorMessage
        }}</v-alert>
        <v-alert v-if="successMessage" type="success" dismissible>{{
          successMessage
        }}</v-alert>

        <v-container>
          <v-row class="mb-4">
            <v-col cols="12" sm="6" md="4">
              <v-text-field
                v-model="searchTerm"
                label="Search by Report Name"
              ></v-text-field>
            </v-col>
            <v-col cols="12" sm="6" md="4">
              <v-text-field
                v-model="employeeName"
                label="Employee Name"
              ></v-text-field>
            </v-col>

            <v-col cols="12" sm="6" md="4">
              <v-text-field
                v-model="startDate"
                label="Start Date"
                type="date"
              ></v-text-field>
            </v-col>

            <v-col cols="12" sm="6" md="4">
              <v-text-field
                v-model="endDate"
                label="End Date"
                type="date"
              ></v-text-field>
            </v-col>

            <v-col cols="12" sm="6" md="4">
              <v-select
                v-model="leaveBased"
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

            <!-- btn -->
            <v-col cols="12" sm="6" md="4">
              <v-btn @click="fetchReport" color="primary" dark>Search</v-btn>
            </v-col>
          </v-row>

          <v-table density="compact" class="custom-table">
            <thead>
              <tr>
                <th class="text-left">Employee Name</th>
                <th class="text-left">Leave Name</th>
                <th class="text-left">Insert Date</th>
                <th class="text-left">Approved Date</th>
                <th class="text-left">Leave Based</th>
                <th class="text-left">From - To</th>
                <th class="text-left">Description</th>
                <th class="text-left">Manager Description</th>
                <th class="text-left">Attachment</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="item in filteredReport"
                :key="item.id"
                :class="{
                  'highlight-row': item.vacationType && item.leaveBased === 0,
                  'default-row': item.vacationType && item.leaveBased !== 0,
                }"
              >
                <td>{{ item.employee?.name || "-" }}</td>
                <td>{{ item.vacationType?.name || "-" }}</td>
                <td>
                  {{
                    item.insertDate != null ? formatDate(item.insertDate) : "-"
                  }}
                </td>
                <td>
                  {{
                    item.approvedDate != null
                      ? formatDate(item.approvedDate)
                      : "-"
                  }}
                </td>
                <td>
                  {{
                    item.vacationType?.leaveBased === 0
                      ? "Day Based"
                      : "Hour Based"
                  }}
                </td>
                <td>
                  <span v-if="item.leaveBased === 0">
                    {{ formatDate(item.startDate) || "-" }} -
                    {{ formatDate(item.endDate) || "-" }}
                  </span>
                  <span v-else>
                    {{ formatTime(item.startTime) || "-" }} -
                    {{ formatTime(item.endTime) || "-" }}
                  </span>
                </td>
                <td>
                  <v-icon
                    v-if="item.description"
                    @click="showDes(item.description)"
                    color="primary"
                    >mdi-eye</v-icon
                  >
                  <span v-else>Not Available</span>
                </td>
                <td>
                  <v-icon
                    v-if="item.managerDescription"
                    @click="showDes(item.managerDescription)"
                    color="primary"
                    >mdi-eye</v-icon
                  >
                  <span v-else>Not Available</span>
                </td>
                <td>
                  <v-icon
                    v-if="item.attachment"
                    color="primary"
                    @click="downloadAttachment(item.fileFullUrl)"
                    >mdi-paperclip</v-icon
                  >
                  <v-icon v-else color="grey">mdi-paperclip</v-icon>
                </td>
              </tr>
            </tbody>
          </v-table>
        </v-container>
        <v-pagination
            v-model="currentPage"
            :length="totalPages"
            @input="fetchReport"
            class="mt-4"
          ></v-pagination>
      </UiParentCard>
    </v-col>
  </v-row>
</template>
