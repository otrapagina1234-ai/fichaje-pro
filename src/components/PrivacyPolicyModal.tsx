import React from 'react';
import { X, ShieldCheck } from 'lucide-react';

interface PrivacyPolicyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PrivacyPolicyModal: React.FC<PrivacyPolicyModalProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div
      id="modal-privacy-overlay"
      className="fixed inset-0 bg-black/60 z-50 flex justify-center items-center p-3"
      onClick={onClose}
    >
      <div
        id="modal-privacy-content"
        className="bg-white rounded-xl max-w-[440px] w-full max-h-[85vh] flex flex-col overflow-hidden shadow-2xl animate-in fade-in zoom-in-95"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cabecera */}
        <div className="bg-[#007d7a] text-white p-3.5 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-2 font-bold text-sm">
            <ShieldCheck size={18} className="text-yellow-300" />
            <span>Política de Privacidad y Datos</span>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:bg-white/20 rounded-full p-1 transition-colors"
            aria-label="Cerrar política de privacidad"
          >
            <X size={18} />
          </button>
        </div>

        {/* Cuerpo con scroll */}
        <div className="p-4 overflow-y-auto text-xs text-gray-700 leading-relaxed flex flex-col gap-3">
          <div className="bg-amber-50 border border-amber-200 text-amber-900 p-2.5 rounded-lg text-[11px]">
            <strong>Cumplimiento Google Play Store & RGPD:</strong> Esta política describe el tratamiento de datos y los permisos de geolocalización requeridos para la validez del registro de jornada.
          </div>

          <section>
            <h4 className="font-bold text-gray-900 text-xs mb-1">1. Responsable del Tratamiento</h4>
            <p>
              La aplicación <strong>Fichaje Pro</strong> opera como herramienta de registro de jornada laboral para trabajadores y empleadores conforme al RDL 8/2019 de control horario.
            </p>
          </section>

          <section>
            <h4 className="font-bold text-gray-900 text-xs mb-1">2. Permiso de Ubicación (GPS / Geolocalización)</h4>
            <p>
              <strong>Uso exclusivo en primer plano:</strong> El acceso a la ubicación se solicita <em>únicamente</em> en el instante en que el usuario pulsa el botón de fichar para certificar la presencia en el puesto de trabajo.
            </p>
            <p className="mt-1">
              • <strong>NO</strong> se realiza rastreo ni seguimiento continuo en segundo plano.<br />
              • <strong>NO</strong> se recopilan datos de ubicación fuera de los eventos de fichaje.<br />
              • <strong>NO</strong> se comparten coordenadas GPS con redes publicitarias ni intermediarios.
            </p>
          </section>

          <section>
            <h4 className="font-bold text-gray-900 text-xs mb-1">3. Datos Personales Recopilados</h4>
            <p>
              Los datos identificativos (Nombre del trabajador, DNI/NIE, horas de entrada y salida, pausas y notas del día) son gestionados en el dispositivo del usuario.
            </p>
          </section>

          <section>
            <h4 className="font-bold text-gray-900 text-xs mb-1">4. Almacenamiento y Sincronización en la Nube</h4>
            <p>
              • <strong>Modo Local:</strong> Los fichajes se guardan de forma encriptada en el almacenamiento local del dispositivo (LocalStorage / Cache API).<br />
              • <strong>Modo Nube (Firebase / Supabase):</strong> Solo si el usuario o su empresa activan explícitamente la sincronización, los datos se transmiten mediante canales cifrados (HTTPS / TLS) a la base de datos configurada.
            </p>
          </section>

          <section>
            <h4 className="font-bold text-gray-900 text-xs mb-1">5. Derechos del Usuario y Exportación</h4>
            <p>
              El usuario puede consultar, rectificar, borrar o exportar una copia completa en formato JSON o compartir sus registros por WhatsApp o correo electrónico en cualquier momento desde el menú de la aplicación.
            </p>
          </section>

          <div className="text-[10px] text-gray-500 border-t border-gray-100 pt-2 text-center">
            Última actualización: Septiembre 2026 • Versión 18.21 Play Store Ready
          </div>
        </div>

        {/* Pie */}
        <div className="bg-gray-50 p-2.5 border-t border-gray-200 flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="bg-[#007d7a] hover:bg-[#00605e] text-white px-4 py-1.5 rounded-lg text-xs font-bold shadow-xs transition-colors"
          >
            Entendido y Aceptar
          </button>
        </div>
      </div>
    </div>
  );
};
