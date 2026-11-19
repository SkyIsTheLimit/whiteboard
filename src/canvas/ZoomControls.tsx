import { CornersOutIcon, MinusIcon, PlusIcon } from '@phosphor-icons/react'

export function ZoomControls({
  zoom,
  zoomTo,
  fit,
}: {
  zoom: number
  zoomTo(value: number): void
  fit(): void
}) {
  return (
    <div
      className="absolute right-3.5 bottom-3.5 flex h-10 items-center gap-px rounded-xl border bg-background/5 px-1 shadow-sm backdrop-blur-2xl"
      role="group"
      aria-label="Zoom controls"
    >
      <button
        type="button"
        className="grid h-9 min-w-8 place-items-center rounded-md hover:bg-accent"
        onClick={() => zoomTo(zoom / 1.2)}
        aria-label="Zoom out"
        title="Zoom out"
      >
        <MinusIcon className="size-4" />
      </button>
      <button
        type="button"
        className="grid h-9 min-w-14 place-items-center rounded-md text-sm tabular-nums hover:bg-accent"
        onClick={() => zoomTo(1)}
        aria-label="Reset zoom"
        title="Reset zoom"
      >
        {Math.round(zoom * 100)}%
      </button>
      <button
        type="button"
        className="grid h-9 min-w-8 place-items-center rounded-md hover:bg-accent"
        onClick={() => zoomTo(zoom * 1.2)}
        aria-label="Zoom in"
        title="Zoom in"
      >
        <PlusIcon className="size-4" />
      </button>
      <button
        type="button"
        className="grid h-9 min-w-8 place-items-center rounded-r-md border-l hover:bg-accent"
        onClick={fit}
        aria-label="Zoom to fit"
        title="Zoom to fit"
      >
        <CornersOutIcon className="size-5" />
      </button>
    </div>
  )
}
