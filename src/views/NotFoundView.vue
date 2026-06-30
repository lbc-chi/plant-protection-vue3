<template>
  <div class="not-found">
    <div class="not-found__content">
      <div class="not-found__code">404</div>
      <h1 class="not-found__title">页面未找到</h1>
      <p class="not-found__description">抱歉，您访问的页面不存在或已被移除</p>
      <router-link to="/" class="not-found__button">返回首页</router-link>
    </div>
  </div>
</template>

<script setup lang="ts">
</script>

<style scoped>
.not-found {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background: linear-gradient(135deg, #0a1628 0%, #1a365d 50%, #0d2137 100%);
  color: #fff;
}

.not-found__content {
  text-align: center;
  padding: 60px;
}

.not-found__code {
  font-size: 120px;
  font-weight: 800;
  background: linear-gradient(135deg, #2F6F9F, #7c3aed);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  line-height: 1;
  margin-bottom: 20px;
  text-shadow: 0 0 30px rgba(47, 111, 159, 0.25);
}

.not-found__title {
  font-size: 32px;
  font-weight: 700;
  margin-bottom: 16px;
  color: #e2e8f0;
}

.not-found__description {
  font-size: 16px;
  color: #94a3b8;
  margin-bottom: 32px;
  max-width: 400px;
  margin-left: auto;
  margin-right: auto;
}

.not-found__button {
  display: inline-block;
  padding: 14px 32px;
  background: linear-gradient(135deg, #3b82f6, #7c3aed);
  color: #fff;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  text-decoration: none;
  transition: all 0.3s ease;
  box-shadow: 0 4px 20px rgba(59, 130, 246, 0.4);
}

.not-found__button:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 30px rgba(59, 130, 246, 0.5);
}


</style>
