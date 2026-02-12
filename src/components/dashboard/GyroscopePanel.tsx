import { useTranslation } from "../../i18n";
import { fmt } from "../../utils/imu";

interface GyroscopePanelProps {
  gyroscope: number[];
}

export default function GyroscopePanel({ gyroscope }: GyroscopePanelProps) {
  const { t } = useTranslation();

  return (
    <div className="dashboard-panel">
      <div className="dashboard-panel__title">{t.dashboard.gyroscope}</div>
      <div className="imu-rows">
        {["X", "Y", "Z"].map((axis, i) => (
          <div key={axis} className="imu-row">
            <span className="imu-axis">{axis}</span>
            <span className="imu-value">{fmt(gyroscope[i])}&deg;/s</span>
          </div>
        ))}
      </div>
    </div>
  );
}
