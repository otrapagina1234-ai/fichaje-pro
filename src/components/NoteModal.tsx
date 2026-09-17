import React, { useState, useEffect } from 'react';

interface NoteModalProps {
  isOpen: boolean;
  titulo: string;
  notaInicial: string;
  onClose: () => void;
  onSave: (texto: string) => void;
}

export const NoteModal: React.FC<NoteModalProps> = ({
  isOpen,
  titulo,
  notaInicial,
  onClose,
  onSave,
}) => {
  const [texto, setTexto] = useState('');

  useEffect(() => {
    if (isOpen) {
      setTexto(notaInicial || '');
    }
  }, [isOpen, notaInicial]);

  if (!isOpen) return null;

  return (
    <div
      id="modal-nota-overlay"
      className="fixed inset-0 bg-black/50 flex justify-center items-center z-50 p-2.5"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg p-4 w-full max-w-[350px] shadow-xl flex flex-col gap-3"
        onClick={(e) => e.stopPropagation()}
      >
        <div
          id="modal-nota-titulo"
          className="text-sm font-bold text-gray-800 border-b border-gray-200 pb-1"
        >
          {titulo}
        </div>

        <textarea
          id="modal-nota-texto"
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          placeholder="Escribe aquí anotaciones importantes..."
          className="w-full h-24 p-2 text-sm border border-gray-300 rounded resize-none focus:outline-none focus:border-[#007d7a]"
        />

        <div className="flex gap-2 justify-end">
          <button
            id="btn-nota-cancelar"
            onClick={onClose}
            className="py-1.5 px-3.5 border-none rounded font-bold text-xs cursor-pointer bg-gray-300 text-gray-800 hover:bg-gray-400"
          >
            Cancelar
          </button>
          <button
            id="btn-nota-guardar"
            onClick={() => onSave(texto)}
            className="py-1.5 px-3.5 border-none rounded font-bold text-xs cursor-pointer text-white"
            style={{ backgroundColor: 'var(--teal-header)' }}
          >
            Guardar
          </button>
        </div>
      </div>
    </div>
  );
};
