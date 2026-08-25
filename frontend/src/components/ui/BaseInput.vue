<script setup lang="ts">
defineProps<{
  label: string
  modelValue: string | number
  type?: string
  placeholder?: string
  required?: boolean
  min?: string | number
}>()

defineEmits<{
  (e: 'update:modelValue', value: any): void
}>()
</script>

<template>
  <div>
    <label class="block text-sm font-medium text-gray-300 mb-1">{{ label }}</label>
    <input
      :type="type || 'text'"
      :value="modelValue"
      @input="$emit('update:modelValue', ($event.target as HTMLInputElement).value)"
      :placeholder="placeholder"
      :required="required"
      :min="min"
      class="w-full bg-[#131313] border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-colors"
    >
  </div>
</template>
