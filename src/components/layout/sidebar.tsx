import { NavLink } from 'react-router-dom';
import { Logo } from './logo';
import { NAV_GROUPS } from './nav';
import { Tooltip } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

export function Sidebar({
  collapsed,
  onNavigate,
}: {
  collapsed: boolean;
  onNavigate?: () => void;
}) {
  return (
    <aside
      className="flex h-full flex-col border-e border-line bg-surface"
      style={{ width: collapsed ? 'var(--sidebar-w-collapsed)' : 'var(--sidebar-w)' }}
    >
      <div
        className={cn(
          'flex shrink-0 items-center border-b border-line',
          collapsed ? 'justify-center px-2' : 'px-4',
        )}
        style={{ height: 'var(--topbar-h)' }}
      >
        <Logo wordmark={!collapsed} size={30} />
      </div>

      <nav aria-label="Main" className="flex-1 overflow-y-auto px-2.5 py-3">
        {NAV_GROUPS.map((group) => (
          <div key={group.label} className="mb-4 last:mb-0">
            {collapsed ? (
              <div className="mx-2 mb-2 h-px bg-line" role="presentation" />
            ) : (
              <p className="mb-1 px-2.5 eyebrow">{group.label}</p>
            )}

            <ul className="space-y-px">
              {group.items.map((item) => {
                const Icon = item.icon;
                const link = (
                  <NavLink
                    to={item.path}
                    end={item.end}
                    onClick={onNavigate}
                    className={({ isActive }) =>
                      cn(
                        'group relative flex items-center rounded-md text-[13.5px] transition-colors duration-150',
                        collapsed ? 'justify-center px-2 py-2' : 'gap-2.5 px-2.5 py-[7px]',
                        isActive
                          ? 'bg-brand-soft font-medium text-brand'
                          : 'text-muted hover:bg-sunken hover:text-ink',
                      )
                    }
                  >
                    {({ isActive }) => (
                      <>
                        <Icon
                          size={17}
                          weight={isActive ? 'fill' : 'regular'}
                          className="shrink-0"
                          aria-hidden
                        />
                        {!collapsed ? <span className="truncate">{item.label}</span> : null}
                      </>
                    )}
                  </NavLink>
                );

                return (
                  <li key={item.path}>
                    {collapsed ? (
                      <Tooltip content={item.label} side="right">
                        <span className="block">{link}</span>
                      </Tooltip>
                    ) : (
                      link
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {!collapsed ? (
        <div className="shrink-0 border-t border-line px-4 py-2.5">
          <p className="text-[11px] text-faint">
            Demo build · mock data
          </p>
        </div>
      ) : null}
    </aside>
  );
}
