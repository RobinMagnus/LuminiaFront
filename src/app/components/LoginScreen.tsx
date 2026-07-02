import React from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, GraduationCap, Sparkles } from 'lucide-react';
import { Button } from './ui';

export const LoginScreen = () => {
  const navigate = useNavigate();

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
        <div className="space-y-4">
          <Button onClick={() => navigate('/teacher')} className="h-14 text-lg flex items-center justify-center gap-3">
            <BookOpen size={22} aria-hidden="true" /> Entrar como Professor
          </Button>
          <Button variant="outline" onClick={() => navigate('/student')} className="h-14 text-lg bg-card flex items-center justify-center gap-3">
            <GraduationCap size={22} aria-hidden="true" /> Entrar como Aluno
          </Button>
        </div>
      </main>
    </div>
  );
};
