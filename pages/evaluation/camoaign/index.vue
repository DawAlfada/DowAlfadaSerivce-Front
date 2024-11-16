<script setup>
import { ref, onMounted, computed, watch } from "vue";
import { useUserStore } from "@/store/user"; // Import the store
import UiParentCard from "@/components/shared/UiParentCard.vue";
import { useRuntimeConfig } from '#app';

const config = useRuntimeConfig();
// Initialize the user store to access the token
const userStore = useUserStore();

definePageMeta({
  requiresAdmin: true, 
  title: "Evaluation Campaigns",
});


// Data variables
const campaigns = ref([]);
const totalCount = ref(0);
const loading = ref(false);
const errorMessage = ref(false);
const successMessage = ref(false);

// Date variable
const model = ref(new Date().toISOString().substr(0, 10));

// Pagination
const currentPage = ref(1);
const pageSize = ref(10);
const totalPages = computed(() => Math.ceil(totalCount.value / pageSize.value));
watch(currentPage, () => {
  fetchCampaigns();
});

// Search
const searchTerm = ref("");

// Campaign Form
const newCampaign = ref({
  campaignName: "",
  startDate: "",
  endDate: "",
  isActive: true,
});
const isEditing = ref(false);
const editingCampaignId = ref(null);

const deleteDialog = ref(false);
const campaignToDelete = ref(null);

// Fetch campaigns
const fetchCampaigns = async () => {
  loading.value = true;
  try {
    const response = await fetch(
      `${config.public.apiUrl}/Evaluation/GetAllEvaluationCampaign?Page=${currentPage.value}&PageSize=${pageSize.value}&CampaignName=${searchTerm.value}`,
      {
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${userStore.token}`, // Use the token from the store
        },
      }
    );
    const data = await response.json();
    if (!data.error) {
      campaigns.value = data.data.items;
      totalCount.value = data.data.totalCount;
    }
  } catch (error) {
    errorMessage.value = "Failed to fetch campaigns";
  } finally {
    loading.value = false;
  }
};

const filteredCampaigns = computed(() => {
  return campaigns.value.filter((campaign) =>
    campaign.campaignName.toLowerCase().includes(searchTerm.value.toLowerCase())
  );
});

const submitCampaign = async () => {
   errorMessage.value = ""; 
   successMessage.value = "";

  if (!newCampaign.value.campaignName) {
    errorMessage.value = "Please fill in Campaign Name fields";
    return;
  }

  if (!newCampaign.value.startDate || !newCampaign.value.endDate) {
    errorMessage.value = "Please fill Dates fields";
    return;
  }

  if (new Date(newCampaign.value.startDate) > new Date(newCampaign.value.endDate)) {
    errorMessage.value = "Start Date cannot be greater than End Date";
    return;
  }


  loading.value = true;
  try {
    const url = isEditing.value
      ? `${config.public.apiUrl}/Evaluation/UpdateEvaluationCampaign?id=${editingCampaignId.value}`
      : `${config.public.apiUrl}/Evaluation/CreateEvaluationCampaign`;

    const method = isEditing.value ? "PUT" : "POST";
    const response = await fetch(url, {
      method,
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${userStore.token}`, // Use the token for authorization
      },
      body: JSON.stringify(newCampaign.value),
    });

    const data = await response.json();
    if (!data.error) {
      successMessage.value = data.message;
      resetForm();
      fetchCampaigns();
    } else {
      throw new Error(data.message);
    }
  } catch (error) {
    errorMessage.value = error.message || "Failed to submit campaign";
  } finally {
    loading.value = false;
  }
};

const confirmDeleteCampaign = (campaign) => {
  campaignToDelete.value = campaign;
  deleteDialog.value = true;
};

const deleteCampaign = async () => {
  loading.value = true;
  deleteDialog.value = false;
  try {
    const response = await fetch(
      `${config.public.apiUrl}/Evaluation/DeleteEvaluationCampaignn?id=${campaignToDelete.value.id}`,
      {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${userStore.token}`, // Use the token here as well
        },
      }
    );
    const data = await response.json();
    if (!data.error) {
      successMessage.value = data.message;
      fetchCampaigns();
    } else {
      throw new Error(data.message);
    }
  } catch (error) {
    errorMessage.value = error.message || "Failed to delete campaign";
  } finally {
    loading.value = false;
  }
};

const resetForm = () => {
  newCampaign.value = {
    campaignName: "",
    startDate: "",
    endDate: "",
    isActive: true,
  };
  isEditing.value = false;
  editingCampaignId.value = null;
};

onMounted(() => {
  fetchCampaigns();
});
</script>

<template>
  <v-row>
    <v-col cols="12" md="12">
      <UiParentCard title="Manage Campaigns">
        <v-alert v-if="errorMessage" type="error" dismissible>{{
          errorMessage
        }}</v-alert>
        <v-alert v-if="successMessage" type="success" dismissible>{{
          successMessage
        }}</v-alert>

<v-form @submit.prevent="submitCampaign">
      <v-container class="mb-6">
        <v-row>
          <v-col cols="12" sm="6" md="3">
            <v-text-field
              v-model="newCampaign.campaignName"
              label="Campaign Name"
              required
            ></v-text-field>
          </v-col>
          <v-col cols="12" sm="6" md="3">
            <v-text-field
              v-model="newCampaign.startDate"
              type="date"
              label="Start Date"
              required
            ></v-text-field>
          </v-col>
          <v-col cols="12" sm="6" md="3">
            <v-text-field
              type="date"
              v-model="newCampaign.endDate"
              label="End Date"
              required
            ></v-text-field>
          </v-col>
          <v-col cols="12" sm="6" md="3">
            <v-checkbox
              v-model="newCampaign.isActive"
              label="Is Active"
            ></v-checkbox>
          </v-col>
        </v-row>
        <v-btn
          :loading="loading"
          type="submit"
          color="primary"
          class="mr-2"
        >
          {{ isEditing ? "Update Campaign" : "Create Campaign" }}
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
            label="Search by Campaign Name"
            @input="fetchCampaigns"
          ></v-text-field>
        </v-col>
      </v-row>

      <v-table density="compact">
        <thead>
          <tr>
            <th class="text-left">Name</th>
            <th class="text-left">Start Date</th>
            <th class="text-left">End Date</th>
            <th class="text-left">Insert Date</th>
            <th>Active Status</th>
            <th class="text-left">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in filteredCampaigns" :key="item.id">
            <td>{{ item.campaignName }}</td>
            <td>{{ item.startDate.toString().split("T")[0] }}</td>
            <td>{{ item.endDate.toString().split("T")[0] }}</td>
            <td>{{ item.createdAt.toString().split("T")[0] }}</td>
            <td>{{ item.isActive ? "Active" : "Inactive" }}</td>
            <td>
              <v-btn
                density="default"
                icon="mdi-open-in-new"
                @click="
                  isEditing = true;
                  editingCampaignId = item.id;
                  item.startDate = item.startDate.toString().split('T')[0];
                  item.endDate = item.endDate.toString().split('T')[0];
                  newCampaign = { ...item };
                "
                color="success"
                class="ma-2"
              ></v-btn>

              <v-btn
                density="default"
                icon="mdi-delete"
                @click="confirmDeleteCampaign(item)"
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
        @input="fetchCampaigns"
        class="mt-4"
      ></v-pagination>
    </v-container>
  </UiParentCard>
</v-col>
  </v-row>

  <v-dialog v-model="deleteDialog" max-width="400">
    <v-card>
      <v-card-title class="headline">Confirm Deletion</v-card-title>
      <v-card-text>Are you sure you want to delete this campaign?</v-card-text>
      <v-card-actions>
        <v-btn color="primary" text @click="deleteDialog = false">Cancel</v-btn>
        <v-btn color="red" text @click="deleteCampaign">Delete</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>