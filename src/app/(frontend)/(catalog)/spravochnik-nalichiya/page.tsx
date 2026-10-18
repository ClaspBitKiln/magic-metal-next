import { permanentRedirect } from 'next/navigation'

export default function LegacyAvailabilityPage() {
  permanentRedirect('/#products')
}
