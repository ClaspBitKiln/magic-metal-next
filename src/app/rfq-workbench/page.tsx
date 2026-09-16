import RFQWorkbench from '@/components/RFQWorkbench'
import config from '@payload-config'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { connection } from 'next/server'
import { getPayload } from 'payload'

export const metadata = {
  title: 'RFQ Workbench — Мэджик Металл',
  robots: { index: false, follow: false },
}

export default async function RFQWorkbenchPage() {
  await connection()
  const payload = await getPayload({ config })
  const { user } = await payload.auth({ headers: await headers() })

  if (!user) redirect('/admin/login?redirect=/rfq-workbench')

  return <RFQWorkbench managerEmail={user.email} />
}
