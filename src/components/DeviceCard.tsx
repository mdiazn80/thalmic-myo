import type { DiscoveredDevice, ConnectionState } from "../services/ble";
import { useTranslation } from "../i18n";

interface DeviceCardProps {
  device: DiscoveredDevice;
  connectionState: ConnectionState;
  onConnect: (deviceId: string) => void;
  onDisconnect: () => void;
}

function rssiToBars(rssi: number | null): number {
  if (rssi === null) return 0;
  if (rssi >= -50) return 4;
  if (rssi >= -65) return 3;
  if (rssi >= -80) return 2;
  return 1;
}

export default function DeviceCard({
  device,
  connectionState,
  onConnect,
  onDisconnect,
}: DeviceCardProps) {
  const { t } = useTranslation();
  const isConnected = connectionState === "connected";
  const isConnecting = connectionState === "connecting";
  const isDisconnecting = connectionState === "disconnecting";
  const isBusy = isConnecting || isDisconnecting;

  const cardClass = [
    "device-card",
    device.is_myo && "device-card--myo",
    isConnected && "device-card--connected",
  ]
    .filter(Boolean)
    .join(" ");

  const indicatorClass = [
    "device-card__indicator",
    device.is_myo && "device-card__indicator--myo",
    isConnected && "device-card__indicator--connected",
  ]
    .filter(Boolean)
    .join(" ");

  const displayName = device.name ?? t.deviceCard.unknownDevice;
  const bars = rssiToBars(device.rssi);

  const rssiLabel = (rssi: number | null): string => {
    if (rssi === null) return t.deviceCard.rssiNA;
    if (rssi >= -50) return t.deviceCard.rssiExcellent;
    if (rssi >= -65) return t.deviceCard.rssiGood;
    if (rssi >= -80) return t.deviceCard.rssiFair;
    return t.deviceCard.rssiWeak;
  };

  return (
    <div className={cardClass}>
      <div className={indicatorClass} />
      <div className="device-card__info">
        <div className="device-card__name">{displayName}</div>
        <div className="device-card__meta">
          <span className="device-card__rssi">
            {[1, 2, 3, 4].map((level) => (
              <span
                key={level}
                style={{
                  display: "inline-block",
                  width: 3,
                  height: 4 + level * 3,
                  borderRadius: 1,
                  marginRight: 1,
                  backgroundColor:
                    level <= bars
                      ? "var(--color-primary)"
                      : "var(--color-text-muted)",
                  opacity: level <= bars ? 1 : 0.3,
                }}
              />
            ))}
            {device.rssi !== null && (
              <span style={{ marginLeft: 4 }}>{device.rssi} dBm</span>
            )}
          </span>
          {device.rssi !== null && <span>{rssiLabel(device.rssi)}</span>}
          {device.is_myo && <span className="device-card__tag">Myo</span>}
        </div>
      </div>
      <div className="device-card__action">
        {isConnected ? (
          <button
            className="btn btn--danger btn--sm"
            onClick={onDisconnect}
            disabled={isBusy}
          >
            {t.deviceCard.disconnect}
          </button>
        ) : (
          <button
            className="btn btn--primary btn--sm"
            onClick={() => onConnect(device.id)}
            disabled={isBusy || !device.is_myo}
            title={!device.is_myo ? t.deviceCard.onlyMyoTooltip : undefined}
          >
            {isConnecting ? (
              <>
                <span className="spinner" /> {t.deviceCard.connecting}
              </>
            ) : (
              t.deviceCard.connect
            )}
          </button>
        )}
      </div>
    </div>
  );
}
