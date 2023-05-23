<template>
{{user}}
  <button @click="createTable">作成</button>
  {{table}}
</template>
<script setup>
import axios from 'axios';
import { reactive, ref } from 'vue'
import {handleAsync} from '../utils'

const table = ref({})
const user = ref('')

const fetchTable = async() => {
  const res = await axios.get('/api/table');
  table.value = res.data
  console.log(res)
}

const fetchUser = async() => {
  const res = await handleAsync(async() => await axios.get('/api/user'));
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
    const tableJson = JSON.parse(e.data)
    if('table' in tableJson) {
      console.log(e.data, 'table');
      table.value = tableJson.table
    }
  };
}

fetchTable()
fetchUser()


</script>
