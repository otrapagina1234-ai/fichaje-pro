import React from 'react';

interface HeaderBarProps {
  titulo: string;
  onPrev: () => void;
  onNext: () => void;
  onOpenMenu: () => void;
  onHoy?: () => void;
}

export const HeaderBar: React.FC<HeaderBarProps> = ({
  titulo,
  onPrev,
  onNext,
  onOpenMenu,
  onHoy,
}) => {
  return (
    <div
      id="header-barra"
      className="flex items-center justify-center text-white rounded-md px-1.5 py-1 w-full relative min-h-[38px] shrink-0"
      style={{ backgroundColor: 'var(--teal-header)' }}
    >
      <button
        id="btn-menu-tres"
        onClick={onOpenMenu}
        className="absolute left-1.5 bg-transparent border-none text-white text-xl cursor-pointer px-2 py-1 leading-none hover:opacity-80 active:scale-95 transition-all"
        aria-label="Abrir menú"
      >
        ☰
      </button>

      <div className="flex items-center justify-center gap-6">
        <button
          id="btn-cambio-mes-prev"
          onClick={onPrev}
          className="bg-white/15 hover:bg-white/25 active:bg-white/30 border-none text-white px-2.5 py-1 rounded text-xs font-bold cursor-pointer shrink-0 transition-colors"
        >
          -
        </button>
        <div
          id="mes-titulo"
          className="text-sm font-bold uppercase tracking-wider text-center whitespace-nowrap min-w-[140px]"
        >
          {titulo}
        </div>
        <button
          id="btn-cambio-mes-next"
          onClick={onNext}
          className="bg-white/15 hover:bg-white/25 active:bg-white/30 border-none text-white px-2.5 py-1 rounded text-xs font-bold cursor-pointer shrink-0 transition-colors"
        >
          +
        </button>
      </div>

      {onHoy && (
        <button
          id="btn-ir-hoy"
          onClick={onHoy}
          className="absolute right-1.5 bg-white/20 hover:bg-white/30 active:bg-white/40 border border-white/30 text-white text-[11px] font-bold px-2 py-1 rounded cursor-pointer transition-all"
          title="Ir al día actual"
        >
          HOY
        </button>
      )}
    </div>
  );
};
