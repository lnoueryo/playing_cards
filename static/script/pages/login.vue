<template>
  <div class="w-100">
    <div class="card">
      <div class="mb-3">
        <SignIn v-if="page"></SignIn>
        <SignUp @signUp="signedUp" v-else></SignUp>
      </div>
      <hr>
      <div class="text-end">
        <a  @click="togglePage">{{ button }}ページへ→</a>
      </div>
      <div class="d-grid gap-2 col-6 mx-auto">
      </div>
    </div>
  </div>
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
  return page.value ? '会員登録' : 'ログイン'
})

const signedUp = () => {
  page.value = true;
}

</script>

<style lang="scss" scoped>
  .card {
    max-width: 450px;
    width: 100%;
    padding: 48px;
    margin: auto;
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
  }
</style>