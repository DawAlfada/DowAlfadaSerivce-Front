<template>
  <v-container>
    <v-row dense>
      <v-col
        cols="12"
        sm="6"
        md="4"
        lg="3"
        v-for="(value, key, index) in mainCount"
        :key="index"
      >
        <CountCard :title="formatKey(key)" :count="value" color="#65d6e7" />
      </v-col>
    </v-row>
    <hr class="m-1" />
    <v-row dense>
      <v-col
        cols="12"
        sm="6"
        md="4"
        lg="3"
        v-for="(value, key, index) in complaintCount"
        :key="index"
      >
        <CountCard :title="formatKey(key)" :count="value" color="#ff7043" />
      </v-col>
    </v-row>

    <hr class="m-1" />
    <v-row dense>
      <v-col cols="12">
        <v-card>
          <v-card-title class="text-center font-weight-bold">
          Leave  Time Counts
          </v-card-title>
          <v-card-text>
            <v-table density="compact" class="custom-table">
              <template v-slot:default>
                <thead>
                  <tr>
                    <th class="text-left">Name</th>
                    <th class="text-left">Total Count</th>
                    <th class="text-left">Used Count</th>
                    <th class="text-left">Remaining Count</th>
                    <th class="text-left">Month</th>
                    <th class="text-left">Year</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(item, index) in dataTimeCounts" :key="index">
                    <td class="text-left">{{ item.leaveTypeName }}</td>
                    <td class="text-left">{{ item.total }}</td>
                    <td class="text-left">{{ item.leaveHoursCount }}</td>
                    <td class="text-left">{{ item.remainingHoursCount }}</td>
                    <td class="text-left">
                      <span v-if="!isValidDate(item.startDate) && !isValidDate(item.endDate)">
                        {{ formatTime(item.startTime) }} - {{ formatTime(item.endTime) }}
                      </span>
                      <span v-else>
                        {{ formatDate(item.startDate) }} - {{ formatDate(item.endDate) }}
                      </span>
                    </td>
                    <td class="text-left">{{ item.month }}</td>
                    <td class="text-left">{{ item.year }}</td>
                  </tr>
                </tbody>
              </template>
            </v-table>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

  </v-container>
</template>

<script setup>
// Helper to check for valid date
function isValidDate(date) {
  return date && date !== "0001-01-01T00:00:00";
}

// Helper to format date
function formatDate(date) {
  if (!isValidDate(date)) return "-";
  return date.split("T")[0];
}

// Helper to format time
function formatTime(time) {
  if (!time) return "-";
  // If time is already in HH:mm:ss or HH:mm format
  const parts = time.split(":");
  if (parts.length >= 2) {
    return `${parts[0]}:${parts[1]}`;
  }
  return time;
}
import { ref, onMounted } from "vue";
import { useUserStore } from "@/store/user";
import { useRuntimeConfig } from "#app";
import CountCard from "~/components/dashboard/CountCard.vue";

const config = useRuntimeConfig();
const userStore = useUserStore();

const dataTimeCounts = ref([]);
const dataLeaveCounts = ref([]);
const categories = ref([]);
const loading = ref(false);

const GetEmployeeDashboadTimeLeaveCounts = async () => {
  loading.value = true;
  try {
    const response = await fetch(
      `${config.public.apiUrl}/Dashboad/GetEmployeeDashboadTimeLeaveCounts`,
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${userStore.token}`,
        },
      }
    );
    const data = await response.json();
    if (!data.error) {
      dataTimeCounts.value = data.data;
      categories.value = data.data.map((item) => item.name);
    }
  } catch (error) {
    console.error("Failed to fetch time leave counts", error);
  } finally {
    loading.value = false;
  }
};

const GetEmployeeDashboadLeaveCounts = async () => {
  loading.value = true;
  try {
    const response = await fetch(
      `${config.public.apiUrl}/Dashboad/GetEmployeeDashboadLeaveCounts`,
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${userStore.token}`,
        },
      }
    );
    const data = await response.json();
    if (!data.error) {
      dataLeaveCounts.value = data.data;
    }
  } catch (error) {
    console.error("Failed to fetch leave counts", error);
  } finally {
    loading.value = false;
  }
};

const mainCount = ref({
  employeeCounts: 0,
  departmentCounts: 0,
  evaluationCampaignCounts: 0,
  feedbackCounts: 0,
});

const complaintCount = ref({
  complaintCounts: 0,
  complaintClosedCounts: 0,
  complaintOpenCounts: 0,
  complaintInProgressCounts: 0,
  complaintRejectCounts: 0,
});

onMounted(() => {
  getCounts();
  GetEmployeeDashboadTimeLeaveCounts();
  GetEmployeeDashboadLeaveCounts();
});

const getCounts = async () => {
  loading.value = true;
  try {
    const response = await fetch(
      `${config.public.apiUrl}/Dashboad/GetEmployeeDashboad`,
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${userStore.token}`,
        },
      }
    );
    const data = await response.json();
    if (!data.error) {
      mainCount.value = {
        employeeCounts: data.data.employeeCounts,
        evaluationCampaignCounts: data.data.evaluationCampaignCounts,
      };

      complaintCount.value = {
        complaintCounts: data.data.complaintCounts,
        complaintClosedCounts: data.data.complaintClosedCounts,
        complaintOpenCounts: data.data.complaintOpenCounts,
        complaintInProgressCounts: data.data.complaintInProgressCounts,
        complaintRejectCounts: data.data.complaintRejectCounts,
        complaintAgainstYouCount: data.data.complaintAgainstYouCount,
      };
    }
  } catch (error) {
    console.error("Failed to fetch counts", error);
  } finally {
    loading.value = false;
  }
};

const formatKey = (key) => {
  return key
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (str) => str.toUpperCase())
    .replace("Counts", " Count");
};
</script>

<style scoped>
.text-center {
  text-align: center;
}

.font-weight-bold {
  font-weight: bold;
}

.font-weight-medium {
  font-weight: 500;
}

.text-primary {
  color: #1976d2;
}
</style>
