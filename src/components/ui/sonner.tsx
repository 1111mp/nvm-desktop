import { Toaster as Sonner, type ToasterProps } from 'sonner';
import {
  CircleCheckIcon,
  InfoIcon,
  TriangleAlertIcon,
  OctagonXIcon,
  Loader2Icon,
} from 'lucide-react';
import { useAppContext } from '@/app-context';

const Toaster = ({ ...props }: ToasterProps) => {
  const { settings } = useAppContext();

  return (
    <Sonner
      theme={settings.theme as ToasterProps['theme']}
      className='toaster group'
      icons={{
        success: <CircleCheckIcon className='size-4 text-green-400' />,
        info: <InfoIcon className='size-4' />,
        warning: <TriangleAlertIcon className='size-4 text-yellow-400' />,
        error: <OctagonXIcon className='size-4 text-red-400' />,
        loading: <Loader2Icon className='size-4 animate-spin' />,
      }}
      style={
        {
          '--normal-bg': 'var(--popover)',
          '--normal-text': 'var(--popover-foreground)',
          '--normal-border': 'var(--border)',
          '--border-radius': 'var(--radius)',
        } as React.CSSProperties
      }
      toastOptions={{
        classNames: {
          toast: 'cn-toast',
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
