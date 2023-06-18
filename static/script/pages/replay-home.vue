<template>
  <div class="p-4 d-flex flex-wrap">
    <div class="card text-bg-light mb-3 me-4 w-100" v-for="(table, i) in tables" :key="i">
      <div class="card-header">{{ changeDateFormat(table.created_at) }}</div>
      <div class="card-body">
        <h5 class="card-title">ポーカー</h5>
        <div class="players">
          <div class="mb-2" v-for="player in table.players" :key="player.id">
              {{ player.id }}: {{ player.name }}
          </div>
        </div>
        <div>ルール</div>
        <div>プレイヤー数: {{table.max_players}}</div>
        <div>ラウンド数: {{table.max_rounds}}</div>
        <div>ゲーム数: {{table.max_games}}</div>
      </div>
      <div class="bg-transparent border-primary">
        <button type="button" class="btn btn-secondary w-100" @click="goToReplay(table.id)">再生</button>
      </div>
    </div>
  </div>
</template>
<script setup>
import axios from 'axios';
import { reactive, ref } from 'vue'
import { Table } from '../../../models/table/table'
import { useSessionStore } from '../store';

const store = useSessionStore()
const tables = ref([])

const goToHome = () => {
  location.href = `/`
}

const goToReplay = (table_id) => {
  location.href = `/replay/${store.user.user_id}/${table_id}`
}

const fetchTables = async() => {
  const res = await axios.get(`/api/replay/${store.user.user_id}/table`);
  tables.value = res.data;
}

const fetchUser = async() => {
  await store.getSession()
  fetchTables()
}

const changeDateFormat = (time) => {
  const date = new Date(time)
  const y = date.getFullYear();
  const m = ("00" + (date.getMonth()+1)).slice(-2);
  const d = ("00" + date.getDate()).slice(-2);
  const h = ("00" + date.getHours()).slice(-2);
  const min = ("00" + date.getMinutes()).slice(-2);
  return y + "/" + m + "/" + d + " " + h + ":" + min;
}

fetchUser()


</script>

<style lang="scss" scoped>
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display&display=swap');
  @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@300&family=Noto+Serif+JP:wght@200;300;400;500;600&family=Playfair+Display&display=swap');
  .table {
    width: 240px;
    height: 240px;
    border: solid 1px black;
    display: flex;
    flex-direction: column;
    font-family: 'Noto Sans JP', sans-serif;
  }

  .card-bottom {
    margin-top: auto;
    padding: 8px;
  }

  .card {
    max-width: 18rem;
    height: 18rem;
    position: relative;
    // font-family: 'Playfair Display', serif;
    // font-weight: bold;
    .players {
      height: 100px;
    }
  }

  .center {
    position: absolute;
    left: 50%;
    top: 50%;
    transform: translate(-50%, -50%);
  }
</style>