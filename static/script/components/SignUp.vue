<template>
  <div class="mb-4">
    <label for="name" class="form-label mb-2">名前</label>
    <input type="text" class="form-control" id="name" name="name" v-model="user.name">
  </div>
  <div class="mb-4">
    <label for="email" class="form-label mb-2">メールアドレス</label>
    <input type="email" class="form-control" id="email" name="email" v-model="user.email">
  </div>
  <div class="mb-4">
    <label for="password" class="form-label mb-2">パスワード</label>
    <input type="password" id="password" class="form-control" aria-labelledby="passwordHelpBlock" name="password" v-model="user.password">
  </div>
  <div class="mb-4">
    <label for="passwordConfirmation" class="form-label mb-2">確認用パスワード</label>
    <input type="password" id="passwordConfirmation" class="form-control" aria-labelledby="passwordHelpBlock" name="passwordConfirmation" v-model="user.passwordConfirmation">
  </div>
  <button class="btn btn-secondary w-100" type="button" @click="signUp">登録</button>
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
