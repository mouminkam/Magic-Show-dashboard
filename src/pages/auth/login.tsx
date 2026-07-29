import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Eye, EyeSlash, SignIn } from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
import { Field, Input } from '@/components/ui/field';
import { Logo } from '@/components/layout/logo';
import { useAuth } from '@/auth/auth-context';
import { loginSchema, type LoginValues } from '@/lib/schemas';
import { DEMO_CREDENTIALS } from '@/services/auth';
import { errorMessage } from '@/lib/utils';

export default function LoginPage() {
  const { user, ready, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const form = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: DEMO_CREDENTIALS.email,
      password: DEMO_CREDENTIALS.password,
      remember: true,
    },
  });

  if (ready && user) {
    const state = location.state as { from?: { pathname?: string } } | null;
    const from = state?.from?.pathname ?? '/';
    return <Navigate to={from} replace />;
  }

  const onSubmit = form.handleSubmit(async (values) => {
    setFormError(null);
    try {
      await login(values.email, values.password);
      navigate('/', { replace: true });
    } catch (error) {
      setFormError(errorMessage(error, 'Could not sign in'));
    }
  });

  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-canvas px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex justify-center">
          <Logo size={36} />
        </div>

        <div className="rounded-xl border border-line bg-surface p-6 card-shadow">
          <h1 className="text-[18px] font-semibold text-ink">Sign in</h1>
          <p className="mt-1 text-[13px] leading-relaxed text-muted">
            Demo console — sign in with any seeded admin email and a password of 6 or more characters.
          </p>

          <form
            className="mt-5 space-y-4"
            onSubmit={(event) => {
              event.preventDefault();
              void onSubmit(event);
            }}
            noValidate
          >
            <Field label="Email" error={form.formState.errors.email?.message} required>
              {(props) => (
                <Input {...props} {...form.register('email')} type="email" placeholder="you@magicshow.ae" />
              )}
            </Field>

            <Field label="Password" error={form.formState.errors.password?.message} required>
              {(props) => (
                <div className="relative">
                  <Input
                    {...props}
                    {...form.register('password')}
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    className="pe-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((value) => !value)}
                    className="absolute end-2.5 top-1/2 -translate-y-1/2 text-faint hover:text-muted"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeSlash size={16} aria-hidden /> : <Eye size={16} aria-hidden />}
                  </button>
                </div>
              )}
            </Field>

            {formError ? (
              <p role="alert" className="text-[12.5px] text-critical">
                {formError}
              </p>
            ) : null}

            <Button
              type="submit"
              className="w-full"
              loading={form.formState.isSubmitting}
              icon={<SignIn size={15} weight="bold" aria-hidden />}
            >
              Sign in
            </Button>
          </form>
        </div>

        <p className="mt-4 text-center text-[12px] text-faint">
          Demo credentials: {DEMO_CREDENTIALS.email} / {DEMO_CREDENTIALS.password}
        </p>
      </div>
    </div>
  );
}
