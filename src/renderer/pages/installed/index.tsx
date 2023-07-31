import './styles.scss';

import { useMemo, useRef, useState } from 'react';
import { useLoaderData } from 'react-router-dom';
import { Button, Typography, Table, Space, Tag, Dropdown, message } from 'antd';
import {
  ReloadOutlined,
  CheckCircleFilled,
  CloseCircleFilled,
  DownCircleFilled,
} from '@ant-design/icons';

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

  const [messageApi, contextHolder] = message.useMessage();
  const getColumnSearchProps = useColumnSearchProps();

  const columns: ColumnsType<Nvmd.Version> = useMemo(
    () => [
      {
        title: 'Version',
        dataIndex: 'version',
        ...getColumnSearchProps('version'),
        render: (text: string, { lts, version }, index: number) => {
          return (
            <Space>
              <span style={{ fontWeight: 500 }}>{text}</span>
              {lts ? (
                <span style={{ color: '#b9b9b9' }}>({lts})</span>
              ) : latestVersion.current === version ? (
                <span style={{ color: '#b9b9b9' }}>(latest)</span>
              ) : null}
            </Space>
          );
        },
        sorter: (a, b) => compareVersion(a.version, b.version),
      },
      {
        title: 'V8 Version',
        dataIndex: 'v8',
        className: 'module-versions-label__gray',
        ...getColumnSearchProps('v8'),
      },
      {
        title: 'NPM Version',
        dataIndex: 'npm',
        className: 'module-versions-label__gray',
        ...getColumnSearchProps('npm'),
      },
      {
        title: 'Release Date',
        dataIndex: 'date',
        className: 'module-versions-label__gray',
        render: (text: string) => dayjs(text).format('ll'),
      },
      {
        title: 'Status',
        render: (_text: string, record) => {
          if (current && record.version.includes(current))
            return (
              <Tag bordered={false} color="orange">
                Current
              </Tag>
            );

          if (
            installedVersions.find((version) =>
              record.version.includes(version),
            )
          )
            return (
              <Tag bordered={false} color="purple">
                Installed
              </Tag>
            );

          return (
            <Tag bordered={false} color="cyan">
              Not installed
            </Tag>
          );
        },
      },
      {
        title: 'Operation',
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
                          label: 'Uninstall',
                        },
                      ]
                    : [
                        {
                          key: 'apply',
                          icon: <CheckCircleFilled />,
                          label: 'Apply',
                        },
                        {
                          danger: true,
                          key: 'uninstall',
                          icon: <CloseCircleFilled />,
                          label: 'Uninstall',
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
                      messageApi.success(
                        'You might need to restart your terminal instance',
                      );
                      return;
                    }
                    case 'uninstall': {
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
                      messageApi.success('Successful');
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
                More
              </Button>
            </Dropdown>
          );
        },
      },
    ],
    [current, installedVersions],
  );

  const onRefresh = async () => {
    setLoading(true);
    try {
      const [versions, installeds] = await Promise.all([
        window.Context.getAllNodeVersions(),
        window.Context.getInstalledNodeVersions(),
      ]);
      messageApi.success('Refresh successed');
      setVersions(
        versions.filter(({ version }) => installeds.includes(version.slice(1))),
      );
      setInstalledVersions(installeds);
    } catch (err) {
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {contextHolder}
      <div className="module-installed">
        <div className="module-installed-header">
          <Typography.Title level={4} style={{ margin: 0 }}>
            Installed Versions
          </Typography.Title>
          <Button
            size="small"
            type="primary"
            icon={<ReloadOutlined />}
            loading={loading}
            onClick={onRefresh}
          >
            Refresh
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
        />
      </div>
    </>
  );
};

Component.displayName = 'Installed';
