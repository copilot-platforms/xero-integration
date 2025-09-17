import { type AnyPgColumn, type AnyPgTable, timestamp } from 'drizzle-orm/pg-core'

export const timestamps = {
  // use timestamptz for timezone support via withTimezone: true
  createdAt: timestamp({ withTimezone: true, mode: 'date' }).defaultNow().notNull(),
  updatedAt: timestamp({ withTimezone: true, mode: 'date' })
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
}

type TableColumns<TTable extends AnyPgTable> = TTable['_']['columns']

/**
 * Build a typed select map for a Postgres table.
 * - `keys` must be real column names from the given table.
 * - Return type is the exact `{ colName: Column }` map Drizzle expects.
 */
export const getSelectFields = <
  TTable extends AnyPgTable,
  K extends readonly (keyof TableColumns<TTable> & string)[],
>(
  table: TTable,
  keys: K,
): { [P in K[number]]: TableColumns<TTable>[P] } => {
  // Drizzle stores columns on the internal `_` symbol; safe to read at runtime.
  const cols = table._?.columns as Record<string, AnyPgColumn>
  const out: Record<string, AnyPgColumn> = {}
  for (const k of keys as readonly string[]) out[k] = cols[k]
  return out as { [P in K[number]]: TableColumns<TTable>[P] }
}
