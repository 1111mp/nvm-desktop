import {
  Button,
  LabelCopyable,
  Separator,
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger
} from "@renderer/components/ui";
import { CookieIcon, InfoCircledIcon } from "@radix-ui/react-icons";
import { useAppContext, useI18n } from "@src/renderer/src/app-context";
import { toast } from "sonner";

export function Tip() {
  const { locale } = useAppContext();
  const i18n = useI18n();

  const platform = window.Context.platform;

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button
          className="nvmd-tip"
          size="sm"
          title={i18n("Tip")}
          variant="ghost"
          icon={<InfoCircledIcon />}
        />
      </SheetTrigger>
      <SheetContent className="flex flex-col overflow-hidden px-0">
        <SheetHeader className="px-4">
          <SheetTitle>{i18n("Tip")}</SheetTitle>
        </SheetHeader>
        <div className="flex flex-1 flex-col px-4 gap-4 [overflow:overlay]">
          <div className="space-y-2">
            <p className="text-muted-foreground text-base font-medium">{`${i18n("Install")} Node`}</p>
            <div className="font-normal text-sm space-y-4">
              {locale === "zh-CN" ? (
                <>
                  {platform !== "win32" ? (
                    <>
                      <p>
                        <span>{i18n("Tip-Content")}</span>
                      </p>
                      <p>
                        <LabelCopyable className=" break-all">
                          {'export NVMD_DIR="$HOME/.nvmd" \nexport PATH="$NVMD_DIR/bin:$PATH"'}
                        </LabelCopyable>
                      </p>
                    </>
                  ) : null}
                  <p>
                    <span>找到你想要安装的Node的版本，然后点击安装按钮开始下载安装。</span>
                  </p>
                  <p>
                    <span className="text-muted-foreground">
                      默认下载镜像地址
                      <a
                        className="text-primary hover:opacity-80"
                        href="https://nodejs.org/dist/"
                        target="_blank"
                      >
                        &nbsp; https://nodejs.org/dist/
                      </a>
                      。
                    </span>
                  </p>
                </>
              ) : (
                <>
                  {platform !== "win32" ? (
                    <>
                      <p>
                        <span>{i18n("Tip-Content")}</span>
                      </p>
                      <p>
                        <LabelCopyable className="text-muted-foreground break-all">
                          {'export NVMD_DIR="$HOME/.nvmd" \nexport PATH="$NVMD_DIR/bin:$PATH"'}
                        </LabelCopyable>
                      </p>
                    </>
                  ) : null}
                  <p>
                    <span>
                      Find the version you need and click the Install button to install it.
                    </span>
                  </p>
                  <p>
                    <span className="text-muted-foreground">
                      Download release files available on
                      <a
                        className="text-primary hover:opacity-80"
                        href="https://nodejs.org/dist/"
                        target="_blank"
                      >
                        &nbsp; https://nodejs.org/dist/
                      </a>
                      .
                    </span>
                  </p>
                </>
              )}
            </div>
          </div>
          <Separator />
          <div className="space-y-2">
            <p className="text-muted-foreground text-base font-medium">{i18n("Setting")}</p>
            <div className="font-normal text-sm space-y-4">
              {locale === "zh-CN" ? (
                <>
                  <p>
                    <span>
                      下载安装完成之后，点击
                      <span className="text-muted-foreground"> 应用 </span>
                      按钮将该版本设置为全局默认的Node版本。
                    </span>
                  </p>
                  <p>
                    如果你需要为你的项目单独设置Node的版本，请前往
                    <span className="text-muted-foreground"> 项目 </span>
                    页面添加设置。
                  </p>
                  <p>
                    <span>默认识别Node版本的策略：</span>
                    <span className="text-muted-foreground">
                      当前目录下是否指定Node版本（.nvmdrc文件），如果指定那么使用该版本，否则使用全局默认的Node版本。
                    </span>
                  </p>
                </>
              ) : (
                <>
                  <p>
                    <span>
                      After the download and installation is complete, click the
                      <span className="text-muted-foreground"> Apply </span> button to set the
                      version as the global default Node version.
                    </span>
                  </p>
                  <p>
                    If you need to set a separate version of Node for your project, go to the{" "}
                    <span className="text-muted-foreground"> Project </span>
                    page to add settings.
                  </p>
                  <p>
                    <span>Default Node version-aware policy: </span>
                    <span className="text-muted-foreground">
                      Whether to specify the Node version (.nvmdrc file) in the current directory,
                      if so, the version is used, otherwise the global default Node version is used.
                    </span>
                  </p>
                </>
              )}
            </div>
          </div>
          <Separator />
          <div className="space-y-2">
            <p className="text-muted-foreground text-base font-medium">
              {i18n("Command-tools-intro")}
            </p>
            <div className="font-normal text-sm space-y-4">
              {locale === "zh-CN" ? (
                <>
                  <p>
                    <span className="text-muted-foreground"> nvmd </span>
                    <span>允许您通过命令行快速管理多个 Nodejs 版本。</span>
                  </p>
                  <p>
                    使用 list 或者 ls 查看所有已安装的版本：
                    <span className="text-muted-foreground"> nvmd list</span> or
                    <span className="text-muted-foreground"> nvmd ls</span>
                  </p>
                  <p>
                    为系统设置指定的版本：
                    <span className="text-muted-foreground"> nvmd use node_version</span>
                  </p>
                  <p>
                    或者你也可以通过命令行为你的项目指定nodejs版本：
                    <span className="text-muted-foreground"> nvmd use node_version --project</span>
                  </p>
                  <p>
                    在你的终端输入{" "}
                    <LabelCopyable className="text-muted-foreground break-all">
                      nvmd --help
                    </LabelCopyable>{" "}
                    以查看更多信息。
                  </p>
                  <p>
                    <span className="text-muted-foreground">
                      通过 nvmd use 命令行切换 Nodejs 版本后，请点击刷新按钮让 nvm-desktop
                      同步最新数据。
                    </span>
                  </p>
                </>
              ) : (
                <>
                  <p>
                    The
                    <span className="text-muted-foreground"> nvmd </span>
                    <span>
                      allows you to quickly manage different versions of node via the command line.
                    </span>
                  </p>
                  <p>
                    List all installed versions using list or ls:
                    <span className="text-muted-foreground"> nvmd list</span> or
                    <span className="text-muted-foreground"> nvmd ls</span>
                  </p>
                  <p>
                    And then in any new shell just use the installed version:
                    <span className="text-muted-foreground"> nvmd use node_version</span>
                  </p>
                  <p>
                    Or you can also specify the nodejs version for your project through the command
                    line:
                    <span className="text-muted-foreground"> nvmd use node_version --project</span>
                  </p>
                  <p>
                    Please type{" "}
                    <LabelCopyable className="text-muted-foreground break-all">
                      nvmd --help
                    </LabelCopyable>{" "}
                    in your terminal to see more information.
                  </p>
                  <p>
                    <span className="text-muted-foreground">
                      After you switch the Node version through the nvmd use command line, please
                      click the refresh button to let nvm-desktop synchronize the latest data.
                    </span>
                  </p>
                </>
              )}
            </div>
          </div>
          <Separator />
          <div className="space-y-2">
            <p className="text-muted-foreground text-base font-medium">{i18n("Finally")}</p>
            <div className="font-normal text-sm space-y-4">
              {locale === "zh-CN" ? (
                <>
                  <p>
                    <span>
                      有时候或许你需要重启你的终端。 在终端输入 &nbsp;
                      <span className="text-muted-foreground">"node --version"</span>{" "}
                      以检查是否生效。
                    </span>
                  </p>
                  <p>
                    <span className="text-muted-foreground">
                      有关此问题的更多信息以及可能的解决办法，请查看
                    </span>
                    <a
                      className="text-primary hover:opacity-80"
                      href="https://github.com/1111mp/nvm-desktop/issues"
                      target="_blank"
                    >
                      &nbsp; 这里。
                    </a>
                  </p>
                </>
              ) : (
                <>
                  <p>
                    <span>
                      You might need to restart your terminal instance. Enter &nbsp;
                      <span className="text-muted-foreground">"node --version"</span> in the
                      terminal to check if it works.
                    </span>
                  </p>
                  <p>
                    <span className="text-muted-foreground">
                      For more information about this issue and possible workarounds, please
                    </span>
                    <a
                      className="text-primary hover:opacity-80"
                      href="https://github.com/1111mp/nvm-desktop/issues"
                      target="_blank"
                    >
                      &nbsp; refer here.
                    </a>
                  </p>
                </>
              )}
            </div>
          </div>
          <Separator />
          <div className="mb-4 space-y-2">
            <p className="text-muted-foreground text-base font-medium">{i18n("Tour")}</p>
            <Button
              className="w-full"
              variant="tag"
              icon={<CookieIcon />}
              onClick={() => {
                localStorage.removeItem("nvmd-first");
                toast.success(i18n("Tour-Tip"));
              }}
            >
              {i18n("Tour-Text")}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
