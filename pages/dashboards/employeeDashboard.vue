<template>
  <v-container>
    <!-- Main Counts Section -->
    <v-row dense>
      <v-col cols="12" sm="6" md="4" lg="3" v-for="(value, key, index) in mainCount" :key="index">
        <CountCard
          :title="formatKey(key)"
          :count="value"
          color="#65d6e7"
        />
      </v-col>
    </v-row>
    <hr class="m-1">
    <!-- Complaint Counts Section -->
    <v-row dense>
      <v-col cols="12" sm="6" md="4" lg="3" v-for="(value, key, index) in complaintCount" :key="index">
        <CountCard
          :title="formatKey(key)"
          :count="value"
          color="#ff7043"
        />
      </v-col>
    </v-row>
<hr class="m-1">



  </v-container>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { useUserStore } from "@/store/user";
import { useRuntimeConfig } from "#app";
import CountCard from "~/components/dashboard/CountCard.vue";

const config = useRuntimeConfig();
const userStore = useUserStore();


const dataCounts = ref([]);
const categories = ref([]);
const loading = ref(false);

// تقسيم البيانات إلى أقسام
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
});


const getCounts = async () => {
  loading.value = true;
  try {
    const response = await fetch(`${config.public.apiUrl}/Dashboad/GetEmployeeDashboad`, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${userStore.token}`,
      },
    });
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
