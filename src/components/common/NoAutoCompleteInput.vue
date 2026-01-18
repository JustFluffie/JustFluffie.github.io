<template>
  <input
    ref="inputRef"
    v-model="model"
    :autocomplete="autocompleteValue"
    data-form-type="other"
    data-lpignore="true"
    :readonly="isReadonly"
    v-bind="$attrs"
    @focus="handleFocus"
  />
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';

const model = defineModel<string | number>();

const inputRef = ref<HTMLInputElement | null>(null);
const isReadonly = ref(true);

// Use a computed property for autocomplete to switch between "off" and "new-password"
// This is a common trick to confuse password managers.
const autocompleteValue = computed(() => (isReadonly.value ? 'off' : 'new-password'));

const handleFocus = () => {
  // When the input is focused, remove the readonly attribute to allow user input.
  // This technique helps prevent some browsers from autofilling the field on page load.
  isReadonly.value = false;
};

</script>

<style scoped>
/*
  The following styles are intended to hide or override browser-injected
  autofill indicators and styles.
*/

/* Hide the autofill icon provided by some browsers (e.g., Chrome) */
input::-webkit-contacts-auto-fill-button,
input::-webkit-credentials-auto-fill-button {
  visibility: hidden;
  display: none !important;
  pointer-events: none;
  height: 0;
  width: 0;
  margin: 0;
}

/*
  Override the default blue background and white text that Chrome applies
  to autofilled inputs. We use a box-shadow with a high z-index to paint
  over the browser's styles.
*/
input:-webkit-autofill,
input:-webkit-autofill:hover,
input:-webkit-autofill:focus,
input:-webkit-autofill:active {
  -webkit-box-shadow: 0 0 0 1000px white inset !important;
  /* You can change 'white' to your desired background color */
  -webkit-text-fill-color: #333 !important; /* Set your desired text color */
  transition: background-color 5000s ease-in-out 0s;
}
</style>
