import "./intro.css";

import { useState, useEffect, useMemo } from "react";
import { Outlet, Link, useLocation } from "react-router-dom";
import {
  Button,
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  navigationMenuTriggerStyle
} from "@renderer/components/ui";
import { ThemeCustomizer } from "@renderer/components/theme-customizer";
import { RocketIcon, HeartIcon, FaceIcon, MinusIcon, Cross2Icon } from "@radix-ui/react-icons";
import { Configration } from "./configration";
import { Updater } from "./updater";
import { Setting } from "./setting";
import { Tip } from "./tip";
import { toast } from "sonner";
import { Steps } from "intro.js-react";

import { useI18n, useAppContext } from "@src/renderer/src/app-context";

const Home: React.FC = () => {
  const [enabled, setEnabled] = useState<boolean>(() => !localStorage.getItem("nvmd-first"));

  const { pathname } = useLocation();

  const { locale } = useAppContext();
  const i18n = useI18n();

  const platform = window.Context.platform;

  useEffect(() => {
    window.Context.onRegistMigrationError(() => {
      toast.error(i18n("Migration-error"), { duration: 8000 });
    });
  }, []);

  const steps = useMemo(
    () => [
      {
        element: ".body",
        title: i18n("Welcome"),
        intro: (
          <div>
            <p className="flex items-center gap-2 font-normal">
              {i18n("Welcome-to")} nvm-desktop.
              <RocketIcon className="text-primary" />
            </p>
            <p className="text-muted-foreground font-light">{i18n("App-Desc")}</p>
          </div>
        )
      },
      {
        element: ".theme-customizer",
        title: i18n("Theme color"),
        intro: (
          <p className="flex items-center gap-2">
            {i18n("Color-Tip")}
            <HeartIcon className="text-primary" />
          </p>
        )
      },
      {
        element: ".nvmd-tip",
        title: i18n("Tip"),
        intro: (
          <>
            <div className="font-normal text-sm space-y-4">
              {platform === "win32" ? (
                locale === "zh-CN" ? (
                  <>
                    <p>
                      <span>
                        现在，您系统的环境变量<span className="text-muted-foreground"> PATH </span>
                        中添加了如下路径：
                        <span className="text-muted-foreground"> %HOMEDIR%\.nvmd\bin </span>，
                        {i18n("Set-by")} :
                        <span className="text-muted-foreground"> setx -m NVMD path </span>。
                      </span>
                    </p>
                    <p>
                      <span>
                        此目录下保存着用于管理 Node 版本的可执行文件，由 Rust
                        编写，如果有需要请查看项目源码：
                        <a
                          className="text-primary hover:opacity-80"
                          href="https://github.com/1111mp/nvmd-command"
                          target="_blank"
                        >
                          nvmd-command
                        </a>
                        。
                      </span>
                    </p>
                    <p>
                      <span>
                        然后你可以开始下载安装 Node 了。下载安装完成之后点击
                        <span className="text-muted-foreground"> 应用 </span>
                        按钮将其设置为全局默认版本。
                      </span>
                    </p>
                    <p>
                      <span>你也可以通过命令行工具直接管理所有的 Nodejs 版本：</span>
                      <a
                        className="text-primary hover:opacity-80"
                        href="https://github.com/1111mp/nvmd-command#command-tools-intro"
                        target="_blank"
                      >
                        nvmd
                      </a>
                      . 在你的终端输入 <span className="text-muted-foreground">nvmd --help</span>{" "}
                      以查看更多信息。
                    </p>
                    <p>
                      <span>切换 Node 版本之后，默认不需要重新打开你的终端就能够生效。</span>
                    </p>
                  </>
                ) : (
                  <>
                    <p>
                      <span>
                        The following path is now added to your system's
                        <span className="text-muted-foreground"> PATH </span>environment variable:
                        <span className="text-muted-foreground"> %HOMEDIR%\.nvmd\bin </span>,{" "}
                        {i18n("Set-by")} :
                        <span className="text-muted-foreground"> setx -m NVMD path </span>.
                      </span>
                    </p>
                    <p>
                      <span>
                        This directory holds the executable for managing the Node version, written
                        in Rust. Check the project source code if you needed:{" "}
                        <a
                          className="text-primary hover:opacity-80"
                          href="https://github.com/1111mp/nvmd-command"
                          target="_blank"
                        >
                          nvmd-command
                        </a>
                        .
                      </span>
                    </p>
                    <p>
                      <span>
                        You should then be able to start downloading and installing Node. After the
                        download and installation is complete, click the{" "}
                        <span className="text-muted-foreground"> Apply </span> button to set it as
                        the global default version.
                      </span>
                    </p>
                    <p>
                      <span>
                        You can also manage all versions of node directly from the command line:{" "}
                      </span>
                      <a
                        className="text-primary hover:opacity-80"
                        href="https://github.com/1111mp/nvmd-command#command-tools-intro"
                        target="_blank"
                      >
                        nvmd
                      </a>
                      . Please type <span className="text-muted-foreground">nvmd --help</span> in
                      your terminal to see more information.
                    </p>
                    <p>
                      <span>
                        After switching the Node version, you don't need to reopen your terminal to
                        take effect by default.
                      </span>
                    </p>
                  </>
                )
              ) : (
                <>
                  <p className="text-sm font-normal">
                    <span>{i18n("Tip-Content")}</span>
                  </p>
                  <p>
                    <span className="text-muted-foreground break-all">
                      {'export NVMD_DIR="$HOME/.nvmd" \nexport PATH="$NVMD_DIR/bin:$PATH"'}
                    </span>
                  </p>
                  {locale === "zh-CN" ? (
                    <>
                      <p>
                        <span>
                          然后你可以开始下载安装 Node 了。下载安装完成之后点击
                          <span className="text-muted-foreground"> 应用 </span>
                          按钮将其设置为全局默认版本。
                        </span>
                      </p>
                      <p>
                        <span>你也可以通过命令行工具直接管理所有的 Nodejs 版本：</span>
                        <a
                          className="text-primary hover:opacity-80"
                          href="https://github.com/1111mp/nvmd-command#command-tools-intro"
                          target="_blank"
                        >
                          nvmd
                        </a>
                        . 在你的终端输入 <span className="text-muted-foreground">nvmd --help</span>{" "}
                        以查看更多信息。
                      </p>
                      <p>
                        <span>切换 Node 版本之后，默认不需要重新打开你的终端就能够生效。</span>
                      </p>
                    </>
                  ) : (
                    <>
                      <p>
                        <span>
                          You should then be able to start downloading and installing Node. After
                          the download and installation is complete, click the{" "}
                          <span className="text-muted-foreground"> Apply </span> button to set it as
                          the global default version.
                        </span>
                      </p>
                      <p>
                        <span>
                          You can also manage all versions of node directly from the command line:{" "}
                        </span>
                        <a
                          className="text-primary hover:opacity-80"
                          href="https://github.com/1111mp/nvmd-command#command-tools-intro"
                          target="_blank"
                        >
                          nvmd
                        </a>
                        . Please type <span className="text-muted-foreground">nvmd --help</span> in
                        your terminal to see more information.
                      </p>
                      <p>
                        <span>
                          After switching the Node version, you don't need to reopen your terminal
                          to take effect by default.
                        </span>
                      </p>
                    </>
                  )}
                </>
              )}
            </div>
          </>
        )
      },
      {
        element: ".nvmd-setting",
        title: i18n("Setting"),
        intro:
          locale === "zh-CN" ? (
            <div className="font-normal text-sm space-y-4">
              <p>
                <span>在这里，你可以更改 Nodejs 的默认安装目录。</span>
              </p>
              <p>
                <span>
                  请注意，nvm-desktop
                  不会跟踪您所使用过的所有的目录，这意味着您每次更改安装目录之后都需要重新下载
                  Nodejs。
                  <span className="text-muted-foreground">
                    {" "}
                    但是你可以手动将之前目录下下载的所有 Nodejs 文件移动到新的目录下。
                  </span>
                </span>
              </p>
              <p>
                <span>
                  之所以这么设计是为了避免过多的文件检索从而影响 nvm-command 在性能上的表现。
                </span>
              </p>
            </div>
          ) : (
            <div className="font-normal text-sm space-y-4">
              <p>
                <span>Here you can change the Nodejs installation directory.</span>
              </p>
              <p>
                <span>
                  Please note that nvm-desktop does not keep track of all your used directories.
                  This means that every time you change the installation directory, you need to
                  re-download Nodejs.
                  <span className="text-muted-foreground">
                    {" "}
                    But maybe you can also manually move all Nodejs version files downloaded from
                    the previous directory to the new directory.
                  </span>
                </span>
              </p>
              <p>
                <span>
                  The reason for this design is to avoid excessive file retrieval, which will affect
                  the performance of nvm-command.
                </span>
              </p>
            </div>
          )
      },
      {
        element: ".nvmd-project",
        title: i18n("Projects"),
        intro: (
          <div className="font-normal text-sm space-y-4">
            <p>
              <span>{i18n("Can-Select")}</span>
            </p>
            <p>
              <span>{i18n("Command-Tip-Project")}</span>
              <span className="text-muted-foreground"> nvmd use node_version --project</span>
            </p>
            <p>
              <span>
                {i18n("Had-File")} <span className="text-muted-foreground">.nvmdrc</span>{" "}
                {i18n("Load-Node")}
              </span>
            </p>
          </div>
        )
      },
      {
        element: ".body",
        title: i18n("Finally"),
        intro: (
          <div className="font-normal text-sm space-y-4">
            <p>
              <span className="text-muted-foreground">{i18n("Tip-Finally")}</span>
              <a
                className="text-primary hover:opacity-80"
                href="https://github.com/1111mp/nvm-desktop/issues"
                target="_blank"
              >
                &nbsp; {i18n("Refer")}
              </a>
            </p>
            <p className="flex items-center gap-1">
              <span>{i18n("Bles")}</span>
              <FaceIcon className="text-primary" />
            </p>
          </div>
        )
      }
    ],
    [locale]
  );

  const linkStyle = navigationMenuTriggerStyle();

  return (
    <>
      {platform === "darwin" ? (
        <header className="flex items-center pt-2 pr-3 justify-between pl-24 select-none [-webkit-app-region:drag]">
          <NavigationMenu>
            <NavigationMenuList className="[-webkit-app-region:no-drag]">
              <NavigationMenuItem>
                <NavigationMenuLink asChild>
                  <Link to="/all" className={linkStyle} data-active={pathname === "/all"}>
                    {i18n("Versions")}
                  </Link>
                </NavigationMenuLink>
              </NavigationMenuItem>
              <NavigationMenuItem>
                <NavigationMenuLink asChild>
                  <Link
                    to="/installed"
                    className={linkStyle}
                    data-active={pathname === "/installed"}
                  >
                    {i18n("Installed")}
                  </Link>
                </NavigationMenuLink>
              </NavigationMenuItem>
              <NavigationMenuItem className="nvmd-project">
                <NavigationMenuLink asChild>
                  <Link to="/projects" className={linkStyle} data-active={pathname === "/projects"}>
                    {i18n("Projects")}
                  </Link>
                </NavigationMenuLink>
              </NavigationMenuItem>
              <NavigationMenuItem>
                <NavigationMenuLink asChild>
                  <Link to="/groups" className={linkStyle} data-active={pathname === "/groups"}>
                    {i18n("Groups")}
                  </Link>
                </NavigationMenuLink>
              </NavigationMenuItem>
            </NavigationMenuList>
          </NavigationMenu>
          <div className="flex items-center [-webkit-app-region:no-drag]">
            <ThemeCustomizer />
            <Tip />
            <Configration />
            <Setting />
          </div>
        </header>
      ) : (
        <header className="flex items-center pt-2 px-3 justify-between select-none [-webkit-app-region:drag]">
          <div className="flex items-center gap-3">
            <NavigationMenu>
              <NavigationMenuList className="[-webkit-app-region:no-drag]">
                <NavigationMenuItem>
                  <NavigationMenuLink asChild>
                    <Link to="/all" className={linkStyle} data-active={pathname === "/all"}>
                      {i18n("Versions")}
                    </Link>
                  </NavigationMenuLink>
                </NavigationMenuItem>
                <NavigationMenuItem>
                  <NavigationMenuLink asChild>
                    <Link
                      to="/installed"
                      className={linkStyle}
                      data-active={pathname === "/installed"}
                    >
                      {i18n("Installed")}
                    </Link>
                  </NavigationMenuLink>
                </NavigationMenuItem>
                <NavigationMenuItem className="nvmd-project">
                  <NavigationMenuLink asChild>
                    <Link
                      to="/projects"
                      className={linkStyle}
                      data-active={pathname === "/projects"}
                    >
                      {i18n("Projects")}
                    </Link>
                  </NavigationMenuLink>
                </NavigationMenuItem>
                <NavigationMenuItem>
                  <NavigationMenuLink asChild>
                    <Link to="/groups" className={linkStyle} data-active={pathname === "/groups"}>
                      {i18n("Groups")}
                    </Link>
                  </NavigationMenuLink>
                </NavigationMenuItem>
              </NavigationMenuList>
            </NavigationMenu>
          </div>
          <div className="flex items-center gap-4 [-webkit-app-region:no-drag]">
            <div className="flex items-center [-webkit-app-region:no-drag]">
              {platform === "win32" && <Updater />}
              <ThemeCustomizer />
              <Tip />
              <Configration />
              <Setting />
            </div>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="secondary"
                icon={<MinusIcon />}
                onClick={() => {
                  window.Context.windowMinimize();
                }}
              />
              <Button
                size="sm"
                variant="secondary"
                icon={<Cross2Icon />}
                onClick={() => {
                  window.Context.windowClose();
                }}
              />
            </div>
          </div>
        </header>
      )}
      <main className="px-6 py-4 flex-1 overflow-hidden">
        <Outlet />
      </main>
      <Steps
        enabled={enabled}
        initialStep={0}
        options={{
          hidePrev: true,
          disableInteraction: true,
          overlayOpacity: 0.6,
          buttonClass:
            "inline-flex items-center bg-primary text-primary-foreground outline-none h-6 rounded-md px-2 text-xs shadow hover:bg-primary/90",
          exitOnOverlayClick: false,
          exitOnEsc: false
        }}
        steps={steps}
        onExit={() => {
          localStorage.setItem("nvmd-first", "no");
          setEnabled(false);
        }}
      />
    </>
  );
};

export default Home;
