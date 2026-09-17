// Módulo de Geolocalización GPS Robusta con respaldo para Fichaje Pro

export async function obtenerCoordenadasActuales(): Promise<string | null> {
  // 1. Intento con HTML5 Geolocation API del navegador
  if (typeof navigator !== 'undefined' && 'geolocation' in navigator) {
    try {
      const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
        // Intento 1: Alta precisión rápido (4s)
        navigator.geolocation.getCurrentPosition(
          resolve,
          (err1) => {
            console.warn("GPS alta precisión falló o demoró, probando red/wifi:", err1.message);
            // Intento 2: Red/WiFi con mayor tolerancia de tiempo y caché de 5 minutos
            navigator.geolocation.getCurrentPosition(
              resolve,
              (err2) => {
                console.warn("GPS estándar falló:", err2.message);
                reject(err2);
              },
              { enableHighAccuracy: false, timeout: 5000, maximumAge: 300000 }
            );
          },
          { enableHighAccuracy: true, timeout: 4000, maximumAge: 60000 }
        );
      });

      if (pos && pos.coords) {
        const lat = pos.coords.latitude.toFixed(6);
        const lon = pos.coords.longitude.toFixed(6);
        console.log(`📍 GPS capturado por navegador: ${lat},${lon}`);
        return `${lat},${lon}`;
      }
    } catch (error) {
      console.warn("Geolocalización por navegador no disponible o denegada, recurriendo a respaldo por red IP:", error);
    }
  }

  // 2. Respaldo inteligente por IP (para entornos de pruebas, escritorio sin antena GPS o iframe)
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);
    const resp = await fetch('https://ipwho.is/', { signal: controller.signal });
    clearTimeout(timeoutId);

    if (resp.ok) {
      const data = await resp.json();
      if (data && typeof data.latitude === 'number' && typeof data.longitude === 'number') {
        const lat = data.latitude.toFixed(6);
        const lon = data.longitude.toFixed(6);
        console.log(`📍 Coordenadas obtenidas por IP de red: ${lat},${lon}`);
        return `${lat},${lon}`;
      }
    }
  } catch (ipErr) {
    console.warn("Respaldo por IP no disponible:", ipErr);
  }

  // 3. Fallback de última instancia para modo offline o simulador si todo lo demás falla
  const coordsGuardadas = localStorage.getItem('fichaje_ultima_ubicacion_conocida');
  if (coordsGuardadas) {
    return coordsGuardadas;
  }

  return null;
}

export function obtenerUbicacionRobusta(
  callbackExito: (pos: GeolocationPosition | { coords: { latitude: number; longitude: number } }) => void,
  callbackError?: (err: GeolocationPositionError | Error) => void
): void {
  obtenerCoordenadasActuales()
    .then((coords) => {
      if (coords) {
        const [latStr, lonStr] = coords.split(',');
        const lat = parseFloat(latStr);
        const lon = parseFloat(lonStr);
        localStorage.setItem('fichaje_ultima_ubicacion_conocida', coords);
        callbackExito({
          coords: {
            latitude: lat,
            longitude: lon,
          },
        });
      } else {
        if (callbackError) callbackError(new Error("No se pudo obtener la ubicación"));
      }
    })
    .catch((err) => {
      if (callbackError) callbackError(err);
    });
}

export async function verificarPermisoGPS(): Promise<{ estado: string; color: string }> {
  try {
    const coords = await obtenerCoordenadasActuales();
    if (coords) {
      return { estado: "Activado ✓", color: "#28a745" };
    }
    return { estado: "Inactivo", color: "#fd7e14" };
  } catch {
    return { estado: "Bloqueado ✗", color: "#dc3545" };
  }
}
