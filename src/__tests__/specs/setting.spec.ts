import { expect } from "@wdio/globals";
import { browser } from "wdio-electron-service";
import { setupBrowser, type WebdriverIOQueries } from "@testing-library/webdriverio";

declare global {
  namespace WebdriverIO {
    interface Browser extends WebdriverIOQueries {}
    interface Element extends WebdriverIOQueries {}
  }
}

describe("Module Setting", () => {
  let screen: WebdriverIOQueries;

  before(() => {
    // @ts-ignore
    screen = setupBrowser(browser);
  });

  // Cover a few WebdriverIO expect matchers -  https://webdriver.io/docs/api/expect-webdriverio

  describe("Language", async () => {
    it("should be set & update", async () => {
      await (await browser.$('button[data-testid="setting-trigger"]')).click();

      const trigger = await browser.$('button[data-testid="language-trigger"]');
      const defaultLocale = await browser.waitUntil(async () => {
          return await trigger.getText();
        }),
        selectLocale = defaultLocale === "English" ? "简体中文" : "English",
        index = defaultLocale === "English" ? 0 : 1;

      await (await browser.$('button[data-testid="language-trigger"]')).click();

      const exist = await browser.waitUntil(
        async function () {
          const item = await browser.$$('div[data-testid="language-item"]')[index];
          return await item.$$("span")[1].getText();
        },
        {
          timeout: 5000,
          timeoutMsg: "expected text to be different after 5s"
        }
      );

      expect(exist).toHaveText(selectLocale);

      await (await browser.$$('div[data-testid="language-item"]'))[index].click();

      await expect(await browser.$('button[data-testid="language-trigger"]')).toHaveText(
        selectLocale
      );

      await (await browser.getByTestId("setting-submit")).click();
    });
  });

  describe("Theme", () => {
    it("should be set & update", async () => {});
  });
});
