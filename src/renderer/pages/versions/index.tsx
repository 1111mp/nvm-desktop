import './styles.scss';

import { useMemo, useRef, useState } from 'react';
import { useLoaderData } from 'react-router-dom';
import { Button, Dropdown, Input, Space, Typography, Tag, message } from 'antd';
import {
  SyncOutlined,
  SearchOutlined,
  ReloadOutlined,
  CheckCircleFilled,
  CloseCircleFilled,
  PlusCircleFilled,
  DownCircleFilled,
} from '@ant-design/icons';
import { VirtualTable } from 'renderer/components/VirtualTable';
import Highlighter from 'react-highlight-words';
import { InfoModal } from './modal';

import dayjs from 'dayjs';
import { checkSupportive, compareVersion } from './util';

import type { InputRef } from 'antd';
import type { ColumnType, ColumnsType } from 'antd/es/table';
import type { FilterConfirmProps } from 'antd/es/table/interface';
import type { Ref as InfoRef } from './modal';

type DataIndex = keyof Nvmd.Version;

type VersionsResult = [Nvmd.Versions, Array<string>, string];

const localizedFormat = require('dayjs/plugin/localizedFormat');
dayjs.extend(localizedFormat);

const { Title } = Typography;

export async function loader(): Promise<VersionsResult> {
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

export const Versions: React.FC = () => {
  const [allVersions, allInstalledVersions, currentVersion] =
    useLoaderData() as VersionsResult;

  const [current, setCurrent] = useState<string>(() => currentVersion);
  const [versions, setVersions] = useState<Nvmd.Versions>(() => allVersions);
  const [installedVersions, setInstalledVersions] = useState<string[]>(
    () => allInstalledVersions,
  );
  const [searchText, setSearchText] = useState('');
  const [searchedColumn, setSearchedColumn] = useState('');
  const [loading, setLoading] = useState<boolean>(false);
  const [localLoading, seLocaltLoading] = useState<boolean>(false);

  const searchInput = useRef<InputRef>(null);
  const modal = useRef<InfoRef>(null);

  const [messageApi, contextHolder] = message.useMessage();

  const handleSearch = (
    selectedKeys: string[],
    confirm: (param?: FilterConfirmProps) => void,
    dataIndex: DataIndex,
  ) => {
    confirm();
    setSearchText(selectedKeys[0]);
    setSearchedColumn(dataIndex);
  };

  const handleReset = (clearFilters: () => void) => {
    clearFilters();
    setSearchText('');
  };

  const getColumnSearchProps = (
    dataIndex: DataIndex,
  ): ColumnType<Nvmd.Version> => ({
    filterDropdown: ({
      setSelectedKeys,
      selectedKeys,
      confirm,
      clearFilters,
    }) => (
      <div style={{ padding: 8 }} onKeyDown={(e) => e.stopPropagation()}>
        <Input
          ref={searchInput}
          placeholder={`Search ${dataIndex}`}
          value={selectedKeys[0]}
          onChange={(e) =>
            setSelectedKeys(e.target.value ? [e.target.value] : [])
          }
          onPressEnter={() =>
            handleSearch(selectedKeys as string[], confirm, dataIndex)
          }
          style={{ marginBottom: 8, display: 'block' }}
        />
        <Space>
          <Button
            type="primary"
            onClick={() =>
              handleSearch(selectedKeys as string[], confirm, dataIndex)
            }
            icon={<SearchOutlined />}
            size="small"
            style={{ width: 90 }}
          >
            Search
          </Button>
          <Button
            onClick={() => clearFilters && handleReset(clearFilters)}
            size="small"
            style={{ width: 90 }}
          >
            Reset
          </Button>
        </Space>
      </div>
    ),
    filterIcon: (filtered: boolean) => (
      <SearchOutlined style={{ color: filtered ? '#1677ff' : undefined }} />
    ),
    onFilter: (value, record) => {
      if (!record[dataIndex]) return false;

      if (dataIndex === 'version') {
        return (
          record[dataIndex]
            .toString()
            .toLowerCase()
            .includes((value as string).toLowerCase()) ||
          (record['lts']
            ? record['lts']
                .toString()
                .toLowerCase()
                .includes((value as string).toLowerCase())
            : false)
        );
      }

      return record[dataIndex]
        .toString()
        .toLowerCase()
        .includes((value as string).toLowerCase());
    },
    onFilterDropdownOpenChange: (visible) => {
      if (visible) {
        setTimeout(() => searchInput.current?.select(), 100);
      }
    },
    render: (text) =>
      searchedColumn === dataIndex ? (
        <Highlighter
          highlightStyle={{ backgroundColor: '#ffc069', padding: 0 }}
          searchWords={[searchText]}
          autoEscape
          textToHighlight={text ? text.toString() : ''}
        />
      ) : (
        text
      ),
  });

  const columns: ColumnsType<Nvmd.Version> = useMemo(
    () => [
      {
        title: 'Version',
        dataIndex: 'version',
        ...getColumnSearchProps('version'),
        render: (text: string, { lts }, index: number) => {
          return (
            <Space>
              <span style={{ fontWeight: 500 }}>{text}</span>
              {lts ? (
                <span style={{ color: '#b9b9b9' }}>({lts})</span>
              ) : index === 0 ? (
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
        filters: [
          {
            text: 'Installed',
            value: 'Installed',
          },
          {
            text: 'Supported',
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
                Not supported
              </Tag>
            );

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

                        const [currentVersion, versions] = await Promise.all([
                          window.Context.getCurrentVersion(),
                          window.Context.getInstalledNodeVersions(true),
                        ]);
                        setCurrent(currentVersion);
                        setInstalledVersions(versions);
                        messageApi.success('Successfully');
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

          return (
            <Button
              ghost
              size="small"
              type="primary"
              icon={<PlusCircleFilled />}
              onClick={() => modal.current?.show(record)}
            >
              Install
            </Button>
          );
        },
      },
    ],
    [current, installedVersions, setInstalledVersions],
  );

  const onLocalRefresh = async () => {
    seLocaltLoading(true);
    try {
      const [versions, installeds] = await Promise.all([
        window.Context.getAllNodeVersions(),
        window.Context.getInstalledNodeVersions(),
      ]);
      messageApi.success('Refresh successed');
      setVersions(versions);
      setInstalledVersions(installeds);
    } catch (err) {
    } finally {
      seLocaltLoading(false);
    }
  };

  const onRemoteRefresh = async () => {
    setLoading(true);
    try {
      const [versions, installeds] = await Promise.all([
        window.Context.getAllNodeVersions({
          fetch: true,
        }),
        window.Context.getInstalledNodeVersions(true),
      ]);
      messageApi.success('Refresh successed');
      setVersions(versions);
      setInstalledVersions(installeds);
    } catch (err) {
      messageApi.error(
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
      {contextHolder}
      <div className="module-versions">
        <div className="module-versions-header">
          <Title level={4} style={{ margin: 0 }}>
            All Node Versions
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
              Local Refresh
            </Button>
            <Button
              size="small"
              type="primary"
              icon={<SyncOutlined />}
              loading={loading}
              onClick={onRemoteRefresh}
            >
              Remote Refresh
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
