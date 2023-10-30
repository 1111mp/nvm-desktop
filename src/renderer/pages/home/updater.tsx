import { useEffect, useState, useRef } from 'react';
import { App, Button, Descriptions, Modal, Popover, Progress } from 'antd';
import { CloudSyncOutlined } from '@ant-design/icons';
import { useI18n } from 'renderer/appContext';

import dayjs from 'dayjs';

import type { ProgressInfo, UpdateInfo } from 'electron-updater';

enum ModalType {
  Check = 'check',
  Complete = 'complete',
}

export const Updater: React.FC = () => {
  const [open, setOpen] = useState<{ visible: boolean; type: ModalType }>({
    visible: false,
    type: ModalType.Check,
  });
  const [loading, setLoading] = useState<boolean>(false);
  const [progress, setProgress] = useState<ProgressInfo>();

  const i18n = useI18n();
  const { message } = App.useApp();
  const updateInfo = useRef<UpdateInfo>();

  const onCheckUpdate = useRef<
    (info: UpdateInfo | 'update-not-available') => void
  >((info) => {
    if (info === 'update-not-available') {
      return message.success(i18n('Up-to-date'));
    }

    updateInfo.current = info;
    setOpen({ visible: true, type: ModalType.Check });
  });

  useEffect(() => {
    window.Context.onCheckUpdateResultCallback((info) => {
      onCheckUpdate.current?.(info);
    });

    window.Context.onRegistUpdateProgress((progress) => {
      setProgress(progress);
    });
  }, []);

  const onCheckUpdates = () => {
    setLoading(true);
    window.Context.checkForUpdates()
      .then((info) => {
        console.log(info);
      })
      .catch((err) => {
        message.error(
          err.message.replace(
            "Error invoking remote method 'check-for-updates': Error: ",
            '',
          ),
        );
      })
      .finally(() => {
        setLoading(false);
      });
  };

  const onUpgrade = async () => {
    switch (open.type) {
      case ModalType.Check: {
        setOpen({ visible: false, type: ModalType.Check });
        try {
          await window.Context.comfirmUpdate();
          // download completed
          setOpen({ visible: true, type: ModalType.Complete });
        } catch (err) {
          message.error(
            err.message.replace(
              "Error invoking remote method 'confirm-update': Error: ",
              '',
            ),
          );
        }
        return;
      }
      case ModalType.Complete: {
        window.Context.makeUpdateNow();
        return;
      }
    }
  };

  return (
    <>
      {progress === void 0 ? (
        <Button
          type="text"
          size="small"
          loading={loading}
          title={i18n('Check-Update')}
          className="module-home-btn"
          icon={<CloudSyncOutlined />}
          onClick={onCheckUpdates}
        />
      ) : (
        <Popover
          title={i18n('Download-Progress')}
          placement="bottomRight"
          content={
            <Progress
              percent={Math.floor(progress.percent)}
              strokeColor="#74a975"
            />
          }
        >
          <Button
            type="text"
            size="small"
            className="module-home-btn"
            icon={
              <Progress
                type="circle"
                size={14}
                percent={progress.percent}
                showInfo={false}
                strokeColor="#74a975"
              />
            }
            onClick={() => {
              progress.percent >= 100 &&
                setOpen({ visible: true, type: ModalType.Complete });
            }}
          />
        </Popover>
      )}

      <Modal
        open={open.visible}
        title={i18n('Update-Info')}
        okText={
          open.type === ModalType.Check
            ? i18n('Upgrade')
            : i18n('Quit-And-Install')
        }
        destroyOnClose
        onCancel={() => {
          setOpen({ visible: false, type: ModalType.Check });
        }}
        onOk={onUpgrade}
      >
        {open.type === ModalType.Check && updateInfo ? (
          <Descriptions column={2}>
            <Descriptions.Item label={i18n('Current-Version')}>
              {window.Context.version}
            </Descriptions.Item>
            <Descriptions.Item label={i18n('New-Version')}>
              {updateInfo.current?.version}
            </Descriptions.Item>
            <Descriptions.Item label={i18n('Release-Name')}>
              {updateInfo.current?.releaseName}
            </Descriptions.Item>
            <Descriptions.Item label={i18n('Release-Date')}>
              {dayjs(updateInfo.current?.releaseDate).format(
                'YYYY-MM-DD HH:mm',
              )}
            </Descriptions.Item>
          </Descriptions>
        ) : (
          <Descriptions column={1}>
            <Descriptions.Item>{i18n('Upgrade-Tip')}</Descriptions.Item>
          </Descriptions>
        )}
      </Modal>
    </>
  );
};
