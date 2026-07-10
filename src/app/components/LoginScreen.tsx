import React, { FormEvent, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogIn, Sparkles } from 'lucide-react';
import { Button } from './ui';
import { FeedbackMessage } from './feedback';
import { useAuth } from '../contexts/AuthContext';
import { roleHomePath } from '../services/authService';
import { ApiError, getFriendlyErrorMessage } from '../services/api';

export const LoginScreen = () => {
  const navigate = useNavigate();
  const { login, user, isLoading, sessionMessage, clearSessionMessage } = useAuth();
  const [email, setEmail] = useState('professor@luminia.com');
  const [senha, setSenha] = useState('123456');
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({ email: '', senha: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isLoading && user) {
      navigate(roleHomePath(user.role), { replace: true });
    }
  }, [isLoading, navigate, user]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    const nextFieldErrors = {
      email: email.trim() ? '' : 'Informe seu email.',
      senha: senha.trim() ? '' : 'Informe sua senha.',
    };
    setFieldErrors(nextFieldErrors);

    if (nextFieldErrors.email || nextFieldErrors.senha) {
      return;
    }

    clearSessionMessage();
    setIsSubmitting(true);

    try {
      const loggedUser = await login(email, senha);
      navigate(roleHomePath(loggedUser.role), { replace: true });
    } catch (loginError) {
      setError(loginError instanceof ApiError && loginError.status === 401 ? 'Email ou senha inválidos.' : getFriendlyErrorMessage(loginError));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-6 flex items-center justify-center">
      <main className="w-full max-w-sm text-center">
        <div className="mx-auto w-20 h-20 bg-primary rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-primary/20">
          <Sparkles className="text-white w-10 h-10" aria-hidden="true" />
        </div>
        <h1 className="text-4xl font-medium text-foreground mb-3">Luminia</h1>
        <p className="text-muted-foreground text-lg mb-10">
          Educação com apoio de IA para professores e alunos aprenderem com mais clareza.
        </p>
        <form onSubmit={handleSubmit} className="space-y-4 text-left" noValidate>
          <label className="block space-y-2">
            <span className="text-sm font-medium text-foreground">Email</span>
            <input
              type="email"
              value={email}
              onChange={event => {
                setEmail(event.target.value);
                setFieldErrors(errors => ({ ...errors, email: '' }));
              }}
              className="w-full bg-card border border-border rounded-xl p-4 text-base focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="professor@luminia.com"
              autoComplete="email"
              aria-invalid={Boolean(fieldErrors.email || error)}
              aria-describedby={[fieldErrors.email ? 'email-error' : '', error || sessionMessage ? 'login-feedback' : ''].filter(Boolean).join(' ') || undefined}
            />
            {fieldErrors.email ? <span id="email-error" role="alert" className="text-sm text-accent">{fieldErrors.email}</span> : null}
          </label>
          <label className="block space-y-2">
            <span className="text-sm font-medium text-foreground">Senha</span>
            <input
              type="password"
              value={senha}
              onChange={event => {
                setSenha(event.target.value);
                setFieldErrors(errors => ({ ...errors, senha: '' }));
              }}
              className="w-full bg-card border border-border rounded-xl p-4 text-base focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="123456"
              autoComplete="current-password"
              aria-invalid={Boolean(fieldErrors.senha || error)}
              aria-describedby={[fieldErrors.senha ? 'senha-error' : '', error || sessionMessage ? 'login-feedback' : ''].filter(Boolean).join(' ') || undefined}
            />
            {fieldErrors.senha ? <span id="senha-error" role="alert" className="text-sm text-accent">{fieldErrors.senha}</span> : null}
          </label>
          <div id="login-feedback" className="space-y-2">
            {sessionMessage ? <FeedbackMessage type="warning" message={sessionMessage} compact onClose={clearSessionMessage} /> : null}
            {error ? <FeedbackMessage type="error" message={error} compact /> : null}
          </div>
          <Button type="submit" disabled={isSubmitting || isLoading} className="h-14 text-lg flex items-center justify-center gap-3">
            <LogIn size={22} aria-hidden="true" />
            {isSubmitting ? 'Entrando...' : 'Entrar'}
          </Button>
          <div className="grid grid-cols-2 gap-3">
            <Button type="button" variant="outline" className="!py-2.5 text-sm bg-card" onClick={() => setEmail('professor@luminia.com')}>
              Professor
            </Button>
            <Button type="button" variant="outline" className="!py-2.5 text-sm bg-card" onClick={() => setEmail('aluno@luminia.com')}>
              Aluno
            </Button>
          </div>
        </form>
      </main>
    </div>
  );
};
