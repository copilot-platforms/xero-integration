import { type TaxRateCreatePayload, TaxRateCreatePayloadSchema } from '@invoice-sync/types'
import { type TaxComponent, TaxRate } from 'xero-node'
import logger from '@/lib/logger'
import AuthenticatedXeroService from '@/lib/xero/AuthenticatedXero.service'
import { areNumbersEqual } from '@/utils/number'

class XeroTaxService extends AuthenticatedXeroService {
  async getTaxRateForItem(effectiveRate: number) {
    const taxRates = await this.xero.getTaxRates(this.connection.tenantId)
    let matchingTaxRate = taxRates?.find((t) => areNumbersEqual(t.effectiveRate, effectiveRate))

    if (!matchingTaxRate) {
      logger.info('XeroTaxService#getTaxRateForItem :: Tax Rate not found... creating a new one')
      const payload = {
        name: `Copilot Sales Tax - ${effectiveRate}%`,
        taxComponents: [
          {
            name: `Copilot Sales Tax ${effectiveRate}%`,
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

export default XeroTaxService
