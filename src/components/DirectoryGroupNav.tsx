'use client'

import { useEffect, useState } from 'react'

type Group = readonly [key: string, label: string]

export default function DirectoryGroupNav({ groups, label }: { groups: readonly Group[]; label: string }) {
  const [activeGroup, setActiveGroup] = useState(groups[0]?.[0] || '')

  useEffect(() => {
    const sections = groups
      .map(([key]) => document.getElementById(key))
      .filter((section): section is HTMLElement => Boolean(section))

    const observer = new IntersectionObserver((entries) => {
      const visible = entries
        .filter((entry) => entry.isIntersecting)
        .sort((first, second) => first.boundingClientRect.top - second.boundingClientRect.top)
      if (visible[0]?.target.id) setActiveGroup(visible[0].target.id)
    }, { rootMargin: '-66px 0px -68% 0px', threshold: 0 })

    sections.forEach((section) => observer.observe(section))
    return () => observer.disconnect()
  }, [groups])

  return <nav className="materials-groups" aria-label={label}>
    {groups.map(([key, itemLabel]) => <a
      className={activeGroup === key ? 'active' : undefined}
      href={`#${key}`}
      aria-current={activeGroup === key ? 'location' : undefined}
      onClick={() => setActiveGroup(key)}
      key={key}
    >{itemLabel}</a>)}
  </nav>
}
