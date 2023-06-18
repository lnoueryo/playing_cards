<template>
  <header class="header">
    <div>playing-cards</div>
    <div class="dropdown">
      <button class="btn btn-secondary dropdown-toggle" type="button" data-bs-toggle="dropdown" aria-expanded="false">
        {{ store.user.name }}
      </button>
      <ul class="dropdown-menu dropdown-menu-dark">
        <li><a class="dropdown-item" href="/">ホーム</a></li>
        <li><hr class="dropdown-divider"></li>
        <li><a class="dropdown-item" :href="`/replay/${store.user.user_id}`">リプレイ</a></li>
        <li><hr class="dropdown-divider"></li>
        <li @click="logout"><a class="dropdown-item" href="#">ログアウト</a></li>
      </ul>
    </div>
  </header>
</template>

<script setup>
import axios from 'axios';
import { useSessionStore } from '../store';
import {handleAsync, WebsocketConnector} from '../utils'

const store = useSessionStore()

const logout = async() => {
  const res = await handleAsync(async() => await axios.post(`/api/logout`));
  if(res.status == 200) return location.href = '/login'
}

</script>

<style lang="scss">
  .header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 24px;
  }
</style>