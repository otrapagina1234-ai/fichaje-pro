import React from 'react';
import { VistaTipo } from '../types';

interface ViewSelectorProps {
  vistaActual: VistaTipo;
  onCambiarVista: (vista: VistaTipo) => void;
}

export const ViewSelector: React.FC<ViewSelectorProps> = ({
  vistaActual,
  onCambiarVista,
}) => {
  return (
    <div
      id="vistas-sub"
      className="flex justify-around bg-black/5 p-1 rounded text-xs font-semibold w-full shrink-0"
    >
      <button
        id="v-semana"
        onClick={() => onCambiarVista('semana')}
        className={`px-3 py-1 rounded transition-colors ${
          vistaActual === 'semana'
            ? 'text-white font-bold'
            : 'text-gray-600 hover:text-gray-900'
        }`}
        style={{
          backgroundColor: vistaActual === 'semana' ? 'var(--teal-header)' : 'transparent',
        }}
      >
        SEMANA
      </button>

      <button
        id="v-mes"
        onClick={() => onCambiarVista('mes')}
        className={`px-3 py-1 rounded transition-colors ${
          vistaActual === 'mes'
            ? 'text-white font-bold'
            : 'text-gray-600 hover:text-gray-900'
        }`}
        style={{
          backgroundColor: vistaActual === 'mes' ? 'var(--teal-header)' : 'transparent',
        }}
      >
        MES
      </button>

      <button
        id="v-ano"
        onClick={() => onCambiarVista('ano')}
        className={`px-3 py-1 rounded transition-colors ${
          vistaActual === 'ano'
            ? 'text-white font-bold'
            : 'text-gray-600 hover:text-gray-900'
        }`}
        style={{
          backgroundColor: vistaActual === 'ano' ? 'var(--teal-header)' : 'transparent',
        }}
      >
        AÑO
      </button>
    </div>
  );
};
