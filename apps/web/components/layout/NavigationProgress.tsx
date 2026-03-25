'use client';

import { useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import nProgress from 'nprogress';
import 'nprogress/nprogress.css';

// Configure nprogress
nProgress.configure({ 
  showSpinner: false,
  trickleSpeed: 200,
  minimum: 0.3
});

export default function NavigationProgress() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    nProgress.start();
    
    // Use a small timeout to ensure the progress bar is visible 
    // even on very fast loads, providing consistent feedback.
    const timer = setTimeout(() => {
      nProgress.done();
    }, 100);

    return () => {
      clearTimeout(timer);
      nProgress.done();
    };
  }, [pathname, searchParams]);

  return (
    <style jsx global>{`
      #nprogress .bar {
        background: #1D9E75 !important;
        height: 3px !important;
        box-shadow: 0 0 10px #1D9E75, 0 0 5px #1D9E75 !important;
      }
    `}</style>
  );
}
