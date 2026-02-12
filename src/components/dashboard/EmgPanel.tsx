import { useRef, useEffect, type MutableRefObject } from "react";
import { useTranslation } from "../../i18n";

interface EmgPanelProps {
  emgRef: MutableRefObject<number[]>;
}

export default function EmgPanel({ emgRef }: EmgPanelProps) {
  const { t } = useTranslation();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationId: number;

    const draw = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      const bw = Math.round(rect.width * dpr);
      const bh = Math.round(rect.height * dpr);
      if (canvas.width !== bw || canvas.height !== bh) {
        canvas.width = bw;
        canvas.height = bh;
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const channels = emgRef.current;
      const w = rect.width;
      const h = rect.height;
      const barHeight = h / 8;

      ctx.clearRect(0, 0, w, h);

      for (let i = 0; i < 8; i++) {
        const amplitude = Math.abs(channels[i]) / 128;
        const barWidth = amplitude * (w - 40);
        const y = i * barHeight;

        ctx.fillStyle = "#8b8b9a";
        ctx.font = "11px Inter, sans-serif";
        ctx.fillText(`${i + 1}`, 4, y + barHeight * 0.65);

        ctx.fillStyle = "#1c1c28";
        ctx.fillRect(24, y + 2, w - 28, barHeight - 4);

        ctx.fillStyle = "#00d4aa";
        ctx.globalAlpha = 0.3 + amplitude * 0.7;
        ctx.fillRect(24, y + 2, barWidth, barHeight - 4);
        ctx.globalAlpha = 1;
      }

      animationId = requestAnimationFrame(draw);
    };

    draw();
    return () => cancelAnimationFrame(animationId);
  }, [emgRef]);

  return (
    <div className="dashboard-panel">
      <div className="dashboard-panel__title">{t.dashboard.emgChannels}</div>
      <canvas ref={canvasRef} className="emg-canvas" />
    </div>
  );
}
