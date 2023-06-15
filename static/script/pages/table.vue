<template>
  <div class="container" :style="{ height: containerHeight, width: containerHeight }" v-if="table.playerAggregate">
    <div class="item" v-for="(player, index) in sortPlayers(table.playerAggregate.players)" :key="player.id" :style="cardStyle(index)">
      <div class="card" v-for="(card, id) in sortCards(player.hand.cards)" :key="card.id" :style="{position: id == 5 ? 'absolute' : 'relative', right: id == 5 ? -100 +'px' : 0}" @click="discard(player, card)">
        <img style="width: 100%" :src="getImgPath(card)" alt="">
      </div>
      <div class="host" v-if="player.id == table.playerAggregate.players[0].id"></div>
      <div class="player-result" v-if="table.isAfterGameEnd() && table.getWinner().id == player.id">winner</div>
      <div class="player-rank" v-if="table.isMaxPlayersReached() && (table.isAfterGameEnd() || user.id == player.id)">{{ player.analyzeHand().getRankName('jp') }}</div>
      <div class="player-name">{{ player.name }}</div>
    </div>
    <div class="discards-wrapper">
      <div class="discards-container">
        <div class="discards">
          <div class="discard" :style="discardsStyle[index]" v-for="(card, index) in table.cardAggregate.discards" :key="card.id">
            <img class="card-image" :src="getImgPath(card)" alt="">
          </div>
        </div>
        <div style="position: relative;z-index: 2;background-color: #ffffffbf">
          <div v-if="table.isMaxPlayersReached() && !table.isGameEndReached()">
            <div>{{ showGame }}</div>
            <div v-if="!table.isAfterGameEnd()">{{ showRound }}</div>
            <div v-if="time < 11">{{ time }}</div>
          </div>
          <div v-else>
            <form :action="'/api/table/' + user.table_id + '/exit'" method="post">
              <input type="submit" value="退出">
            </form>
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
  const res = await axios.get('/api/table/' + user.value.table_id);
  console.debug(res.data)
  table.value = Table.createTable(res.data.table)
  if(user.value.id in res.data) setCountDown(res.data)
}

const fetchUser = async() => {
  const res = await handleAsync(async() => await axios.get('/api/token'));
  user.value = res.data
  await fetchTable()
  websocketConnector.value = new WebsocketConnector(user.value.id, websocketHandler)
  websocketConnector.value.connectWebsocket()
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

// const reset = async() => {
//   const res = await axios.post('/api/table/' + user.value.table_id + '/reset');
//   console.debug(res.data)
// }

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

const websocketHandler = (e) => {
  const dataJson = JSON.parse(e.data)
  // テーブルのデータ
  if('table' in dataJson) {
    if(!dataJson.table) return location.href = '/'
    table.value = Table.createTable(dataJson.table)
  }
  // ユーザー特有の処理
  if(user.value.id in dataJson) setCountDown(dataJson)
}


const websocketConnector = ref('')
const intervalId = ref(null)
const time = ref(NaN)


fetchUser()

</script>
<style lang="scss">

.container {
  position: relative;
  margin: auto;
  padding: 48px 0;
  // box-sizing: border-box;
  // height: 100vh;
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
  width: 32px;
  height: 32px;
  background-color: cadetblue;
  border-radius: 50%;
}

.discards-wrapper {
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  text-align: center;

  .discards-container {
    position: relative;

    .discards {
      position: absolute;
      left: 50%;
      top: 50%;
      transform: translate(-50%, -50%);
      width: 128px;height: 128px;

      .discard {
        position: absolute;
        max-width: 80px;
        width: 100%;

        .discard-image {
          width: 100%
        }
      }
    }
  }
}


</style>
