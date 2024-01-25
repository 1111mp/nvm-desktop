import { forwardRef, useImperativeHandle, useState } from 'react';
import { Drawer, Steps, Typography } from 'antd';
import { useAppContext, useI18n } from '@renderer/appContext';

export type Ref = {
  show: () => void;
};

type Props = {};

const { Paragraph, Text, Link } = Typography;

const Tip = forwardRef<Ref, Props>(({}, ref) => {
  const [open, setOpen] = useState<boolean>(false);
  const [current, setCurrent] = useState<number>(0);

  const { locale } = useAppContext();
  const i18n = useI18n();

  const platform = window.Context.platform;

  useImperativeHandle(ref, () => ({
    show: onShow,
  }));

  const onShow = () => {
    setOpen(true);
  };

  const onChange = (value: number) => {
    setCurrent(value);
  };

  return (
    <Drawer
      open={open}
      width={436}
      title={i18n('Tip')}
      closable={false}
      destroyOnClose
      onClose={() => {
        setOpen(false);
      }}
    >
      <Steps
        current={current}
        onChange={onChange}
        direction="vertical"
        items={[
          {
            title: `${i18n('Install')} Node`,
            description:
              locale === 'zh-CN' ? (
                <>
                  {platform !== 'win32' ? (
                    <>
                      <Paragraph>
                        <Text>{i18n('Tip-Content')}</Text>
                      </Paragraph>
                      <Paragraph>
                        <Text
                          copyable
                          type="secondary"
                          style={{ wordBreak: 'break-all' }}
                        >
                          {
                            'export NVMD_DIR="$HOME/.nvmd" \nexport PATH="$NVMD_DIR/bin:$PATH"'
                          }
                        </Text>
                      </Paragraph>
                    </>
                  ) : null}
                  <Paragraph>
                    <Text>
                      找到你想要安装的Node的版本，然后点击安装按钮开始下载安装。
                    </Text>
                  </Paragraph>
                  <Paragraph>
                    <Text type="secondary">
                      默认下载镜像地址
                      <Link href="https://nodejs.org/dist/" target="_blank">
                        &nbsp; https://nodejs.org/dist/
                      </Link>
                      。
                    </Text>
                  </Paragraph>
                </>
              ) : (
                <>
                  {platform !== 'win32' ? (
                    <>
                      <Paragraph>
                        <Text>{i18n('Tip-Content')}</Text>
                      </Paragraph>
                      <Paragraph>
                        <Text
                          copyable
                          type="secondary"
                          style={{ wordBreak: 'break-all' }}
                        >
                          {
                            'export NVMD_DIR="$HOME/.nvmd" \nexport PATH="$NVMD_DIR/bin:$PATH"'
                          }
                        </Text>
                      </Paragraph>
                    </>
                  ) : null}
                  <Paragraph>
                    <Text>
                      Find the version you need and click the Install button to
                      install it.
                    </Text>
                  </Paragraph>
                  <Paragraph>
                    <Text type="secondary">
                      Download release files available on
                      <Link href="https://nodejs.org/dist/" target="_blank">
                        &nbsp; https://nodejs.org/dist/
                      </Link>
                      .
                    </Text>
                  </Paragraph>
                </>
              ),
          },
          {
            title: i18n('Setting'),
            description:
              locale === 'zh-CN' ? (
                <>
                  <Paragraph>
                    <Text>
                      下载安装完成之后，点击
                      <Text type="secondary"> 应用 </Text>
                      按钮将该版本设置为全局默认的Node版本。
                    </Text>
                  </Paragraph>
                  <Paragraph>
                    如果你需要为你的项目单独设置Node的版本，请前往
                    <Text type="secondary"> 项目 </Text>
                    页面添加设置。
                  </Paragraph>
                  <Paragraph>
                    <Text>默认识别Node版本的策略：</Text>
                    <Text type="secondary">
                      当前目录下是否指定Node版本（.nvmdrc文件），如果指定那么使用该版本，否则使用全局默认的Node版本。
                    </Text>
                  </Paragraph>
                </>
              ) : (
                <>
                  <Paragraph>
                    <Text>
                      After the download and installation is complete, click the
                      <Text type="secondary"> Apply </Text> button to set the
                      version as the global default Node version.
                    </Text>
                  </Paragraph>
                  <Paragraph>
                    If you need to set a separate version of Node for your
                    project, go to the <Text type="secondary"> Project </Text>
                    page to add settings.
                  </Paragraph>
                  <Paragraph>
                    <Text>Default Node version-aware policy: </Text>
                    <Text type="secondary">
                      Whether to specify the Node version (.nvmdrc file) in the
                      current directory, if so, the version is used, otherwise
                      the global default Node version is used.
                    </Text>
                  </Paragraph>
                </>
              ),
          },
          {
            title: i18n('Command-tools-intro'),
            description:
              locale === 'zh-CN' ? (
                <>
                  <Paragraph>
                    <Text type="secondary"> nvmd </Text>
                    <Text>允许您通过命令行快速管理多个 Nodejs 版本。</Text>
                  </Paragraph>
                  <Paragraph>
                    使用 list 或者 ls 查看所有已安装的版本：
                    <Text type="secondary"> nvmd list</Text> or
                    <Text type="secondary"> nvmd ls</Text>
                  </Paragraph>
                  <Paragraph>
                    为系统设置指定的版本：
                    <Text type="secondary"> nvmd use node_version</Text>
                  </Paragraph>
                  <Paragraph>
                    或者你也可以通过命令行为你的项目指定nodejs版本：
                    <Text type="secondary">
                      {' '}
                      nvmd use node_version --project
                    </Text>
                  </Paragraph>
                  <Paragraph>
                    在你的终端输入{' '}
                    <Text type="secondary" copyable>
                      nvmd --help
                    </Text>{' '}
                    以查看更多信息。
                  </Paragraph>
                  <Paragraph>
                    <Text type="secondary">
                      通过 nvmd use 命令行切换 Nodejs 版本后，请点击刷新按钮让
                      nvm-desktop 同步最新数据。
                    </Text>
                  </Paragraph>
                </>
              ) : (
                <>
                  <Paragraph>
                    The
                    <Text type="secondary"> nvmd </Text>
                    <Text>
                      allows you to quickly manage different versions of node
                      via the command line.
                    </Text>
                  </Paragraph>
                  <Paragraph>
                    List all installed versions using list or ls:
                    <Text type="secondary"> nvmd list</Text> or
                    <Text type="secondary"> nvmd ls</Text>
                  </Paragraph>
                  <Paragraph>
                    And then in any new shell just use the installed version:
                    <Text type="secondary"> nvmd use node_version</Text>
                  </Paragraph>
                  <Paragraph>
                    Or you can also specify the nodejs version for your project
                    through the command line:
                    <Text type="secondary">
                      {' '}
                      nvmd use node_version --project
                    </Text>
                  </Paragraph>
                  <Paragraph>
                    Please type{' '}
                    <Text type="secondary" copyable>
                      nvmd --help
                    </Text>{' '}
                    in your terminal to see more information.
                  </Paragraph>
                  <Paragraph>
                    <Text type="secondary">
                      After you switch the Node version through the nvmd use
                      command line, please click the refresh button to let
                      nvm-desktop synchronize the latest data.
                    </Text>
                  </Paragraph>
                </>
              ),
          },
          {
            title: i18n('Finally'),
            description:
              locale === 'zh-CN' ? (
                <>
                  <Paragraph>
                    <Text>
                      有时候或许你需要重启你的终端。 在终端输入 &nbsp;
                      <Text type="secondary">"node --version"</Text>{' '}
                      以检查是否生效。
                    </Text>
                  </Paragraph>
                  <Paragraph>
                    <Text type="secondary">
                      有关此问题的更多信息以及可能的解决办法，请查看
                    </Text>
                    <Link
                      href="https://github.com/1111mp/nvm-desktop/issues"
                      target="_blank"
                    >
                      &nbsp; 这里。
                    </Link>
                  </Paragraph>
                </>
              ) : (
                <>
                  <Paragraph>
                    <Text>
                      You might need to restart your terminal instance. Enter
                      &nbsp;<Text type="secondary">"node --version"</Text> in
                      the terminal to check if it works.
                    </Text>
                  </Paragraph>
                  <Paragraph>
                    <Text type="secondary">
                      For more information about this issue and possible
                      workarounds, please
                    </Text>
                    <Link
                      href="https://github.com/1111mp/nvm-desktop/issues"
                      target="_blank"
                    >
                      &nbsp; refer here.
                    </Link>
                  </Paragraph>
                </>
              ),
          },
        ]}
      />
    </Drawer>
  );
});

export default Tip;
