import { useState, useRef, useEffect } from "react";

const BAR_HEIGHTS = [5, 12, 8, 14, 7, 10, 5];

function formatTime(seconds) {
  const m = Math.floor(seconds / 60).toString().padStart(2, "0");
  const s = (seconds % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

export default function VoiceRecorder({ onRecordingComplete, onRecordingStart, onRecordingEnd, disabled }) {
  const [isRecording, setIsRecording] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef  = useRef([]);
  const streamRef       = useRef(null);
  const timerRef        = useRef(null);
  const cancelledRef    = useRef(false);

  useEffect(() => {
    return () => {
      if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      cancelledRef.current = false;

      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : "audio/webm";

      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = () => {
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(t => t.stop());
          streamRef.current = null;
        }
        onRecordingEnd?.();
        if (cancelledRef.current) return;
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
        const audioFile = new File([audioBlob], `voice_${Date.now()}.webm`, { type: mimeType });
        onRecordingComplete(audioFile);
      };

      mediaRecorder.start();
      setIsRecording(true);
      setElapsed(0);
      onRecordingStart?.();
      timerRef.current = setInterval(() => setElapsed(s => s + 1), 1000);
    } catch (err) {
      console.error("Erreur accès micro:", err);
      alert("Impossible d'accéder au microphone. Vérifiez les permissions.");
    }
  };

  const stopRecording = () => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    if (mediaRecorderRef.current && isRecording) {
      cancelledRef.current = false;
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setElapsed(0);
    }
  };

  const cancelRecording = () => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    if (mediaRecorderRef.current && isRecording) {
      cancelledRef.current = true;
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setElapsed(0);
    }
  };

  if (isRecording) {
    return (
      <div className="flex-1 flex items-center gap-2 px-3 py-2 rounded-xl"
        style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)" }}>
        {/* Pulsing dot */}
        <span className="w-2 h-2 rounded-full bg-red-500 flex-shrink-0 animate-pulse" />

        {/* Waveform bars */}
        <div className="flex gap-[3px] items-end h-[18px] flex-shrink-0">
          {BAR_HEIGHTS.map((h, i) => (
            <div
              key={i}
              className="w-[3px] rounded-full bg-red-400"
              style={{
                height: `${h}px`,
                animation: `pulse 0.7s ease-in-out ${i * 0.1}s infinite alternate`,
                opacity: 0.8
              }}
            />
          ))}
        </div>

        {/* Timer */}
        <span className="text-xs font-mono text-red-300 flex-1">{formatTime(elapsed)}</span>

        {/* Cancel */}
        <button
          type="button"
          onClick={cancelRecording}
          className="w-7 h-7 rounded-lg flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 transition-all flex-shrink-0 text-xs"
          title="Annuler"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <path d="M18 6 6 18M6 6l12 12"/>
          </svg>
        </button>

        {/* Send */}
        <button
          type="button"
          onClick={stopRecording}
          className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 transition-all hover:opacity-90 active:scale-95"
          style={{ background: "linear-gradient(135deg,#ef4444,#dc2626)" }}
          title="Envoyer le message vocal"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/>
          </svg>
        </button>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={startRecording}
      disabled={disabled}
      title="Enregistrer un message vocal"
      className="w-9 h-9 flex items-center justify-center rounded-xl transition-all disabled:opacity-30 flex-shrink-0"
      style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}
    >
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="9" y="2" width="6" height="11" rx="3"/>
        <path d="M5 10a7 7 0 0 0 14 0"/>
        <line x1="12" y1="19" x2="12" y2="22"/>
        <line x1="9" y1="22" x2="15" y2="22"/>
      </svg>
    </button>
  );
}
