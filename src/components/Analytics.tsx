/* eslint-disable @next/next/no-img-element -- Yandex noscript tracking pixel cannot use next/image. */
import Script from 'next/script'

export default function Analytics() {
  const metrikaId = (process.env.NEXT_PUBLIC_YANDEX_METRIKA_ID || '').replace(/\D/g, '')
  const gaId = /^G-[A-Z0-9]+$/.test(process.env.NEXT_PUBLIC_GA4_ID || '') ? process.env.NEXT_PUBLIC_GA4_ID : ''
  return <>
    {metrikaId && <>
      <Script id="yandex-metrika" strategy="afterInteractive">{`(function(m,e,t,r,i,k,a){m[i]=m[i]||function(){(m[i].a=m[i].a||[]).push(arguments)};m[i].l=1*new Date();k=e.createElement(t),a=e.getElementsByTagName(t)[0],k.async=1,k.src=r,a.parentNode.insertBefore(k,a)})(window,document,'script','https://mc.yandex.ru/metrika/tag.js','ym');ym(${metrikaId},'init',{clickmap:true,trackLinks:true,accurateTrackBounce:true});`}</Script>
      <noscript><div><img src={`https://mc.yandex.ru/watch/${metrikaId}`} style={{ position: 'absolute', left: '-9999px' }} alt="" /></div></noscript>
    </>}
    {gaId && <>
      <Script src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`} strategy="afterInteractive" />
      <Script id="ga4" strategy="afterInteractive">{`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag('js',new Date());gtag('config','${gaId}');`}</Script>
    </>}
    <Script id="funnel-events" strategy="afterInteractive">{`document.addEventListener('click',function(e){var a=e.target&&e.target.closest?e.target.closest('a'):null;if(!a)return;var href=a.getAttribute('href')||'';var goal=href.indexOf('tel:')===0?'phone_click':href.indexOf('#request')>=0?'request_click':'';if(!goal)return;if(window.ym&&${metrikaId || 0})window.ym(${metrikaId || 0},'reachGoal',goal);if(window.gtag)window.gtag('event',goal,{link_url:a.href});});`}</Script>
  </>
}
