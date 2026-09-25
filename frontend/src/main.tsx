import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App, { preloadRoute } from './App';
import { warmSource } from './services/source';
import { prefetchRoute } from './services/prefetch';
import './index.css';

const root = document.getElementById('root')!;

// The served HTML is prerendered, so it already shows this page. Mounting replaces it wholesale:
// wait for the route chunk and the data source first, otherwise the page flips to a loading
// skeleton and back, which reads as a flash and costs layout shift on a slow connection.
const render = () =>
  createRoot(root).render(
    <StrictMode>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </StrictMode>,
  );

const path = window.location.pathname;
Promise.allSettled([preloadRoute(path), warmSource().then(() => prefetchRoute(path))]).then(render);
