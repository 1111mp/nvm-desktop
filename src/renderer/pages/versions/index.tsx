import './styles.scss';

import { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { Await, defer, useAsyncValue, useLoaderData } from 'react-router-dom';
import {
  App,
  Button,
  Dropdown,
  Space,
  Typography,
  Tag,
  Tooltip,
  Skeleton,
} from 'antd';
import {
  SyncOutlined,
  ReloadOutlined,
  CheckCircleFilled,
  CloseCircleFilled,
  PlusCircleFilled,
  DownCircleFilled,
} from '@ant-design/icons';
import { VirtualTable } from 'renderer/components/VirtualTable';
import { InfoModal } from './modal';
import { useI18n, useAppContext } from 'renderer/appContext';

import dayjs from 'dayjs';
import { useColumnSearchProps } from 'renderer/hooks';
import { checkSupportive, compareVersion } from 'renderer/util';

import type { ColumnsType } from 'antd/es/table';
import type { Ref as InfoRef } from './modal';
import { resolve } from 'node:path';

type VersionsResult = [Nvmd.Versions, Array<string>, string];

const localizedFormat = require('dayjs/plugin/localizedFormat');
dayjs.extend(localizedFormat);

const { Title } = Typography;

export async function loader() {
  const versions = Promise.all([
    window.Context.getAllNodeVersions(),
    window.Context.getInstalledNodeVersions(),
    window.Context.getCurrentVersion(),
  ]);

  return defer({ versions: versions });
}

export function VersionsRoute() {
  const data = useLoaderData() as { versions: VersionsResult };

  return (
    <Suspense
      fallback={
        <div className="module-versions-content">
          <Space style={{ width: '100%', justifyContent: 'space-between' }}>
            <Skeleton.Input active size="small" />
            <Space>
              <Skeleton.Input active size="small" />
              <Skeleton.Input active size="small" />
            </Space>
          </Space>
          <Skeleton active paragraph={{ rows: 4 }} />
        </div>
      }
    >
      <Await resolve={data.versions}>
        <Versions />
      </Await>
    </Suspense>
  );
}

const Versions: React.FC = () => {
  const versionsData = useAsyncValue() as VersionsResult;

  const [allVersions, allInstalledVersions, currentVersion] = versionsData;

  const { version: latest } = allVersions[0] || { version: '' };

  const [current, setCurrent] = useState<string>(() => currentVersion);
  const [versions, setVersions] = useState<Nvmd.Versions>(() => allVersions);
  const [installedVersions, setInstalledVersions] = useState<string[]>(
    () => allInstalledVersions,
  );
  const [loading, setLoading] = useState<boolean>(false);
  const [localLoading, seLocaltLoading] = useState<boolean>(false);

  const modal = useRef<InfoRef>(null);
  const latestVersion = useRef<string>(latest);

  const { message } = App.useApp();

  const getColumnSearchProps = useColumnSearchProps();

  const { locale } = useAppContext();
  const i18n = useI18n();

  useEffect(() => {
    window.Context.onRegistCurVersionChange((version) => {
      setCurrent(version);
      message.success('Succeed');
    });
  }, []);

  useEffect(() => {
    if (!versions.length) return;

    const { version: latest } = allVersions[0];
    latestVersion.current = latest;
  }, [versions.length]);

  const columns: ColumnsType<Nvmd.Version> = useMemo(
    () => [
      {
        title: i18n('Version'),
        dataIndex: 'version',
        ...getColumnSearchProps('version'),
        render: (text: string, { lts, version }) => {
          return (
            <Space>
              <Tooltip color="#74a975" title={i18n('Whats-new')}>
                <span
                  className="module-versions-label__link"
                  onClick={() => {
                    window.open(
                      `https://github.com/nodejs/node/releases/tag/${text}`,
                      '_blank',
                    );
                  }}
                >
                  {text}
                </span>
              </Tooltip>
              {lts ? (
                <span style={{ color: '#b9b9b9' }}>({lts})</span>
              ) : latestVersion.current === version ? (
                <span style={{ color: '#b9b9b9' }}>({i18n('latest')})</span>
              ) : null}
            </Space>
          );
        },
        sorter: (a, b) => compareVersion(a.version, b.version),
        sortDirections: ['descend', 'ascend'],
      },
      {
        title: `V8 ${i18n('Version')}`,
        dataIndex: 'v8',
        className: 'module-versions-label__gray',
        ...getColumnSearchProps('v8'),
      },
      {
        title: `NPM ${i18n('Version')}`,
        dataIndex: 'npm',
        className: 'module-versions-label__gray',
        ...getColumnSearchProps('npm'),
      },
      {
        title: i18n('Release-Date'),
        dataIndex: 'date',
        className: 'module-versions-label__gray',
        sorter: (a, b) =>
          new Date(a.date).getTime() - new Date(b.date).getTime(),
        sortDirections: ['descend', 'ascend'],
        render: (text: string) => dayjs(text).format('ll'),
      },
      {
        title: i18n('Status'),
        filters: [
          {
            text: i18n('Installed'),
            value: 'Installed',
          },
          {
            text: i18n('Supported'),
            value: 'Supported',
          },
        ],
        onFilter: (value, { version, files }) => {
          switch (value) {
            case 'Installed': {
              return !!installedVersions.find((installed) =>
                version.includes(installed),
              );
            }
            case 'Supported': {
              return checkSupportive(files);
            }
            default:
              return false;
          }
        },
        render: (_text: string, record) => {
          const support = checkSupportive(record.files);

          if (!support)
            return (
              <Tag bordered={false} color="error">
                {i18n('Not-Supported')}
              </Tag>
            );

          if (current && record.version.includes(current))
            return (
              <Tag bordered={false} color="orange">
                {i18n('Current')}
              </Tag>
            );

          if (
            installedVersions.find((version) =>
              record.version.includes(version),
            )
          )
            return (
              <Tag bordered={false} color="purple">
                {i18n('Installed')}
              </Tag>
            );

          return (
            <Tag bordered={false} color="cyan">
              {i18n('Not-Installed')}
            </Tag>
          );
        },
      },
      {
        title: i18n('Operation'),
        width: 120,
        render: (_text, record) => {
          const support = checkSupportive(record.files);
          if (!support) return;

          if (
            installedVersions.find((version) =>
              record.version.includes(version),
            )
          )
            return (
              <Dropdown
                trigger={['click']}
                menu={{
                  items:
                    current && record.version.includes(current)
                      ? [
                          {
                            danger: true,
                            key: 'uninstall',
                            icon: <CloseCircleFilled />,
                            label: i18n('Uninstall'),
                          },
                        ]
                      : [
                          {
                            key: 'apply',
                            icon: <CheckCircleFilled />,
                            label: i18n('Apply'),
                          },
                          {
                            danger: true,
                            key: 'uninstall',
                            icon: <CloseCircleFilled />,
                            label: i18n('Uninstall'),
                          },
                        ],
                  onClick: async ({ key }) => {
                    switch (key) {
                      case 'apply': {
                        await window.Context.useNodeVersion(
                          record.version.slice(1),
                        );
                        const currentVersion =
                          await window.Context.getCurrentVersion();
                        setCurrent(currentVersion);
                        message.success(i18n('Restart-Terminal'));
                        return;
                      }
                      case 'uninstall': {
                        await window.Context.uninstallVersion(
                          record.version.slice(1),
                          record.version.includes(current),
                        );

                        const [currentVersion, versions] = await Promise.all([
                          window.Context.getCurrentVersion(),
                          window.Context.getInstalledNodeVersions(true),
                        ]);
                        setCurrent(currentVersion);
                        setInstalledVersions(versions);
                        message.success('Succeed');
                        return;
                      }
                      default:
                        return;
                    }
                  },
                }}
              >
                <Button
                  size="small"
                  icon={<DownCircleFilled />}
                  style={{ color: '#5273e0', borderColor: '#5273e0' }}
                >
                  {i18n('More')}
                </Button>
              </Dropdown>
            );

          return (
            <Button
              ghost
              size="small"
              type="primary"
              icon={<PlusCircleFilled />}
              onClick={() => modal.current?.show(record)}
            >
              {i18n('Install')}
            </Button>
          );
        },
      },
    ],
    [locale, current, installedVersions, versions.length, setInstalledVersions],
  );

  const onLocalRefresh = async () => {
    seLocaltLoading(true);
    try {
      const [versions, installeds, currentVersion] = await Promise.all([
        window.Context.getAllNodeVersions(),
        window.Context.getInstalledNodeVersions(),
        window.Context.getCurrentVersion(true),
      ]);
      setVersions(versions);
      setInstalledVersions(installeds);
      setCurrent(currentVersion);
      message.success('Refresh successed');
    } catch (err) {
    } finally {
      seLocaltLoading(false);
    }
  };

  const onRemoteRefresh = async () => {
    setLoading(true);
    try {
      const [versions, installeds, currentVersion] = await Promise.all([
        window.Context.getAllNodeVersions({
          fetch: true,
        }),
        window.Context.getInstalledNodeVersions(true),
        window.Context.getCurrentVersion(true),
      ]);
      setVersions(versions);
      setInstalledVersions(installeds);
      setCurrent(currentVersion);
      message.success('Refresh successed');
    } catch (err) {
      message.error(
        err.message
          ? err.message
              .split("Error invoking remote method 'all-node-versions': ")
              .slice(-1)
          : 'Something went wrong',
        3,
      );
    } finally {
      setLoading(false);
    }
  };

  const onInstalledRefresh = async () => {
    const versions = await window.Context.getInstalledNodeVersions(true);
    setInstalledVersions(versions);
  };

  return (
    <>
      <div className="module-versions">
        <div className="module-versions-header">
          <Title level={4} style={{ margin: 0 }}>
            {i18n('All-Node-Versions')}
          </Title>
          <Space>
            <Button
              size="small"
              type="primary"
              icon={<ReloadOutlined />}
              loading={localLoading}
              disabled={loading}
              onClick={onLocalRefresh}
            >
              {i18n('Local-Refresh')}
            </Button>
            <Button
              size="small"
              type="primary"
              icon={<SyncOutlined />}
              loading={loading}
              onClick={onRemoteRefresh}
            >
              {i18n('Remote-Refresh')}
            </Button>
          </Space>
        </div>
        <VirtualTable
          size="small"
          bordered={false}
          loading={loading || localLoading}
          columns={columns}
          dataSource={versions}
          rowKey="version"
          pagination={false}
          scroll={{ x: '100%', y: 570 }}
        />
      </div>
      <InfoModal ref={modal} onRefrresh={onInstalledRefresh} />
    </>
  );
};
