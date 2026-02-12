import { useTranslation } from "../../i18n";

interface MotionIntensityPanelProps {
  accelerometer: number[];
  gyroscope: number[];
}

function magnitude(v: number[]): number {
  return Math.sqrt(v.reduce((sum, x) => sum + x * x, 0));
}

export default function MotionIntensityPanel({
  accelerometer,
  gyroscope,
}: MotionIntensityPanelProps) {
  const { t } = useTranslation();

  // Accelerometer magnitude (subtract 1g gravity for "motion" component)
  const accelMag = Math.max(0, magnitude(accelerometer) - 1);
  const accelPercent = Math.min(100, (accelMag / 4) * 100);

  // Gyroscope magnitude (normalized to ~500 deg/s max)
  const gyroMag = magnitude(gyroscope);
  const gyroPercent = Math.min(100, (gyroMag / 500) * 100);

  return (
    <div className="dashboard-panel">
      <div className="dashboard-panel__title">
        {t.dashboard.motionIntensity}
      </div>
      <div className="motion-intensity">
        <div className="motion-bar">
          <div className="motion-bar__header">
            <span className="motion-bar__label">
              {t.dashboard.accelMagnitude}
            </span>
            <span className="motion-bar__value">{accelMag.toFixed(2)} g</span>
          </div>
          <div className="motion-bar__track">
            <div
              className="motion-bar__fill"
              style={{ width: `${accelPercent}%` }}
            />
          </div>
        </div>
        <div className="motion-bar">
          <div className="motion-bar__header">
            <span className="motion-bar__label">
              {t.dashboard.gyroMagnitude}
            </span>
            <span className="motion-bar__value">
              {gyroMag.toFixed(1)}&deg;/s
            </span>
          </div>
          <div className="motion-bar__track">
            <div
              className="motion-bar__fill motion-bar__fill--secondary"
              style={{ width: `${gyroPercent}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
