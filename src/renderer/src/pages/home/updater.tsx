import "./progress.css";

import { useEffect, useState, useRef } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  Button,
  Label,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Progress
} from "@renderer/components/ui";
import { GlobeIcon } from "@radix-ui/react-icons";
import { CircularProgressbar } from "react-circular-progressbar";

import dayjs from "dayjs";
import { toast } from "sonner";
import { useI18n } from "@src/renderer/src/app-context";

import type { ProgressInfo, UpdateInfo } from "electron-updater";

enum ModalType {
  Check = "check",
  Complete = "complete"
}

export const Updater: React.FC = () => {
  const [open, setOpen] = useState<{ visible: boolean; type: ModalType }>({
    visible: false,
    type: ModalType.Check
  });
  const [pop, setPop] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [progress, setProgress] = useState<ProgressInfo>();

  const i18n = useI18n();
  const updateInfo = useRef<UpdateInfo>();

  const onCheckUpdate = useRef<(info: UpdateInfo | "update-not-available") => void>((info) => {
    if (info === "update-not-available") {
      return toast.success(i18n("Up-to-date"));
    }

    updateInfo.current = info;
    return setOpen({ visible: true, type: ModalType.Check });
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
        toast.error(
          err.message.replace("Error invoking remote method 'check-for-updates': Error: ", "")
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
          toast.error(
            err.message.replace("Error invoking remote method 'confirm-update': Error: ", "")
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
          size="sm"
          variant="ghost"
          loading={loading}
          title={i18n("Check-Update")}
          className="module-home-btn"
          icon={<GlobeIcon />}
          onClick={onCheckUpdates}
        />
      ) : (
        <Popover open={pop} onOpenChange={(open) => setPop(open)}>
          <PopoverTrigger asChild>
            <Button
              size="sm"
              variant="ghost"
              className="w-[31px] h-6"
              icon={<CircularProgressbar value={progress.percent} />}
              onClick={() => {
                progress.percent >= 100 && setOpen({ visible: true, type: ModalType.Complete });
              }}
              onMouseOver={() => {
                setPop(true);
              }}
            />
          </PopoverTrigger>
          <PopoverContent align="end" className="p-2">
            <p className="text-sm font-normal">{i18n("Download-Progress")}</p>
            <div className="flex items-center gap-2">
              <Progress value={Math.floor(progress.percent)} className="my-2" />
              <span className="text-xs">{Math.floor(progress.percent)}%</span>
            </div>
          </PopoverContent>
        </Popover>
      )}

      <AlertDialog open={open.visible}>
        <AlertDialogContent className="top-1/3">
          <AlertDialogHeader>
            <AlertDialogTitle>{i18n("Update-Info")}</AlertDialogTitle>
            <AlertDialogDescription>
              {open.type === ModalType.Check && updateInfo ? (
                <div className="columns-2">
                  <p className="space-x-4 mb-3">
                    <Label>{i18n("Current-Version")} :</Label>
                    <span className="text-popover-foreground">{window.Context.version}</span>
                  </p>
                  <p className="space-x-4">
                    <Label>{i18n("Release-Name")} :</Label>
                    <span className="text-popover-foreground">
                      {updateInfo.current?.releaseName}
                    </span>
                  </p>
                  <p className="space-x-4 mb-3">
                    <Label>{i18n("New-Version")} :</Label>
                    <span className="text-popover-foreground">{updateInfo.current?.version}</span>
                  </p>
                  <p className="space-x-4">
                    <Label>{i18n("Release-Date")} :</Label>
                    <span className="text-popover-foreground">
                      {dayjs(updateInfo.current?.releaseDate).format("YYYY-MM-DD HH:mm")}
                    </span>
                  </p>
                </div>
              ) : (
                <p>{i18n("Upgrade-Tip")}</p>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setOpen({ visible: false, type: ModalType.Check })}>
              {i18n("Cancel")}
            </AlertDialogCancel>
            <AlertDialogAction onClick={onUpgrade}>
              {open.type === ModalType.Check ? i18n("Upgrade") : i18n("Quit-And-Install")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
