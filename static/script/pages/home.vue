<template>
{{user}}
  <button @click="createTable">作成</button>
    <div v-for="(table, i) in tables" :key="i" style="width: 160px;height: 160px;border: solid 1px black">
      <div v-for="player in table.playerAggregate.players" :key="player.id">
        {{ player.id }}: {{ player.name }}
      </div>
    </div>
</template>
<script setup>
import axios from 'axios';
import { reactive, ref } from 'vue'

const tables = ref([])
const user = ref('')
const fetchTables = async() => {
  const res = await axios.get('/api/table');
  tables.value = res.data
}

const createTable = async() => {
  const res = await axios.post('/api/table/create');
  console.log(res)
}

const fetchUsers = async() => {
  const res = await axios.get('/api/user');
  user.value = res.data
  connectWebsocket(user)
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
    console.log(e.data);
    tables.value = JSON.parse(e.data)
  };
}

fetchTables()
fetchUsers()


</script>
