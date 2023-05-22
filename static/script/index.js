import { createApp } from 'vue';
import Login from './pages/login.vue';
import Home from './pages/home.vue';

createApp({
    components: {
        Login,
        Home,
    },
}).mount('#app');