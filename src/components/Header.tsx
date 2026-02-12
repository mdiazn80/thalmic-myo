import { useTranslation } from "../i18n";
import BatteryIndicator from "./BatteryIndicator";
import EditableDeviceName from "./EditableDeviceName";
import LanguageSelector from "./LanguageSelector";

interface HeaderProps {
  connectedDeviceName?: string | null;
  batteryLevel?: number | null;
  onDeviceNameChange?: (name: string) => void;
}

export default function Header({
  connectedDeviceName,
  batteryLevel,
  onDeviceNameChange,
}: HeaderProps) {
  const { t } = useTranslation();
  const isConnected = !!connectedDeviceName;

  return (
    <header className="header">
      <div className="header__brand">
        <svg
          className="header__logo"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M6.5 6.5l11 11L12 23V1l5.5 5.5-11 11" />
        </svg>
        <span className="header__title">{t.header.title}</span>
        {isConnected && onDeviceNameChange && (
          <EditableDeviceName
            name={connectedDeviceName}
            onChange={onDeviceNameChange}
          />
        )}
      </div>
      <div className="header__actions">
        <LanguageSelector />
        {isConnected && <BatteryIndicator level={batteryLevel ?? null} />}
      </div>
    </header>
  );
}
