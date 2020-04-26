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
    owner: "",
    repo: "",
    pat: ""
  },
  getters: {
    loggedIn: state => {
      return state.owner !== "" && state.repo !== "" && state.pat !== "";
    }
  },
  mutations: {
    setOwner(state, owner) {
      state.owner = owner;
    },
    setRepo(state, repo) {
      state.repo = repo;
    },
    setPat(state, pat) {
      state.pat = pat;
    },
    logout(state) {
      state.owner = "";
      state.repo = "";
      state.pat = "";
    }
  },
  actions: {},
  modules: {},
  plugins: [vuexLocal.plugin]
});
