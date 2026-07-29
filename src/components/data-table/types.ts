import type { RowData } from '@tanstack/react-table';

/**
 * Column metadata used by the shared DataTable. Declaring it here keeps
 * `column.columnDef.meta` fully typed at every call site.
 */
declare module '@tanstack/react-table' {
  interface ColumnMeta<TData extends RowData, TValue> {
    /** Sort key sent to the service. Omit to make the column unsortable. */
    sortKey?: string;
    align?: 'start' | 'end' | 'center';
    /** Extra classes applied to both the header and body cells. */
    cellClassName?: string;
    /** Human label used by the column-visibility menu. */
    title?: string;
    /** Excluded from the visibility menu (selection / actions columns). */
    locked?: boolean;
    /** Placeholder so the generic parameters are both referenced. */
    __data?: [TData, TValue];
  }
}

export {};
