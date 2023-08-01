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
} from 'antd';
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
          <Button type="primary" loading={loading} onClick={onSubmit}>
            {i18n('OK')}
          </Button>
        </Space>
      }
      footerStyle={{ textAlign: 'right' }}
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
    mirror: ctxMirror,
    onUpdateSetting,
  } = useAppContext();
  const i18n = useI18n();

  const [language, setLanguage] = useState<string>(() => locale);
  const [theme, setTheme] = useState<Themes>(() => ctxTheme);
  const [mirror, setMirror] = useState<string>(() => ctxMirror);

  useImperativeHandle(ref, () => ({
    submit: onSubmit,
  }));

  const onSubmit = async () => {
    if (language === locale && theme === ctxTheme && mirror === ctxMirror)
      return;

    onUpdateSetting({
      locale: language,
      theme,
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
