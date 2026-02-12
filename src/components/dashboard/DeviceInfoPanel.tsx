import type { DeviceInfo } from "../../services/ble";
import { useTranslation } from "../../i18n";

interface DeviceInfoPanelProps {
  deviceInfo: DeviceInfo | null;
  batteryLevel: number | null;
}

export default function DeviceInfoPanel({
  deviceInfo,
  batteryLevel,
}: DeviceInfoPanelProps) {
  const { t } = useTranslation();

  return (
    <div className="dashboard-panel">
      <div className="dashboard-panel__title">{t.dashboard.deviceInfo}</div>
      <div className="device-info-grid">
        <div className="device-info-row">
          <span className="device-info-label">{t.dashboard.firmware}</span>
          <span className="device-info-value">
            {deviceInfo?.firmware_version ?? "\u2026"}
          </span>
        </div>
        <div className="device-info-row">
          <span className="device-info-label">{t.dashboard.serial}</span>
          <span className="device-info-value">
            {deviceInfo?.serial_number ?? "\u2026"}
          </span>
        </div>
        <div className="device-info-row">
          <span className="device-info-label">{t.dashboard.battery}</span>
          <span className="device-info-value">
            {batteryLevel !== null ? `${batteryLevel}%` : "\u2026"}
          </span>
        </div>
      </div>
    </div>
  );
}
