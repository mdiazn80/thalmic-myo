import { useTranslation } from "../i18n";

interface BatteryIndicatorProps {
  level: number | null;
}

export default function BatteryIndicator({ level }: BatteryIndicatorProps) {
  const { t } = useTranslation();

  if (level === null) return null;

  const fillColor =
    level > 50
      ? "var(--color-primary)"
      : level > 20
        ? "var(--color-warning)"
        : "var(--color-error)";

  const fillWidth = Math.max(0, Math.min(100, level)) * 0.2;

  return (
    <div className="battery-indicator" title={`${t.dashboard.batteryTooltip}: ${level}%`}>
      <svg width="28" height="14" viewBox="0 0 28 14">
        <rect
          x="0" y="1" width="24" height="12" rx="2" ry="2"
          fill="none" stroke="var(--color-text-secondary)" strokeWidth="1.5"
        />
        <rect
          x="24.5" y="4" width="2.5" height="6" rx="1"
          fill="var(--color-text-secondary)"
        />
        <rect x="2" y="3" width={fillWidth} height="8" rx="1" fill={fillColor} />
      </svg>
      <span className="battery-indicator__text">{level}%</span>
    </div>
  );
}
