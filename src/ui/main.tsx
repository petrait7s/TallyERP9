import { createRoot } from 'react-dom/client';
import { Shell } from './shell/Shell';
import { boot } from './store';
import './tally.css';

const root = createRoot(document.getElementById('root')!);
boot()
  .catch((e) => console.error('boot failed, using demo company', e))
  .finally(() => root.render(<Shell />));
