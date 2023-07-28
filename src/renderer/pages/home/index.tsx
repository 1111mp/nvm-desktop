import './styles.scss';

import { useState, useRef } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { Button, Layout, Menu, Space, Tour, Typography } from 'antd';
import {
  InfoCircleOutlined,
  SettingOutlined,
  SmileTwoTone,
  CloseOutlined,
  MinusOutlined,
} from '@ant-design/icons';
import { Tip } from './tip';
import { Setting } from './setting';

import type { TourProps } from 'antd';
import type { Ref as TipRef } from './tip';
import type { Ref as SettingRef } from './tip';

const { Content } = Layout;
const { Paragraph, Text } = Typography;

const Home: React.FC = () => {
  const [open, setOpen] = useState<boolean>(
    !localStorage.getItem('nvmd-first'),
  );
  const { pathname } = useLocation();

  const tip = useRef(null);

  const tipDrawer = useRef<TipRef>(null);
  const settingDrawer = useRef<SettingRef>(null);

  const platform = window.Context.platform;

  const steps: TourProps['steps'] = [
    {
      title: 'Welcome',
      description: (
        <>
          <Paragraph>
            <Text>
              Welcome to the nvm-desktop.{' '}
              <SmileTwoTone style={{ fontSize: 16 }} />
            </Text>
          </Paragraph>
          <Paragraph>
            <Text type="secondary">
              A desktop client for manage the version of Nodejs.
            </Text>
          </Paragraph>
        </>
      ),
      target: null,
    },
    {
      title: 'Tip',
      description: (
        <>
          {platform === 'win32' ? (
            <>
              <Paragraph>
                <Text>
                  Now you have an additional <Text type="secondary">NVMD</Text>{' '}
                  environment variable in your system Its default value is{' '}
                  <Text type="secondary">empty</Text>. And it has been added to
                  the environment variable <Text type="secondary">PATH</Text>.
                </Text>
              </Paragraph>
              <Paragraph>
                Set by : <Text type="secondary">setx -m NVMD empty</Text>
              </Paragraph>
              <Paragraph>Then you should have Node installed.</Paragraph>
              <Paragraph>
                After the node version is applied, the value of the environment
                variable <Text type="secondary">NVMD</Text> is set to the
                installation path of the node version.
              </Paragraph>
              <Paragraph>
                Set by : <Text type="secondary">setx -m NVMD nodePath</Text>
              </Paragraph>
            </>
          ) : (
            <>
              <Paragraph>
                <Text>First you should have Node installed.</Text>
              </Paragraph>
              <Paragraph>
                <Text>
                  Now add these lines to your ~/.bashrc, ~/.profile, or ~/.zshrc
                  file to have it automatically sourced upon login: (you may
                  have to add to more than one of the above files)
                </Text>
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
            <Text>You might need to restart your terminal instance.</Text>
          </Paragraph>
        </>
      ),
      placement: 'bottomRight',
      target: () => tip.current,
    },
    {
      title: 'Finally',
      description: (
        <>
          <Paragraph>
            <Text type="secondary">
              For more information about this issue and possible workarounds,
              please
            </Text>
            <Typography.Link
              href="https://github.com/1111mp/nvm-desktop/issues"
              target="_blank"
            >
              &nbsp; refer here.
            </Typography.Link>
          </Paragraph>
          <Paragraph>
            <Text>Have a nice day!</Text>
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
                { label: <Link to="/all">Versions</Link>, key: '/all' },
                // {
                //   label: <Link to="/installed">Installed</Link>,
                //   key: '/installed',
                // },
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
                title="tip"
                size="small"
                className="module-home-btn"
                icon={<InfoCircleOutlined />}
                onClick={() => {
                  tipDrawer.current?.show();
                }}
              />
              <Button
                type="text"
                size="small"
                title="setting"
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
      <Tip ref={tipDrawer} />
      <Setting ref={settingDrawer} />
    </>
  );
};

export default Home;
