import React from 'react'

export function PlayIcon({ size = 24, color = '#022' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <path d="M8 5v14l11-7L8 5z" fill={color} />
    </svg>
  )
}

export function PauseIcon({ size = 18, color = '#022' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <rect x="6" y="5" width="4" height="14" fill={color} rx="1" />
      <rect x="14" y="5" width="4" height="14" fill={color} rx="1" />
    </svg>
  )
}

export function VolumeIcon({ size = 18, color = '#eaeaea' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <path d="M3 10v4h4l5 4V6L7 10H3z" fill={color} />
      <path d="M16.5 12c0-1.77-.77-3.36-1.97-4.47l-.72.72A4.5 4.5 0 0116.5 12c0 1.23-.45 2.35-1.19 3.22l.72.72A6 6 0 0016.5 12z" fill={color} opacity="0.9" />
    </svg>
  )
}

export function MuteIcon({ size = 18, color = '#eaeaea' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <path d="M3 10v4h4l5 4V6L7 10H3z" fill={color} />
      <path d="M19 5L5 19" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}

export function PrevIcon({ size = 18, color = '#eaeaea' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <path d="M20 6v12l-8.5-6L20 6zM11 6v12L2.5 12 11 6z" fill={color} />
    </svg>
  )
}

export function NextIcon({ size = 18, color = '#eaeaea' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <path d="M4 18l8.5-6L4 6v12zm9 0l8.5-6L13 6v12z" fill={color} />
    </svg>
  )
}

export default { PlayIcon, PauseIcon, VolumeIcon, MuteIcon }
