import 'server-only'

import { type TaxComponent, TaxRate } from 'xero-node'
import logger from '@/lib/logger'
import AuthenticatedXeroService from '@/lib/xero/AuthenticatedXero.service'
import { type TaxRateCreatePayload, TaxRateCreatePayloadSchema } from '@/lib/xero/types'
import { areNumbersEqual } from '@/utils/number'

class SyncedTaxRatesService extends AuthenticatedXeroService {
  async getTaxRateForItem(effectiveRate: number) {
    logger.info(
      'SyncedTaxRatesService#getTaxRateForItem :: Getting tax rate for effective rate',
      effectiveRate,
    )

    const taxRates = await this.xero.getTaxRates(this.connection.tenantId)
    let matchingTaxRate = taxRates?.find((t) => areNumbersEqual(t.effectiveRate, effectiveRate))

    if (!matchingTaxRate) {
      logger.info(
        'SyncedTaxRatesService#getTaxRateForItem :: Tax Rate not found... creating a new one',
      )
      const payload = {
        name: `Assembly Sales Tax - ${effectiveRate}%`,
        taxComponents: [
          {
            name: `Assembly Sales Tax ${effectiveRate}%`,
            rate: effectiveRate,
            isCompound: false,
            isNonRecoverable: false,
          } satisfies TaxComponent,
        ],
        // reportTaxType: TaxRate.ReportTaxTypeEnum.OUTPUT,
        status: TaxRate.StatusEnum.ACTIVE,
      } satisfies TaxRateCreatePayload

      matchingTaxRate = await this.xero.createTaxRate(
        this.connection.tenantId,
        TaxRateCreatePayloadSchema.parse(payload),
      )
    }
    return matchingTaxRate
  }
}

export default SyncedTaxRatesService
