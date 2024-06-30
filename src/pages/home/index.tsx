import { Outlet, Link, useLocation } from 'react-router-dom';
import {
  Button,
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  navigationMenuTriggerStyle,
} from '@/components/ui';
import { Cross2Icon, MinusIcon } from '@radix-ui/react-icons';
import { ThemeCustomizer } from '@/components/theme-customizer';

import { getSystem } from '@/lib/utils';
import { useTranslation } from 'react-i18next';
import { windowClose, windowMinimize } from '@/services/api';

const Home: React.FC = () => {
  const { t } = useTranslation();
  const { pathname } = useLocation();

  const platform = getSystem(),
    linkStyle = navigationMenuTriggerStyle();

  return (
    <>
      {platform === 'macos' ? (
        <header
          data-tauri-drag-region
          className='flex items-center pt-2 pr-3 justify-between pl-24 select-none [-webkit-app-region:drag]'
        >
          <NavigationMenu>
            <NavigationMenuList className='[-webkit-app-region:no-drag]'>
              <NavigationMenuItem>
                <NavigationMenuLink asChild>
                  <Link
                    to='/versions'
                    className={linkStyle}
                    data-active={pathname === '/versions'}
                  >
                    {t('Versions')}
                  </Link>
                </NavigationMenuLink>
              </NavigationMenuItem>
              <NavigationMenuItem>
                <NavigationMenuLink asChild>
                  <Link
                    to='/installed'
                    className={linkStyle}
                    data-active={pathname === '/installed'}
                  >
                    {t('Installed')}
                  </Link>
                </NavigationMenuLink>
              </NavigationMenuItem>
              <NavigationMenuItem className='nvmd-project'>
                <NavigationMenuLink asChild>
                  <Link
                    to='/projects'
                    className={linkStyle}
                    data-active={pathname === '/projects'}
                  >
                    {t('Projects')}
                  </Link>
                </NavigationMenuLink>
              </NavigationMenuItem>
              <NavigationMenuItem>
                <NavigationMenuLink asChild>
                  <Link
                    to='/groups'
                    className={linkStyle}
                    data-active={pathname === '/groups'}
                  >
                    {t('Groups')}
                  </Link>
                </NavigationMenuLink>
              </NavigationMenuItem>
            </NavigationMenuList>
          </NavigationMenu>
          <div className='flex items-center [-webkit-app-region:no-drag]'>
            <ThemeCustomizer />
            {/* <Tip />
						<Configration />
						<Setting /> */}
          </div>
        </header>
      ) : (
        <header className='flex items-center pt-2 px-3 justify-between select-none [-webkit-app-region:drag]'>
          <div className='flex items-center gap-3'>
            <div className='flex items-center gap-1 [-webkit-app-region:no-drag]'>
              <Button
                size='sm'
                variant='secondary'
                icon={<Cross2Icon />}
                onClick={() => {
                  windowClose();
                }}
              ></Button>
              <Button
                size='sm'
                variant='secondary'
                icon={<MinusIcon />}
                onClick={() => {
                  windowMinimize();
                }}
              />
            </div>
            <NavigationMenu>
              <NavigationMenuList className='[-webkit-app-region:no-drag]'>
                <NavigationMenuItem>
                  <NavigationMenuLink asChild>
                    <Link
                      to='/versions'
                      className={linkStyle}
                      data-active={pathname === '/versions'}
                    >
                      {t('Versions')}
                    </Link>
                  </NavigationMenuLink>
                </NavigationMenuItem>
                <NavigationMenuItem>
                  <NavigationMenuLink asChild>
                    <Link
                      to='/installed'
                      className={linkStyle}
                      data-active={pathname === '/installed'}
                    >
                      {t('Installed')}
                    </Link>
                  </NavigationMenuLink>
                </NavigationMenuItem>
                <NavigationMenuItem className='nvmd-project'>
                  <NavigationMenuLink asChild>
                    <Link
                      to='/projects'
                      className={linkStyle}
                      data-active={pathname === '/projects'}
                    >
                      {t('Projects')}
                    </Link>
                  </NavigationMenuLink>
                </NavigationMenuItem>
                <NavigationMenuItem>
                  <NavigationMenuLink asChild>
                    <Link
                      to='/groups'
                      className={linkStyle}
                      data-active={pathname === '/groups'}
                    >
                      {t('Groups')}
                    </Link>
                  </NavigationMenuLink>
                </NavigationMenuItem>
              </NavigationMenuList>
            </NavigationMenu>
          </div>
          <div className='flex items-center [-webkit-app-region:no-drag]'>
            {/* {platform === 'win32' && <Updater />} */}
            <ThemeCustomizer />
            {/* <Tip />
						<Configration />
						<Setting /> */}
          </div>
        </header>
      )}
      <main className='px-6 py-4 flex-1 overflow-hidden'>
        <Outlet />
      </main>
    </>
  );
};

export default Home;
