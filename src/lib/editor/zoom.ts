import type { ZoomCut } from "@/lib/editor/types";

export function zoomAt(cuts: ZoomCut[], time: number) {
  const active = [...cuts]
    .sort((a, b) => a.start - b.start)
    .find((cut) => time >= cut.start && time <= cut.start + cut.duration);

  if (!active) {
    return { scale: 1, x: 50, y: 50 };
  }

  const t = Math.min(1, Math.max(0, (time - active.start) / Math.max(0.01, active.duration)));
  const ease = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
  const target = active.kind === "out" ? 1 : active.scale;
  const from = active.kind === "out" ? active.scale : 1;
  return {
    scale: from + (target - from) * ease,
    x: active.x,
    y: active.y,
  };
}

export function suggestZoomCuts(duration: number): ZoomCut[] {
  if (duration < 4) {
    return [
      {
        id: `zoom-${Date.now().toString(36)}`,
        kind: "in",
        start: 0.4,
        duration: Math.min(1.8, duration * 0.5),
        scale: 1.35,
        x: 50,
        y: 42,
      },
    ];
  }

  return [
    {
      id: `zoom-in-${Date.now().toString(36)}`,
      kind: "in",
      start: Math.min(1.2, duration * 0.08),
      duration: Math.min(1.6, duration * 0.12),
      scale: 1.45,
      x: 50,
      y: 40,
    },
    {
      id: `zoom-out-${(Date.now() + 1).toString(36)}`,
      kind: "out",
      start: Math.max(duration * 0.55, 3),
      duration: Math.min(1.4, duration * 0.1),
      scale: 1.35,
      x: 50,
      y: 50,
    },
  ];
}
