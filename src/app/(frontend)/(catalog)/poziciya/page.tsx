import { permanentRedirect } from 'next/navigation'

export default function LegacyPositionPage() {
  permanentRedirect('/#products')
}
