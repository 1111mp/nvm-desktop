import {
  app,
  Menu,
  shell,
  BrowserWindow,
  MenuItemConstructorOptions,
} from 'electron';

interface DarwinMenuItemConstructorOptions extends MenuItemConstructorOptions {
  selector?: string;
  submenu?: DarwinMenuItemConstructorOptions[] | Menu;
}

export default class MenuBuilder {
  constructor(
    private readonly mainWindow: BrowserWindow,
    private i18n: I18n.I18nFn,
  ) {
    this.mainWindow = mainWindow;
  }

  buildMenu(i18n?: I18n.I18nFn): Menu {
    if (
      process.env.NODE_ENV === 'development' ||
      process.env.DEBUG_PROD === 'true'
    ) {
      this.setupDevelopmentEnvironment();
    }

    i18n && (this.i18n = i18n);

    const template =
      process.platform === 'darwin'
        ? this.buildDarwinTemplate()
        : this.buildDefaultTemplate();

    const menu = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(menu);

    return menu;
  }

  setupDevelopmentEnvironment(): void {
    this.mainWindow.webContents.on('context-menu', (_, props) => {
      const { x, y } = props;

      Menu.buildFromTemplate([
        {
          label: 'Inspect element',
          click: () => {
            this.mainWindow.webContents.inspectElement(x, y);
          },
        },
      ]).popup({ window: this.mainWindow });
    });
  }

  buildDarwinTemplate(): MenuItemConstructorOptions[] {
    const subMenuAbout: DarwinMenuItemConstructorOptions = {
      label: 'NVM-Desktop',
      submenu: [
        {
          label: `${this.i18n('About')} NVM-Desktop`,
          selector: 'orderFrontStandardAboutPanel:',
        },
        { type: 'separator' },
        { label: this.i18n('Services') as string, submenu: [] },
        { type: 'separator' },
        {
          label: `${this.i18n('Hide')} NVM-Desktop`,
          accelerator: 'Command+H',
          selector: 'hide:',
        },
        {
          label: this.i18n('Hide-Others') as string,
          accelerator: 'Command+Shift+H',
          selector: 'hideOtherApplications:',
        },
        {
          label: this.i18n('Show-All') as string,
          selector: 'unhideAllApplications:',
        },
        { type: 'separator' },
        {
          label: this.i18n('Quit') as string,
          accelerator: 'Command+Q',
          click: () => {
            app.quit();
          },
        },
      ],
    };

    const subMenuEdit: DarwinMenuItemConstructorOptions = {
      label: this.i18n('Edit') as string,
      submenu: [
        {
          label: this.i18n('Undo') as string,
          accelerator: 'Command+Z',
          selector: 'undo:',
        },
        {
          label: this.i18n('Redo') as string,
          accelerator: 'Shift+Command+Z',
          selector: 'redo:',
        },
        { type: 'separator' },
        {
          label: this.i18n('Cut') as string,
          accelerator: 'Command+X',
          selector: 'cut:',
        },
        {
          label: this.i18n('Copy') as string,
          accelerator: 'Command+C',
          selector: 'copy:',
        },
        {
          label: this.i18n('Paste') as string,
          accelerator: 'Command+V',
          selector: 'paste:',
        },
        {
          label: this.i18n('Select-All') as string,
          accelerator: 'Command+A',
          selector: 'selectAll:',
        },
      ],
    };

    const subMenuWindow: DarwinMenuItemConstructorOptions = {
      label: this.i18n('Window') as string,
      submenu: [
        {
          label: this.i18n('Minimize') as string,
          accelerator: 'Command+M',
          selector: 'performMiniaturize:',
        },
        {
          label: this.i18n('Close') as string,
          accelerator: 'Command+W',
          selector: 'performClose:',
        },
      ],
    };

    const subMenuHelp: MenuItemConstructorOptions = {
      label: this.i18n('Help') as string,
      submenu: [
        {
          label: this.i18n('Learn-More') as string,
          click() {
            shell.openExternal('https://github.com/1111mp/NVM-Desktop');
          },
        },
        {
          label: this.i18n('Documentation') as string,
          click() {
            shell.openExternal('https://github.com/1111mp/NVM-Desktop#readme');
          },
        },
        {
          label: this.i18n('Search-Issues') as string,
          click() {
            shell.openExternal('https://github.com/1111mp/NVM-Desktop/issues');
          },
        },
      ],
    };

    return [subMenuAbout, subMenuEdit, subMenuWindow, subMenuHelp];
  }

  buildDefaultTemplate() {
    const templateDefault = [
      {
        label: this.i18n('Help') as string,
        submenu: [
          {
            label: this.i18n('Learn-More') as string,
            click() {
              shell.openExternal('https://github.com/1111mp/NVM-Desktop');
            },
          },
          {
            label: this.i18n('Documentation') as string,
            click() {
              shell.openExternal(
                'https://github.com/1111mp/NVM-Desktop#readme',
              );
            },
          },
          {
            label: this.i18n('Search-Issues') as string,
            click() {
              shell.openExternal(
                'https://github.com/1111mp/NVM-Desktop/issues',
              );
            },
          },
        ],
      },
    ];

    return templateDefault;
  }
}
