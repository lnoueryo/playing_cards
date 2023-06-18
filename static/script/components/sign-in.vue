<template>
  <div class="mb-4">
    <label for="email" class="form-label mb-2">メールアドレス</label>
    <input type="email" class="form-control" id="email" name="email" v-model="user.email">
  </div>
  <div class="mb-4">
    <label for="password" class="form-label mb-2">パスワード</label>
    <input type="password" id="password" class="form-control" aria-labelledby="passwordHelpBlock" name="password" v-model="user.password">
  </div>
  <button class="btn btn-secondary w-100" type="button" @click="signIn">ログイン</button>
</template>
<script setup>
import axios from 'axios';
import { reactive } from 'vue'

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
