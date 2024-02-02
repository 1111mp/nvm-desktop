import { expect } from "@wdio/globals";
import { browser } from "wdio-electron-service";

const { productName, version } = globalThis.packageJson;

describe("Electron APIs", () => {
  describe("app", () => {
    it("should retrieve app metadata through the electron API", async () => {
      const appName = await browser.electron.execute((electron) => electron.app.getName());
      expect(appName).toEqual(productName);
      const appVersion = await browser.electron.execute((electron) => electron.app.getVersion());
      expect(appVersion).toEqual(version);
    });
  });

  describe("IPC Renderer", () => {
    describe("get-system-theme", () => {
      it("should return the value of system theme", async () => {
        const theme = await browser.execute(() => window.Context.getSystemTheme());

        expect(theme).toHaveText(["light", "dark"]);
      });
    });

    describe("setting-data-get", () => {
      it("should return the value of setting", async () => {
        const setting = await browser.execute(() => window.Context.getSettingData());

        expect(setting).toBeDefined();
        expect(setting).toHaveProperty("locale");
        expect(setting).toHaveProperty("mirror");
        expect(setting).toHaveProperty("theme");
      });
    });
  });
});
