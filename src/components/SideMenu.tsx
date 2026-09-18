import React, { useState, useEffect } from 'react';
import { RolTipo, TurnoTipo, ColoresConfig } from '../types';

interface SideMenuProps {
  isOpen: boolean;
  onClose: () => void;
  nombre: string;
  onNombreChange: (val: string) => void;
  dni: string;
  onDniChange: (val: string) => void;
  onGuardarPerfil?: (nuevoNombre: string, nuevoDni: string) => void;
  rol: RolTipo;
  onRolChange: (val: RolTipo) => void;
  empresaCodigo: string;
  onEmpresaCodigoChange: (val: string) => void;
  turno: TurnoTipo;
  onTurnoChange: (val: TurnoTipo) => void;
  colores: ColoresConfig;
  onColorChange: (tipo: keyof ColoresConfig, val: string) => void;
  nubeConectado: boolean;
  onAlternarNube: () => void;
  gpsEstado: string;
  gpsColor: string;
  onVerificarGPS: () => void;
  onCompartirWhatsApp: () => void;
  onCompartirCorreo: () => void;
  onDescargarCopia: () => void;
  onCargarCopia: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onOpenPlayStore: () => void;
  onOpenPrivacy: () => void;
}

export const SideMenu: React.FC<SideMenuProps> = ({
  isOpen,
  onClose,
  nombre,
  onNombreChange,
  dni,
  onDniChange,
  onGuardarPerfil,
  rol,
  onRolChange,
  empresaCodigo,
  onEmpresaCodigoChange,
  turno,
  onTurnoChange,
  colores,
  onColorChange,
  nubeConectado,
  onAlternarNube,
  gpsEstado,
  gpsColor,
  onVerificarGPS,
  onCompartirWhatsApp,
  onCompartirCorreo,
  onDescargarCopia,
  onCargarCopia,
  onOpenPlayStore,
  onOpenPrivacy,
}) => {
  const [desplegableColores, setDesplegableColores] = useState(false);
  const [desplegableCompartir, setDesplegableCompartir] = useState(false);
  const [desplegableSeguridad, setDesplegableSeguridad] = useState(false);
  const [codigoCopiado, setCodigoCopiado] = useState(false);
  const [codigoInputEmpleado, setCodigoInputEmpleado] = useState(empresaCodigo);
  const [guardadoEmpleadoExito, setGuardadoEmpleadoExito] = useState(false);

  // Estados locales para evitar subidas a la nube letra a letra
  const [inputNombre, setInputNombre] = useState(nombre);
  const [inputDni, setInputDni] = useState(dni);
  const [guardadoPerfilExito, setGuardadoPerfilExito] = useState(false);

  useEffect(() => {
    setInputNombre(nombre);
  }, [nombre]);

  useEffect(() => {
    setInputDni(dni);
  }, [dni]);

  useEffect(() => {
    setCodigoInputEmpleado(empresaCodigo);
  }, [empresaCodigo]);

  const handleConfirmarPerfil = () => {
    const nombreLimpio = inputNombre.trim();
    const dniLimpio = inputDni.trim().toUpperCase();

    if (!nombreLimpio) {
      alert('Por favor, introduce tu Nombre y Apellidos antes de confirmar.');
      return;
    }

    if (onGuardarPerfil) {
      onGuardarPerfil(nombreLimpio, dniLimpio);
    } else {
      onNombreChange(nombreLimpio);
      onDniChange(dniLimpio);
    }

    setGuardadoPerfilExito(true);
    setTimeout(() => setGuardadoPerfilExito(false), 3500);
  };

  const handleCerrarMenu = () => {
    // Si el usuario modificó y olvidó pulsar el botón, confirmar datos limpios al salir
    const nombreLimpio = inputNombre.trim();
    const dniLimpio = inputDni.trim().toUpperCase();
    if (nombreLimpio && (nombreLimpio !== nombre || dniLimpio !== dni)) {
      if (onGuardarPerfil) {
        onGuardarPerfil(nombreLimpio, dniLimpio);
      } else {
        onNombreChange(nombreLimpio);
        onDniChange(dniLimpio);
      }
    }
    onClose();
  };

  const handleGuardarCodigoEmpleado = () => {
    const codeUpper = codigoInputEmpleado.trim().toUpperCase();
    onEmpresaCodigoChange(codeUpper);
    setGuardadoEmpleadoExito(true);
    setTimeout(() => setGuardadoEmpleadoExito(false), 3000);
  };

  if (!isOpen) return null;

  const copiarCodigo = () => {
    if (!empresaCodigo) return;
    navigator.clipboard.writeText(empresaCodigo).then(() => {
      setCodigoCopiado(true);
      setTimeout(() => setCodigoCopiado(false), 2500);
    });
  };

  return (
    <>
      <div
        id="menu-overlay"
        className="fixed inset-0 bg-black/50 z-40 transition-opacity"
        onClick={handleCerrarMenu}
      />

      <div
        id="menu-lateral"
        className="fixed top-0 left-0 w-[300px] h-full bg-white shadow-2xl z-50 flex flex-col p-4 overflow-y-auto"
      >
        <div className="flex items-center justify-between pb-2 mb-2 border-b-2" style={{ borderColor: 'var(--teal-header)' }}>
          <span className="text-base font-bold" style={{ color: 'var(--teal-header)' }}>
            ⚙️ Ajustes de Fichaje
          </span>
          <button
            onClick={handleCerrarMenu}
            className="w-7 h-7 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-700 flex items-center justify-center font-bold text-sm cursor-pointer"
            aria-label="Cerrar"
          >
            ✕
          </button>
        </div>

        <div className="text-[11px] text-gray-400 font-bold uppercase tracking-wider mb-1">
          Identificación y Perfil
        </div>

        {/* Nombre */}
        <div className="flex items-center gap-1.5 py-1.5 border-b border-gray-100 w-full">
          <span className="text-xs font-bold text-gray-700 w-[85px] shrink-0">
            👤 Nombre:
          </span>
          <input
            type="text"
            id="input-nombre-global"
            value={inputNombre}
            onChange={(e) => setInputNombre(e.target.value)}
            placeholder="Nombre y Apellidos"
            className="flex-1 p-1.5 text-xs font-semibold rounded border border-gray-300 focus:outline-none focus:border-teal-700 bg-white"
          />
        </div>

        {/* DNI */}
        <div className="flex items-center gap-1.5 py-1.5 border-b border-gray-100 w-full">
          <span className="text-xs font-bold text-gray-700 w-[85px] shrink-0">
            🪪 DNI / NIE:
          </span>
          <input
            type="text"
            id="input-dni-global"
            value={inputDni}
            onChange={(e) => setInputDni(e.target.value.toUpperCase())}
            placeholder="Documento ID"
            className="flex-1 p-1.5 text-xs font-semibold rounded border border-gray-300 focus:outline-none focus:border-teal-700 bg-white"
          />
        </div>

        {/* Botón explícito para Confirmar y Guardar Perfil */}
        <div className="pt-2 pb-1.5 border-b border-gray-100 w-full">
          <button
            type="button"
            onClick={handleConfirmarPerfil}
            className={`w-full py-2 px-3 text-white text-xs font-bold rounded-lg cursor-pointer transition-all shadow-2xs flex items-center justify-center gap-1.5 ${
              guardadoPerfilExito ? 'bg-emerald-600 hover:bg-emerald-700' : 'hover:opacity-90 active:scale-98'
            }`}
            style={{ backgroundColor: guardadoPerfilExito ? undefined : 'var(--teal-header)' }}
          >
            {guardadoPerfilExito ? '✅ ¡Datos Confirmados y Guardados!' : '💾 Confirmar y Guardar Perfil'}
          </button>
          {guardadoPerfilExito ? (
            <p className="text-[10px] text-emerald-700 font-bold text-center mt-1">
              ✓ Perfil guardado. Se ha sincronizado una única copia completa y limpia.
            </p>
          ) : (
            <p className="text-[10px] text-gray-500 text-center mt-1">
              Pulsa para confirmar tus datos completos antes de sincronizar.
            </p>
          )}
        </div>

        {/* Rol / Modo */}
        <div className="flex items-center justify-between py-2 border-b border-gray-100 text-xs font-bold text-gray-700">
          <span>👥 Modo de Uso:</span>
          <select
            id="selector-rol-global"
            value={rol}
            onChange={(e) => onRolChange(e.target.value as RolTipo)}
            className="p-1 font-bold rounded border border-gray-300 text-xs bg-white"
          >
            <option value="particular">Particular / Autónomo</option>
            <option value="empleado">Empleado (Conectado a Empresa)</option>
            <option value="jefe">Jefe / Empresa (Panel Central)</option>
          </select>
        </div>

        {/* Código de Empresa (Aislamiento de empresas) */}
        {rol === 'empleado' && (
          <div className="my-3 p-3 bg-amber-50 rounded-xl border border-amber-300 flex flex-col gap-2.5 shadow-xs">
            <div className="flex items-center justify-between gap-1">
              <span className="text-xs font-bold text-amber-950 flex items-center gap-1.5">
                <span className="text-sm">🔑</span> Clave de tu Empresa:
              </span>
              {guardadoEmpleadoExito ? (
                <span className="text-[11px] font-bold px-2 py-0.5 bg-emerald-600 text-white rounded-md shadow-2xs">
                  ✓ Guardada
                </span>
              ) : empresaCodigo ? (
                <span className="text-[11px] font-bold px-2 py-0.5 bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-md">
                  ✓ {empresaCodigo}
                </span>
              ) : (
                <span className="text-[11px] font-bold px-2 py-0.5 bg-amber-200 text-amber-900 rounded-md">
                  Sin Clave
                </span>
              )}
            </div>

            <div className="flex flex-col gap-2 w-full">
              <input
                type="text"
                id="input-empresa-codigo-empleado"
                value={codigoInputEmpleado}
                onChange={(e) => setCodigoInputEmpleado(e.target.value.toUpperCase())}
                placeholder="Ej: AMP2026"
                className="w-full p-2.5 text-xs font-black tracking-wider rounded-lg border border-amber-300 bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 uppercase text-amber-950 shadow-2xs"
              />
              <button
                type="button"
                onClick={handleGuardarCodigoEmpleado}
                className="w-full py-2 px-3 bg-amber-700 hover:bg-amber-800 active:bg-amber-900 text-white rounded-lg text-xs font-bold cursor-pointer transition-colors shadow-2xs flex items-center justify-center gap-1.5"
              >
                💾 Guardar Clave de Empresa
              </button>
            </div>

            <p className="text-[11px] text-amber-900 leading-snug">
              Introduce el código facilitado por tu empresa y pulsa <strong>Guardar Clave</strong> para vincular tus fichajes.
            </p>
          </div>
        )}

        {rol === 'jefe' && (
          <div className="my-3 p-3 bg-blue-50 rounded-xl border border-blue-300 flex flex-col gap-2.5 shadow-xs">
            <div className="flex items-center justify-between gap-1">
              <span className="text-xs font-bold text-blue-950 flex items-center gap-1.5">
                <span className="text-sm">🏢</span> Clave de tu Empresa:
              </span>
              {empresaCodigo && (
                <button
                  type="button"
                  onClick={copiarCodigo}
                  className="text-[11px] px-2.5 py-1 bg-blue-700 hover:bg-blue-800 text-white font-bold rounded-md cursor-pointer transition-colors shadow-2xs shrink-0"
                >
                  {codigoCopiado ? '✓ Copiado' : '📋 Copiar'}
                </button>
              )}
            </div>

            <div className="flex flex-col gap-2 w-full">
              <input
                type="text"
                id="input-empresa-codigo-jefe"
                value={empresaCodigo}
                onChange={(e) => onEmpresaCodigoChange(e.target.value.toUpperCase())}
                placeholder="Ej: AMP2026"
                className="w-full p-2.5 text-xs font-black tracking-wider rounded-lg border border-blue-300 bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 uppercase text-blue-950 shadow-2xs"
              />
              <button
                type="button"
                onClick={() => {
                  const randomNum = Math.floor(1000 + Math.random() * 9000);
                  onEmpresaCodigoChange(`AMP-${randomNum}`);
                }}
                className="w-full py-2 px-3 bg-amber-600 hover:bg-amber-700 active:bg-amber-800 text-white font-bold text-xs rounded-lg cursor-pointer transition-colors shadow-2xs flex items-center justify-center gap-1.5"
                title="Generar código automático"
              >
                ⚡ Generar Clave Automática
              </button>
            </div>

            <p className="text-[11px] text-blue-900 leading-snug">
              Tus empleados deben ingresar exactamente este código en sus teléfonos para vincular sus fichajes con tu panel.
            </p>
          </div>
        )}

        {rol === 'particular' && (
          <div className="my-2 px-2.5 py-1.5 bg-gray-50 rounded border border-gray-200 text-[11px] text-gray-600">
            💼 Modo particular independiente para autónomos y control personal. Tus datos permanecen privados.
          </div>
        )}

        <div className="text-[11px] text-gray-400 font-bold uppercase tracking-wider mt-2 mb-1">
          Servicio Nube & Sincronización
        </div>

        {/* Tarjeta de Servicio Nube (Automática e ininterrumpida) */}
        <div className="p-2.5 bg-teal-50/60 rounded-lg border border-teal-200 flex flex-col gap-1.5 mb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="text-xs font-bold text-teal-900">Base de Datos Cloud</span>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-300">
              ⚡ Activa 24/7
            </span>
          </div>
          <p className="text-[10px] text-teal-800 leading-relaxed">
            Sincronización en tiempo real automatizada e ininterrumpida con servidor seguro y cifrado SSL.
          </p>
        </div>

        <div className="text-[11px] text-gray-400 font-bold uppercase tracking-wider mt-1 mb-1">
          Jornada y Dispositivo
        </div>

        {/* Tipo de Turno */}
        <div className="flex items-center justify-between py-1.5 border-b border-gray-100 text-xs font-bold text-gray-700">
          <span>⚙️ Tipo de Turno:</span>
          <select
            id="selector-turno-global"
            value={turno}
            onChange={(e) => onTurnoChange(e.target.value as TurnoTipo)}
            className="p-1 font-bold rounded border border-gray-300 text-xs bg-white"
          >
            <option value="continuo">Continuo</option>
            <option value="partido">Partido</option>
          </select>
        </div>

        {/* Estado GPS */}
        <div
          className="flex items-center justify-between py-2 border-b border-gray-100 text-xs font-bold text-gray-700 cursor-pointer hover:bg-gray-50 rounded"
          onClick={onVerificarGPS}
          title="Toca para verificar señal GPS"
        >
          <span>🛰️ Estado del GPS:</span>
          <span
            id="estado-gps-lbl"
            className="text-xs font-bold"
            style={{ color: gpsColor }}
          >
            {gpsEstado}
          </span>
        </div>

        {/* Personalizar Colores */}
        <div
          className="flex items-center justify-between py-2 border-b border-gray-100 text-xs font-bold text-gray-700 cursor-pointer hover:bg-gray-50"
          onClick={() => setDesplegableColores(!desplegableColores)}
        >
          <span>🎨 Personalizar Colores</span>
          <span className="text-xs text-gray-400">{desplegableColores ? '▲' : '▼'}</span>
        </div>
        {desplegableColores && (
          <div className="grid grid-cols-2 gap-1.5 p-2 bg-[#fafafa] border-b border-gray-200">
            <div className="flex items-center justify-between bg-[#eef0f2] px-2 py-1 rounded text-xs font-bold">
              <span>Trabajo</span>
              <input
                type="color"
                id="picker-trabajo"
                value={colores.trabajo}
                onChange={(e) => onColorChange('trabajo', e.target.value)}
                className="w-6 h-6 border-none rounded-full cursor-pointer bg-transparent p-0"
              />
            </div>
            <div className="flex items-center justify-between bg-[#eef0f2] px-2 py-1 rounded text-xs font-bold">
              <span>Vacac.</span>
              <input
                type="color"
                id="picker-vacaciones"
                value={colores.vacaciones}
                onChange={(e) => onColorChange('vacaciones', e.target.value)}
                className="w-6 h-6 border-none rounded-full cursor-pointer bg-transparent p-0"
              />
            </div>
            <div className="flex items-center justify-between bg-[#eef0f2] px-2 py-1 rounded text-xs font-bold">
              <span>Libre</span>
              <input
                type="color"
                id="picker-libre"
                value={colores.libre}
                onChange={(e) => onColorChange('libre', e.target.value)}
                className="w-6 h-6 border-none rounded-full cursor-pointer bg-transparent p-0"
              />
            </div>
            <div className="flex items-center justify-between bg-[#eef0f2] px-2 py-1 rounded text-xs font-bold">
              <span>Baja M.</span>
              <input
                type="color"
                id="picker-baja"
                value={colores.baja}
                onChange={(e) => onColorChange('baja', e.target.value)}
                className="w-6 h-6 border-none rounded-full cursor-pointer bg-transparent p-0"
              />
            </div>
          </div>
        )}

        {/* Compartir Datos */}
        <div
          className="flex items-center justify-between py-2 border-b border-gray-100 text-xs font-bold text-gray-700 cursor-pointer hover:bg-gray-50"
          onClick={() => setDesplegableCompartir(!desplegableCompartir)}
        >
          <span>📤 Compartir Datos del Mes</span>
          <span className="text-xs text-gray-400">{desplegableCompartir ? '▲' : '▼'}</span>
        </div>
        {desplegableCompartir && (
          <div className="flex flex-col bg-[#fafafa] border-b border-gray-200">
            <div
              className="py-2 px-3 text-xs font-bold text-gray-700 border-b border-gray-100 cursor-pointer hover:bg-gray-100"
              onClick={onCompartirWhatsApp}
            >
              🟢 Compartir por WhatsApp
            </div>
            <div
              className="py-2 px-3 text-xs font-bold text-gray-700 cursor-pointer hover:bg-gray-100"
              onClick={onCompartirCorreo}
            >
              ✉️ Compartir por Correo
            </div>
          </div>
        )}

        {/* Seguridad Anual */}
        <div
          className="flex items-center justify-between py-2 border-b border-gray-100 text-xs font-bold text-gray-700 cursor-pointer hover:bg-gray-50"
          onClick={() => setDesplegableSeguridad(!desplegableSeguridad)}
        >
          <span>🛡️ Seguridad Anual (Copia)</span>
          <span className="text-xs text-gray-400">{desplegableSeguridad ? '▲' : '▼'}</span>
        </div>
        {desplegableSeguridad && (
          <div className="flex flex-col bg-[#fafafa] border-b border-gray-200">
            <div
              className="py-2 px-3 text-xs font-bold text-gray-700 border-b border-gray-100 cursor-pointer hover:bg-gray-100 flex items-center justify-between"
              onClick={onDescargarCopia}
            >
              <span>💾 Guardar Copia de Seguridad</span>
              <span className="text-[10px] text-gray-500 font-normal">.json</span>
            </div>
            <label
              htmlFor="input-importar"
              className="py-2 px-3 text-xs font-bold text-gray-700 cursor-pointer hover:bg-gray-100 flex items-center justify-between"
            >
              <span>📂 Restaurar Copia (Nuevo Móvil)</span>
              <span className="text-[10px] text-gray-500 font-normal">.json</span>
            </label>
            <input
              type="file"
              id="input-importar"
              className="hidden"
              accept=".json"
              onChange={onCargarCopia}
            />
          </div>
        )}

        {/* Publicación Google Play Store (TWA) */}
        <div
          id="btn-menu-playstore"
          className="flex items-center justify-between py-2 px-2 mt-2.5 bg-emerald-50 hover:bg-emerald-100 rounded-lg text-xs font-bold text-emerald-900 border border-emerald-200 cursor-pointer transition-colors"
          onClick={() => {
            onClose();
            onOpenPlayStore();
          }}
        >
          <span className="flex items-center gap-1.5">
            <span>📦</span>
            <span>Empaquetar para Play Store</span>
          </span>
          <span className="text-[10px] bg-emerald-700 text-white px-1.5 py-0.5 rounded font-bold">
            Listo
          </span>
        </div>

        {/* Política de Privacidad (Obligatoria Google Play / RGPD) */}
        <div
          id="btn-menu-privacidad"
          className="flex items-center justify-between py-2 px-2 mt-1.5 bg-gray-50 hover:bg-gray-100 rounded-lg text-xs font-bold text-gray-700 border border-gray-200 cursor-pointer transition-colors"
          onClick={() => {
            onClose();
            onOpenPrivacy();
          }}
        >
          <span className="flex items-center gap-1.5">
            <span>🛡️</span>
            <span>Política de Privacidad (RGPD)</span>
          </span>
          <span className="text-gray-400 text-xs">➔</span>
        </div>

        {/* Información de Versión al final del menú desplegable */}
        <div
          id="menu-footer-version"
          className="mt-4 pt-3 border-t border-gray-200 text-center flex flex-col items-center gap-0.5"
        >
          <div className="text-xs font-bold text-gray-700">
            Fichaje Pro v18.21
          </div>
          <div className="text-[11px] text-gray-500">
            Modo activo: <span className="font-semibold text-teal-800 capitalize">{rol}</span>
          </div>
          <div className="text-[10px] text-gray-400 mt-0.5">
            Cumplimiento Laboral RD-ley 8/2019
          </div>
        </div>

        <button
          id="btn-cerrar-menu"
          onClick={onClose}
          className="bg-gray-700 hover:bg-gray-800 text-white border-none py-2 px-4 rounded mt-3 font-bold text-xs cursor-pointer transition-colors w-full"
        >
          Cerrar Menú
        </button>
      </div>
    </>
  );
};
