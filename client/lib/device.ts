/**
 * Generates or retrieves a persistent, unique device identifier stored in localStorage.
 * This guarantees the server can deduplicate product view counts per device.
 */
export function getOrCreateDeviceId(): string {
  if (typeof window === "undefined") {
    return "server-render";
  }

  try {
    let deviceId = localStorage.getItem("nk_device_id");
    if (!deviceId) {
      deviceId =
        "nk_dev_" +
        Math.random().toString(36).substring(2, 12) +
        Date.now().toString(36);
      localStorage.setItem("nk_device_id", deviceId);
    }
    return deviceId;
  } catch (e) {
    return "anonymous-device";
  }
}
