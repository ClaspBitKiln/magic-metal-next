import type { ReactNode } from 'react'

export default function RFQWorkbenchLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ru">
      <body style={{ margin: 0 }}>{children}</body>
    </html>
  )
}
