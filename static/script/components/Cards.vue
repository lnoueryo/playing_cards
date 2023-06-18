<template>
  <div class="cards">
    <div class="card" v-for="(card, id) in sortCards(player.hand.cards)" :key="card.id" :style="{position: id == 5 ? 'absolute' : 'relative', right: id == 5 ? -130 +'px' : 0}" @click="discard(card)">
      <img class="card-image" :src="getImgPath(card)" draggable="false">
    </div>
  </div>
</template>

<script setup>
import { defineProps } from "vue";
const emit = defineEmits()

const props = defineProps({
  player: Object
});

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

const getImgPath = (card) => {
  return '/static/images/cards/torannpu-illust' + card.id + '.png'
}

const imagePath = (card) => {
  return {backgroundImage: `url(/static/images/cards/torannpu-illust${card.id}.png)`, backgroundSize: 'contain', backgroundPosition: 'center', backgroundRepeat: 'no-repeat', paddingBottom: '60%', width: '100%'}
}

const discard = async(card) => {
  emit('discard', card)
}

</script>

<style lang="scss">
.cards {
  display: flex;
  position: relative;

  .card {
    display: flex;
    margin: 16px 4px;
    position: relative;
    max-width: 90px;
    width: 100%;

    .card-image {
      width: 100%;
      filter: brightness(90%) contrast(110%) drop-shadow(3px 3px 3px rgba(0, 0, 0, 0.5));
    }
  }
}
</style>