"use client"
import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { useSearchParams, useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Mic, MicOff, Phone } from "lucide-react"
import ChatPersonaCard from "@/components/ChatPersonaCard"
import { Persona } from "@/types/persona"
import { Room, RoomEvent, Track, ConnectionState } from 'livekit-client';

interface VoiceSessionConfig {
  provider: 'livekit';
  roomName: string;
  token: string;
  url: string;
  sessionId: string;
  maxDurationSeconds: number;
  persona: {
    name: string;
    voice_name?: string;
  };
  isDuplicate?: boolean;
}

interface TranscriptMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

const VoiceChatScreen = () => {
  const [persona, setPersona] = useState<Persona | null>(null);
  const [isPersonaLoading, setIsPersonaLoading] = useState(true);
  const [isConnecting, setIsConnecting] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState<TranscriptMessage[]>([]);
  const [isEndChatModalOpen, setIsEndChatModalOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const searchParams = useSearchParams();
  const conversationId = searchParams ? searchParams.get('conversationId') : null;
  const personaId = searchParams ? searchParams.get('personaId') : null;
  const scenarioId = searchParams ? searchParams.get('scenarioId') : null;
  const router = useRouter();
  
  const roomRef = useRef<Room | null>(null);
  const sessionConfigRef = useRef<VoiceSessionConfig | null>(null);
  const isInitializingRef = useRef(false);
  const initializationKeyRef = useRef<string | null>(null);
  const audioElementsRef = useRef<HTMLAudioElement[]>([]);

  // Fetch persona data
  useEffect(() => {
    const fetchPersona = async () => {
      if (!personaId) return;
      
      try {
        setIsPersonaLoading(true);
        const response = await axios.get<Persona>(`/api/persona/${personaId}`);
        setPersona(response.data);
      } catch (error) {
        console.error('Error fetching persona:', error);
        setError('Failed to load persona');
      } finally {
        setIsPersonaLoading(false);
      }
    };

    fetchPersona();
  }, [personaId]);

  // Cleanup on component unmount
  useEffect(() => {
    return () => {
      console.log('🧹 Cleaning up voice chat component...');
      disconnectVoiceAgent();
    };
  }, []);

  // Initialize voice session
  useEffect(() => {
    const initVoiceSession = async () => {
      if (!conversationId || !personaId || !scenarioId) {
        setError('Missing required parameters');
        setIsConnecting(false);
        return;
      }

      const initKey = `${conversationId}-${personaId}-${scenarioId}`;
      
      if (isInitializingRef.current) {
        console.log('🚫 Voice session already initializing, skipping...');
        return;
      }

      if (initializationKeyRef.current === initKey) {
        console.log('🚫 Voice session already initialized for this combination, skipping...');
        return;
      }

      if (sessionConfigRef.current) {
        console.log('🚫 Voice session already configured, skipping...');
        return;
      }

      isInitializingRef.current = true;
      initializationKeyRef.current = initKey;
      console.log('🎙️ Starting LiveKit voice session initialization...');

      try {
        const response = await axios.post<VoiceSessionConfig>('/api/voice/start-session', {
          conversationId,
          personaId,
          scenarioId
        });

        if (response.status === 202 && response.data.isDuplicate) {
          console.log('🔄 Duplicate request detected - skipping connection');
          isInitializingRef.current = false;
          initializationKeyRef.current = null;
          setIsConnecting(false);
          return;
        }

        sessionConfigRef.current = response.data;
        console.log('✅ LiveKit session created:', {
          roomName: response.data.roomName,
          personaName: response.data.persona.name
        });
        
        await connectToVoiceAgent(response.data);
        
      } catch (error) {
        console.error('Error initializing voice session:', error);
        setError('Failed to start voice session. Please try again.');
        setIsConnecting(false);
        isInitializingRef.current = false;
        initializationKeyRef.current = null;
      }
    };

    if (conversationId && personaId && scenarioId && !isInitializingRef.current && !sessionConfigRef.current) {
      initVoiceSession();
    }

    return () => {
      disconnectVoiceAgent();
      isInitializingRef.current = false;
      initializationKeyRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId, personaId, scenarioId]);

  const connectToVoiceAgent = async (config: VoiceSessionConfig) => {
    try {
      console.log('🔗 Connecting to LiveKit room:', config.roomName);
      
      const room = new Room({
        adaptiveStream: true,
        dynacast: true,
        audioCaptureDefaults: {
          autoGainControl: true,
          echoCancellation: true,
          noiseSuppression: true,
        },
      });

      roomRef.current = room;

      // Connection state changes
      room.on(RoomEvent.ConnectionStateChanged, (state: ConnectionState) => {
        console.log('🔄 Connection state:', state);
        if (state === ConnectionState.Connected) {
          console.log('✅ Connected to LiveKit room');
          setIsConnected(true);
          setIsConnecting(false);
          setIsListening(true);
        } else if (state === ConnectionState.Disconnected) {
          console.log('🔌 Disconnected from room');
          setIsConnected(false);
          setIsListening(false);
        }
      });

      // Listen for agent audio tracks
      room.on(RoomEvent.TrackSubscribed, (track: Track, publication, participant) => {
        console.log('🎵 Track subscribed:', track.kind, 'from', participant.identity);
        
        if (track.kind === Track.Kind.Audio) {
          console.log('🔊 Agent audio track received');
          setIsSpeaking(true);
          setIsListening(false);
          
          // Attach audio track to HTML audio element
          const audioElement = track.attach();
          audioElement.play().catch(e => console.error('Error playing audio:', e));
          audioElementsRef.current.push(audioElement);
          document.body.appendChild(audioElement);
        }
      });

      // Audio track ended
      room.on(RoomEvent.TrackUnsubscribed, (track: Track) => {
        if (track.kind === Track.Kind.Audio) {
          console.log('✅ Agent finished speaking');
          setIsSpeaking(false);
          setIsListening(true);
          
          // Cleanup audio elements
          track.detach().forEach(el => el.remove());
        }
      });

      // Handle data messages (for transcripts if agent sends them)
      room.on(RoomEvent.DataReceived, (payload: Uint8Array, participant) => {
        try {
          const decoder = new TextDecoder();
          const data = JSON.parse(decoder.decode(payload));
          console.log('📨 Data received:', data);
          
          if (data.type === 'transcript') {
            setTranscript(prev => [...prev, {
              role: data.role === 'agent' ? 'assistant' : 'user',
              content: data.text,
              timestamp: Date.now()
            }]);
          }
        } catch (e) {
          console.error('Error parsing data:', e);
        }
      });

      // Connect to room
      await room.connect(config.url, config.token);
      console.log('🎤 Enabling microphone...');

      // Enable microphone
      await room.localParticipant.setMicrophoneEnabled(true);
      console.log('✅ Microphone enabled');

    } catch (error) {
      console.error('Error connecting to LiveKit:', error);
      setError('Failed to connect. Please ensure microphone access is granted.');
      setIsConnecting(false);
    }
  };

  const disconnectVoiceAgent = () => {
    // Cleanup audio elements
    audioElementsRef.current.forEach(el => {
      el.pause();
      el.remove();
    });
    audioElementsRef.current = [];

    // Disconnect room
    if (roomRef.current) {
      roomRef.current.disconnect();
      roomRef.current = null;
    }
  };

  const handleEndChat = () => {
    setIsEndChatModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsEndChatModalOpen(false);
  };

  const handleConfirmEndChat = async () => {
    setIsEndChatModalOpen(false);
    
    // Disconnect voice agent
    disconnectVoiceAgent();
    
    // End session on backend and sync transcript
    try {
      console.log('🔚 Ending voice session and syncing transcript...');
      
      const response = await axios.post('/api/voice/end-session', {
        conversationId,
        transcriptData: transcript
      });
      
      console.log('✅ Voice session ended successfully:', response.data);
    } catch (error) {
      console.error('Error ending voice session:', error);
    }
    
    // Navigate to feedback
    router.push(`/feedback?conversationId=${conversationId}`);
  };

  if (error) {
    return (
      <div className="max-w-[1200px] mx-auto p-4 pb-32">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <h2 className="text-xl font-semibold text-red-800 mb-2">Error</h2>
          <p className="text-red-600">{error}</p>
          <Button 
            onClick={() => router.back()}
            className="mt-4"
          >
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[1200px] mx-auto p-4 pb-32">
      {/* Persona Card */}
      <ChatPersonaCard persona={persona} isLoading={isPersonaLoading} />
      
      {/* Voice Chat Interface */}
      <div className="mt-8 flex flex-col items-center justify-center min-h-[500px]">
        {isConnecting && (
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-lg text-gray-600">Connecting to voice agent...</p>
            <p className="text-sm text-gray-500 mt-2">Please allow microphone access</p>
          </div>
        )}

        {isConnected && (
          <>
            {/* Status Indicator */}
            <div className="mb-8 text-center">
              <div className={`inline-flex items-center px-4 py-2 rounded-full ${
                isSpeaking ? 'bg-blue-100 text-blue-800' : 
                isListening ? 'bg-green-100 text-green-800' : 
                'bg-gray-100 text-gray-800'
              }`}>
                {isSpeaking && (
                  <>
                    <div className="animate-pulse w-3 h-3 bg-blue-600 rounded-full mr-2"></div>
                    AI is speaking...
                  </>
                )}
                {isListening && !isSpeaking && (
                  <>
                    <Mic className="w-4 h-4 mr-2" />
                    Listening...
                  </>
                )}
              </div>
            </div>

            {/* Microphone Visualization */}
            <div className="mb-8">
              <div className={`w-32 h-32 rounded-full flex items-center justify-center ${
                isListening ? 'bg-green-100 animate-pulse' : 'bg-gray-100'
              }`}>
                {isListening ? (
                  <Mic className="w-16 h-16 text-green-600" />
                ) : (
                  <MicOff className="w-16 h-16 text-gray-400" />
                )}
              </div>
            </div>

            {/* Transcript */}
            {transcript.length > 0 && (
              <div className="w-full max-w-2xl bg-gray-50 rounded-lg p-6 max-h-64 overflow-y-auto">
                <h3 className="text-sm font-semibold text-gray-700 mb-4">Conversation Transcript</h3>
                <div className="space-y-3">
                  {transcript.map((msg, idx) => (
                    <div key={idx} className={`text-sm ${
                      msg.role === 'user' ? 'text-right' : 'text-left'
                    }`}>
                      <span className={`inline-block px-3 py-2 rounded-lg ${
                        msg.role === 'user' 
                          ? 'bg-slate-200 text-gray-900'
                          : 'bg-primary text-white'
                      }`}>
                        {msg.content}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* End Chat Button */}
      <div className="fixed bottom-0 left-0 right-0 bg-white max-w-[1200px] mx-auto">
        <div className="max-w-[1200px] mx-auto p-4 flex justify-center">
          <Button
            onClick={handleEndChat}
            className="bg-red-500 text-white hover:bg-red-600 flex items-center gap-2"
            disabled={!isConnected}
          >
            <Phone className="w-4 h-4" />
            End Call
          </Button>
        </div>
      </div>

      {/* End Chat Confirmation Modal */}
      <Dialog open={isEndChatModalOpen} onOpenChange={setIsEndChatModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>End Voice Chat</DialogTitle>
            <DialogDescription>Are you sure you want to end this voice conversation?</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={handleCloseModal}>
              No
            </Button>
            <Button onClick={handleConfirmEndChat}>Yes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default VoiceChatScreen;

