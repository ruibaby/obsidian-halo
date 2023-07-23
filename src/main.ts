import { Notice, Plugin } from "obsidian";
import { addHaloIcon } from "./icons";
import { HaloSettingTab, HaloSetting, DEFAULT_SETTINGS } from "./settings";
import { HaloRestClient } from "./halo-rest-client";
import { readMatter } from "./utils/yaml";

export default class HaloPlugin extends Plugin {
  settings: HaloSetting;

  async onload() {
    console.log("loading obsidian-halo plugin");

    await this.loadSettings();

    addHaloIcon();

    this.addRibbonIcon("halo-logo", "Publish to Halo", (evt: MouseEvent) => {
      new Notice("This is a notice!");
    });

    this.addCommand({
      id: "halo-publish",
      name: "Publish to Halo",
      callback: async () => {
        const site = this.settings.sites[0];
        const client = new HaloRestClient(site);
        await client.publishPost();
      },
    });

    this.addCommand({
      id: "halo-publish-with-defaults",
      name: "Publish to Halo(with defaults)",
      callback: async () => {
        const site = this.settings.sites.find((site) => site.default);

        if (!site) {
          new Notice("请先配置默认站点");
          return;
        }

        const client = new HaloRestClient(site);
        await client.publishPost();
      },
    });

    this.addCommand({
      id: "halo-pull-post",
      name: "Pull post from Halo",
      editorCallback: async () => {
        const { activeEditor } = app.workspace;

        if (!activeEditor || !activeEditor.file) {
          return;
        }

        const contentWithMatter = await app.vault.read(activeEditor.file);
        const { data: matterData } = readMatter(contentWithMatter);

        if (!matterData.halo?.site) {
          new Notice("此文档还未发布到 Halo");
          return;
        }

        const site = this.settings.sites.find((site) => site.url === matterData.halo?.site);

        if (!site) {
          new Notice("此文档发布到的站点未配置");
          return;
        }

        const client = new HaloRestClient(site);
        await client.pullPost();
      },
    });

    this.addSettingTab(new HaloSettingTab(this));
  }

  onunload() {}

  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }

  async saveSettings() {
    await this.saveData(this.settings);
  }
}
