import '@tanstack/react-table'

/**
 * Per-column presentation hints.
 *
 * This augmentation used to live inside `features/users/components/users-table.tsx`,
 * where a `declare module` from a feature folder silently changed the types of
 * every table in the app. It belongs next to the shared table, which is the only
 * place entitled to extend the library's contract.
 */
declare module '@tanstack/react-table' {
  // TValue is required by the library's signature even though it is unused here.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface ColumnMeta<TData extends unknown, TValue> {
    /** Extra classes for this column's `<th>` and `<td>`, e.g. a fixed width. */
    className?: string
    /**
     * Unit the column is expressed in, shown under the header.
     *
     * A report column that reads "Total" without saying whether it is guaraníes
     * or a count is ambiguous, and the reader has no way to resolve it.
     */
    unidad?: string
  }
}
