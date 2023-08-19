import './styles.scss';

import { useMemo, useState, Children, cloneElement } from 'react';
import { useLoaderData } from 'react-router-dom';
import {
  App,
  Button,
  Drawer,
  Popconfirm,
  Select,
  Space,
  Table,
  Typography,
} from 'antd';
import { DndContext } from '@dnd-kit/core';
import { restrictToVerticalAxis } from '@dnd-kit/modifiers';
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  CloseCircleFilled,
  MenuOutlined,
  InfoCircleOutlined,
  ReloadOutlined,
  SisternodeOutlined,
} from '@ant-design/icons';

import { useAppContext, useI18n } from 'renderer/appContext';

import type { DragEndEvent } from '@dnd-kit/core';
import type { ColumnsType } from 'antd/es/table';

export async function loader() {
  const versions = await Promise.all([
    window.Context.getProjects(),
    window.Context.getInstalledNodeVersions(),
  ]);

  return versions;
}

const { Paragraph, Text, Title } = Typography;

export const Component: React.FC = () => {
  const [allProjects, allInstalledVersions] = useLoaderData() as [
    Nvmd.Project[],
    Array<string>,
  ];

  const [installedVersions, setInstalledVersions] = useState<string[]>(
    () => allInstalledVersions,
  );
  const [projects, setProjects] = useState<Nvmd.Project[]>(() => allProjects);
  const [open, setOpen] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);

  const i18n = useI18n();
  const { locale } = useAppContext();
  const { message } = App.useApp();

  const columns: ColumnsType<Nvmd.Project> = useMemo(
    () => [
      {
        width: 30,
        key: 'sort',
      },
      {
        title: i18n('Project-Name'),
        width: 240,
        dataIndex: 'name',
        ellipsis: true,
        render(text: string, { active }) {
          return (
            <Text strong delete={!active}>
              {text}
            </Text>
          );
        },
      },
      {
        title: i18n('Project-Path'),
        dataIndex: 'path',
        render: (path, { active }) => (
          <Text
            type="secondary"
            copyable
            delete={!active}
            ellipsis={{ tooltip: path }}
          >
            {path}
          </Text>
        ),
      },
      {
        title: i18n('Version'),
        width: 170,
        dataIndex: 'version',
        render(version: string, { path }) {
          return (
            <Select
              size="small"
              showSearch
              allowClear
              defaultValue={version ? version : undefined}
              placeholder="Select a version"
              optionFilterProp="children"
              status={
                !version || installedVersions.includes(version)
                  ? undefined
                  : 'error'
              }
              filterOption={(input, option) =>
                (option?.label ?? '')
                  .toLowerCase()
                  .includes(input.toLowerCase())
              }
              options={installedVersions.map((version) => ({
                label: `v${version}`,
                value: version,
              }))}
              style={{ minWidth: 140 }}
              onChange={async (newVersion) => {
                try {
                  const code = await window.Context.syncProjectVersion(
                    path,
                    newVersion,
                  );

                  const newProjects = projects.map((project) =>
                    project.path === path
                      ? {
                          ...project,
                          version: newVersion,
                          active: code === 200 ? true : false,
                          updateAt: new Date().toISOString(),
                        }
                      : project,
                  );

                  setProjects(newProjects);
                  window.Context.updateProjects(newProjects);
                  code === 200
                    ? message.success(i18n('Restart-Terminal'))
                    : message.error(`Project not found, please check it`, 3);
                } catch (err) {
                  message.error('Something went wrong');
                }
              }}
            />
          );
        },
      },
      {
        title: i18n('Operation'),
        width: 120,
        render(_text, { name, path }) {
          return (
            <Popconfirm
              title={name}
              placement="topRight"
              description={i18n('Project-Delete')}
              onConfirm={() => {
                const newProjects = projects.filter(
                  ({ path: source }) => source !== path,
                );

                setProjects(newProjects);
                window.Context.updateProjects(newProjects, path);
              }}
            >
              <Button
                ghost
                danger
                size="small"
                type="primary"
                icon={<CloseCircleFilled />}
              >
                {i18n('Remove')}
              </Button>
            </Popconfirm>
          );
        },
      },
    ],
    [locale, projects, installedVersions],
  );

  const onAddProject = async () => {
    const { canceled, filePaths, version } =
      await window.Context.openFolderSelecter();
    if (canceled) return;
    const [path] = filePaths;

    if (projects.find(({ path: source }) => source === path)) {
      return message.error('The project already exists');
    }

    const pathArr = path.split('/');
    const now = new Date().toISOString();
    const project: Nvmd.Project = {
      name: pathArr[pathArr.length - 1],
      path,
      version,
      active: true,
      createAt: now,
      updateAt: now,
    };
    const newProjects = [project, ...projects];
    setProjects(newProjects);
    window.Context.updateProjects(newProjects);
  };

  const onDragEnd = ({ active, over }: DragEndEvent) => {
    if (active.id !== over?.id) {
      setProjects((previous) => {
        const activeIndex = previous.findIndex((i) => i.path === active.id);
        const overIndex = previous.findIndex((i) => i.path === over?.id);
        const newProject = arrayMove(previous, activeIndex, overIndex);
        window.Context.updateProjects(newProject);
        return newProject;
      });
    }
  };

  const onRefresh = async () => {
    setLoading(true);
    try {
      const [allProjects, installedVersions] = await Promise.all([
        window.Context.getProjects(true),
        window.Context.getInstalledNodeVersions(),
      ]);

      setProjects(allProjects);
      setInstalledVersions(installedVersions);
      message.success('Refresh successed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="module-projects">
        <div className="module-projects-header">
          <Space>
            <Title level={4} style={{ margin: 0 }}>
              {i18n('All-Projects')}
            </Title>
            <Button
              type="text"
              size="small"
              title={i18n('Tip')}
              className="module-home-btn"
              icon={<InfoCircleOutlined />}
              onClick={() => {
                setOpen(true);
              }}
            />
          </Space>
          <Space>
            <Button
              size="small"
              type="primary"
              icon={<ReloadOutlined />}
              loading={loading}
              onClick={onRefresh}
            >
              {i18n('Refresh')}
            </Button>
            <Button
              size="small"
              type="primary"
              icon={<SisternodeOutlined />}
              onClick={onAddProject}
            >
              {i18n('Add-Project')}
            </Button>
          </Space>
        </div>
        <DndContext modifiers={[restrictToVerticalAxis]} onDragEnd={onDragEnd}>
          <SortableContext
            // rowKey array
            items={projects.map((i) => i.path)}
            strategy={verticalListSortingStrategy}
          >
            <Table
              size="small"
              rowKey="path"
              bordered={false}
              columns={columns}
              dataSource={projects}
              components={{
                body: {
                  row: Row,
                },
              }}
              pagination={false}
              scroll={{ x: '100%', y: 570 }}
            />
          </SortableContext>
        </DndContext>
      </div>
      <Drawer
        open={open}
        title={i18n('Tip')}
        closable={false}
        destroyOnClose
        onClose={() => {
          setOpen(false);
        }}
      >
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
      </Drawer>
    </>
  );
};

interface RowProps extends React.HTMLAttributes<HTMLTableRowElement> {
  'data-row-key': string;
}

const Row = ({ children, ...props }: RowProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: props['data-row-key'],
  });

  const style: React.CSSProperties = {
    ...props.style,
    transform: CSS.Transform.toString(transform && { ...transform, scaleY: 1 }),
    transition,
    ...(isDragging ? { position: 'relative', zIndex: 9999 } : {}),
  };

  return (
    <tr {...props} ref={setNodeRef} style={style} {...attributes}>
      {Children.map(children, (child) => {
        if ((child as React.ReactElement).key === 'sort') {
          return cloneElement(child as React.ReactElement, {
            children: (
              <MenuOutlined
                ref={setActivatorNodeRef}
                style={{ touchAction: 'none', cursor: 'move' }}
                {...listeners}
              />
            ),
          });
        }
        return child;
      })}
    </tr>
  );
};

Component.displayName = 'Projects';
