import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getFirestore,
  doc,
  getDocFromServer,
  collection,
  setDoc,
  getDocs,
  deleteDoc,
  onSnapshot,
  query,
} from 'firebase/firestore';
import configData from '../../firebase-applet-config.json';
import { CloudFichajeItem } from '../types';

const firebaseConfig = {
  apiKey: configData.apiKey,
  authDomain: configData.authDomain,
  projectId: configData.projectId,
  storageBucket: configData.storageBucket,
  messagingSenderId: configData.messagingSenderId,
  appId: configData.appId,
};

export const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

export const db =
  configData.firestoreDatabaseId && configData.firestoreDatabaseId !== '(default)'
    ? getFirestore(app, configData.firestoreDatabaseId)
    : getFirestore(app);

/**
 * Valida la conexión con Firestore en el arranque
 */
export async function validarConexionFirestore(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    console.log('✅ [Firebase Firestore] Conexión establecida con éxito en proyecto:', configData.projectId);
    return true;
  } catch (error: any) {
    console.warn('ℹ️ [Firebase Firestore] Comprobación de conexión inicial:', error?.message || error);
    return true;
  }
}

/**
 * Guarda o actualiza un fichaje en Firestore en tiempo real
 */
export async function guardarFichajeEnFirestore(item: CloudFichajeItem): Promise<void> {
  try {
    const docRef = doc(db, 'fichajes', item.id);
    await setDoc(docRef, item, { merge: true });
    console.log('☁️ [Firebase Firestore] Fichaje sincronizado en la nube:', item.id, item.empleadoNombre);
  } catch (error) {
    console.error('❌ [Firebase Firestore] Error al guardar fichaje:', error);
    throw error;
  }
}

/**
 * Obtiene los fichajes de los empleados desde Firestore (filtrado por código de empresa si aplica)
 */
export async function obtenerFichajesDesdeFirestore(empresaCodigo?: string): Promise<CloudFichajeItem[]> {
  try {
    const colRef = collection(db, 'fichajes');
    const snapshot = await getDocs(colRef);
    let items: CloudFichajeItem[] = [];
    snapshot.forEach((d) => {
      items.push(d.data() as CloudFichajeItem);
    });

    if (empresaCodigo && empresaCodigo.trim()) {
      const codeUpper = empresaCodigo.trim().toUpperCase();
      items = items.filter((it) => (it.empresaCodigo || '').toUpperCase() === codeUpper);
    }

    // Ordenar de más reciente a más antiguo
    items.sort((a, b) => (b.fecha || '').localeCompare(a.fecha || ''));
    console.log(`☁️ [Firebase Firestore] ${items.length} fichajes cargados desde la base de datos.`);
    return items;
  } catch (error) {
    console.error('❌ [Firebase Firestore] Error al leer colección fichajes:', error);
    throw error;
  }
}

/**
 * Escucha en tiempo real los fichajes (para el Panel del Jefe, filtrado por empresa)
 */
export function suscribirFichajesEnTiempoReal(
  onActualizar: (items: CloudFichajeItem[]) => void,
  empresaCodigo?: string
): () => void {
  try {
    const colRef = collection(db, 'fichajes');
    const unsubscribe = onSnapshot(
      colRef,
      (snapshot) => {
        let items: CloudFichajeItem[] = [];
        snapshot.forEach((d) => {
          items.push(d.data() as CloudFichajeItem);
        });

        if (empresaCodigo && empresaCodigo.trim()) {
          const codeUpper = empresaCodigo.trim().toUpperCase();
          items = items.filter((it) => (it.empresaCodigo || '').toUpperCase() === codeUpper);
        }

        items.sort((a, b) => (b.fecha || '').localeCompare(a.fecha || ''));
        onActualizar(items);
      },
      (error) => {
        console.warn('⚠️ [Firebase] Error en listener en tiempo real:', error);
      }
    );
    return unsubscribe;
  } catch (err) {
    console.error('❌ [Firebase] No se pudo inicializar listener en tiempo real:', err);
    return () => {};
  }
}

/**
 * Elimina un fichaje por ID de Firestore
 */
export async function eliminarFichajeDeFirestore(id: string): Promise<void> {
  try {
    const docRef = doc(db, 'fichajes', id);
    await deleteDoc(docRef);
    console.log('🗑️ [Firebase Firestore] Fichaje eliminado:', id);
  } catch (error) {
    console.error('❌ [Firebase Firestore] Error al eliminar fichaje:', error);
    throw error;
  }
}

/**
 * Elimina todos los fichajes de un empleado específico
 */
export async function eliminarFichajesDeEmpleadoFirestore(empleadoNombre: string, empresaCodigo?: string): Promise<void> {
  try {
    const colRef = collection(db, 'fichajes');
    const snapshot = await getDocs(colRef);
    const batchPromises: Promise<void>[] = [];
    const nameUpper = empleadoNombre.trim().toLowerCase();
    const codeUpper = empresaCodigo ? empresaCodigo.trim().toUpperCase() : '';

    snapshot.forEach((d) => {
      const data = d.data() as CloudFichajeItem;
      const matchName = (data.empleadoNombre || '').trim().toLowerCase() === nameUpper;
      const matchCode = !codeUpper || (data.empresaCodigo || '').trim().toUpperCase() === codeUpper;
      if (matchName && matchCode) {
        batchPromises.push(deleteDoc(doc(db, 'fichajes', d.id)));
      }
    });

    await Promise.all(batchPromises);
    console.log(`🗑️ [Firebase Firestore] Eliminados todos los fichajes del empleado: ${empleadoNombre}`);
  } catch (error) {
    console.error('❌ Error al eliminar fichajes de empleado:', error);
    throw error;
  }
}

/**
 * Elimina todos los fichajes de una empresa (por ejemplo datos de pruebas)
 */
export async function eliminarTodosFichajesEmpresaFirestore(empresaCodigo?: string): Promise<void> {
  try {
    const colRef = collection(db, 'fichajes');
    const snapshot = await getDocs(colRef);
    const batchPromises: Promise<void>[] = [];
    const codeUpper = empresaCodigo ? empresaCodigo.trim().toUpperCase() : '';

    snapshot.forEach((d) => {
      const data = d.data() as CloudFichajeItem;
      const matchCode = !codeUpper || (data.empresaCodigo || '').trim().toUpperCase() === codeUpper;
      if (matchCode) {
        batchPromises.push(deleteDoc(doc(db, 'fichajes', d.id)));
      }
    });

    await Promise.all(batchPromises);
    console.log(`🗑️ [Firebase Firestore] Eliminados todos los fichajes de la empresa ${empresaCodigo || 'global'}`);
  } catch (error) {
    console.error('❌ Error al eliminar todos los fichajes:', error);
    throw error;
  }
}

