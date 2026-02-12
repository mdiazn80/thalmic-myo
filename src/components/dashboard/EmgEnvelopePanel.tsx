import { useRef, useEffect, type MutableRefObject } from "react";
import { useTranslation } from "../../i18n";

interface EmgEnvelopePanelProps {
  emgRef: MutableRefObject<number[]>;
}

const BUFFER_SIZE = 20;

export default function EmgEnvelopePanel({ emgRef }: EmgEnvelopePanelProps) {
  const { t } = useTranslation();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const bufferRef = useRef<number[][]>(
    Array.from({ length: 8 }, () => new Array(BUFFER_SIZE).fill(0))
  );
  const idxRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationId: number;

    const draw = () => {
      const channels = emgRef.current;
      const buffer = bufferRef.current;
      const idx = idxRef.current % BUFFER_SIZE;

      // Store current samples
      for (let ch = 0; ch < 8; ch++) {
        buffer[ch][idx] = channels[ch];
      }
      idxRef.current++;

      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      const bw = Math.round(rect.width * dpr);
      const bh = Math.round(rect.height * dpr);
      if (canvas.width !== bw || canvas.height !== bh) {
        canvas.width = bw;
        canvas.height = bh;
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const w = rect.width;
      const h = rect.height;
      const barWidth = (w - 16) / 8;

      ctx.clearRect(0, 0, w, h);

      for (let ch = 0; ch < 8; ch++) {
        // Compute RMS
        let sumSq = 0;
        for (let j = 0; j < BUFFER_SIZE; j++) {
          sumSq += buffer[ch][j] * buffer[ch][j];
        }
        const rms = Math.sqrt(sumSq / BUFFER_SIZE) / 128;
        const barHeight = rms * (h - 24);

        const x = 8 + ch * barWidth;
        const y = h - 12 - barHeight;

        // Background bar
        ctx.fillStyle = "#1c1c28";
        ctx.fillRect(x + 2, 12, barWidth - 4, h - 24);

        // Fill bar with gradient intensity
        const alpha = 0.4 + rms * 0.6;
        ctx.fillStyle = `rgba(0, 212, 170, ${alpha})`;
        ctx.fillRect(x + 2, y, barWidth - 4, barHeight);

        // Channel label
        ctx.fillStyle = "#8b8b9a";
        ctx.font = "10px Inter, sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(`${ch + 1}`, x + barWidth / 2, h - 1);
      }

      animationId = requestAnimationFrame(draw);
    };

    draw();
    return () => cancelAnimationFrame(animationId);
  }, [emgRef]);

  return (
    <div className="dashboard-panel">
      <div className="dashboard-panel__title">{t.dashboard.emgEnvelope}</div>
      <canvas
        ref={canvasRef}
        className="emg-canvas emg-canvas--envelope"
      />
    </div>
  );
}
