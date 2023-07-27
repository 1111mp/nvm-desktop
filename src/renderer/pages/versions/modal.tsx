import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useState,
  useRef,
} from 'react';
import {
  Button,
  Descriptions,
  Progress,
  Modal,
  Typography,
  message,
} from 'antd';
import { v4 as uuidv4 } from 'uuid';

export type Ref = {
  show: (data: Nvmd.Version) => void;
};

type Props = {
  onRefrresh: () => void;
};

const { Paragraph } = Typography;

export const InfoModal = forwardRef<Ref, Props>(({ onRefrresh }, ref) => {
  const [open, setOpen] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [path, setPath] = useState<string>();
  const [progress, setProgress] = useState<Nvmd.ProgressData>();

  const record = useRef<Nvmd.Version>();
  const uuid = useRef<string>();

  const [messageApi, contextHolder] = message.useMessage();

  useImperativeHandle(ref, () => ({
    show: onShow,
  }));

  useEffect(() => {
    window.Context.onRegistProgress((id, progress) => {
      if (!uuid.current || uuid.current !== id) return;
      setProgress(progress);
    });
  }, []);

  const onShow: Ref['show'] = (data) => {
    record.current = data;
    setOpen(true);
  };

  const onStart = async () => {
    uuid.current = uuidv4();
    setLoading(true);
    setPath(undefined);
    setProgress(undefined);
    try {
      const { path } = await window.Context.getNode({
        id: uuid.current,
        version: record.current!.version.slice(1),
      });
      setPath(path);
    } catch (err) {
      if (!err.message.includes('This operation was aborted')) {
        messageApi.error(
          err.message
            ? err.message
                .split("Error invoking remote method 'get-node':")
                .slice(-1)
            : 'Something went wrong',
          3,
        );
        setPath('error');
      }
    } finally {
      setLoading(false);
    }
  };

  const onAbort = async () => {
    await window.Context.controllerAbort(uuid.current!);
    uuid.current = undefined;
    setProgress(undefined);
  };

  return (
    <>
      {contextHolder}
      <Modal
        title="Version Manager"
        open={open}
        closable={false}
        bodyStyle={{ paddingTop: 12 }}
        footer={[
          path && path !== 'error' ? null : loading ? (
            <Button key="cancel" danger onClick={onAbort}>
              Cancel
            </Button>
          ) : (
            <Button
              key="cancel"
              onClick={() => {
                setOpen(false);
              }}
            >
              Cancel
            </Button>
          ),
          path && path !== 'error' ? (
            <Button
              key="start"
              type="primary"
              loading={loading}
              onClick={() => {
                onRefrresh();
                setOpen(false);
              }}
            >
              OK
            </Button>
          ) : (
            <Button
              key="start"
              type="primary"
              loading={loading}
              onClick={onStart}
            >
              {path === 'error' ? 'Retry' : 'Start Install'}
            </Button>
          ),
        ]}
        afterClose={() => {
          record.current = undefined;
          uuid.current = undefined;
          setPath(undefined);
          setProgress(undefined);
        }}
      >
        <Descriptions column={2} colon={false}>
          <Descriptions.Item label="Version">
            {record.current?.version}
          </Descriptions.Item>
          <Descriptions.Item label="NPM Version">
            {record.current?.npm}
          </Descriptions.Item>
          {progress ? (
            <Descriptions.Item span={2} contentStyle={{ maxWidth: 260 }}>
              <Progress
                size="small"
                strokeColor="#74a975"
                percent={progress.percent * 100}
                format={() => `${progress.transferred} / ${progress.total} B`}
                style={{ marginBottom: 0 }}
              />
            </Descriptions.Item>
          ) : (
            <Descriptions.Item
              span={2}
              label="Click the Start Installation button to start the installation."
            >
              {''}
            </Descriptions.Item>
          )}
          {path && path !== 'error' ? (
            <Descriptions.Item span={2} label="Installation Directory">
              <Paragraph copyable style={{ marginBottom: 0 }}>
                {path}
              </Paragraph>
            </Descriptions.Item>
          ) : null}
        </Descriptions>
      </Modal>
    </>
  );
});
