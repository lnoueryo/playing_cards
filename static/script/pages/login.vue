<template>
  <SignIn v-if="page"></SignIn>
  <SignUp @signUp="signedUp" v-else></SignUp>
  <button @click="togglePage">{{ button }} Page</button>
</template>

<script setup>
import { computed, ref } from 'vue'
import SignIn from '../components/sign-in.vue'
import SignUp from '../components/sign-up.vue'

const page = ref(true)

const togglePage = () => {
  page.value = !page.value
}

const button = computed(() => {
  return page.value ? 'Sign Up' : 'Sign In'
})

const signedUp = () => {
  page.value = true;
}

</script>