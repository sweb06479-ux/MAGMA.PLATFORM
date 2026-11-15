/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { createApp } from 'vue';
import App from './App.vue';
import './index.css';

// Prevent Vite dev server HMR WebSocket disconnection errors from bubbling as unhandled rejections
if (typeof window !== 'undefined') {
  window.addEventListener('unhandledrejection', (event) => {
    if (event.reason && (event.reason.message?.includes('WebSocket') || String(event.reason).includes('WebSocket'))) {
      event.preventDefault();
    }
  });
}

createApp(App).mount('#root');
