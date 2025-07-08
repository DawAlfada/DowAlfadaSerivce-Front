<script setup>
import { ref, onMounted, computed, watch } from "vue";
import { useUserStore } from "@/store/user";
import UiParentCard from "@/components/shared/UiParentCard.vue";
import { useRuntimeConfig } from "#app";

const config = useRuntimeConfig();
const userStore = useUserStore();
const complaints = ref([]);
const totalCount = ref(0);
const loading = ref(false);
const errorMessage = ref("");
const successMessage = ref("");
const dialogStatus = ref(false);
const currentPage = ref(1);
const pageSize = ref(10);
const totalPages = computed(() => Math.ceil(totalCount.value / pageSize.value));

watch(currentPage, () => {
  fetchComplaints();
});

watch([errorMessage, successMessage], () => {
  if (errorMessage.value || successMessage.value) {
    setTimeout(() => {
      errorMessage.value = null;
      successMessage.value = null;
    }, 4000);
  }
});

const complaintInfo = ref({
  complaintStatus: 1,
  id: null,

});

const openDialogStatus = (info) => {
  dialogStatus.value = true;
  complaintInfo.value.complaintStatus = info.complaintStatus;
  complaintInfo.value.id = info.id;
  
  
};
const searchTerm = ref("");

const searchByInfo = ref({
  complaintStatus: null,
  isOutSideComplaint: "",
});

watch(searchByInfo, () => {
  fetchComplaints();
},
{ deep: true }
);


const newComplaint = ref({
  title: "",
  description: "",
  againstEmployeeId: null,
  complaintFor: 1,
  attachmentFile: null,
  isHiddenName: false,
});
const isEditing = ref(false);
const editingComplaintId = ref(null);


const deleteDialog = ref(false);
const complaintToDelete = ref(null);

const fetchComplaints = async () => {
  loading.value = true;
  try {
    const response = await fetch(
      `${config.public.apiUrl}/Complaint?Page=${currentPage.value}&PageSize=${pageSize.value}&Title=${searchTerm.value}&ComplaintStatus=${searchByInfo.value.complaintStatus == null ? "" : searchByInfo.value.complaintStatus}&IsOutSideComplaint=${searchByInfo.value.isOutSideComplaint}`,
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${userStore.token}`,
        },
      }
    );
    const data = await response.json();
    if (!data.error) {
      complaints.value = data.data.items;
      totalCount.value = data.data.totalCount;
    }
  } catch (error) {
    errorMessage.value = "Failed to fetch complaints";
  } finally {
    loading.value = false;
  }
};

const downloadAttachment = (url) =>{
  window.open(url, "_blank");
}

const changeComplaintStatus = async () => {
  errorMessage.value = "";
  successMessage.value = "";
  loading.value = true;
  try {
    const response = await fetch(
      `${config.public.apiUrl}/Complaint/EditStatus?id=${complaintInfo.value.id}&status=${complaintInfo.value.complaintStatus}`,
      {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${userStore.token}`,
        },
      }
    );
    const data = await response.json();
    if (!data.error) {
      successMessage.value = data.message;
      fetchComplaints();
    } else {
      throw new Error(data.message);
    }
  } catch (error) {
    errorMessage.value = error.message || "Failed to change complaint status";
  } finally {
    loading.value = false;
    dialogStatus.value = false;
  }
};



const handleImageError = (event, fallbackImage) => {
  event.target.src = `data:image/jpeg;base64,${fallbackImage}`;
};

const complaintDescription = ref("");

const complaintForOptions = [
  { text: "Manager", value: 1 },
  { text: "HR", value: 2 },
];
const complaintStatus = [
  {
    text: "Open",
    value: 1,
    backgroundColor: "#E3FCEF", 
    borderColor: "#B3EBC9",   
    textColor: "#007B55",     
  },
  {
    text: "Closed",
    value: 2,
    backgroundColor: "#F2F2F7", 
    borderColor: "#D1D1E0",    
    textColor: "#505464",     
  },
  {
    text: "In Progress",
    value: 3,
    backgroundColor: "#FFF8E1", 
    borderColor: "#FFE4B3",     
    textColor: "#8B5E00",      
  },
  {
    text: "Rejected",
    value: 4,
    backgroundColor: "#FFE6E6",
    borderColor: "#FFB3B3",   
    textColor: "#B00020",       
  },
];


 const getStatusText = (status) => {
  const statusObj = complaintStatus.find((s) => s.value === status);
  return statusObj ? statusObj.text : "Unknown";
};

 const getStatusStyle = (status) => {
  const statusObj = complaintStatus.find((s) => s.value === status);
  return statusObj
    ? {
        backgroundColor: statusObj.backgroundColor,
        borderColor: statusObj.borderColor,
        color: statusObj.textColor,
        padding : "8px",
        borderRadius : "5px"

      }
    : {};
};

const showDesDialog = ref(false);

const showDes = (description) => {
  complaintDescription.value = description;
  showDesDialog.value = true;
};

const getFile = (event) => {
  newComplaint.value.attachmentFile = event.target.files[0];
};

const submitComplaint = async () => {
  errorMessage.value = "";
  successMessage.value = "";

  if (!newComplaint.value.title || !newComplaint.value.description) {
    errorMessage.value = "Please fill out both title and description fields";
    return;
  }

  if (!newComplaint.value.complaintFor) {
    errorMessage.value = "Please select a complaint target";
    return;
  }

  loading.value = true;
  try {
    const formData = new FormData();
    formData.append("Title", newComplaint.value.title);
    formData.append("Description", newComplaint.value.description);
    formData.append("ComplaintFor", newComplaint.value.complaintFor);
    if (newComplaint.value.againstEmployeeId) {
      formData.append(
        "AgainstEmployeeId",
        newComplaint.value.againstEmployeeId
      );
    }
    formData.append("IsHiddenName", newComplaint.value.isHiddenName);
    if (newComplaint.value.attachmentFile) {
      formData.append("AttachmentFile", newComplaint.value.attachmentFile);
    }

    const url = isEditing.value
      ? `${config.public.apiUrl}/Complaint/UpdateComplaint?id=${editingComplaintId.value}`
      : `${config.public.apiUrl}/Complaint`;
    const method = isEditing.value ? "PUT" : "POST";

    const response = await fetch(url, {
      method,
      headers: {
        Authorization: `Bearer ${userStore.token}`,
      },
      body: formData,
    });

    const data = await response.json();
    if (!data.error) {
      successMessage.value = data.message;
      resetForm();
      fetchComplaints();
    } else {
      throw new Error(data.message);
    }
  } catch (error) {
    errorMessage.value = error.message || "Failed to submit complaint";
  } finally {
    loading.value = false;
  }
};

const confirmDeleteComplaint = (complaint) => {
  complaintToDelete.value = complaint;
  deleteDialog.value = true;
};

const deleteComplaint = async () => {
  loading.value = true;
  deleteDialog.value = false;
  try {
    const response = await fetch(
      `${config.public.apiUrl}/Complaint/${complaintToDelete.value.id}`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${userStore.token}`,
        },
      }
    );
    const data = await response.json();
    if (!data.error) {
      successMessage.value = data.message;
      fetchComplaints();
    } else {
      throw new Error(data.message);
    }
  } catch (error) {
    errorMessage.value = error.message || "Failed to delete complaint";
  } finally {
    loading.value = false;
  }
};

const employees = ref([]);
const fetchEmployees = async () => {
  try {
    const response = await fetch(
      `${config.public.apiUrl}/Employee?Page=1&PageSize=100`,
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

const resetForm = () => {
  newComplaint.value = {
    title: "",
    description: "",
    againstEmployeeId: null,
    complaintFor: 1,
    attachmentFile: null,
    isHiddenName: false,
  };
  isEditing.value = false;
  editingComplaintId.value = null;
};

onMounted(() => {
  fetchComplaints();
  fetchEmployees();
});

</script>

<template>
  <v-row>
    <v-col cols="12" md="12">
      <UiParentCard title="Manage Complaints">
        <v-alert v-if="errorMessage" type="error" dismissible>{{
          errorMessage
        }}</v-alert>
        <v-alert v-if="successMessage" type="success" dismissible>{{
          successMessage
        }}</v-alert>

        <v-form @submit.prevent="submitComplaint">
          <v-container class="mb-6">
            <v-row>
              <v-col cols="12" sm="6" md="3">
                <v-text-field
                  v-model="newComplaint.title"
                  label="Complaint Title"
                  required
                ></v-text-field>
              </v-col>

              <v-col cols="12" sm="6" md="3">
                <v-select
                  v-model="newComplaint.complaintFor"
                  :items="complaintForOptions"
                  item-title="text"
                  item-value="value"
                  label="Complaint For"
                  required
                ></v-select>
              </v-col>

              <v-col cols="12" sm="6" md="3">
                <v-select
                  v-model="newComplaint.againstEmployeeId"
                  :items="employees"
                  item-title="displayName"
                  item-value="id"
                  label="Employee"
                  clearable
                  outlined
                  dense
                  messages="The employee's choice only if the complaint is specific against him"
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

              <v-col cols="12" sm="6" md="3">
                <v-file-input
                  label="Attach File"
                  accept="image/*"
                  messages="Include an attachment if any is not required"
                  @change="getFile($event)"
                ></v-file-input>
              </v-col>

              <v-col cols="12" sm="12" md="12">
                <v-textarea
                  v-model="newComplaint.description"
                  label="Complaint Description"
                  required
                ></v-textarea>
              </v-col>
              <!-- <v-col cols="12" sm="6" md="4">
                <v-checkbox
                  v-model="newComplaint.isHiddenName"
                  label="Hide My Identity"
                ></v-checkbox>
              </v-col> -->
            </v-row>
            <v-btn
              :loading="loading"
              type="submit"
              color="primary"
              class="mr-2"
            >
              {{ isEditing ? "Update Complaint" : "Add Complaint" }}
            </v-btn>
            <v-btn @click="resetForm" color="secondary" :disabled="loading">
              Cancel
            </v-btn>
          </v-container>
        </v-form>
        <v-container>
          <v-row class="mb-4">
            <v-col cols="12" sm="6" md="4">
              <v-text-field
                v-model="searchTerm"
                label="Search by Title"
                @input="fetchComplaints"
              ></v-text-field>
            </v-col>
            <!-- IsOutSideComplaint filter -->
            <v-col cols="12" sm="6" md="4" v-if="userStore.user.role == 1 || userStore.user.role == 4 || userStore.user.role == 5">
              <v-select
                v-model="searchByInfo.isOutSideComplaint"
                :items="[
                  { text: 'All', value: ''},
                  { text: 'Yes', value: true },
                   { text: 'No', value: false }]"
                item-title="text"
                item-value="value"
                label="Filter by OutSide Complaint"
              ></v-select>
            </v-col>
            <!-- ComplaintStatus filter -->
            <v-col cols="12" sm="6" md="4">
              <v-select
                v-model="searchByInfo.complaintStatus"
                :items="complaintStatus"
                item-title="text"
                item-value="value"
                label="Filter by Status"
              ></v-select>
            </v-col>
          </v-row>

          <v-table density="compact">
  <thead>
    <tr>
      <th class="text-left">Full Name</th>
      <th class="text-left">Title</th>
      <th class="text-left">Description</th>
      <th class="text-left">Against Employee</th>
      <th class="text-left">Status</th>
      <th class="text-left">Attachment</th>
      <th class="text-left" v-if="userStore.user.role == 1 || userStore.user.role == 3 || userStore.user.role == 4 || userStore.user.role == 5">Is OutSite</th>
      <th class="text-left" v-if="userStore.user.role == 1 || userStore.user.role == 4 || userStore.user.role == 5">Actions</th>
    </tr>
  </thead>
  <tbody>
    <tr v-for="complaint in complaints" :key="complaint.id" class="hover:bg-gray-100">
      <td>
        <div v-if="complaint.isOutSideComplaint == true" >
         {{ complaint.fullName }}
        </div>
        <div v-if="complaint.employee != null && complaint.isOutSideComplaint == false" class="employee-table-info">
          <v-avatar size="40" class="mr-4" v-if="complaint.employee.image512 != 'Anonymous'">
            <img :src="complaint.employee.image512 ? `data:image/svg+xml;base64,${complaint.employee.image512}` : 'fallback-image-url.jpg'" @error="handleImageError($event, complaint.employee.image512)" width="40" height="40" alt="user" class="avatar"/>
          </v-avatar>
          <v-avatar size="40" class="mr-4" v-else>
            <img src="../../../assets/images/anonymous.png" width="40" height="40" alt="user" class="avatar"/>
          </v-avatar>
          <div>
            {{ complaint.employee.name }}
            <v-icon v-if="complaint.isManager" class="mr-2 managerIcon" color="primary">mdi-star</v-icon>
            <v-icon v-else class="mr-2 managerIcon" color="primary">mdi-account</v-icon>
            <br />
            <span class="jot-title">{{ complaint.employee.jobTitle }}</span>
          </div>
        </div>
        <div v-if="complaint.employee != null && complaint.isOutSideComplaint == true">-</div>
        <div v-else></div>
      </td>
      <td>{{ complaint.title }}</td>
      <td>
        <span class="btn" @click="showDes(complaint.description)">Show Description</span>
      </td>
      <td>
        <div v-if="complaint.againstEmployee" class="employee-table-info">
          <v-avatar size="40" class="mr-4" v-if="complaint.againstEmployee.image512 != 'Anonymous'">
            <img :src="complaint.againstEmployee.image512 ? `data:image/svg+xml;base64,${complaint.againstEmployee.image512}` : 'fallback-image-url.jpg'" @error="handleImageError($event, complaint.againstEmployee.image512)" width="40" height="40" alt="user" class="avatar"/>
          </v-avatar>
          <v-avatar size="40" class="mr-4" v-else>
            <img src="../../../assets/images/anonymous.png" width="40" height="40" alt="user" class="avatar"/>
          </v-avatar>
          <div>
            {{ complaint.againstEmployee.name }}
            <v-icon v-if="complaint.isManager" class="mr-2 managerIcon" color="primary">mdi-star</v-icon>
            <v-icon v-else class="mr-2 managerIcon" color="primary">mdi-account</v-icon>
            <br />
            <span class="jot-title">{{ complaint.againstEmployee.jobTitle }}</span>
          </div>
        </div>
        <span v-else>-</span>
      </td>
  
      <td>
        <span v-if="userStore.user.role == 1 || userStore.user.role == 3 || userStore.user.role == 4 || userStore.user.role == 5" @click="openDialogStatus(complaint)" class="btn" :style="getStatusStyle(complaint.complaintStatus)">
          {{ getStatusText(complaint.complaintStatus) }}
        </span>
        <span v-else class="btn" :style="getStatusStyle(complaint.complaintStatus)">
          {{ getStatusText(complaint.complaintStatus) }}
        </span>
      </td>
      
      <td>
        <v-icon v-if="complaint.attachment" color="primary" @click="downloadAttachment(complaint.fileFullUrl)">mdi-paperclip</v-icon>
        <v-icon v-else color="grey">mdi-paperclip</v-icon>
      </td>
      <td v-if="userStore.user.role == 1 || userStore.user.role == 4 || userStore.user.role == 5">
        <span v-if="complaint.isOutSideComplaint">Yes</span>
        <span v-else>No</span>
      </td>
      <td v-if="userStore.user.role == 1 || userStore.user.role == 3 || userStore.user.role == 4 || userStore.user.role == 5">
        <v-btn 
          icon="mdi-delete" 
          size="default"
          variant="elevated"
          color="error"
          @click="confirmDeleteComplaint(complaint)" 
          class="ma-2"
        />
      </td>
    </tr>
  </tbody>
</v-table>

          <v-pagination
            v-model="currentPage"
            :length="totalPages"
            total-visible="7"
            @input="fetchComplaints"
          ></v-pagination>
        </v-container>
      </UiParentCard>
    </v-col>
  </v-row>

  <!-- change status dialog -->
  <v-dialog v-model="dialogStatus" max-width="400">
    <v-card>
      <v-card-title class="headline">Change Complaint Status</v-card-title>
      <v-card-text>
        <v-select
          v-model="complaintInfo.complaintStatus"
          :items="complaintStatus"
          item-title="text"
          item-value="value"
          label="Status"
        ></v-select>
      </v-card-text>
      <v-card-actions>
        <v-btn color="primary" text @click="dialogStatus = false">Close</v-btn>
        <v-btn color="red" :loading="loading" text @click="changeComplaintStatus">Change</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>

  <v-dialog v-model="showDesDialog" max-width="400">
    <v-card>
      <v-card-title class="headline">Complaint Description</v-card-title>
      <v-card-text>{{ complaintDescription }}</v-card-text>
      <v-card-actions>
        <v-btn color="primary" text @click="showDesDialog = false">Close</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>

  <v-dialog v-model="deleteDialog" max-width="400">
    <v-card>
      <v-card-title class="headline">Confirm Deletion</v-card-title>
      <v-card-text>Are you sure you want to delete this complaint?</v-card-text>
      <v-card-actions>
        <v-btn color="primary" text @click="deleteDialog = false">Cancel</v-btn>
        <v-btn color="red" text @click="deleteComplaint">Delete</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
