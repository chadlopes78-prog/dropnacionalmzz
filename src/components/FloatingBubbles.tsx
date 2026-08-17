import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

export interface FloatingBubblesProps extends ComponentProps<"div"> {
  /** Número de bolhas renderizadas. Mantido baixo por omissão para não pesar em mobile. */
  count?: number;
}

interface BubbleSpec {
  left: number;
  size: number;
  duration: number;
  delay: number;
  opacity: number;
}

/**
 * Gera especificações determinísticas (sem Math.random) para evitar
 * divergências de hidratação entre SSR e cliente.
 */
function buildBubbles(count: number): BubbleSpec[] {
  return Array.from({ length: count }, (_, i) => {
    const golden = (i * 137.508) % 100;
    return {
      left: golden,
      size: 12 + ((i * 17) % 46),
      duration: 16 + ((i * 7) % 16),
      delay: -((i * 3.5) % 20),
      opacity: 0.12 + ((i * 13) % 20) / 100,
    };
  });
}

export function FloatingBubbles({ count = 14, className, ...props }: FloatingBubblesProps) {
  const bubbles = buildBubbles(count);

  return (
    <div
      aria-hidden="true"
      className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)}
      {...props}
    >
      {bubbles.map((b, i) => (
        <span
          key={i}
          className="bubble"
          style={{
            left: `${b.left}%`,
            width: `${b.size}px`,
            height: `${b.size}px`,
            animationDuration: `${b.duration}s`,
            animationDelay: `${b.delay}s`,
            opacity: b.opacity,
          }}
        />
      ))}
    </div>
  );
}
