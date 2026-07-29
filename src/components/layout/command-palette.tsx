import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import * as Dialog from '@radix-ui/react-dialog';
import { ArrowElbowDownLeft, MagnifyingGlass } from '@phosphor-icons/react';
import { ALL_NAV_ITEMS, NAV_GROUPS, type NavItem } from './nav';
import { cn } from '@/lib/utils';

interface Entry extends NavItem {
  group: string;
}

const ENTRIES: Entry[] = NAV_GROUPS.flatMap((group) =>
  group.items.map((item) => ({ ...item, group: group.label })),
);

function score(entry: Entry, query: string): number {
  const q = query.toLowerCase();
  const label = entry.label.toLowerCase();
  if (label.startsWith(q)) return 3;
  if (label.includes(q)) return 2;
  if (entry.group.toLowerCase().includes(q)) return 1;
  if (entry.keywords?.some((k) => k.includes(q))) return 1;
  return 0;
}

/**
 * Ctrl/Cmd-K navigator. Keyboard-first: arrows move, Enter opens, Escape closes,
 * and the active option is announced through `aria-activedescendant`.
 */
export function CommandPalette({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const listRef = useRef<HTMLUListElement>(null);

  const results = useMemo(() => {
    if (!query.trim()) return ENTRIES;
    return ENTRIES.map((entry) => ({ entry, rank: score(entry, query.trim()) }))
      .filter((row) => row.rank > 0)
      .sort((a, b) => b.rank - a.rank)
      .map((row) => row.entry);
  }, [query]);

  useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  useEffect(() => {
    if (!open) setQuery('');
  }, [open]);

  useEffect(() => {
    const active = listRef.current?.querySelector('[data-active="true"]');
    active?.scrollIntoView({ block: 'nearest' });
  }, [activeIndex]);

  const go = (item: NavItem | undefined) => {
    if (!item) return;
    onOpenChange(false);
    navigate(item.path);
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-black/45 backdrop-blur-[2px] data-[state=open]:animate-in-up" />
        <Dialog.Content
          className={cn(
            'fixed left-1/2 top-[12vh] z-50 w-[calc(100vw-2rem)] max-w-xl -translate-x-1/2',
            'overflow-hidden rounded-xl border border-line bg-overlay shadow-[var(--shadow-lg)]',
            'data-[state=open]:animate-in-up',
          )}
          onKeyDown={(event) => {
            if (event.key === 'ArrowDown') {
              event.preventDefault();
              setActiveIndex((i) => (results.length ? (i + 1) % results.length : 0));
            } else if (event.key === 'ArrowUp') {
              event.preventDefault();
              setActiveIndex((i) => (results.length ? (i - 1 + results.length) % results.length : 0));
            } else if (event.key === 'Enter') {
              event.preventDefault();
              go(results[activeIndex]);
            }
          }}
        >
          <Dialog.Title className="sr-only">Command palette</Dialog.Title>
          <Dialog.Description className="sr-only">
            Search across every screen in the console
          </Dialog.Description>

          <div className="flex items-center gap-2.5 border-b border-line px-4">
            <MagnifyingGlass size={16} className="shrink-0 text-faint" aria-hidden />
            <input
              autoFocus
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Jump to a screen…"
              aria-label="Jump to a screen"
              role="combobox"
              aria-expanded
              aria-controls="command-results"
              aria-activedescendant={results[activeIndex] ? `command-${activeIndex}` : undefined}
              className="h-12 w-full bg-transparent text-[14px] text-ink outline-none placeholder:text-faint"
            />
            <kbd className="hidden shrink-0 rounded border border-line bg-sunken px-1.5 py-0.5 font-mono text-[10px] text-faint sm:block">
              ESC
            </kbd>
          </div>

          <ul id="command-results" role="listbox" ref={listRef} className="max-h-[52vh] overflow-y-auto p-1.5">
            {results.length === 0 ? (
              <li className="px-3 py-8 text-center text-[13px] text-muted">
                No screen matches “{query}”.
              </li>
            ) : (
              results.map((entry, index) => {
                const Icon = entry.icon;
                const isActive = index === activeIndex;
                return (
                  <li key={entry.path} role="none">
                    <button
                      type="button"
                      id={`command-${index}`}
                      role="option"
                      aria-selected={isActive}
                      data-active={isActive}
                      onMouseEnter={() => setActiveIndex(index)}
                      onClick={() => go(entry)}
                      className={cn(
                        'flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-start text-[13.5px]',
                        isActive ? 'bg-brand-soft text-brand' : 'text-muted',
                      )}
                    >
                      <Icon size={16} weight={isActive ? 'fill' : 'regular'} aria-hidden />
                      <span className="font-medium">{entry.label}</span>
                      <span className="ms-auto text-[11.5px] text-faint">{entry.group}</span>
                      {isActive ? (
                        <ArrowElbowDownLeft size={13} className="text-faint" aria-hidden />
                      ) : null}
                    </button>
                  </li>
                );
              })
            )}
          </ul>

          <div className="flex items-center justify-between border-t border-line bg-sunken/60 px-4 py-2 text-[11.5px] text-faint">
            <span>{ALL_NAV_ITEMS.length} screens</span>
            <span>↑↓ to navigate · ↵ to open</span>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
