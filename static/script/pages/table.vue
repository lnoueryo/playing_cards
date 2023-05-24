<template>
  <div class="container" :style="{ height: containerHeight, width: containerHeight }" v-if="table.playerAggregate">
    <div class="item" v-for="(player, index) in table.playerAggregate.players" :key="player.id" :style="cardStyle(index)">
      <div class="card" v-for="(card, id) in sort(player.cards)" :key="card.id" :style="{position: id == 5 ? 'absolute' : 'relative', right: id == 5 ? -125 +'px' : 0}" @click="discard(player, card)">
        <img style="width: 100%" :src="getImgPath(card)" alt="">
      </div>
      <div class="player-name">{{ player.name }}</div>
    </div>
  </div>
</template>
<script setup>
import axios from 'axios';
import { onMounted, onUnmounted,computed, reactive, ref } from 'vue'
import {handleAsync} from '../utils'

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

const sort = (cards) => {
  let drawCard;
  if(cards.length == 6) {
    drawCard = cards[cards.length - 1]
    cards = cards.slice(0, cards.length - 1);
  }

  const sortedCard = cards.sort((a, b) => {
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

const cardStyle = (index) => {
  return { left: positions.value[index].left, top: positions.value[index].top, transform: positions.value[index].transform, width: index == 0 ? positions.value[index].width * 2 + '%' : positions.value[index].width + '%' }
}

const getImgPath = (card) => {
  return '/static/images/cards/torannpu-illust' + card.id + '.png'
}

const fetchTable = async() => {
  const res = await axios.get('/api/table/' + user.value.tableId);
  console.debug(res.data)
  table.value = res.data
}

const fetchUser = async() => {
  const res = await handleAsync(async() => await axios.get('/api/user'));
  user.value = res.data
  await fetchTable()
  connectWebsocket(user)

  const userIndex = table.value.playerAggregate.players.findIndex(player => player.id === user.value.id);

  if(userIndex !== -1) {
      table.value.playerAggregate.players = table.value.playerAggregate.players.slice(userIndex).concat(table.value.playerAggregate.players.slice(0, userIndex));
      console.log(table.value.playerAggregate.players);
  }
}

const discard = (player, card) => {
  if(player.id != user.value.id || player.cards.length != 6) return;
  console.log(card)
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
  /* padding: 0 128px; */
  display: flex;
  justify-content: center;
  align-items: center;
}

.card {
  display: flex;
  margin-bottom: 16px;
  position: relative;
  max-width: 100px
}

.player-name {
  position: absolute;
  top: 100%;
  /* left: 50%;
  transform: translateX(-50%); */
}
</style>