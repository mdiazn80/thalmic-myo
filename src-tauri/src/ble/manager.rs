use btleplug::api::{Central, CentralEvent, Manager as _, Peripheral as _, ScanFilter};
use btleplug::platform::{Adapter, Manager, Peripheral};
use futures::StreamExt;
use serde::Serialize;
use std::collections::HashMap;
use std::sync::Arc;
use tauri::{AppHandle, Emitter};
use tokio::sync::Mutex;

use super::{device_info, myo_protocol, streaming};

// ---------- Public types ----------

#[derive(Debug, Clone, Serialize)]
pub struct DiscoveredDevice {
    pub id: String,
    pub name: Option<String>,
    pub rssi: Option<i16>,
    pub is_myo: bool,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "snake_case")]
pub enum ConnectionState {
    Disconnected,
    Connecting,
    Connected,
    Disconnecting,
}

#[derive(Debug, Clone, Serialize)]
pub struct ConnectionEvent {
    pub device_id: String,
    pub state: ConnectionState,
}

// ---------- Error ----------

#[derive(Debug, thiserror::Error)]
pub enum BleError {
    #[error("BLE not available: {0}")]
    NotAvailable(String),
    #[error("Device not found: {0}")]
    DeviceNotFound(String),
    #[error("Connection failed: {0}")]
    ConnectionFailed(String),
    #[error("Already scanning")]
    AlreadyScanning,
    #[error("Not scanning")]
    NotScanning,
    #[error("{0}")]
    Btleplug(#[from] btleplug::Error),
}

impl Serialize for BleError {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: serde::Serializer,
    {
        serializer.serialize_str(&self.to_string())
    }
}

// ---------- BLE Manager ----------

pub struct BleManager {
    adapter: Option<Adapter>,
    is_scanning: bool,
    peripherals: HashMap<String, Peripheral>,
    connected_peripheral: Option<Peripheral>,
    stream_handle: Option<streaming::StreamHandle>,
}

impl BleManager {
    pub fn new() -> Self {
        Self {
            adapter: None,
            is_scanning: false,
            peripherals: HashMap::new(),
            connected_peripheral: None,
            stream_handle: None,
        }
    }

    /// Initialize the BLE adapter. Idempotent if already initialized.
    pub async fn initialize(&mut self) -> Result<(), BleError> {
        if self.adapter.is_some() {
            return Ok(());
        }
        let manager = Manager::new().await?;
        let adapters = manager.adapters().await?;
        let adapter = adapters
            .into_iter()
            .next()
            .ok_or_else(|| BleError::NotAvailable("No Bluetooth adapter found".into()))?;
        self.adapter = Some(adapter);
        Ok(())
    }

    fn adapter(&self) -> Result<&Adapter, BleError> {
        self.adapter
            .as_ref()
            .ok_or_else(|| BleError::NotAvailable("BLE not initialized".into()))
    }

    /// Start scanning for BLE devices. Emits "ble:device-discovered" events.
    pub async fn start_scan(
        manager: Arc<Mutex<Self>>,
        app: AppHandle,
    ) -> Result<(), BleError> {
        let adapter = {
            let mut mgr = manager.lock().await;
            if mgr.is_scanning {
                return Err(BleError::AlreadyScanning);
            }
            mgr.is_scanning = true;
            mgr.peripherals.clear();
            mgr.adapter()?.clone()
        };

        let filter = ScanFilter {
            services: vec![myo_protocol::control_service()],
        };
        adapter.start_scan(filter).await?;

        let manager_clone = manager.clone();
        let app_clone = app.clone();
        tauri::async_runtime::spawn(async move {
            let events_result = adapter.events().await;
            let mut events = match events_result {
                Ok(e) => e,
                Err(_) => return,
            };

            while let Some(event) = events.next().await {
                {
                    let mgr = manager_clone.lock().await;
                    if !mgr.is_scanning {
                        break;
                    }
                }

                match event {
                    CentralEvent::DeviceDiscovered(id) | CentralEvent::DeviceUpdated(id) => {
                        if let Ok(peripheral) = adapter.peripheral(&id).await {
                            if let Ok(Some(props)) = peripheral.properties().await {
                                let is_myo = myo_protocol::is_myo_device(&props.services);
                                let device = DiscoveredDevice {
                                    id: id.to_string(),
                                    name: props.local_name.clone(),
                                    rssi: props.rssi,
                                    is_myo,
                                };

                                {
                                    let mut mgr = manager_clone.lock().await;
                                    mgr.peripherals.insert(id.to_string(), peripheral);
                                }

                                let _ = app_clone.emit("ble:device-discovered", &device);
                            }
                        }
                    }
                    CentralEvent::DeviceConnected(id) => {
                        let _ = app_clone.emit(
                            "ble:connection-changed",
                            ConnectionEvent {
                                device_id: id.to_string(),
                                state: ConnectionState::Connected,
                            },
                        );
                    }
                    CentralEvent::DeviceDisconnected(id) => {
                        let _ = app_clone.emit(
                            "ble:connection-changed",
                            ConnectionEvent {
                                device_id: id.to_string(),
                                state: ConnectionState::Disconnected,
                            },
                        );
                        let mut mgr = manager_clone.lock().await;
                        if let Some(ref connected) = mgr.connected_peripheral {
                            if connected.id().to_string() == id.to_string() {
                                mgr.connected_peripheral = None;
                            }
                        }
                    }
                    _ => {}
                }
            }
        });

        Ok(())
    }

    pub async fn stop_scan(&mut self) -> Result<(), BleError> {
        if !self.is_scanning {
            return Err(BleError::NotScanning);
        }
        let adapter = self.adapter()?;
        adapter.stop_scan().await?;
        self.is_scanning = false;
        Ok(())
    }

    pub async fn connect(&mut self, device_id: &str, app: &AppHandle) -> Result<(), BleError> {
        let peripheral = self
            .peripherals
            .get(device_id)
            .ok_or_else(|| BleError::DeviceNotFound(device_id.to_string()))?
            .clone();

        let _ = app.emit(
            "ble:connection-changed",
            ConnectionEvent {
                device_id: device_id.to_string(),
                state: ConnectionState::Connecting,
            },
        );

        peripheral.connect().await.map_err(|e| {
            let _ = app.emit(
                "ble:connection-changed",
                ConnectionEvent {
                    device_id: device_id.to_string(),
                    state: ConnectionState::Disconnected,
                },
            );
            BleError::ConnectionFailed(e.to_string())
        })?;

        peripheral.discover_services().await?;
        self.connected_peripheral = Some(peripheral);

        let _ = app.emit(
            "ble:connection-changed",
            ConnectionEvent {
                device_id: device_id.to_string(),
                state: ConnectionState::Connected,
            },
        );

        Ok(())
    }

    pub async fn start_data_stream(
        &mut self,
        channel: tauri::ipc::Channel<streaming::MyoStreamMessage>,
    ) -> Result<(), BleError> {
        let peripheral = self
            .connected_peripheral
            .as_ref()
            .ok_or_else(|| BleError::ConnectionFailed("Not connected".into()))?
            .clone();

        if let Some(handle) = self.stream_handle.take() {
            handle.stop().await;
        }

        let handle = streaming::start_data_stream(peripheral, channel).await?;
        self.stream_handle = Some(handle);
        Ok(())
    }

    pub async fn stop_data_stream(&mut self) {
        if let Some(handle) = self.stream_handle.take() {
            handle.stop().await;
        }
    }

    pub async fn read_device_info(
        &self,
    ) -> Result<device_info::DeviceInfo, BleError> {
        let peripheral = self
            .connected_peripheral
            .as_ref()
            .ok_or_else(|| BleError::ConnectionFailed("Not connected".into()))?;
        device_info::read_device_info(peripheral).await
    }

    pub async fn disconnect(&mut self, app: &AppHandle) -> Result<(), BleError> {
        self.stop_data_stream().await;
        if let Some(peripheral) = self.connected_peripheral.take() {
            let device_id = peripheral.id().to_string();
            let _ = app.emit(
                "ble:connection-changed",
                ConnectionEvent {
                    device_id,
                    state: ConnectionState::Disconnecting,
                },
            );
            peripheral.disconnect().await?;
        }
        Ok(())
    }

    pub async fn get_discovered_devices(&self) -> Result<Vec<DiscoveredDevice>, BleError> {
        let mut devices = Vec::new();
        for (id, peripheral) in &self.peripherals {
            if let Ok(Some(props)) = peripheral.properties().await {
                devices.push(DiscoveredDevice {
                    id: id.clone(),
                    name: props.local_name.clone(),
                    rssi: props.rssi,
                    is_myo: myo_protocol::is_myo_device(&props.services),
                });
            }
        }
        devices.sort_by(|a, b| {
            b.is_myo
                .cmp(&a.is_myo)
                .then_with(|| b.rssi.unwrap_or(i16::MIN).cmp(&a.rssi.unwrap_or(i16::MIN)))
        });
        Ok(devices)
    }

    pub fn is_scanning(&self) -> bool {
        self.is_scanning
    }
}
