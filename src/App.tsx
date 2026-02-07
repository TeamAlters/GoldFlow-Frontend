import { useEffect } from 'react';
import AppRouter from './app/AppRouter';
import { useUIStore } from './stores/ui.store';
import Toaster from './shared/components/Toaster';

function App() {
  const isDarkMode = useUIStore((state) => state.isDarkMode);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      document.documentElement.style.colorScheme = 'dark';
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.style.colorScheme = 'light';
    }
  }, [isDarkMode]);

  return (
    <>
      <AppRouter />
      <Toaster />
    </>
  );
}

export default App;
