import { useState } from 'react'
import { resolveImageUrl } from '../api'

const AVATAR_COLORS = ['#00D98A','#00E5CC','#4F8EF7','#A066FA','#F066B0','#B5E853']
function hashColor(name: string): string {
  let h = 0
  for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h)
  return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length]
}

interface AvatarProps {
  src?: string | null
  name: string
  size?: number
  borderRadius?: number | string
  style?: React.CSSProperties
}

export default function Avatar({ src, name, size = 40, borderRadius, style }: AvatarProps) {
  const [error, setError] = useState(false)
  const color = hashColor(name)
  const initials = name.split(' ').filter(Boolean).map((w) => w[0]).join('').toUpperCase().slice(0, 2) || '?'
  const br = borderRadius ?? '50%'
  const resolved = resolveImageUrl(src)

  const base: React.CSSProperties = {
    width: size, height: size, borderRadius: br,
    flexShrink: 0, overflow: 'hidden',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: color, fontWeight: 700, fontSize: Math.round(size * 0.35),
    color: '#060C09',
    ...style,
  }

  if (resolved && !error) {
    return (
      <div style={base}>
        <img
          src={resolved}
          alt={name}
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          onError={() => setError(true)}
        />
      </div>
    )
  }

  return <div style={base}>{initials}</div>
}
