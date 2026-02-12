import type { ConnectionState } from "../services/ble";
import { useTranslation } from "../i18n";

interface StatusBarProps {
  isScanning: boolean;
  connectedDeviceName: string | null;
  connectionState: ConnectionState;
  deviceCount: number;
  error: string | null;
}

export default function StatusBar({
  isScanning,
  connectedDeviceName,
  connectionState,
  deviceCount,
  error,
}: StatusBarProps) {
  const { t } = useTranslation();
  let dotClass = "status-bar__dot";
  let statusText: string;

  if (error) {
    dotClass += " status-bar__dot--error";
    statusText = error;
  } else if (connectionState === "connected" && connectedDeviceName) {
    dotClass += " status-bar__dot--connected";
    statusText = `${t.statusBar.connectedTo} ${connectedDeviceName}`;
  } else if (connectionState === "connecting") {
    dotClass += " status-bar__dot--scanning";
    statusText = t.statusBar.connecting;
  } else if (isScanning) {
    dotClass += " status-bar__dot--scanning";
    const unit = deviceCount !== 1 ? t.statusBar.devices : t.statusBar.device;
    statusText = `${t.statusBar.scanning} (${deviceCount} ${unit} ${t.statusBar.found})`;
  } else {
    statusText = t.statusBar.ready;
  }

  return (
    <div className="status-bar">
      <span className={dotClass} />
      <span>{statusText}</span>
      <span className="status-bar__version">v{__APP_VERSION__}</span>
    </div>
  );
}
