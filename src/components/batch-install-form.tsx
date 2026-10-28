import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { CloudDownload } from 'lucide-react';
import { useAppContext } from '@/app-context';
import type { InstallRequest } from '@/lib/install-tasks';
import { workspaceStyles } from '@/components/workspace-layout';
import {
  availableArchitectures,
  preferredArchitecture,
} from '@/lib/install-tasks';
import {
  Button,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  Select,
  SelectGroup,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Field,
  FieldLabel,
  FieldGroup,
  Badge,
} from '@/components/ui';

export function BatchInstallForm({
  versions,
  onDone,
  onStart,
  onBack,
}: {
  versions: Nvmd.Version[];
  onDone: () => void;
  onStart: (requests: InstallRequest[]) => Promise<void>;
  onBack: () => void;
}) {
  const { t } = useTranslation();
  const { settings } = useAppContext();
  const [arch, setArch] = useState<string>(preferredArchitecture);
  const [overrides, setOverrides] = useState<Record<string, string>>({});
  const [pending, setPending] = useState(false);
  const chosen = (version: Nvmd.Version) =>
    overrides[version.version] ??
    (availableArchitectures(version).includes(arch) ? arch : '');
  const valid =
    versions.length > 0 &&
    versions.every((version) =>
      availableArchitectures(version).includes(chosen(version)),
    );
  const start = async () => {
    if (!valid || pending) return;
    setPending(true);
    try {
      await onStart(
        versions.map((version) => ({
          version: version.version.slice(1),
          arch: chosen(version),
          directory: settings.directory,
        })),
      );
      onDone();
    } catch (error) {
      toast.error(String(error));
    } finally {
      setPending(false);
    }
  };
  return (
    <>
      <DialogHeader>
        <DialogTitle>{t('Batch-Install')}</DialogTitle>
        <DialogDescription>
          {t('Batch-Description', { count: versions.length })}
        </DialogDescription>
      </DialogHeader>
      <div className='flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto overscroll-contain [scrollbar-gutter:stable]'>
        <FieldGroup>
          <Field orientation='horizontal'>
            <FieldLabel>{t('Install-Architecture')}</FieldLabel>
            <Select
              value={arch}
              onValueChange={(value) => {
                if (value) {
                  setArch(value);
                  setOverrides({});
                }
              }}
              disabled={pending}
              items={['arm64', 'x64', 'x86'].map((value) => ({
                value,
                label: value,
              }))}
            >
              <SelectTrigger
                className='ml-auto w-32'
                aria-label={t('Install-Architecture')}
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {['arm64', 'x64', 'x86'].map((value) => (
                    <SelectItem key={value} value={value}>
                      {value}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </Field>
        </FieldGroup>
        <div className='flex flex-col gap-1.5'>
          {versions.map((version) => (
            <div
              key={version.version}
              className='flex flex-wrap items-center gap-3 rounded-xl bg-surface-40 px-3 py-2'
            >
              <span className='font-mono text-sm font-semibold'>
                {version.version}
              </span>
              {version.lts && <Badge variant='secondary'>LTS</Badge>}
              <div className='ml-auto'>
                <Select
                  value={chosen(version) || null}
                  disabled={pending}
                  onValueChange={(value) => {
                    if (value)
                      setOverrides((current) => ({
                        ...current,
                        [version.version]: value,
                      }));
                  }}
                  items={availableArchitectures(version).map((value) => ({
                    value,
                    label: value,
                  }))}
                >
                  <SelectTrigger
                    aria-label={`${t('Install-Architecture')} ${version.version}`}
                    aria-invalid={!chosen(version)}
                  >
                    <SelectValue placeholder={t('Batch-Choose-Arch')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {availableArchitectures(version).map((value) => (
                        <SelectItem key={value} value={value}>
                          {value}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>
              {!chosen(version) && (
                <p className='w-full text-xs text-destructive'>
                  {t('Batch-Unsupported-Arch', { arch })}
                </p>
              )}
            </div>
          ))}
        </div>
        <div className='flex flex-col gap-1 rounded-xl bg-surface-40 p-3 text-xs text-muted-foreground'>
          <div className='flex min-w-0 items-baseline justify-between gap-2'>
            <span className='shrink-0'>{t('Installation-Directory')}</span>
            <p
              className='truncate font-mono select-text'
              title={settings.directory}
            >
              {settings.directory}
            </p>
          </div>
          <p>{t('Batch-Concurrency')}</p>
          <p>{t('Batch-Keep-Default')}</p>
        </div>
      </div>
      <DialogFooter className={workspaceStyles.footer}>
        <Button variant='ghost' disabled={pending} onClick={onBack}>
          {t('Batch-Back')}
        </Button>
        <Button disabled={!valid || pending} onClick={() => void start()}>
          <CloudDownload data-icon='inline-start' />
          {t('Batch-Start', { count: versions.length })}
        </Button>
      </DialogFooter>
    </>
  );
}
