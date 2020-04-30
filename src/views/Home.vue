<template>
  <div class="columns">
    <div class="column is-one-quarter">
      <b-sidebar position="static" type="is-light" open>
        <div style="padding: 1rem">
          <b-menu>
            <b-menu-list label="Posts">
              <b-menu-item
                icon="file-plus"
                label="New post"
                @click="newPost"
              ></b-menu-item>
              <b-menu-item
                active
                expanded
                label="Published posts"
                :disabled="publishedPosts.length === 0"
              >
                <b-menu-item
                  v-for="post in publishedPosts"
                  :key="post.sha"
                  @click="openFile(post.path)"
                  ><template slot="label">
                    {{ post.name }}
                    <b-button
                      type="is-light"
                      icon-right="delete"
                      @click="deletePost(post.path, post.sha)"
                    /> </template
                ></b-menu-item>
              </b-menu-item>
              <b-menu-item
                active
                expanded
                icon="settings"
                label="Draft posts"
                :disabled="draftPosts.length === 0"
              >
                <b-menu-item
                  icon="account"
                  :label="post.name"
                  v-for="post in draftPosts"
                  :key="post.sha"
                  @click="openFile(post.path)"
                ></b-menu-item>
              </b-menu-item>
            </b-menu-list>
            <b-menu-list label="Actions">
              <b-menu-item
                icon="logout"
                label="Logout"
                @click="logout"
              ></b-menu-item>
            </b-menu-list>
          </b-menu>
        </div>
      </b-sidebar>
    </div>
    <div class="column">
      <b-field label="Title">
        <b-input v-model="postData.title"></b-input>
      </b-field>
      <b-field label="Published">
        <b-datetimepicker
          rounded
          placeholder="Click to select..."
          icon="calendar-today"
          horizontal-time-picker
          v-model="postData.date"
        >
        </b-datetimepicker>
      </b-field>
      <vue-simplemde v-model="postContent" />
      <b-button type="is-primary" @click="save">Publish</b-button>
    </div>
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
        date: new Date(),
      },
      postContent: "",
    };
  },
  computed: {
    login() {
      return this.$store.state.login;
    },
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
        date: new Date(),
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
      console.log(fm.data);
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
    },
  },
};
</script>

<style scoped>
@import "~simplemde/dist/simplemde.min.css";
</style>
