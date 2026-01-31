'use client';

import { useState, useRef } from 'react';

interface VoiceRecorderProps {
  onRecordingComplete: (audioBlob: Blob) => void;
  onTranscriptionStart: () => void;
}

export default function VoiceRecorder({
  onRecordingComplete,
  onTranscriptionStart
}: VoiceRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm',
      });

      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        onRecordingComplete(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);

      // Start timer
      timerIntervalRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } catch (error) {
      console.error('Error accessing microphone:', error);
      alert('Failed to access microphone. Please check permissions.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setIsPaused(false);

      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }

      onTranscriptionStart();
    }
  };

  const pauseRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      if (isPaused) {
        mediaRecorderRef.current.resume();
        timerIntervalRef.current = setInterval(() => {
          setRecordingTime(prev => prev + 1);
        }, 1000);
      } else {
        mediaRecorderRef.current.pause();
        if (timerIntervalRef.current) {
          clearInterval(timerIntervalRef.current);
        }
      }
      setIsPaused(!isPaused);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
      <h2 className="text-2xl font-bold mb-4">Voice Memo</h2>

      <div className="flex flex-col items-center space-y-4">
        {/* Recording Time Display */}
        <div className="text-4xl font-mono text-gray-700">
          {formatTime(recordingTime)}
        </div>

        {/* Recording Indicator */}
        {isRecording && (
          <div className="flex items-center space-x-2">
            <div className={`w-3 h-3 rounded-full ${isPaused ? 'bg-yellow-500' : 'bg-red-500 animate-pulse'}`} />
            <span className="text-sm text-gray-600">
              {isPaused ? 'Paused' : 'Recording...'}
            </span>
          </div>
        )}

        {/* Control Buttons */}
        <div className="flex space-x-4">
          {!isRecording ? (
            <button
              onClick={startRecording}
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-full font-semibold text-lg transition-colors flex items-center space-x-2"
            >
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clipRule="evenodd" />
              </svg>
              <span>Start Recording</span>
            </button>
          ) : (
            <>
              <button
                onClick={pauseRecording}
                className="bg-yellow-500 hover:bg-yellow-600 text-white px-6 py-4 rounded-full font-semibold transition-colors"
              >
                {isPaused ? 'Resume' : 'Pause'}
              </button>
              <button
                onClick={stopRecording}
                className="bg-red-600 hover:bg-red-700 text-white px-6 py-4 rounded-full font-semibold transition-colors flex items-center space-x-2"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 001 1h4a1 1 0 001-1V8a1 1 0 00-1-1H8z" clipRule="evenodd" />
                </svg>
                <span>Stop & Process</span>
              </button>
            </>
          )}
        </div>

        <p className="text-sm text-gray-500 text-center max-w-md">
          Record a voice memo describing your tasks, reminders, or ideas.
          Claude will automatically extract and organize them for you.
        </p>
      </div>
    </div>
  );
}
