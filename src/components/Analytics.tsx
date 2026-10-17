import Script from 'next/script'
import { getMetrikaCounterId } from '@/lib/analyticsConfig'
import AnalyticsPageView from './AnalyticsPageView'

export default function Analytics() {
  const metrikaId = getMetrikaCounterId()
  if (!metrikaId) return null
  return <>
    <Script id="magicmet-analytics" src={`/analytics.js?v=20261017-1&id=${metrikaId}`} strategy="afterInteractive" />
    <AnalyticsPageView />
  </>
}
