import type { ConnectorStrokeStyle } from '../shared/model'
import { CanvasToolButton } from './CanvasToolButton'

const styles = [
  { value: 'solid', label: 'Solid', line: 'border-solid' },
  { value: 'dashed', label: 'Dashed', line: 'border-dashed' },
  { value: 'dotted', label: 'Dotted', line: 'border-dotted' },
] as const

export function ConnectorStrokeButtons({
  value,
  onChange,
}: {
  value: ConnectorStrokeStyle
  onChange: (style: ConnectorStrokeStyle) => void
}) {
  return (
    <div role="group" aria-label="Stroke style" className="flex items-center">
      {styles.map((style) => (
        <CanvasToolButton
          key={style.value}
          label={style.label}
          aria-pressed={value === style.value}
          onClick={() => onChange(style.value)}
        >
          <span
            aria-hidden="true"
            className={`w-4 border-t-2 border-current ${style.line}`}
          />
        </CanvasToolButton>
      ))}
    </div>
  )
}
