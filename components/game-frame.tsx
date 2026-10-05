"use client"

import { useRef } from "react"

/**
 * A game in an iframe, ready to play: focused on load and on any click, with
 * the permissions a game needs granted to the cross-origin frame.
 *
 * The focus part is the load-bearing half. A freshly loaded iframe does not
 * have the keyboard - the page around it does - so WASD, Space and Escape
 * type into nothing until the frame is focused. Focusing on load gives the
 * keys to the game from the first keystroke; focusing on click takes them
 * back after a stray click outside the frame. focus() on a cross-origin
 * window is one of the few calls browsers still allow.
 */
export function GameFrame({
  src,
  title,
  className,
}: {
  src: string
  title: string
  className?: string
}) {
  const frameRef = useRef<HTMLIFrameElement>(null)

  const focusGame = () => frameRef.current?.contentWindow?.focus()

  return (
    <div className={className} onClick={focusGame}>
      <iframe
        ref={frameRef}
        src={src}
        title={title}
        allow="fullscreen; pointer-lock; gamepad"
        onLoad={focusGame}
        className="h-full w-full border-0 bg-white"
      />
    </div>
  )
}
