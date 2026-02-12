mod ble;

use ble::commands::BleState;
use ble::manager::BleManager;
use std::sync::Arc;
use tauri::Manager;
use tokio::sync::Mutex;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_window_state::Builder::new().build())
        .setup(|app| {
            let ble_manager: BleState = Arc::new(Mutex::new(BleManager::new()));
            app.manage(ble_manager);
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            ble::commands::ble_start_scan,
            ble::commands::ble_stop_scan,
            ble::commands::ble_connect,
            ble::commands::ble_disconnect,
            ble::commands::ble_get_devices,
            ble::commands::myo_start_stream,
            ble::commands::myo_stop_stream,
            ble::commands::myo_get_device_info,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
