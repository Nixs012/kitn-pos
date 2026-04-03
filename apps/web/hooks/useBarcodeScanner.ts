'use client';

import { useEffect, useRef } from 'react';

interface UseBarcodeScannerProps {
  onScan: (code: string) => void;
  minChars?: number;
  timeThreshold?: number; // Maximum ms between keystrokes to be considered a scanner
}

/**
 * A hook that listens for global keyboard input from a physical barcode scanner.
 * Barcode scanners typically act as HID devices (keyboard emulators) that 
 * "type" the barcode extremely fast and end with an 'Enter' key.
 */
export function useBarcodeScanner({ 
  onScan, 
  minChars = 4, 
  timeThreshold = 50 
}: UseBarcodeScannerProps) {
  const bufferRef = useRef<string>('');
  const lastTimeRef = useRef<number>(0);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore modifier keys only
      if (['Control', 'Alt', 'Shift', 'Meta'].includes(e.key)) return;

      const currentTime = Date.now();
      const timeDiff = currentTime - lastTimeRef.current;
      
      // Check for Enter key - usually signals end of scan
      if (e.key === 'Enter') {
        if (bufferRef.current.length >= minChars) {
          // If the buffer has content and was typed recently/fast enough
          onScan(bufferRef.current);
          
          // Prevent default if we caught a valid scan to avoid accidental form submits
          // at the same time as our processing
          if (bufferRef.current.length > 0) {
            e.preventDefault();
            e.stopPropagation();
          }
        }
        bufferRef.current = '';
        return;
      }

      // Only care about single printable characters
      if (e.key.length !== 1) return;

      // If time between keys is too long (>50ms), it's likely a human typing
      // We reset the buffer to the current key
      if (timeDiff > timeThreshold) {
        bufferRef.current = e.key;
      } else {
        bufferRef.current += e.key;
      }

      lastTimeRef.current = currentTime;
    };

    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [onScan, minChars, timeThreshold]);
}
