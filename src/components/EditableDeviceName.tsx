import { useState, useRef, useEffect } from "react";
import { useTranslation } from "../i18n";

interface EditableDeviceNameProps {
  name: string;
  onChange: (newName: string) => void;
}

export default function EditableDeviceName({
  name,
  onChange,
}: EditableDeviceNameProps) {
  const { t } = useTranslation();
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(name);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const commit = () => {
    const trimmed = draft.trim();
    if (trimmed && trimmed !== name) {
      onChange(trimmed);
    } else {
      setDraft(name);
    }
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <input
        ref={inputRef}
        className="header__device-name header__device-name--editing"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") commit();
          if (e.key === "Escape") {
            setDraft(name);
            setIsEditing(false);
          }
        }}
        maxLength={30}
      />
    );
  }

  return (
    <span
      className="header__device-name header__device-name--clickable"
      onClick={() => {
        setDraft(name);
        setIsEditing(true);
      }}
      title={t.header.editNameTooltip}
    >
      {name}
      <svg
        width="12"
        height="12"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <path d="M17 3a2.83 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
      </svg>
    </span>
  );
}
