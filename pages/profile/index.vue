<script setup>
import { ref, onMounted } from "vue";
import { useUserStore } from "@/store/user";
import UiParentCard from "@/components/shared/UiParentCard.vue";
import { useRuntimeConfig } from '#app';
// import { mdiAccount, mdiEmail, mdiBriefcase, mdiPhone, mdiCake, mdiShieldAccount, mdiDomain } from '@mdi/js';

const config = useRuntimeConfig();
const userStore = useUserStore();
const errorMessage = ref(false);
const successMessage = ref(false);
const showPassword = ref(false);
const loading = ref(false);

const employee = ref({
    value: {
        name: userStore.user.name,
        jobTitle: userStore.user.jobTitle,
        departmentId: userStore.user.departmentId,
        workEmail: userStore.user.workEmail,
        mobilePhone: userStore.user.mobilePhone,
        workPhone: userStore.user.workPhone,
        birthday: userStore.user.birthday,
        displayName: userStore.user.displayName,
        isManager: userStore.user.isManager,
        employeeType: userStore.user.employeeType,
        departmentColor: userStore.user.departmentColor,
        image512: userStore.user.image512,
    },
});

const passwordInfo = ref({
    oldPassword: '',
    newPassword: ''
});

const handleImageError = (event, fallbackImage) => {
    event.target.src = `data:image/jpeg;base64,${fallbackImage}`;
};

const changePassword = async () => {
    loading.value = true;
    errorMessage.value = '';
    
    if (!passwordInfo.value.oldPassword || !passwordInfo.value.newPassword) {
        errorMessage.value = 'Old password and new password are required';
        loading.value = false;
        return;
    }

    try {
        const response = await fetch(`${config.public.apiUrl}/Auth/ChangePassword`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${userStore.token}`
            },
            body: JSON.stringify({
                oldPassword: passwordInfo.value.oldPassword,
                newPassword: passwordInfo.value.newPassword
            })
        });

        if (!response.ok) {
            throw new Error('Change password failed');
        }

        const data = await response.json();
        successMessage.value = data.message;
        passwordInfo.value = { oldPassword: '', newPassword: '' };
    } catch (error) {
        errorMessage.value = 'Change password failed. Please check your credentials.';
    } finally {
        loading.value = false;
    }
};
</script>

<template>
    <v-container fluid>
        <v-row>
            <v-col cols="12">
                <UiParentCard>
                    <template #header>
                        <div class="d-flex align-center py-3 px-6">
                            <div>
                                <h2 class="text-h5 font-weight-medium mb-1">Employee Profile</h2>
                                <p class="text-subtitle-2 text-medium-emphasis mb-0">
                                    Manage your personal information
                                </p>
                            </div>
                        </div>
                    </template>

                    <v-alert v-if="errorMessage" type="error" variant="tonal" closable class="mb-4">
                        {{ errorMessage }}
                    </v-alert>
                    <v-alert v-if="successMessage" type="success" variant="tonal" closable class="mb-4">
                        {{ successMessage }}
                    </v-alert>

                    <!-- Profile Header -->
                    <div class="pa-6 bg-grey-lighten-5">
                        <div class="d-flex flex-column align-center">
                            <v-avatar size="120" class="mb-4">
                                <img
                                    v-if="employee.value.image512 != 'Anonymous'"
                                    :src="`data:image/svg+xml;base64,${employee.value.image512}`"
                                    @error="handleImageError($event, employee.value.image512)"
                                    alt="Profile"
                                />
                                <img
                                    v-else
                                    src="../../assets/images/anonymous.png"
                                    alt="Anonymous"
                                />
                            </v-avatar>
                            <h3 class="text-h5 font-weight-medium mb-1">{{ employee.value.name }}</h3>
                            <span class="text-subtitle-1 text-medium-emphasis">{{ employee.value.jobTitle }}</span>
                            <v-chip
                                :color="employee.value.departmentColor"
                                class="mt-2"
                                size="small"
                                variant="flat"
                            >
                                {{ employee.value.departmentId }}
                            </v-chip>
                        </div>
                    </div>

                    <!-- Profile Information -->
                    <v-container>
                        <v-row>
                            <v-col cols="12" md="6">
                                <v-card variant="flat" class="border rounded">
                                    <v-card-title class="text-h6 font-weight-medium px-6 py-4">
                                        Personal Information
                                    </v-card-title>
                                    <v-divider></v-divider>
                                    <v-list lines="two">
                                        <v-list-item>
                                            <template v-slot:prepend>
                                                <v-icon :icon="mdiEmail" color="primary"></v-icon>
                                            </template>
                                            <v-list-item-title>Email</v-list-item-title>
                                            <v-list-item-subtitle>{{ employee.value.workEmail }}</v-list-item-subtitle>
                                        </v-list-item>

                                        <v-list-item>
                                            <template v-slot:prepend>
                                                <v-icon :icon="mdiPhone" color="primary"></v-icon>
                                            </template>
                                            <v-list-item-title>Phone Numbers</v-list-item-title>
                                            <v-list-item-subtitle>
                                                Mobile: {{ employee.value.mobilePhone }}<br>
                                                Work: {{ employee.value.workPhone }}
                                            </v-list-item-subtitle>
                                        </v-list-item>

                                        <v-list-item>
                                            <template v-slot:prepend>
                                                <v-icon :icon="mdiCake" color="primary"></v-icon>
                                            </template>
                                            <v-list-item-title>Birthday</v-list-item-title>
                                            <v-list-item-subtitle>{{ employee.value.birthday }}</v-list-item-subtitle>
                                        </v-list-item>
                                    </v-list>
                                </v-card>
                            </v-col>

                            <v-col cols="12" md="6">
                                <v-card variant="flat" class="border rounded">
                                    <v-card-title class="text-h6 font-weight-medium px-6 py-4">
                                        Work Information
                                    </v-card-title>
                                    <v-divider></v-divider>
                                    <v-list lines="two">
                                        <v-list-item>
                                            <template v-slot:prepend>
                                                <v-icon :icon="mdiDomain" color="primary"></v-icon>
                                            </template>
                                            <v-list-item-title>Department</v-list-item-title>
                                            <v-list-item-subtitle>{{ employee.value.departmentId }}</v-list-item-subtitle>
                                        </v-list-item>

                                        <v-list-item>
                                            <template v-slot:prepend>
                                                <v-icon :icon="mdiBriefcase" color="primary"></v-icon>
                                            </template>
                                            <v-list-item-title>Employee Type</v-list-item-title>
                                            <v-list-item-subtitle>{{ employee.value.employeeType }}</v-list-item-subtitle>
                                        </v-list-item>

                                        <v-list-item>
                                            <template v-slot:prepend>
                                                <v-icon :icon="mdiShieldAccount" color="primary"></v-icon>
                                            </template>
                                            <v-list-item-title>Role</v-list-item-title>
                                            <v-list-item-subtitle>
                                                {{ employee.value.isManager ? 'Manager' : 'Employee' }}
                                            </v-list-item-subtitle>
                                        </v-list-item>
                                    </v-list>
                                </v-card>

                                <!-- Change Password Section -->
                                <v-card variant="flat" class="border rounded mt-4">
                                    <v-card-title class="text-h6 font-weight-medium px-6 py-4">
                                        Change Password
                                    </v-card-title>
                                    <v-divider></v-divider>
                                    <v-card-text>
                                        <v-form @submit.prevent="changePassword" class="mt-4">
                                            <v-row>
                                                <v-col cols="12">
                                                    <v-text-field
                                                        v-model="passwordInfo.oldPassword"
                                                        label="Current Password"
                                                        :type="showPassword ? 'text' : 'password'"
                                                        :append-inner-icon="showPassword ? 'mdi-eye-off' : 'mdi-eye'"
                                                        @click:append-inner="showPassword = !showPassword"
                                                        variant="outlined"
                                                        density="comfortable"
                                                    ></v-text-field>
                                                </v-col>
                                                <v-col cols="12">
                                                    <v-text-field
                                                        v-model="passwordInfo.newPassword"
                                                        label="New Password"
                                                        :type="showPassword ? 'text' : 'password'"
                                                        :append-inner-icon="showPassword ? 'mdi-eye-off' : 'mdi-eye'"
                                                        @click:append-inner="showPassword = !showPassword"
                                                        variant="outlined"
                                                        density="comfortable"
                                                    ></v-text-field>
                                                </v-col>
                                                <v-col cols="12">
                                                    <v-btn
                                                        type="submit"
                                                        color="primary"
                                                        :loading="loading"
                                                        block
                                                    >
                                                        Change Password
                                                    </v-btn>
                                                </v-col>
                                            </v-row>
                                        </v-form>
                                    </v-card-text>
                                </v-card>
                            </v-col>
                        </v-row>
                    </v-container>
                </UiParentCard>
            </v-col>
        </v-row>
    </v-container>
</template>

<style scoped>
.border {
    border: 1px solid rgb(var(--v-border-color)) !important;
}
</style>