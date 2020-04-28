<template>
  <div class="home">
    <button @click="logout">Logout</button>
    <button @click="newPost">New post</button>
    <div v-if="publishedPosts.length > 0">
      <h2>Published posts</h2>
      <ul>
        <li
          v-for="post in publishedPosts"
          :key="post.sha"
          @click="openFile(post.path)"
        >
          {{ post.name }}
          <button @click="makePostDraft(post.path, post.sha)">
            Make draft
          </button>
          <button @click="deletePost(post.path, post.sha)">Delete</button>
        </li>
      </ul>
    </div>
    <div v-if="draftPosts.length > 0">
      <h2>Draft posts</h2>
      <ul>
        <li
          v-for="post in draftPosts"
          :key="post.sha"
          @click="openFile(post.path)"
        >
          {{ post.name }}
          <button @click="makePostPublished(post.path, post.sha)">
            Publish
          </button>
          <button @click="deletePost(post.path, post.sha)">Delete</button>
        </li>
      </ul>
    </div>
    <input v-model="postData.title" />
    <input type="datetime-local" v-model="postData.date" />
    <vue-simplemde v-model="postContent" />
    <button @click="save">Save</button>
  </div>
</template>

<script>
import GithubClient from "@/githubClient";
import VueSimplemde from "vue-simplemde";
import matter from "gray-matter";
import { b64EncodeUnicode, b64DecodeUnicode } from "@/utilities/b64encode";

export default {
  name: "Home",
  components: { VueSimplemde },
  created: async function() {
    this.githubClient = new GithubClient(
      this.login.owner,
      this.login.repo,
      this.login.pat
    );
    await this.getPublishedPosts();
    await this.getDraftPosts();
  },
  data: function() {
    return {
      githubClient: {},
      publishedPosts: [],
      draftPosts: [],
      postPath: "",
      postSha: "",
      postData: {
        title: "",
        date: new Date()
      },
      postContent: ""
    };
  },
  computed: {
    login() {
      return this.$store.state.login;
    }
  },
  methods: {
    logout: function() {
      this.$store.commit("logout");
      this.$router.push({ name: "Login" });
    },
    newPost: function() {
      this.postPath = "";
      this.postSha = "";
      this.postData = {
        title: "",
        date: new Date()
      };
      this.postContent = "";
    },
    getPublishedPosts: async function() {
      this.publishedPosts = await this.githubClient.getPublishedPosts();
    },
    getDraftPosts: async function() {
      this.draftPosts = await this.githubClient.getDraftPosts();
    },
    openFile: async function(postPath) {
      this.postPath = postPath;
      const contents = await this.githubClient.getFileContents(postPath);
      this.postSha = contents.sha;
      const content = b64DecodeUnicode(contents.content);
      const fm = matter(content);
      this.postData = fm.data;
      this.postContent = fm.content;
    },
    save: async function() {
      if (this.postContent === "") {
        return;
      }
      // Generate path for new post
      if (this.postSha === "") {
        this.postPath = `_posts/${this.postData.date
          .toISOString()
          .slice(0, 10)}-${this.postData.title
          .toLowerCase()
          .split(" ")
          .join("-")}.md`;
        await this.githubClient.createFile(
          this.postPath,
          b64EncodeUnicode(matter.stringify(this.postContent, this.postData))
        );
      } else {
        await this.githubClient.updateFile(
          this.postPath,
          b64EncodeUnicode(matter.stringify(this.postContent, this.postData)),
          this.postSha
        );
      }
    },
    deletePost: async function(path, sha) {
      await this.githubClient.deleteFile(path, sha);
    },
    makePostDraft: async function(path, sha) {
      const originalFileContents = await this.githubClient.getFileContents(
        path
      );
      await this.githubClient.deleteFile(path, sha);
      const content = b64DecodeUnicode(originalFileContents.content);
      const fm = matter(content);
      const draftPath = `_drafts/${fm.data.title
        .toLowerCase()
        .split(" ")
        .join("-")}.md`;
      await this.githubClient.createFile(
        draftPath,
        originalFileContents.content
      );
      await this.getPublishedPosts();
      await this.getDraftPosts();
    },
    makePostPublished: async function(path, sha) {
      const originalFileContents = await this.githubClient.getFileContents(
        path
      );
      await this.githubClient.deleteFile(path, sha);

      const content = b64DecodeUnicode(originalFileContents.content);
      const fm = matter(content);
      const publishedPath = `_posts/${fm.data.date
        .toISOString()
        .slice(0, 10)}-${fm.data.title
        .toLowerCase()
        .split(" ")
        .join("-")}.md`;
      await this.githubClient.createFile(
        publishedPath,
        originalFileContents.content
      );
      await this.getPublishedPosts();
      await this.getDraftPosts();
    }
  }
};
</script>

<style scoped>
@import "~simplemde/dist/simplemde.min.css";
</style>
