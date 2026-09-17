import React from 'react';

interface ShiftModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectShift: (shift: 'm' | 't') => void;
}

export const ShiftModal: React.FC<ShiftModalProps> = ({
  isOpen,
  onClose,
  onSelectShift,
}) => {
  if (!isOpen) return null;

  return (
    <div
      id="modal-turno-overlay"
      className="fixed inset-0 bg-black/50 flex justify-center items-center z-50 p-2.5"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg p-4 w-full max-w-[340px] shadow-xl flex flex-col gap-3"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="text-sm font-bold text-gray-800 text-center border-b border-gray-200 pb-2">
          ¿Qué turno vas a registrar?
        </div>

        <div className="flex flex-col gap-2 my-1">
          <button
            id="btn-turno-manana"
            onClick={() => onSelectShift('m')}
            className="p-3 border border-gray-700 rounded-md font-bold text-sm cursor-pointer flex items-center justify-center text-center w-full transition-transform active:scale-[0.98] bg-[#ffaa3b] text-gray-900 shadow-sm"
          >
            ☀️ TURNO DE MAÑANA
          </button>

          <button
            id="btn-turno-tarde"
            onClick={() => onSelectShift('t')}
            className="p-3 border border-gray-700 rounded-md font-bold text-sm cursor-pointer flex items-center justify-center text-center w-full transition-transform active:scale-[0.98] bg-[#a372eb] text-white shadow-sm"
          >
            🌙 TURNO DE TARDE
          </button>
        </div>

        <div className="flex justify-center">
          <button
            id="btn-turno-cancelar"
            onClick={onClose}
            className="w-full py-2 px-3 border-none rounded font-bold text-xs cursor-pointer bg-gray-300 text-gray-800 hover:bg-gray-400 transition-colors"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
};
