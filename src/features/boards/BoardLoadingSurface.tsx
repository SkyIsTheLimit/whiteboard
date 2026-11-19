import { DrawingToolbar } from '@/canvas/DrawingToolbar'
import { TooltipProvider } from '@/components/ui/tooltip'

function ignore() {}

export function BoardLoadingSurface() {
  return (
    <main
      aria-label="Board loading"
      aria-busy="true"
      className="relative h-dvh bg-(--board-bg)"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle,var(--board-border)_1px,transparent_1px)] bg-size-[20px_20px] opacity-50"
      />
      <div className="absolute top-0 left-0 z-10 m-2 p-2">
        <TooltipProvider delay={300}>
          <DrawingToolbar
            tool="select"
            setTool={ignore}
            shape="rectangle"
            setShape={ignore}
            disabled
          />
        </TooltipProvider>
      </div>
    </main>
  )
}
