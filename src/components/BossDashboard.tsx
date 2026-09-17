import React, { useState, useEffect } from 'react';
import {
  listarFichajesEmpleadosNube,
  suscribirFichajesEmpleados,
  obtenerProveedorActivo,
} from '../services/cloudSync';
import { CloudFichajeItem } from '../types';

interface BossDashboardProps {
  onOpenMenu: () => void;
  empresaCodigo?: string;
  onEmpresaCodigoChange?: (val: string) => void;
}

export const BossDashboard: React.FC<BossDashboardProps> = ({
  onOpenMenu,
  empresaCodigo = '',
  onEmpresaCodigoChange,
}) => {
  const [cargando, setCargando] = useState(false);
  const [registros, setRegistros] = useState<CloudFichajeItem[]>([]);
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [detalleItem, setDetalleItem] = useState<CloudFichajeItem | null>(null);
  const [copiado, setCopiado] = useState(false);

  const proveedor = obtenerProveedorActivo();

  // Carga inicial y suscripción en tiempo real con Firestore para esta empresa
  useEffect(() => {
    cargarArchivos();
    const cancelarSuscripcion = suscribirFichajesEmpleados((items) => {
      setRegistros(items);
      if (items.length > 0) {
        setMensaje(null);
      }
    }, empresaCodigo);
    return () => {
      cancelarSuscripcion();
    };
  }, [empresaCodigo]);

  const cargarArchivos = async () => {
    setCargando(true);
    setMensaje(`Consultando registros en ${proveedor.toUpperCase()}...`);

    try {
      const items = await listarFichajesEmpleadosNube(empresaCodigo);
      setRegistros(items);
      if (items.length === 0) {
        if (!empresaCodigo) {
          setMensaje(
            `Define el Código de tu Empresa en el menú (☰) para aislar tus registros y que tus empleados se sincronicen únicamente con tu panel.`
          );
        } else {
          setMensaje(
            `Aún no hay fichajes con el código "${empresaCodigo}". Asegúrate de que tus empleados tengan introducido este código en sus móviles.`
          );
        }
      } else {
        setMensaje(null);
      }
    } catch (err: any) {
      console.error(err);
      setMensaje(`Error al consultar ${proveedor.toUpperCase()}. Revisa la conexión de red.`);
    } finally {
      setCargando(false);
    }
  };

  const copiarCodigo = () => {
    if (!empresaCodigo) {
      onOpenMenu();
      return;
    }
    navigator.clipboard.writeText(empresaCodigo).then(() => {
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2500);
    });
  };

  return (
    <div
      id="panel-jefe-dashboard"
      className="bg-white rounded-md p-3 shadow-xs flex-1 overflow-y-auto flex flex-col gap-3 w-full"
    >
      <div className="border-b-2 pb-2" style={{ borderColor: 'var(--teal-header)' }}>
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold" style={{ color: 'var(--teal-header)' }}>
            👥 Panel de Control del Jefe
          </h3>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-green-100 text-green-800 border border-green-300 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
            En vivo: {proveedor.toUpperCase()}
          </span>
        </div>
        <p className="text-xs text-gray-600 mt-1">
          Supervisión en directo de los fichajes de tus empleados conectados a Firebase Firestore.
        </p>
      </div>

      {/* Tarjeta de Código de Empresa (Aislamiento de datos) */}
      <div className="p-2.5 bg-blue-50/70 border border-blue-200 rounded-lg flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="text-base">🏢</span>
            <span className="text-xs font-bold text-blue-900">Código de tu Empresa:</span>
          </div>
          {empresaCodigo ? (
            <span className="text-xs font-black px-2 py-0.5 bg-blue-700 text-white rounded tracking-wide">
              {empresaCodigo}
            </span>
          ) : (
            <span className="text-[11px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded">
              Sin asignar
            </span>
          )}
        </div>

        {empresaCodigo ? (
          <div className="flex items-center justify-between text-[11px] text-blue-800">
            <span>Tus empleados deben ingresar este código en sus móviles.</span>
            <button
              onClick={copiarCodigo}
              className="px-2 py-1 bg-white hover:bg-blue-100 text-blue-900 border border-blue-300 rounded font-bold text-[10px] cursor-pointer shadow-2xs transition-colors shrink-0"
            >
              {copiado ? '✅ ¡Copiado!' : '📋 Copiar clave'}
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-between gap-2 pt-1 border-t border-blue-200/60">
            <span className="text-[11px] text-gray-600">
              Crea tu código para evitar que tus datos se mezclen con otras empresas.
            </span>
            <button
              onClick={onOpenMenu}
              className="px-2.5 py-1 bg-teal-700 text-white rounded font-bold text-[11px] cursor-pointer hover:bg-teal-800 transition-colors shrink-0"
            >
              Crear código
            </button>
          </div>
        )}
      </div>

      <div className="flex gap-2">
        <button
          id="btn-cargar-empleados"
          onClick={cargarArchivos}
          disabled={cargando}
          className="flex-1 py-2 px-3 text-white text-xs font-bold rounded-md cursor-pointer transition-opacity disabled:opacity-50 hover:opacity-90 shadow-xs flex items-center justify-center gap-1.5"
          style={{ backgroundColor: 'var(--teal-header)' }}
        >
          {cargando ? '🔄 Actualizando...' : `🔄 Actualizar Registros`}
        </button>
      </div>

      {mensaje && (
        <div className="text-center py-4 text-xs text-gray-500 italic">
          {mensaje}
        </div>
      )}

      {registros.length > 0 && (
        <div className="flex flex-col gap-1.5 mt-1">
          <div className="text-xs font-bold text-green-700">
            📁 {registros.length} registro(s) de jornada sincronizado(s):
          </div>
          {registros.map((item) => (
            <div
              key={item.id}
              className="bg-gray-50 border border-gray-200 p-2 rounded flex justify-between items-center text-xs"
            >
              <div className="flex flex-col truncate pr-2">
                <span className="font-semibold text-gray-800 truncate">
                  👤 {item.empleadoNombre} {item.empleadoDni ? `(${item.empleadoDni})` : ''}
                </span>
                <span className="text-[10px] text-gray-500">
                  ID: {item.claveId} • {item.actualizadoEn}
                </span>
              </div>
              <button
                onClick={() => setDetalleItem(item)}
                className="py-1 px-2.5 text-[11px] font-bold text-white rounded shrink-0 hover:opacity-90 cursor-pointer"
                style={{ backgroundColor: 'var(--teal-header)' }}
              >
                Ver Datos
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Modal de detalle de empleado */}
      {detalleItem && (
        <div
          className="fixed inset-0 bg-black/50 flex justify-center items-center z-50 p-2.5"
          onClick={() => setDetalleItem(null)}
        >
          <div
            className="bg-white rounded-lg p-4 w-full max-w-[340px] shadow-xl flex flex-col gap-3"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-sm font-bold text-gray-800 border-b pb-1 truncate">
              👤 {detalleItem.empleadoNombre}
            </div>
            <div className="text-xs flex flex-col gap-1.5 text-gray-700">
              <div className="flex justify-between">
                <span className="font-bold">Total Horas:</span>
                <span className="font-mono font-bold text-teal-800">
                  {detalleItem.datos.t || '00:00'} hrs
                </span>
              </div>
              <div className="flex justify-between">
                <span className="font-bold">Estado:</span>
                <span className="uppercase font-semibold">
                  {detalleItem.datos.est || 'defecto'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="font-bold">Entrada 1:</span>
                <span>{detalleItem.datos.e1 || '--:--'}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-bold">Salida 1:</span>
                <span>{detalleItem.datos.s1 || '--:--'}</span>
              </div>
              {(detalleItem.datos.e2 || detalleItem.datos.s2) && (
                <>
                  <div className="flex justify-between">
                    <span className="font-bold">Entrada 2:</span>
                    <span>{detalleItem.datos.e2 || '--:--'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-bold">Salida 2:</span>
                    <span>{detalleItem.datos.s2 || '--:--'}</span>
                  </div>
                </>
              )}
              {detalleItem.datos.nota && (
                <div className="mt-1 pt-1 border-t border-gray-200">
                  <span className="font-bold block">Nota:</span>
                  <p className="text-gray-600 italic mt-0.5">{detalleItem.datos.nota}</p>
                </div>
              )}
              {detalleItem.datos.gps && Object.keys(detalleItem.datos.gps).length > 0 && (
                <div className="mt-1 pt-1 border-t border-gray-200">
                  <span className="font-bold block mb-1">Coordenadas GPS:</span>
                  {Object.entries(detalleItem.datos.gps).map(([k, coord]) => (
                    <div key={k} className="flex justify-between items-center text-[11px]">
                      <span className="uppercase font-mono">{k}:</span>
                      <a
                        href={`https://www.google.com/maps?q=${coord}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-teal-700 underline font-mono"
                      >
                        {String(coord)}
                      </a>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <button
              onClick={() => setDetalleItem(null)}
              className="mt-2 py-1.5 px-3 bg-gray-300 text-gray-800 rounded font-bold text-xs hover:bg-gray-400 cursor-pointer"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

