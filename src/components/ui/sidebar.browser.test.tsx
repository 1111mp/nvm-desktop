import { page } from 'vitest/browser';
import { render } from 'vitest-browser-react';
import { expect, test, vi } from 'vitest';
import { HardDrive } from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
} from './sidebar';

test('collapsed group labels do not block the preceding navigation item', async () => {
  await page.viewport(1100, 800);
  const onClick = vi.fn();
  const screen = await render(
    <SidebarProvider open={false}>
      <Sidebar collapsible='icon'>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Version manager</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton>Versions</SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton aria-label='Installed' onClick={onClick}>
                    <HardDrive />
                    <span>Installed</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
          <SidebarGroup>
            <SidebarGroupLabel>Workspace</SidebarGroupLabel>
            <SidebarGroupContent>Projects</SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
      </Sidebar>
    </SidebarProvider>,
  );
  const installed = screen.getByRole('button', { name: 'Installed' });
  // Exercise the lower edge where the next group's transparent label overlaps.
  await installed.hover({ position: { x: 16, y: 28 } });
  expect(installed.element().matches(':hover')).toBe(true);
  await installed.click({ position: { x: 16, y: 28 } });
  expect(onClick).toHaveBeenCalledOnce();
});
