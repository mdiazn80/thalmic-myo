# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Code Style

All code comments, documentation, commit messages, and PR descriptions must be written in English, regardless of the language used in conversation.

## Project Overview

Desktop application for interfacing with the Thalmic Myo armband via Bluetooth Low Energy (BLE). Replaces the discontinued official Myo software. Built with Tauri 2 + React 19 + TypeScript + Rust. Uses pnpm as the package manager.

## Commands

This project uses [go-task](https://taskfile.dev/) as task runner. See `Taskfile.yml` for all available tasks.

```bash
task install           # Install all dependencies (frontend + Rust)
task dev               # Start the full Tauri app in dev mode
task dev:frontend      # Start only the Vite frontend dev server (port 1420)
task build             # Production build (frontend + Rust)
task build:frontend    # Build only the frontend
task clean             # Remove all build artifacts and dependencies
task clean:frontend    # Remove frontend artifacts and node_modules
task clean:rust        # Remove Rust build artifacts (cargo clean)
```

### Rust-specific

```bash
cd src-tauri && cargo check    # Type-check Rust code without building
cd src-tauri && cargo test     # Run Rust tests
```

## Architecture

```
React Frontend                    Rust Backend (Tauri)
─────────────────                 ────────────────────
App.tsx (state + routing)         lib.rs (setup + command registration)
  ├─ Header.tsx                     └─ ble/
  │    ├─ BatteryIndicator.tsx          ├─ mod.rs
  │    ├─ EditableDeviceName.tsx        ├─ myo_protocol.rs  (BLE UUIDs, parsers)
  │    └─ LanguageSelector.tsx          ├─ manager.rs       (scan/connect/stream)
  ├─ DeviceScanner.tsx                  ├─ commands.rs      (Tauri command handlers)
  │    └─ DeviceCard.tsx                ├─ streaming.rs     (high-freq data stream)
  ├─ Dashboard.tsx (3-col grid)         └─ device_info.rs   (one-shot reads)
  │    ├─ EmgPanel.tsx (canvas)
  │    ├─ EmgEnvelopePanel.tsx (canvas)
  │    ├─ OrientationPanel.tsx
  │    ├─ AccelerometerPanel.tsx
  │    ├─ GyroscopePanel.tsx
  │    ├─ MotionIntensityPanel.tsx
  │    ├─ ConnectionPanel.tsx
  │    └─ DeviceInfoPanel.tsx
  └─ StatusBar.tsx

hooks/useMyoStream.ts ──Channel──►  streaming.rs (200Hz EMG, 50Hz IMU)
services/ble.ts ──invoke()──►  commands.rs
services/ble.ts ◄──emit()────  manager.rs
```

### Frontend ↔ Backend Communication

- **Commands** (`invoke`): Request/response — `ble_start_scan`, `ble_stop_scan`, `ble_connect`, `ble_disconnect`, `ble_get_devices`, `myo_start_stream`, `myo_stop_stream`, `myo_get_device_info`
- **Events** (`emit`): Async notifications — `ble:device-discovered`, `ble:connection-changed`
- **Channels** (`Channel<T>`): High-throughput streaming — `MyoStreamMessage` (EMG/IMU/Classifier/Battery)
- TypeScript types in `src/services/ble.ts` must mirror Rust serde types in `src-tauri/src/ble/`

### Data Streaming Architecture

- EMG at 200Hz writes to `useRef` (not setState), read by canvas via `requestAnimationFrame` — avoids React re-render bottleneck
- IMU at 50Hz uses setState (acceptable render frequency)
- Battery polled every 30s in the Rust streaming task
- Stream lifecycle managed by `tokio::sync::watch` shutdown signal

### BLE / Myo Protocol

- Uses `btleplug` crate for cross-platform BLE communication
- Myo BLE UUIDs defined in `src-tauri/src/ble/myo_protocol.rs` (base: `d506XXXX-a904-deb9-4748-2c7f4a124842`)
- BLE state managed as `Arc<Mutex<BleManager>>` via Tauri's `app.manage()`
- Protocol reference: [thalmiclabs/myo-bluetooth](https://github.com/thalmiclabs/myo-bluetooth)

### i18n (Internationalization)

- React Context-based, no external library — `src/i18n/`
- `types.ts` defines `Translations` interface (compile-time type safety)
- `en.ts` / `es.ts` — translation files per language
- `index.tsx` — `I18nProvider` context + `useTranslation()` hook
- Language auto-detected from browser, persisted in localStorage (`thalmic-myo-locale`)
- Usage: `const { t } = useTranslation(); ... t.dashboard.emgChannels`
- All user-facing strings must be in translation files, never hardcoded

### UI Theme

Dark theme with turquoise (`#00d4aa`) as the brand color. CSS design tokens defined in `src/App.css` `:root` block. All components use BEM-style class naming. Dashboard uses a 3-column CSS grid.

### macOS Bluetooth

- `src-tauri/Info.plist` — `NSBluetoothAlwaysUsageDescription` for permission dialog
- `src-tauri/Entitlements.plist` — `com.apple.security.device.bluetooth` sandbox entitlement
- During development, grant Bluetooth permission to your terminal app in System Settings

### Tauri Capabilities

Permissions are declared in `src-tauri/capabilities/default.json`. New plugins or APIs require adding permissions there.

### Vite Config Notes

- Port is fixed at 1420 (required by Tauri dev)
- HMR uses port 1421
- `src-tauri/` is excluded from file watching
- Screen clear is disabled to preserve Rust compiler output
