import { useTranslation } from "../../i18n";
import { quaternionToEuler, fmt } from "../../utils/imu";

interface OrientationPanelProps {
  orientation: number[];
}

export default function OrientationPanel({
  orientation,
}: OrientationPanelProps) {
  const { t } = useTranslation();
  const euler = quaternionToEuler(orientation);

  return (
    <div className="dashboard-panel">
      <div className="dashboard-panel__title">{t.dashboard.orientation}</div>
      <div className="imu-rows">
        <div className="imu-row">
          <span className="imu-axis">{t.dashboard.roll}</span>
          <span className="imu-value">{fmt(euler.roll)}&deg;</span>
        </div>
        <div className="imu-row">
          <span className="imu-axis">{t.dashboard.pitch}</span>
          <span className="imu-value">{fmt(euler.pitch)}&deg;</span>
        </div>
        <div className="imu-row">
          <span className="imu-axis">{t.dashboard.yaw}</span>
          <span className="imu-value">{fmt(euler.yaw)}&deg;</span>
        </div>
      </div>
    </div>
  );
}
