<script setup>
// Helper to check for valid date
function isValidDate(date) {
  return date && date !== "0001-01-01T00:00:00";
}
import { ref, onMounted, computed, watch } from "vue";
import { useUserStore } from "@/store/user";
import UiParentCard from "@/components/shared/UiParentCard.vue";
import { useRuntimeConfig } from "#app";

const config = useRuntimeConfig();
const userStore = useUserStore();
const employeeLeaves = ref([]);
const VacationType = ref([]);
const holidays = ref([]);

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

const employeeLeavestatus = [
  { text: "Pending", value: 0 },
  { text: "Approved", value: 1 },
  { text: "Rejected", value: 2 },
  { text: "Approved With Changes", value: 3 },
  { text: "Approved With Deduction", value: 4 },
];

const hrStatus = [
  { text: "Pending", value: 0 },
  { text: "Approved", value: 1 },
  { text: "Rejected", value: 2 },
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
const user = JSON.parse(localStorage.getItem('user') || '{}');
const isUserManager = user.isManager;


const statusChangeInfo = ref({
  employeeLeavestatus: "",
  managerDescription: "",
  hrStatus: "",
  hrDescription: "",
  id: null,
  isManager : isUserManager
});

const LeaveInfo = ref({
  employeeLeavestatus: "",
  managerDescription: "",
  hrStatus: "",
  hrDescription: "",
  id: null,
});

const openDialogStatus = (info) => {
  dialogStatus.value = true;
  statusChangeInfo.value = {
    employeeLeavestatus: info.status,
    hrStatus: info.hrStatus,
    managerDescription: "",
    hrDescription: "",
    id: info.id,
    isManager:isUserManager
  };
};
const searchTerm = ref("");

const searchByInfo = ref({
  employeeLeavestatus: "",
  EmployeeName: "",
  VacationTypeName: "",
  StartDate: "",
  EndDate: "",
  Status: "",
  LeaveBased: "",
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
  usageType: "day", // "day" or "hour"
  startDate: "",
  endDate: "",
  startTime: "",
  endTime: "",
  leaveDate: "", // LeaveDate for hour-based leave
  description: "",
  attachmentFile: null,
});
const isEditing = ref(false);
const editingLeaveId = ref(null);

const deleteDialog = ref(false);
const LeaveToDelete = ref(null);

const showStatusDetailsDialog = ref(false);
const statusDetails = ref({
  managerStatus: null,
  hrStatus: null,
  managerDescription: null,
  hrDescription: null,
  leave: null
});

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
    }
  } catch (error) {
    errorMessage.value = "Failed to fetch VacationType";
  } finally {
    loading.value = false;
  }
};

const fetchHolidays = async () => {
  try {
    const currentYear = new Date().getFullYear();
    const response = await fetch(
      `${config.public.apiUrl}/Holiday/GetAllThisYear?year=${currentYear}`,
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${userStore.token}`,
        },
      }
    );
    const data = await response.json();
    if (!data.error) {
      holidays.value = data.data;
    }
  } catch (error) {
    console.error("Failed to fetch holidays:", error);
  }
};

const VacationBaseType = ref(null);
const vacationFullInfo = ref(null);
const selectedVacationType = ref(null); // إضافة متغير لتتبع نوع الإجازة المختار

const changeVacationType = (event) => {
  console.log(event);
  newEmployeeLeave.value.vacationTypeId = event;
  const selectedType = VacationType.value.find((x) => x.id == event);
  VacationBaseType.value = selectedType.leaveBased;
  selectedVacationType.value = selectedType; // تخزين معلومات نوع الإجازة المختار

  getLeaveTypeDeitelsById();
  vacationFullInfo.value = selectedType;
};

const downloadAttachment = (url) => {
  window.open(url, "_blank");
};

const changeEmployeeLeavestatus = async () => {
  if (statusChangeInfo.value.isManager) {
    if (statusChangeInfo.value.employeeLeavestatus === "" || 
        statusChangeInfo.value.employeeLeavestatus === LeaveInfo.value.employeeLeavestatus) {
      errorMessage.value = "Please select a different status";
      return;
    }
    if (!statusChangeInfo.value.managerDescription) {
      errorMessage.value = "Please provide a manager description";
      return;
    }
  } else {
    if (statusChangeInfo.value.hrStatus === "" || 
        statusChangeInfo.value.hrStatus === LeaveInfo.value.hrStatus) {
      errorMessage.value = "Please select a different status";
      return;
    }
    if (!statusChangeInfo.value.hrDescription) {
      errorMessage.value = "Please provide an HR description";
      return;
    }
  }

  // get user role 



  errorMessage.value = "";
  successMessage.value = "";
  loading.value = true;
  try {
    const params = new URLSearchParams();
    params.append('id', statusChangeInfo.value.id);
    params.append('status', statusChangeInfo.value.employeeLeavestatus);
    
    // Only append hrStatus if it's not a manager request
    if (!statusChangeInfo.value.isManager) {
      params.append('hrStatus', statusChangeInfo.value.hrStatus);
    }
    
    params.append('managerDescription', statusChangeInfo.value.managerDescription || "");
    params.append('hrDescription', statusChangeInfo.value.hrDescription || "");
    params.append('isManager', statusChangeInfo.value.isManager.toString());

    const response = await fetch(
      `${config.public.apiUrl}/EmployeeLeave/UpdateStatus?${params.toString()}`,
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
      dialogStatus.value = false;
      showStatusDetailsDialog.value = false;
    } else {
      errorMessage.value = data.message;
    }
  } catch (error) {
    errorMessage.value = error.message || "Failed to change Leave status";
  } finally {
    loading.value = false;
  }
};

const LeaveDescription = ref("");

const formatDate = (date) => {
  if (!date) return '';
  return date.toString().split("T")[0];
};

const formatTime = (time) => {
  const [hours, minutes] = time.split(":");
  const period = hours >= 12 ? "PM" : "AM";
  const adjustedHours = hours % 12 || 12; // Convert 0 to 12 for 12-hour format
  return `${adjustedHours}:${minutes} ${period}`;
};

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


  // Check if dates are required for day-based leave
  if (newEmployeeLeave.value.usageType === "day") {
    if (!newEmployeeLeave.value.startDate) {
      errorMessage.value = "Start Date is required for day-based leave";
      return;
    }
    if (!newEmployeeLeave.value.endDate) {
      errorMessage.value = "End Date is required for day-based leave";
      return;
    }
    // Check if dates are valid (not in the past)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const startDate = new Date(newEmployeeLeave.value.startDate);
    if (startDate < today) {
      errorMessage.value = "Start Date cannot be in the past";
      return;
    }
    // Check enough days
    if (leaveTypeInfo.value.totalDays < calculateDaysDifference(
      newEmployeeLeave.value.startDate,
      newEmployeeLeave.value.endDate
    )) {
      errorMessage.value = "You don't have enough days for this leave";
      return;
    }
    // Check end date after start date
    if (newEmployeeLeave.value.endDate && newEmployeeLeave.value.startDate) {
      if (new Date(newEmployeeLeave.value.endDate) < new Date(newEmployeeLeave.value.startDate)) {
        errorMessage.value = "End Date cannot be less than Start Date";
        return;
      }
    }
  }

  // Check if times are required for hour-based leave
  if (newEmployeeLeave.value.usageType === "hour") {
    if (!newEmployeeLeave.value.startTime) {
      errorMessage.value = "Start Time is required for hour-based leave";
      return;
    }
    if (!newEmployeeLeave.value.endTime) {
      errorMessage.value = "End Time is required for hour-based leave";
      return;
    }
    // Check if times are valid (not in the past for today)
    const now = new Date();
    const startTime = new Date(newEmployeeLeave.value.startTime);
    if (startTime < now) {
      errorMessage.value = "Start Time cannot be in the past";
      return;
    }
    // Check enough hours
    if (leaveTypeInfo.value.totalHours < calculateHoursDifference(
      newEmployeeLeave.value.startTime,
      newEmployeeLeave.value.endTime
    )) {
      errorMessage.value = "You don't have enough hours for this leave";
      return;
    }
    // Check end time after start time
    if (newEmployeeLeave.value.endTime && newEmployeeLeave.value.startTime) {
      if (new Date(newEmployeeLeave.value.endTime) < new Date(newEmployeeLeave.value.startTime)) {
        errorMessage.value = "End Time cannot be less than Start Time";
        return;
      }
    }
  }

  if (!newEmployeeLeave.value.description) {
    errorMessage.value = "Please fill out description fields";
    return;
  }

  // Check if attachment is required
  if (selectedVacationType.value && selectedVacationType.value.isAttachmentRequired) {
    if (!newEmployeeLeave.value.attachmentFile) {
      errorMessage.value = "Attachment is required for this leave type. Please upload a file.";
      return;
    }
  }

  // Check for holidays
  if (newEmployeeLeave.value.startDate && newEmployeeLeave.value.endDate) {
    const holidayCheck = checkHolidayOverlap(
      newEmployeeLeave.value.startDate,
      newEmployeeLeave.value.endDate
    );
    
    if (holidayCheck) {
      errorMessage.value = holidayCheck.message;
      return;
    }
  }

  loading.value = true;
  try {
    const formData = new FormData();
    formData.append("VacationTypeId", newEmployeeLeave.value.vacationTypeId);
    formData.append("StartDate", newEmployeeLeave.value.startDate);
    formData.append("EndDate", newEmployeeLeave.value.endDate);
    formData.append("StartTime", newEmployeeLeave.value.startTime);
    formData.append("EndTime", newEmployeeLeave.value.endTime);
    formData.append("Description", newEmployeeLeave.value.description);
    formData.append("UsageType", newEmployeeLeave.value.usageType);
    // leaveDate for hour-based leave
    formData.append("LeaveDate", newEmployeeLeave.value.leaveDate);

    if (newEmployeeLeave.value.attachmentFile) {
      formData.append("AttachmentFile", newEmployeeLeave.value.attachmentFile);
    }

    if (leaveTypeInfo.value.leaveBased == 1) {
      if (!newEmployeeLeave.value.leaveDate) {
        errorMessage.value = "Leave Date is required for hour-based leave";
        return;
      }
      formData.append("LeaveDate", newEmployeeLeave.value.leaveDate);
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

const calculateDaysDifference = (startDate, endDate) => {
  const start = new Date(startDate);
  const end = new Date(endDate);
    start.setHours(0, 0, 0, 0);
  end.setHours(0, 0, 0, 0);
  return Math.floor((end - start) / (1000 * 60 * 60 * 24)) + 1;
};

const calculateHoursDifference = (startTime, endTime) => {
  const start = new Date(startTime);
  const end = new Date(endTime);
  
  return Math.abs(end - start) / (1000 * 60 * 60);
};

const checkHolidayOverlap = (startDate, endDate) => {
  if (!startDate || !endDate) return null;
  
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  // Check each day in the selected period
  for (let date = new Date(start); date <= end; date.setDate(date.getDate() + 1)) {
    const currentDate = new Date(date);
    
    // Check if the day is not Friday (weekend)
    if (currentDate.getDay() === 5) { // 5 = Friday
      return {
        isHoliday: true,
        type: 'weekend',
        date: currentDate.toISOString().split('T')[0],
        message: `Cannot request leave on Friday (${currentDate.toISOString().split('T')[0]})`
      };
    }
    
    // Check official holidays
    const overlappingHoliday = holidays.value.find(holiday => {
      const holidayStart = new Date(holiday.date);
      const holidayEnd = new Date(holiday.toDate);
      return currentDate >= holidayStart && currentDate <= holidayEnd;
    });
    
    if (overlappingHoliday) {
      return {
        isHoliday: true,
        type: 'official',
        date: currentDate.toISOString().split('T')[0],
        holidayName: overlappingHoliday.name,
        message: `Cannot request leave on official holiday: ${overlappingHoliday.name} (${currentDate.toISOString().split('T')[0]})`
      };
    }
  }
  
  return null;
};

const checkDatesForHolidays = () => {
  if (newEmployeeLeave.value.startDate && newEmployeeLeave.value.endDate) {
    const holidayCheck = checkHolidayOverlap(
      newEmployeeLeave.value.startDate,
      newEmployeeLeave.value.endDate
    );
    
    if (holidayCheck) {
      errorMessage.value = holidayCheck.message;
    } else {
      errorMessage.value = "";
    }
  }
};

// Get current month holidays
const currentMonthHolidays = computed(() => {
  const currentDate = new Date();
  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();
  
  return holidays.value.filter(holiday => {
    const holidayDate = new Date(holiday.date);
    return holidayDate.getMonth() === currentMonth && holidayDate.getFullYear() === currentYear;
  });
});

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
    usageType: "day", // تعيين القيمة الأولية بشكل صريح
    startDate: "",
    endDate: "",
    startTime: "",
    endTime: "",
    leaveDate: "",
    description: null,
    attachmentFile: null,
  };
  isEditing.value = false;
  editingLeaveId.value = null;
  selectedVacationType.value = null; // إعادة تعيين نوع الإجازة المختار
  VacationBaseType.value = null;
};

const showStatusDetails = (leave) => {
  statusDetails.value = {
    managerStatus: leave.status,
    hrStatus: leave.hrStatus,
    managerDescription: leave.managerDescription,
    hrDescription: leave.hrDescription,
    leave: leave
  };
  showStatusDetailsDialog.value = true;
};

onMounted(() => {
  fetchEmployeeLeaves();
  fetchVacationType();
  fetchHolidays();
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
          <v-alert title="Leave Information" type="info" class="m-5">
            <div><strong>Leave Name:</strong> {{ leaveTypeInfo.name }}</div>
            <div><strong>Employee:</strong> {{ leaveTypeInfo.employeeName }}</div>
            <div><strong>Used Hours:</strong> {{ leaveTypeInfo.usedHours }}</div>
            <div><strong>Remaining Hours:</strong> {{ leaveTypeInfo.remainingHours }}</div>
            <div><strong>Total Hours:</strong> {{ leaveTypeInfo.totalHours }}</div>
            <div v-if="leaveTypeInfo.isWithoutSalary" class="mt-2 text-warning">
              <strong>Note:</strong> This leave is without salary.
            </div>
            <div v-if="leaveTypeInfo.isDependVacationBalance" class="mt-2 text-info">
              <strong>Note:</strong> This leave depends on your vacation balance.
            </div>
            <div v-if="leaveTypeInfo.isAttachmentRequired" class="mt-2 text-warning">
              <strong>Note:</strong> Attachment is required for this leave type.
            </div>
            <div class="mt-2">
              <strong>Month:</strong> {{ leaveTypeInfo.month }}
              <strong>Year:</strong> {{ leaveTypeInfo.year }}
            </div>
          </v-alert>
        </div>

        <div v-if="leaveTypeIsError == true">
          <v-alert title="Attention" type="error" class="m-5">
            <div>This type of leave is not available for you.</div>
          </v-alert>
        </div>

        <!-- Holiday Information -->
        <div v-if="currentMonthHolidays.length > 0">
          <v-alert title="Holiday Information" type="info" class="m-5">
            <div class="mb-2">
              <strong>Official Holidays for this month:</strong>
            </div>
            <div v-for="holiday in currentMonthHolidays" :key="holiday.id" class="mb-1">
              • {{ holiday.name }}: {{ formatDate(holiday.date) }} - {{ formatDate(holiday.toDate) }}
            </div>
            <div class="mt-2 text-caption">
              <strong>Note:</strong> Cannot request leave on official holidays or Fridays
            </div>
          </v-alert>
        </div>

        <!-- Attachment Required Alert -->
        <div v-if="selectedVacationType && selectedVacationType.isAttachmentRequired">
          <v-alert title="Attachment Required" type="warning" class="m-5">
            <div>
              <strong>This leave type requires an attachment.</strong> Please upload a file before submitting your leave request.
            </div>
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
               <v-col cols="12" sm="6" md="3">
                <v-select
                 v-model="newEmployeeLeave.usageType"
                  :items="[
                { text: 'By Day', value: 'day' },
                    { text: 'By Hour', value: 'hour' }
                  ]"
                  label="Usage Type"
                  item-title="text"
                  item-value="value"
                  required
                ></v-select>
              </v-col>
              <v-col
                cols="12"
                sm="6"
                md="3"
                v-if="newEmployeeLeave.usageType === 'day'"
              >
                <v-text-field
                  v-model="newEmployeeLeave.startDate"
                  label="Start Date"
                  type="date"
                  required
                  @update:model-value="checkDatesForHolidays"
                ></v-text-field>
              </v-col>

              <v-col
                cols="12"
                sm="6"
                md="3"
                v-if="newEmployeeLeave.usageType === 'day'"
              >
                <v-text-field
                  v-model="newEmployeeLeave.endDate"
                  label="End Date"
                  type="date"
                  required
                  @update:model-value="checkDatesForHolidays"
                ></v-text-field>
              </v-col>

              <v-col
                cols="12"
                sm="6"
                md="3"
                v-if="newEmployeeLeave.usageType === 'hour'"
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
                v-if="newEmployeeLeave.usageType === 'hour'"
              >
                <v-text-field
                  v-model="newEmployeeLeave.endTime"
                  label="End Time"
                  type="time"
                  required
                ></v-text-field>
              </v-col>

              <v-col
                cols="12"
                sm="6"
                md="3"
                v-if="newEmployeeLeave.usageType === 'hour'"
              >
                <v-text-field
                  v-model="newEmployeeLeave.leaveDate"
                  label="Leave Date"
                  type="date"
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
                  :required="selectedVacationType && selectedVacationType.isAttachmentRequired"
                  :rules="selectedVacationType && selectedVacationType.isAttachmentRequired ? [v => !!v || 'Attachment is required'] : []"
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

            <v-col
              cols="12"
              sm="6"
              md="4"
              v-if="
                userStore.user.role == 1 ||
                userStore.user.role == 4 ||
                userStore.user.role == 5
              "
            >
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
                  { text: 'Hour Leave Based', value: 1 },
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
                  <span v-if="Leave.usageType === 'day'">Day Leave Based</span>
                  <span v-else>Hour Leave Based</span>
                </td>

                <td>
                  <span v-if="Leave.usageType === 'hour'">
                    <template v-if="Leave.leaveDate">
                      {{ formatDate(Leave.leaveDate) }}<br>
                    </template>
                    <template v-if="!isValidDate(Leave.startDate) && !isValidDate(Leave.endDate)">
                      {{ formatTime(Leave.startTime) }} - {{ formatTime(Leave.endTime) }}
                    </template>
                    <template v-else>
                      {{ formatDate(Leave.startDate) }} - {{ formatDate(Leave.endDate) }}<br>
                      {{ formatTime(Leave.startTime) }} - {{ formatTime(Leave.endTime) }}
                    </template>
                  </span>
                  <span v-else>
                    {{ formatDate(Leave.startDate) }} - {{ formatDate(Leave.endDate) }}
                  </span>
                </td>
                <td>
                  <v-btn
                    icon="mdi-information"
                    size="default"
                    variant="elevated"
                    color="primary"
                    @click="showStatusDetails(Leave)"
                    class="ma-2"
                  />
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

                <td>{{ formatDate(Leave.createdAt) }}</td>
                <td>
                  <v-btn
                    v-if="Leave.status == 0 || Leave.status == 3"
                    icon="mdi-pencil"
                    size="default"
                    variant="elevated"
                    color="primary"
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
                      selectedVacationType = Leave.vacationType;
                    "
                    class="ma-2"
                  />

                  <v-btn
                    v-if="
                      userStore.user.role == 1 ||
                      userStore.user.role == 3 ||
                      userStore.user.role == 4 ||
                      (userStore.user.role == 5 && Leave.status == 0) ||
                      Leave.status == 4
                    "
                    icon="mdi-delete"
                    size="default"
                    variant="elevated"
                    color="error"
                    @click="confirmDeleteLeave(Leave)"
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
            @input="fetchEmployeeLeaves"
          ></v-pagination>
        </v-container>
      </UiParentCard>
    </v-col>
  </v-row>

  <!-- change status dialog -->
  <v-dialog v-model="dialogStatus" max-width="400">
    <v-card>
      <v-card-title class="headline">
        {{ statusChangeInfo.isManager ? 'Change Manager Status' : 'Change HR Status' }}
      </v-card-title>
      <v-card-text>
        <v-select
          v-if="statusChangeInfo.isManager"
          v-model="statusChangeInfo.employeeLeavestatus"
          :items="employeeLeavestatus"
          item-title="text"
          item-value="value"
          label="Manager Status"
        ></v-select>
        <v-select
          v-else
          v-model="statusChangeInfo.hrStatus"
          :items="hrStatus"
          item-title="text"
          item-value="value"
          label="HR Status"
        ></v-select>
        <v-text-field
          v-if="statusChangeInfo.isManager"
          v-model="statusChangeInfo.managerDescription"
          label="Manager Description"
          required
        ></v-text-field>
        <v-text-field
          v-else
          v-model="statusChangeInfo.hrDescription"
          label="HR Description"
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

  <!-- Status Details Dialog -->
  <v-dialog v-model="showStatusDetailsDialog" max-width="600">
    <v-card>
      <v-card-title class="headline">Leave Status Details</v-card-title>
      <v-card-text>
        <v-container>
          <v-row>
            <v-col cols="12" md="6">
              <v-card class="mb-4" variant="outlined">
                <v-card-title>Manager Status</v-card-title>
                <v-card-text>
                  <div class="d-flex align-center mb-2">
                    <span class="mr-2">Status:</span>
                    <span
                      class="btn"
                      :style="getStatusStyle(statusDetails.managerStatus)"
                    >
                      {{ getStatusText(statusDetails.managerStatus) }}
                    </span>
                  </div>
                  <div v-if="statusDetails.managerDescription">
                    <div class="font-weight-bold mb-1">Description:</div>
                    <div>{{ statusDetails.managerDescription }}</div>
                  </div>
                  <div v-else class="text-grey">No manager description available</div>
                </v-card-text>
              </v-card>
            </v-col>
            <v-col cols="12" md="6">
              <v-card class="mb-4" variant="outlined">
                <v-card-title>HR Status</v-card-title>
                <v-card-text>
                  <div class="d-flex align-center mb-2">
                    <span class="mr-2">Status:</span>
                    <span
                      class="btn"
                      :style="getStatusStyle(statusDetails.hrStatus)"
                    >
                      {{ getStatusText(statusDetails.hrStatus) }}
                    </span>
                  </div>
                  <div v-if="statusDetails.hrDescription">
                    <div class="font-weight-bold mb-1">Description:</div>
                    <div>{{ statusDetails.hrDescription }}</div>
                  </div>
                  <div v-else class="text-grey">No HR description available</div>
                </v-card-text>
              </v-card>
            </v-col>
          </v-row>
        </v-container>
      </v-card-text>
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn
          v-if="
            (userStore.user.role === 3 || userStore.user.role === 5) &&
            statusDetails.leave
          "
          color="primary"
          @click="openDialogStatus(statusDetails.leave)"
        >
          Change Status
        </v-btn>
        <v-btn color="primary" text @click="showStatusDetailsDialog = false">
          Close
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
