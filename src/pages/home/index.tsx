import { InstallTasksButton } from '@/components/install-tasks';
import { ThemeCustomizer } from '@/components/theme-customizer';
import { Button } from '@/components/ui';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from '@/components/ui/sidebar';
import {
  Boxes,
  CopyIcon,
  Folder,
  HardDrive,
  Layers,
  MinusIcon,
  SquareIcon,
  Terminal,
  XIcon,
} from 'lucide-react';
import { lazy, useEffect, useState } from 'react';
import { Link, Outlet, useLocation } from 'react-router';
import { toast } from 'sonner';
import Onboarding from './onboarding';
import { Updater } from './updater';

import { cn, getSystem } from '@/lib/utils';
import { getCurrent, windowClose, windowMinimize } from '@/services/api';
import { useTranslation } from 'react-i18next';

const Tip = lazy(() => import('./tip'));
const Configuration = lazy(() => import('./configuration'));
const Setting = lazy(() => import('./setting'));

const surfaceClassName =
  'bg-card bg-linear-to-br from-primary/3 via-transparent to-muted/35 shadow-lg shadow-foreground/5 dark:from-primary/5 dark:to-muted/15 dark:shadow-black/15';

const Home: React.FC = () => {
  const { t } = useTranslation();
  const { pathname } = useLocation();

  const platform = getSystem();
  const [isMaximized, setIsMaximized] = useState(false);

  useEffect(() => {
    const appWindow = getCurrent();
    let disposed = false;
    const updateMaximized = async () => {
      const maximized = await appWindow.isMaximized();
      if (!disposed) setIsMaximized(maximized);
    };
    // Native title-bar gestures and OS shortcuts can also change the window state.
    const unlisten = appWindow.onResized(() => {
      void updateMaximized().catch(console.error);
    });
    void updateMaximized().catch(console.error);

    return () => {
      disposed = true;
      void unlisten.then((stop) => stop()).catch(console.error);
    };
  }, []);

  const toggleMaximized = async () => {
    try {
      const appWindow = getCurrent();
      await appWindow.toggleMaximize();
      setIsMaximized(await appWindow.isMaximized());
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    const unlisted = getCurrent().listen<string>(
      'nvm-desktop://app-migration-error',
      async () => {
        toast.error(t('Migration-error'), {
          duration: 8000,
        });
      },
    );

    return () => {
      unlisted.then((fn) => fn());
    };
  }, [t]);

  const navigation = [
    {
      path: '/versions',
      label: 'Versions',
      icon: Layers,
    },
    {
      path: '/installed',
      label: 'Installed',
      icon: HardDrive,
    },
    {
      path: '/projects',
      label: 'Projects',
      icon: Folder,
    },
    {
      path: '/groups',
      label: 'Groups',
      icon: Boxes,
    },
  ];

  return (
    <SidebarProvider className='h-svh min-h-0 [--sidebar-width:clamp(13.5rem,15vw,16.5rem)]! [--sidebar-width-icon:3rem]! overflow-hidden bg-muted bg-linear-to-br from-primary/10 via-transparent to-primary/5 dark:bg-background dark:from-primary/8 dark:to-muted/30'>
      <Onboarding />
      <Sidebar
        variant='floating'
        collapsible='icon'
        className='**:data-[slot=sidebar-inner]:rounded-xl **:data-[slot=sidebar-inner]:bg-sidebar **:data-[slot=sidebar-inner]:bg-linear-to-b **:data-[slot=sidebar-inner]:from-primary/5 **:data-[slot=sidebar-inner]:to-transparent **:data-[slot=sidebar-inner]:shadow-lg **:data-[slot=sidebar-inner]:shadow-foreground/5 dark:**:data-[slot=sidebar-inner]:shadow-black/15'
      >
        <SidebarHeader className='overflow-hidden'>
          <div
            data-tauri-drag-region
            className={cn(
              'flex h-16 min-w-0 shrink-0 select-none items-center gap-2 overflow-hidden',
              platform === 'macos' && 'h-22 pt-6',
            )}
          >
            <div className='grid size-8 shrink-0 place-items-center rounded-lg bg-foreground text-background shadow-sm'>
              <Terminal className='size-4.5' />
            </div>
            {/* Keep the text in layout while fading, so sidebar resizing cannot reflow the brand. */}
            <span className='flex shrink-0 flex-col gap-1 whitespace-nowrap opacity-100 transition-opacity delay-150 duration-100 group-data-[collapsible=icon]:pointer-events-none group-data-[collapsible=icon]:opacity-0 group-data-[collapsible=icon]:delay-0 motion-reduce:transition-none motion-reduce:delay-0'>
              <strong className='text-sm font-semibold'>NVM Desktop</strong>
              <span className='text-xs text-muted-foreground'>
                Node.js version manager
              </span>
            </span>
          </div>
        </SidebarHeader>
        <SidebarContent>
          <nav aria-label={t('Workspace')}>
            {[
              {
                label: 'Version-Manager',
                items: navigation.slice(0, 2),
              },
              {
                label: 'Workspace',
                items: navigation.slice(2),
              },
            ].map((group) => (
              <SidebarGroup key={group.label}>
                <SidebarGroupLabel>{t(group.label)}</SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu className='gap-1 xl:gap-1.5'>
                    {group.items.map(({ path, label, icon: Icon }) => (
                      <SidebarMenuItem key={path}>
                        <SidebarMenuButton
                          isActive={pathname === path}
                          tooltip={t(label)}
                          className={cn(
                            'min-h-9 text-sm xl:min-h-10 xl:text-sm group-data-[collapsible=icon]:min-h-9 data-active:bg-primary/10 data-active:text-primary data-active:shadow-none dark:data-active:text-sidebar-foreground',
                            label === 'Projects' && 'nvmd-project',
                          )}
                          render={
                            <SidebarLink
                              to={path}
                              aria-label={t(label)}
                              aria-current={
                                pathname === path ? 'page' : undefined
                              }
                            >
                              <Icon className='size-4' strokeWidth={1.7} />
                              <span>{t(label)}</span>
                            </SidebarLink>
                          }
                        />
                      </SidebarMenuItem>
                    ))}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            ))}
          </nav>
        </SidebarContent>
        <SidebarFooter>
          <div className='px-2 py-3.5 text-xs text-muted-foreground group-data-[collapsible=icon]:hidden'>
            Node.js version manager
          </div>
          <div className='relative h-8 shrink-0 transition-[height] duration-200 ease-linear group-data-[collapsible=icon]:h-44 motion-reduce:transition-none'>
            {[
              {
                key: 'updater',
                component: <Updater />,
                position:
                  'translate-x-0 group-data-[collapsible=icon]:-translate-y-36',
              },
              {
                key: 'theme',
                component: <ThemeCustomizer />,
                position:
                  'translate-x-9 group-data-[collapsible=icon]:-translate-y-27',
              },
              {
                key: 'tip',
                component: <Tip />,
                position:
                  'translate-x-18 group-data-[collapsible=icon]:-translate-y-18',
              },
              {
                key: 'configuration',
                component: <Configuration />,
                position:
                  'translate-x-27 group-data-[collapsible=icon]:-translate-y-9',
              },
              {
                key: 'setting',
                component: <Setting />,
                position: 'translate-x-36',
              },
            ].map(({ key, component, position }) => (
              <div
                key={key}
                className={cn(
                  'absolute bottom-0 left-0 flex size-8 items-center justify-center transition-transform duration-200 ease-linear group-data-[collapsible=icon]:translate-x-0 motion-reduce:transition-none [&_button]:size-8 [&_button]:p-0',
                  position,
                )}
              >
                {component}
              </div>
            ))}
          </div>
        </SidebarFooter>
      </Sidebar>
      <div className='flex min-h-0 min-w-0 flex-1 flex-col gap-2 p-2 md:pl-0'>
        <header
          data-tauri-drag-region
          className={cn(
            surfaceClassName,
            'flex h-14 shrink-0 select-none items-center justify-between rounded-xl px-4 text-xs text-muted-foreground sm:px-6',
            platform === 'macos' && 'pr-2 sm:pr-2',
          )}
        >
          <div className='flex min-w-0 items-center gap-3'>
            <SidebarTrigger aria-label={t('Toggle-Sidebar')} />
            <span className='h-4 w-px bg-border' aria-hidden='true' />
            <span className='truncate'>
              {t('Workspace')} <span className='px-2 opacity-40'>/</span>{' '}
              <span className='text-foreground'>
                {t(
                  navigation.find((item) => item.path === pathname)?.label ??
                    'Versions',
                )}
              </span>
            </span>
          </div>
          <div className='ml-auto flex shrink-0 items-center gap-2'>
            <InstallTasksButton />
            {platform !== 'macos' && (
              <div className='ml-4 flex shrink-0 items-center gap-1'>
                <Button
                  size='icon'
                  variant='ghost'
                  className='w-9 motion-reduce:transition-none'
                  aria-label={t('Minimize')}
                  title={t('Minimize')}
                  onClick={windowMinimize}
                >
                  <MinusIcon aria-hidden='true' strokeWidth={1.5} />
                </Button>
                <Button
                  size='icon'
                  variant='ghost'
                  className='w-9 motion-reduce:transition-none'
                  aria-label={t(isMaximized ? 'Restore' : 'Maximize')}
                  title={t(isMaximized ? 'Restore' : 'Maximize')}
                  onClick={toggleMaximized}
                >
                  {isMaximized ? (
                    <CopyIcon
                      className='size-3.5'
                      aria-hidden='true'
                      strokeWidth={1.5}
                    />
                  ) : (
                    <SquareIcon
                      className='size-3.5'
                      aria-hidden='true'
                      strokeWidth={1.5}
                    />
                  )}
                </Button>
                <Button
                  size='icon'
                  variant='ghost'
                  className='w-9 motion-reduce:transition-none'
                  aria-label={t('Close')}
                  title={t('Close')}
                  onClick={windowClose}
                >
                  <XIcon aria-hidden='true' strokeWidth={1.5} />
                </Button>
              </div>
            )}
          </div>
        </header>
        <main
          className={cn(
            surfaceClassName,
            'min-h-0 flex-1 overflow-hidden rounded-xl p-4 sm:p-6 lg:p-7',
          )}
        >
          {/* Cap reading width on wide windows while preserving the full table height. */}
          <div className='mx-auto h-full min-h-0 w-full max-w-6xl'>
            <Outlet />
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
};

function SidebarLink({ onClick, ...props }: React.ComponentProps<typeof Link>) {
  const { isMobile, setOpenMobile } = useSidebar();
  return (
    <Link
      {...props}
      onClick={(event) => {
        onClick?.(event);
        if (!event.defaultPrevented && isMobile) setOpenMobile(false);
      }}
    />
  );
}

export default Home;
