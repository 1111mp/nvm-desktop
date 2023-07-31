import { forwardRef, useImperativeHandle, useState } from 'react';
import {
  Drawer,
  Descriptions,
  Input,
  Radio,
  Select,
  Button,
  Space,
} from 'antd';
import { Themes, applyTheme } from 'renderer/util';
import { useAppContext } from 'renderer/appContext';

export type Ref = {
  show: () => void;
};

type Props = {};

const Setting = forwardRef<Ref, Props>(({}, ref) => {
  const { theme: ctxTheme, onThemeChanged } = useAppContext();

  const [open, setOpen] = useState<boolean>(false);
  const [theme, setTheme] = useState<Themes>(ctxTheme);

  useImperativeHandle(ref, () => ({
    show: onShow,
  }));

  const onShow = () => {
    setOpen(true);
  };

  return (
    <Drawer
      open={open}
      title="Setting"
      closable={false}
      destroyOnClose
      footer={
        <Space>
          <Button
            onClick={() => {
              setOpen(false);
            }}
          >
            Cancel
          </Button>
          <Button type="primary">Submit</Button>
        </Space>
      }
      footerStyle={{ textAlign: 'right' }}
      onClose={() => {
        setOpen(false);
      }}
    >
      <Descriptions layout="vertical" column={1}>
        <Descriptions.Item label="Language">
          <Select
            size="small"
            defaultValue="en"
            options={[
              { label: '简体中文', value: 'zh-CN' },
              { label: 'English', value: 'en' },
            ]}
            style={{ width: 160 }}
          />
        </Descriptions.Item>
        <Descriptions.Item label="Themes">
          <Radio.Group
            value={theme}
            options={[
              { label: 'System Default', value: Themes.System },
              { label: 'Light', value: Themes.Light },
              { label: 'Dark', value: Themes.Dark },
            ]}
            onChange={(evt) => {
              const theme = evt.target.value as Themes;
              applyTheme(
                theme === Themes.System
                  ? (window.Context.getSystemTheme() as Themes)
                  : theme,
              );
              localStorage.setItem('nvmd-theme', theme);
              setTheme(theme);
              onThemeChanged(theme);
            }}
          />
        </Descriptions.Item>
        <Descriptions.Item label="Mirror Url">
          <Input defaultValue="https://nodejs.org/dist" />
        </Descriptions.Item>
      </Descriptions>
    </Drawer>
  );
});

export default Setting;
