import type { DiscoveredDevice, ConnectionState } from "../services/ble";
import { useTranslation } from "../i18n";
import DeviceCard from "./DeviceCard";

interface DeviceScannerProps {
  devices: DiscoveredDevice[];
  isScanning: boolean;
  connectionStates: Record<string, ConnectionState>;
  onConnect: (deviceId: string) => void;
  onDisconnect: () => void;
}

export default function DeviceScanner({
  devices,
  isScanning,
  connectionStates,
  onConnect,
  onDisconnect,
}: DeviceScannerProps) {
  const { t } = useTranslation();

  if (devices.length === 0) {
    return (
      <div className="device-list">
        <div className="device-list__empty">
          {isScanning ? (
            <>
              <span className="spinner" style={{ width: 32, height: 32 }} />
              <p>{t.scanner.scanning}</p>
              <p className="device-list__empty-hint">
                {t.scanner.poweredOnHint}
              </p>
            </>
          ) : (
            <>
              <div className="device-list__empty-icon">
                <svg
                  width="48"
                  height="48"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M6.5 6.5l11 11L12 23V1l5.5 5.5-11 11" />
                </svg>
              </div>
              <p>{t.scanner.noDevices}</p>
              <p className="device-list__empty-hint">{t.scanner.scanHint}</p>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="device-list">
      {isScanning && (
        <div className="scan-indicator">
          <span className="spinner" />
          <span>{t.scanner.scanningShort}</span>
        </div>
      )}
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
  );
}
