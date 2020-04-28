<template>
  <div>
    <input v-model="owner" placeholder="Owner" required />
    <input v-model="repo" placeholder="Repository" required />
    <input v-model="pat" placeholder="Personal access token" required />
    <button @click="login">Login</button>
  </div>
</template>

<script>
export default {
  data: function() {
    return {
      owner: "",
      repo: "",
      pat: ""
    };
  },
  methods: {
    login: function() {
      if (this.owner === "" || this.repo === "" || this.pat === "") {
        return;
      }
      this.$store.commit("setLogin", {
        owner: this.owner,
        repo: this.repo,
        pat: this.pat
      });
      this.$router.push({ name: "Home" });
    }
  }
};
</script>

<style></style>
