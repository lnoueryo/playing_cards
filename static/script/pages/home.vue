<template>
  <div class="p-4">
    <div class="bg-transparent border-dsecondary pb-4">
      <button type="button" class="btn btn-secondary" data-bs-toggle="modal" data-bs-target="#rule">作成</button>
    </div>
    <div class="d-flex flex-wrap">
      <div class="card text-bg-light mb-3 me-4 w-100" v-for="(table, i) in tables" :key="i">
        <div class="card-header">{{ changeDateFormat(table.createdAt) }}</div>
        <div class="card-body">
          <div class="players">
            <div class="mb-2" v-for="player in table.playerAggregate.players" :key="player.id">
                {{ player.id }}: {{ player.name }}
            </div>
          </div>
          <div>ルール</div>
          <div>プレイヤー数: {{table.maxPlayers}}</div>
          <div>ラウンド数: {{table.maxRounds}}</div>
          <div>ゲーム数: {{table.maxGames}}</div>
        </div>
        <div class="bg-transparent border-primary">
          <button type="button" class="btn btn-secondary w-100" @click="joinTable(table)" :disabled="table.isMaxPlayersReached() || table.isGameEndReached()">参加</button>
        </div>
      </div>
      <div class="card text-bg-light mb-3 me-4 w-100">
        <button data-bs-toggle="modal" data-bs-target="#rule" class="btn pmd-btn-fab pmd-ripple-effect btn-secondary rounded-circle center" type="button">+</button>
      </div>
    </div>
  </div>
  <!-- Modal -->
  <div class="modal fade" id="rule" tabindex="-1" aria-labelledby="exampleModalLabel" aria-hidden="true">
    <div class="modal-dialog">
      <div class="modal-content">
        <div class="modal-header">
          <h1 class="modal-title fs-5" id="exampleModalLabel">ルール</h1>
          <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
        </div>
        <div class="modal-body">
          <form>
            <div class="mb-3">
              <label for="max-players" class="col-form-label">最大参加人数:</label>
              <select id="max-players" class="form-select" v-model="rules.maxPlayers">
                <option value="2">2</option>
                <option value="3">3</option>
                <option value="4">4</option>
                <option value="5">5</option>
              </select>
            </div>
            <div class="mb-3">
              <label for="max-games" class="col-form-label">ゲーム数:</label>
              <select id="max-games" class="form-select" v-model="rules.maxGames">
                <option value="1">1</option>
                <option value="2">2</option>
                <option value="3">3</option>
                <option value="4">4</option>
                <option value="5">5</option>
              </select>
            </div>
            <div class="mb-3">
              <label for="max-turns" class="col-form-label">ターン数:</label>
              <select id="max-turns" class="form-select" v-model="rules.maxRounds">
                <option value="1">1</option>
                <option value="2">2</option>
                <option value="3">3</option>
                <option value="4">4</option>
                <option value="5">5</option>
              </select>
            </div>
          </form>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-light" data-bs-dismiss="modal">戻る</button>
          <button type="button" class="btn btn-secondary" @click="createTable">作成</button>
        </div>
      </div>
    </div>
  </div>
</template>
<script setup>
import axios from 'axios';
import { reactive, ref } from 'vue'
import {handleAsync, WebsocketConnector} from '../utils'
import { Table } from '../../../models/table/table'
import { useSessionStore } from "../store";

const tables = ref([])
const user = ref('')
const rules = ref({
  "maxPlayers": 3,
  "maxRounds": 4,
  "maxGames": 1,
})
const websocketConnector = ref('')
const store = useSessionStore();
const changeDateFormat = (time) => {
  const date = new Date(time)
  const y = date.getFullYear();
  const m = ("00" + (date.getMonth()+1)).slice(-2);
  const d = ("00" + date.getDate()).slice(-2);
  const h = ("00" + date.getHours()).slice(-2);
  const min = ("00" + date.getMinutes()).slice(-2);
  return y + "/" + m + "/" + d + " " + h + ":" + min;
}

const goToTable = (path) => {
  location.href = '/table/' + path;
}

const fetchTables = async() => {
  const res = await axios.get('/api/table');
  tables.value = res.data.map(table => Table.createTable(table));
}

const createTable = async() => {
  const res = await handleAsync(async() => await axios.post('/api/table/create', rules.value));
  if(res.status == 200) return goToTable(res.data.id)
}

const fetchUser = async() => {
  await store.getSession()
  websocketConnector.value = new WebsocketConnector(store.user.user_id, websocketHandler)
  websocketConnector.value.connectWebsocket()
}

const joinTable = async(table) => {
  const res = await handleAsync(async() => await axios.post(`/api/table/join`, {table_id: table.id}));
  if(res.status == 200) return goToTable(res.data.id)
}

const websocketHandler = (e) => {
  const tablesJson = JSON.parse(e.data)
  if('tables' in tablesJson) {
    tables.value = tablesJson.tables.map(table => Table.createTable(table));
  }
}

fetchTables()
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