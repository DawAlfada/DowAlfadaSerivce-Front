<script setup lang="ts">
import { computed } from "vue";
import { useTheme } from "vuetify";
const theme = useTheme();
const primary = theme.current.value.colors.primary;
const lightprimary = theme.current.value.colors.lightprimary;

const props = defineProps({
  title: String,
  count: Number,
  color: String
});

const chartOptions = computed(() => ({
  labels: [props.title],
  chart: {
    type: "donut",
    fontFamily: `inherit`,
    foreColor: props.color,
    toolbar: { show: false },
  },
  colors: [props.color],
  plotOptions: {
    pie: {
      startAngle: 0,
      endAngle: 360,
      donut: {
        size: "75%",
        background: "transparent",
      },
    },
  },
  stroke: { show: false },
  dataLabels: { enabled: false },
  legend: { show: false },
  tooltip: { theme: "light", fillSeriesColor: false },
}));

const chartSeries = computed(() => [props.count]);

</script>

<template>
  <v-card elevation="10" class="withbg">
    <v-card-item>
      <div class="d-sm-flex align-center justify-space-between pt-sm-2">
        <v-card-title class="text-h5">{{ props.title }}</v-card-title>
      </div>
      <v-row>
        <v-col cols="7" sm="7">
          <div class="mt-6">
            <h3 class="text-h3">{{ props.count }}</h3>
          </div>
        </v-col>
        <v-col cols="5" sm="5" class="pl-lg-0">
          <div class="d-flex align-center flex-shrink-0">
            <apexchart
              type="donut"
              height="100"
              :options="chartOptions"
              :series="chartSeries"
            />
          </div>
        </v-col>
      </v-row>
    </v-card-item>
  </v-card>
</template>
