import Link from 'next/link'
import { getMaterialStandardParts } from '@/data/materialStandardLinks'

export default function MaterialStandardReference({ reference }: { reference: string }) {
  const parts = getMaterialStandardParts(reference)
  if (parts.length === 1 && parts[0].standard) {
    return <Link prefetch={false} className="fact-link standard-code" href={`/spravochnik-gost/${parts[0].standard.slug}`}>{reference} <b>→</b></Link>
  }
  return <span className={parts.length > 1 ? "standard-code material-standard-reference" : "standard-code"}>{parts.map((part, index) => part.standard
    ? <Link prefetch={false} className="material-standard-link" href={`/spravochnik-gost/${part.standard.slug}`} key={index}>{part.text}</Link>
    : part.text)}</span>
}
