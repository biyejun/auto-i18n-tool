<template>
  <div>{{ txt }}</div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
const txt = ref('中文测试');
</script>
