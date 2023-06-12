<template>
  <input type="text" name="name" v-model="user.name">
  <input type="text" name="email" v-model="user.email">
  <input type="password" name="password" v-model="user.password">
  <input type="password" name="passwordConfirmation" v-model="user.passwordConfirmation">
  <button @click="signUp">sign up</button>
</template>
<script setup>
import axios from 'axios';
import { reactive, ref } from 'vue'
const emit = defineEmits()

const user = reactive({
  name: '',
  password: '',
  passwordConfirmation: '',
  email: '',
  image: '',
})

const signUp = async() => {
  const res = await axios.post('/api/user/create', user);
  emit('signUp')
}

</script>
