<template>
  <ImagePreviewer 
    v-model:visible="previewStore.showPreviewer" 
    :image-url="previewStore.previewContent.imageUrl"
    :text-content="previewStore.previewContent.textContent"
  />
</template>

<script setup>
import { usePreviewStore } from '@/stores/previewStore';
import ImagePreviewer from '@/components/common/ImagePreviewer.vue';

const previewStore = usePreviewStore();
</script>
