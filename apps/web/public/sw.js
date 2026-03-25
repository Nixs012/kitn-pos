import { skipWaiting, clientsClaim } from 'workbox-core';
import { precacheAndRoute } from 'workbox-precaching';
import { registerRoute } from 'workbox-routing';
import { StaleWhileRevalidate } from 'workbox-strategies';
import { BackgroundSyncPlugin } from 'workbox-background-sync';

skipWaiting();
clientsClaim();

// Precache static assets (Next.js will inject __WB_MANIFEST)
precacheAndRoute(self.__WB_MANIFEST || []);

// Cache products API with stale-while-revalidate
registerRoute(
  ({ url }) => url.pathname.startsWith('/api/products'),
  new StaleWhileRevalidate({
    cacheName: 'products-api-cache',
  })
);

// Background Sync for sales queue
const bgSyncPlugin = new BackgroundSyncPlugin('kitn-sync-queue', {
  maxRetentionTime: 24 * 60 // Retry for up to 24 hours
});

registerRoute(
  ({ url }) => url.pathname.startsWith('/api/sync'),
  async ({ request }) => {
    try {
      return await fetch(request);
    } catch (error) {
      // Background Sync will handle this if the request failed due to network
      throw error;
    }
  },
  'POST',
  {
    plugins: [bgSyncPlugin]
  }
);

// Listen for sync event manually if registration didn't work automatically
self.addEventListener('sync', (event) => {
  if (event.tag === 'kitn-sync-queue') {
    // Note: The logic inside pushQueue() normally runs here
    // But since it needs Supabase client, we usually trigger it from the React app
    // when it detects a 'sync' event or connectivity change.
    console.log('Background sync triggered for kitn-sync-queue');
  }
});
