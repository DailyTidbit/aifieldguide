import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const alt = 'AI Field Guide — Your Guide to AI Tools'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '1200px',
          height: '630px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #0f2318 0%, #1a3828 40%, #0d1f30 100%)',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Soft radial glow */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '800px',
            height: '500px',
            background: 'radial-gradient(ellipse, rgba(96,168,117,0.18) 0%, transparent 70%)',
            display: 'flex',
          }}
        />

        {/* Top accent line */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '5px',
            background: 'linear-gradient(90deg, #60A875, #59B1E3)',
            display: 'flex',
          }}
        />

        {/* Compass icon */}
        <div style={{ fontSize: '96px', marginBottom: '28px', display: 'flex', lineHeight: 1 }}>
          🧭
        </div>

        {/* Title */}
        <div
          style={{
            fontSize: '80px',
            fontWeight: 800,
            color: '#ffffff',
            letterSpacing: '-3px',
            display: 'flex',
            marginBottom: '16px',
            lineHeight: 1,
          }}
        >
          AI Field Guide
        </div>

        {/* Divider */}
        <div
          style={{
            width: '80px',
            height: '3px',
            background: '#60A875',
            marginBottom: '20px',
            borderRadius: '2px',
            display: 'flex',
          }}
        />

        {/* Subtitle */}
        <div
          style={{
            fontSize: '34px',
            color: '#9dd4b0',
            display: 'flex',
            marginBottom: '40px',
            letterSpacing: '-0.5px',
          }}
        >
          Your Guide to AI Tools
        </div>

        {/* Domain pill */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            background: 'rgba(255,255,255,0.07)',
            border: '1px solid rgba(255,255,255,0.12)',
            borderRadius: '999px',
            padding: '10px 28px',
          }}
        >
          <div
            style={{
              fontSize: '22px',
              color: 'rgba(255,255,255,0.5)',
              display: 'flex',
              letterSpacing: '0.5px',
            }}
          >
            aifieldguide.org
          </div>
        </div>
      </div>
    ),
    { ...size }
  )
}
