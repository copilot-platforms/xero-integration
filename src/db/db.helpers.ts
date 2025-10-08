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
 * Build strongly typed select field object from table and column names
 * The return type is the exact `{ colName: Column }` map Drizzle expects for select, return, etc
 */
export const getTableFields = <
  TTable extends AnyPgTable,
  K extends readonly (keyof TableColumns<TTable>)[],
>(
  table: TTable,
  keys: K,
): { [C in K[number]]: TableColumns<TTable>[C] } => {
  const obj: Record<string, AnyPgColumn> = {}
  // @ts-expect-error Create a new object with key as elem of keys, and value from table (This is pretty safe, trust me)
  for (const k of keys) obj[k] = table[k]
  return obj as { [C in K[number]]: TableColumns<TTable>[C] }
}
