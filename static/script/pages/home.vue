<template>
{{user}}
  <button @click="createTable">作成</button>
  <button @click="goToReplay">リプレイ</button>
    <button @click="logout()">ログアウト</button>
    <div v-for="(table, i) in tables" :key="i" style="width: 160px;height: 160px;border: solid 1px black">
      プレイヤー数:{{table.maxPlayers}}
      ラウンド数:{{table.maxRounds}}
      ゲーム数:{{table.maxGames}}
      <div v-for="player in table.playerAggregate.players" :key="player.id">
        {{ player.id }}: {{ player.name }}
      </div>
      <button @click="joinTable(table)" :disabled="table.isMaxPlayersReached() || table.isGameEndReached()">参加</button>
    </div>
    <input type="text" v-model="rules.maxPlayers">
    <input type="text" v-model="rules.maxRounds">
    <input type="text" v-model="rules.maxGames">
</template>
<script setup>
import axios from 'axios';
import { reactive, ref } from 'vue'
import {handleAsync, WebsocketConnector} from '../utils'
import { Table } from '../../../models/table/table'

const goToTable = (path) => {
  location.href = '/table/' + path;
}
const tables = ref([])
const user = ref('')
const rules = ref({
  "maxPlayers": 3,
  "maxRounds": 4,
  "maxGames": 1,
})
const fetchTables = async() => {
  const res = await axios.get('/api/table');
  tables.value = res.data.map(table => Table.createTable(table));
}

const goToReplay = () => {
  location.href = `/replay/${user.value.user_id}`
}

const createTable = async() => {
  const res = await handleAsync(async() => await axios.post('/api/table/create', rules.value));
  if(res.status == 200) return goToTable(res.data.id)
}

const fetchUser = async() => {
  const res = await handleAsync(async() => await axios.get('/api/session'));
  user.value = res.data
  websocketConnector.value = new WebsocketConnector(user.value.user_id, websocketHandler)
  websocketConnector.value.connectWebsocket()
}

const joinTable = async(table) => {
  const res = await handleAsync(async() => await axios.post(`/api/table/join`, {table_id: table.id}));
  if(res.status == 200) return goToTable(res.data.id)
  // goToTable(table.id)
}

const logout = async() => {
  const res = await handleAsync(async() => await axios.post(`/api/logout`));
  if(res.status == 200) return location.href = '/login'
}

const websocketHandler = (e) => {
  const tablesJson = JSON.parse(e.data)
  if('tables' in tablesJson) {
    tables.value = tablesJson.tables.map(table => Table.createTable(table));
  }
}

const websocketConnector = ref('')

fetchTables()
fetchUser()


</script>