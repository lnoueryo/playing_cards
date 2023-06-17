<template>
  <div class="discards">
    <div class="discard" :style="discardsStyle[index]" v-for="(card, index) in table.cardAggregate.discards" :key="card.id">
      <img class="discard-image" :src="getImgPath(card)" draggable="false">
    </div>
  </div>
</template>


<script setup>
import { computed, defineProps } from "vue";

const props = defineProps({
  table: Object
});

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

const getImgPath = (card) => {
  return '/static/images/cards/torannpu-illust' + card.id + '.png'
}

</script>

<style lang="scss">
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
</style>