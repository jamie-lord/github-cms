import Vue from "vue";
import Vuex from "vuex";
import VuexPersistence from "vuex-persist";

Vue.use(Vuex);

const vuexLocal = new VuexPersistence({
  storage: window.localStorage,
  key: "github-cms"
});

export default new Vuex.Store({
  state: {
    login: {
      owner: "",
      repo: "",
      pat: ""
    }
  },
  getters: {
    loggedIn: state => {
      return (
        state.login.owner !== "" &&
        state.login.repo !== "" &&
        state.login.pat !== ""
      );
    }
  },
  mutations: {
    setLogin(state, login) {
      state.login = login;
    },
    logout(state) {
      state.login.owner = "";
      state.login.repo = "";
      state.login.pat = "";
    }
  },
  actions: {},
  modules: {},
  plugins: [vuexLocal.plugin]
});
