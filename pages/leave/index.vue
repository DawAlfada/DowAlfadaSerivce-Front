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
const leaveTypeInfo = ref(null);
const leaveTypeIsError = ref(false);

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

const statusChangeInfo = ref({
  employeeLeavestatus: "",
  managerDescription: "",
  id: null,
});

const LeaveInfo = ref({
  employeeLeavestatus: "",
  managerDescription: "",

  id: null,
});

const openDialogStatus = (info) => {
  dialogStatus.value = true;
  statusChangeInfo.value.employeeLeavestatus = info.status;
  statusChangeInfo.value.id = info.id;
};
const searchTerm = ref("");

const searchByInfo = ref({
  employeeLeavestatus: "",
  EmployeeName: "",
  VacationTypeName : "",
  StartDate : "",
  EndDate : "",
  Status : "",
  LeaveBased : "",

});

watch(
  searchByInfo,
  () => {
    fetchEmployeeLeaves();
  },
  { deep: true }
);

const newEmployeeLeave = ref({
  vacationTypeId: null,
  startDate: "",
  endDate: "",
  startTime: "",
  endTime: "",
  description: "",
  attachmentFile: null,
});
const isEditing = ref(false);
const editingLeaveId = ref(null);

const deleteDialog = ref(false);
const LeaveToDelete = ref(null);

const fetchEmployeeLeaves = async () => {
  loading.value = true;
  try {
    const response = await fetch(
      `${config.public.apiUrl}/EmployeeLeave?Page=${currentPage.value}&PageSize=${pageSize.value}&Status=${searchByInfo.value.employeeLeavestatus}&EmployeeName=${searchByInfo.value.EmployeeName}&VacationTypeName=${searchByInfo.value.VacationTypeName}&StartDate=${searchByInfo.value.StartDate}&EndDate=${searchByInfo.value.EndDate}&Status=${searchByInfo.value.Status}&LeaveBased=${searchByInfo.value.LeaveBased}`,
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
          Authorization: `Bearer ${userStore.token}`,
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
const vacationFullInfo = ref(null);

const changeVacationType = (event) => {
  console.log(event);
  newEmployeeLeave.value.vacationTypeId = event;
  VacationBaseType.value = VacationType.value.find(
    (x) => x.id == event
  ).leaveBased;

  getLeaveTypeDeitelsById();
  vacationFullInfo.value = VacationType.value.find((x) => x.id == event);
};

const downloadAttachment = (url) => {
  window.open(url, "_blank");
};

const changeEmployeeLeavestatus = async () => {
  if (
    statusChangeInfo.value.employeeLeavestatus === "" ||
    statusChangeInfo.value.employeeLeavestatus ===
      LeaveInfo.value.employeeLeavestatus
  ) {
    errorMessage.value = "Please select a different status";
    return;
  }

  if (!statusChangeInfo.value.managerDescription) {
    errorMessage.value = "Please provide a manager description";
    return;
  }

  errorMessage.value = "";
  successMessage.value = "";
  loading.value = true;
  try {
    const response = await fetch(
      `${config.public.apiUrl}/EmployeeLeave/UpdateStatus?id=${statusChangeInfo.value.id}&status=${statusChangeInfo.value.employeeLeavestatus}&managerDescription=${statusChangeInfo.value.managerDescription}`,
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

const LeaveDescription = ref("");

const formatDate = (date) => {
  return date.toString().split("T")[0];
};

const formatTime = (time) => {
  const [hours, minutes] = time.split(":");
  const period = hours >= 12 ? "PM" : "AM";
  const adjustedHours = hours % 12 || 12; // Convert 0 to 12 for 12-hour format
  return `${adjustedHours}:${minutes} ${period}`;
};

const employeeLeavestatus = [
  { text: "Pending", value: 0 },
  { text: "Approved", value: 1 },
  { text: "Rejected", value: 2 },
  { text: "Approved With Changes", value: 3 },
  { text: "Approved With Deduction", value: 4 },
];

const complaintStatus = [
  {
    text: "Pending",
    value: 0,
    backgroundColor: "#E3FCEF",
    borderColor: "#B3EBC9",
    textColor: "#007B55",
  },
  {
    text: "Approved",
    value: 1,
    backgroundColor: "#F2F2F7",
    borderColor: "#D1D1E0",
    textColor: "#505464",
  },
  {
    text: "Rejected",
    value: 3,
    backgroundColor: "#FFE6E6",
    borderColor: "#FFB3B3",
    textColor: "#B00020",
  },
  {
    text: "Approved With Changes",
    value: 4,
    backgroundColor: "#FFF8E1",
    borderColor: "#FFECB3",
    textColor: "#FF8F00",
  },
  {
    text: "Approved With Deduction",
    value: 5,
    backgroundColor: "#FFEBEE",
    borderColor: "#FFB3D1",
    textColor: "#FF2D55",
  },
];

const getStatusStyle = (status) => {
  const statusObj = complaintStatus.find((s) => s.value === status);
  return statusObj
    ? {
        backgroundColor: statusObj.backgroundColor,
        borderColor: statusObj.borderColor,
        color: statusObj.textColor,
        padding: "8px",
        borderRadius: "5px",
      }
    : {};
};

const getStatusText = (status) => {
  switch (status) {
    case 0:
      return "Pending";
    case 1:
      return "Approved";
    case 2:
      return "Rejected";
    case 3:
      return "Approved With Changes";
    case 4:
      return "Approved With Deduction";
    default:
      return "";
  }
};

const getLeaveTypeDeitelsById = async () => {
  leaveTypeIsError.value = false;
  loading.value = true;
  try {
    const response = await fetch(
      `${config.public.apiUrl}/VacationType/${newEmployeeLeave.value.vacationTypeId}`,
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${userStore.token}`,
        },
      }
    );
    const data = await response.json();
    if (!data.error) {
      leaveTypeIsError.value = false;
      console.log(data.data);
      leaveTypeInfo.value = data.data;
    } else {
      leaveTypeIsError.value = true;
    }
  } catch (error) {
    errorMessage.value = "Failed to fetch data";
    leaveTypeIsError.value = true;
  } finally {
    loading.value = false;
  }
};

const showDesDialog = ref(false);

const showDes = (description) => {
  LeaveDescription.value = description;
  showDesDialog.value = true;
};

const getFile = (event) => {
  newEmployeeLeave.value.attachmentFile = event.target.files[0];
};

const submitEmployeeLeave = async () => {
  for (const key in newEmployeeLeave.value) {
    if (newEmployeeLeave.value[key] === null) {
      newEmployeeLeave.value[key] = "";
    }
  }
  errorMessage.value = "";
  successMessage.value = "";
  if (!newEmployeeLeave.value.vacationTypeId) {
    errorMessage.value = "Please select a Vacation Type";
    return;
  }

  if (newEmployeeLeave.value.endDate && newEmployeeLeave.value.startDate) {
    if (
      new Date(newEmployeeLeave.value.endDate) <
      new Date(newEmployeeLeave.value.startDate)
    ) {
      errorMessage.value = "End Date cannot be less than Start Date";
      return;
    }
  }

  if (newEmployeeLeave.value.endTime && newEmployeeLeave.value.startTime) {
    if (
      new Date(newEmployeeLeave.value.endTime) <
      new Date(newEmployeeLeave.value.startTime)
    ) {
      errorMessage.value = "End Time cannot be less than Start Time";
      return;
    }
  }

  if (!newEmployeeLeave.value.description) {
    errorMessage.value = "Please fill out description fields";
    return;
  }

  // check if total days or hours are available
  // if (leaveTrypeInfo.value.leaveBased == 0) {
  //   if (
  //     leaveTypeInfo.value.totalDays - leaveTypeInfo.value.usedDays <
  //     new Date(newEmployeeLeave.value.endDate) -
  //       new Date(newEmployeeLeave.value.startDate)
  //   ) {
  //     errorMessage.value = "You don't have enough days for this leave";
  //     return;
  //   }
  // } else {
  //   if (
  //     leaveTypeInfo.value.totalHours - leaveTypeInfo.value.usedHours <
  //       new Date(newEmployeeLeave.value.endTime) -
  //       new Date(newEmployeeLeave.value.startTime)
  //   ) {
  //     errorMessage.value = "You don't have enough hours for this leave";
  //     return;
  //   }
  // }

  loading.value = true;
  try {
    const formData = new FormData();
    formData.append("VacationTypeId", newEmployeeLeave.value.vacationTypeId);
    formData.append("StartDate", newEmployeeLeave.value.startDate);
    formData.append("EndDate", newEmployeeLeave.value.endDate);
    formData.append("StartTime", newEmployeeLeave.value.startTime);
    formData.append("EndTime", newEmployeeLeave.value.endTime);
    formData.append("Description", newEmployeeLeave.value.description);

    if (newEmployeeLeave.value.attachmentFile) {
      formData.append("AttachmentFile", newEmployeeLeave.value.attachmentFile);
    }

    const url = isEditing.value
      ? `${config.public.apiUrl}/EmployeeLeave/${editingLeaveId.value}`
      : `${config.public.apiUrl}/EmployeeLeave`;
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
      // get Leave type details
      getLeaveTypeDeitelsById();
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
      `${config.public.apiUrl}/EmployeeLeave/${LeaveToDelete.value.id}`,
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
    vacationTypeId: null,
    startDate: "",
    endDate: "",
    startTime: "",
    endTime: "",
    description: null,
    attachmentFile: null,
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

        <div v-if="leaveTypeInfo && leaveTypeIsError == false">
          <v-alert title="Attention" type="info" class="m-5">
            <div v-if="leaveTypeInfo.leaveBased == 0">
              This type of leave total days in the year is
              {{ leaveTypeInfo.totalDays }} and you used
              {{ leaveTypeInfo.usedDays }} days.
            </div>
            <div v-else>
              This type of leave total hours in the month is
              {{ leaveTypeInfo.totalHours }} and you used
              {{ leaveTypeInfo.usedHours }} hours.
            </div>
          </v-alert>
        </div>

        <div v-if="leaveTypeIsError == true">
          <v-alert title="Attention" type="error" class="m-5" >
            <div>This type of leave is not available for you.</div>
          </v-alert>
        </div>

        <v-form @submit.prevent="submitEmployeeLeave">
          <v-container class="mb-6">
            <v-row>
              <v-col cols="12" sm="6" md="3">
                <v-select
                  :items="VacationType"
                  item-title="name"
                  item-value="id"
                  label="Vacation Type"
                  v-model="newEmployeeLeave.vacationTypeId"
                  required
                  @update:model-value="changeVacationType($event)"
                ></v-select>
              </v-col>
              <v-col
                cols="12"
                sm="6"
                md="3"
                v-if="VacationBaseType == 0 && VacationBaseType != null"
              >
                <v-text-field
                  v-model="newEmployeeLeave.startDate"
                  label="Start Date"
                  type="date"
                  required
                ></v-text-field>
              </v-col>

              <v-col
                cols="12"
                sm="6"
                md="3"
                v-if="VacationBaseType == 0 && VacationBaseType != null"
              >
                <v-text-field
                  v-model="newEmployeeLeave.endDate"
                  label="End Date"
                  type="date"
                  required
                ></v-text-field>
              </v-col>

              <v-col
                cols="12"
                sm="6"
                md="3"
                v-if="VacationBaseType == 1 && VacationBaseType != null"
              >
                <v-text-field
                  v-model="newEmployeeLeave.startTime"
                  label="Start Time"
                  type="time"
                  required
                ></v-text-field>
              </v-col>

              <v-col
                cols="12"
                sm="6"
                md="3"
                v-if="VacationBaseType == 1 && VacationBaseType != null"
              >
                <v-text-field
                  v-model="newEmployeeLeave.endTime"
                  label="End Time"
                  type="time"
                  required
                ></v-text-field>
              </v-col>

              <v-col cols="12" sm="6" md="3">
                <v-text-field
                  v-model="newEmployeeLeave.description"
                  label="Description"
                  required
                ></v-text-field>
              </v-col>

              <v-col cols="12 mb-5" sm="6" md="3">
                <v-file-input
                  label="Attach File"
                  accept="image/*"
                  @change="getFile($event)"
                ></v-file-input>
              </v-col>
            </v-row>
            <v-btn
              :loading="loading"
              type="submit"
              color="primary"
              class="mr-2"
              :disabled="leaveTypeIsError"
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

            <v-col cols="12" sm="6" md="4">
              <v-select
                v-model="searchByInfo.employeeLeavestatus"
                :items="employeeLeavestatus"
                item-title="text"
                item-value="value"
                label="Filter by Status"
              ></v-select>
            </v-col>

            <v-col cols="12" sm="6" md="4"  v-if="userStore.user.role == 1 || userStore.user.role == 4 || userStore.user.role == 5" >
              <v-text-field
                v-model="searchByInfo.EmployeeName"
                label="Employee Name"
                @input="fetchEmployeeLeaves"
              ></v-text-field>
            </v-col>

            <v-col cols="12" sm="6" md="4">
              <v-text-field
                v-model="searchByInfo.VacationTypeName"
                label="Vacation Type"
                @input="fetchEmployeeLeaves"
              ></v-text-field>

            </v-col>

            <v-col cols="12" sm="6" md="4">
              <v-text-field
                v-model="searchByInfo.StartDate"
                label="Start Date"
                type="date"
                @input="fetchEmployeeLeaves"
              ></v-text-field>
            </v-col>

            <v-col cols="12" sm="6" md="4">
              <v-text-field
                v-model="searchByInfo.EndDate"
                label="End Date"
                type="date"
                @input="fetchEmployeeLeaves"
              ></v-text-field>

            </v-col>

            <v-col cols="12" sm="6" md="4">
              <v-select
                v-model="searchByInfo.Status"
                :items="employeeLeavestatus"
                item-title="text"
                item-value="value"
                label="Status"
                @input="fetchEmployeeLeaves"
              ></v-select>

            </v-col>

            <v-col cols="12" sm="6" md="4">
              <v-select
                v-model="searchByInfo.LeaveBased"
                :items="[
                   { text: 'All', value: '' },
                  { text: 'Day Leave Based', value: 0 },
                 { text: 'Hour Leave Based', value: 1 } 
                 

                ]"
                item-title="text"
                item-value="value"
                label="Leave Based"
                @input="fetchEmployeeLeaves"
              ></v-select>


            </v-col>

          </v-row>

          <v-table density="compact">
            <thead>
              <tr>
                <th class="text-left">Employee Name</th>
                <th class="text-left">Leave Type</th>
                <th class="text-left">Description</th>
                <th class="text-left">Leave Based</th>
                <th class="text-left">From - To</th>
                <th class="text-left">Status</th>
                <th class="text-left">Attachment</th>
                <th class="text-left">Manager Description</th>

                <th class="text-left">created At</th>
                <th class="text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="Leave in employeeLeaves"
                :key="Leave.id"
                class="hover:bg-gray-100"
              >
                <td>
                  <div>
                    {{ Leave.employee.name }}
                  </div>
                </td>
                <td>{{ Leave.vacationType.name }}</td>

                <td>
                  <v-icon @click="showDes(Leave.description)" color="primary"
                    >mdi-eye</v-icon
                  >
                </td>
                <td>
                  <span v-if="Leave.vacationType.leaveBased == 0"
                    >Day Leave Based</span
                  >
                  <span v-else>Hour Leave Based</span>
                </td>

                <td>
                  <span v-if="Leave.vacationType.leaveBased == 0">
                    {{ formatDate(Leave.startDate) }} -
                    {{ formatDate(Leave.endDate) }}
                  </span>
                  <span v-else>
                    {{ formatTime(Leave.startTime) }} -
                    {{ formatTime(Leave.endTime) }}
                  </span>
                </td>

                <td>
                  <span
                    v-if="
                      userStore.user.role == 1 ||
                      userStore.user.role == 3 ||
                      userStore.user.role == 4 ||
                      userStore.user.role == 5
                    "
                    @click="openDialogStatus(Leave)"
                    class="btn"
                    :style="getStatusStyle(Leave.status)"
                  >
                    {{ getStatusText(Leave.status) }}
                  </span>
                  <span
                    v-else
                    class="btn"
                    :style="getStatusStyle(Leave.status)"
                  >
                    {{ getStatusText(Leave.status) }}
                  </span>
                </td>

                <td>
                  <v-icon
                    v-if="Leave.attachment"
                    color="primary"
                    @click="downloadAttachment(Leave.fileFullUrl)"
                    >mdi-paperclip</v-icon
                  >
                  <v-icon v-else color="grey">mdi-paperclip</v-icon>
                </td>

                <td>
                  <v-icon
                    v-if="Leave.managerDescription"
                    @click="showDes(Leave.managerDescription)"
                    color="primary"
                    >mdi-eye</v-icon
                  >
                  <span v-else>Not Available</span>
                </td>

                <td>{{ formatDate(Leave.createdAt) }}</td>
                <td
               
                >
                  <v-btn
                    v-if="Leave.status == 0 || Leave.status == 3"
                    icon="mdi-pencil"
                    @click="
                      isEditing = true;
                      editingLeaveId = Leave.id;
                      newEmployeeLeave = Leave;
                      newEmployeeLeave.vacationTypeId = Leave.vacationTypeId;
                      newEmployeeLeave.startDate =
                        Leave.startDate != null
                          ? formatDate(Leave.startDate)
                          : '';
                      newEmployeeLeave.endDate =
                        Leave.endDate != null ? formatDate(Leave.endDate) : '';
                      newEmployeeLeave.attachmentFile = null;
                      VacationBaseType = Leave.vacationType.leaveBased;
                    "
                    color="primary"
                    class="ma-2"
                  ></v-btn>

                  <v-btn
                    v-if="
                      userStore.user.role == 1 ||
                      userStore.user.role == 3 ||
                      userStore.user.role == 4 ||
                      (userStore.user.role == 5 && Leave.status == 0) ||
                      Leave.status == 4
                    "
                    icon="mdi-delete"
                    @click="confirmDeleteLeave(Leave)"
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
          v-model="statusChangeInfo.employeeLeavestatus"
          :items="employeeLeavestatus"
          item-title="text"
          item-value="value"
          label="Status"
        ></v-select>
        <v-text-field
          v-model="statusChangeInfo.managerDescription"
          label="Manager Description"
          required
        ></v-text-field>
      </v-card-text>
      <v-card-actions>
        <v-btn color="primary" text @click="dialogStatus = false">Close</v-btn>
        <v-btn
          color="red"
          :loading="loading"
          text
          @click="changeEmployeeLeavestatus"
          >Change</v-btn
        >
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
