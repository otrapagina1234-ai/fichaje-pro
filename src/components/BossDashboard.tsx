import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  listarFichajesEmpleadosNube,
  suscribirFichajesEmpleados,
  obtenerProveedorActivo,
  eliminarFichajeNube,
  eliminarFichajesDeEmpleadoNube,
  eliminarTodosFichajesNube,
} from '../services/cloudSync';
import { CloudFichajeItem } from '../types';
import { obtenerDiasDeLaSemana, minsATexto } from '../utils/time';

interface BossDashboardProps {
  onOpenMenu: () => void;
  empresaCodigo?: string;
  onEmpresaCodigoChange?: (val: string) => void;
  fechaActual?: Date;
  onTotalesCalculados?: (totalSemana: string, totalMes: string) => void;
}

interface EmpleadoGrupo {
  nombre: string;
  dni: string;
  fichajes: CloudFichajeItem[];
  totalHoras: string;
  ultimoFichaje: string;
}

interface ModalBorradoConfig {
  tipo: 'fichaje' | 'empleado' | 'todo';
  id?: string;
  nombre?: string;
}

export const BossDashboard: React.FC<BossDashboardProps> = ({
  onOpenMenu,
  empresaCodigo = '',
  onEmpresaCodigoChange,
  fechaActual,
  onTotalesCalculados,
}) => {
  const [cargando, setCargando] = useState(false);
  const [registros, setRegistros] = useState<CloudFichajeItem[]>([]);
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [notificacionExito, setNotificacionExito] = useState<string | null>(null);
  const [detalleItem, setDetalleItem] = useState<CloudFichajeItem | null>(null);
  const [copiado, setCopiado] = useState(false);
  const [codigoInput, setCodigoInput] = useState(empresaCodigo);
  const [guardadoExitosa, setGuardadoExitosa] = useState(false);
  const [empleadosExpandidos, setEmpleadosExpandidos] = useState<Record<string, boolean>>({});
  const [empleadoSeleccionadoNombre, setEmpleadoSeleccionadoNombre] = useState<string | null>(null);
  const [modalBorrado, setModalBorrado] = useState<ModalBorradoConfig | null>(null);
  const [procesandoBorrado, setProcesandoBorrado] = useState(false);
  const [copiadoEmpleado, setCopiadoEmpleado] = useState<string | null>(null);

  const formatearFechaLimpia = (fechaRaw?: string): string => {
    if (!fechaRaw) return 'Fecha no esp.';
    if (fechaRaw.includes('T')) {
      const soloFecha = fechaRaw.split('T')[0];
      const partes = soloFecha.split('-');
      if (partes.length === 3) {
        return `${partes[2].padStart(2, '0')}/${partes[1].padStart(2, '0')}/${partes[0]}`;
      }
      return soloFecha;
    }
    if (fechaRaw.includes('fichaje-')) {
      const match = fechaRaw.match(/fichaje-(\d{4})-(\d{1,2})-(\d{1,2})/);
      if (match) {
        const y = match[1];
        const mRaw = match[2];
        const d = match[3].padStart(2, '0');
        const mNum = parseInt(mRaw, 10);
        let m = mNum + 1;
        if (mRaw.startsWith('0') || mNum > 11) {
          m = mNum;
        }
        return `${d}/${String(m).padStart(2, '0')}/${y}`;
      }
    }
    if (fechaRaw.includes('-')) {
      const partes = fechaRaw.split('-');
      if (partes.length === 3) {
        return `${partes[2].padStart(2, '0')}/${partes[1].padStart(2, '0')}/${partes[0]}`;
      }
    }
    return fechaRaw;
  };

  const extraerFechaItem = useCallback((item: CloudFichajeItem): Date | null => {
    // 1. Prioridad: claveId (ej: "fichaje-2026-8-17" donde mes es 0-indexed, ej 8 = Sep)
    if (item.claveId) {
      const match = item.claveId.match(/fichaje-(\d{4})-(\d{1,2})-(\d{1,2})/);
      if (match) {
        const y = parseInt(match[1], 10);
        const m = parseInt(match[2], 10); // 0-indexed
        const d = parseInt(match[3], 10);
        if (!isNaN(y) && !isNaN(m) && !isNaN(d)) {
          return new Date(y, m, d, 12, 0, 0);
        }
      }
    }

    // 2. Prioridad: item.datos.dia (ej: "2026-09-17")
    const diaVal = (item.datos as any)?.dia;
    if (diaVal && typeof diaVal === 'string' && diaVal.includes('-')) {
      const parts = diaVal.split('-');
      if (parts.length === 3) {
        const y = parseInt(parts[0], 10);
        const m = parseInt(parts[1], 10); // 1-based
        const d = parseInt(parts[2], 10);
        if (!isNaN(y) && !isNaN(m) && !isNaN(d)) {
          return new Date(y, m - 1, d, 12, 0, 0);
        }
      }
    }

    // 3. Prioridad: item.fecha (ISO string)
    if (item.fecha) {
      if (item.fecha.includes('T')) {
        const parts = item.fecha.split('T')[0].split('-');
        if (parts.length === 3) {
          const y = parseInt(parts[0], 10);
          const m = parseInt(parts[1], 10); // 1-based
          const d = parseInt(parts[2], 10);
          if (!isNaN(y) && !isNaN(m) && !isNaN(d)) {
            return new Date(y, m - 1, d, 12, 0, 0);
          }
        }
      } else if (item.fecha.includes('-')) {
        const parts = item.fecha.split('-');
        if (parts.length === 3) {
          const y = parseInt(parts[0], 10);
          const m = parseInt(parts[1], 10); // 1-based
          const d = parseInt(parts[2], 10);
          if (!isNaN(y) && !isNaN(m) && !isNaN(d)) {
            return new Date(y, m - 1, d, 12, 0, 0);
          }
        }
      }
    }

    return null;
  }, []);

  const formatearFechaItem = useCallback(
    (item: CloudFichajeItem): string => {
      const d = extraerFechaItem(item);
      if (!d) return 'Fecha no esp.';
      const diaStr = String(d.getDate()).padStart(2, '0');
      const mesStr = String(d.getMonth() + 1).padStart(2, '0');
      const anioStr = d.getFullYear();
      return `${diaStr}/${mesStr}/${anioStr}`;
    },
    [extraerFechaItem]
  );

  const obtenerInfoAuditoria = useCallback(
    (item: CloudFichajeItem) => {
      const dJornada = extraerFechaItem(item);
      const diaJornadaStr = dJornada
        ? `${String(dJornada.getDate()).padStart(2, '0')}/${String(dJornada.getMonth() + 1).padStart(2, '0')}/${dJornada.getFullYear()}`
        : 'Desconocido';

      let dAnotacion: Date | null = null;
      if (item.datos?.ultimaModificacion) {
        const p = new Date(item.datos.ultimaModificacion);
        if (!isNaN(p.getTime())) dAnotacion = p;
      }
      if (!dAnotacion && item.datos?.fechaRegistro) {
        const p = new Date(item.datos.fechaRegistro);
        if (!isNaN(p.getTime())) dAnotacion = p;
      }
      if (!dAnotacion && item.actualizadoEn) {
        const p = new Date(item.actualizadoEn);
        if (!isNaN(p.getTime())) dAnotacion = p;
      }

      let fechaAnotacionStr = item.actualizadoEn || diaJornadaStr;
      let fechaAnotacionSoloDia = '';
      let esAposteriori = false;

      if (dAnotacion && dJornada) {
        const diaA = dAnotacion.getDate();
        const mesA = dAnotacion.getMonth();
        const anioA = dAnotacion.getFullYear();

        const diaJ = dJornada.getDate();
        const mesJ = dJornada.getMonth();
        const anioJ = dJornada.getFullYear();

        fechaAnotacionSoloDia = `${String(diaA).padStart(2, '0')}/${String(mesA + 1).padStart(2, '0')}/${anioA}`;
        const horaA = String(dAnotacion.getHours()).padStart(2, '0');
        const minA = String(dAnotacion.getMinutes()).padStart(2, '0');
        fechaAnotacionStr = `${fechaAnotacionSoloDia} (${horaA}:${minA})`;

        esAposteriori = diaA !== diaJ || mesA !== mesJ || anioA !== anioJ;
      } else if (item.actualizadoEn) {
        fechaAnotacionSoloDia = item.actualizadoEn.split(',')[0].trim();
      }

      const origenObj = item.datos?.origen || {};
      const valoresOrigen = Object.values(origenObj);
      let esAutomatico = false;
      let esManual = false;

      if (valoresOrigen.length > 0) {
        esAutomatico = valoresOrigen.every((v) => v === 'AUTOMATICO');
        esManual = valoresOrigen.every((v) => v === 'MANUAL');
      } else {
        esManual = true;
      }

      let modoTexto = '✍️ Anotación Manual';
      if (esAutomatico) modoTexto = '🤖 Botón Fichar (Automático)';
      else if (!esManual && valoresOrigen.length > 0) modoTexto = '🔀 Mixto (Botón + Manual)';

      return {
        diaJornadaStr,
        fechaAnotacionStr,
        fechaAnotacionSoloDia,
        esAposteriori,
        esAutomatico,
        esManual,
        modoTexto,
        origenObj,
      };
    },
    [extraerFechaItem]
  );

  useEffect(() => {
    setCodigoInput(empresaCodigo);
  }, [empresaCodigo]);

  const handleGuardarCodigo = (nuevoCodigo?: string) => {
    const codeToSave = (nuevoCodigo !== undefined ? nuevoCodigo : codigoInput).trim().toUpperCase();
    if (onEmpresaCodigoChange) {
      onEmpresaCodigoChange(codeToSave);
    }
    setGuardadoExitosa(true);
    setTimeout(() => setGuardadoExitosa(false), 3000);
  };

  const handleGenerarCodigo = () => {
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    const nuevo = `AMP-${randomNum}`;
    setCodigoInput(nuevo);
    handleGuardarCodigo(nuevo);
  };

  const proveedor = obtenerProveedorActivo();

  const cargarArchivos = useCallback(async () => {
    setCargando(true);
    setMensaje(`Consultando registros en ${proveedor.toUpperCase()}...`);

    try {
      const items = await listarFichajesEmpleadosNube(empresaCodigo);
      setRegistros(items);
      if (items.length === 0) {
        if (!empresaCodigo) {
          setMensaje(
            `Define el Código de tu Empresa para aislar tus registros y que tus empleados se sincronicen únicamente con tu panel.`
          );
        } else {
          setMensaje(
            `Aún no hay fichajes registrados con el código "${empresaCodigo}". Asegúrate de que tus empleados tengan introducido este código en sus móviles.`
          );
        }
      } else {
        setMensaje(null);
      }
    } catch (err: any) {
      console.error(err);
      setMensaje(`Error al consultar ${proveedor.toUpperCase()}. Revisa tu conexión a internet.`);
    } finally {
      setCargando(false);
    }
  }, [empresaCodigo, proveedor]);

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
  }, [empresaCodigo, cargarArchivos]);

  // Suma minutos en formato HH:MM
  const sumarMinutos = (fichajesList: CloudFichajeItem[]): string => {
    let totalMins = 0;
    fichajesList.forEach((item) => {
      const strT = item.datos?.t || '00:00';
      const partes = strT.split(':');
      if (partes.length === 2) {
        const hh = parseInt(partes[0], 10) || 0;
        const mm = parseInt(partes[1], 10) || 0;
        totalMins += hh * 60 + mm;
      }
    });
    const h = Math.floor(totalMins / 60);
    const m = totalMins % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  };

  // Cálculo detallado de horas para un conjunto de fichajes de un empleado
  const calcularResumenEmpleado = useCallback((fichajesList: CloudFichajeItem[], refDate: Date) => {
    const diasSemana = obtenerDiasDeLaSemana(refDate);
    const lunIni = new Date(diasSemana[0]);
    lunIni.setHours(0, 0, 0, 0);
    const domFin = new Date(diasSemana[6]);
    domFin.setHours(23, 59, 59, 999);

    const targetAnio = refDate.getFullYear();
    const targetMes = refDate.getMonth();

    let minsSemana = 0;
    let minsMes = 0;

    fichajesList.forEach((item) => {
      const itemDate = extraerFechaItem(item);

      const strT = item.datos?.t || '00:00';
      const partes = strT.split(':');
      let minsItem = 0;
      if (partes.length === 2) {
        minsItem = (parseInt(partes[0], 10) || 0) * 60 + (parseInt(partes[1], 10) || 0);
      }

      if (!itemDate || minsItem <= 0) return;

      const tItem = itemDate.getTime();
      if (tItem >= lunIni.getTime() && tItem <= domFin.getTime()) {
        minsSemana += minsItem;
      }

      if (itemDate.getFullYear() === targetAnio && itemDate.getMonth() === targetMes) {
        minsMes += minsItem;
      }
    });

    return {
      sem: minsATexto(minsSemana),
      mes: minsATexto(minsMes),
      total: sumarMinutos(fichajesList),
    };
  }, [extraerFechaItem]);

  const generarInformeEmpleadoText = (
    grupo: EmpleadoGrupo,
    resumen: { sem: string; mes: string; total: string }
  ) => {
    const dniStr = grupo.dni ? ` (DNI: ${grupo.dni})` : '';
    let txt = `📋 INFORME DE HORAS TRABAJADAS - NÓMINAS\n`;
    txt += `👤 Empleado: ${grupo.nombre}${dniStr}\n`;
    if (empresaCodigo) txt += `🏢 Empresa: ${empresaCodigo}\n`;
    txt += `-----------------------------------\n`;
    txt += `📅 Esta Semana: ${resumen.sem} hrs\n`;
    txt += `🗓️ Este Mes: ${resumen.mes} hrs\n`;
    txt += `⏱️ Acumulado Total: ${resumen.total} hrs (${grupo.fichajes.length} fichajes)\n`;
    txt += `-----------------------------------\n`;
    txt += `Desglose de jornadas recientes:\n`;
    grupo.fichajes.slice(0, 10).forEach((item) => {
      const f = formatearFechaItem(item);
      const e = item.datos?.e1 || '--:--';
      const s = item.datos?.s1 || '--:--';
      const t = item.datos?.t || '00:00';
      txt += `• ${f}: ${e} a ${s} (${t}h)\n`;
    });
    txt += `-----------------------------------\n`;
    txt += `Generado desde FichajePro`;
    return txt;
  };

  const copiarInformeEmpleado = (
    grupo: EmpleadoGrupo,
    resumen: { sem: string; mes: string; total: string }
  ) => {
    const texto = generarInformeEmpleadoText(grupo, resumen);
    navigator.clipboard.writeText(texto).then(() => {
      setCopiadoEmpleado(grupo.nombre);
      setTimeout(() => setCopiadoEmpleado(null), 3000);
    });
  };

  const compartirWhatsApp = (
    grupo: EmpleadoGrupo,
    resumen: { sem: string; mes: string; total: string }
  ) => {
    const texto = generarInformeEmpleadoText(grupo, resumen);
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(texto)}`;
    window.open(url, '_blank');
  };

  const compartirEmail = (
    grupo: EmpleadoGrupo,
    resumen: { sem: string; mes: string; total: string }
  ) => {
    const texto = generarInformeEmpleadoText(grupo, resumen);
    const asunto = `Informe de Horas para Nómina - ${grupo.nombre}`;
    const url = `mailto:?subject=${encodeURIComponent(asunto)}&body=${encodeURIComponent(texto)}`;
    window.location.href = url;
  };

  // Agrupación estructurada por nombre de empleado
  const gruposEmpleados = useMemo<EmpleadoGrupo[]>(() => {
    const mapa = new Map<string, CloudFichajeItem[]>();
    registros.forEach((item) => {
      const nameKey = (item.empleadoNombre || 'Empleado Anónimo').trim();
      if (!mapa.has(nameKey)) {
        mapa.set(nameKey, []);
      }
      mapa.get(nameKey)!.push(item);
    });

    const resultado: EmpleadoGrupo[] = [];
    mapa.forEach((fichajesList, nombre) => {
      // Ordenar fichajes estrictamente por fecha descendente (los más recientes primero)
      fichajesList.sort((a, b) => {
        const timeA = extraerFechaItem(a)?.getTime() || 0;
        const timeB = extraerFechaItem(b)?.getTime() || 0;
        return timeB - timeA;
      });

      const primerItem = fichajesList[0];
      const dni = primerItem?.empleadoDni || '';
      const totalHoras = sumarMinutos(fichajesList);
      const ultimoFichaje = primerItem ? formatearFechaItem(primerItem) : '';

      resultado.push({
        nombre,
        dni,
        fichajes: fichajesList,
        totalHoras,
        ultimoFichaje,
      });
    });

    resultado.sort((a, b) => a.nombre.localeCompare(b.nombre));
    return resultado;
  }, [registros, extraerFechaItem, formatearFechaItem]);

  const totalHorasGlobal = useMemo(() => {
    return sumarMinutos(registros);
  }, [registros]);

  // Actualizar totales de la barra superior según el empleado seleccionado (o '---' si no hay ninguno abierto)
  useEffect(() => {
    if (!onTotalesCalculados) return;
    const refDate = fechaActual || new Date();

    if (!empleadoSeleccionadoNombre) {
      onTotalesCalculados('---', '---');
      return;
    }

    const grupoSel = gruposEmpleados.find((g) => g.nombre === empleadoSeleccionadoNombre);
    if (!grupoSel) {
      onTotalesCalculados('---', '---');
      return;
    }

    const resumen = calcularResumenEmpleado(grupoSel.fichajes, refDate);
    onTotalesCalculados(resumen.sem, resumen.mes);
  }, [registros, fechaActual, empleadoSeleccionadoNombre, gruposEmpleados, calcularResumenEmpleado, onTotalesCalculados]);

  const toggleExpandirEmpleado = (nombre: string) => {
    setEmpleadosExpandidos((prev) => {
      const estaExpandidoActual = Boolean(prev[nombre]);
      const nuevo = { ...prev, [nombre]: !estaExpandidoActual };

      if (!estaExpandidoActual) {
        setEmpleadoSeleccionadoNombre(nombre);
      } else {
        const otrosExpandidos = Object.keys(nuevo).filter((k) => nuevo[k]);
        setEmpleadoSeleccionadoNombre(
          otrosExpandidos.length > 0 ? otrosExpandidos[otrosExpandidos.length - 1] : null
        );
      }
      return nuevo;
    });
  };

  // Ejecutar confirmación de borrado
  const confirmarEjecutarBorrado = async () => {
    if (!modalBorrado) return;
    setProcesandoBorrado(true);
    try {
      if (modalBorrado.tipo === 'fichaje' && modalBorrado.id) {
        await eliminarFichajeNube(modalBorrado.id);
        mostrarExitoTemp('✓ Fichaje eliminado correctamente');
      } else if (modalBorrado.tipo === 'empleado' && modalBorrado.nombre) {
        await eliminarFichajesDeEmpleadoNube(modalBorrado.nombre, empresaCodigo);
        mostrarExitoTemp(`✓ Fichajes de "${modalBorrado.nombre}" eliminados`);
      } else if (modalBorrado.tipo === 'todo') {
        await eliminarTodosFichajesNube(empresaCodigo);
        mostrarExitoTemp('✓ Todos los datos de prueba han sido borrados');
      }
      await cargarArchivos();
    } catch (err) {
      console.error('Error al borrar:', err);
    } finally {
      setProcesandoBorrado(false);
      setModalBorrado(null);
    }
  };

  const mostrarExitoTemp = (msg: string) => {
    setNotificacionExito(msg);
    setTimeout(() => setNotificacionExito(null), 3500);
  };

  return (
    <div
      id="panel-jefe-dashboard"
      className="bg-white rounded-md p-3 shadow-xs flex-1 overflow-y-auto flex flex-col gap-3 w-full"
    >
      {/* Encabezado Principal */}
      <div className="border-b-2 pb-2" style={{ borderColor: 'var(--teal-header)' }}>
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold flex items-center gap-1.5" style={{ color: 'var(--teal-header)' }}>
            <span>👥</span> Panel de Control del Jefe
          </h3>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-green-100 text-green-800 border border-green-300 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
            En vivo: {proveedor.toUpperCase()}
          </span>
        </div>
      </div>

      {/* Notificación de Éxito Temporal */}
      {notificacionExito && (
        <div className="p-2.5 bg-emerald-600 text-white text-xs font-bold rounded-lg shadow-sm flex items-center justify-between animate-fade-in">
          <span>{notificacionExito}</span>
          <button onClick={() => setNotificacionExito(null)} className="text-white hover:text-emerald-200">
            ✕
          </button>
        </div>
      )}

      {/* Resumen General de KPIs */}
      {registros.length > 0 && (
        <div className="grid grid-cols-3 gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-200 shadow-2xs text-center">
          <div className="flex flex-col items-center">
            <span className="text-[10px] uppercase font-bold text-slate-500">Empleados</span>
            <span className="text-sm font-black text-slate-800">👤 {gruposEmpleados.length}</span>
          </div>
          <div className="flex flex-col items-center border-x border-slate-200 px-1">
            <span className="text-[10px] uppercase font-bold text-slate-500">Total Fichajes</span>
            <span className="text-sm font-black text-teal-700">📁 {registros.length}</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-[10px] uppercase font-bold text-slate-500">Horas Totales</span>
            <span className="text-sm font-black text-blue-800">⏱️ {totalHorasGlobal}h</span>
          </div>
        </div>
      )}

      {/* Botonera de Acciones Globales */}
      <div className="flex gap-2 w-full">
        <button
          id="btn-cargar-empleados"
          onClick={cargarArchivos}
          disabled={cargando}
          className="w-full py-2 px-3 text-white text-xs font-bold rounded-lg cursor-pointer transition-opacity disabled:opacity-50 hover:opacity-90 shadow-xs flex items-center justify-center gap-1.5"
          style={{ backgroundColor: 'var(--teal-header)' }}
        >
          {cargando ? '🔄 Actualizando...' : `🔄 Actualizar Panel`}
        </button>
      </div>

      {/* Mensaje Informativo o Estado Vacío */}
      {mensaje && (
        <div className="text-center py-6 px-3 text-xs text-slate-500 bg-slate-50 border border-slate-200 rounded-xl italic">
          {mensaje}
        </div>
      )}

      {/* LISTA ESTRUCTURADA AGRUPADA POR EMPLEADO */}
      {gruposEmpleados.length > 0 && (
        <div className="flex flex-col gap-3 mt-1">
          <div className="text-xs font-bold text-slate-700 flex items-center justify-between px-1">
            <span>👥 Empleados Registrados ({gruposEmpleados.length}):</span>
            <span className="text-[10px] font-normal text-slate-500">Organizados por nombre</span>
          </div>

          {gruposEmpleados.map((grupo) => {
            const estaExpandido = Boolean(empleadosExpandidos[grupo.nombre]);

            return (
              <div
                key={grupo.nombre}
                className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs transition-all"
              >
                {/* Cabecera de la Tarjeta del Empleado */}
                <div className="p-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between gap-2">
                  <div
                    onClick={() => toggleExpandirEmpleado(grupo.nombre)}
                    className="flex flex-col min-w-0 cursor-pointer flex-1"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-sm">👤</span>
                      <span className="font-bold text-xs text-slate-900 truncate">
                        {grupo.nombre}
                      </span>
                      {grupo.dni && (
                        <span className="text-[10px] font-semibold text-slate-500 bg-slate-200/80 px-1.5 py-0.2 rounded shrink-0">
                          {grupo.dni}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-600">
                      <span className="font-semibold text-teal-700 bg-teal-50 px-1.5 py-0.5 rounded border border-teal-200">
                        ⏱️ {grupo.totalHoras} hrs
                      </span>
                      <span>•</span>
                      <span>📁 {grupo.fichajes.length} fichaje(s)</span>
                    </div>
                  </div>

                  {/* Acciones de la Cabecera de Empleado */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => toggleExpandirEmpleado(grupo.nombre)}
                      className="px-2.5 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-md text-[11px] font-bold cursor-pointer transition-colors"
                    >
                      {estaExpandido ? '🔼 Ocultar' : '📂 Ver Fichajes'}
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setModalBorrado({
                          tipo: 'empleado',
                          nombre: grupo.nombre,
                        })
                      }
                      className="p-1.5 bg-rose-100 hover:bg-rose-200 text-rose-800 rounded-md text-xs cursor-pointer transition-colors"
                      title={`Eliminar todos los registros de ${grupo.nombre}`}
                    >
                      🗑️
                    </button>
                  </div>
                </div>

                {/* Desplegable de Fichajes del Empleado */}
                {estaExpandido && (
                  <div className="p-2.5 bg-slate-50/50 flex flex-col gap-2.5 border-t border-slate-100">
                    {/* Resumen de Horas de este empleado (Semana, Mes y Total) */}
                    {(() => {
                      const resumen = calcularResumenEmpleado(grupo.fichajes, fechaActual || new Date());
                      return (
                        <div className="bg-gradient-to-r from-teal-50/90 to-blue-50/90 border border-teal-200/90 rounded-xl p-3 flex flex-col gap-2.5 shadow-2xs">
                          <div className="text-[11px] font-bold text-teal-950 flex items-center justify-between border-b border-teal-200/60 pb-1.5">
                            <span className="flex items-center gap-1">
                              📊 <span>Resumen de Horas: <strong>{grupo.nombre}</strong></span>
                            </span>
                            <span className="text-[10px] font-bold text-teal-800 bg-white/90 px-2 py-0.5 rounded-md border border-teal-200 shadow-2xs">
                              Período activo
                            </span>
                          </div>
                          <div className="grid grid-cols-3 gap-2 text-center">
                            <div className="bg-white p-2 rounded-lg border border-teal-100/80 flex flex-col items-center shadow-2xs">
                              <span className="text-[9px] uppercase font-bold text-slate-500">Esta Semana</span>
                              <span className="text-xs sm:text-sm font-black text-teal-800 mt-0.5">📅 {resumen.sem}h</span>
                            </div>
                            <div className="bg-white p-2 rounded-lg border border-teal-100/80 flex flex-col items-center shadow-2xs">
                              <span className="text-[9px] uppercase font-bold text-slate-500">Este Mes</span>
                              <span className="text-xs sm:text-sm font-black text-blue-800 mt-0.5">🗓️ {resumen.mes}h</span>
                            </div>
                            <div className="bg-white p-2 rounded-lg border border-teal-100/80 flex flex-col items-center shadow-2xs">
                              <span className="text-[9px] uppercase font-bold text-slate-500">Total Acumulado</span>
                              <span className="text-xs sm:text-sm font-black text-slate-800 mt-0.5">⏱️ {resumen.total}h</span>
                            </div>
                          </div>

                          {/* Acciones para Gestoría y Copiar */}
                          <div className="pt-2 border-t border-teal-200/70 flex items-center gap-1.5 flex-wrap">
                            <button
                              type="button"
                              onClick={() => copiarInformeEmpleado(grupo, resumen)}
                              className="flex-1 min-w-[120px] py-1.5 px-2 bg-white hover:bg-teal-100 active:bg-teal-200 text-teal-950 border border-teal-300 rounded-lg text-[11px] font-bold cursor-pointer transition-all shadow-2xs flex items-center justify-center gap-1.5"
                              title="Copiar informe en texto al portapapeles"
                            >
                              {copiadoEmpleado === grupo.nombre ? '✅ ¡Informe Copiado!' : '📋 Copiar Informe'}
                            </button>

                            <button
                              type="button"
                              onClick={() => compartirWhatsApp(grupo, resumen)}
                              className="py-1.5 px-2.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-lg text-[11px] font-bold cursor-pointer transition-all shadow-2xs flex items-center justify-center gap-1 shrink-0"
                              title="Enviar por WhatsApp"
                            >
                              <span>💬</span> WhatsApp
                            </button>

                            <button
                              type="button"
                              onClick={() => compartirEmail(grupo, resumen)}
                              className="py-1.5 px-2.5 bg-blue-700 hover:bg-blue-800 active:bg-blue-900 text-white rounded-lg text-[11px] font-bold cursor-pointer transition-all shadow-2xs flex items-center justify-center gap-1 shrink-0"
                              title="Enviar por email a la gestoría"
                            >
                              <span>✉️</span> Gestoría
                            </button>
                          </div>
                        </div>
                      );
                    })()}

                    <div className="text-[11px] font-bold text-slate-600 px-1 pt-0.5">
                      Histórico de Fichajes ({grupo.fichajes.length}):
                    </div>

                    <div className="flex flex-col gap-2">
                      {grupo.fichajes.map((item) => {
                        const audit = obtenerInfoAuditoria(item);
                        return (
                          <div
                            key={item.id}
                            className="bg-white border border-slate-200 rounded-xl p-3 flex flex-col gap-2 shadow-2xs hover:border-teal-300 transition-colors"
                          >
                            {/* Fila Superior: Fecha, Horas totales, Origen, Alerta a posteriori y Botón Eliminar */}
                            <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-1.5">
                              <div className="flex items-center gap-1.5 flex-wrap min-w-0">
                                <span className="font-bold text-xs text-slate-900">
                                  📅 {audit.diaJornadaStr}
                                </span>
                                <span className="text-[11px] font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded-md border border-teal-200 shrink-0">
                                  ⏱️ {item.datos.t || '00:00'} hrs
                                </span>
                                <span
                                  className={`text-[10px] font-bold px-1.5 py-0.5 rounded shrink-0 ${
                                    audit.esAutomatico
                                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                      : 'bg-amber-50 text-amber-900 border border-amber-200'
                                  }`}
                                >
                                  {audit.esAutomatico ? '🤖 Botón Fichar' : '✍️ Manual'}
                                </span>
                                {audit.esAposteriori && (
                                  <span
                                    className="text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300 px-1.5 py-0.5 rounded shrink-0"
                                    title={`Anotado o modificado el ${audit.fechaAnotacionSoloDia || audit.fechaAnotacionStr}`}
                                  >
                                    ⚠️ Anotado el {audit.fechaAnotacionSoloDia || 'posterior'}
                                  </span>
                                )}
                              </div>
                              <button
                                type="button"
                                onClick={() =>
                                  setModalBorrado({
                                    tipo: 'fichaje',
                                    id: item.id,
                                    nombre: grupo.nombre,
                                  })
                                }
                                className="p-1 text-slate-400 hover:text-rose-600 cursor-pointer transition-colors shrink-0"
                                title="Borrar este fichaje de la nube"
                              >
                                🗑️
                              </button>
                            </div>

                            {/* Fila Inferior: Horarios (Entrada/Salida/GPS/Notas) y Botón Detalle */}
                            <div className="flex items-center justify-between gap-2 pt-0.5">
                              <div className="text-[11px] text-slate-600 flex items-center gap-1.5 flex-wrap min-w-0">
                                <span className="font-semibold text-slate-800">
                                  🟢 {item.datos.e1 || '--:--'} - 🔴 {item.datos.s1 || '--:--'}
                                </span>
                                {(item.datos.e2 || item.datos.s2) && (
                                  <span className="font-semibold text-slate-800">
                                    | 🟢 {item.datos.e2 || '--:--'} - 🔴 {item.datos.s2 || '--:--'}
                                  </span>
                                )}
                                {item.datos.gps && Object.keys(item.datos.gps).length > 0 && (
                                  <span className="text-blue-600 font-bold bg-blue-50 px-1.5 py-0.5 rounded text-[10px] shrink-0">
                                    📍 GPS
                                  </span>
                                )}
                                {item.datos.nota && (
                                  <span className="text-amber-800 font-bold bg-amber-50 px-1.5 py-0.5 rounded text-[10px] shrink-0">
                                    📝 Nota
                                  </span>
                                )}
                              </div>

                              <button
                                type="button"
                                onClick={() => setDetalleItem(item)}
                                className="py-1 px-2.5 text-[11px] font-bold text-white rounded-md hover:opacity-90 active:scale-95 cursor-pointer shadow-2xs shrink-0 whitespace-nowrap"
                                style={{ backgroundColor: 'var(--teal-header)' }}
                              >
                                👁️ Detalle
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Modal de Detalle de Fichaje */}
      {detalleItem && (() => {
        const auditDetalle = obtenerInfoAuditoria(detalleItem);
        return (
          <div
            className="fixed inset-0 bg-black/50 flex justify-center items-center z-50 p-2.5 animate-fade-in"
            onClick={() => setDetalleItem(null)}
          >
            <div
              className="bg-white rounded-xl p-4 w-full max-w-[360px] shadow-2xl flex flex-col gap-3"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="text-sm font-bold text-slate-900 border-b pb-2 flex justify-between items-center">
                <span className="truncate">👤 {detalleItem.empleadoNombre}</span>
                <button
                  onClick={() => setDetalleItem(null)}
                  className="text-slate-400 hover:text-slate-600 font-bold text-base"
                >
                  ✕
                </button>
              </div>

              <div className="text-xs flex flex-col gap-2.5 text-slate-700">
                {/* Total Horas Header */}
                <div className="flex justify-between items-center bg-teal-50 border border-teal-200 p-2.5 rounded-lg">
                  <span className="font-bold text-teal-950">Total Horas Jornada:</span>
                  <span className="font-mono font-black text-teal-800 text-base">
                    {detalleItem.datos.t || '00:00'} hrs
                  </span>
                </div>

                {/* BLOQUE ESTRUCTURADO DE AUDITORÍA Y REGISTRO */}
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-2.5 flex flex-col gap-1.5">
                  <div className="text-[11px] font-bold text-slate-800 border-b border-slate-200 pb-1 flex justify-between items-center">
                    <span>📌 Auditoría del Registro</span>
                    {auditDetalle.esAposteriori ? (
                      <span className="text-amber-900 bg-amber-100 border border-amber-300 px-1.5 py-0.5 rounded text-[10px] font-bold">
                        ⚠️ Registro a Posteriori
                      </span>
                    ) : (
                      <span className="text-emerald-800 bg-emerald-100 border border-emerald-300 px-1.5 py-0.5 rounded text-[10px] font-bold">
                        ✅ Registrado al Día
                      </span>
                    )}
                  </div>

                  <div className="flex justify-between items-center pt-0.5">
                    <span className="font-semibold text-slate-600">📅 Jornada (Día Trabajo):</span>
                    <span className="font-bold text-slate-900">{auditDetalle.diaJornadaStr}</span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-slate-600">📝 Anotado / Modificado:</span>
                    <span className="font-bold text-slate-900">{auditDetalle.fechaAnotacionStr}</span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-slate-600">⚙️ Método de Fichaje:</span>
                    <span className="font-bold text-slate-800">{auditDetalle.modoTexto}</span>
                  </div>

                  {auditDetalle.esAposteriori && (
                    <div className="mt-1 text-[11px] text-amber-900 bg-amber-50 border border-amber-200 p-2 rounded-md font-medium leading-relaxed">
                      💡 <strong>Aviso para Supervisión:</strong> Los datos de la jornada del <strong>{auditDetalle.diaJornadaStr}</strong> fueron introducidos o modificados en el sistema el día <strong>{auditDetalle.fechaAnotacionSoloDia || auditDetalle.fechaAnotacionStr}</strong>.
                    </div>
                  )}
                </div>

                <div className="flex justify-between items-center px-1">
                  <span className="font-bold">Estado de Jornada:</span>
                  <span className="uppercase font-semibold text-slate-800 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                    {detalleItem.datos.est || 'defecto'}
                  </span>
                </div>

                {/* Fichajes detallados con origen por tramo */}
                <div className="grid grid-cols-2 gap-2 bg-slate-50 p-2.5 rounded-lg border border-slate-200 text-slate-800">
                  <div>
                    <span className="text-[10px] text-slate-500 font-bold block">ENTRADA 1</span>
                    <div className="flex items-center gap-1 mt-0.5">
                      <span className="font-mono font-bold text-sm">{detalleItem.datos.e1 || '--:--'}</span>
                      {detalleItem.datos.e1 && (
                        <span className="text-[9px] font-bold px-1 py-0.2 rounded bg-slate-200 text-slate-700">
                          {detalleItem.datos.origen?.e1 === 'AUTOMATICO' ? '🤖 Auto' : '✍️ Man'}
                        </span>
                      )}
                    </div>
                  </div>

                  <div>
                    <span className="text-[10px] text-slate-500 font-bold block">SALIDA 1</span>
                    <div className="flex items-center gap-1 mt-0.5">
                      <span className="font-mono font-bold text-sm">{detalleItem.datos.s1 || '--:--'}</span>
                      {detalleItem.datos.s1 && (
                        <span className="text-[9px] font-bold px-1 py-0.2 rounded bg-slate-200 text-slate-700">
                          {detalleItem.datos.origen?.s1 === 'AUTOMATICO' ? '🤖 Auto' : '✍️ Man'}
                        </span>
                      )}
                    </div>
                  </div>

                  {(detalleItem.datos.e2 || detalleItem.datos.s2) && (
                    <>
                      <div className="pt-1.5 border-t border-slate-200">
                        <span className="text-[10px] text-slate-500 font-bold block">ENTRADA 2</span>
                        <div className="flex items-center gap-1 mt-0.5">
                          <span className="font-mono font-bold text-sm">{detalleItem.datos.e2 || '--:--'}</span>
                          {detalleItem.datos.e2 && (
                            <span className="text-[9px] font-bold px-1 py-0.2 rounded bg-slate-200 text-slate-700">
                              {detalleItem.datos.origen?.e2 === 'AUTOMATICO' ? '🤖 Auto' : '✍️ Man'}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="pt-1.5 border-t border-slate-200">
                        <span className="text-[10px] text-slate-500 font-bold block">SALIDA 2</span>
                        <div className="flex items-center gap-1 mt-0.5">
                          <span className="font-mono font-bold text-sm">{detalleItem.datos.s2 || '--:--'}</span>
                          {detalleItem.datos.s2 && (
                            <span className="text-[9px] font-bold px-1 py-0.2 rounded bg-slate-200 text-slate-700">
                              {detalleItem.datos.origen?.s2 === 'AUTOMATICO' ? '🤖 Auto' : '✍️ Man'}
                            </span>
                          )}
                        </div>
                      </div>
                    </>
                  )}
                </div>

                {detalleItem.datos.nota && (
                  <div className="pt-1 border-t border-slate-200">
                    <span className="font-bold block text-slate-800">📝 Nota del empleado:</span>
                    <p className="text-slate-700 bg-amber-50 p-2 rounded-lg border border-amber-200 mt-1 leading-relaxed text-[11px]">
                      {detalleItem.datos.nota}
                    </p>
                  </div>
                )}

                {detalleItem.datos.gps && Object.keys(detalleItem.datos.gps).length > 0 && (
                  <div className="pt-1 border-t border-slate-200">
                    <span className="font-bold block text-slate-800 mb-1">📍 Ubicación GPS:</span>
                    {Object.entries(detalleItem.datos.gps).map(([k, coord]) => (
                      <div key={k} className="flex justify-between items-center text-[11px] my-0.5 bg-blue-50/50 p-1 rounded border border-blue-100">
                        <span className="uppercase font-mono font-bold text-slate-600">{k}:</span>
                        <a
                          href={`https://www.google.com/maps?q=${coord}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-blue-700 font-bold underline font-mono text-[10px] hover:text-blue-900"
                        >
                          Ver en Google Maps ↗
                        </a>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <button
                onClick={() => setDetalleItem(null)}
                className="mt-2 py-2 px-3 bg-slate-200 text-slate-800 rounded-lg font-bold text-xs hover:bg-slate-300 cursor-pointer transition-colors"
              >
                Cerrar
              </button>
            </div>
          </div>
        );
      })()}

      {/* MODAL DE CONFIRMACIÓN DE BORRADO */}
      {modalBorrado && (
        <div className="fixed inset-0 bg-black/60 flex justify-center items-center z-50 p-3 animate-fade-in">
          <div className="bg-white rounded-xl p-4 w-full max-w-[340px] shadow-2xl flex flex-col gap-3">
            <div className="text-sm font-bold text-rose-700 flex items-center gap-1.5 border-b pb-2">
              <span>⚠️</span>
              <span>
                {modalBorrado.tipo === 'todo' && '¿Limpiar todos los datos?'}
                {modalBorrado.tipo === 'empleado' && `¿Borrar a ${modalBorrado.nombre}?`}
                {modalBorrado.tipo === 'fichaje' && '¿Borrar este fichaje?'}
              </span>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              {modalBorrado.tipo === 'todo' &&
                'Esta acción eliminará TODOS los fichajes de prueba registrados bajo tu código de empresa en la nube. No se puede deshacer.'}
              {modalBorrado.tipo === 'empleado' &&
                `Se eliminarán todos los fichajes acumulados de "${modalBorrado.nombre}".`}
              {modalBorrado.tipo === 'fichaje' &&
                'Este registro individual de fichaje será eliminado permanentemente.'}
            </p>

            <div className="flex gap-2 justify-end mt-2">
              <button
                type="button"
                disabled={procesandoBorrado}
                onClick={() => setModalBorrado(null)}
                className="py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold cursor-pointer transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={procesandoBorrado}
                onClick={confirmarEjecutarBorrado}
                className="py-2 px-3 bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white rounded-lg text-xs font-bold cursor-pointer transition-colors shadow-2xs flex items-center gap-1 disabled:opacity-50"
              >
                {procesandoBorrado ? 'Procesando...' : 'Sí, Eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
