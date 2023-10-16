import './styles.scss';

import { useState, useRef, lazy, Suspense } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { Button, Layout, Menu, Space, Tour, Typography } from 'antd';
import {
  InfoCircleOutlined,
  SettingOutlined,
  SmileTwoTone,
  CloseOutlined,
  MinusOutlined,
} from '@ant-design/icons';
import { Updater } from './updater';
import { useI18n, useAppContext } from 'renderer/appContext';

import type { TourProps } from 'antd';
import type { Ref as TipRef } from './tip';
import type { Ref as SettingRef } from './tip';

const Tip = lazy(() => import('./tip'));
const Setting = lazy(() => import('./setting'));
const { Content } = Layout;
const { Paragraph, Text } = Typography;

const Home: React.FC = () => {
  const [open, setOpen] = useState<boolean>(
    !localStorage.getItem('nvmd-first'),
  );
  const { pathname } = useLocation();

  const tip = useRef(null);
  const projectsMenu = useRef(null);
  const { locale } = useAppContext();
  const i18n = useI18n();

  const tipDrawer = useRef<TipRef>(null);
  const settingDrawer = useRef<SettingRef>(null);

  const platform = window.Context.platform;

  const steps: TourProps['steps'] = [
    {
      title: i18n('Welcome'),
      description: (
        <>
          <Paragraph>
            <Text>
              {i18n('Welcome-to')} nvm-desktop.{' '}
              <SmileTwoTone style={{ fontSize: 16 }} />
            </Text>
          </Paragraph>
          <Paragraph>
            <Text type="secondary">{i18n('App-Desc')}</Text>
          </Paragraph>
        </>
      ),
      target: null,
    },
    {
      title: i18n('Tip'),
      description: (
        <>
          {platform === 'win32' ? (
            locale === 'zh-CN' ? (
              <>
                <Paragraph>
                  <Text>
                    现在，您系统的环境变量<Text type="secondary"> PATH </Text>
                    中添加了如下路径：
                    <Text type="secondary"> %HOMEDIR%\.nvmd\bin </Text>，
                    {i18n('Set-by')} :
                    <Text type="secondary"> setx -m NVMD path </Text>。
                  </Text>
                </Paragraph>
                <Paragraph>
                  <Text>
                    此目录下保存着用于管理 Node 版本的可执行文件，由 Rust
                    编写，如果有需要请查看项目源码：
                    <Typography.Link
                      href="https://github.com/1111mp/nvmd-command"
                      target="_blank"
                    >
                      nvmd-command
                    </Typography.Link>
                    。
                  </Text>
                </Paragraph>
                <Paragraph>
                  <Text>
                    然后你可以开始下载安装 Node 了。下载安装完成之后点击
                    <Text type="secondary"> 应用 </Text>
                    按钮将其设置为全局默认版本。
                  </Text>
                </Paragraph>
                <Paragraph>
                  <Text>
                    你也可以通过命令行工具直接管理所有的 Nodejs 版本：
                  </Text>
                  <Typography.Link
                    href="https://github.com/1111mp/nvmd-command#command-tools-intro"
                    target="_blank"
                  >
                    nvmd
                  </Typography.Link>
                  . 在你的终端输入{' '}
                  <Text type="secondary" copyable>
                    nvmd --help
                  </Text>{' '}
                  以查看更多信息。
                </Paragraph>
                <Paragraph>
                  <Text>
                    切换 Node 版本之后，默认不需要重新打开你的终端就能够生效。
                  </Text>
                </Paragraph>
              </>
            ) : (
              <>
                <Paragraph>
                  <Text>
                    The following path is now added to your system's
                    <Text type="secondary"> PATH </Text>environment variable:
                    <Text type="secondary"> %HOMEDIR%\.nvmd\bin </Text>,{' '}
                    {i18n('Set-by')} :
                    <Text type="secondary"> setx -m NVMD path </Text>.
                  </Text>
                </Paragraph>
                <Paragraph>
                  <Text>
                    This directory holds the executable for managing the Node
                    version, written in Rust. Check the project source code if
                    you needed:{' '}
                    <Typography.Link
                      href="https://github.com/1111mp/nvmd-command"
                      target="_blank"
                    >
                      nvmd-command
                    </Typography.Link>
                    .
                  </Text>
                </Paragraph>
                <Paragraph>
                  <Text>
                    You should then be able to start downloading and installing
                    Node. After the download and installation is complete, click
                    the <Text type="secondary"> Apply </Text> button to set it
                    as the global default version.
                  </Text>
                </Paragraph>
                <Paragraph>
                  <Text>
                    You can also manage all versions of node directly from the
                    command line:{' '}
                  </Text>
                  <Typography.Link
                    href="https://github.com/1111mp/nvmd-command#command-tools-intro"
                    target="_blank"
                  >
                    nvmd
                  </Typography.Link>
                  . Please type{' '}
                  <Text type="secondary" copyable>
                    nvmd --help
                  </Text>{' '}
                  in your terminal to see more information.
                </Paragraph>
                <Paragraph>
                  <Text>
                    After switching the Node version, you don't need to reopen
                    your terminal to take effect by default.
                  </Text>
                </Paragraph>
              </>
            )
          ) : (
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
              {locale === 'zh-CN' ? (
                <>
                  <Paragraph>
                    <Text>
                      然后你可以开始下载安装 Node 了。下载安装完成之后点击
                      <Text type="secondary"> 应用 </Text>
                      按钮将其设置为全局默认版本。
                    </Text>
                  </Paragraph>
                  <Paragraph>
                    <Text>
                      你也可以通过命令行工具直接管理所有的 Nodejs 版本：
                    </Text>
                    <Typography.Link
                      href="https://github.com/1111mp/nvmd-command#command-tools-intro"
                      target="_blank"
                    >
                      nvmd
                    </Typography.Link>
                    . 在你的终端输入{' '}
                    <Text type="secondary" copyable>
                      nvmd --help
                    </Text>{' '}
                    以查看更多信息。
                  </Paragraph>
                  <Paragraph>
                    <Text>
                      切换 Node 版本之后，默认不需要重新打开你的终端就能够生效。
                    </Text>
                  </Paragraph>
                </>
              ) : (
                <>
                  <Paragraph>
                    <Text>
                      You should then be able to start downloading and
                      installing Node. After the download and installation is
                      complete, click the <Text type="secondary"> Apply </Text>{' '}
                      button to set it as the global default version.
                    </Text>
                  </Paragraph>
                  <Paragraph>
                    <Text>
                      You can also manage all versions of node directly from the
                      command line:{' '}
                    </Text>
                    <Typography.Link
                      href="https://github.com/1111mp/nvmd-command#command-tools-intro"
                      target="_blank"
                    >
                      nvmd
                    </Typography.Link>
                    . Please type{' '}
                    <Text type="secondary" copyable>
                      nvmd --help
                    </Text>{' '}
                    in your terminal to see more information.
                  </Paragraph>
                  <Paragraph>
                    <Text>
                      After switching the Node version, you don't need to reopen
                      your terminal to take effect by default.
                    </Text>
                  </Paragraph>
                </>
              )}
            </>
          )}
        </>
      ),
      placement: 'bottomRight',
      target: () => tip.current,
    },
    {
      title: i18n('Projects'),
      description: (
        <>
          <Paragraph>
            <Text>{i18n('Can-Select')}</Text>
          </Paragraph>
          <Paragraph>
            <Text>{i18n('Command-Tip-Project')}</Text>
            <Text type="secondary" copyable>
              {' '}
              nvmd use node_version --project
            </Text>
          </Paragraph>
          <Paragraph>
            <Text>
              {i18n('Had-File')} <Text type="secondary">.nvmdrc</Text>{' '}
              {i18n('Load-Node')}
            </Text>
          </Paragraph>
        </>
      ),
      target: () => projectsMenu.current,
    },
    {
      title: i18n('Finally'),
      description: (
        <>
          <Paragraph>
            <Text type="secondary">{i18n('Tip-Finally')}</Text>
            <Typography.Link
              href="https://github.com/1111mp/nvm-desktop/issues"
              target="_blank"
            >
              &nbsp; {i18n('Refer')}
            </Typography.Link>
          </Paragraph>
          <Paragraph>
            <Text>{i18n('Bles')}</Text>
          </Paragraph>
        </>
      ),
      target: () => null,
    },
  ];

  return (
    <>
      <Layout className="module-home">
        <Content>
          <div className="module-home-header">
            <Menu
              mode="horizontal"
              className="module-home-menu"
              selectedKeys={[pathname]}
              items={[
                {
                  label: <Link to="/all">{i18n('Versions')}</Link>,
                  key: '/all',
                },
                {
                  label: <Link to="/installed">{i18n('Installed')}</Link>,
                  key: '/installed',
                },
                {
                  label: (
                    <Link ref={projectsMenu} to="/projects">
                      {i18n('Projects')}
                    </Link>
                  ),
                  key: '/projects',
                },
              ]}
            />
            {platform === 'win32' ? (
              <Space className="module-home-header-bar">
                <Button
                  size="small"
                  type="text"
                  icon={<CloseOutlined />}
                  onClick={() => {
                    window.Context.windowClose();
                  }}
                />
                <Button
                  size="small"
                  type="text"
                  icon={<MinusOutlined />}
                  onClick={() => {
                    window.Context.windowMinimize();
                  }}
                />
              </Space>
            ) : null}
            <Space size={4} className="module-home-extra">
              <Button
                ref={tip}
                type="text"
                size="small"
                title={i18n('Tip')}
                className="module-home-btn"
                icon={<InfoCircleOutlined />}
                onClick={() => {
                  tipDrawer.current?.show();
                }}
              />
              {platform === 'win32' ? <Updater /> : null}
              <Button
                type="text"
                size="small"
                title={i18n('Setting')}
                className="module-home-btn"
                icon={<SettingOutlined />}
                onClick={() => {
                  settingDrawer.current?.show();
                }}
              />
            </Space>
          </div>
          <div className="module-home-container">
            <Outlet />
          </div>
        </Content>
      </Layout>
      <Tour
        open={open}
        onClose={() => {
          localStorage.setItem('nvmd-first', 'no');
          setOpen(false);
        }}
        steps={steps}
      />
      <Suspense>
        <Tip ref={tipDrawer} />
        <Setting ref={settingDrawer} />
      </Suspense>
    </>
  );
};

export default Home;
