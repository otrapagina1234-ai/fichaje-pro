import React from 'react';

interface TotalsPanelProps {
  totalSemana: string;
  totalMes: string;
}

export const TotalsPanel: React.FC<TotalsPanelProps> = ({ totalSemana, totalMes }) => {
  return (
    <div
      id="panel-totales"
      className="flex justify-between items-center bg-white px-3 py-2 rounded-md shadow-xs text-xs font-bold text-gray-800 w-full shrink-0"
    >
      <div>
        Horas Semana:{' '}
        <span id="total-semana" className="text-sm font-bold" style={{ color: 'var(--teal-header)' }}>
          {totalSemana}
        </span>
      </div>
      <div>
        Total Mes:{' '}
        <span id="total-mes" className="text-sm font-bold" style={{ color: 'var(--teal-header)' }}>
          {totalMes}
        </span>
      </div>
    </div>
  );
};
