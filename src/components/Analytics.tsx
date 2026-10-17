import Script from 'next/script'
import AnalyticsPageView from './AnalyticsPageView'

export default function Analytics() {
  const metrikaId = process.env.NEXT_PUBLIC_YANDEX_METRIKA_ID || ''
  if (!/^[1-9]\d{0,14}$/.test(metrikaId) || !Number.isSafeInteger(Number(metrikaId))) return null
  return <>
    <Script id="magicmet-analytics" src={`/analytics.js?v=20261017-1&id=${metrikaId}`} strategy="afterInteractive" />
    <AnalyticsPageView />
  </>
}
