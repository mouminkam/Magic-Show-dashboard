import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  ArrowsClockwise,
  List,
  MagnifyingGlass,
  Moon,
  SignOut,
  Sun,
  UserCircle,
} from '@phosphor-icons/react';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Menu, MenuContent, MenuItem, MenuLabel, MenuSeparator, MenuTrigger } from '@/components/ui/menu';
import { Tooltip } from '@/components/ui/tooltip';
import { Breadcrumbs } from './breadcrumbs';
import { useAuth } from '@/auth/auth-context';
import { useTheme } from '@/hooks/use-theme';
import { demoDataService } from '@/services/settings';
import { USER_ROLE_LABEL } from '@/lib/status';
import { errorMessage } from '@/lib/utils';
import { useState } from 'react';

export function Topbar({
  onOpenMobileNav,
  onToggleCollapse,
  onOpenCommand,
}: {
  onOpenMobileNav: () => void;
  onToggleCollapse: () => void;
  onOpenCommand: () => void;
}) {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [resetOpen, setResetOpen] = useState(false);

  const resetMutation = useMutation({
    mutationFn: () => demoDataService.reset(),
    onSuccess: () => {
      void queryClient.invalidateQueries();
      setResetOpen(false);
      toast.success('Demo data reset', { description: 'Every table is back to its seeded state.' });
    },
    onError: (error) => toast.error(errorMessage(error, 'Could not reset the demo data')),
  });

  const isMac = typeof navigator !== 'undefined' && /mac/i.test(navigator.platform);

  return (
    <header
      className="sticky top-0 z-30 flex shrink-0 items-center gap-2 border-b border-line bg-canvas/85 px-3 backdrop-blur-md sm:px-4"
      style={{ height: 'var(--topbar-h)' }}
    >
      <Button
        variant="ghost"
        size="icon-sm"
        className="lg:hidden"
        onClick={onOpenMobileNav}
        aria-label="Open navigation"
      >
        <List size={18} aria-hidden />
      </Button>

      <Button
        variant="ghost"
        size="icon-sm"
        className="hidden lg:inline-flex"
        onClick={onToggleCollapse}
        aria-label="Toggle sidebar"
      >
        <List size={18} aria-hidden />
      </Button>

      <div className="hidden min-w-0 md:block">
        <Breadcrumbs />
      </div>

      <button
        type="button"
        onClick={onOpenCommand}
        className="ms-auto flex h-8 items-center gap-2 rounded-md border border-line bg-surface px-2.5 text-[13px] text-faint transition-colors hover:border-line-strong hover:text-muted"
      >
        <MagnifyingGlass size={14} aria-hidden />
        <span className="hidden sm:inline">Search screens</span>
        <kbd className="hidden rounded border border-line bg-sunken px-1 py-0.5 font-mono text-[10px] sm:inline">
          {isMac ? '⌘' : 'Ctrl'} K
        </kbd>
      </button>

      <Tooltip content={theme === 'dark' ? 'Switch to light' : 'Switch to dark'}>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={toggleTheme}
          aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
        >
          {theme === 'dark' ? <Sun size={17} aria-hidden /> : <Moon size={17} aria-hidden />}
        </Button>
      </Tooltip>

      <Menu>
        <MenuTrigger asChild>
          <button
            type="button"
            className="flex items-center gap-2 rounded-full p-0.5 pe-1.5 transition-colors hover:bg-sunken focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
            aria-label="Account menu"
          >
            <Avatar src={user?.avatar} name={user?.name} size={28} />
          </button>
        </MenuTrigger>
        <MenuContent className="w-60">
          <div className="px-2.5 py-2">
            <p className="truncate text-[13.5px] font-medium text-ink">{user?.name}</p>
            <p className="truncate text-[12px] text-faint">{user?.email}</p>
            <p className="mt-1.5 inline-flex rounded bg-brand-soft px-1.5 py-0.5 text-[11px] font-medium text-brand">
              {user ? USER_ROLE_LABEL[user.role] : ''}
            </p>
          </div>
          <MenuSeparator />
          <MenuLabel>Demo controls</MenuLabel>
          <MenuItem icon={<UserCircle size={15} />} onSelect={() => navigate('/settings/users')}>
            Manage users
          </MenuItem>
          <MenuItem icon={<ArrowsClockwise size={15} />} onSelect={() => setResetOpen(true)}>
            Reset demo data
          </MenuItem>
          <MenuSeparator />
          <MenuItem icon={<SignOut size={15} />} destructive onSelect={() => void logout()}>
            Sign out
          </MenuItem>
        </MenuContent>
      </Menu>

      <ConfirmDialog
        open={resetOpen}
        onOpenChange={setResetOpen}
        title="Reset demo data?"
        message="Every product, order, customer and content change you have made in this session will be discarded and the seeded dataset restored."
        confirmLabel="Reset everything"
        busy={resetMutation.isPending}
        onConfirm={() => resetMutation.mutate()}
      />
    </header>
  );
}
