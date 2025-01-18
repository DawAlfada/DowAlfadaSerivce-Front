# Template section
<template>
  <v-row>
    <v-col cols="12" md="12">
      <div class="tree-chart">
    <div v-if="nodes.length" class="tree-container">
      <!-- Connection lines -->
      <div
        v-for="(connection, index) in connections"
        :key="`connection-${index}`"
        class="line"
        :style="{
          top: `${connection.y1}px`,
          left: `${connection.x1}px`,
          width: `${connection.width}px`,
          transform: `rotate(${connection.angle}rad)`,
        }"
      ></div>
      
      <!-- Nodes -->
      <div
        v-for="(node, index) in nodes"
        :key="`node-${index}`"
        class="node"
        :class="{ 'has-children': hasChildren(node) }"
        :style="{
          top: `${node.y}px`,
          left: `${node.x}px`,
        }"
        @mouseenter="handleNodeHover(node, true)"
        @mouseleave="handleNodeHover(node, false)"
      >
        <div class="node-content">
          <div class="node-header">
            <h4 class="node-title">{{ node.name }}</h4>
            <span class="node-subtitle">{{ node.displayName }}</span>
          </div>
          
          <div class="node-body" v-if="node.employees && node.employees.length">
            <div class="employee-count">
              <span class="count-badge">{{ node.employees.length }}</span>
              {{ node.employees.length === 1 ? 'موظف' : 'موظفين' }}
            </div>
            
            <div class="employees-grid">
              <div 
                v-for="(employee, empIndex) in node.employees.slice(0, 4)" 
                :key="`emp-${empIndex}`"
                class="employee-item"
                :title="employee.name"
              >
                <div class="employee-avatar">
                  <img
                    :src="employee.image512 ? `data:image/svg+xml;base64,${employee.image512}` : 'fallback-image-url.jpg'"
                    @error="handleImageError($event, employee.image512)"
                    alt="user"
                    class="avatar"
                  />
                </div>
                <span class="employee-name" :title="employee.name">{{ employee.name }}</span>
              </div>
            </div>
            
            <div v-if="node.employees.length > 4" class="more-employees">
              +{{ node.employees.length - 4 }} more
            </div>
          </div>
        </div>
      </div>
    </div>
    <div v-else class="loading-state">
      <div class="loading-spinner"></div>
      <p>loading ...</p>
    </div>
  </div>
      </v-col>
      </v-row>



</template>

<script setup>
import { ref, onMounted } from "vue";
import { useRuntimeConfig } from "#app";
import { useUserStore } from "@/store/user";

const userStore = useUserStore();
const config = useRuntimeConfig();

const nodes = ref([]);
const connections = ref([]);
const hoveredNode = ref(null);

const chartWidth = 3000;
const chartHeight = 1500;

const LEVEL_HEIGHT = 220;  // Increased vertical spacing
const MIN_NODE_SPACING = 350;  // Increased horizontal spacing
const ROOT_Y = 100;

const hasChildren = (node) => {
  return node.children && node.children.length > 0;
};

const handleNodeHover = (node, isHovered) => {
  hoveredNode.value = isHovered ? node : null;
};

const handleImageError = (event, fallbackImage) => {
  event.target.src = `data:image/jpeg;base64,${fallbackImage}`;
};

const fetchTree = async () => {
  try {
    const response = await fetch(
      `${config.public.apiUrl}/Department/GetDepartmentTreeAsync`,
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${userStore.token}`,
        }
      }
    );

    const data = await response.json();
    if (!data.error) {
      nodes.value = [];
      connections.value = [];
      const treeData = data.data;
      calculateNodeWidths(treeData);
      // Center the root node
      calculateTree(treeData, chartWidth / 2, ROOT_Y);
    }
  } catch (error) {
    console.error("Failed to fetch departments:", error);
  }
};

const calculateNodeWidths = (node) => {
  if (!node.children || node.children.length === 0) {
    node._width = MIN_NODE_SPACING;
    return MIN_NODE_SPACING;
  }

  let totalWidth = 0;
  node.children.forEach(child => {
    totalWidth += calculateNodeWidths(child);
  });

  node._width = Math.max(totalWidth, MIN_NODE_SPACING);
  return node._width;
};

const calculateTree = (node, x, y, level = 0) => {
  nodes.value.push({
    ...node,
    x,
    y
  });

  if (node.children && node.children.length > 0) {
    let currentX = x - (node._width / 2) + (node.children[0]._width / 2);

    node.children.forEach((child, index) => {
      const childX = currentX;
      const childY = y + LEVEL_HEIGHT;

      const dx = childX - x;
      const dy = childY - y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      const angle = Math.atan2(dy, dx);

      connections.value.push({
        x1: x,
        y1: y,
        width: distance,
        angle,
      });

      calculateTree(child, childX, childY, level + 1);
      currentX += child._width;
    });
  }
};

onMounted(fetchTree);
</script>

<style scoped>
.tree-chart {
  position: relative;
  overflow: auto;
  padding: 40px;
  background: #f8f9fa;
}

.tree-container {
  position: relative;
  width: 3000px;  /* Increased width */
  height: 1500px;  /* Increased height */
  margin: 0 auto;
}

.node {
  position: absolute;
  width: 300px;  /* Increased width */
  transform: translate(-50%, -50%);
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
  z-index: 2;
}

.node-content {
  padding: 20px;  /* Increased padding */
}

.node-header {
  text-align: center;
  margin-bottom: 12px;
  padding-bottom: 12px;
  border-bottom: 1px solid #eee;
}

.node-title {
  margin: 0;
  color: #2c3e50;
  font-size: 18px;
  font-weight: 600;
}

.node-subtitle {
  display: block;
  color: #6c757d;
  font-size: 14px;
  margin-top: 4px;
}

.employee-count {
  text-align: center;
  color: #6c757d;
  font-size: 14px;
  margin-bottom: 12px;
}

.count-badge {
  background: #e9ecef;
  padding: 2px 8px;
  border-radius: 12px;
  margin-right: 4px;
  font-weight: 600;
}

.employees-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;  /* Increased gap */
  margin-top: 12px;
}

.employee-item {
  display: flex;
  align-items: center;
  padding: 4px;
  max-width: 100%;  /* Ensure container doesn't overflow */
}

.employee-avatar {
  min-width: 32px;  /* Fixed width */
  width: 32px;
  height: 32px;
  margin-left: 8px;  /* RTL support */
  border-radius: 50%;
  overflow: hidden;
  border: 2px solid #fff;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.avatar {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.employee-name {
  font-size: 12px;
  color: #495057;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 80px;  /* Limit text width */
}

.more-employees {
  text-align: center;
  color: #6c757d;
  font-size: 12px;
  margin-top: 12px;

}

.line {
  position: absolute;
  height: 2px;
  background: linear-gradient(to right, #dee2e6, #adb5bd);
  transform-origin: left center;
  z-index: 1;
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
 
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #f3f3f3;
  border-top: 3px solid #3498db;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 16px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* Responsive support */
@media (max-width: 1280px) {
  .node {
    width: 280px;
  }
  
  .employee-name {
    max-width: 70px;
  }
}
</style>