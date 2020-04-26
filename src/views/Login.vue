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
      this.$store.commit("setOwner", this.owner);
      this.$store.commit("setRepo", this.repo);
      this.$store.commit("setPat", this.pat);
      this.$router.push({ name: "Home" });
    }
  }
};
</script>

<style></style>
