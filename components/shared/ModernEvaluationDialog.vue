<template>
    <div>
      <v-dialog v-model="evaluateDialog" max-width="800px">
        <v-card class="evaluation-card">
          <v-card-title class="primary white--text d-flex align-center pa-4">
            <span class="text-h5">{{ employeeInfo?.name }}</span>
            <div class="score-summary ml-auto">
              <span class="caption white--text">Overall Progress</span>
              <v-progress-linear
                :value="calculateProgress"
                height="8"
                rounded
                color="success"
                class="mt-1"
                background-color="rgba(255,255,255,0.3)"
              ></v-progress-linear>
            </div>
          </v-card-title>
  
          <v-card-text class="pa-6">
            <v-container>
              <div v-if="questions && questions.length > 0">
                <v-row
                  v-for="question in questions"
                  :key="question.id"
                  class="evaluation-item mb-8"
                >
                  <v-col cols="12">
                    <div class="d-flex align-center mb-3">
                      <div class="question-number primary--text font-weight-bold mr-3">
                        Q{{ question.id }}
                      </div>
                      <p class="text-h6 mb-0">{{ question.text }}</p>
                    </div>
  
                    <v-card outlined class="pa-4 rounded-lg">
                      <div class="d-flex align-center mb-2">
                        <span class="emoji-indicator mr-4 text-h5">
                          {{
                            satisfactionEmojis[
                              Math.min(
                                Math.floor(
                                  (question.currentScore / question.points) * 10
                                ),
                                9
                              )
                            ]
                          }}
                        </span>
                        <div class="flex-grow-1">
                          <v-slider
                            v-model="question.currentScore"
                            :max="question.points"
                            :step="1"
                            color="primary"
                            track-color="grey lighten-3"
                            class="mt-0"
                            @click="updateEvaluationScore(question.currentScore, question.id)"
                          >
                            <template v-slot:prepend>
                              <v-chip
                                small
                                label
                                class="px-2"
                                :color="getScoreColor(question.currentScore, question.points)"
                              >
                                {{ question.currentScore }}
                              </v-chip>
                            </template>
                            <template v-slot:append>
                              <v-chip
                                small
                                outlined
                                label
                                color="primary"
                                class="px-2"
                              >
                                Max: {{ question.points }}
                              </v-chip>
                            </template>
                          </v-slider>
                        </div>
                      </div>
                    </v-card>
                  </v-col>
                </v-row>
  
                <v-divider class="my-6"></v-divider>
  
                <v-row>
                  <v-col cols="12">
                    <v-checkbox
                      v-model="isHiddenName"
                      color="primary"
                      class="modern-checkbox"
                    >
                      <template v-slot:label>
                        <div class="d-flex align-center">
                          <v-icon left color="grey">mdi-incognito</v-icon>
                          <span class="font-weight-medium">Hide My Information</span>
                        </div>
                      </template>
                    </v-checkbox>
                  </v-col>
                </v-row>
              </div>
  
              <v-row v-else>
                <v-col cols="12">
                  <v-alert
                    type="info"
                    text
                    prominent
                    border="left"
                  >
                    No questions available for evaluation
                  </v-alert>
                </v-col>
              </v-row>
            </v-container>
          </v-card-text>
  
          <v-card-actions class="pa-6 pt-0">
            <v-spacer></v-spacer>
          
            <v-btn
              v-if="questions && questions.length > 0"
              :loading="loading"
              color="primary"
              elevation="2"
              @click="addEvaluation"
              class="px-6"
            >
              <v-icon left>mdi-check</v-icon>
              Submit Evaluation
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>
    </div>
  </template>
  
  <script lang="ts">
  import { defineComponent, ref, computed } from 'vue';
  
  interface Question {
    id: number;
    text: string;
    points: number;
    currentScore: number;
  }
  
  export default defineComponent({
    props: {
      evaluateDialog: {
        type: Boolean,
        required: true,
      },
      employeeInfo: {
        type: Object as PropType<{ name: string }>,
        required: true,
      },
      questions: {
        type: Array as PropType<Question[]>,
        required: true,
      },
      loading: {
        type: Boolean,
        required: true,
      },
      isHiddenName: {
        type: Boolean,
        required: true,
      },
    },
    setup(props, { emit }) {
      const satisfactionEmojis = ref([
        "😭", "😢", "☹️", "🙁", "😐", "🙂", "😊", "😁", "😄", "😍"
      ]);
  
      const getScoreColor = (score: number, maxPoints: number): string => {
        const percentage = (score / maxPoints) * 100;
        if (percentage >= 80) return 'success';
        if (percentage >= 60) return 'warning';
        return 'error';
      };
  
      const calculateProgress = computed(() => {
        if (!props.questions.length) return 0;
        const totalPoints = props.questions.reduce((sum, q) => sum + q.points, 0);
        const currentTotal = props.questions.reduce((sum, q) => sum + (q.currentScore || 0), 0);
        return (currentTotal / totalPoints) * 100;
      });
  
      const updateEvaluationScore = (score: number, questionId: number) => {
        emit('update-score', { score, questionId });
      };
  
      const addEvaluation = () => {
        emit('submit-evaluation');
      };
  
      return {
        satisfactionEmojis,
        getScoreColor,
        calculateProgress,
        updateEvaluationScore,
        addEvaluation,
      };
    },
  });
  </script>
  
  <style scoped>
  .evaluation-card {
    border-radius: 12px;
    overflow: hidden;
  }
  
  .question-number {
    background: rgba(var(--v-primary-base), 0.1);
    padding: 8px 12px;
    border-radius: 8px;
    min-width: 45px;
    text-align: center;
  }
  
  .evaluation-item {
    transition: all 0.3s ease;
  }
  
  .evaluation-item:hover {
    transform: translateY(-2px);
  }
  
  .emoji-indicator {
    min-width: 40px;
    text-align: center;
  }
  
  .modern-checkbox ::v-deep .v-input__slot {
    margin-bottom: 0;
  }
  
  .score-summary {
    max-width: 200px;
    min-width: 150px;
  }
  
  .v-btn {
    text-transform: none;
    font-weight: 500;
  }
  </style>
  