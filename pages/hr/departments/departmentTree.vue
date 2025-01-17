<template>
  <div class="tree-chart">
    <div v-if="nodes.length" class="tree-container">
      <!-- خطوط الاتصال مع تأثيرات حركية -->
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
      
      <!-- العقد مع تصميم محسن -->
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
              >
                <div class="employee-avatar">
                  <img
                      :src="
                        employee.image512
                          ? `data:image/svg+xml;base64,${employee.image512}`
                          : 'fallback-image-url.jpg'
                      "
                      @error="handleImageError($event, employee.image512)"
                      width="35"
                      height="35"
                      alt="user"
                      class="avatar"
                    />
                </div>
                <span class="employee-name">{{ employee.name }}</span>
              </div>
            </div>
            
            <div v-if="node.employees.length > 4" class="more-employees">
              +{{ node.employees.length - 4 }} آخرين
            </div>
          </div>
        </div>
      </div>
    </div>
    <div v-else class="loading-state">
      <div class="loading-spinner"></div>
      <p>جاري تحميل بيانات الهيكل التنظيمي...</p>
    </div>
  </div>
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

const chartWidth = 1200; // زيادة العرض للتناسب مع التصميم الجديد
const chartHeight = 800; // زيادة الارتفاع للتناسب مع التصميم الجديد

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
      const treeData = data.data;
      calculateTree(treeData, chartWidth / 2, 80); // تعديل نقطة البداية
    }
  } catch (error) {
    console.error("Failed to fetch departments:", error);
  }
};

const calculateTree = (node, x, y, level = 0, spacing = 400) => {
  nodes.value.push({
    name: node.name,
    displayName: node.displayName,
    employees: node.employees || [],
    children: node.children || [],
    x,
    y
  });

  if (node.children && node.children.length > 0) {
    const childSpacing = Math.min(spacing, 600 / node.children.length);
    let currentX = x - (childSpacing * (node.children.length - 1)) / 2;

    node.children.forEach((child) => {
      const childX = currentX;
      const childY = y + 180; // زيادة المسافة الرأسية بين المستويات

      // حساب خط الاتصال
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

      calculateTree(child, childX, childY, level + 1, childSpacing);
      currentX += childSpacing;
    });
  }
};

onMounted(fetchTree);
</script>

<style scoped>
.tree-chart {
  position: relative;
  width: 100%;
  min-height: 800px;
  overflow: auto;
  padding: 40px;
  box-sizing: border-box;
}

.tree-container {
  position: relative;
  width: 1200px;
  min-height: 800px;
  margin: 0 auto;
}

.node {
  position: absolute;
  width: 280px;
  transform: translate(-50%, -50%);
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
}

.node:hover {
  transform: translate(-50%, -50%) scale(1.02);
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.15);
}

.node-content {
  padding: 16px;
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
  gap: 8px;
  margin-top: 12px;
}

.employee-item {
  display: flex;
  align-items: center;
  padding: 4px;
}

.employee-avatar {
  width: 32px;
  height: 32px;
  margin-right: 8px;
  border-radius: 50%;
  overflow: hidden;
  border: 2px solid #fff;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.employee-avatar img {
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
}

.more-employees {
  text-align: center;
  color: #6c757d;
  font-size: 12px;
  margin-top: 8px;
}

.line {
  position: absolute;
  height: 2px;
  background: linear-gradient(to right, #dee2e6, #adb5bd);
  transform-origin: left center;
  z-index: 0;
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 400px;
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

/* توافق مع الشاشات الصغيرة */
@media (max-width: 1280px) {
  .tree-container {
    width: 100%;
    overflow-x: auto;
  }
  
  .node {
    width: 240px;
  }
}
</style>