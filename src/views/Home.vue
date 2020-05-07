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
                  </template>
                </b-menu-item>
              </b-menu-item>
              <b-menu-item
                active
                expanded
                label="Draft posts"
                :disabled="draftPosts.length === 0"
              >
                <b-menu-item
                  v-for="post in draftPosts"
                  :key="post.sha"
                  @click="openFile(post.path)"
                  ><template slot="label">
                    {{ post.name }}
                  </template>
                </b-menu-item>
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
      <vue-simplemde v-model="postContent" style="margin-top: 2rem" />
      <b-button
        v-if="postPath === ''"
        type="is-primary"
        @click="newPublished"
        style="margin-right: 1rem"
        >Publish</b-button
      >
      <b-button
        v-else-if="postPath.startsWith('_posts/')"
        type="is-primary"
        @click="updatePublished"
        style="margin-right: 1rem"
        >Update</b-button
      >
      <b-button
        v-else-if="postPath.startsWith('_drafts/')"
        type="is-primary"
        @click="updateDraft"
        style="margin-right: 1rem"
        >Update</b-button
      >

      <b-button v-if="postPath === ''" @click="newDraft"
        >Save as draft</b-button
      >
      <b-button v-else-if="postPath.startsWith('_posts/')" @click="newDraft"
        >Save as draft</b-button
      >
      <b-button
        v-else-if="postPath.startsWith('_drafts/')"
        @click="newPublished"
        >Publish</b-button
      >

      <b-button
        v-if="postPath && postSha"
        type="is-danger"
        icon-right="delete"
        @click="deletePost"
        style="margin-left: 1rem"
      />
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
      this.postData.title = fm.data.title;
      const date = Date.parse(fm.data.date);
      if (date) {
        this.postData.date = new Date(date);
      } else {
        this.postData.date = new Date();
      }
      this.postContent = fm.content;
    },
    newPublished: async function() {
      if (this.postPath.startsWith("_drafts/") && this.postSha !== "") {
        await this.githubClient.deleteFile(this.postPath, this.postSha);
        this.postSha = "";
      }
      this.postPath = `_posts/${this.postData.date
        .toISOString()
        .slice(0, 10)}-${this.titleToPath(this.postData.title)}.md`;
      await this.githubClient.createFile(
        this.postPath,
        b64EncodeUnicode(matter.stringify(this.postContent, this.postData))
      );
      this.$buefy.notification.open({
        duration: 5000,
        message: `Post published successfully`,
        position: "is-bottom-right",
        type: "is-success",
        hasIcon: true,
      });
    },
    updatePublished: async function() {
      const newPath = `_posts/${this.postData.date
        .toISOString()
        .slice(0, 10)}-${this.titleToPath(this.postData.title)}.md`;
      if (newPath !== this.postPath) {
        await this.githubClient.deleteFile(this.postPath, this.postSha);
        await this.githubClient.createFile(
          newPath,
          b64EncodeUnicode(matter.stringify(this.postContent, this.postData))
        );
      } else {
        await this.githubClient.updateFile(
          this.postPath,
          b64EncodeUnicode(matter.stringify(this.postContent, this.postData)),
          this.postSha
        );
      }
      this.$buefy.notification.open({
        duration: 5000,
        message: `Post updated successfully`,
        position: "is-bottom-right",
        type: "is-success",
        hasIcon: true,
      });
    },
    newDraft: async function() {
      if (this.postPath.startsWith("_posts/") && this.postSha !== "") {
        await this.githubClient.deleteFile(this.postPath, this.postSha);
        this.postSha = "";
      }
      this.postPath = `_drafts/${this.titleToPath(this.postData.title)}.md`;
      await this.githubClient.createFile(
        this.postPath,
        b64EncodeUnicode(matter.stringify(this.postContent, this.postData))
      );
      this.$buefy.notification.open({
        duration: 5000,
        message: `Draft post created successfully`,
        position: "is-bottom-right",
        type: "is-success",
        hasIcon: true,
      });
    },
    updateDraft: async function() {
      const newPath = `_drafts/${this.titleToPath(this.postData.title)}.md`;
      if (newPath !== this.postPath) {
        await this.githubClient.deleteFile(this.postPath, this.postSha);
        await this.githubClient.createFile(
          newPath,
          b64EncodeUnicode(matter.stringify(this.postContent, this.postData))
        );
      } else {
        await this.githubClient.updateFile(
          this.postPath,
          b64EncodeUnicode(matter.stringify(this.postContent, this.postData)),
          this.postSha
        );
      }
      this.$buefy.notification.open({
        duration: 5000,
        message: `Draft post updated successfully`,
        position: "is-bottom-right",
        type: "is-success",
        hasIcon: true,
      });
    },
    deletePost: async function() {
      await this.githubClient.deleteFile(this.postPath, this.postSha);
      this.$buefy.notification.open({
        duration: 5000,
        message: `Post deleted successfully`,
        position: "is-bottom-right",
        type: "is-success",
        hasIcon: true,
      });
    },
    titleToPath(title) {
      return title
        .toLowerCase()
        .split(" ")
        .join("-")
        .replace(/[^a-zA-Z0-9-_]/g, "");
    },
  },
};
</script>

<style scoped>
@import "~simplemde/dist/simplemde.min.css";
</style>
