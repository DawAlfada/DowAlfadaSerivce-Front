<script setup>
import { ref, onMounted, computed } from "vue";
import { useUserStore } from "@/store/user";
import UiParentCard from "@/components/shared/UiParentCard.vue";
import { useRuntimeConfig } from "#app";

const config = useRuntimeConfig();
const userStore = useUserStore();
const holidays = ref([]);
const loading = ref(false);
const errorMessage = ref("");
const currentDate = ref(new Date());
const selectedDate = ref(null);

const currentMonth = computed(() => currentDate.value.getMonth());
const currentYear = computed(() => currentDate.value.getFullYear());

const fetchHolidays = async () => {
  loading.value = true;
  try {
    const response = await fetch(
      `${config.public.apiUrl}/Holiday?Page=1&PageSize=100`,
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${userStore.token}`,
        },
      }
    );
    const data = await response.json();
    if (!data.error) {
      holidays.value = data.data.items;
    } else {
      errorMessage.value = data.message || "Failed to fetch holidays";
    }
  } catch (error) {
    errorMessage.value = "Failed to fetch holidays";
    console.error("Error fetching holidays:", error);
  } finally {
    loading.value = false;
  }
};

const getDaysInMonth = (year, month) => {
  return new Date(year, month + 1, 0).getDate();
};

const getFirstDayOfMonth = (year, month) => {
  return new Date(year, month, 1).getDay();
};

const calendarDays = computed(() => {
  const days = [];
  const totalDays = getDaysInMonth(currentYear.value, currentMonth.value);
  const firstDay = getFirstDayOfMonth(currentYear.value, currentMonth.value);
  
  // Add empty cells for days before the first day of the month
  for (let i = 0; i < firstDay; i++) {
    days.push({ day: null, isCurrentMonth: false });
  }
  
  // Add days of the current month
  for (let day = 1; day <= totalDays; day++) {
    const date = new Date(currentYear.value, currentMonth.value, day);
    const dayOfWeek = date.getDay(); // 0 = Sunday, 5 = Friday
    const isFriday = dayOfWeek === 5;
    
    const holiday = holidays.value.find(h => {
      const holidayStartDate = new Date(h.date);
      const holidayEndDate = new Date(h.toDate);
      const currentDate = new Date(currentYear.value, currentMonth.value, day);
      
      return currentDate >= holidayStartDate && 
             currentDate <= holidayEndDate;
    });
    
    days.push({
      day,
      date,
      holiday,
      isCurrentMonth: true,
      isToday: date.toDateString() === new Date().toDateString(),
      isFriday: isFriday
    });
  }
  
  return days;
});

const monthNames = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const previousMonth = () => {
  currentDate.value = new Date(currentYear.value, currentMonth.value - 1, 1);
};

const nextMonth = () => {
  currentDate.value = new Date(currentYear.value, currentMonth.value + 1, 1);
};

const goToToday = () => {
  currentDate.value = new Date();
};

const selectDate = (day) => {
  if (day && day.isCurrentMonth) {
    selectedDate.value = day;
  }
};

const getHolidayColor = (holiday) => {
  if (holiday.isUpcoming) return 'success';
  if (holiday.isPast) return 'grey';
  return 'primary';
};

const getHolidayStatusText = (holiday) => {
  if (holiday.isUpcoming) return 'Upcoming';
  if (holiday.isPast) return 'Past';
  return 'Today';
};

const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

const upcomingHolidays = computed(() => {
  return holidays.value.filter(h => h.isUpcoming).slice(0, 5);
});

const pastHolidays = computed(() => {
  return holidays.value.filter(h => h.isPast).slice(0, 3);
});

onMounted(() => {
  fetchHolidays();
});
</script>

<template>
  <div>
    <!-- Alert Messages -->
    <v-alert
      v-if="errorMessage"
      type="error"
      variant="tonal"
      closable
      class="mb-4"
    >
      {{ errorMessage }}
    </v-alert>

    <v-row>
      <v-col cols="12">
        <UiParentCard title="Holiday Calendar">
          <v-container>
            <!-- Calendar Navigation -->
            <v-row>
              <v-col cols="12">
                <UiParentCard class="mb-4">
                  <v-card-text class="pa-6">
                    <div class="d-flex justify-space-between align-center">
                      <v-btn
                        icon="mdi-chevron-left"
                        @click="previousMonth"
                        variant="text"
                        size="large"
                        color="primary"
                      />
                      <div class="text-center">
                        <h2 class="text-h3 font-weight-bold text-primary mb-2">
                          {{ monthNames[currentMonth] }} {{ currentYear }}
                        </h2>
                        <v-btn
                          color="primary"
                          size="small"
                          @click="goToToday"
                          prepend-icon="mdi-calendar-today"
                        >
                          Today
                        </v-btn>
                      </div>
                      <v-btn
                        icon="mdi-chevron-right"
                        @click="nextMonth"
                        variant="text"
                        size="large"
                        color="primary"
                      />
                    </div>
                  </v-card-text>
                </UiParentCard>
              </v-col>
            </v-row>

            <!-- Main Content Row -->
            <v-row>
              <!-- Calendar Grid -->
              <v-col cols="12" lg="8">
                <UiParentCard class="calendar-card">
                  <v-card-title class="text-h6 pa-4 pb-2">
                    Monthly Calendar
                  </v-card-title>
                  <v-card-text class="pa-4 pt-2">
                    <div v-if="loading" class="d-flex justify-center pa-8">
                      <v-progress-circular indeterminate color="primary" size="64" />
                    </div>
                    <div v-else class="calendar-container">
                      <!-- Day Headers -->
                      <div class="calendar-grid">
                        <div
                          v-for="dayName in dayNames"
                          :key="dayName"
                          class="calendar-header"
                        >
                          <span class="font-weight-medium">{{ dayName }}</span>
                        </div>
                        
                        <!-- Calendar Days -->
                        <div
                          v-for="(day, index) in calendarDays"
                          :key="index"
                          class="calendar-day"
                          :class="{
                            'empty-day': !day.isCurrentMonth,
                            'today': day.isToday,
                            'selected': selectedDate?.day === day.day,
                            'has-holiday': day.holiday,
                            'friday': day.isFriday
                          }"
                          @click="selectDate(day)"
                        >
                          <div v-if="day.isCurrentMonth" class="day-content">
                            <div class="day-header">
                              <span class="day-number" :class="{ 
                                'today-number': day.isToday,
                                'friday-number': day.isFriday && !day.isToday
                              }">
                                {{ day.day }}
                              </span>
                            </div>
                            <div v-if="day.holiday" class="holiday-indicator">
                              <v-chip
                                :color="getHolidayColor(day.holiday)"
                                size="x-small"
                                variant="tonal"
                                class="holiday-chip"
                                :class="{ 'today-holiday': day.isToday }"
                              >
                                {{ day.holiday.name }}
                              </v-chip>
                            </div>
                            <div v-else-if="day.isFriday" class="friday-indicator">
                              <v-chip
                                color="warning"
                                size="x-small"
                                variant="tonal"
                                class="friday-chip"
                              >
                                Weekend
                              </v-chip>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </v-card-text>
                </UiParentCard>
              </v-col>

              <!-- Sidebar -->
              <v-col cols="12" lg="4">
                <div class="d-flex flex-column gap-4">
                  <!-- Selected Date Details -->
                  <UiParentCard v-if="selectedDate && selectedDate.holiday">
                    <v-card-title class="text-h6 pa-4 pb-2">
                      <v-icon color="primary" class="mr-2">mdi-calendar-star</v-icon>
                      Holiday Details
                    </v-card-title>
                    <v-card-text class="pa-4 pt-2">
                      <v-list density="compact">
                        <v-list-item class="px-0">
                          <template v-slot:prepend>
                            <v-icon color="primary" size="small">mdi-calendar</v-icon>
                          </template>
                          <v-list-item-title class="font-weight-medium">
                            {{ selectedDate.holiday.name }}
                          </v-list-item-title>
                        </v-list-item>
                        
                        <v-list-item class="px-0">
                          <template v-slot:prepend>
                            <v-icon color="primary" size="small">mdi-calendar-clock</v-icon>
                          </template>
                          <v-list-item-title class="text-body-2">
                            {{ formatDate(selectedDate.date) }}
                          </v-list-item-title>
                        </v-list-item>
                        
                        <v-list-item class="px-0">
                          <template v-slot:prepend>
                            <v-icon color="primary" size="small">mdi-calendar-end</v-icon>
                          </template>
                          <v-list-item-title class="text-body-2">
                            {{ formatDate(selectedDate.holiday.toDate) }}
                          </v-list-item-title>
                        </v-list-item>
                        
                        <v-list-item class="px-0">
                          <template v-slot:prepend>
                            <v-icon color="primary" size="small">mdi-flag</v-icon>
                          </template>
                          <v-list-item-title>
                            <v-chip
                              :color="getHolidayColor(selectedDate.holiday)"
                              size="small"
                              variant="tonal"
                            >
                              {{ getHolidayStatusText(selectedDate.holiday) }}
                            </v-chip>
                          </v-list-item-title>
                        </v-list-item>
                        
                        <v-list-item v-if="selectedDate.holiday.description" class="px-0">
                          <template v-slot:prepend>
                            <v-icon color="primary" size="small">mdi-information</v-icon>
                          </template>
                          <v-list-item-title class="text-body-2">
                            {{ selectedDate.holiday.description }}
                          </v-list-item-title>
                        </v-list-item>
                      </v-list>
                      
                      <div class="d-flex justify-end mt-4">
                        <v-btn
                          color="primary"
                          @click="$router.push(`/holiday/${selectedDate.holiday.id}`)"
                          prepend-icon="mdi-eye"
                          size="small"
                        >
                          View Details
                        </v-btn>
                      </div>
                    </v-card-text>
                  </UiParentCard>

                  <!-- Upcoming Holidays -->
                  <UiParentCard>
                    <v-card-title class="text-h6 pa-4 pb-2">
                      <v-icon color="success" class="mr-2">mdi-calendar-clock</v-icon>
                      Upcoming Holidays
                    </v-card-title>
                    <v-card-text class="pa-4 pt-2">
                      <v-list v-if="upcomingHolidays.length > 0" density="compact">
                        <v-list-item
                          v-for="holiday in upcomingHolidays"
                          :key="holiday.id"
                          @click="$router.push(`/holiday/${holiday.id}`)"
                          class="cursor-pointer px-0"
                        >
                          <template v-slot:prepend>
                            <v-icon color="success" size="small">mdi-calendar</v-icon>
                          </template>
                          <v-list-item-title class="text-body-2 font-weight-medium">
                            {{ holiday.name }}
                          </v-list-item-title>
                          <v-list-item-subtitle class="text-caption">
                            {{ formatDate(holiday.date) }}
                          </v-list-item-subtitle>
                          <template v-slot:append>
                            <v-chip
                              color="success"
                              size="x-small"
                              variant="tonal"
                            >
                              {{ holiday.remainingDays }} days
                            </v-chip>
                          </template>
                        </v-list-item>
                      </v-list>
                      <div v-else class="text-center pa-4">
                        <v-icon size="48" color="grey">mdi-calendar-blank</v-icon>
                        <p class="text-body-2 mt-2 text-grey">No upcoming holidays</p>
                      </div>
                    </v-card-text>
                  </UiParentCard>

                  <!-- Quick Actions -->
                  <UiParentCard v-if="userStore.user.role === 1 || userStore.user.role === 4 || userStore.user.role === 5">
                    <v-card-title class="text-h6 pa-4 pb-2">
                      <v-icon color="primary" class="mr-2">mdi-tools</v-icon>
                      Quick Actions
                    </v-card-title>
                    <v-card-text class="pa-4 pt-2">
                      <div class="d-flex flex-column gap-3">
                        <v-btn
                          color="primary"
                          @click="$router.push('/holiday')"
                          prepend-icon="mdi-format-list-bulleted"
                          size="small"
                          block
                          variant="outlined"
                        >
                          View All Holidays
                        </v-btn>
                        <v-btn
                          color="success"
                          @click="$router.push('/holiday')"
                          prepend-icon="mdi-plus"
                          size="small"
                          block
                          variant="outlined"
                        >
                          Add New Holiday
                        </v-btn>
                      </div>
                    </v-card-text>
                  </UiParentCard>

                  <!-- Weekend Info -->
                  <UiParentCard>
                    <v-card-title class="text-h6 pa-4 pb-2">
                      <v-icon color="warning" class="mr-2">mdi-calendar-weekend</v-icon>
                      Weekend Info
                    </v-card-title>
                    <v-card-text class="pa-4 pt-2">
                      <v-list density="compact">
                        <v-list-item class="px-0">
                          <template v-slot:prepend>
                            <v-icon color="warning" size="small">mdi-calendar</v-icon>
                          </template>
                          <v-list-item-title class="text-body-2">
                            <strong>Friday</strong> is the weekend
                          </v-list-item-title>
                        </v-list-item>
                        <v-list-item class="px-0">
                          <template v-slot:prepend>
                            <v-icon color="warning" size="small">mdi-information</v-icon>
                          </template>
                          <v-list-item-title class="text-body-2">
                            Highlighted in <v-chip color="warning" size="x-small" variant="tonal">yellow</v-chip>
                          </v-list-item-title>
                        </v-list-item>
                      </v-list>
                    </v-card-text>
                  </UiParentCard>
                </div>
              </v-col>
            </v-row>
          </v-container>
        </UiParentCard>
      </v-col>
    </v-row>
  </div>
</template>

<style scoped>
.calendar-container {
  min-height: 500px;
}

.calendar-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 1px;
  background-color: #e0e0e0;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  overflow: hidden;
}

.calendar-header {
  background-color: #f5f5f5;
  padding: 16px 8px;
  text-align: center;
  font-weight: 600;
  font-size: 0.875rem;
  color: #424242;
  border-bottom: 1px solid #e0e0e0;
}

.calendar-day {
  background-color: white;
  min-height: 100px;
  padding: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;
  border-right: 1px solid #f0f0f0;
  border-bottom: 1px solid #f0f0f0;
}

.calendar-day:hover {
  background-color: #f8f9fa;
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.calendar-day.empty-day {
  background-color: #fafafa;
  cursor: default;
}

.calendar-day.today {
  background-color: #e3f2fd;
  border: 2px solid #2196f3;
}

.calendar-day.selected {
  background-color: #bbdefb;
  border: 2px solid #1976d2;
}

.calendar-day.has-holiday {
  background-color: #e8f5e8;
}

.calendar-day.friday {
  background-color: #fff8e1;
  border: 1px solid #ffd700;
}

.calendar-day.friday:hover {
  background-color: #fff3cd;
}

.day-content {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.day-header {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 4px;
}

.day-number {
  font-weight: 600;
  font-size: 1rem;
  color: #424242;
  padding: 4px 8px;
  border-radius: 4px;
  background-color: #f5f5f5;
}

.today-number {
  background-color: #2196f3;
  color: white;
  font-weight: 700;
}

.friday-number {
  background-color: #ffd700;
  color: black;
  font-weight: 700;
}

.holiday-indicator {
  flex-grow: 1;
  display: flex;
  align-items: flex-end;
  margin-top: 4px;
}

.holiday-chip {
  font-size: 0.7rem;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-weight: 500;
}

.today-holiday {
  font-weight: 700;
}

.friday-indicator {
  flex-grow: 1;
  display: flex;
  align-items: flex-end;
  margin-top: 4px;
}

.friday-chip {
  font-size: 0.7rem;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-weight: 500;
}

.cursor-pointer {
  cursor: pointer;
}

.cursor-pointer:hover {
  background-color: #f5f5f5;
}

.gap-4 {
  gap: 16px;
}

.calendar-card {
  height: fit-content;
}

/* Responsive adjustments */
@media (max-width: 960px) {
  .calendar-day {
    min-height: 80px;
  }
  
  .day-number {
    font-size: 0.875rem;
    padding: 2px 6px;
  }
  
  .holiday-chip {
    font-size: 0.65rem;
  }
}

@media (max-width: 600px) {
  .calendar-day {
    min-height: 60px;
    padding: 4px;
  }
  
  .day-number {
    font-size: 0.75rem;
    padding: 1px 4px;
  }
  
  .holiday-chip {
    font-size: 0.6rem;
  }
  
  .calendar-header {
    padding: 12px 4px;
    font-size: 0.75rem;
  }
}
</style> 