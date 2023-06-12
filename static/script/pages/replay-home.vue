<template>
{{user}}
    <button @click="goToHome">ホーム</button>
    <div v-for="(table, i) in tables" :key="i" style="width: 160px;height: 160px;border: solid 1px black">
      プレイヤー数:{{table.maxPlayers}}
      ラウンド数:{{table.maxRounds}}
      ゲーム数:{{table.maxGames}}
      <div v-for="player in table.players" :key="player.id">
        {{ player.id }}: {{ player.name }}
      </div>
      <button @click="goToReplay(table.id)">再生</button>
    </div>
</template>
<script setup>
import axios from 'axios';
import { reactive, ref } from 'vue'
import {handleAsync, WebsocketConnector} from '../utils'
import { Table } from '../../../models/table/table'

const tables = ref([])
const user = ref('')

const goToHome = () => {
  location.href = `/`
}

const goToReplay = (table_id) => {
  location.href = `/replay/${user.value.user_id}/${table_id}`
}

const fetchTables = async() => {
  const res = await axios.get(`/api/replay/${user.value.user_id}/table`);
  tables.value = res.data;
}

const fetchUser = async() => {
  const res = await handleAsync(async() => await axios.get('/api/session'));
  user.value = res.data
  fetchTables()
}

fetchUser()


</script>