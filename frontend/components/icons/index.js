import React from 'react'

export function IconCalendar(props){
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={"w-5 h-5 " + (props.className||'')}>
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
    </svg>
  )
}
export function IconRefresh(props){
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={"w-4 h-4 " + (props.className||'')}>
      <polyline points="23 4 23 10 17 10" />
      <polyline points="1 20 1 14 7 14" />
      <path d="M3.51 9a9 9 0 0114.13-3.36L23 10" />
      <path d="M20.49 15a9 9 0 01-14.13 3.36L1 14" />
    </svg>
  )
}
export function IconPlus(props){
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={"w-4 h-4 " + (props.className||'')}>
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  )
}
export function IconHouse(props){
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={"w-5 h-5 " + (props.className||'')}>
      <path d="M3 9.5L12 3l9 6.5" />
      <path d="M9 22V12h6v10" />
    </svg>
  )
}
export function IconTrash(props){
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={"w-4 h-4 " + (props.className||'')}>
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />
      <path d="M10 11v6" />
      <path d="M14 11v6" />
    </svg>
  )
}
export function IconCalendarWeek(props){
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={"w-4 h-4 " + (props.className||'')}>
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="3" y1="10" x2="21" y2="10" />
      <rect x="7" y="12" width="3" height="3" />
      <rect x="11" y="12" width="3" height="3" />
      <rect x="15" y="12" width="3" height="3" />
    </svg>
  )
}
export function IconChevronLeft(props){
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={"w-4 h-4 " + (props.className||'')}>
      <polyline points="15 18 9 12 15 6" />
    </svg>
  )
}
export function IconChevronRight(props){
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={"w-4 h-4 " + (props.className||'')}>
      <polyline points="9 18 15 12 9 6" />
    </svg>
  )
}
