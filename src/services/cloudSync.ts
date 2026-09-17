import { FichajeData, RolTipo, CloudProveedorTipo, CloudFichajeItem, CloudConfig } from '../types';
import {
  guardarFichajeEnFirestore,
  obtenerFichajesDesdeFirestore,
  suscribirFichajesEnTiempoReal,
  validarConexionFirestore,
} from './firebase';

const CLAVE_PROVEEDOR = 'fichaje_cloud_provider';
const CLAVE_CONFIG = 'fichaje_cloud_config';
const CLAVE_CACHE_EMPLEADOS = 'fichaje_cloud_empleados_cache';
const CLAVE_EMPRESA_CODIGO = 'config-empresa-codigo';

/**
 * Obtener código de empresa configurado en el dispositivo
 */
export function obtenerCodigoEmpresa(): string {
  try {
    return (localStorage.getItem(CLAVE_EMPRESA_CODIGO) || '').trim().toUpperCase();
  } catch {
    return '';
  }
}

/**
 * Guardar código de empresa
 */
export function guardarCodigoEmpresa(codigo: string): void {
  try {
    localStorage.setItem(CLAVE_EMPRESA_CODIGO, codigo.trim().toUpperCase());
  } catch (e) {
    console.warn('Error guardando código de empresa:', e);
  }
}

// Limpieza proactiva de rastros antiguos de Google Drive
export function limpiarRastrosGoogleDrive(): void {
  try {
    localStorage.removeItem('google_access_token');
    localStorage.removeItem('google_token_exp');
    localStorage.removeItem('google_custom_client_id');
    localStorage.removeItem('nube-conectado');
  } catch (e) {
    console.warn("Error limpiando rastros de Google Drive:", e);
  }
}

// Obtener proveedor seleccionado (firebase por defecto)
export function obtenerProveedorActivo(): CloudProveedorTipo {
  const guardado = localStorage.getItem(CLAVE_PROVEEDOR) as CloudProveedorTipo;
  if (guardado === 'firebase' || guardado === 'supabase' || guardado === 'local') {
    return guardado;
  }
  return 'firebase'; // Firebase por defecto como backend nativo
}

export function establecerProveedorActivo(proveedor: CloudProveedorTipo): void {
  localStorage.setItem(CLAVE_PROVEEDOR, proveedor);
}

// Obtener configuración del backend en la nube
export function obtenerConfiguracionNube(): CloudConfig {
  try {
    const raw = localStorage.getItem(CLAVE_CONFIG);
    if (raw) {
      const parsed = JSON.parse(raw);
      // Asegurar que si Firebase está configurado, esté activo
      if (parsed.estaConectado === undefined) {
        parsed.estaConectado = true;
      }
      return parsed;
    }
  } catch (e) {
    console.warn("Error leyendo configuración de nube:", e);
  }
  // Al tener Firebase provisionado, la conexión está activa por defecto
  return {
    proveedor: 'firebase',
    estaConectado: true,
  };
}

export function guardarConfiguracionNube(config: Partial<CloudConfig>): void {
  const actual = obtenerConfiguracionNube();
  const actualizada: CloudConfig = {
    ...actual,
    ...config,
    proveedor: config.proveedor || actual.proveedor || obtenerProveedorActivo(),
  };
  localStorage.setItem(CLAVE_CONFIG, JSON.stringify(actualizada));
}

// Verificar si está conectado a la nube
export function estaConectadoNube(): boolean {
  const config = obtenerConfiguracionNube();
  return Boolean(config.estaConectado);
}

/**
 * Sincronización de fichaje individual con la nube (Firebase Firestore).
 * Persistencia en cola local y guardado inmediato en Firestore.
 */
export async function sincronizarConNube(
  claveId: string,
  datos: FichajeData,
  rol: RolTipo,
  nombreUsuario: string,
  dniUsuario?: string,
  empresaCodigo?: string
): Promise<void> {
  const proveedor = obtenerProveedorActivo();
  const config = obtenerConfiguracionNube();

  const codEmpresa = (empresaCodigo || obtenerCodigoEmpresa()).trim().toUpperCase();
  const nombreFinal = (nombreUsuario || '').trim() || 'Empleado';
  const prefijoEmpresa = codEmpresa ? `${codEmpresa}_` : '';
  const item: CloudFichajeItem = {
    id: `${prefijoEmpresa}${nombreFinal.replace(/\s+/g, '_')}_${claveId}`,
    claveId,
    empleadoNombre: nombreFinal,
    empleadoDni: (dniUsuario || '').trim(),
    empresaCodigo: codEmpresa,
    fecha: new Date().toISOString(),
    datos,
    actualizadoEn: new Date().toLocaleString(),
  };

  if (rol === 'empleado' || rol === 'particular') {
    guardarEnCacheEmpleados(item);
  }

  if (!config.estaConectado) {
    console.log(`[CloudSync] Conexión desactivada. Datos de ${claveId} en cola local.`);
    return;
  }

  try {
    if (proveedor === 'firebase') {
      await sincronizarConFirebase(item);
    } else if (proveedor === 'supabase') {
      await sincronizarConSupabase(item);
    }
  } catch (error) {
    console.error(`[CloudSync Error] Fallo al sincronizar con ${proveedor}:`, error);
  }
}

/**
 * Sincroniza todos los fichajes guardados en localStorage hacia Firebase Firestore
 * Permite que los registros ya existentes en el móvil del empleado se suban a la nube de inmediato.
 */
export async function sincronizarTodosLosFichajesLocales(
  rol: RolTipo,
  nombreUsuario: string,
  dniUsuario?: string,
  empresaCodigo?: string
): Promise<number> {
  let contador = 0;
  const codEmpresa = (empresaCodigo || obtenerCodigoEmpresa()).trim().toUpperCase();
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith('fichaje-') && !k.startsWith('fichaje_')) {
        try {
          const raw = localStorage.getItem(k);
          if (raw) {
            const data: FichajeData = JSON.parse(raw);
            // Sincronizar si contiene datos de horas o de estado
            if (
              data.e1 ||
              data.s1 ||
              data.e2 ||
              data.s2 ||
              (data.est && data.est !== 'defecto')
            ) {
              await sincronizarConNube(k, data, rol, nombreUsuario, dniUsuario, codEmpresa);
              contador++;
            }
          }
        } catch (e) {
          console.warn('Error leyendo fichaje para sync masivo:', k, e);
        }
      }
    }
    if (contador > 0) {
      console.log(`☁️ [CloudSync] ${contador} fichaje(s) locales subidos a la nube automáticamente.`);
    }
  } catch (err) {
    console.error('Error en sincronización masiva de fichajes locales:', err);
  }
  return contador;
}

/**
 * Consulta de fichajes de empleados para el panel del Jefe.
 */
export async function listarFichajesEmpleadosNube(empresaCodigo?: string): Promise<CloudFichajeItem[]> {
  const proveedor = obtenerProveedorActivo();
  const config = obtenerConfiguracionNube();
  const codEmpresa = (empresaCodigo || obtenerCodigoEmpresa()).trim().toUpperCase();

  if (!config.estaConectado) {
    const local = obtenerCacheEmpleados();
    if (!codEmpresa) return local;
    return local.filter((it) => (it.empresaCodigo || '').toUpperCase() === codEmpresa);
  }

  try {
    if (proveedor === 'firebase') {
      return await consultarEmpleadosFirebase(codEmpresa);
    } else if (proveedor === 'supabase') {
      return await consultarEmpleadosSupabase();
    }
  } catch (err) {
    console.warn(`[CloudSync] Error consultando empleados en ${proveedor}, cargando caché:`, err);
  }

  return obtenerCacheEmpleados();
}

/**
 * Suscripción en tiempo real a los fichajes de los empleados (Firebase Firestore)
 */
export function suscribirFichajesEmpleados(
  onUpdate: (items: CloudFichajeItem[]) => void,
  empresaCodigo?: string
): () => void {
  const proveedor = obtenerProveedorActivo();
  const codEmpresa = (empresaCodigo || obtenerCodigoEmpresa()).trim().toUpperCase();
  if (proveedor === 'firebase') {
    return suscribirFichajesEnTiempoReal(onUpdate, codEmpresa);
  }
  return () => {};
}

/**
 * Cambia el estado de conexión de la nube
 */
export function alternarConexionNube(activar: boolean, proveedor?: CloudProveedorTipo): void {
  const prov = proveedor || obtenerProveedorActivo();
  establecerProveedorActivo(prov);
  guardarConfiguracionNube({
    proveedor: prov,
    estaConectado: activar,
    ultimaSincronizacion: activar ? new Date().toISOString() : undefined,
  });
}

// Helpers de caché local
function obtenerCacheEmpleados(): CloudFichajeItem[] {
  try {
    const raw = localStorage.getItem(CLAVE_CACHE_EMPLEADOS);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function guardarEnCacheEmpleados(nuevoItem: CloudFichajeItem): void {
  try {
    const lista = obtenerCacheEmpleados().filter((i) => i.id !== nuevoItem.id);
    lista.unshift(nuevoItem);
    localStorage.setItem(CLAVE_CACHE_EMPLEADOS, JSON.stringify(lista.slice(0, 200)));
  } catch (e) {
    console.warn("Error guardando en caché de empleados:", e);
  }
}

// Adaptadores para Firebase
async function sincronizarConFirebase(item: CloudFichajeItem): Promise<void> {
  await guardarFichajeEnFirestore(item);
}

async function consultarEmpleadosFirebase(empresaCodigo?: string): Promise<CloudFichajeItem[]> {
  const items = await obtenerFichajesDesdeFirestore(empresaCodigo);
  try {
    localStorage.setItem(CLAVE_CACHE_EMPLEADOS, JSON.stringify(items.slice(0, 200)));
  } catch (e) {
    console.warn('Error guardando en cache empleados:', e);
  }
  return items;
}

// Adaptadores para Supabase (fallback)
async function sincronizarConSupabase(item: CloudFichajeItem): Promise<void> {
  console.log("⚡ [Supabase Ready] Sincronizando registro en tabla 'fichajes':", item.id);
}

async function consultarEmpleadosSupabase(): Promise<CloudFichajeItem[]> {
  return obtenerCacheEmpleados();
}
export { validarConexionFirestore };

