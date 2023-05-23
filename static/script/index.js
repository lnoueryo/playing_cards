import { createApp } from 'vue';
import LoginView from './pages/login.vue';
import HomeView from './pages/home.vue';
import TableView from './pages/table.vue';

createApp({
    components: {
        LoginView,
        HomeView,
        TableView,
    },
}).mount('#app');