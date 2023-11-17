import { forwardRef, useImperativeHandle, useState, useRef } from 'react';
import {
  Drawer,
  Descriptions,
  Input,
  Radio,
  Select,
  Button,
  Space,
  Typography,
  Tooltip,
} from 'antd';
import { EditOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import { useAppContext, useI18n } from 'renderer/appContext';
import { Themes } from 'types';

export type Ref = {
  show: () => void;
};

type Props = {};

const Setting = forwardRef<Ref, Props>(({}, ref) => {
  const [open, setOpen] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);

  const content = useRef<ContentRef>(null);

  const i18n = useI18n();

  useImperativeHandle(ref, () => ({
    show: onShow,
  }));

  const onShow = () => {
    setOpen(true);
  };

  const onClose = () => {
    setOpen(false);
  };

  const onSubmit = async () => {
    setLoading(true);
    try {
      await content.current?.submit();
    } finally {
      setLoading(false);
      setOpen(false);
    }
  };

  return (
    <Drawer
      open={open}
      width={394}
      title={i18n('Setting')}
      closable={false}
      destroyOnClose
      footer={
        <Space>
          <Button onClick={onClose}>{i18n('Cancel')}</Button>
          <Button
            type="primary"
            data-testid="setting-submit"
            loading={loading}
            onClick={onSubmit}
          >
            {i18n('OK')}
          </Button>
        </Space>
      }
      styles={{ footer: { textAlign: 'right' } }}
      onClose={onClose}
    >
      <Content ref={content} />
    </Drawer>
  );
});

type ContentRef = {
  submit: () => Promise<void>;
};

const Content = forwardRef<ContentRef, {}>(({}, ref) => {
  const {
    locale,
    theme: ctxTheme,
    direction: ctxDirection,
    mirror: ctxMirror,
    onUpdateSetting,
  } = useAppContext();
  const i18n = useI18n();

  const [language, setLanguage] = useState<string>(() => locale);
  const [theme, setTheme] = useState<Themes>(() => ctxTheme);
  const [directory, setDirectory] = useState<string>(() => ctxDirection);
  const [mirror, setMirror] = useState<string>(() => ctxMirror);

  useImperativeHandle(ref, () => ({
    submit: onSubmit,
  }));

  const onSelectDirectory = async () => {
    const { canceled, filePaths } = await window.Context.openFolderSelecter({
      title: i18n('Directory-Select'),
    });

    if (canceled) return;

    const [path] = filePaths;
    setDirectory(path);
  };

  const onSubmit = async () => {
    if (
      language === locale &&
      theme === ctxTheme &&
      directory === ctxDirection &&
      mirror === ctxMirror
    )
      return;

    onUpdateSetting({
      locale: language,
      theme,
      directory,
      mirror,
    });

    return;
  };

  return (
    <Descriptions layout="vertical" column={1}>
      <Descriptions.Item label={i18n('Language')}>
        <Select
          size="small"
          value={language}
          options={[
            { label: '简体中文', value: 'zh-CN' },
            { label: 'English', value: 'en' },
          ]}
          style={{ width: 160 }}
          onChange={(val) => {
            setLanguage(val);
          }}
        />
      </Descriptions.Item>
      <Descriptions.Item label={i18n('Themes')}>
        <Radio.Group
          value={theme}
          options={[
            { label: i18n('System-Default'), value: Themes.System },
            { label: i18n('Light'), value: Themes.Light },
            { label: i18n('Dark'), value: Themes.Dark },
          ]}
          onChange={(evt) => {
            setTheme(evt.target.value as Themes);
          }}
        />
      </Descriptions.Item>

      <Descriptions.Item
        label={
          <Space size={4}>
            {i18n('Installation-Directory')}
            <Tooltip title={i18n('Installation-Directory-tip')}>
              <ExclamationCircleOutlined
                style={{ color: '#74a975', cursor: 'pointer' }}
              />
            </Tooltip>
          </Space>
        }
      >
        <Space
          align="center"
          style={{ width: '100%', justifyContent: 'space-between' }}
        >
          <Typography.Paragraph style={{ marginBottom: 0 }}>
            <Typography.Text
              copyable
              ellipsis={{
                tooltip: directory,
              }}
              style={{ width: 300 }}
            >
              {directory}
            </Typography.Text>
          </Typography.Paragraph>
          <Button
            icon={<EditOutlined />}
            size="small"
            onClick={onSelectDirectory}
          />
        </Space>
      </Descriptions.Item>

      <Descriptions.Item label={i18n('Mirror-Url')}>
        <Space direction="vertical" style={{ width: '100%' }}>
          <Input
            value={mirror}
            onChange={(evt) => {
              setMirror(evt.target.value);
            }}
          />
          <Typography.Text type="secondary">
            {i18n('For-example')}:{' '}
            <Typography.Text type="secondary" copyable>
              https://npmmirror.com/mirrors/node
            </Typography.Text>
          </Typography.Text>
        </Space>
      </Descriptions.Item>
    </Descriptions>
  );
});

export default Setting;
