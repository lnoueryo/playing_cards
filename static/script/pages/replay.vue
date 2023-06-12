<template>
  <div class="container" :style="{ height: containerHeight, width: containerHeight }" v-if="table.playerAggregate">
    <div class="item" v-for="(player, index) in sortPlayers(table.playerAggregate.players)" :key="player.id" :style="cardStyle(index)">
      <div class="card" v-for="(card, id) in sortCards(player.hand.cards)" :key="card.id" :style="{position: id == 5 ? 'absolute' : 'relative', right: id == 5 ? -100 +'px' : 0}" @click="discard(player, card)">
        <img style="width: 100%" :src="getImgPath(card)" alt="">
      </div>
      <div class="host" style="width: 32px;height: 32px;background-color: cadetblue;border-radius: 50%;" v-if="player.id == table.playerAggregate.players[0].id"></div>
      <div class="player-result" v-if="table.isAfterGameEnd() && table.getWinner().id == player.id">winner</div>
      <div class="player-rank">{{ player.analyzeHand().getRankName('jp') }}</div>
      <div class="player-name">{{ player.name }}</div>
    </div>
    <div style="position: absolute;left: 50%;top: 50%;transform: translate(-50%, -50%);text-align: center;">
      <div style="position: relative">
        <div style="position: absolute;left: 50%;top: 50%;transform: translate(-50%, -50%);width: 128px;height: 128px;">
          <div style="position: absolute;max-width: 80px;width: 100%" :style="discardsStyle[index]" v-for="(card, index) in table.cardAggregate.discards" :key="card.id">
            <img style="width: 100%" :src="getImgPath(card)" alt="">
          </div>
        </div>
        <div style="position: relative;z-index: 2;background-color: #ffffffbf">
          <div>
            <button @click="goToReplay(user.user_id)">戻る</button>
            <div>{{ showGame }}</div>
            <div v-if="!table.isAfterGameEnd()">{{ showRound }}</div>
            <div v-if="time < 11">{{ time }}</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
<script setup>
import axios from 'axios';
import { onMounted, onUnmounted,computed, reactive, ref } from 'vue'
import {handleAsync, WebsocketConnector } from '../utils'
import { Table } from '../../../models/table/table'

const containerHeight = ref(`${window.innerHeight - 30}px`)

const goToReplay = (user_id) => {
  location.href = `/replay/${user_id}`
}

// ウィンドウのリサイズ時に containerHeight を更新する
onMounted(() => {
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
})

const handleResize = () => {
  containerHeight.value = `${window.innerHeight - 30}px`
}
const table = ref({})
const user = ref('')

const discardsStyle = computed(() => {
  const styles = []
  for (let card = 0; card < 54; card++) {
    const left = Math.floor(Math.random() * 101);
    const right = Math.floor(Math.random() * 101);
    const rotation = Math.floor(Math.random() * 360);
    styles.push({ left: `${left}%`, top: `${right}%`, transform: `translate(-50%, -50%) rotate(${rotation}deg)`})
  }
  return styles
})

const sortCards = (cards) => {
  let drawCard;
  if(cards.length == 6) {
    drawCard = cards[cards.length - 1]
    cards = cards.slice(0, cards.length - 1);
  }

  const sortedCard = cards.sort((a, b) => {
    if (a.type === 4 && b.type !== 4) return 1; // aをbより後ろにする
    if (a.type !== 4 && b.type === 4) return -1; // aをbより前にする
    if (a.number !== b.number) return a.number - b.number;
    return a.type - b.type;
  });
  if(drawCard) sortedCard.push(drawCard)

  return sortedCard
}

const positions = computed(() => {
  return Array.from({length: table.value.playerAggregate.players.length}, (_, i) => {
    const angle = 2 * Math.PI * (i / table.value.playerAggregate.players.length) + Math.PI / 2;
    const x = 50 + 35 * Math.cos(angle);
    const y = 50 + 35 * Math.sin(angle);
    const rotate = (360 * i / table.value.playerAggregate.players.length); // Rotate towards center
    const width = 100 / table.value.playerAggregate.players.length
    return { left: `${x}%`, top: `${y}%`, transform: `translate(-50%, -50%) rotate(${rotate}deg)`, width: width};
  });
})

const showRound = computed(() => {
  return table.value.round  == table.value.maxRounds - 1 ? 'ラストラウンド' : `${table.value.round + 1}ラウンド目`
})

const showGame = computed(() => {
  return table.value.game == table.value.maxGames - 1 ? 'ラストゲーム' : `${table.value.game + 1}戦目`
})

const cardStyle = (index) => {
  return { left: positions.value[index].left, top: positions.value[index].top, transform: positions.value[index].transform, width: index == 0 ? positions.value[index].width * 2 + '%' : positions.value[index].width + '%' }
}

const getImgPath = (card) => {
  return '/static/images/cards/torannpu-illust' + card.id + '.png'
}

const fetchTable = async() => {
  const path = window.location.pathname;
  const parts = path.split('/');

  const table_id = parts[3];
  const res = await axios.get(`/api/replay/${user.value.user_id}/${table_id}`);
  console.debug(res.data)
  tableAggregate(res.data)
  // table.value = Table.createTable(res.data.table)
  // if(user.value.id in res.data) setCountDown(res.data)
}

const tableAggregate = async(tables) => {
  table.value = Table.createTable(tables[0])
  let time = new Date(table.value.createdAt).getTime()
  await sleep(2500)
  for (let i = 1; i < tables.length; i++) {
    const nextTime = new Date(tables[i].createdAt).getTime()
    await sleep(nextTime - time)
    table.value = Table.createTable(tables[i])
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

const sortPlayers = (players) => {
  const userIndex = players.findIndex(player => player.id === user.value.id);
  if(userIndex !== -1) return players.slice(userIndex).concat(players.slice(0, userIndex));
  return players
}

const discard = async(player, card) => {
  if(player.id != user.value.id || player.hand.cards.length != 6) return;
  resetTimer()
  const res = await axios.post('/api/table/' + user.value.table_id + '/next', card);
}


const setCountDown = (dataJson) => {
  intervalId.value = setInterval(() => {
    const start = dataJson[user.value.id].time.start
    const elapsed = Date.now() - start; // 経過時間を計算
    const remaining = dataJson[user.value.id].time.timeout - elapsed; // 残り時間を計算
    if (remaining <= 0) resetTimer();
    else time.value = Math.floor(remaining / 1000);
  }, 1000); // 1秒ごとに残り時間を表示
}

const resetTimer = () => {
  clearInterval(intervalId.value);
  time.value = NaN;
}
const intervalId = ref(null)
const time = ref(NaN)


fetchUser()

</script>
<style>
.container {
  position: relative;
  margin: auto;
}

.item {
  position: absolute;
  transform: translate(-50%, -50%);
  padding: 0 48px;
  display: flex;
  justify-content: center;
  align-items: center;
}

.card {
  display: flex;
  margin: 16px 4px;
  position: relative;
  max-width: 100px
}

.player-result {
  position: absolute;
  bottom: 100%;
  right: 0%;
}

.player-rank {
  position: absolute;
  bottom: 100%;
}

.player-name {
  position: absolute;
  top: 100%;
}

.host {
  position: absolute;
  bottom: 100%;
  left: 0;
}
</style>
