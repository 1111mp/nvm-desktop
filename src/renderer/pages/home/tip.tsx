import { forwardRef, useImperativeHandle, useState } from 'react';
import { Drawer, Steps, Typography } from 'antd';

export type Ref = {
  show: () => void;
};

type Props = {};

const { Paragraph, Text, Link } = Typography;

export const Tip = forwardRef<Ref, Props>(({}, ref) => {
  const [open, setOpen] = useState<boolean>(false);
  const [current, setCurrent] = useState<number>(0);

  useImperativeHandle(ref, () => ({
    show: onShow,
  }));

  const onShow = () => {
    setOpen(true);
  };

  const onChange = (value: number) => {
    setCurrent(value);
  };

  return (
    <Drawer
      open={open}
      title="Tip"
      closable={false}
      destroyOnClose
      onClose={() => {
        setOpen(false);
      }}
    >
      <Steps
        current={current}
        onChange={onChange}
        direction="vertical"
        items={[
          {
            title: 'Install Node',
            description: (
              <>
                <Paragraph>
                  <Text>
                    Find the version you need and click the Install button to
                    install it.
                  </Text>
                </Paragraph>
                <Paragraph>
                  <Text type="secondary">
                    Download release files available on
                    <Link href="https://nodejs.org/dist/" target="_blank">
                      &nbsp; https://nodejs.org/dist/
                    </Link>
                    .
                  </Text>
                </Paragraph>
              </>
            ),
          },
          {
            title: 'Setting',
            description: (
              <>
                <Paragraph>
                  <Text>
                    Now add these lines to your ~/.bashrc, ~/.profile, or
                    ~/.zshrc file to have it automatically sourced upon login:
                    (you may have to add to more than one of the above files)
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
            ),
          },
          {
            title: 'Finally',
            description: (
              <>
                <Paragraph>
                  <Text>
                    You might need to restart your terminal instance. Enter
                    &nbsp;<Text type="secondary">"node --version"</Text> in the
                    terminal to check if it works.
                  </Text>
                </Paragraph>
                <Paragraph>
                  <Text type="secondary">
                    For more information about this issue and possible
                    workarounds, please
                  </Text>
                  <Link
                    href="https://github.com/1111mp/nvm-desktop/issues"
                    target="_blank"
                  >
                    &nbsp; refer here.
                  </Link>
                </Paragraph>
              </>
            ),
          },
        ]}
      />
    </Drawer>
  );
});
