<template>
  <form>
    <div class="mb-4">
      <label for="email" class="form-label mb-2">メールアドレス</label>
      <input type="email" :class="['form-control', {'is-invalid': validateEmail}]" id="email" name="email" v-model="user.email" required>
      <div class="invalid-feedback">
        {{ validateEmail }}
      </div>
    </div>
    <div class="mb-4">
      <label for="password" class="form-label mb-2">パスワード</label>
      <input type="password" :class="['form-control', {'is-invalid': validatePassword}]" id="password" class="form-control" aria-labelledby="passwordHelpBlock" name="password" v-model="user.password">
      <div id="validationServerUsernameFeedback" class="invalid-feedback">
        {{ validatePassword }}
      </div>
    </div>
    <button class="btn btn-secondary w-100" type="button" @click="signIn">ログイン</button>
  </form>
</template>
<script setup>
import axios from 'axios';
import { computed, reactive, ref } from 'vue'
import { rules, validate } from '../utils'

const user = reactive({
  name: '',
  email: '',
  password: '',
})

const validation = ref(false)

const validateEmail = computed(() => {
  return validation.value && validate([rules.required, rules.emailFormat], user.email)
})

const validatePassword = computed(() => {
  return validation.value && validate([rules.required, rules.passwordFormat], user.password)
})

const isFormReady = computed(() => {
  return !validateEmail.value && !validatePassword.value
})

const signIn = async() => {
  validation.value = true
  if(!isFormReady.value) return;
  const res = await axios.post('/api/login', user);
  if(res.status == 200) return location.href = '/';
}

</script>
