import { defineStore } from 'pinia';
import { ref } from 'vue';

export const useDoubanStore = defineStore('douban', () => {
  const posts = ref([]);

  function setPosts(newPosts) {
    posts.value = newPosts;
  }

  function getPostById(postId) {
    // In a real app, you might fetch this from an API if it's not in the list
    return posts.value.find(p => p.id === postId);
  }

  return { posts, setPosts, getPostById };
});
