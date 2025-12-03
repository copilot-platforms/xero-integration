import dayjs from 'dayjs'
import { and, desc, eq } from 'drizzle-orm'
import { json2csv } from 'json-2-csv'
import { getTableFields } from '@/db/db.helpers'
import {
  type CreateSyncLogPayload,
  SyncEntityType,
  SyncEventType,
  SyncStatus,
  syncLogs,
} from '@/db/schema/syncLogs.schema'
import AuthenticatedXeroService from '@/lib/xero/AuthenticatedXero.service'

export class SyncLogsService extends AuthenticatedXeroService {
  async getSyncLogsCsv() {
    const logs = await this.db
      .select()
      .from(syncLogs)
      .where(
        and(
          eq(syncLogs.portalId, this.user.portalId),
          eq(syncLogs.tenantId, this.connection.tenantId),
        ),
      )
      .orderBy(desc(syncLogs.createdAt))

    const data = logs.map((log) => ({
      sync_date: dayjs(log.syncDate).format('YYYY-MM-DD'),
      sync_time: dayjs(log.syncDate).format('HH:mm:ss'),
      event_type: log.eventType,
      status: log.status,
      entity_type: log.entityType,
      assembly_id: log.copilotId ?? '',
      xero_id: log.xeroId ?? '',
      invoice_number: log.invoiceNumber ?? '',
      customer_name: log.customerName ?? '',
      customer_email: log.customerEmail ?? '',
      amount: log.amount ?? '',
      tax_amount: log.taxAmount ?? '',
      fee_amount: log.feeAmount ?? '',
      product_name: log.productName ?? '',
      product_price: log.productPrice ?? '',
      xero_item_name: log.xeroItemName ?? '',
      error_message: log.errorMessage ?? '',
    }))

    return json2csv(data)
  }

  async getInvoiceCreatedSyncLog(copilotId: string) {
    const [result] = await this.db
      .select(
        getTableFields(syncLogs, [
          'portalId',
          'tenantId',
          'syncDate',
          'eventType',
          'entityType',
          'copilotId',
          'xeroId',
          'xeroItemName',
          'invoiceNumber',
          'customerName',
          'customerEmail',
          'amount',
          'taxAmount',
          'feeAmount',
          'productName',
          'productPrice',
        ]),
      )
      .from(syncLogs)
      .where(
        and(
          eq(syncLogs.portalId, this.user.portalId),
          eq(syncLogs.tenantId, this.connection.tenantId),
          eq(syncLogs.copilotId, copilotId),
          eq(syncLogs.status, SyncStatus.SUCCESS),
          eq(syncLogs.entityType, SyncEntityType.INVOICE),
          eq(syncLogs.eventType, SyncEventType.CREATED),
        ),
      )
      .orderBy(desc(syncLogs.createdAt))
      .limit(1)
    return result
  }

  async createSyncLog(payload: CreateSyncLogPayload) {
    await this.db.insert(syncLogs).values({
      ...payload,
      status: payload.status as SyncStatus, // drizzle's enum inference issue - this is safe trust me bro
      eventType: payload.eventType as SyncEventType,
      entityType: payload.entityType as SyncEntityType,
      portalId: this.user.portalId,
      tenantId: this.connection.tenantId,
    })
  }
}
