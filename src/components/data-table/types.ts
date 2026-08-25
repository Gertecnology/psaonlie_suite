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
  interface ColumnMeta<TData, TValue> {
    /** Extra classes for this column's `<th>` and `<td>`, e.g. a fixed width. */
    className?: string
    /**
     * Unit the column is expressed in, shown under the header.
     *
     * A report column that reads "Total" without saying whether it is guaraníes
     * or a count is ambiguous, and the reader has no way to resolve it.
     */
    unidad?: string
    /**
     * Marks a numeric column, so its `<th>` and `<td>` carry `data-tipo`.
     *
     * The attribute is what the report print sheet keys on to right-align
     * figures and give them tabular digits. A utility class cannot do it:
     * `.informe-imprimible td` sets `text-align: left` for the printed grid and
     * outranks `.text-right`, so on paper the numbers would drift back to the
     * left edge and stop lining up column by column — which is the only reason
     * a column of amounts is readable at a glance.
     */
    tipo?: 'monto'
  }
}
