import { Toaster as Sonner } from 'sonner';
import { useTheme } from '@/hooks/use-theme';

export function Toaster() {
  const { theme } = useTheme();

  return (
    <Sonner
      theme={theme}
      position="bottom-right"
      closeButton
      toastOptions={{
        style: {
          background: 'var(--c-overlay)',
          border: '1px solid var(--c-line)',
          color: 'var(--c-ink)',
          borderRadius: 'var(--radius-md)',
          fontFamily: 'var(--font-sans)',
          fontSize: '13px',
          boxShadow: 'var(--shadow-md)',
        },
      }}
    />
  );
}
