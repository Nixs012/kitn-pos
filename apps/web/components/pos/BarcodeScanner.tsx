'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats, CameraDevice } from 'html5-qrcode';
import { Camera, X, RefreshCw, Layers, Zap } from 'lucide-react';

interface BarcodeScannerProps {
  onScan: (decodedText: string) => void;
  onClose: () => void;
  isBulkMode?: boolean;
}

export default function BarcodeScanner({ 
  onScan, 
  onClose, 
  isBulkMode: initialBulkMode = false 
}: BarcodeScannerProps) {
  const [isBulkMode, setIsBulkMode] = useState(initialBulkMode);
  const [cameras, setCameras] = useState<CameraDevice[]>([]);
  const [selectedCamera, setSelectedCamera] = useState<string>('');
  const [isScannerRunning, setIsScannerRunning] = useState(false);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const regionId = "reader";

  const stopScanner = useCallback(async () => {
    if (scannerRef.current && scannerRef.current.isScanning) {
      try {
        await scannerRef.current.stop();
        setIsScannerRunning(false);
      } catch (err) {
        console.error("Failed to stop scanner", err);
      }
    }
  }, []);

  const startScanner = useCallback(async (cameraId: string) => {
    if (!cameraId) return;
    
    await stopScanner();

    const html5QrCode = new Html5Qrcode(regionId);
    scannerRef.current = html5QrCode;

    const config = {
      fps: 30, // Maximum responsiveness
      qrbox: (viewfinderWidth: number, viewfinderHeight: number) => {
        const minEdge = Math.min(viewfinderWidth, viewfinderHeight);
        const boxSize = Math.floor(minEdge * 0.8);
        return {
          width: boxSize,
          height: Math.floor(boxSize * 0.6)
        };
      },
      aspectRatio: 1.0,
      experimentalFeatures: {
        useBarCodeDetectorIfSupported: true
      },
      formatsToSupport: [ 
        Html5QrcodeSupportedFormats.EAN_13, 
        Html5QrcodeSupportedFormats.EAN_8, 
        Html5QrcodeSupportedFormats.CODE_128, 
        Html5QrcodeSupportedFormats.QR_CODE,
        Html5QrcodeSupportedFormats.UPC_A,
        Html5QrcodeSupportedFormats.UPC_E,
        Html5QrcodeSupportedFormats.ITF
      ]
    };

    try {
      await html5QrCode.start(
        cameraId,
        config,
        (decodedText) => {
          onScan(decodedText);
          if (!isBulkMode) {
            // Tiny delay to allow the user to see the success state
            setTimeout(() => onClose(), 300);
          }
        },
        undefined
      );
      setIsScannerRunning(true);
    } catch (err) {
      console.error("Failed to start scanner", err);
    }
  }, [isBulkMode, onClose, onScan, stopScanner]);

  useEffect(() => {
    Html5Qrcode.getCameras().then(devices => {
      setCameras(devices);
      if (devices.length > 0) {
        const backCamera = devices.find(d => d.label.toLowerCase().includes('back')) || devices[0];
        setSelectedCamera(backCamera.id);
        startScanner(backCamera.id);
      }
    }).catch(err => {
      console.error("Error getting cameras", err);
    });

    return () => {
      stopScanner();
    };
  }, [startScanner, stopScanner]);

  return (
    <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden w-full max-w-sm mx-auto animate-in zoom-in duration-300">
      <style jsx>{`
        @keyframes scan {
          0% { top: 0%; }
          50% { top: 100%; }
          100% { top: 0%; }
        }
        .scan-line {
          position: absolute;
          left: 0;
          right: 0;
          height: 2px;
          background: #10b981;
          box-shadow: 0 0 15px rgba(16, 185, 129, 0.8);
          animation: scan 2s linear infinite;
          z-index: 10;
        }
      `}</style>

      {/* Header */}
      <div className="p-4 border-b border-gray-50 flex items-center justify-between bg-gray-50/50">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-brand-green/10 flex items-center justify-center text-brand-green">
            <Camera size={18} />
          </div>
          <p className="text-xs font-black text-brand-dark uppercase tracking-widest">Scanner</p>
        </div>
        <button 
          onClick={onClose}
          className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-400 hover:text-brand-dark"
        >
          <X size={18} />
        </button>
      </div>

      {/* Camera View */}
      <div className="relative aspect-square bg-black overflow-hidden">
        <div id={regionId} className="w-full h-full" />
        {!isScannerRunning && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-white p-6 text-center space-y-4 z-20 bg-black">
             <RefreshCw className="animate-spin text-brand-green" size={32} />
             <p className="text-xs font-bold font-mono tracking-tighter opacity-70 italic">Initializing vision system...</p>
          </div>
        )}
        
        {/* Decorative scan overlay */}
        <div className="absolute inset-0 border-[40px] border-black/20 pointer-events-none z-10" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-32 border-2 border-brand-green/50 rounded-lg pointer-events-none z-10">
          {/* Animated Scan Line - Now restricted to the box */}
          <div className="scan-line" />
        </div>
      </div>

      {/* Controls */}
      <div className="p-4 space-y-4">
        {/* Mode Toggle */}
        <div className="flex p-1 bg-gray-100 rounded-xl">
          <button
            type="button"
            onClick={() => setIsBulkMode(false)}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-[10px] font-black uppercase tracking-tighter transition-all ${
              !isBulkMode ? 'bg-white text-brand-green shadow-sm' : 'text-gray-400'
            }`}
          >
            <Zap size={14} /> Single
          </button>
          <button
            type="button"
            onClick={() => setIsBulkMode(true)}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-[10px] font-black uppercase tracking-tighter transition-all ${
              isBulkMode ? 'bg-white text-brand-green shadow-sm' : 'text-gray-400'
            }`}
          >
            <Layers size={14} /> Bulk
          </button>
        </div>

        {/* Camera Selection */}
        {cameras.length > 1 && (
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Select Camera</label>
            <select
              value={selectedCamera}
              onChange={(e) => {
                setSelectedCamera(e.target.value);
                startScanner(e.target.value);
              }}
              className="w-full bg-gray-50 border-none rounded-xl px-4 py-2 text-[11px] font-bold text-brand-dark focus:ring-2 focus:ring-brand-green/20 outline-none transition-all"
            >
              {cameras.map(camera => (
                <option key={camera.id} value={camera.id}>
                  {camera.label || `Camera ${camera.id}`}
                </option>
              ))}
            </select>
          </div>
        )}
        
        <p className="text-[9px] text-center text-gray-400 font-bold italic tracking-tighter">
          {isBulkMode ? 'Scanner will stay open for multiple items' : 'Scanner closes automatically after successful detection'}
        </p>
      </div>
    </div>
  );
}
