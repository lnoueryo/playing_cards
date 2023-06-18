<template>
  <div class="wrapper" v-if="table.playerAggregate">
    <div class="container">
      <div class="item" v-for="(player, index) in sortPlayers(table.playerAggregate.players)" :key="player.id" :style="cardStyle(index)">
        <div class="hand">
          <Cards :player="player" @discard="discard($event, player)" />
          <slot name="cards" :player="player"></slot>
        </div>
      </div>
    </div>
    <div class="discards-wrapper">
      <div class="discards-container">
        <Discards :table="table" />
        <slot name="discards" :table="table"></slot>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, watch } from "vue";
import { defineProps } from "vue";
import Cards from '../components/Cards.vue'
import Discards from '../components/Discards.vue'

const emit = defineEmits()

const props = defineProps({
  table: Object | String,
  user: Object | String
});

const table = ref(props.table)
const user = ref(props.user)
const isTableReady = ref(false)

watch(() => props.table, (newValue, oldValue) => {
  table.value = newValue
})

const positions = computed(() => {
  return Array.from({length: table.value.playerAggregate.players.length}, (_, i) => {
    const angle = 2 * Math.PI * (i / table.value.playerAggregate.players.length) + Math.PI / 2;
    const x = 50 + 35 * Math.cos(angle);
    const y = 50 + 35 * Math.sin(angle);
    const rotate = (360 * i / table.value.playerAggregate.players.length); // Rotate towards center
    const width = 100 / table.value.maxPlayers
    return { left: `${x}%`, top: `${y}%`, transform: `translate(-50%, -50%) rotate(${rotate}deg)`, width: width};
  });
})


const sortPlayers = (players) => {
  const userIndex = players.findIndex(player => player.id === user.value.user_id);
  if(userIndex !== -1) return players.slice(userIndex).concat(players.slice(0, userIndex));
  return players
}

const cardStyle = (index) => {
  return { left: positions.value[index].left, top: positions.value[index].top, transform: positions.value[index].transform, width: index == 0 ? positions.value[index].width * 2 + '%' : positions.value[index].width + '%' }
}

const discard = (card, player) => {
  if(player.id != user.value.user_id || player.hand.cards.length != 6) return;
  emit('discard', card)
}

</script>

<style lang="scss" scoped>
.wrapper {
  position: relative;
  margin: auto;
  padding: 72px 8px;
  box-sizing: border-box;
  height: 100%;
  max-width: 1000px;

  .container {
    height: 100%;
    position: relative;

    .item {
      position: absolute;
      transform: translate(-50%, -50%);
      padding: 0 48px;
      display: flex;
      justify-content: center;
      align-items: center;

      .hand {
        position: relative;
      }
    }
  }
}

.discards-wrapper {
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  text-align: center;

  .discards-container {
    position: relative;

    .center-display {
      position: relative;
      z-index: 2;
      background-color: #ffffffbf
    }
  }
}

</style>
