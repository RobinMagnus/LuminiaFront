import { act, fireEvent, render, screen } from '@testing-library/react';
import { ReadAloudButton } from './ui';

class SpeechSynthesisUtteranceMock {
  text: string;
  voice: SpeechSynthesisVoice | null = null;
  lang = '';
  rate = 1;
  pitch = 1;
  volume = 1;
  onstart: (() => void) | null = null;
  onend: (() => void) | null = null;
  onerror: (() => void) | null = null;

  constructor(text: string) {
    this.text = text;
  }
}

describe('ReadAloudButton', () => {
  const speak = vi.fn();
  const cancel = vi.fn();
  const portugueseVoice = { lang: 'pt-BR' } as SpeechSynthesisVoice;

  beforeEach(() => {
    vi.clearAllMocks();
    Object.defineProperty(window, 'SpeechSynthesisUtterance', {
      configurable: true,
      value: SpeechSynthesisUtteranceMock,
    });
    Object.defineProperty(window, 'speechSynthesis', {
      configurable: true,
      value: {
        speak,
        cancel,
        getVoices: () => [portugueseVoice],
      },
    });
  });

  test('lê o texto com voz em português e permite interromper', () => {
    render(<ReadAloudButton text="Texto para leitura." />);

    fireEvent.click(screen.getByRole('button', { name: 'Ouvir texto' }));

    expect(cancel).toHaveBeenCalledTimes(1);
    expect(speak).toHaveBeenCalledTimes(1);
    const utterance = speak.mock.calls[0][0] as SpeechSynthesisUtteranceMock;
    expect(utterance.text).toBe('Texto para leitura.');
    expect(utterance.voice).toBe(portugueseVoice);
    expect(utterance.lang).toBe('pt-BR');
    expect(screen.getByRole('button', { name: 'Parar leitura' })).toHaveAttribute('aria-pressed', 'true');

    fireEvent.click(screen.getByRole('button', { name: 'Parar leitura' }));
    expect(cancel).toHaveBeenCalledTimes(2);
    expect(screen.getByRole('button', { name: 'Ouvir texto' })).toHaveAttribute('aria-pressed', 'false');
  });

  test('volta ao estado inicial quando a leitura termina', () => {
    render(<ReadAloudButton text="Texto curto." label="Ouvir feedback" />);
    fireEvent.click(screen.getByRole('button', { name: 'Ouvir feedback' }));

    const utterance = speak.mock.calls.at(-1)?.[0] as SpeechSynthesisUtteranceMock;
    act(() => utterance.onend?.());

    expect(screen.getByRole('button', { name: 'Ouvir feedback' })).toBeEnabled();
  });
});
