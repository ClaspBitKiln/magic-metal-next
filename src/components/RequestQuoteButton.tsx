type Item = { product: string; size: string; designation: string; standard: string }

export default function RequestQuoteButton({ item, compact = false }: { item: Item; compact?: boolean }) {
  const request = [item.product, item.size, item.designation, item.standard].filter(Boolean).join('; ')
  return <div className={`add-to-quote${compact ? ' compact' : ''}`}>
    <a href={`/?product=${encodeURIComponent(request)}#request`}>Отправить заявку ↗</a>
  </div>
}
