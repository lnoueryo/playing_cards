<template>
  <CardWrapper :table="table" :user="user" @discard="discard" v-if="isTableReady">
    <template v-slot:cards="{player}">
      <div v-if="player">
        <div class="host" v-if="player.id == table.playerAggregate.players[0].id"></div>
        <div class="player-result" v-if="isAfterGameEnd && getWinner.id == player.id">winner</div>
        <div class="player-rank" v-if="isMaxPlayersReached && (isAfterGameEnd || user.user_id == player.id)">{{ analyzeHand(player) }}</div>
        <div class="player-name">{{ player.name }}</div>
      </div>
    </template>
    <template v-slot:discards="{table}">
      <div class="center-display" v-if="table">
        <div v-if="isMaxPlayersReached && !isGameEndReached">
          <div>{{ showGame }}</div>
          <div v-if="!isAfterGameEnd">{{ showRound }}</div>
          <div v-if="time < 11">{{ time }}</div>
        </div>
        <div v-else>
          <form :action="'/api/table/' + user.table_id + '/exit'" method="post">
            <input type="submit" value="退出">
          </form>
        </div>
      </div>
    </template>
  </CardWrapper>
</template>
<script setup>
import axios from 'axios';
import { onMounted, onUnmounted,computed, reactive, ref } from 'vue'
import {handleAsync, WebsocketConnector, createTable, renderAnimate } from '../utils'
import { Table } from '../../../models/table/table'
import { Player } from '../../../models/player'
import CardWrapper from '../components/CardWrapper.vue'

// const containerHeight = ref(`${window.innerHeight - 30}px`)

// ウィンドウのリサイズ時に containerHeight を更新する
// onMounted(() => {
//   window.addEventListener('resize', handleResize)
// })

// onUnmounted(() => {
//   window.removeEventListener('resize', handleResize)
// })

// const handleResize = () => {
//   containerHeight.value = `${window.innerHeight - 30}px`
// }
const table = ref('')
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

const analyzeHand = (playerJson) => {
  const player = Player.createPlayer(playerJson)
  return player.analyzeHand().getRankName('jp')
}

const isMaxPlayersReached = computed(() => {
  return table.value.maxPlayers == table.value.playerAggregate.players.length;
})

const isAfterGameEnd = computed(() => {
  return table.value.playerAggregate.players.every((player) => player.hand.cards == 5) && this.round == 0 && this.turn == 0;
})

const isGameEndReached = computed(() => {
  return table.value.maxGames == table.value.game;
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

const fetchTable = async() => {
  const res = await axios.get('/api/table/' + user.value.table_id);
  console.debug(res.data)
  table.value = Table.createTable(res.data.table)
  if(user.value.user_id in res.data) setCountDown(res.data)
}

const fetchUser = async() => {
  const res = await handleAsync(async() => await axios.get('/api/token'));
  console.log(res.data)
  user.value = res.data
  await fetchTable()
  websocketConnector.value = new WebsocketConnector(user.value.user_id, websocketHandler)
  websocketConnector.value.connectWebsocket()
}

const sortPlayers = (players) => {
  const userIndex = players.findIndex(player => player.id === user.value.user_id);
  if(userIndex !== -1) return players.slice(userIndex).concat(players.slice(0, userIndex));
  return players
}

const discard = async(card) => {
  resetTimer()
  const res = await axios.post('/api/table/' + user.value.table_id + '/next', card);
}

// const reset = async() => {
//   const res = await axios.post('/api/table/' + user.value.table_id + '/reset');
//   console.debug(res.data)
// }

const setCountDown = (dataJson) => {
  intervalId.value = setInterval(() => {
    const start = dataJson[user.value.user_id].time.start
    const elapsed = Date.now() - start; // 経過時間を計算
    const remaining = dataJson[user.value.user_id].time.timeout - elapsed; // 残り時間を計算
    if (remaining <= 0) resetTimer();
    else time.value = Math.floor(remaining / 1000);
  }, 1000); // 1秒ごとに残り時間を表示
}

const resetTimer = () => {
  clearInterval(intervalId.value);
  time.value = NaN;
}

const websocketHandler = (e) => {
  const dataJson = JSON.parse(e.data)
  // テーブルのデータ
  if('table' in dataJson) {
    if(!dataJson.table) return location.href = '/'
    table.value = Table.createTable(dataJson.table)
  }
  // ユーザー特有の処理
  if(user.value.user_id in dataJson) setCountDown(dataJson)
}


const websocketConnector = ref('')
const intervalId = ref(null)
const time = ref(NaN)
const isTableReady = ref(false)

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



fetchUser()
startRender()
</script>
<style lang="scss" scoped>
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display&display=swap');
@import url('https://fonts.cdnfonts.com/css/trajan-pro');
@import url('https://fonts.cdnfonts.com/css/bodoni-std');
@import url('https://fonts.cdnfonts.com/css/eb-garamond-2');
// font-family: 'Playfair Display', serif;
// font-family: 'Trajan Pro', sans-serif;
// font-family: 'Bodoni Std', sans-serif;
// font-family: 'EB Garamond', sans-serif;
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
