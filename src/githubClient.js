import { Octokit } from "@octokit/rest";

export default class GithubClient {
  constructor(owner, repo, pat) {
    this.owner = owner;
    this.repo = repo;
    this.octokit = new Octokit({
      auth: pat
    });
  }

  async getPublishedPosts() {
    try {
      const result = await this.octokit.repos.getContents({
        owner: this.owner,
        repo: this.repo,
        path: "_posts"
      });
      // console.log(result);
      return result.data;
    } catch (error) {
      console.log(error);
      return [];
    }
  }

  async getDraftPosts() {
    try {
      const result = await this.octokit.repos.getContents({
        owner: this.owner,
        repo: this.repo,
        path: "_drafts"
      });
      // console.log(result);
      return result.data;
    } catch (error) {
      console.log(error);
      return [];
    }
  }

  async getFileContents(filePath) {
    try {
      const result = await this.octokit.repos.getContents({
        owner: this.owner,
        repo: this.repo,
        path: filePath
      });
      // console.log(result);
      return result.data;
    } catch (error) {
      console.log(error);
      return {};
    }
  }

  async createFile(filePath, content) {
    try {
      await this.octokit.repos.createOrUpdateFile({
        owner: this.owner,
        repo: this.repo,
        path: filePath,
        message: "Commit generated by github-cms",
        content: content
      });
    } catch (error) {
      console.log(error);
    }
  }

  async updateFile(filePath, content, sha) {
    try {
      await this.octokit.repos.createOrUpdateFile({
        owner: this.owner,
        repo: this.repo,
        path: filePath,
        message: "Commit generated by github-cms",
        content: content,
        sha: sha
      });
    } catch (error) {
      console.log(error);
    }
  }

  async deleteFile(filePath, sha) {
    try {
      await this.octokit.repos.deleteFile({
        owner: this.owner,
        repo: this.repo,
        path: filePath,
        message: "Commit generated by github-cms",
        sha: sha
      });
    } catch (error) {
      console.log(error);
    }
  }
}
