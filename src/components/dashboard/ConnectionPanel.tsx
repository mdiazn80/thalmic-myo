import type { DiscoveredDevice, ConnectionState } from "../../services/ble";
import { useTranslation } from "../../i18n";
import DeviceCard from "../DeviceCard";

interface ConnectionPanelProps {
  devices: DiscoveredDevice[];
  isScanning: boolean;
  connectionStates: Record<string, ConnectionState>;
  connectedDeviceName: string | null;
  onScanToggle: () => void;
  onConnect: (deviceId: string) => void;
  onDisconnect: () => void;
  scanDisabled: boolean;
}

export default function ConnectionPanel({
  devices,
  isScanning,
  connectionStates,
  connectedDeviceName,
  onScanToggle,
  onConnect,
  onDisconnect,
  scanDisabled,
}: ConnectionPanelProps) {
  const { t } = useTranslation();
  const isConnected = !!connectedDeviceName;

  return (
    <div className="dashboard-panel">
      <div className="dashboard-panel__title">{t.connection.title}</div>
      {isConnected ? (
        <div className="connection-panel">
          <div className="connection-panel__status">
            <span className="connection-panel__dot connection-panel__dot--connected" />
            <span className="connection-panel__name">{connectedDeviceName}</span>
          </div>
          <button
            className="btn btn--danger btn--sm"
            onClick={onDisconnect}
          >
            {t.connection.disconnect}
          </button>
        </div>
      ) : (
        <div className="connection-panel">
          <div className="connection-panel__status">
            <span className="connection-panel__dot" />
            <span className="connection-panel__hint">
              {t.connection.notConnected}
            </span>
          </div>
          <div className="connection-panel__actions">
            <button
              className={`btn btn--sm ${isScanning ? "btn--secondary" : "btn--primary"}`}
              onClick={onScanToggle}
              disabled={scanDisabled}
            >
              {isScanning && <span className="spinner" />}
              {isScanning ? t.header.stop : t.header.scan}
            </button>
          </div>
          {devices.length > 0 && (
            <div className="connection-panel__devices">
              {devices.map((device) => (
                <DeviceCard
                  key={device.id}
                  device={device}
                  connectionState={connectionStates[device.id] ?? "disconnected"}
                  onConnect={onConnect}
                  onDisconnect={onDisconnect}
                />
              ))}
            </div>
          )}
          {isScanning && devices.length === 0 && (
            <div className="connection-panel__scanning">
              <span className="spinner" />
              <span>{t.scanner.scanningShort}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
