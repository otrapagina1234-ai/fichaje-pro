import React, { useState, useEffect, useCallback } from 'react';
import {
  FichajeData,
  TurnoTipo,
  RolTipo,
  VistaTipo,
  ColoresConfig,
  EstadoDia,
  CalendarDayItem,
} from './types';
import {
  MESES_NOMBRES,
  DIAS_SEMANA_NOMBRES,
  normalizarTextoHora,
  calcularTramo,
  minsATexto,
  obtenerLunesSemana,
  obtenerDiasDeLaSemana,
  formatearRangoSemana,
} from './utils/time';
import { obtenerUbicacionRobusta, verificarPermisoGPS, obtenerCoordenadasActuales } from './utils/gps';
import {
  estaConectadoNube,
  sincronizarConNube,
  sincronizarTodosLosFichajesLocales,
  validarConexionFirestore,
  alternarConexionNube,
  limpiarRastrosGoogleDrive,
} from './services/cloudSync';

import { HeaderBar } from './components/HeaderBar';
import { TotalsPanel } from './components/TotalsPanel';
import { ActionZone, SemanaItem } from './components/ActionZone';
import { ViewSelector } from './components/ViewSelector';
import { CalendarList } from './components/CalendarList';
import { SideMenu } from './components/SideMenu';
import { ShiftModal } from './components/ShiftModal';
import { NoteModal } from './components/NoteModal';
import { AuditModal } from './components/AuditModal';
import { BossDashboard } from './components/BossDashboard';
import { PlayStoreModal } from './components/PlayStoreModal';
import { PrivacyPolicyModal } from './components/PrivacyPolicyModal';

const COLORES_DEFECTO: ColoresConfig = {
  trabajo: '#d4edda',
  vacaciones: '#cce5ff',
  libre: '#fff3cd',
  baja: '#f8d7da',
};

export default function App() {
  const [fechaActual, setFechaActual] = useState<Date>(() => new Date());
  // Por defecto al entrar en la vista previa se muestra la semana actual empezando por lunes
  const [vistaActual, setVistaActual] = useState<VistaTipo>('semana');
  const [turno, setTurno] = useState<TurnoTipo>(() => {
    return (localStorage.getItem('config-turno') as TurnoTipo) || 'partido';
  });
  const [rol, setRol] = useState<RolTipo>(() => {
    return (localStorage.getItem('config-rol') as RolTipo) || 'particular';
  });
  const [nombre, setNombre] = useState<string>(() => {
    return localStorage.getItem('config-nombre') || '';
  });
  const [dni, setDni] = useState<string>(() => {
    return localStorage.getItem('config-dni') || '';
  });
  const [empresaCodigo, setEmpresaCodigo] = useState<string>(() => {
    return (localStorage.getItem('config-empresa-codigo') || '').trim().toUpperCase();
  });

  const [tempEmpresaCodigoEmpleado, setTempEmpresaCodigoEmpleado] = useState(empresaCodigo);
  const [mensajeEmpleadoVinculado, setMensajeEmpleadoVinculado] = useState(false);

  useEffect(() => {
    setTempEmpresaCodigoEmpleado(empresaCodigo);
  }, [empresaCodigo]);

  const handleEmpresaCodigoChange = (val: string) => {
    const codeUpper = val.trim().toUpperCase();
    setEmpresaCodigo(codeUpper);
    localStorage.setItem('config-empresa-codigo', codeUpper);
    if (rol === 'empleado') {
      sincronizarTodosLosFichajesLocales(rol, nombre, dni, codeUpper);
    }
  };

  const [colores, setColores] = useState<ColoresConfig>(() => {
    return {
      trabajo: localStorage.getItem('color-custom-trabajo') || COLORES_DEFECTO.trabajo,
      vacaciones: localStorage.getItem('color-custom-vacaciones') || COLORES_DEFECTO.vacaciones,
      libre: localStorage.getItem('color-custom-libre') || COLORES_DEFECTO.libre,
      baja: localStorage.getItem('color-custom-baja') || COLORES_DEFECTO.baja,
    };
  });

  const [nubeConectado, setNubeConectado] = useState<boolean>(() => estaConectadoNube());
  const [gpsEstado, setGpsEstado] = useState<string>("Verificar...");
  const [gpsColor, setGpsColor] = useState<string>("#666");

  const [menuOpen, setMenuOpen] = useState(false);
  const [shiftModalOpen, setShiftModalOpen] = useState(false);
  const [noteModalItem, setNoteModalItem] = useState<CalendarDayItem | null>(null);
  const [auditModalItem, setAuditModalItem] = useState<CalendarDayItem | null>(null);
  const [playStoreModalOpen, setPlayStoreModalOpen] = useState(false);
  const [privacyModalOpen, setPrivacyModalOpen] = useState(false);

  const [diasLista, setDiasLista] = useState<CalendarDayItem[]>([]);
  const [horasPorMesAno, setHorasPorMesAno] = useState<number[]>(new Array(12).fill(0));
  const [totalSemana, setTotalSemana] = useState('00:00');
  const [totalMes, setTotalMes] = useState('00:00');
  const [jefeTotalSemana, setJefeTotalSemana] = useState('00:00');
  const [jefeTotalMes, setJefeTotalMes] = useState('00:00');
  const [semanasDesglose, setSemanasDesglose] = useState<SemanaItem[]>([]);

  // Aplicar colores CSS variables dinámicamente
  useEffect(() => {
    document.documentElement.style.setProperty('--color-trabajo', colores.trabajo);
    document.documentElement.style.setProperty('--color-vacaciones', colores.vacaciones);
    document.documentElement.style.setProperty('--color-libre', colores.libre);
    document.documentElement.style.setProperty('--color-baja', colores.baja);
  }, [colores]);

  // Limpiar rastros antiguos, validar Firestore y sincronizar registros existentes en la nube
  useEffect(() => {
    limpiarRastrosGoogleDrive();
    validarConexionFirestore();
    sincronizarTodosLosFichajesLocales(rol, nombre, dni, empresaCodigo);
    setFechaActual(new Date());
    setVistaActual('semana');
  }, []);

  // Auto-scroll al día de hoy / semana actual al cambiar de fecha o vista para encontrarlo de inmediato
  useEffect(() => {
    const timer = setTimeout(() => {
      const hoy = new Date();
      if (
        fechaActual.getMonth() === hoy.getMonth() &&
        fechaActual.getFullYear() === hoy.getFullYear()
      ) {
        const el = document.getElementById(`fila-${hoy.getDate()}`);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }
    }, 120);
    return () => clearTimeout(timer);
  }, [vistaActual, fechaActual]);

  // Cargar datos según la vista actual y fecha
  const cargarDatos = useCallback(() => {
    const hoy = new Date();
    const anio = fechaActual.getFullYear();
    const mes = fechaActual.getMonth();
    const totalDias = new Date(anio, mes + 1, 0).getDate();

    // 1. Si la vista es 'ano', calcular total de horas por cada uno de los 12 meses
    if (vistaActual === 'ano') {
      const horasMeses: number[] = [];
      for (let m = 0; m < 12; m++) {
        let minsM = 0;
        const diasEnMes = new Date(anio, m + 1, 0).getDate();
        for (let d = 1; d <= diasEnMes; d++) {
          const clave = `fichaje-${anio}-${m}-${d}`;
          const item = localStorage.getItem(clave);
          if (item) {
            try {
              const parsed = JSON.parse(item);
              if (parsed.t && parsed.t !== '00:00') {
                const p = parsed.t.split(':');
                minsM += parseInt(p[0] || '0', 10) * 60 + parseInt(p[1] || '0', 10);
              }
            } catch (e) {}
          }
        }
        horasMeses.push(minsM);
      }
      setHorasPorMesAno(horasMeses);
      return;
    }

    // 2. Calcular total del mes actual en visualización
    let totalMinsMes = 0;
    for (let d = 1; d <= totalDias; d++) {
      const clave = `fichaje-${anio}-${mes}-${d}`;
      const item = localStorage.getItem(clave);
      if (item) {
        try {
          const parsed = JSON.parse(item);
          if (parsed.t && parsed.t !== '00:00') {
            const p = parsed.t.split(':');
            totalMinsMes += parseInt(p[0] || '0', 10) * 60 + parseInt(p[1] || '0', 10);
          }
        } catch (e) {}
      }
    }
    setTotalMes(minsATexto(totalMinsMes));

    // 3. Generar desglose de semanas del mes actual para la botonera superior
    const semanasArr: SemanaItem[] = [];
    let lunesCursor = obtenerLunesSemana(new Date(anio, mes, 1));
    let numSemana = 1;

    while (numSemana <= 6) {
      const domingoCursor = new Date(lunesCursor);
      domingoCursor.setDate(lunesCursor.getDate() + 6);

      // Comprobar si la semana toca el mes
      const tocaMes =
        (lunesCursor.getMonth() === mes && lunesCursor.getFullYear() === anio) ||
        (domingoCursor.getMonth() === mes && domingoCursor.getFullYear() === anio);

      if (!tocaMes && lunesCursor > new Date(anio, mes, totalDias)) {
        break;
      }

      let minsSem = 0;
      for (let offset = 0; offset < 7; offset++) {
        const diaIter = new Date(lunesCursor);
        diaIter.setDate(lunesCursor.getDate() + offset);
        const clave = `fichaje-${diaIter.getFullYear()}-${diaIter.getMonth()}-${diaIter.getDate()}`;
        const item = localStorage.getItem(clave);
        if (item) {
          try {
            const parsed = JSON.parse(item);
            if (parsed.t && parsed.t !== '00:00') {
              const p = parsed.t.split(':');
              minsSem += parseInt(p[0] || '0', 10) * 60 + parseInt(p[1] || '0', 10);
            }
          } catch (e) {}
        }
      }

      // Buscar una fecha dentro de esta semana que pertenezca al mes 'mes' y año 'anio'
      let fechaTarget: Date | null = null;
      for (let offset = 0; offset < 7; offset++) {
        const dCheck = new Date(lunesCursor);
        dCheck.setDate(lunesCursor.getDate() + offset);
        if (dCheck.getMonth() === mes && dCheck.getFullYear() === anio) {
          fechaTarget = dCheck;
          break;
        }
      }
      if (!fechaTarget) {
        fechaTarget = new Date(lunesCursor);
      }

      const domFin = new Date(domingoCursor);
      domFin.setHours(23, 59, 59, 999);
      const lunIni = new Date(lunesCursor);
      lunIni.setHours(0, 0, 0, 0);
      const tActual = new Date(
        fechaActual.getFullYear(),
        fechaActual.getMonth(),
        fechaActual.getDate(),
        12,
        0,
        0
      ).getTime();
      const esActiva = tActual >= lunIni.getTime() && tActual <= domFin.getTime();

      semanasArr.push({
        numero: numSemana,
        diaInicio: lunesCursor.getDate(),
        fechaTarget,
        horasTexto: minsATexto(minsSem),
        activa: esActiva,
      });

      numSemana++;
      const proximoLunes = new Date(lunesCursor);
      proximoLunes.setDate(lunesCursor.getDate() + 7);
      if (
        proximoLunes.getMonth() !== mes &&
        proximoLunes.getFullYear() >= anio &&
        proximoLunes > new Date(anio, mes, totalDias)
      ) {
        break;
      }
      lunesCursor = proximoLunes;
    }
    setSemanasDesglose(semanasArr);

    // 4. Calcular días que se mostrarán en la lista principal
    if (vistaActual === 'semana') {
      // VISTA SEMANA: Exactamente los 7 días de la semana actual empezando por LUNES
      const diasSemana = obtenerDiasDeLaSemana(fechaActual);
      let minsSemanaFocus = 0;

      const items: CalendarDayItem[] = diasSemana.map((d) => {
        const dAnio = d.getFullYear();
        const dMes = d.getMonth();
        const dDia = d.getDate();
        const claveId = `fichaje-${dAnio}-${dMes}-${dDia}`;

        let data: FichajeData = {
          e1: '',
          s1: '',
          e2: '',
          s2: '',
          est: 'defecto',
          t: '00:00',
          nota: '',
          origen: {},
          gps: {},
        };

        const raw = localStorage.getItem(claveId);
        if (raw) {
          try {
            data = JSON.parse(raw);
          } catch (e) {}
        }

        if (data.t && data.t !== '00:00') {
          const p = data.t.split(':');
          minsSemanaFocus += parseInt(p[0] || '0', 10) * 60 + parseInt(p[1] || '0', 10);
        }

        return {
          claveId,
          anio: dAnio,
          mes: dMes,
          dia: dDia,
          fecha: d,
          diaSemana: DIAS_SEMANA_NOMBRES[d.getDay()],
          esHoy: d.toDateString() === hoy.toDateString(),
          esOtroMes: dMes !== mes,
          data,
        };
      });

      setDiasLista(items);
      setTotalSemana(minsATexto(minsSemanaFocus));
    } else {
      // VISTA MES: Todos los días del mes 1..totalDias
      let minsSemanaFocus = 0;
      const diasSemanaHoy = obtenerDiasDeLaSemana(fechaActual);
      diasSemanaHoy.forEach((d) => {
        const clave = `fichaje-${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
        const item = localStorage.getItem(clave);
        if (item) {
          try {
            const parsed = JSON.parse(item);
            if (parsed.t && parsed.t !== '00:00') {
              const p = parsed.t.split(':');
              minsSemanaFocus += parseInt(p[0] || '0', 10) * 60 + parseInt(p[1] || '0', 10);
            }
          } catch (e) {}
        }
      });
      setTotalSemana(minsATexto(minsSemanaFocus));

      const items: CalendarDayItem[] = [];
      for (let d = 1; d <= totalDias; d++) {
        const dObj = new Date(anio, mes, d);
        const claveId = `fichaje-${anio}-${mes}-${d}`;
        let data: FichajeData = {
          e1: '',
          s1: '',
          e2: '',
          s2: '',
          est: 'defecto',
          t: '00:00',
          nota: '',
          origen: {},
          gps: {},
        };

        const raw = localStorage.getItem(claveId);
        if (raw) {
          try {
            data = JSON.parse(raw);
          } catch (e) {}
        }

        items.push({
          claveId,
          anio,
          mes,
          dia: d,
          fecha: dObj,
          diaSemana: DIAS_SEMANA_NOMBRES[dObj.getDay()],
          esHoy: dObj.toDateString() === hoy.toDateString(),
          data,
        });
      }

      setDiasLista(items);
    }
  }, [fechaActual, vistaActual]);

  useEffect(() => {
    cargarDatos();
  }, [cargarDatos]);

  // Manejo de cambios en los inputs de hora
  const handleInputChange = (
    claveId: string,
    campo: 'e1' | 's1' | 'e2' | 's2',
    valor: string
  ) => {
    const valLimpia = valor.replace(/[,;.]/g, ':');
    setDiasLista((prev) =>
      prev.map((item) => {
        if (item.claveId === claveId) {
          const tieneValor = valLimpia.trim() !== '';
          const nuevoEst =
            tieneValor && (item.data.est === 'defecto' || !item.data.est)
              ? ('trabajo' as EstadoDia)
              : item.data.est;
          return {
            ...item,
            data: {
              ...item.data,
              [campo]: valLimpia,
              est: nuevoEst,
            },
          };
        }
        return item;
      })
    );
  };

  // Guardar cálculo al desenfocar input (onBlur)
  const handleInputBlur = (claveId: string, campo: 'e1' | 's1' | 'e2' | 's2') => {
    const item = diasLista.find((i) => i.claveId === claveId);
    if (!item) return;

    const rawVal = item.data[campo] || '';
    const norm = normalizarTextoHora(rawVal);
    const updatedData: FichajeData = {
      ...item.data,
      [campo]: norm,
    };

    // Calcular total minutos
    const m1 = calcularTramo(updatedData.e1, updatedData.s1);
    const m2 = turno === 'partido' ? calcularTramo(updatedData.e2, updatedData.s2) : 0;
    const totalMins = m1 + m2;
    updatedData.t = totalMins > 0 ? minsATexto(totalMins) : '00:00';

    if (!updatedData.origen) updatedData.origen = {};
    if (updatedData[campo]) {
      updatedData.origen[campo] = 'MANUAL';
      // Por lógica, al marcar entrada o jornada manualmente, el tipo de día pasa a 'trabajo'
      updatedData.est = 'trabajo';

      // Si se acaba de introducir una hora y no tiene GPS, capturamos automáticamente las coordenadas
      if (!updatedData.gps) updatedData.gps = {};
      if (!updatedData.gps[campo]) {
        const ultimaConocida = localStorage.getItem('fichaje_ultima_ubicacion_conocida');
        if (ultimaConocida) {
          updatedData.gps[campo] = ultimaConocida;
        }
        obtenerCoordenadasActuales().then((coords) => {
          if (coords) {
            const actual: FichajeData = JSON.parse(localStorage.getItem(claveId) || '{}');
            if (!actual.gps) actual.gps = {};
            actual.gps[campo] = coords;
            localStorage.setItem('fichaje_ultima_ubicacion_conocida', coords);
            localStorage.setItem(claveId, JSON.stringify(actual));
            sincronizarConNube(claveId, actual, rol, nombre, dni);
            cargarDatos();
          }
        });
      }
    } else {
      delete updatedData.origen[campo];
      if (updatedData.gps) delete updatedData.gps[campo];
      // Si se han borrado todas las horas y el estado era trabajo, revertir a defecto
      if (!updatedData.e1 && !updatedData.s1 && !updatedData.e2 && !updatedData.s2 && updatedData.est === 'trabajo') {
        updatedData.est = 'defecto';
      }
    }

    localStorage.setItem(claveId, JSON.stringify(updatedData));
    sincronizarConNube(claveId, updatedData, rol, nombre, dni);

    cargarDatos();
  };

  // Cambio de estado (trabajo, vacaciones, libre, baja)
  const handleEstadoChange = (claveId: string, estado: EstadoDia) => {
    const item = diasLista.find((i) => i.claveId === claveId);
    const currentData = item
      ? item.data
      : {
          est: 'defecto' as EstadoDia,
          t: '00:00',
          origen: {},
          gps: {},
        };

    const updatedData: FichajeData = {
      ...currentData,
      est: estado,
    };

    // Calcular horas
    const m1 = calcularTramo(updatedData.e1, updatedData.s1);
    const m2 = turno === 'partido' ? calcularTramo(updatedData.e2, updatedData.s2) : 0;
    const totalMins = m1 + m2;
    updatedData.t = totalMins > 0 ? minsATexto(totalMins) : '00:00';

    localStorage.setItem(claveId, JSON.stringify(updatedData));
    sincronizarConNube(claveId, updatedData, rol, nombre, dni);

    cargarDatos();
  };

  // Botón FICHAR
  const handleFicharClick = () => {
    if (rol === 'jefe') {
      alert("⚠️ El perfil de Jefe supervisa fichajes, no registra jornadas locales.");
      return;
    }
    const hoy = new Date();
    // Si el usuario está viendo otro mes o año, posicionamos la fecha en hoy para que vea el fichaje
    if (fechaActual.toDateString() !== hoy.toDateString()) {
      setFechaActual(hoy);
    }
    if (vistaActual === 'ano') {
      setVistaActual('semana');
    }

    if (turno === 'partido') {
      setShiftModalOpen(true);
    } else {
      ejecutarFichaje('continuo');
    }
  };

  // Ejecución del fichaje automático con hora actual
  const ejecutarFichaje = (modo: 'continuo' | 'm' | 't') => {
    setShiftModalOpen(false);
    const hoy = new Date();
    const realAnio = hoy.getFullYear();
    const realMes = hoy.getMonth();
    const realDia = hoy.getDate();

    const horaMarcada = hoy.toTimeString().substring(0, 5);
    const claveId = `fichaje-${realAnio}-${realMes}-${realDia}`;

    const dataExistente: FichajeData =
      JSON.parse(localStorage.getItem(claveId) || 'null') || {
        e1: '',
        s1: '',
        e2: '',
        s2: '',
        est: 'defecto',
        t: '00:00',
        nota: '',
        origen: {},
        gps: {},
      };

    let campoFichado: 'e1' | 's1' | 'e2' | 's2' | '' = '';

    if (modo === 'continuo') {
      if (!dataExistente.e1) {
        dataExistente.e1 = horaMarcada;
        dataExistente.est = 'trabajo';
        campoFichado = 'e1';
      } else if (!dataExistente.s1) {
        dataExistente.s1 = horaMarcada;
        campoFichado = 's1';
      } else {
        alert("📝 Hoy ya está completo.");
        return;
      }
    } else if (modo === 'm') {
      if (!dataExistente.e1) {
        dataExistente.e1 = horaMarcada;
        dataExistente.est = 'trabajo';
        campoFichado = 'e1';
      } else if (!dataExistente.s1) {
        dataExistente.s1 = horaMarcada;
        campoFichado = 's1';
      } else {
        alert("📝 Turno de mañana completo.");
        return;
      }
    } else if (modo === 't') {
      if (!dataExistente.e2) {
        dataExistente.e2 = horaMarcada;
        dataExistente.est = 'trabajo';
        campoFichado = 'e2';
      } else if (!dataExistente.s2) {
        dataExistente.s2 = horaMarcada;
        campoFichado = 's2';
      } else {
        alert("📝 Turno de tarde completo.");
        return;
      }
    }

    if (!dataExistente.origen) dataExistente.origen = {};
    if (campoFichado) {
      dataExistente.origen[campoFichado] = 'AUTOMATICO';
      dataExistente.est = 'trabajo';
    }

    if (!dataExistente.gps) dataExistente.gps = {};
    const ultimaConocida = localStorage.getItem('fichaje_ultima_ubicacion_conocida');
    if (ultimaConocida && campoFichado) {
      dataExistente.gps[campoFichado] = ultimaConocida;
    }

    // Calcular horas
    const m1 = calcularTramo(dataExistente.e1, dataExistente.s1);
    const m2 = turno === 'partido' ? calcularTramo(dataExistente.e2, dataExistente.s2) : 0;
    dataExistente.t = m1 + m2 > 0 ? minsATexto(m1 + m2) : '00:00';

    localStorage.setItem(claveId, JSON.stringify(dataExistente));
    sincronizarConNube(claveId, dataExistente, rol, nombre, dni);

    cargarDatos();

    // Scroll al día si existe en vista
    setTimeout(() => {
      const el = document.getElementById(`fila-${realDia}`);
      el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 150);

    // Obtener y almacenar coordenadas GPS actualizadas
    if (campoFichado) {
      obtenerCoordenadasActuales().then((coords) => {
        if (coords) {
          const actual: FichajeData = JSON.parse(localStorage.getItem(claveId) || '{}');
          if (!actual.gps) actual.gps = {};
          actual.gps[campoFichado] = coords;
          localStorage.setItem('fichaje_ultima_ubicacion_conocida', coords);
          localStorage.setItem(claveId, JSON.stringify(actual));
          sincronizarConNube(claveId, actual, rol, nombre, dni);
          cargarDatos();
        }
      });
    }
  };

  // Guardar notas del día
  const handleGuardarNota = (texto: string) => {
    if (!noteModalItem) return;
    const claveId = noteModalItem.claveId;

    const current = noteModalItem.data || {
      est: 'defecto',
      t: '00:00',
      origen: {},
      gps: {},
    };
    const updated: FichajeData = { ...current, nota: texto };

    localStorage.setItem(claveId, JSON.stringify(updated));
    sincronizarConNube(claveId, updated, rol, nombre, dni);

    cargarDatos();
    setNoteModalItem(null);
  };

  // Asignar o refrescar GPS manualmente desde la ventana de auditoría
  const handleAsignarGpsEnAuditoria = async (campo: 'e1' | 's1' | 'e2' | 's2') => {
    if (!auditModalItem) return;
    const claveId = auditModalItem.claveId;
    const coords = await obtenerCoordenadasActuales();
    if (coords) {
      const actual: FichajeData = JSON.parse(localStorage.getItem(claveId) || '{}');
      if (!actual.gps) actual.gps = {};
      actual.gps[campo] = coords;
      localStorage.setItem('fichaje_ultima_ubicacion_conocida', coords);
      localStorage.setItem(claveId, JSON.stringify(actual));
      sincronizarConNube(claveId, actual, rol, nombre, dni);
      setAuditModalItem({
        ...auditModalItem,
        data: actual,
      });
      cargarDatos();
    } else {
      alert("No se pudo obtener la ubicación GPS en este momento.");
    }
  };

  // Gestión de conexión en la nube (Firebase / Supabase)
  const handleAlternarNube = () => {
    const nuevoEstado = !nubeConectado;
    alternarConexionNube(nuevoEstado, 'firebase');
    setNubeConectado(nuevoEstado);
    if (nuevoEstado) {
      sincronizarTodosLosFichajesLocales(rol, nombre, dni, empresaCodigo);
      console.log('✅ Sincronización en la nube activada (Firebase Firestore).');
    }
  };

  // GPS verification
  const handleVerificarGPS = async () => {
    setGpsEstado("Verificando...");
    const res = await verificarPermisoGPS();
    setGpsEstado(res.estado);
    setGpsColor(res.color);
  };

  // Resumen del mes para compartir
  const construirTextoMes = () => {
    const anioSel = fechaActual.getFullYear();
    const mesSel = fechaActual.getMonth();
    const totalDias = new Date(anioSel, mesSel + 1, 0).getDate();

    const textoNombre = nombre ? ` DE ${nombre.toUpperCase()}` : '';
    const textoDni = dni ? ` (DNI/NIE: ${dni.toUpperCase()})` : '';

    let mensaje = `📋 FICHAJE${textoNombre}${textoDni} - ${MESES_NOMBRES[mesSel]} ${anioSel}\n\n`;
    let totalMinutosMes = 0;

    for (let i = 1; i <= totalDias; i++) {
      const clave = `fichaje-${anioSel}-${mesSel}-${i}`;
      const item = localStorage.getItem(clave);
      if (item) {
        try {
          const d: FichajeData = JSON.parse(item);
          const dateObj = new Date(anioSel, mesSel, i);
          const diaSemana = DIAS_SEMANA_NOMBRES[dateObj.getDay()];

          if (d.t && d.t !== '00:00') {
            const p = d.t.split(':');
            totalMinutosMes += parseInt(p[0] || '0', 10) * 60 + parseInt(p[1] || '0', 10);
          }

          let detalleHoras = '';
          if (d.e1 || d.s1 || d.e2 || d.s2) {
            if (turno === 'partido') {
              detalleHoras = ` | M: ${d.e1 || '--'}-${d.s1 || '--'} T: ${d.e2 || '--'}-${d.s2 || '--'}`;
            } else {
              detalleHoras = ` | ${d.e1 || '--'} a ${d.s1 || '--'}`;
            }
          }

          let estadoTxt = '';
          if (d.est && d.est !== 'defecto') {
            estadoTxt = ` [${d.est.toUpperCase()}]`;
          }

          const notaTxt = d.nota ? ` (Nota: ${d.nota})` : '';
          mensaje += `• ${diaSemana} ${i}: ${d.t || '00:00'}h${detalleHoras}${estadoTxt}${notaTxt}\n`;
        } catch (e) {}
      }
    }

    mensaje += `\n⏱️ TOTAL ACUMULADO: ${minsATexto(totalMinutosMes)} horas`;
    return mensaje;
  };

  const handleCompartirWhatsApp = () => {
    const texto = encodeURIComponent(construirTextoMes());
    window.open(`https://api.whatsapp.com/send?text=${texto}`, '_blank');
    setMenuOpen(false);
  };

  const handleCompartirCorreo = () => {
    const anioSel = fechaActual.getFullYear();
    const mesSel = fechaActual.getMonth();
    const textoNombre = nombre ? ` - ${nombre}` : '';
    const asunto = encodeURIComponent(`Resumen Fichaje ${MESES_NOMBRES[mesSel]} ${anioSel}${textoNombre}`);
    const cuerpo = encodeURIComponent(construirTextoMes());
    window.location.href = `mailto:?subject=${asunto}&body=${cuerpo}`;
    setMenuOpen(false);
  };

  const handleDescargarCopia = () => {
    const anio = fechaActual.getFullYear();
    const copia: Record<string, string> = {};
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith(`fichaje-${anio}-`)) {
        copia[k] = localStorage.getItem(k) || '';
      }
    }
    const blob = new Blob([JSON.stringify(copia, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `copia_fichajes_${fechaActual.getFullYear()}.json`;
    a.click();
    setMenuOpen(false);
  };

  const handleCargarCopia = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const datos = JSON.parse(evt.target?.result as string);
        for (const k in datos) {
          if (k.startsWith('fichaje-')) {
            localStorage.setItem(k, datos[k]);
          }
        }
        cargarDatos();
        alert("✅ Copia de seguridad restaurada correctamente.");
      } catch (err) {
        alert("Archivo de copia no válido.");
      }
    };
    reader.readAsText(f);
  };

  // Guardar perfil de empleado y sincronizar una única copia completa y limpia a la nube
  const handleGuardarPerfil = useCallback(
    (nuevoNombre: string, nuevoDni: string) => {
      const nomLimpio = nuevoNombre.trim();
      const dniLimpio = nuevoDni.trim().toUpperCase();

      setNombre(nomLimpio);
      setDni(dniLimpio);
      localStorage.setItem('config-nombre', nomLimpio);
      localStorage.setItem('config-dni', dniLimpio);

      if (nomLimpio.length >= 2 && (rol === 'empleado' || rol === 'particular')) {
        sincronizarTodosLosFichajesLocales(rol, nomLimpio, dniLimpio, empresaCodigo);
      }
    },
    [rol, empresaCodigo]
  );

  // Navegación de anterior / siguiente según vista activa
  const handlePrev = () => {
    setFechaActual((prev) => {
      const d = new Date(prev);
      if (vistaActual === 'ano') {
        d.setFullYear(d.getFullYear() - 1);
      } else if (vistaActual === 'semana') {
        // En semana retrocedemos exactamente 7 días
        d.setDate(d.getDate() - 7);
      } else {
        d.setDate(1);
        d.setMonth(d.getMonth() - 1);
      }
      return d;
    });
  };

  const handleNext = () => {
    setFechaActual((prev) => {
      const d = new Date(prev);
      if (vistaActual === 'ano') {
        d.setFullYear(d.getFullYear() + 1);
      } else if (vistaActual === 'semana') {
        // En semana avanzamos exactamente 7 días
        d.setDate(d.getDate() + 7);
      } else {
        d.setDate(1);
        d.setMonth(d.getMonth() + 1);
      }
      return d;
    });
  };

  const handleSeleccionarSemana = (sem: SemanaItem) => {
    if (sem.fechaTarget) {
      setFechaActual(new Date(sem.fechaTarget));
    } else {
      setFechaActual((prev) => {
        const d = new Date(prev);
        d.setDate(sem.diaInicio);
        return d;
      });
    }
    setVistaActual('semana');
  };

  const handleVolverHoy = () => {
    const hoy = new Date();
    setFechaActual(hoy);
    setVistaActual('semana');
  };

  // Título dinámico para la cabecera
  let tituloCabecera = '';
  if (vistaActual === 'ano') {
    tituloCabecera = `AÑO ${fechaActual.getFullYear()}`;
  } else if (vistaActual === 'semana') {
    tituloCabecera = formatearRangoSemana(fechaActual);
  } else {
    tituloCabecera = `${MESES_NOMBRES[fechaActual.getMonth()]} ${fechaActual.getFullYear()}`;
  }

  return (
    <div
      id="app-container"
      className="max-w-[460px] w-full mx-auto flex flex-col gap-2 relative flex-1 min-h-[100dvh] p-2"
    >
      {/* Barra superior */}
      <HeaderBar
        titulo={tituloCabecera}
        onPrev={handlePrev}
        onNext={handleNext}
        onHoy={handleVolverHoy}
        onOpenMenu={() => {
          setMenuOpen(true);
          verificarPermisoGPS().then((res) => {
            setGpsEstado(res.estado);
            setGpsColor(res.color);
          });
        }}
      />

      {/* Panel totales (Solo para vista de empleado, en modo jefe sobra porque se muestra en cada tarjeta de empleado) */}
      {rol !== 'jefe' && (
        <TotalsPanel
          totalSemana={totalSemana}
          totalMes={totalMes}
        />
      )}

      {/* Zona acción superior (Fichar & semanas) */}
      {rol !== 'jefe' && (
        <ActionZone
          onFichar={handleFicharClick}
          semanas={vistaActual !== 'ano' ? semanasDesglose : []}
          onSeleccionarSemana={handleSeleccionarSemana}
        />
      )}

      {/* Selector de vistas */}
      {rol !== 'jefe' && (
        <ViewSelector
          vistaActual={vistaActual}
          onCambiarVista={(v) => {
            setVistaActual(v);
            if (v === 'mes') {
              setTimeout(() => {
                const hoy = new Date();
                const el = document.getElementById(`fila-${hoy.getDate()}`);
                el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
              }, 120);
            }
          }}
        />
      )}

      {/* Contenido central: Jefe Dashboard o Calendario */}
      {rol === 'jefe' ? (
        <BossDashboard
          onOpenMenu={() => setMenuOpen(true)}
          empresaCodigo={empresaCodigo}
          onEmpresaCodigoChange={handleEmpresaCodigoChange}
          fechaActual={fechaActual}
          onTotalesCalculados={(sem, mes) => {
            setJefeTotalSemana(sem);
            setJefeTotalMes(mes);
          }}
        />
      ) : (
        <CalendarList
          vistaActual={vistaActual}
          anio={fechaActual.getFullYear()}
          mes={fechaActual.getMonth()}
          dias={diasLista}
          horasPorMesAno={horasPorMesAno}
          turno={turno}
          onInputChange={handleInputChange}
          onInputBlur={handleInputBlur}
          onEstadoChange={handleEstadoChange}
          onOpenAudit={(item) => setAuditModalItem(item)}
          onOpenNota={(item) => setNoteModalItem(item)}
          onSeleccionarMesAno={(mesIndex) => {
            setFechaActual((prev) => {
              const d = new Date(prev);
              d.setDate(1);
              d.setMonth(mesIndex);
              return d;
            });
            setVistaActual('mes');
          }}
        />
      )}

      {/* Banner inferior */}
      <div
        id="ad-banner"
        className="w-full h-[46px] min-h-[46px] max-h-[46px] bg-[#f0ebd8] rounded-md flex justify-center items-center border border-dashed border-gray-400 text-gray-500 text-xs shrink-0 overflow-hidden relative"
      >
        Espacio para anuncio AdMob
      </div>

      {/* Menú lateral */}
      <SideMenu
        isOpen={menuOpen}
        onClose={() => setMenuOpen(false)}
        nombre={nombre}
        onNombreChange={(val) => {
          setNombre(val);
          localStorage.setItem('config-nombre', val);
        }}
        dni={dni}
        onDniChange={(val) => {
          setDni(val);
          localStorage.setItem('config-dni', val);
        }}
        onGuardarPerfil={handleGuardarPerfil}
        rol={rol}
        onRolChange={(val) => {
          setRol(val);
          localStorage.setItem('config-rol', val);
        }}
        empresaCodigo={empresaCodigo}
        onEmpresaCodigoChange={handleEmpresaCodigoChange}
        turno={turno}
        onTurnoChange={(val) => {
          setTurno(val);
          localStorage.setItem('config-turno', val);
        }}
        colores={colores}
        onColorChange={(tipo, val) => {
          setColores((prev) => ({ ...prev, [tipo]: val }));
          localStorage.setItem(`color-custom-${tipo}`, val);
        }}
        nubeConectado={nubeConectado}
        onAlternarNube={handleAlternarNube}
        gpsEstado={gpsEstado}
        gpsColor={gpsColor}
        onVerificarGPS={handleVerificarGPS}
        onCompartirWhatsApp={handleCompartirWhatsApp}
        onCompartirCorreo={handleCompartirCorreo}
        onDescargarCopia={handleDescargarCopia}
        onCargarCopia={handleCargarCopia}
        onOpenPlayStore={() => setPlayStoreModalOpen(true)}
        onOpenPrivacy={() => setPrivacyModalOpen(true)}
      />

      {/* Modal de selección de turno (Mañana / Tarde) */}
      <ShiftModal
        isOpen={shiftModalOpen}
        onClose={() => setShiftModalOpen(false)}
        onSelectShift={(shift) => ejecutarFichaje(shift)}
      />

      {/* Modal de notas */}
      <NoteModal
        isOpen={noteModalItem !== null}
        titulo={
          noteModalItem
            ? `Nota: ${noteModalItem.diaSemana} ${noteModalItem.dia} de ${MESES_NOMBRES[noteModalItem.mes]}`
            : ''
        }
        notaInicial={noteModalItem?.data?.nota || ''}
        onClose={() => setNoteModalItem(null)}
        onSave={handleGuardarNota}
      />

      {/* Modal de auditoría y GPS */}
      <AuditModal
        isOpen={auditModalItem !== null}
        titulo={
          auditModalItem
            ? `Fichaje e Info: ${auditModalItem.diaSemana} ${auditModalItem.dia} de ${MESES_NOMBRES[auditModalItem.mes]}`
            : undefined
        }
        dia={auditModalItem?.dia || null}
        mesNombre={auditModalItem ? MESES_NOMBRES[auditModalItem.mes] : ''}
        data={auditModalItem?.data || null}
        turno={turno}
        onClose={() => setAuditModalItem(null)}
        onAsignarGps={handleAsignarGpsEnAuditoria}
      />

      {/* Modal de Asistente para Publicar en Google Play Store (TWA) */}
      <PlayStoreModal
        isOpen={playStoreModalOpen}
        onClose={() => setPlayStoreModalOpen(false)}
        onOpenPrivacy={() => setPrivacyModalOpen(true)}
      />

      {/* Modal de Política de Privacidad (Google Play & RGPD) */}
      <PrivacyPolicyModal
        isOpen={privacyModalOpen}
        onClose={() => setPrivacyModalOpen(false)}
      />
    </div>
  );
}
