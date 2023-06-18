import { defineStore } from "pinia";
import axios from 'axios'
import { handleAsync } from '../utils'

export const useSessionStore = defineStore("sessions", {

  state: () => {
    return {
      user: {}
    };
  },

  getters: {

  },
  actions: {
    async getSession() {
      const res = await handleAsync(async() => await axios.get('/api/session'));
      this.user = res.data;
    }
  },
});