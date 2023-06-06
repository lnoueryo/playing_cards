<template>
  <input type="text" name="name" v-model="user.name">
  <input type="text" name="email" v-model="user.email">
  <input type="password" name="password" v-model="user.password">
  <button @click="signIn">sign in</button>
</template>
<script setup>
import axios from 'axios';
import { reactive, ref } from 'vue'

const count = ref(0)

const user = reactive({
  name: '',
  email: '',
  password: '',
})

const signIn = async() => {
  const res = await axios.post('/api/login', user);
  if(res.status == 200) return location.href = '/';
}

</script>
