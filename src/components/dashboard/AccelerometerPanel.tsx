import { useTranslation } from "../../i18n";
import { fmt } from "../../utils/imu";

interface AccelerometerPanelProps {
  accelerometer: number[];
}

export default function AccelerometerPanel({
  accelerometer,
}: AccelerometerPanelProps) {
  const { t } = useTranslation();

  return (
    <div className="dashboard-panel">
      <div className="dashboard-panel__title">{t.dashboard.accelerometer}</div>
      <div className="imu-rows">
        {["X", "Y", "Z"].map((axis, i) => (
          <div key={axis} className="imu-row">
            <span className="imu-axis">{axis}</span>
            <span className="imu-value">{fmt(accelerometer[i])} g</span>
          </div>
        ))}
      </div>
    </div>
  );
}
