import { useEffect, useRef, useState } from 'react';
import { Video, VideoOff, Mic, MicOff, PhoneOff, MessageSquare, Send } from 'lucide-react';
import { useAuth } from '../lib/AuthContext';
import { t } from '../lib/i18n';
import type { Appointment } from '../lib/supabase';
import { format, parseISO } from 'date-fns';
import { Sparkles } from 'lucide-react';
import { aiGenerateResponse } from './AIAssistant';

type ChatMsg = { from: 'me' | 'them' | 'ai'; text: string; time: string };

export default function VideoCallRoom({ appointment, onEnd }: { appointment: Appointment; onEnd: () => void }) {
  const { lang } = useAuth();
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [cameraOn, setCameraOn] = useState(true);
  const [micOn, setMicOn] = useState(true);
  const [callDuration, setCallDuration] = useState(0);
  const [showChat, setShowChat] = useState(false);
  const [showAI, setShowAI] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [aiInput, setAiInput] = useState('');
  const [chatMsgs, setChatMsgs] = useState<ChatMsg[]>([]);
  const [aiMsgs, setAiMsgs] = useState<{ text: string; role: 'user' | 'ai' }[]>([]);
  const [aiTyping, setAiTyping] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Start camera
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        if (!mounted) { stream.getTracks().forEach((tr) => tr.stop()); return; }
        streamRef.current = stream;
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }
      } catch (err: any) {
        if (err.name === 'NotAllowedError') {
          setError('Camera/microphone access was denied. Please allow access in your browser settings to use video consultation.');
        } else if (err.name === 'NotFoundError') {
          setError('No camera or microphone found. You can still use the audio-only and chat features.');
        } else {
          setError('Could not access camera. You can still use chat and AI features during the consultation.');
        }
      }
    })();
    return () => {
      mounted = false;
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((tr) => tr.stop());
        streamRef.current = null;
      }
    };
  }, []);

  // Call timer
  useEffect(() => {
    const timer = setInterval(() => setCallDuration((d) => d + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatDuration = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  };

  const toggleCamera = () => {
    const tracks = streamRef.current?.getVideoTracks() || [];
    tracks.forEach((tr) => (tr.enabled = !cameraOn));
    setCameraOn(!cameraOn);
  };

  const toggleMic = () => {
    const tracks = streamRef.current?.getAudioTracks() || [];
    tracks.forEach((tr) => (tr.enabled = !micOn));
    setMicOn(!micOn);
  };

  const sendChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    const time = format(new Date(), 'h:mm a');
    setChatMsgs((m) => [...m, { from: 'me', text: chatInput, time }]);
    setChatInput('');
    // Simulate patient response after a delay
    setTimeout(() => {
      setChatMsgs((m) => [...m, { from: 'them', text: 'Thank you, doctor. I understand.', time: format(new Date(), 'h:mm a') }]);
    }, 1500);
  };

  const sendAI = (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiInput.trim() || aiTyping) return;
    setAiMsgs((m) => [...m, { text: aiInput, role: 'user' }]);
    setAiTyping(true);
    setAiInput('');
    setTimeout(() => {
      const { text } = aiGenerateResponse(aiInput);
      setAiMsgs((m) => [...m, { text, role: 'ai' }]);
      setAiTyping(false);
    }, 600 + Math.random() * 400);
  };

  const patient = appointment.patient;
  const patientInitial = patient?.full_name?.charAt(0).toUpperCase() || 'P';

  return (
    <div className="fixed inset-0 z-50 bg-gray-900 flex flex-col animate-fade-in">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-3 bg-gray-800 shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-error-500 animate-pulse-glow" />
            <span className="text-white text-sm font-medium hidden sm:inline">{t(lang, 'videoConsultation')}</span>
          </div>
          <span className="text-gray-400 text-sm">·</span>
          <span className="text-gray-300 text-sm">{patient?.full_name}</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-success-400 text-sm font-mono tabular-nums">{formatDuration(callDuration)}</span>
          <button onClick={onEnd} className="btn-danger text-sm">
            <PhoneOff className="w-4 h-4" />{t(lang, 'endCall')}
          </button>
        </div>
      </div>

      {/* Main area */}
      <div className="flex-1 flex relative overflow-hidden">
        {/* Video area */}
        <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-gray-800 to-gray-950 relative">
          {/* Remote (patient) — placeholder avatar */}
          <div className="text-center">
            <div className="w-32 h-32 sm:w-40 sm:h-40 rounded-full bg-primary-600/20 flex items-center justify-center mb-4 mx-auto">
              <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-4xl sm:text-5xl font-bold text-white">
                {patientInitial}
              </div>
            </div>
            <p className="text-white text-lg font-medium">{patient?.full_name}</p>
            <p className="text-gray-400 text-sm">{format(parseISO(appointment.scheduled_at), 'd MMM yyyy, h:mm a')}</p>
            <p className="text-gray-500 text-xs mt-3 flex items-center justify-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-success-400" />{t(lang, 'waitingForPatient')}
            </p>
          </div>

          {/* Local video — PIP */}
          <div className="absolute bottom-4 right-4 w-32 h-24 sm:w-48 sm:h-36 rounded-xl overflow-hidden border-2 border-white/20 bg-gray-700 shadow-lg">
            {cameraOn && !error ? (
              <video ref={localVideoRef} autoPlay muted playsInline className="w-full h-full object-cover -scale-x-100" />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gray-700">
                <VideoOff className="w-6 h-6 text-gray-500" />
              </div>
            )}
            <div className="absolute bottom-1 left-1.5 text-[10px] text-white/80 bg-black/40 px-1.5 py-0.5 rounded">{t(lang, 'you')}</div>
          </div>

          {/* Error banner */}
          {error && (
            <div className="absolute top-4 left-4 right-4 sm:left-1/2 sm:-translate-x-1/2 sm:w-auto max-w-md bg-warning-50/95 border border-warning-200 rounded-lg px-4 py-2.5 text-sm text-warning-800 flex items-start gap-2">
              <span className="shrink-0 mt-0.5">⚠️</span>
              <span>{error}</span>
            </div>
          )}
        </div>

        {/* Side panel — chat or AI */}
        {(showChat || showAI) && (
          <div className="w-full sm:w-80 bg-white flex flex-col absolute sm:relative inset-0 z-10">
            <div className="flex items-center gap-1 px-3 py-2.5 border-b border-gray-200 bg-gray-50 shrink-0">
              <button
                onClick={() => { setShowChat(true); setShowAI(false); }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${showChat && !showAI ? 'bg-primary-50 text-primary-700' : 'text-gray-600 hover:bg-gray-100'}`}
              >
                <MessageSquare className="w-4 h-4" />{t(lang, 'chat')}
              </button>
              <button
                onClick={() => { setShowAI(true); setShowChat(false); }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${showAI ? 'bg-secondary-50 text-secondary-700' : 'text-gray-600 hover:bg-gray-100'}`}
              >
                <Sparkles className="w-4 h-4" />AI
              </button>
              <button onClick={() => { setShowChat(false); setShowAI(false); }} className="ml-auto p-1.5 rounded-lg hover:bg-gray-200 text-gray-500">
                <span className="text-sm">{t(lang, 'close')}</span>
              </button>
            </div>

            {/* Chat messages */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
              {showChat ? (
                chatMsgs.length === 0 ? (
                  <div className="text-center text-sm text-gray-400 py-8">{t(lang, 'noMessagesYet')}</div>
                ) : (
                  chatMsgs.map((msg, i) => (
                    <div key={i} className={`flex ${msg.from === 'me' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${msg.from === 'me' ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-800'}`}>
                        <p>{msg.text}</p>
                        <p className={`text-[10px] mt-0.5 ${msg.from === 'me' ? 'text-primary-100' : 'text-gray-400'}`}>{msg.time}</p>
                      </div>
                    </div>
                  ))
                )
              ) : (
                aiMsgs.length === 0 ? (
                  <div className="text-center py-6">
                    <div className="w-10 h-10 rounded-full bg-secondary-100 flex items-center justify-center mx-auto mb-2">
                      <Sparkles className="w-5 h-5 text-secondary-600" />
                    </div>
                    <p className="text-sm text-gray-500">{t(lang, 'aiInCallHint')}</p>
                  </div>
                ) : (
                  aiMsgs.map((msg, i) => (
                    <div key={i} className={`flex gap-2 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${msg.role === 'user' ? 'bg-primary-600 text-white' : 'bg-secondary-600 text-white'}`}>
                        <Sparkles className="w-3.5 h-3.5" />
                      </div>
                      <div className={`max-w-[80%] rounded-lg px-3 py-2 text-sm whitespace-pre-wrap ${msg.role === 'user' ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-800'}`}>
                        {msg.text}
                      </div>
                    </div>
                  ))
                )
              )}
              {aiTyping && (
                <div className="flex gap-2">
                  <div className="w-7 h-7 rounded-full bg-secondary-600 text-white flex items-center justify-center shrink-0">
                    <Sparkles className="w-3.5 h-3.5" />
                  </div>
                  <div className="bg-gray-100 rounded-lg px-4 py-2.5">
                    <div className="flex gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Input */}
            <div className="p-3 border-t border-gray-200 shrink-0">
              <form onSubmit={showChat ? sendChat : sendAI} className="flex gap-2">
                <input
                  className="input flex-1 text-sm"
                  placeholder={showChat ? t(lang, 'typeMessage') : t(lang, 'aiInputPlaceholder')}
                  value={showChat ? chatInput : aiInput}
                  onChange={(e) => showChat ? setChatInput(e.target.value) : setAiInput(e.target.value)}
                />
                <button type="submit" className="btn-primary px-3 py-2 shrink-0">
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>
          </div>
        )}
      </div>

      {/* Bottom controls */}
      <div className="flex items-center justify-center gap-3 py-4 bg-gray-800 shrink-0">
        <button
          onClick={toggleMic}
          className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${micOn ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-error-600 hover:bg-error-700 text-white'}`}
          title={micOn ? 'Mute' : 'Unmute'}
        >
          {micOn ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
        </button>

        <button
          onClick={toggleCamera}
          className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${cameraOn ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-error-600 hover:bg-error-700 text-white'}`}
          title={cameraOn ? 'Turn off camera' : 'Turn on camera'}
        >
          {cameraOn ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
        </button>

        <button
          onClick={() => { setShowChat(!showChat); setShowAI(false); }}
          className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${showChat ? 'bg-primary-600 text-white' : 'bg-gray-700 hover:bg-gray-600 text-white'}`}
          title={t(lang, 'chat')}
        >
          <MessageSquare className="w-5 h-5" />
        </button>

        <button
          onClick={() => { setShowAI(!showAI); setShowChat(false); }}
          className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${showAI ? 'bg-secondary-600 text-white' : 'bg-gray-700 hover:bg-gray-600 text-white'}`}
          title="AI Assistant"
        >
          <Sparkles className="w-5 h-5" />
        </button>

        <button
          onClick={onEnd}
          className="w-14 h-14 rounded-full bg-error-600 hover:bg-error-700 text-white flex items-center justify-center transition-colors shadow-lg"
          title={t(lang, 'endCall')}
        >
          <PhoneOff className="w-6 h-6" />
        </button>
      </div>
    </div>
  );
}
