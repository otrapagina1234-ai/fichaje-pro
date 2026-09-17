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
      className="flex items-center justify-between text-white rounded-lg px-2 py-1.5 w-full relative min-h-[42px] shrink-0 shadow-xs"
      style={{ backgroundColor: 'var(--teal-header)' }}
    >
      <button
        id="btn-menu-tres"
        onClick={onOpenMenu}
        className="bg-white/20 hover:bg-white/30 active:bg-white/40 border border-white/30 text-white rounded-md h-8 w-8 flex items-center justify-center cursor-pointer transition-all shrink-0 shadow-2xs"
        aria-label="Abrir menú"
        title="Abrir Menú"
      >
        <span className="text-lg leading-none select-none">☰</span>
      </button>

      <div className="flex items-center justify-center gap-2 flex-1 mx-1 min-w-0">
        <button
          id="btn-cambio-mes-prev"
          onClick={onPrev}
          className="bg-white/15 hover:bg-white/25 active:bg-white/30 border-none text-white px-2 py-1 rounded-md text-xs font-bold cursor-pointer shrink-0 transition-colors"
          title="Anterior"
        >
          ◄
        </button>
        <div
          id="mes-titulo"
          className="text-xs sm:text-sm font-bold uppercase tracking-wider text-center truncate max-w-[190px]"
        >
          {titulo}
        </div>
        <button
          id="btn-cambio-mes-next"
          onClick={onNext}
          className="bg-white/15 hover:bg-white/25 active:bg-white/30 border-none text-white px-2 py-1 rounded-md text-xs font-bold cursor-pointer shrink-0 transition-colors"
          title="Siguiente"
        >
          ►
        </button>
      </div>

      {onHoy && (
        <button
          id="btn-ir-hoy"
          onClick={onHoy}
          className="bg-white/20 hover:bg-white/30 active:bg-white/40 border border-white/30 text-white text-[11px] font-bold px-2.5 py-1 rounded-md cursor-pointer transition-all shrink-0 shadow-2xs h-8 flex items-center justify-center"
          title="Ir al día actual"
        >
          HOY
        </button>
      )}
    </div>
  );
};
