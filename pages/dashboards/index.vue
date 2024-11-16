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

    <!-- Outside Complaint Counts Section -->
    <v-row dense>
      <v-col cols="12" sm="6" md="4" lg="3" v-for="(value, key, index) in outsideComplaintCount" :key="index">
        <CountCard
          :title="formatKey(key)"
          :count="value"
          color="#81c784" 
        />
      </v-col>
    </v-row>

    <!-- Evaluation Campaign Section -->
    <v-row>
      <v-col cols="12">
        <v-card class="pa-4" elevation="2">
          <v-card-title class="d-flex justify-space-between align-center">
            <h2 class="font-weight-bold">Evaluation Campaign Data</h2>
            <v-icon color="primary">mdi-chart-bar</v-icon>
          </v-card-title>
          <v-card-text>
            <EvaluationCamoaign :categories="categories" :data="dataCounts" />
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
import EvaluationCamoaign from "~/components/dashboard/EvaluationCamoaign.vue";
import { ref, onMounted } from "vue";
import { useUserStore } from "@/store/user";
import { useRuntimeConfig } from "#app";
import CountCard from "~/components/dashboard/CountCard.vue";

const config = useRuntimeConfig();
const userStore = useUserStore();


definePageMeta({
  requiresAdmin: true, 
  title: "Dashboard",
});


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

const outsideComplaintCount = ref({
  outSideComplaintCounts: 0,
  outSideComplaintClosedCounts: 0,
  outSideComplaintOpenCounts: 0,
  outSideComplaintInProgressCounts: 0,
  outSideComplaintRejectCounts: 0,
});

onMounted(() => {
  getCounts();
  getEvaluationCountsByMonth();
});

const getEvaluationCountsByMonth = async () => {
  loading.value = true;
  try {
    const response = await fetch(
      `${config.public.apiUrl}/Dashboad/GetEvaluationCountsByMonth`,
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${userStore.token}`,
        },
      }
    );
    const data = await response.json();
    if (!data.error) {
      dataCounts.value = data.data.evaluationCount;
      categories.value = data.data.campaign;
    }
  } catch (error) {
    console.error("Failed to fetch campaigns", error);
  } finally {
    loading.value = false;
  }
};

const getCounts = async () => {
  loading.value = true;
  try {
    const response = await fetch(`${config.public.apiUrl}/Dashboad`, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${userStore.token}`,
      },
    });
    const data = await response.json();
    if (!data.error) {
      // توزيع البيانات على الأقسام
      mainCount.value = {
        employeeCounts: data.data.employeeCounts,
        departmentCounts: data.data.departmentCounts,
        evaluationCampaignCounts: data.data.evaluationCampaignCounts,
        feedbackCounts: data.data.feedbackCounts,
      };

      complaintCount.value = {
        complaintCounts: data.data.complaintCounts,
        complaintClosedCounts: data.data.complaintClosedCounts,
        complaintOpenCounts: data.data.complaintOpenCounts,
        complaintInProgressCounts: data.data.complaintInProgressCounts,
        complaintRejectCounts: data.data.complaintRejectCounts,
      };

      outsideComplaintCount.value = {
        outSideComplaintCounts: data.data.outSideComplaintCounts,
        outSideComplaintClosedCounts: data.data.outSideComplaintClosedCounts,
        outSideComplaintOpenCounts: data.data.outSideComplaintOpenCounts,
        outSideComplaintInProgressCounts: data.data.outSideComplaintInProgressCounts,
        outSideComplaintRejectCounts: data.data.outSideComplaintRejectCounts,
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
