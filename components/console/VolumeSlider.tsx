import { useCallback, useRef } from 'react'

interface VolumeSliderProps {
  value: number
  onChange: (val: number) => void
}

export function VolumeSlider({ value, onChange }: VolumeSliderProps) {
  const trackRef = useRef<HTMLDivElement>(null)

  const updateFromPointer = useCallback(
    (clientX: number) => {
      if (!trackRef.current) return
      const rect = trackRef.current.getBoundingClientRect()
      const x = Math.max(0, Math.min(clientX - rect.left, rect.width))
      const newVal = rect.width > 0 ? x / rect.width : 0
      onChange(newVal)
    },
    [onChange]
  )

  const handlePointerDown = (e: React.PointerEvent) => {
    e.currentTarget.setPointerCapture(e.pointerId)
    updateFromPointer(e.clientX)
  }

  const handlePointerMove = (e: React.PointerEvent) => {
    if (e.buttons === 1) {
      updateFromPointer(e.clientX)
    }
  }

  return (
    <div className="vol">
      <span className="vol-cap">VOL</span>
      <div
        ref={trackRef}
        className="vol-track"
        tabIndex={0}
        role="slider"
        aria-valuenow={Math.round(value * 100)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Volume Slider"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
      >
        <div
          className="vol-knob"
          style={{ left: `calc(${Math.max(0, Math.min(1, value)) * 100}% - 11px)` }}
        />
      </div>
    </div>
  )
}
