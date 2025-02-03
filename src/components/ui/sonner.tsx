import { Toaster as Sonner } from 'sonner';
import { useAppContext } from '@/app-context';

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  const { settings } = useAppContext();

  return (
    <Sonner
      expand
      position='top-center'
      theme={settings.theme as ToasterProps['theme']}
      className='toaster group'
      toastOptions={{
        classNames: {
          toast:
            'bg-background dark:bg-accent text-foreground border-border shadow-lg',
          description: 'text-muted-foreground',
          actionButton: 'bg-primary text-primary-foreground',
          cancelButton: 'bg-muted text-muted-foreground',
          title: 'text-foreground',
          success: '*:data-icon:text-green-500',
          error: '*:data-icon:text-red-500',
          warning: '*:data-icon:text-yellow-500',
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
