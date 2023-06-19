<template>
  <div class="mb-4">
    <label for="name" class="form-label mb-2">名前</label>
    <input type="text" :class="['form-control', {'is-invalid': validateName}]" id="name" name="name" v-model="user.name">
      <div id="validationServerUsernameFeedback" class="invalid-feedback">
        {{ validateName }}
      </div>
  </div>
  <div class="mb-4">
    <label for="email" class="form-label mb-2">メールアドレス</label>
    <input type="email" :class="['form-control', {'is-invalid': validateEmail}]" id="email" name="email" v-model="user.email">
    <div id="validationServerUsernameFeedback" class="invalid-feedback">
      {{ validateEmail }}
    </div>
  </div>
  <div class="mb-4">
    <label for="password" class="form-label mb-2">パスワード</label>
    <input type="password" id="password" :class="['form-control', {'is-invalid': validatePassword}]" aria-labelledby="passwordHelpBlock" name="password" v-model="user.password">
    <div id="validationServerUsernameFeedback" class="invalid-feedback">
      {{ validatePassword }}
    </div>
  </div>
  <div class="mb-4">
    <label for="passwordConfirmation" class="form-label mb-2">確認用パスワード</label>
    <input type="password" id="passwordConfirmation" :class="['form-control', {'is-invalid': validatePasswordConfirmation}]" aria-labelledby="passwordHelpBlock" name="passwordConfirmation" v-model="user.passwordConfirmation">
      <div id="validationServerUsernameFeedback" class="invalid-feedback">
        {{ validatePasswordConfirmation }}
      </div>
  </div>
  <button class="btn btn-secondary w-100" type="button" @click="signUp">登録</button>
</template>
<script setup>
import axios from 'axios';
import { reactive, ref, computed } from 'vue'
import { rules, validate } from '../utils'
const emit = defineEmits()

const user = reactive({
  name: '',
  password: '',
  passwordConfirmation: '',
  email: '',
  image: '',
})

const validation = ref(false)

const validateName = computed(() => {
  return validation.value && validate([rules.required, rules.max(25)], user.name)
})

const validateEmail = computed(() => {
  return validation.value && validate([rules.required, rules.emailFormat], user.email)
})

const validatePassword = computed(() => {
  return validation.value && validate([rules.required, rules.passwordFormat], user.password)
})

const validatePasswordConfirmation = computed(() => {
  return validation.value && (validate([rules.required, rules.passwordFormat], user.passwordConfirmation) || user.password != user.passwordConfirmation && 'パスワードと確認用パスワードが違います')
})

const isFormReady = computed(() => {
  return !validateEmail.value && !validatePassword.value && !validatePasswordConfirmation
})

const signUp = async() => {
  validation.value = true;
  if(!isFormReady.value) return;
  const res = await axios.post('/api/user/create', user);
  emit('signUp')
}

</script>
