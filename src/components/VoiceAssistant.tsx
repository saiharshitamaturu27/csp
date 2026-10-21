import { useState, useRef, useEffect, useCallback } from 'react';
import { Mic, MicOff, Volume2, VolumeX, Stethoscope, User, X } from 'lucide-react';
import { useAuth } from '../lib/AuthContext';
import { t } from '../lib/i18n';
import { aiGenerateResponse } from './AIAssistant';

type Msg = { role: 'user' | 'ai'; text: string; timestamp: number };

type SpeechRecognitionLike = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start: () => void;
  stop: () => void;
  onresult: ((event: { results: { 0: { transcript: string }; length: number } }) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
};

export default function VoiceAssistant() {
  const { lang } = useAuth();
  const [open, setOpen] = useState(false);
  const [listening, setListening] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [messages, setMessages] = useState<Msg[]>([]);
  const [supported, setSupported] = useState(true);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const SR = (window as unknown as { SpeechRecognition?: unknown; webkitSpeechRecognition?: unknown }).SpeechRecognition
      || (window as unknown as { webkitSpeechRecognition?: unknown }).webkitSpeechRecognition;
    if (!SR || typeof window.speechSynthesis === 'undefined') {
      setSupported(false);
      return;
    }
    const rec = new (SR as new () => SpeechRecognitionLike)();
    rec.lang = lang === 'te' ? 'te-IN' : 'en-IN';
    rec.continuous = false;
    rec.interimResults = false;
    rec.onresult = (event) => {
      const text = event.results[0].transcript;
      setTranscript(text);
      handleQuery(text);
    };
    rec.onerror = () => {
      setListening(false);
    };
    rec.onend = () => {
      setListening(false);
    };
    recognitionRef.current = rec;
  }, [lang]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const speak = useCallback((text: string) => {
    if (typeof window.speechSynthesis === 'undefined') return;
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = lang === 'te' ? 'te-IN' : 'en-IN';
    utter.rate = 0.9;
    utter.onstart = () => setSpeaking(true);
    utter.onend = () => setSpeaking(false);
    utter.onerror = () => setSpeaking(false);
    window.speechSynthesis.speak(utter);
  }, [lang]);

  const stopSpeaking = () => {
    window.speechSynthesis.cancel();
    setSpeaking(false);
  };

  const handleQuery = (text: string) => {
    const userMsg: Msg = { role: 'user', text, timestamp: Date.now() };
    setMessages((m) => [...m, userMsg]);

    const { text: response, urgency } = aiGenerateResponse(text);
    const prefix = urgency === 'emergency'
      ? 'EMERGENCY — '
      : urgency === 'urgent'
      ? 'URGENT — '
      : '';
    const fullResponse = prefix + response;

    setTimeout(() => {
      setMessages((m) => [...m, { role: 'ai', text: fullResponse, timestamp: Date.now() }]);
      speak(fullResponse);
    }, 500);
  };

  const toggleListen = () => {
    if (!supported || !recognitionRef.current) return;
    if (listening) {
      recognitionRef.current.stop();
      setListening(false);
    } else {
      stopSpeaking();
      setTranscript('');
      try {
        recognitionRef.current.start();
        setListening(true);
      } catch {
        setListening(false);
      }
    }
  };

  if (!supported && !open) return null;

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className={`fixed bottom-5 left-5 z-40 flex items-center gap-2 rounded-full bg-gradient-to-br from-accent-500 to-accent-700 text-white px-4 py-3.5 shadow-lg hover:shadow-xl transition-all duration-200 ${open ? 'scale-0 opacity-0 pointer-events-none' : 'scale-100 opacity-100'}`}
      >
        <div className="relative">
          <Mic className="w-5 h-5" />
          <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-success-500 rounded-full ring-2 ring-accent-600 animate-pulse" />
        </div>
        <span className="text-sm font-medium hidden sm:inline">{t(lang, 'voiceAssistant')}</span>
      </button>

      <div className={`fixed inset-0 sm:inset-auto sm:bottom-5 sm:left-5 z-50 ${open ? 'flex' : 'hidden'} flex-col bg-white sm:rounded-2xl shadow-2xl border border-gray-200 w-full sm:w-[420px] h-full sm:h-[600px] sm:max-h-[calc(100vh-2.5rem)] overflow-hidden`}>
        <div className="flex items-center justify-between px-4 py-3.5 bg-gradient-to-r from-accent-600 to-accent-700 text-white shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-white/15 flex items-center justify-center">
              <Mic className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-semibold leading-tight">{t(lang, 'voiceAssistant')}</h3>
              <p className="text-[11px] text-accent-100">{t(lang, 'voiceAssistantSub')}</p>
            </div>
          </div>
          <button onClick={() => { stopSpeaking(); setOpen(false); }} className="p-1.5 rounded-lg hover:bg-white/10 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {!supported ? (
          <div className="flex-1 flex items-center justify-center p-6">
            <p className="text-sm text-gray-500 text-center">{t(lang, 'voiceNotSupported')}</p>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 bg-gray-50">
              {messages.length === 0 && (
                <div className="text-center text-gray-400 text-sm py-8">
                  <Mic className="w-10 h-10 mx-auto mb-3 text-accent-300" />
                  <p>{t(lang, 'tapToSpeak')}</p>
                </div>
              )}
              {messages.map((msg, i) => (
                <div key={i} className={`flex gap-2.5 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${msg.role === 'user' ? 'bg-accent-600 text-white' : 'bg-secondary-600 text-white'}`}>
                    {msg.role === 'user' ? <User className="w-4 h-4" /> : <Stethoscope className="w-4 h-4" />}
                  </div>
                  <div className={`max-w-[78%] rounded-xl px-3.5 py-2.5 text-sm leading-relaxed whitespace-pre-wrap ${msg.role === 'user' ? 'bg-accent-600 text-white' : 'bg-white border border-gray-200 text-gray-800 shadow-sm'}`}>
                    {msg.text}
                  </div>
                </div>
              ))}
              <div ref={endRef} />
            </div>

            <div className="px-4 py-4 border-t border-gray-200 bg-white shrink-0">
              <div className="flex items-center justify-center gap-4">
                <button
                  onClick={toggleListen}
                  className={`relative w-16 h-16 rounded-full flex items-center justify-center transition-all duration-200 ${listening ? 'bg-error-500 scale-110' : 'bg-accent-600 hover:bg-accent-700'}`}
                >
                  {listening ? (
                    <>
                      <MicOff className="w-7 h-7 text-white" />
                      <span className="absolute inset-0 rounded-full bg-error-400 animate-ping opacity-75" />
                    </>
                  ) : (
                    <Mic className="w-7 h-7 text-white" />
                  )}
                </button>
                {speaking && (
                  <button
                    onClick={stopSpeaking}
                    className="w-12 h-12 rounded-full flex items-center justify-center bg-gray-100 hover:bg-gray-200 transition-colors"
                    title={t(lang, 'stopSpeaking')}
                  >
                    <VolumeX className="w-6 h-6 text-gray-600" />
                  </button>
                )}
              </div>
              <p className="text-center text-sm mt-3 font-medium min-h-[20px]">
                {listening
                  ? t(lang, 'listening')
                  : speaking
                  ? t(lang, 'voiceReply')
                  : transcript
                  ? transcript
                  : t(lang, 'tapToSpeak')}
              </p>
              {speaking && (
                <div className="flex items-center justify-center gap-1 mt-2">
                  <Volume2 className="w-4 h-4 text-accent-600" />
                  <span className="text-xs text-gray-500">{t(lang, 'voiceReply')}</span>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </>
  );
}
