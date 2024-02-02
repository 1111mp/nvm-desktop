import { forwardRef, useEffect, useImperativeHandle, useState, useRef } from "react";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  Button,
  Label,
  LabelCopyable,
  Progress
} from "@renderer/components/ui";
import { toast } from "sonner";

import { v4 as uuidv4 } from "uuid";
import { useI18n } from "@src/renderer/src/app-context";

export type Ref = {
  show: (data: Nvmd.Version) => void;
};

type Props = {
  onRefrresh: () => void;
};

export const InfoModal = forwardRef<Ref, Props>(({ onRefrresh }, ref) => {
  const [open, setOpen] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [path, setPath] = useState<string>();
  const [progress, setProgress] = useState<Nvmd.ProgressData>();

  const record = useRef<Nvmd.Version>();
  const uuid = useRef<string>();

  const i18n = useI18n();

  useImperativeHandle(ref, () => ({
    show: onShow
  }));

  useEffect(() => {
    window.Context.onRegistProgress((id, progress) => {
      if (!uuid.current || uuid.current !== id) return;
      setProgress(progress);
    });
  }, []);

  const onShow: Ref["show"] = (data) => {
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
        id: uuid.current!,
        version: record.current!.version.slice(1)
      });
      setPath(path);
    } catch (err) {
      if (!err.message.includes("This operation was aborted")) {
        toast.error(
          err.message
            ? err.message.split("Error invoking remote method 'get-node':").slice(-1)
            : "Something went wrong"
        );
        setPath("error");
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
    <AlertDialog open={open}>
      <AlertDialogContent className="top-1/3">
        <AlertDialogHeader>
          <AlertDialogTitle>{i18n("Version-Manager")}</AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-2">
              <div className="columns-2">
                <p className="space-x-2">
                  <Label>{i18n("Version")}</Label>
                  <Label className="text-foreground">{record.current?.version}</Label>
                </p>
                <p className="space-x-2">
                  <Label>{`NPM ${i18n("Version")}`}</Label>
                  <Label className="text-foreground">{record.current?.npm}</Label>
                </p>
              </div>
              <div className="flex items-center h-5">
                {progress ? (
                  <div className="flex flex-1 items-center space-x-2">
                    <Progress value={progress.percent * 100} className="max-w-60" />
                    <Label>{`${progress.transferred} / ${progress.total} B`}</Label>
                  </div>
                ) : (
                  <p className="flex-1">{i18n("Install-Tip")}</p>
                )}
              </div>
              {path && path !== "error" ? (
                <div className="flex items-center gap-2">
                  <Label>Installation Directory</Label>
                  <LabelCopyable className="text-foreground">{path}</LabelCopyable>
                </div>
              ) : null}
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          {path && path !== "error" ? null : loading ? (
            <Button variant="destructive" onClick={onAbort}>
              {i18n("Cancel")}
            </Button>
          ) : (
            <Button
              variant="secondary"
              onClick={() => {
                setOpen(false);
              }}
            >
              {i18n("Cancel")}
            </Button>
          )}
          {path && path !== "error" ? (
            <Button
              loading={loading}
              onClick={() => {
                onRefrresh();
                setOpen(false);
                setTimeout(() => {
                  record.current = undefined;
                  uuid.current = undefined;
                  setPath(undefined);
                  setProgress(undefined);
                }, 0);
              }}
            >
              {i18n("OK")}
            </Button>
          ) : (
            <Button loading={loading} onClick={onStart}>
              {path === "error" ? i18n("Retry") : i18n("Start-Install")}
            </Button>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
});
