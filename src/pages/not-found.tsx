import { useNavigate } from 'react-router-dom';
import { Compass } from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/states';

export function NotFoundPage() {
  const navigate = useNavigate();
  return (
    <div className="animate-in-up">
      <EmptyState
        icon={<Compass size={20} />}
        title="Nothing here"
        description="That screen does not exist in the console. Use the sidebar or command palette (Ctrl/Cmd K) to find your way."
        action={
          <Button size="sm" onClick={() => navigate('/')}>
            Back to dashboard
          </Button>
        }
      />
    </div>
  );
}
