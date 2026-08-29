'use client'

import { useEffect, useState } from 'react'

type Group = readonly [key: string, label: string]

export default function DirectoryGroupNav({ groups, label }: { groups: readonly Group[]; label: string }) {
  const [activeGroup, setActiveGroup] = useState(groups[0]?.[0] || '')

  useEffect(() => {
    const sections = groups
      .map(([key]) => document.getElementById(key))
      .filter((section): section is HTMLElement => Boolean(section))

    const updateActiveGroup = () => {
      const current = sections.reduce((active, section) => (
        section.getBoundingClientRect().top <= 90 ? section.id : active
      ), sections[0]?.id || '')
      setActiveGroup(current)
    }

    const frame = window.requestAnimationFrame(updateActiveGroup)
    window.addEventListener('scroll', updateActiveGroup, { passive: true })
    window.addEventListener('hashchange', updateActiveGroup)
    return () => {
      window.cancelAnimationFrame(frame)
      window.removeEventListener('scroll', updateActiveGroup)
      window.removeEventListener('hashchange', updateActiveGroup)
    }
  }, [groups])

  return <nav className="materials-groups" aria-label={label}>
    {groups.map(([key, itemLabel]) => <a
      className={activeGroup === key ? 'active' : undefined}
      href={`#${key}`}
      aria-current={activeGroup === key ? 'location' : undefined}
      onClick={() => {
        const section = document.getElementById(key)
        if (section instanceof HTMLDetailsElement) section.open = true
        setActiveGroup(key)
      }}
      key={key}
    >{itemLabel}</a>)}
  </nav>
}
