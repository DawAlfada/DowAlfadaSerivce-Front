<script setup>
import { ref } from 'vue';
import { useUserStore } from "@/store/user";
import { useRuntimeConfig } from "#app";

const config = useRuntimeConfig();
const userStore = useUserStore();
const feedbackDialog = ref(false);
const loading = ref(false);
const feedbackText = ref('');
const successMessage = ref('');
const errorMessage = ref('');

const openFeedbackDialog = () => {
    feedbackDialog.value = true;
};

const postFeedback = async () => {
    if (!feedbackText.value) {
        errorMessage.value = "Please enter your feedback.";
        return;
    }
    loading.value = true;
    try {
        const response = await fetch(
            `${config.public.apiUrl}/Feedback`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${userStore.token}`,
                },
                body: JSON.stringify({
                    feedbackText: feedbackText.value,
                }),
            }
        );
        const data = await response.json();
        // emtpy the feedback text
        feedbackText.value = '';

        if (!data.error) {
            successMessage.value = "Evaluation submitted successfully.";
        } else {
            errorMessage.value = "Failed to submit evaluation.";
        }
    } catch (error) {
        errorMessage.value = "An error occurred while submitting the evaluation.";
    } finally {
        loading.value = false;
        // feedbackDialog.value = false;
    }
};
</script>

<template>
     <v-sheet rounded="md" color="lightprimary" class="ExtraBox hide-menu mx-3 px-6 pb-5 pt-4">
        <div class="d-flex align-center">
            <div class="pr-1">
                <h6 class="text-h6 text-10 mb-2">Feedback</h6>
                <v-btn size="small" color="primary" @click="openFeedbackDialog" flat>Post Your</v-btn>
            </div>
            <div class="mt-n7 ml-2">
                <img src="/images/background/rocket.png" width="100" alt="background"/>
            </div>
        </div>
    </v-sheet>

    <v-dialog v-model="feedbackDialog" max-width="600">
        <!-- show message here  -->
        <v-alert v-if="successMessage" type="success" dismissible>{{ successMessage }}</v-alert>
        <v-alert v-if="errorMessage" type="error" dismissible>{{ errorMessage }}</v-alert>
        <v-card>
            <v-card-title class="headline">Feedback</v-card-title>
            <v-card-text>
                <v-textarea label="Your feedback" v-model="feedbackText" rows="5"></v-textarea>
            </v-card-text>
            <v-card-actions>
                <v-spacer></v-spacer>
                <v-btn color="blue darken-1" text @click="feedbackDialog = false">Close</v-btn>
                <v-btn color="blue darken-1" :loading="loading" text @click="postFeedback">Save</v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>
</template>

<style lang="scss">
.ExtraBox {
    position: relative;
}
.line-height-none {
    line-height: normal;
}
</style>
