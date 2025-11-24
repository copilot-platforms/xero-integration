import { DASHBOARD_DOMAINS } from '@/constants/domains'

export * from './useActionsMenu'
export * from './usePrimaryCta'
export * from './useSecondaryCta'

/**
 * Attempts to send window.parent.postMessage to an array of possible domains
 * The valid dashboard domain will succeed while the others will fail
 * @param payload
 */
export const postMessage = (payload: object) => {
  for (const domain of DASHBOARD_DOMAINS) {
    window.parent.postMessage(payload, domain)
  }
}
