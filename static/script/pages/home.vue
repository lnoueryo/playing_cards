<template>
{{user}}
  <button @click="createTable">作成</button>
    <button @click="logout()">ログアウト</button>
    <div v-for="(table, i) in tables" :key="i" style="width: 160px;height: 160px;border: solid 1px black">
      <div v-for="player in table.playerAggregate.players" :key="player.id">
        {{ player.id }}: {{ player.name }}
      </div>
      <button @click="joinTable(table)" :disabled="table.isMaxPlayersReached() || table.isGameEndReached()">参加</button>
    </div>
</template>
<script setup>
import axios from 'axios';
import { reactive, ref } from 'vue'
import {handleAsync, WebsocketConnector} from '../utils'
import { TableBase } from '../../../models/table/table'

const goToTable = (path) => {
  location.href = '/table/' + path;
}
const tables = ref([])
const user = ref('')
const table = {
  "maxPlayers": 2,
  "maxRounds": 4,
  "maxGames": 1,
}
const fetchTables = async() => {
  const res = await axios.get('/api/table');
  tables.value = res.data.map(table => TableBase.createTable(table));
}

const createTable = async() => {
  const res = await handleAsync(async() => await axios.post('/api/table/create', table));
  if(res.status == 200) return goToTable(res.data.id)
}

const fetchUser = async() => {
  const res = await handleAsync(async() => await axios.get('/api/user'));
  user.value = res.data
  websocketConnector.value = new WebsocketConnector(user.value.id, websocketHandler)
  websocketConnector.value.connectWebsocket()
}

const joinTable = async(table) => {
  const res = await handleAsync(async() => await axios.post(`/api/table/${table.id}/join`));
  if(res.status == 200) return goToTable(res.data.id)
  console.log(table)
  // goToTable(table.id)
}

const logout = async() => {
  const res = await handleAsync(async() => await axios.post(`/api/logout`));
  if(res.status == 200) return location.href = '/login'
}

const websocketHandler = (e) => {
  const tablesJson = JSON.parse(e.data)
  if('tables' in tablesJson) {
    tables.value = tablesJson.tables.map(table => TableBase.createTable(table));
  }
}

const websocketConnector = ref('')

fetchTables()
fetchUser()


</script>