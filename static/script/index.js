// import { createApp } from 'vue';
// import Login from './pages/login.vue';

// const app = createApp({
//     components: {
//         Login
//     },
//     template: '<Login/>',
// });

// app.mount('#app');
// console.log(app.component)
// console.log(Login)
import { createApp } from 'vue';
import Login from './pages/login.vue';

createApp({
    components: {
        Login,
    },
}).mount('#app');