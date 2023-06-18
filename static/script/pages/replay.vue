<template>
  <CardWrapper :table="table" :user="user" v-if="isTableReady">
    <template v-slot:cards="{player}">
      <div v-if="player">
        <div class="host" v-if="player.id == table.playerAggregate.players[0].id"></div>
        <div class="player-result" v-if="isAfterGameEnd && getWinner().id == player.id">winner</div>
        <div class="player-rank">{{ analyzeHand(player) }}</div>
        <div class="player-name">{{ player.name }}</div>
      </div>
    </template>
    <template v-slot:discards="table" v-if="table">
      <div class="center-display">
        <button @click="goToReplay(user.user_id)">戻る</button>
        <div>{{ showGame }}</div>
        <div v-if="!isAfterGameEnd">{{ showRound }}</div>
        <div v-if="time < 11">{{ time }}</div>
      </div>
    </template>
  </CardWrapper>
</template>
<script setup>
import axios from 'axios';
import { onMounted, onUnmounted,computed, reactive, ref, onBeforeMount } from 'vue'
import {handleAsync, WebsocketConnector, createTable, renderAnimate } from '../utils'
import { Table } from '../../../models/table/table'
import { Player } from '../../../models/player'
import CardWrapper from '../components/CardWrapper.vue'

const goToReplay = (user_id) => {
  location.href = `/replay/${user_id}`
}

const analyzeHand = (playerJson) => {
  const player = Player.createPlayer(playerJson)
  return player.analyzeHand().getRankName('jp')
}

// ウィンドウのリサイズ時に containerHeight を更新する
// onMounted(() => {
//   window.addEventListener('resize', startRender)
// })

// onUnmounted(() => {
//   window.removeEventListener('resize', startRender)
// })

const table = ref('')
const user = ref('')
const intervalId = ref(null)
const time = ref(NaN)
const isTableReady = ref(false)

const showRound = computed(() => {
  return table.value.round  == table.value.maxRounds - 1 ? 'ラストラウンド' : `${table.value.round + 1}ラウンド目`
})

const showGame = computed(() => {
  return table.value.game == table.value.maxGames - 1 ? 'ラストゲーム' : `${table.value.game + 1}戦目`
})

const isAfterGameEnd = computed(() => {
  return table.value.playerAggregate.players.every((player) => player.hand.cards == 5) && this.round == 0 && this.turn == 0;
})

const getWinner = computed(() => {
  return table.value.playerAggregate.players.reduce((prev, current) => {
    const currentRank = current.analyzeHand().getRank()
    const prevRank = prev.analyzeHand().getRank()
    if (currentRank.rank > prevRank.rank) return current;
    else if (currentRank.rank === prevRank.rank) return currentRank.highCard > prevRank.highCard ? current : prev;
    return prev;
  });
})

const table_id = computed(() => {
  const path = window.location.pathname;
  const parts = path.split('/');
  return parts[3];
})

const fetchTable = async() => {

  const res = await axios.get(`/api/replay/${user.value.user_id}/${table_id.value}`);
  console.debug(res.data)
  tableAggregate(res.data)
}

const tableAggregate = async(tables) => {
  table.value = tables[0]
  let time = new Date(table.value.createdAt).getTime()
  await sleep(2500)
  for (let i = 1; i < tables.length; i++) {
    const nextTime = new Date(tables[i].createdAt).getTime()
    await sleep(nextTime - time)
    table.value = tables[i]
    time = nextTime
  }
}

const sleep = (ms) => {
    return new Promise(resolve => setTimeout(resolve, ms));
}

const fetchUser = async() => {
  const res = await handleAsync(async() => await axios.get('/api/session'));
  user.value = res.data
  await fetchTable()
}

const resetTimer = () => {
  clearInterval(intervalId.value);
  time.value = NaN;
}

const startRender = async() => {
  try {
    isTableReady.value = false;
    const table = await createTable()
    renderAnimate(table);
    isTableReady.value = true;
  } catch (error) {
    console.error('An error happened:', error);
  }
}

const discard = () => {}


fetchUser()
startRender()

</script>
<style lang="scss" scoped>

.center-display {
  position: relative;
  background-color: rgba(255, 255, 255, 0.481);
}

.player-result {
  position: absolute;
  bottom: 100%;
  right: 0%;
  transform: translate(-50%, -50%);
}

.player-rank {
  position: absolute;
  bottom: 100%;
  left: 50%;
  transform: translate(-50%, -50%);
  color: white;
  font-family: "Source Han Serif JP", serif;
  font-size: 24px;
  font-weight: bold;
  filter: drop-shadow(2px 4px 6px black);
  word-break: keep-all;
}

.player-name {
  position: absolute;
  left: 50%;
  transform: translate(-50%, -50%);
  color: white;
  font-family: "Source Han Serif JP", serif;
  font-size: 24px;
  font-weight: bold;
  filter: drop-shadow(2px 4px 6px black);
}

.host {
  position: absolute;
  bottom: 100%;
  left: 0;
  width: 16px;
  height: 16px;
  background-color: cadetblue;
  border-radius: 50%;
}

</style>
