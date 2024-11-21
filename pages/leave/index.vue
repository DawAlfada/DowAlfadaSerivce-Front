<script setup>
import { ref, onMounted, computed, watch } from "vue";
import { useUserStore } from "@/store/user";
import UiParentCard from "@/components/shared/UiParentCard.vue";
import { useRuntimeConfig } from "#app";

const config = useRuntimeConfig();
const userStore = useUserStore();
const employeeLeaves = ref([]);
const VacationType = ref([]);
 
const totalCount = ref(0);
const loading = ref(false);
const errorMessage = ref("");
const successMessage = ref("");
const dialogStatus = ref(false);
const currentPage = ref(1);
const pageSize = ref(10);
const totalPages = computed(() => Math.ceil(totalCount.value / pageSize.value));

watch(currentPage, () => {
  fetchEmployeeLeaves();
});

watch([errorMessage, successMessage], () => {
  if (errorMessage.value || successMessage.value) {
    setTimeout(() => {
      errorMessage.value = null;
      successMessage.value = null;
    }, 4000);
  }
});

const LeaveInfo = ref({
  employeeLeavestatus: 1,
  id: null,

});

const openDialogStatus = (info) => {
  dialogStatus.value = true;
  LeaveInfo.value.employeeLeavestatus = info.employeeLeavestatus;
  LeaveInfo.value.id = info.id;
  
  
};
const searchTerm = ref("");

const searchByInfo = ref({
  employeeLeavestatus: null,
  isOutSideLeave: "",
});

watch(searchByInfo, () => {
  fetchEmployeeLeaves();
},
{ deep: true }
);


const newEmployeeLeave = ref({
    VacationTypeId: null,
    StartDate: null,
    EndDate: null,
    StartTime: null,
    EndTime: null,
    Description: null,
    AttachmentFile : null,
});
const isEditing = ref(false);
const editingLeaveId = ref(null);


const deleteDialog = ref(false);
const LeaveToDelete = ref(null);

const fetchEmployeeLeaves = async () => {
  loading.value = true;
  try {
    const response = await fetch(
      `${config.public.apiUrl}/Leave?Page=${currentPage.value}&PageSize=${pageSize.value}&Title=${searchTerm.value}&employeeLeavestatus=${searchByInfo.value.employeeLeavestatus == null ? "" : searchByInfo.value.employeeLeavestatus}&IsOutSideLeave=${searchByInfo.value.isOutSideLeave}`,
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${userStore.token}`,
        },
      }
    );
    const data = await response.json();
    if (!data.error) {
      employeeLeaves.value = data.data.items;
      totalCount.value = data.data.totalCount;
    }
  } catch (error) {
    errorMessage.value = "Failed to fetch employeeLeaves";
  } finally {
    loading.value = false;
  }
};

const fetchVacationType = async () => {
  loading.value = true;
  try {
    const response = await fetch(
      `${config.public.apiUrl}/VacationType?Page=1&PageSize=100`,
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${userStore.token}`, // Use the token from the store
        },
      }
    );
    const data = await response.json();
    if (!data.error) {
      VacationType.value = data.data.items;
      totalCount.value = data.data.totalCount;
    }
  } catch (error) {
    errorMessage.value = "Failed to fetch VacationType";
  } finally {
    loading.value = false;
  }
};


const VacationBaseType = ref(null);

const changeVacationType = (event) => {
  console.log(event);
  newEmployeeLeave.value.VacationTypeId = event;
 VacationBaseType.value = VacationType.value.find((x) => x.id == event).leaveBased;
};

const downloadAttachment = (url) =>{
  window.open(url, "_blank");
}

const changeEmployeeLeavestatus = async () => {
  errorMessage.value = "";
  successMessage.value = "";
  loading.value = true;
  try {
    const response = await fetch(
      `${config.public.apiUrl}/Leave/EditStatus?id=${LeaveInfo.value.id}&status=${LeaveInfo.value.employeeLeavestatus}`,
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
      fetchEmployeeLeaves();
    } else {
      throw new Error(data.message);
    }
  } catch (error) {
    errorMessage.value = error.message || "Failed to change Leave status";
  } finally {
    loading.value = false;
    dialogStatus.value = false;
  }
};



const handleImageError = (event, fallbackImage) => {
  event.target.src = `data:image/jpeg;base64,${fallbackImage}`;
};

const LeaveDescription = ref("");





const showDesDialog = ref(false);

const showDes = (description) => {
  LeaveDescription.value = description;
  showDesDialog.value = true;
};

const getFile = (event) => {
  newEmployeeLeave.value.AttachmentFile = event.target.files[0];
};

const submitEmployeeLeave = async () => {
  errorMessage.value = "";
  successMessage.value = "";

  if (!newEmployeeLeave.value.title || !newEmployeeLeave.value.description) {
    errorMessage.value = "Please fill out both title and description fields";
    return;
  }

  if (!newEmployeeLeave.value.LeaveFor) {
    errorMessage.value = "Please select a Leave target";
    return;
  }

  loading.value = true;
  try {
    const formData = new FormData();
    formData.append("Title", newEmployeeLeave.value.title);
    formData.append("Description", newEmployeeLeave.value.description);
    formData.append("LeaveFor", newEmployeeLeave.value.LeaveFor);
    if (newEmployeeLeave.value.againstEmployeeId) {
      formData.append(
        "AgainstEmployeeId",
        newEmployeeLeave.value.againstEmployeeId
      );
    }
    formData.append("IsHiddenName", newEmployeeLeave.value.isHiddenName);
    if (newEmployeeLeave.value.attachmentFile) {
      formData.append("AttachmentFile", newEmployeeLeave.value.attachmentFile);
    }

    const url = isEditing.value
      ? `${config.public.apiUrl}/Leave/UpdateLeave?id=${editingLeaveId.value}`
      : `${config.public.apiUrl}/Leave`;
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
      fetchEmployeeLeaves();
    } else {
      throw new Error(data.message);
    }
  } catch (error) {
    errorMessage.value = error.message || "Failed to submit Leave";
  } finally {
    loading.value = false;
  }
};

const confirmDeleteLeave = (Leave) => {
  LeaveToDelete.value = Leave;
  deleteDialog.value = true;
};

const deleteLeave = async () => {
  loading.value = true;
  deleteDialog.value = false;
  try {
    const response = await fetch(
      `${config.public.apiUrl}/Leave/${LeaveToDelete.value.id}`,
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
      fetchEmployeeLeaves();
    } else {
      throw new Error(data.message);
    }
  } catch (error) {
    errorMessage.value = error.message || "Failed to delete Leave";
  } finally {
    loading.value = false;
  }
};



const resetForm = () => {
  newEmployeeLeave.value = {
    VacationTypeId: null,
    StartDate: null,
    EndDate: null,
    StartTime: null,
    EndTime: null,
    Description: null,
    AttachmentFile : null,
  };
  isEditing.value = false;
  editingLeaveId.value = null;
};

onMounted(() => {
  fetchEmployeeLeaves();
  fetchVacationType();
});

</script>

<template>
  <v-row>
    <v-col cols="12" md="12">
      <UiParentCard title="Manage Employee Leaves">
        <v-alert v-if="errorMessage" type="error" dismissible>{{
          errorMessage
        }}</v-alert>
        <v-alert v-if="successMessage" type="success" dismissible>{{
          successMessage
        }}</v-alert>

        <v-form @submit.prevent="submitEmployeeLeave">
          <v-container class="mb-6">
            <v-row>
              <v-col cols="12" sm="6" md="3">
                <v-select
                  :items="VacationType"
                  item-title="name"
                  item-value="id"
                  label="Vacation Type"
                  required
                  @update:model-value="changeVacationType($event)"
                ></v-select>
              </v-col>

              <v-col cols="12" sm="6" md="3" v-if="VacationBaseType == 0 && VacationBaseType != null">
                <v-text-field
                  v-model="newEmployeeLeave.StartDate"
                  label="Start Date"
                  type="date"
                  required
                ></v-text-field>
              </v-col>

              <v-col cols="12" sm="6" md="3" v-if="VacationBaseType == 0 && VacationBaseType != null">
                <v-text-field
                  v-model="newEmployeeLeave.EndDate"
                  label="End Date"
                  type="date"
                  required
                ></v-text-field>
              </v-col>

              <v-col cols="12" sm="6" md="3" v-if="VacationBaseType == 1 && VacationBaseType != null" >
                <v-text-field
                  v-model="newEmployeeLeave.StartTime"
                  label="Start Time"
                  type="time"
                  required
                ></v-text-field>
              </v-col>

              <v-col cols="12" sm="6" md="3" v-if="VacationBaseType == 1 && VacationBaseType != null">
                <v-text-field
                  v-model="newEmployeeLeave.EndTime"
                  label="End Time"
                  type="time"
                  required
                ></v-text-field>

              </v-col>


              <v-col cols="12" sm="6" md="3">
                <v-text-field
                  v-model="newEmployeeLeave.Description"
                  label="Description"
                  required
                ></v-text-field>
              </v-col>

              <v-col cols="12" sm="6" md="3">
                <v-file-input
                  label="Attach File"
                  accept="image/*"
                  messages="Include an attachment if any is not required"
                  @change="getFile($event)"
                ></v-file-input>
              </v-col>
            </v-row>
            <v-btn
              :loading="loading"
              type="submit"
              color="primary"
              class="mr-2"
            >
              {{ isEditing ? "Update Leave" : "Add Leave" }}
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
                @input="fetchEmployeeLeaves"
              ></v-text-field>
            </v-col>
            <!-- IsOutSideLeave filter -->
            <v-col cols="12" sm="6" md="4" v-if="userStore.user.role == 1 || userStore.user.role == 4 || userStore.user.role == 5">
              <v-select
                v-model="searchByInfo.isOutSideLeave"
                :items="[
                  { text: 'All', value: ''},
                  { text: 'Yes', value: true },
                   { text: 'No', value: false }]"
                item-title="text"
                item-value="value"
                label="Filter by OutSide Leave"
              ></v-select>
            </v-col>
            <!-- employeeLeavestatus filter -->
            <v-col cols="12" sm="6" md="4">
              <v-select
                v-model="searchByInfo.employeeLeavestatus"
                :items="employeeLeavestatus"
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
    <tr v-for="Leave in employeeLeaves" :key="Leave.id" class="hover:bg-gray-100">
      <td>
        <div v-if="Leave.isOutSideLeave == true" >
         {{ Leave.fullName }}
        </div>
        <div v-if="Leave.employee != null && Leave.isOutSideLeave == false" class="employee-table-info">
          <v-avatar size="40" class="mr-4" v-if="Leave.employee.image512 != 'Anonymous'">
            <img :src="Leave.employee.image512 ? `data:image/svg+xml;base64,${Leave.employee.image512}` : 'fallback-image-url.jpg'" @error="handleImageError($event, Leave.employee.image512)" width="40" height="40" alt="user" class="avatar"/>
          </v-avatar>
          <v-avatar size="40" class="mr-4" v-else>
            <img src="../../../assets/images/anonymous.png" width="40" height="40" alt="user" class="avatar"/>
          </v-avatar>
          <div>
            {{ Leave.employee.name }}
            <v-icon v-if="Leave.isManager" class="mr-2 managerIcon" color="primary">mdi-star</v-icon>
            <v-icon v-else class="mr-2 managerIcon" color="primary">mdi-account</v-icon>
            <br />
            <span class="jot-title">{{ Leave.employee.jobTitle }}</span>
          </div>
        </div>
        <div v-if="Leave.employee != null && Leave.isOutSideLeave == true">-</div>
        <div v-else></div>
      </td>
      <td>{{ Leave.title }}</td>
      <td>
        <span class="btn" @click="showDes(Leave.description)">Show Description</span>
      </td>
      <td>
        <div v-if="Leave.againstEmployee" class="employee-table-info">
          <v-avatar size="40" class="mr-4" v-if="Leave.againstEmployee.image512 != 'Anonymous'">
            <img :src="Leave.againstEmployee.image512 ? `data:image/svg+xml;base64,${Leave.againstEmployee.image512}` : 'fallback-image-url.jpg'" @error="handleImageError($event, Leave.againstEmployee.image512)" width="40" height="40" alt="user" class="avatar"/>
          </v-avatar>
          <v-avatar size="40" class="mr-4" v-else>
            <img src="../../../assets/images/anonymous.png" width="40" height="40" alt="user" class="avatar"/>
          </v-avatar>
          <div>
            {{ Leave.againstEmployee.name }}
            <v-icon v-if="Leave.isManager" class="mr-2 managerIcon" color="primary">mdi-star</v-icon>
            <v-icon v-else class="mr-2 managerIcon" color="primary">mdi-account</v-icon>
            <br />
            <span class="jot-title">{{ Leave.againstEmployee.jobTitle }}</span>
          </div>
        </div>
        <span v-else>-</span>
      </td>
  
      <td>
        <span v-if="userStore.user.role == 1 || userStore.user.role == 3 || userStore.user.role == 4 || userStore.user.role == 5" @click="openDialogStatus(Leave)" class="btn" :style="getStatusStyle(Leave.employeeLeavestatus)">
          {{ getStatusText(Leave.employeeLeavestatus) }}
        </span>
        <span v-else class="btn" :style="getStatusStyle(Leave.employeeLeavestatus)">
          {{ getStatusText(Leave.employeeLeavestatus) }}
        </span>
      </td>
      
      <td>
        <v-icon v-if="Leave.attachment" color="primary" @click="downloadAttachment(Leave.fileFullUrl)">mdi-paperclip</v-icon>
        <v-icon v-else color="grey">mdi-paperclip</v-icon>
      </td>
      <td v-if="userStore.user.role == 1 || userStore.user.role == 4 || userStore.user.role == 5">
        <span v-if="Leave.isOutSideLeave">Yes</span>
        <span v-else>No</span>
      </td>
      <td v-if="userStore.user.role == 1 || userStore.user.role == 3 || userStore.user.role == 4 || userStore.user.role == 5">
        <v-btn icon="mdi-delete" @click="confirmDeleteLeave(Leave)" color="red" class="ma-2"></v-btn>
      </td>
    </tr>
  </tbody>
</v-table>

          <v-pagination
            v-model="currentPage"
            :length="totalPages"
            total-visible="7"
            @input="fetchEmployeeLeaves"
          ></v-pagination>
        </v-container>
      </UiParentCard>
    </v-col>
  </v-row>

  <!-- change status dialog -->
  <v-dialog v-model="dialogStatus" max-width="400">
    <v-card>
      <v-card-title class="headline">Change Leave Status</v-card-title>
      <v-card-text>
        <v-select
          v-model="LeaveInfo.employeeLeavestatus"
          :items="employeeLeavestatus"
          item-title="text"
          item-value="value"
          label="Status"
        ></v-select>
      </v-card-text>
      <v-card-actions>
        <v-btn color="primary" text @click="dialogStatus = false">Close</v-btn>
        <v-btn color="red" :loading="loading" text @click="changeEmployeeLeavestatus">Change</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>

  <v-dialog v-model="showDesDialog" max-width="400">
    <v-card>
      <v-card-title class="headline">Leave Description</v-card-title>
      <v-card-text>{{ LeaveDescription }}</v-card-text>
      <v-card-actions>
        <v-btn color="primary" text @click="showDesDialog = false">Close</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>

  <v-dialog v-model="deleteDialog" max-width="400">
    <v-card>
      <v-card-title class="headline">Confirm Deletion</v-card-title>
      <v-card-text>Are you sure you want to delete this Leave?</v-card-text>
      <v-card-actions>
        <v-btn color="primary" text @click="deleteDialog = false">Cancel</v-btn>
        <v-btn color="red" text @click="deleteLeave">Delete</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
