import React, { useState } from 'react';
import { X, Smartphone, CheckCircle, Download, ExternalLink, HelpCircle, Copy, Check } from 'lucide-react';

interface PlayStoreModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenPrivacy: () => void;
}

export const PlayStoreModal: React.FC<PlayStoreModalProps> = ({
  isOpen,
  onClose,
  onOpenPrivacy,
}) => {
  const [copiado, setCopiado] = useState(false);
  const appUrl = window.location.origin;

  if (!isOpen) return null;

  const handleCopiarUrl = () => {
    navigator.clipboard.writeText(appUrl);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  };

  const handleDescargarAssetLinks = () => {
    const data = [
      {
        relation: ["delegate_permission/common.handle_all_urls"],
        target: {
          namespace: "android_app",
          package_name: "com.fichajepro.app",
          sha256_cert_fingerprints: [
            "00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00"
          ]
        }
      }
    ];
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'assetlinks.json';
    a.click();
  };

  const handleDescargarTwaManifest = () => {
    const twaConfig = {
      packageId: "com.fichajepro.app",
      host: window.location.host,
      name: "Fichaje Pro",
      launcherName: "Fichaje Pro",
      themeColor: "#007D7A",
      navigationColor: "#007D7A",
      backgroundColor: "#F4F1EA",
      startUrl: "/",
      iconUrl: `${appUrl}/icon-512.png`,
      maskableIconUrl: `${appUrl}/icon-maskable-512.png`,
      appVersionName: "18.21.0",
      appVersionCode: 18210,
      webManifestUrl: `${appUrl}/manifest.json`,
      features: {
        locationDelegation: { enabled: true }
      }
    };
    const blob = new Blob([JSON.stringify(twaConfig, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'twa-manifest.json';
    a.click();
  };

  return (
    <div
      id="modal-playstore-overlay"
      className="fixed inset-0 bg-black/60 z-50 flex justify-center items-center p-3"
      onClick={onClose}
    >
      <div
        id="modal-playstore-content"
        className="bg-white rounded-xl max-w-[460px] w-full max-h-[88vh] flex flex-col overflow-hidden shadow-2xl animate-in fade-in zoom-in-95"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cabecera */}
        <div className="bg-[#007d7a] text-white p-3.5 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-2 font-bold text-sm">
            <Smartphone size={20} className="text-emerald-300" />
            <span>Publicación en Google Play Store (TWA)</span>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:bg-white/20 rounded-full p-1 transition-colors"
            aria-label="Cerrar modal"
          >
            <X size={18} />
          </button>
        </div>

        {/* Contenido */}
        <div className="p-4 overflow-y-auto text-xs text-gray-700 leading-relaxed flex flex-col gap-3.5">
          {/* Checklist de preparación */}
          <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 flex flex-col gap-1.5">
            <span className="font-bold text-emerald-900 flex items-center gap-1.5 text-xs">
              <CheckCircle size={15} className="text-emerald-600" />
              Requisitos de Google Play completados en el código:
            </span>
            <ul className="text-[11px] text-emerald-800 space-y-1 list-disc list-inside">
              <li><strong>Web App Manifest:</strong> Configurado con standalone, nombre y orientación portrait.</li>
              <li><strong>Iconos requeridos:</strong> Generados en 192x192, 512x512 y 512x512 maskable para Android.</li>
              <li><strong>Service Worker Offline:</strong> Con caché para cumplir los requisitos de conectividad de Google Play.</li>
              <li><strong>Digital Asset Links:</strong> Archivo <code className="bg-emerald-100 px-1 py-0.5 rounded">/.well-known/assetlinks.json</code> listo.</li>
              <li><strong>Política de Privacidad:</strong> Requisito indispensable para apps con GPS y registro de jornada.</li>
            </ul>
          </div>

          {/* URL de la aplicación */}
          <div className="border border-gray-200 rounded-lg p-2.5 bg-gray-50 flex flex-col gap-1.5">
            <label className="font-bold text-gray-800 text-[11px]">URL de tu aplicación web (para empaquetar):</label>
            <div className="flex items-center gap-1 bg-white border border-gray-300 rounded px-2 py-1.5">
              <input
                type="text"
                readOnly
                value={appUrl}
                className="w-full text-[11px] text-gray-600 outline-none bg-transparent"
              />
              <button
                onClick={handleCopiarUrl}
                className="text-[#007d7a] hover:bg-teal-50 p-1 rounded transition-colors shrink-0"
                title="Copiar URL"
              >
                {copiado ? <Check size={14} className="text-green-600" /> : <Copy size={14} />}
              </button>
            </div>
          </div>

          {/* Cómo generar el archivo AAB (Android App Bundle) */}
          <div className="flex flex-col gap-2">
            <h4 className="font-bold text-gray-900 text-xs">Métodos para generar el paquete (.aab / .apk):</h4>
            
            {/* Opción 1: PWABuilder */}
            <div className="border border-blue-200 bg-blue-50/60 rounded-lg p-2.5 flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <span className="font-bold text-blue-900 text-xs">Opción 1: PWABuilder (Recomendado sin consola)</span>
                <span className="text-[10px] bg-blue-200 text-blue-800 font-bold px-1.5 py-0.5 rounded">Fácil</span>
              </div>
              <p className="text-[11px] text-blue-950">
                Herramienta oficial de empaquetado para Google Play:
              </p>
              <ol className="text-[11px] text-blue-900 list-decimal list-inside space-y-0.5">
                <li>Abre <a href="https://www.pwabuilder.com" target="_blank" rel="noreferrer" className="underline font-bold text-blue-700 inline-flex items-center gap-0.5">PWABuilder.com <ExternalLink size={11} /></a></li>
                <li>Pega la URL de tu aplicación y pulsa <strong>Start</strong></li>
                <li>Haz clic en <strong>Package for Android</strong></li>
                <li>Descarga el archivo <code>.aab</code> firmado listo para Google Play Console</li>
              </ol>
            </div>

            {/* Opción 2: Bubblewrap CLI */}
            <div className="border border-gray-200 rounded-lg p-2.5 bg-gray-50 flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <span className="font-bold text-gray-800 text-xs">Opción 2: Bubblewrap CLI (Oficial de Google)</span>
                <span className="text-[10px] bg-gray-200 text-gray-700 font-bold px-1.5 py-0.5 rounded">Desarrollador</span>
              </div>
              <p className="text-[11px] text-gray-600">
                Desde tu terminal con Node.js y el SDK de Android:
              </p>
              <pre className="bg-gray-800 text-green-400 p-2 rounded text-[10px] font-mono overflow-x-auto">
{`npm i -g @bubblewrap/cli
bubblewrap init --manifest=${appUrl}/manifest.json
bubblewrap build`}
              </pre>
            </div>
          </div>

          {/* Descarga de archivos de configuración */}
          <div className="flex flex-col gap-1.5 border-t border-gray-200 pt-2.5">
            <span className="font-bold text-gray-800 text-xs">Descargar archivos de configuración TWA:</span>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={handleDescargarAssetLinks}
                className="flex items-center justify-center gap-1.5 border border-teal-600 text-teal-800 bg-teal-50/70 hover:bg-teal-100 p-2 rounded-lg font-bold text-[11px] transition-colors"
              >
                <Download size={13} />
                <span>assetlinks.json</span>
              </button>
              <button
                onClick={handleDescargarTwaManifest}
                className="flex items-center justify-center gap-1.5 border border-teal-600 text-teal-800 bg-teal-50/70 hover:bg-teal-100 p-2 rounded-lg font-bold text-[11px] transition-colors"
              >
                <Download size={13} />
                <span>twa-manifest.json</span>
              </button>
            </div>
          </div>

          {/* Formulario de Seguridad de Datos de Google Play */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-2.5 flex flex-col gap-1 text-[11px] text-amber-900">
            <span className="font-bold flex items-center gap-1">
              <HelpCircle size={13} />
              Cómo rellenar la "Seguridad de los datos" en Google Play Console:
            </span>
            <p>
              • <strong>Ubicación (GPS):</strong> Marca que se recopila en primer plano con la finalidad de «Gestión de cuentas o funcionalidad de la aplicación» (para certificar el fichaje laboral).<br />
              • <strong>Datos personales:</strong> Nombre y DNI del empleado (para control de jornada conforme a normativa legal).<br />
              • <strong>¿Se comparten con terceros?:</strong> Marcar <strong>NO</strong>.<br />
              • <strong>¿Datos cifrados en tránsito?:</strong> Marcar <strong>SÍ</strong> (HTTPS).
            </p>
          </div>
        </div>

        {/* Pie */}
        <div className="bg-gray-50 p-2.5 border-t border-gray-200 flex justify-between items-center shrink-0">
          <button
            onClick={() => {
              onClose();
              onOpenPrivacy();
            }}
            className="text-teal-700 hover:underline text-xs font-semibold"
          >
            Ver Política de Privacidad
          </button>
          <button
            onClick={onClose}
            className="bg-[#007d7a] hover:bg-[#00605e] text-white px-4 py-1.5 rounded-lg text-xs font-bold shadow-xs transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
