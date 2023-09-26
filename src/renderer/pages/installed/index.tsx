import './styles.scss';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useLoaderData } from 'react-router-dom';
import { App, Button, Typography, Table, Space, Tag, Dropdown } from 'antd';
import {
  ReloadOutlined,
  CheckCircleFilled,
  CloseCircleFilled,
  DownCircleFilled,
} from '@ant-design/icons';
import { useI18n, useAppContext } from 'renderer/appContext';

import dayjs from 'dayjs';
import { useColumnSearchProps } from 'renderer/hooks';
import { compareVersion } from 'renderer/util';

import type { ColumnsType } from 'antd/es/table';

type VersionsResult = [Nvmd.Versions, Array<string>, string];

export async function loader() {
  try {
    const versions = await Promise.all([
      window.Context.getAllNodeVersions(),
      window.Context.getInstalledNodeVersions(),
      window.Context.getCurrentVersion(),
    ]);

    return versions;
  } catch (err) {
    return [[], [], ''];
  }
}

export const Component: React.FC = () => {
  const [allVersions, allInstalledVersions, currentVersion] =
    useLoaderData() as VersionsResult;

  const { version: latest } = allVersions[0];

  const [current, setCurrent] = useState<string>(() => currentVersion);
  const [versions, setVersions] = useState<Nvmd.Versions>(() =>
    allVersions.filter(({ version }) =>
      allInstalledVersions.includes(version.slice(1)),
    ),
  );
  const [installedVersions, setInstalledVersions] = useState<string[]>(
    () => allInstalledVersions,
  );
  const [loading, setLoading] = useState<boolean>(false);

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

  const columns: ColumnsType<Nvmd.Version> = useMemo(
    () => [
      {
        title: i18n('Version'),
        dataIndex: 'version',
        ...getColumnSearchProps('version'),
        render: (text: string, { lts, version }, index: number) => {
          return (
            <Space>
              <span style={{ fontWeight: 500 }}>{text}</span>
              {lts ? (
                <span style={{ color: '#b9b9b9' }}>({lts})</span>
              ) : latestVersion.current === version ? (
                <span style={{ color: '#b9b9b9' }}>({i18n('latest')})</span>
              ) : null}
            </Space>
          );
        },
        sorter: (a, b) => compareVersion(a.version, b.version),
      },
      {
        title: `V8 ${i18n('Version')}`,
        dataIndex: 'v8',
        className: 'module-installed-label__gray',
        ...getColumnSearchProps('v8'),
      },
      {
        title: `NPM ${i18n('Version')}`,
        dataIndex: 'npm',
        className: 'module-installed-label__gray',
        ...getColumnSearchProps('npm'),
      },
      {
        title: i18n('Release-Date'),
        dataIndex: 'date',
        className: 'module-installed-label__gray',
        sorter: (a, b) =>
          new Date(a.date).getTime() - new Date(b.date).getTime(),
        sortDirections: ['descend', 'ascend'],
        render: (text: string) => dayjs(text).format('ll'),
      },
      {
        title: i18n('Status'),
        filters: [
          {
            text: i18n('Current'),
            value: 'Current',
          },
        ],
        onFilter: (value, { version }) => {
          switch (value) {
            case 'Current': {
              return version.includes(current);
            }
            default:
              return false;
          }
        },
        render: (_text: string, record) => {
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
                      try {
                        await window.Context.uninstallVersion(
                          record.version.slice(1),
                          record.version.includes(current),
                        );

                        const [currentVersion, installeds] = await Promise.all([
                          window.Context.getCurrentVersion(),
                          window.Context.getInstalledNodeVersions(true),
                        ]);
                        setCurrent(currentVersion);
                        setInstalledVersions(installeds);
                        setVersions(
                          allVersions.filter(({ version }) =>
                            installeds.includes(version.slice(1)),
                          ),
                        );
                        message.success('Succeed');
                      } catch (err) {
                        message.error(
                          err.message
                            ? err.message
                                .split(
                                  "Error: Error invoking remote method 'uninstall-node-version': ",
                                )
                                .slice(-1)
                            : 'Something went wrong',
                        );
                      }
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
        },
      },
    ],
    [locale, current, installedVersions],
  );

  const onRefresh = async () => {
    setLoading(true);
    try {
      const [versions, installeds, currentVersion] = await Promise.all([
        window.Context.getAllNodeVersions(),
        window.Context.getInstalledNodeVersions(),
        window.Context.getCurrentVersion(true),
      ]);
      setVersions(
        versions.filter(({ version }) => installeds.includes(version.slice(1))),
      );
      setInstalledVersions(installeds);
      setCurrent(currentVersion);
      message.success('Refresh successed');
    } catch (err) {
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="module-installed">
      <div className="module-installed-header">
        <Typography.Title level={4} style={{ margin: 0 }}>
          {i18n('Installed-Versions')}
        </Typography.Title>
        <Button
          size="small"
          type="primary"
          icon={<ReloadOutlined />}
          loading={loading}
          onClick={onRefresh}
        >
          {i18n('Refresh')}
        </Button>
      </div>
      <Table
        bordered={false}
        size="small"
        rowKey="version"
        loading={loading}
        columns={columns}
        dataSource={versions}
        pagination={false}
        scroll={{ x: '100%', y: 570 }}
      />
    </div>
  );
};

Component.displayName = 'Installed';
