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
            <>
              <Paragraph>
                {locale === 'zh-CN' ? (
                  <Text>
                    现在，您的系统中已经被添加了一个系统变量：
                    <Text type="secondary">NVMD</Text>，它的默认值是{' '}
                    <Text type="secondary">empty</Text>
                    ，并且它已经被添加到系统变量{' '}
                    <Text type="secondary">PATH</Text>中。
                  </Text>
                ) : (
                  <Text>
                    Now you have an additional{' '}
                    <Text type="secondary">NVMD</Text> environment variable in
                    your system Its default value is{' '}
                    <Text type="secondary">empty</Text>. And it has been added
                    to the environment variable{' '}
                    <Text type="secondary">PATH</Text>.
                  </Text>
                )}
              </Paragraph>
              <Paragraph>
                {i18n('Set-by')} :{' '}
                <Text type="secondary">setx -m NVMD empty</Text>
              </Paragraph>
              <Paragraph>{i18n('Had-Install')}</Paragraph>
              <Paragraph>
                {i18n('Node-Apply')} <Text type="secondary">NVMD</Text>{' '}
                {i18n('Had-set')}
              </Paragraph>
              <Paragraph>
                {i18n('Set-by')} :{' '}
                <Text type="secondary">setx -m NVMD nodePath</Text>
              </Paragraph>
            </>
          ) : (
            <>
              <Paragraph>
                <Text>{i18n('Tip-First')}</Text>
              </Paragraph>
              <Paragraph>
                <Text>{i18n('Tip-Content')}</Text>
              </Paragraph>
              <Paragraph>
                <Text copyable type="secondary">
                  {
                    'export NVMD_DIR="$HOME/.nvmd" \n[ -s "$NVMD_DIR/nvmd.sh" ] && . "$NVMD_DIR/nvmd.sh" # This loads nvmd'
                  }
                </Text>
              </Paragraph>
            </>
          )}
          <Paragraph>
            <Text>{i18n('Restart-Terminal')}</Text>
          </Paragraph>
        </>
      ),
      placement: 'bottomRight',
      target: () => tip.current,
    },
    ...(platform !== 'win32'
      ? [
          {
            title: i18n('Projects'),
            description: (
              <>
                <Paragraph>
                  <Text>{i18n('Can-Select')}</Text>
                </Paragraph>
                <Paragraph>
                  <Text>
                    {i18n('Had-File')} <Text type="secondary">.nvmdrc</Text>{' '}
                    {i18n('Load-Node')}
                  </Text>
                </Paragraph>
                <Paragraph>
                  <Text>{i18n('runtimeExecutable')}</Text>
                </Paragraph>
                <Paragraph>
                  <Text type="secondary">
                    {
                      '"runtimeExecutable": "${env:NVMD_DIR}/versions/18.17.0/bin/npm"'
                    }
                  </Text>
                </Paragraph>
                <Paragraph>
                  <Text>{i18n('Directly-Specify')}</Text>
                </Paragraph>
              </>
            ),
            target: () => projectsMenu.current,
          },
        ]
      : []),
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
              items={
                platform !== 'win32'
                  ? [
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
                    ]
                  : [
                      {
                        label: <Link to="/all">{i18n('Versions')}</Link>,
                        key: '/all',
                      },
                      {
                        label: <Link to="/installed">{i18n('Installed')}</Link>,
                        key: '/installed',
                      },
                    ]
              }
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
