export const MESES_NOMBRES = [
  "ENERO", "FEBRERO", "MARZO", "ABRIL", "MAYO", "JUNIO",
  "JULIO", "AGOSTO", "SEPTIEMBRE", "OCTUBRE", "NOVIEMBRE", "DICIEMBRE"
];

export const DIAS_SEMANA_NOMBRES = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

export function normalizarTextoHora(txt: string | undefined): string {
  if (!txt) return '';
  let limpio = txt.trim().replace(/[,;.]/g, ':');
  if (!limpio.includes(':')) {
    if (/^\d{3,4}$/.test(limpio)) {
      const mPart = limpio.slice(-2);
      const hPart = limpio.slice(0, -2);
      limpio = `${hPart}:${mPart}`;
    } else if (/^\d{1,2}$/.test(limpio)) {
      const numH = parseInt(limpio, 10);
      if (numH >= 0 && numH < 24) return `${String(numH).padStart(2, '0')}:00`;
    }
  }
  const partes = limpio.split(':');
  if (partes.length === 2) {
    let h = partes[0].trim();
    let m = partes[1].trim();
    if (h.length === 1 && /^\d$/.test(h)) h = '0' + h;
    if (m.length === 1 && /^\d$/.test(m)) m = m + '0';
    if (/^\d{2}$/.test(h) && /^\d{2}$/.test(m)) {
      const numH = parseInt(h, 10);
      const numM = parseInt(m, 10);
      if (numH >= 0 && numH < 24 && numM >= 0 && numM < 60) {
        return `${h}:${m}`;
      }
    }
  }
  return limpio;
}

export function esHoraValida(txt: string | undefined): boolean {
  if (!txt) return false;
  const norm = normalizarTextoHora(txt);
  return /^\d{2}:\d{2}$/.test(norm);
}

export function calcularTramo(ent?: string, sal?: string): number {
  const normEnt = normalizarTextoHora(ent);
  const normSal = normalizarTextoHora(sal);
  if (normEnt && normSal && normEnt.includes(':') && normSal.includes(':')) {
    const e = normEnt.split(':');
    const s = normSal.split(':');
    const minEnt = parseInt(e[0] || '0', 10) * 60 + parseInt(e[1] || '0', 10);
    const minSal = parseInt(s[0] || '0', 10) * 60 + parseInt(s[1] || '0', 10);
    const diff = minSal - minEnt;
    return diff > 0 ? diff : 0;
  }
  return 0;
}

export function minsATexto(minutos: number): string {
  const hrs = String(Math.floor(minutos / 60)).padStart(2, '0');
  const mins = String(minutos % 60).padStart(2, '0');
  return `${hrs}:${mins}`;
}

/**
 * Devuelve el Lunes de la semana que contiene a la fecha dada.
 * En el estándar laboral español/europeo la semana empieza en Lunes.
 */
export function obtenerLunesSemana(fecha: Date): Date {
  const d = new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate());
  const diaSemana = d.getDay(); // 0 (Dom), 1 (Lun), ..., 6 (Sáb)
  const diffAlLunes = diaSemana === 0 ? -6 : 1 - diaSemana;
  d.setDate(d.getDate() + diffAlLunes);
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * Devuelve exactamente los 7 días (Lunes a Domingo) de la semana.
 */
export function obtenerDiasDeLaSemana(fecha: Date): Date[] {
  const lunes = obtenerLunesSemana(fecha);
  const dias: Date[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(lunes);
    d.setDate(lunes.getDate() + i);
    dias.push(d);
  }
  return dias;
}

/**
 * Formato legible para la cabecera en vista semana (ej. SEM. 14 - 20 SEP 2026).
 */
export function formatearRangoSemana(fecha: Date): string {
  const dias = obtenerDiasDeLaSemana(fecha);
  const lunes = dias[0];
  const domingo = dias[6];
  if (lunes.getMonth() === domingo.getMonth()) {
    return `SEM. ${lunes.getDate()} - ${domingo.getDate()} ${MESES_NOMBRES[lunes.getMonth()]} ${lunes.getFullYear()}`;
  }
  const mes1 = MESES_NOMBRES[lunes.getMonth()].substring(0, 3);
  const mes2 = MESES_NOMBRES[domingo.getMonth()].substring(0, 3);
  return `SEM. ${lunes.getDate()} ${mes1} - ${domingo.getDate()} ${mes2} ${domingo.getFullYear()}`;
}

