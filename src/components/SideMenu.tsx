import React, { useState } from 'react';
import { RolTipo, TurnoTipo, ColoresConfig } from '../types';

interface SideMenuProps {
  isOpen: boolean;
  onClose: () => void;
  nombre: string;
  onNombreChange: (val: string) => void;
  dni: string;
  onDniChange: (val: string) => void;
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
        onClick={onClose}
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
            onClick={onClose}
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
            value={nombre}
            onChange={(e) => onNombreChange(e.target.value)}
            placeholder="Nombre y Apellidos"
            className="flex-1 p-1 text-xs font-semibold rounded border border-gray-300 focus:outline-none focus:border-teal-700"
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
            value={dni}
            onChange={(e) => onDniChange(e.target.value)}
            placeholder="Documento ID"
            className="flex-1 p-1 text-xs font-semibold rounded border border-gray-300 focus:outline-none focus:border-teal-700"
          />
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
          <div className="my-2 p-2.5 bg-amber-50/80 rounded-lg border border-amber-200 flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-900 flex items-center gap-1">
                <span>🔑</span> Código de Empresa:
              </span>
            </div>
            <input
              type="text"
              id="input-empresa-codigo"
              value={empresaCodigo}
              onChange={(e) => onEmpresaCodigoChange(e.target.value.toUpperCase())}
              placeholder="Ej: EMPRESA-1 o AMP2026"
              className="w-full p-1.5 text-xs font-bold tracking-wider rounded border border-amber-300 bg-white focus:outline-none focus:border-amber-600 uppercase"
            />
            <span className="text-[10px] text-amber-800 leading-tight">
              Introduce el código facilitado por tu empresa para vincular tus fichajes con el panel de tu jefe.
            </span>
          </div>
        )}

        {rol === 'jefe' && (
          <div className="my-2 p-2.5 bg-blue-50/80 rounded-lg border border-blue-200 flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-blue-900 flex items-center gap-1">
                <span>🏢</span> Clave de tu Empresa:
              </span>
              {empresaCodigo && (
                <button
                  type="button"
                  onClick={copiarCodigo}
                  className="text-[10px] px-2 py-0.5 bg-blue-600 text-white font-bold rounded hover:bg-blue-700 cursor-pointer transition-colors"
                >
                  {codigoCopiado ? '✓ Copiado' : 'Copiar'}
                </button>
              )}
            </div>
            <input
              type="text"
              id="input-empresa-codigo-jefe"
              value={empresaCodigo}
              onChange={(e) => onEmpresaCodigoChange(e.target.value.toUpperCase())}
              placeholder="Crea un código (Ej: MIEMPRESA2026)"
              className="w-full p-1.5 text-xs font-bold tracking-wider rounded border border-blue-300 bg-white focus:outline-none focus:border-blue-600 uppercase"
            />
            <span className="text-[10px] text-blue-800 leading-tight">
              Tus empleados deben ingresar este mismo código para que sus fichajes se sincronicen exclusivamente contigo y no se mezclen con otras empresas.
            </span>
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

        {/* Tarjeta de Servicio Nube (Unificada y transparente) */}
        <div className="p-2.5 bg-teal-50/60 rounded-lg border border-teal-200 flex flex-col gap-2 mb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="text-xs font-bold text-teal-900">Base de Datos Cloud</span>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-teal-100 text-teal-800">
              {nubeConectado ? 'En directo' : 'Pausado'}
            </span>
          </div>
          <p className="text-[10px] text-teal-800 leading-relaxed">
            Servicio oficial en la nube de alta disponibilidad con copias en tiempo real y cifrado SSL.
          </p>
          <button
            type="button"
            id="btn-alternar-nube"
            onClick={onAlternarNube}
            className={`w-full py-1 px-2 rounded text-[11px] font-bold transition-colors cursor-pointer border ${
              nubeConectado
                ? 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100'
                : 'bg-emerald-600 text-white border-emerald-600 hover:bg-emerald-700'
            }`}
          >
            {nubeConectado ? '⏸️ Pausar Sincronización' : '▶️ Reanudar Sincronización'}
          </button>
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
