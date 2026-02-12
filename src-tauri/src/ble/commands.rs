use super::device_info::DeviceInfo;
use super::manager::{BleError, BleManager, DiscoveredDevice};
use super::streaming::MyoStreamMessage;
use std::sync::Arc;
use tauri::ipc::Channel;
use tauri::{AppHandle, State};
use tokio::sync::Mutex;

pub type BleState = Arc<Mutex<BleManager>>;

#[tauri::command]
pub async fn ble_start_scan(state: State<'_, BleState>, app: AppHandle) -> Result<(), BleError> {
    {
        let mut mgr = state.lock().await;
        if mgr.is_scanning() {
            mgr.stop_scan().await.ok();
        }
        mgr.initialize().await?;
    }
    BleManager::start_scan(state.inner().clone(), app).await
}

#[tauri::command]
pub async fn ble_stop_scan(state: State<'_, BleState>) -> Result<(), BleError> {
    let mut mgr = state.lock().await;
    mgr.stop_scan().await
}

#[tauri::command]
pub async fn ble_connect(
    device_id: String,
    state: State<'_, BleState>,
    app: AppHandle,
) -> Result<(), BleError> {
    {
        let mut mgr = state.lock().await;
        if mgr.is_scanning() {
            mgr.stop_scan().await.ok();
        }
    }
    let mut mgr = state.lock().await;
    mgr.connect(&device_id, &app).await
}

#[tauri::command]
pub async fn ble_disconnect(state: State<'_, BleState>, app: AppHandle) -> Result<(), BleError> {
    let mut mgr = state.lock().await;
    mgr.disconnect(&app).await
}

#[tauri::command]
pub async fn ble_get_devices(
    state: State<'_, BleState>,
) -> Result<Vec<DiscoveredDevice>, BleError> {
    let mgr = state.lock().await;
    mgr.get_discovered_devices().await
}

#[tauri::command]
pub async fn myo_start_stream(
    state: State<'_, BleState>,
    on_data: Channel<MyoStreamMessage>,
) -> Result<(), BleError> {
    let mut mgr = state.lock().await;
    mgr.start_data_stream(on_data).await
}

#[tauri::command]
pub async fn myo_stop_stream(state: State<'_, BleState>) -> Result<(), BleError> {
    let mut mgr = state.lock().await;
    mgr.stop_data_stream().await;
    Ok(())
}

#[tauri::command]
pub async fn myo_get_device_info(state: State<'_, BleState>) -> Result<DeviceInfo, BleError> {
    let mgr = state.lock().await;
    mgr.read_device_info().await
}
