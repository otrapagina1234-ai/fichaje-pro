export type EstadoDia = 'defecto' | 'trabajo' | 'vacaciones' | 'libre' | 'baja';

export type OrigenPunch = 'MANUAL' | 'AUTOMATICO';

export interface FichajeData {
  e1?: string;
  s1?: string;
  e2?: string;
  s2?: string;
  est: EstadoDia;
  t: string;
  nota?: string;
  dia?: string;
  fechaRegistro?: string;
  ultimaModificacion?: string;
  origen?: Record<string, OrigenPunch>;
  gps?: Record<string, string>;
}

export type TurnoTipo = 'continuo' | 'partido';
export type RolTipo = 'particular' | 'empleado' | 'jefe';
export type VistaTipo = 'semana' | 'mes' | 'ano';

export interface ColoresConfig {
  trabajo: string;
  vacaciones: string;
  libre: string;
  baja: string;
}

export type CloudProveedorTipo = 'firebase' | 'supabase' | 'local';

export interface CloudConfig {
  proveedor: CloudProveedorTipo;
  firebaseConfig?: {
    apiKey: string;
    authDomain: string;
    projectId: string;
    storageBucket?: string;
    messagingSenderId?: string;
    appId?: string;
  };
  supabaseConfig?: {
    url: string;
    anonKey: string;
  };
  usuarioEmail?: string;
  estaConectado: boolean;
  ultimaSincronizacion?: string;
}

export interface CloudFichajeItem {
  id: string;
  claveId: string;
  empleadoNombre: string;
  empleadoDni?: string;
  empresaCodigo?: string;
  fecha: string;
  datos: FichajeData;
  actualizadoEn: string;
}

export interface CalendarDayItem {
  claveId: string;
  anio: number;
  mes: number;
  dia: number;
  fecha: Date;
  diaSemana: string;
  esHoy: boolean;
  esOtroMes?: boolean;
  data: FichajeData;
}

// Compatibilidad hacia atrás
export interface DriveFileItem {
  id: string;
  name: string;
  mimeType?: string;
}

