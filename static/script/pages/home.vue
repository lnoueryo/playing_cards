<template>
{{user}}
  <button @click="createTable">作成</button>
    <div v-for="(table, i) in tables" :key="i" style="width: 160px;height: 160px;border: solid 1px black">
      <div v-for="player in table.playerAggregate.players" :key="player.id">
        {{ player.id }}: {{ player.name }}
      </div>
      <button @click="joinTable(table)">参加</button>
    </div>
</template>
<script setup>
import axios from 'axios';
import { reactive, ref } from 'vue'
import {handleAsync} from '../utils'

const goToTable = (path) => {
  location.href = '/table/' + path;
}
const tables = ref([])
const user = ref('')
const fetchTables = async() => {
  const res = await axios.get('/api/table');
  tables.value = res.data
}

const createTable = async() => {
  const res = await handleAsync(async() => await axios.post('/api/table/create'));
  if(res.status == 200) return goToTable(res.data.id)
}

const fetchUser = async() => {
  const res = await handleAsync(async() => await axios.get('/api/user'));
  user.value = res.data
  connectWebsocket(user)
}

const joinTable = async(table) => {
  const res = await handleAsync(async() => await axios.post(`/api/table/${table.id}/join`));
  if(res.status == 200) return goToTable(res.data.id)
  console.log(table)
  // goToTable(table.id)
}

const connectWebsocket = (user) => {
  const url = 'ws://localhost:3000';
  const connection = new WebSocket(url);
  connection.onopen = () => {
    connection.send(user.value.id);
  };

  connection.onerror = (error) => {
    console.log(`WebSocket error: ${error}`);
  };

  connection.onmessage = (e) => {
    const tablesJson = JSON.parse(e.data)
    if('tables' in tablesJson) {
      tables.value = tablesJson.tables
    }
  };
}

fetchTables()
fetchUser()


</script>