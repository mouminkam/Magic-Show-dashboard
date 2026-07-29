import { Link, useLocation } from 'react-router-dom';
import { CaretRight } from '@phosphor-icons/react';
import { ALL_NAV_ITEMS, ROUTE_TITLES, sectionFor } from './nav';

export interface Crumb {
  label: string;
  to?: string;
}

/**
 * Derives the trail from the current path, with an optional override for the
 * final crumb so detail screens can show a record name instead of an id.
 */
export function Breadcrumbs({ currentLabel }: { currentLabel?: string }) {
  const { pathname } = useLocation();

  const crumbs: Crumb[] = [];
  const section = sectionFor(pathname);
  if (section) crumbs.push({ label: section });

  const parent = ALL_NAV_ITEMS.find(
    (item) => item.path !== '/' && pathname.startsWith(`${item.path}/`),
  );
  if (parent) crumbs.push({ label: parent.label, to: parent.path });

  const own = ROUTE_TITLES[pathname];
  const last = currentLabel ?? own ?? (parent ? 'Detail' : 'Dashboard');
  crumbs.push({ label: last });

  return (
    <nav aria-label="Breadcrumb" className="min-w-0">
      <ol className="flex min-w-0 items-center gap-1 text-[12.5px]">
        {crumbs.map((crumb, index) => {
          const isLast = index === crumbs.length - 1;
          return (
            <li key={`${crumb.label}-${index}`} className="flex min-w-0 items-center gap-1">
              {index > 0 ? <CaretRight size={11} className="shrink-0 text-faint" aria-hidden /> : null}
              {crumb.to && !isLast ? (
                <Link to={crumb.to} className="truncate text-muted transition-colors hover:text-ink">
                  {crumb.label}
                </Link>
              ) : (
                <span
                  className={isLast ? 'truncate font-medium text-ink' : 'truncate text-muted'}
                  aria-current={isLast ? 'page' : undefined}
                >
                  {crumb.label}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
