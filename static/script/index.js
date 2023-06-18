import { createApp } from 'vue';
import { createPinia } from "pinia";
import LoginView from './pages/login.vue';
import HomeView from './pages/home.vue';
import ReplayHomeView from './pages/replay-home.vue';
import ReplayView from './pages/replay.vue';
import TableView from './pages/table.vue';
import HeaderView from './components/Header.vue';

createApp({
    components: {
        LoginView,
        HomeView,
        ReplayHomeView,
        ReplayView,
        TableView,
        HeaderView,
    },
}).use(createPinia()).mount('#app');