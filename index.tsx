import React, { useState, useCallback, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom/client';
import { v4 as uuidv4 } from 'uuid';
import { GoogleGenAI, LiveServerMessage, Blob as GenAIBlob, Modality, FunctionCall } from "@google/genai";
import { MessageRole, ChatMessage, LiveSessionCallbacks, SubTopic, Lesson } from './types.ts';


// --- START OF INLINED CONSTANTS ---
export const GEMINI_LIVE_MODEL = 'gemini-2.5-flash-native-audio-preview-09-2025';

export const AUDIO_INPUT_SAMPLE_RATE = 16000;
export const AUDIO_OUTPUT_SAMPLE_RATE = 24000;
export const AUDIO_CHANNELS = 1;
export const AUDIO_BUFFER_SIZE = 4096;

export const AVAILABLE_LANGUAGES = [
  'English', 'Gujarati', 'Hindi', 
];

export const AVAILABLE_GERMAN_LEVELS = ['A1 Beginner', 'A2 Elementary', 'B1 Intermediate', 'B2 Upper Intermediate', 'C1 Advanced', 'C2 Proficiency'];

export const GERMAN_LESSONS_BY_LEVEL: Map<string, Lesson[]> = new Map([
  ['A1 Beginner', [
    {
      id: 'a1-l1',
      title: 'Lesson 1: Greetings and Introductions',
      description: 'Learn basic greetings and how to introduce yourself and others.',
      subTopics: [
        { id: 'a1-l1-st1', title: 'Formal Greetings', description: 'Guten Tag, Guten Morgen, Guten Abend.' },
        { id: 'a1-l1-st2', title: 'Informal Greetings', description: 'Hallo, Grüezi (Swiss German), Servus (Southern Germany/Austria).' },
        { id: 'a1-l1-st3', title: 'Saying Goodbye', description: 'Auf Wiedersehen, Tschüss.' },
        { id: 'a1-l1-st4', title: 'Self-Introduction', description: 'Wie heißen Sie?, Ich heiße..., Ich bin...' },
        { id: 'a1-l1-st5', title: 'Asking How Someone Is', description: 'Wie geht es Ihnen?, Mir geht es gut.' },
      ],
    },
    {
      id: 'a1-l2',
      title: 'Lesson 2: Alphabet and Pronunciation',
      description: 'Understand German alphabet sounds and basic pronunciation rules.',
      subTopics: [
        { id: 'a1-l2-st1', title: 'The German Alphabet', description: 'Learning each letter and its sound.' },
        { id: 'a1-l2-st2', title: 'Vowels and Umlauts (ä, ö, ü)', description: 'Pronunciation of special vowel sounds.' },
        { id: 'a1-l2-st3', title: 'Diphthongs (ei, au, eu/äu)', description: 'Common vowel combinations.' },
        { id: 'a1-l2-st4', title: 'Consonant Combinations (ch, sch, sp, st, pf, qu)', description: 'Specific consonant sounds.' },
        { id: 'a1-l2-st5', title: 'Hard and Soft S', description: 'Distinguishing s and ss/ß.' },
      ],
    },
    { id: 'a1-l3', title: 'Lesson 3: Numbers (0-20) and Age', description: 'Learn to count from 0 to 20 and ask/tell your age.', subTopics: [{ id: 'a1-l3-st1', title: 'Numbers 0-10', description: 'Eins, zwei, drei...' }] },
    { id: 'a1-l4', title: 'Lesson 4: Personal Pronouns and "Sein" (to be)', description: 'Master personal pronouns and the conjugation of the verb "sein".', subTopics: [{ id: 'a1-l4-st1', title: 'Ich, du, er, sie, es', description: 'Basic personal pronouns.' }] },
    { id: 'a1-l5', title: 'Lesson 5: Family Members', description: 'Learn vocabulary for family members and describe your family.', subTopics: [{ id: 'a1-l5-st1', title: 'Die Familie', description: 'Father, mother, brother, sister.' }] },
    { id: 'a1-l6', title: 'Lesson 6: Food and Drinks', description: 'Vocabulary for common food and beverages, and ordering at a cafe.', subTopics: [{ id: 'a1-l6-st1', title: 'Essen und Trinken', description: 'Common foods and drinks.' }] },
    { id: 'a1-l7', title: 'Lesson 7: Daily Routines', description: 'Talk about your daily activities using simple verbs.', subTopics: [{ id: 'a1-l7-st1', title: 'Der Tagesablauf', description: 'Getting up, eating, working.' }] },
    { id: 'a1-l8', title: 'Lesson 8: Shopping and Prices', description: 'Learn phrases for shopping and asking about prices.', subTopics: [{ id: 'a1-l8-st1', title: 'Einkaufen', description: 'Asking for prices and buying things.' }] },
    { id: 'a1-l9', title: 'Lesson 9: Asking for Directions', description: 'Practice asking and giving simple directions.', subTopics: [{ id: 'a1-l9-st1', title: 'Nach dem Weg fragen', description: 'Wo ist...? Wie komme ich zu...?' }] },
    { id: 'a1-l10', title: 'Lesson 10: Colors and Adjectives', description: 'Learn common colors and basic adjectives.', subTopics: [{ id: 'a1-l10-st1', title: 'Farben', description: 'Rot, blau, grün.' }] },
    { id: 'a1-l11', title: 'Lesson 11: Professions', description: 'Vocabulary for various professions and describing your job.', subTopics: [{ id: 'a1-l11-st1', title: 'Berufe', description: 'Lehrer, Arzt, Student.' }] },
    { id: 'a1-l12', title: 'Lesson 12: Hobbies and Free Time', description: 'Discuss hobbies and how you spend your free time.', subTopics: [{ id: 'a1-l12-st1', title: 'Hobbys', description: 'Lesen, Schwimmen, Musik hören.' }] },
    { id: 'a1-l13', title: 'Lesson 13: Time and Dates', description: 'Learn to tell time and express dates.', subTopics: [{ id: 'a1-l13-st1', title: 'Uhrzeit', description: 'Um wie viel Uhr ist es?' }] },
    { id: 'a1-l14', title: 'Lesson 14: Weather', description: 'Vocabulary and phrases to talk about the weather.', subTopics: [{ id: 'a1-l14-st1', title: 'Das Wetter', description: 'Es ist sonnig, es regnet.' }] },
    { id: 'a1-l15', title: 'Lesson 15: Revision and Simple Conversation', description: 'Review A1 topics and practice a longer basic conversation.', subTopics: [{ id: 'a1-l15-st1', title: 'A1 Wiederholung', description: 'Practice all learned topics.' }] },
  ]],
  ['A2 Elementary', [
    { id: 'a2-l1', title: 'Lesson 1: Past Tense (Perfekt)', description: 'Form and use the present perfect tense.', subTopics: [{ id: 'a2-l1-st1', title: 'Haben vs. Sein im Perfekt', description: 'When to use "haben" or "sein" with past participles.' }] },
    { id: 'a2-l2', title: 'Lesson 2: Dative Case', description: 'Understand and use the dative case with prepositions.', subTopics: [{ id: 'a2-l2-st1', title: 'Dative Prepositions', description: 'Mit, nach, von, zu.' }] },
  ]],
  ['B1 Intermediate', [
    { id: 'b1-l1', title: 'Lesson 1: Plusquamperfekt', description: 'Form and use the past perfect tense.', subTopics: [{ id: 'b1-l1-st1', title: 'Actions before actions in the past', description: 'Using the Plusquamperfekt to describe sequential events.' }] },
  ]],
  ['B2 Upper Intermediate', [
    { id: 'b2-l1', title: 'Lesson 1: Double Infinitive', description: 'Understand complex verb constructions with double infinitive.', subTopics: [{ id: 'b2-l1-st1', title: 'Modalverben im Perfekt', description: 'Using modal verbs in the perfect tense.' }] },
  ]],
  ['C1 Advanced', [
    { id: 'c1-l1', title: 'Lesson 1: Complex Sentence Structures', description: 'Master advanced conjunctions and sentence inversions.', subTopics: [{ id: 'c1-l1-st1', title: 'Konzessive und kausale Sätze', description: 'Expressing concessions and reasons.' }] },
  ]],
  ['C2 Proficiency', [
    { id: 'c2-l1', title: 'Lesson 1: Literary Analysis', description: 'Deep dive into German literature and literary criticism.', subTopics: [{ id: 'c2-l1-st1', title: 'Deutsche Klassiker', description: 'Analyzing works by Goethe, Schiller, Lessing.' }] },
  ]],
]);

export const getSystemInstruction = (
  explanationLanguage: string,
  germanLevel: string,
  selectedLessonTitle?: string,
  selectedLessonDescription?: string, 
  selectedSubTopicTitle?: string,
  selectedSubTopicDescription?: string
) => {
  let initialInstruction = '';
  const lessonFocus = selectedSubTopicTitle || selectedLessonTitle || `German at a ${germanLevel} level`;

  if (selectedLessonTitle && selectedSubTopicTitle) {
    initialInstruction = `Your current focus is on the sub-topic "${selectedSubTopicTitle}" from "${selectedLessonTitle}". Base your teaching on this.`;
  } else if (selectedLessonTitle) {
    initialInstruction = `Your current lesson is "${selectedLessonTitle}". Focus the conversation and teaching on topics related to this lesson.`;
  } else {
      initialInstruction = `You are teaching general German concepts at a ${germanLevel} level.`;
  }
  
  return `You are a friendly, patient, and encouraging German language teacher named ANAYA. Your goal is to actively teach the user German, tailoring the content to a ${germanLevel} level.

**Core Teaching Method:**
1.  **Introduce:** Proactively introduce new vocabulary, grammar, or concepts related to the current lesson. Do not wait for the user to ask.
2.  **Explain & Example:** Clearly explain the concept in ${explanationLanguage}. Provide a few clear examples in German.
3.  **Practice:** Give the user a simple task or ask a direct question to practice the new concept. For example, ask them to form a sentence, repeat a phrase, or answer a question using the new vocabulary.
4.  **Feedback:** Provide gentle and encouraging feedback on their attempt.

**Communication Rules:**
- All your explanations and instructions must be delivered clearly and concisely in ${explanationLanguage}.
- When providing German words or phrases, ALWAYS follow them with their ${explanationLanguage} meaning in parentheses, like this: Hallo (Hello). This is critical for learning.
- Avoid asking too many open-ended conversational questions like "How are you?" or "What do you want to learn?". Your role is to guide the lesson, not to be a passive conversationalist. Ask targeted questions to check understanding.

**Current Lesson Focus:**
${initialInstruction}

**Getting Started:**
Start by warmly greeting the student in ${explanationLanguage}. Then, immediately begin the lesson by introducing the first piece of information. For example: "Hello! Welcome to your lesson on '${lessonFocus}'. Let's start with a common greeting..." or "Hi there! Today we'll learn about ${lessonFocus}. The first word is..." Do not ask if they are ready or if they have questions from last time. Just start teaching.`;
};


export const LIVE_SESSION_BASE_CONFIG = {
  responseModalities: [Modality.AUDIO],
  outputAudioTranscription: {},
  inputAudioTranscription: {},
  speechConfig: {
    voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } },
  },
};
// --- END OF INLINED CONSTANTS ---


// --- START OF INLINED GEMINI SERVICE ---
let currentSession: Awaited<ReturnType<GoogleGenAI['live']['connect']>> | null = null;
let inputAudioContext: AudioContext | null = null;
let scriptProcessor: ScriptProcessorNode | null = null;
let mediaStreamSource: MediaStreamAudioSourceNode | null = null;
let outputAudioContext: AudioContext | null = null;
let outputNode: GainNode | null = null;
let nextStartTime = 0;
const audioSources = new Set<AudioBufferSourceNode>();

function encode(bytes: Uint8Array): string {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function decode(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

function createBlob(data: Float32Array): GenAIBlob {
  const l = data.length;
  const int16 = new Int16Array(l);
  for (let i = 0; i < l; i++) {
    int16[i] = data[i] * 32768;
  }
  return {
    data: encode(new Uint8Array(int16.buffer)),
    mimeType: `audio/pcm;rate=${AUDIO_INPUT_SAMPLE_RATE}`,
  };
}

function mapLanguageToCode(language: string): string {
  const languageMap: { [key: string]: string } = {
    'English': 'en-US',
    'Gujarati': 'gu-IN',
    'Hindi': 'hi-IN',
  };
  return languageMap[language] || 'en-US';
}

export async function initLiveSession(
  stream: MediaStream,
  callbacks: LiveSessionCallbacks,
  explanationLanguage: string,
  germanLevel: string,
  selectedLessonTitle?: string,
  selectedLessonDescription?: string,
  selectedSubTopicTitle?: string,
  selectedSubTopicDescription?: string,
): Promise<void> {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  inputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: AUDIO_INPUT_SAMPLE_RATE });
  outputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: AUDIO_OUTPUT_SAMPLE_RATE });
  outputNode = outputAudioContext.createGain();
  outputNode.connect(outputAudioContext.destination);

  const systemInstruction = getSystemInstruction(
    explanationLanguage,
    germanLevel,
    selectedLessonTitle,
    selectedLessonDescription,
    selectedSubTopicTitle,
    selectedSubTopicDescription
  );
  
  const liveSessionConfig = {
    ...LIVE_SESSION_BASE_CONFIG,
    systemInstruction,
    inputAudioTranscription: {
      languageCodes: [mapLanguageToCode(explanationLanguage), 'de'],
    },
  };

  const sessionPromise = ai.live.connect({
    model: GEMINI_LIVE_MODEL,
    callbacks: {
      onopen: () => {
        console.debug('Gemini Live Session Opened');
        callbacks.onOpen();

        const audioTrack = stream.getAudioTracks()[0];
        if (!audioTrack) {
          console.error("No audio track found in the provided MediaStream.");
          callbacks.onError(new ErrorEvent('NoAudioTrack', { message: 'No audio track found in media stream.' }));
          return;
        }

        mediaStreamSource = inputAudioContext!.createMediaStreamSource(new MediaStream([audioTrack]));
        scriptProcessor = inputAudioContext!.createScriptProcessor(AUDIO_BUFFER_SIZE, AUDIO_CHANNELS, AUDIO_CHANNELS);

        scriptProcessor.onaudioprocess = (audioProcessingEvent: AudioProcessingEvent) => {
          const inputData = audioProcessingEvent.inputBuffer.getChannelData(0);
          const pcmBlob = createBlob(inputData);
          sessionPromise.then((session) => {
            session.sendRealtimeInput({ media: pcmBlob });
          });
        };

        mediaStreamSource.connect(scriptProcessor);
        scriptProcessor.connect(inputAudioContext!.destination);
      },
      onmessage: async (message: LiveServerMessage) => {
        await callbacks.onMessage(message);

        const base64EncodedAudioString = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
        if (base64EncodedAudioString) {
          callbacks.onModelSpeaking(true);
          nextStartTime = Math.max(nextStartTime, outputAudioContext!.currentTime);
          try {
            const audioBuffer = await decodeAudioData(
              decode(base64EncodedAudioString),
              outputAudioContext!,
              AUDIO_OUTPUT_SAMPLE_RATE,
              AUDIO_CHANNELS,
            );
            const source = outputAudioContext!.createBufferSource();
            source.buffer = audioBuffer;
            source.connect(outputNode!);
            source.addEventListener('ended', () => {
              audioSources.delete(source);
              if (audioSources.size === 0) {
                callbacks.onModelSpeaking(false);
              }
            });
            source.start(nextStartTime);
            nextStartTime = nextStartTime + audioBuffer.duration;
            audioSources.add(source);
          } catch (error) {
            console.error('Error decoding audio data:', error);
            callbacks.onModelSpeaking(false);
          }
        } else if (message.serverContent?.turnComplete) {
          if (audioSources.size === 0) {
            callbacks.onModelSpeaking(false);
          }
        }

        const interrupted = message.serverContent?.interrupted;
        if (interrupted) {
          console.debug('Model output interrupted. Stopping current audio.');
          for (const source of audioSources.values()) {
            source.stop();
            audioSources.delete(source);
          }
          nextStartTime = 0;
          callbacks.onModelSpeaking(false);
        }
      },
      onerror: (e: ErrorEvent) => {
        console.error('Gemini Live Error:', e);
        callbacks.onError(e);
      },
      onclose: (e: CloseEvent) => {
        console.debug('Gemini Live Session Closed:', e);
        callbacks.onClose(e);
      },
    },
    config: liveSessionConfig,
  });

  currentSession = await sessionPromise;
}

export function stopLiveSession(): void {
  if (currentSession) {
    console.debug('Closing Gemini Live Session...');
    currentSession.close();
    currentSession = null;
  }
  if (scriptProcessor) {
    scriptProcessor.disconnect();
    scriptProcessor.onaudioprocess = null;
    scriptProcessor = null;
  }
  if (mediaStreamSource) {
    mediaStreamSource.disconnect();
    mediaStreamSource = null;
  }
  if (inputAudioContext) {
    inputAudioContext.close();
    inputAudioContext = null;
  }
  if (outputAudioContext) {
    outputAudioContext.close();
    outputAudioContext = null;
  }
  if (outputNode) {
    outputNode.disconnect();
    outputNode = null;
  }
  for (const source of audioSources.values()) {
    source.stop();
  }
  audioSources.clear();
  nextStartTime = 0;
  console.debug('Gemini Live Session Resources Released.');
}
// --- END OF INLINED GEMINI SERVICE ---


// --- START OF INLINED COMPONENTS ---

// GermanWordDisplay.tsx
interface GermanWordDisplayProps {
  germanWord: string;
  translation: string;
}

const GermanWordDisplay: React.FC<GermanWordDisplayProps> = ({ germanWord, translation }) => {
  if (!germanWord) {
    return (
        <div className="flex flex-col items-center justify-center h-full">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-blue-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <p className="text-gray-400 text-sm mt-2">ANAYA, your AI Tutor</p>
        </div>
    );
  }

  return (
    <div className="text-center p-3 transition-opacity duration-300 ease-in-out opacity-100 h-full flex flex-col justify-center">
      <p className="text-3xl font-bold text-white mb-2" aria-live="polite">{germanWord}</p>
      <p className="text-lg text-blue-200">{translation}</p>
    </div>
  );
};


// UserAudioInput.tsx
interface UserAudioInputProps {
  stream: MediaStream | null;
  className?: string;
}

const UserAudioInput: React.FC<UserAudioInputProps> = ({
  stream,
  className,
}) => {
  const [isMicrophoneActive, setIsMicrophoneActive] = useState(false);

  useEffect(() => {
    if (stream) {
      const audioTracks = stream.getAudioTracks();
      const active = audioTracks.length > 0 && audioTracks.some(track => track.enabled && track.readyState === 'live');
      setIsMicrophoneActive(active);
      
      const handleTrackStateChange = () => {
        const anyActive = audioTracks.some(track => track.enabled && track.readyState === 'live');
        setIsMicrophoneActive(anyActive);
      };

      audioTracks.forEach(track => {
        track.addEventListener('ended', handleTrackStateChange);
        track.addEventListener('mute', handleTrackStateChange);
        track.addEventListener('unmute', handleTrackStateChange);
      });

      return () => {
        audioTracks.forEach(track => {
          track.removeEventListener('ended', handleTrackStateChange);
          track.removeEventListener('mute', handleTrackStateChange);
          track.removeEventListener('unmute', handleTrackStateChange);
        });
      };
    } else {
      setIsMicrophoneActive(false);
    }
  }, [stream]);

  return (
    <div className={`relative w-full h-auto bg-gray-800 rounded-full overflow-hidden shadow-xl aspect-square flex items-center justify-center ${className}`}>
      {isMicrophoneActive ? (
        <svg
          className="w-1/2 h-1/2 text-green-400 animate-pulse"
          fill="currentColor"
          viewBox="0 0 20 20"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            fillRule="evenodd"
            d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0c0 2.757-1.724 5.143-4 6.172V19a1 1 0 102 0v-1a1 1 0 102 0v2a1 1 0 01-1 1h-7a1 1 0 01-1-1v-2a1 1 0 102 0v1a1 1 0 102 0v-4.069z"
            clipRule="evenodd"
          />
        </svg>
      ) : (
        <svg
          className="w-1/2 h-1/2 text-gray-400"
          fill="currentColor"
          viewBox="0 0 20 20"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            fillRule="evenodd"
            d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0c0 2.757-1.724 5.143-4 6.172V19a1 1 0 102 0v-1a1 1 0 102 0v2a1 1 0 01-1 1h-7a1 1 0 01-1-1v-2a1 1 0 102 0v1a1 1 0 102 0v-4.069z"
            clipRule="evenodd"
          />
        </svg>
      )}
    </div>
  );
};


// TranscriptionDisplay.tsx
interface TranscriptionDisplayProps {
  history: ChatMessage[];
  currentInputTranscription: string;
  currentOutputTranscription: string;
}

const TranscriptionDisplay: React.FC<TranscriptionDisplayProps> = ({
  history,
  currentInputTranscription,
  currentOutputTranscription,
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [history, currentInputTranscription, currentOutputTranscription]);

  const getRoleClass = (role: MessageRole) => {
    switch (role) {
      case MessageRole.USER:
        return 'bg-blue-100 text-blue-800 self-end rounded-br-none';
      case MessageRole.MODEL:
        return 'bg-green-100 text-green-800 self-start rounded-bl-none';
      case MessageRole.INFO:
        return 'bg-gray-100 text-gray-600 text-sm text-center';
      case MessageRole.ERROR:
        return 'bg-red-100 text-red-800 text-sm text-center';
      default:
        return '';
    }
  };

  return (
    <div className="flex flex-col flex-grow p-4 overflow-y-auto bg-white rounded-lg shadow-inner border border-gray-200">
      <div className="flex flex-col space-y-3">
        {history.map((msg) => (
          <div
            key={msg.id}
            className={`p-3 max-w-[80%] break-words rounded-lg shadow-sm ${getRoleClass(msg.role)}`}
          >
            {msg.text}
          </div>
        ))}
        {currentInputTranscription && (
          <div className="p-3 max-w-[80%] break-words rounded-lg shadow-sm bg-blue-50 text-blue-700 self-end rounded-br-none">
            {currentInputTranscription}
          </div>
        )}
        {currentOutputTranscription && (
          <div className="p-3 max-w-[80%] break-words rounded-lg shadow-sm bg-green-50 text-green-700 self-start rounded-bl-none">
            {currentOutputTranscription}
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
};


// Controls.tsx
interface ControlsProps {
  isStreaming: boolean;
  onStop: () => void;
  isLoading: boolean;
}

const Controls: React.FC<ControlsProps> = ({
  isStreaming,
  onStop,
  isLoading,
}) => {
  return (
    <div className="flex flex-col space-y-4 p-4 bg-white rounded-lg shadow-lg sticky bottom-0 z-10 w-full">
      <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
        <button
          onClick={onStop}
          disabled={isLoading || !isStreaming}
          className={`flex-grow py-3 px-6 rounded-lg text-lg font-semibold transition-colors duration-200
            ${isLoading || !isStreaming
              ? 'bg-red-300 text-white cursor-not-allowed'
              : 'bg-red-600 hover:bg-red-700 text-white'}`}
          aria-label={'Stop conversation'}
        >
          Stop Conversation
        </button>
      </div>
    </div>
  );
};


// LessonPage.tsx
interface LessonPageProps {
  selectedLanguage: string;
  selectedGermanLevel: string;
  selectedLessonTitle: string | null;
  selectedLessonDescription: string | null;
  selectedSubTopicTitle: string | null;
  selectedSubTopicDescription: string | null;
  onStopLesson: (errorMessage?: string) => void;
  isLoadingApp: boolean;
}

const LessonPage: React.FC<LessonPageProps> = ({
  selectedLanguage,
  selectedGermanLevel,
  selectedLessonTitle,
  selectedLessonDescription,
  selectedSubTopicTitle,
  selectedSubTopicDescription,
  onStopLesson,
  isLoadingApp,
}) => {
  const [isStreaming, setIsStreaming] = useState<boolean>(false);
  const [isMicrophoneAccessGranted, setIsMicrophoneAccessGranted] = useState<boolean>(false);
  const [isConnectingToAI, setIsConnectingToAI] = useState<boolean>(false);
  const [isMicrophoneRequesting, setIsMicrophoneRequesting] = useState<boolean>(false);
  const [isModelSpeaking, setIsModelSpeaking] = useState<boolean>(false);
  const [microphoneError, setMicrophoneError] = useState<string | null>(null);

  const [isApiKeySelected, setIsApiKeySelected] = useState<boolean>(false);
  const [isCheckingApiKey, setIsCheckingApiKey] = useState<boolean>(true);

  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [currentInputTranscription, setCurrentInputTranscription] = useState<string>('');
  const [currentOutputTranscription, setCurrentOutputTranscription] = useState<string>('');
  const [currentLearningWord, setCurrentLearningWord] = useState<{ german: string; translation: string } | null>(null);
  
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const lastEventWasError = useRef<boolean>(false);

  const currentInputTranscriptionRef = useRef('');
  currentInputTranscriptionRef.current = currentInputTranscription; 

  const currentOutputTranscriptionRef = useRef('');
  currentOutputTranscriptionRef.current = currentOutputTranscription; 

  useEffect(() => {
    const checkApiKey = async () => {
      try {
        const hasKey = await window.aistudio.hasSelectedApiKey();
        setIsApiKeySelected(hasKey);
      } catch (e) {
        console.error("Error checking for API key:", e);
        setIsApiKeySelected(false);
      } finally {
        setIsCheckingApiKey(false);
      }
    };
    checkApiKey();
  }, []);

  const handleLiveMessage = useCallback(async (message: LiveServerMessage) => {
    if (message.serverContent?.outputTranscription) {
      const newText = message.serverContent!.outputTranscription!.text;
      setCurrentOutputTranscription(prev => prev + newText);

      const regex = /([\p{L}\p{N}\p{P}\s]+)\s*\(([^)]+)\)/gu;
      let match;
      const fullCurrentOutput = currentOutputTranscriptionRef.current + newText;
      while ((match = regex.exec(fullCurrentOutput)) !== null) {
        if (match[1] && match[2]) {
          setCurrentLearningWord({ german: match[1].trim(), translation: match[2].trim() });
        }
      }
    } else if (message.serverContent?.inputTranscription) {
      setCurrentInputTranscription(prev => prev + message.serverContent!.inputTranscription!.text);
    }

    if (message.serverContent?.turnComplete) {
      const fullInputTranscription = currentInputTranscriptionRef.current;
      const fullOutputTranscription = currentOutputTranscriptionRef.current;

      if (fullInputTranscription) {
        setChatHistory(prev => [...prev, {
          id: uuidv4(),
          role: MessageRole.USER,
          text: fullInputTranscription,
        }]);
      }
      if (fullOutputTranscription) {
        setChatHistory(prev => [...prev, {
          id: uuidv4(),
          role: MessageRole.MODEL,
          text: fullOutputTranscription,
        }]);
      }

      setCurrentInputTranscription('');
      setCurrentOutputTranscription('');
      setCurrentLearningWord(null);
    }
  }, []);

  const handleLiveError = useCallback((error: ErrorEvent) => {
    lastEventWasError.current = true;
    console.error("Live session error:", error);
    let detailedErrorMessage = error.message;
    const errorText = error.message.toLowerCase();
    if (errorText.includes('api key') || errorText.includes('network error') || errorText.includes('not found') || errorText.includes('invalid argument')) {
      setIsApiKeySelected(false); // Reset key status to prompt user again
      detailedErrorMessage = `A connection error occurred, which might be due to an invalid API key. Please check your key and try again. For more info on keys and billing, see ai.google.dev/gemini-api/docs/billing. Original error: ${error.message}`;
    }
    onStopLesson(detailedErrorMessage);
  }, [onStopLesson]);
  
  const handleLiveClose = useCallback((event: CloseEvent) => {
    console.debug("Live session closed:", event);
  
    if (lastEventWasError.current) {
      lastEventWasError.current = false;
    } else {
      if (chatHistory.length > 0) {
        setChatHistory(prev => [...prev, { id: uuidv4(), role: MessageRole.INFO, text: 'Conversation ended.' }]);
      }
    }
  
    setIsStreaming(false);
    setIsConnectingToAI(false);
    setIsMicrophoneRequesting(false);
    setIsModelSpeaking(false);
    setMicrophoneError(null);
    stopLiveSession();
  }, [chatHistory]);

  const handleLiveOpen = useCallback(() => {
    console.debug("Live session opened, starting streaming.");
    setIsStreaming(true);
    setIsConnectingToAI(false);
    setIsMicrophoneRequesting(false); 
    setChatHistory(prev => [...prev, { id: uuidv4(), role: MessageRole.INFO, text: 'ANAYA is ready! Say something to begin your lesson.' }]);
  }, []);

  const handleModelSpeaking = useCallback((speaking: boolean) => {
    setIsModelSpeaking(speaking);
  }, []);

  const liveSessionCallbacks: LiveSessionCallbacks = {
    onMessage: handleLiveMessage,
    onError: handleLiveError,
    onClose: handleLiveClose,
    onOpen: handleLiveOpen,
    onModelSpeaking: handleModelSpeaking,
  };

  const startAILiveSession = useCallback(async (stream: MediaStream) => {
    if (isConnectingToAI || isStreaming) return; 
    setIsConnectingToAI(true);
    lastEventWasError.current = false;
    setChatHistory(prev => [...prev, { id: uuidv4(), role: MessageRole.INFO, text: 'Connecting to ANAYA...' }]);
    try {
      await initLiveSession(
        stream,
        liveSessionCallbacks,
        selectedLanguage,
        selectedGermanLevel,
        selectedLessonTitle || undefined,
        selectedLessonDescription || undefined,
        selectedSubTopicTitle || undefined,
        selectedSubTopicDescription || undefined
      );
    } catch (error) {
      console.error("Failed to initialize Live Session:", error);
      handleLiveError(new ErrorEvent('initError', { message: (error as Error).message }));
    }
  }, [isConnectingToAI, isStreaming, liveSessionCallbacks, selectedLanguage, selectedGermanLevel, selectedLessonTitle, selectedLessonDescription, selectedSubTopicTitle, selectedSubTopicDescription]);

  const stopConversation = useCallback(() => {
    console.debug("Stopping conversation...");
    onStopLesson();
  }, [onStopLesson]);

  const handleMicrophoneStreamReady = useCallback((stream: MediaStream) => {
    console.debug("Microphone stream is ready.");
    mediaStreamRef.current = stream; 
    setIsMicrophoneAccessGranted(true);
    setMicrophoneError(null);
    setChatHistory(prev => [...prev, { id: uuidv4(), role: MessageRole.INFO, text: 'Microphone is ready.' }]);
    startAILiveSession(stream); 
  }, [startAILiveSession]);

  const handleMicrophoneStreamError = useCallback((error: Error) => {
    console.error("Microphone access error:", error);
    const errorMessage = `Failed to access microphone: ${error.message}. Please ensure permissions are granted.`;
    setMicrophoneError(errorMessage);
    setIsMicrophoneAccessGranted(false);
    setIsMicrophoneRequesting(false);
    setChatHistory(prev => [...prev, { id: uuidv4(), role: MessageRole.ERROR, text: errorMessage }]);
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      stopLiveSession();
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const handleStartAudioCall = async () => {
    if (isMicrophoneRequesting) return; 
    setIsMicrophoneRequesting(true); 
    setMicrophoneError(null);
    setChatHistory(prev => [...prev, { id: uuidv4(), role: MessageRole.INFO, text: 'Requesting microphone access...' }]);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      handleMicrophoneStreamReady(stream);
    } catch (error) {
      handleMicrophoneStreamError(error as Error);
    }
  };

  const handleSelectApiKey = async () => {
    try {
      await (window as any).aistudio.openSelectKey();
      // Assume success to handle race condition and avoid another check
      setIsApiKeySelected(true);
      setIsCheckingApiKey(false);
    } catch (e) {
      console.error("Could not open API key selection:", e);
      setMicrophoneError("There was an issue opening the API key selection dialog.");
    }
  };

  return (
    <div className="flex flex-col lg:flex-row h-full w-full bg-gray-100">
      <div className="lg:w-1/3 p-4 flex flex-col items-center justify-center bg-gray-800 relative text-white min-h-[250px] lg:min-h-full">
        <h1 className="text-xl font-bold mb-4 text-center">German Lesson:</h1>
        <h2 className="text-2xl font-semibold mb-2 text-center text-blue-300" aria-live="polite">
          {selectedLessonTitle || 'No Lesson Selected'}
        </h2>
        {selectedSubTopicTitle && (
          <p className="text-md text-gray-300 text-center mb-4">
            <span className="font-medium">Current Topic:</span> {selectedSubTopicTitle}
          </p>
        )}

        <div className={`relative w-full max-w-sm p-4 h-40 bg-gray-700 rounded-lg shadow-lg flex flex-col items-center justify-center transition-all duration-300 ease-out ${isModelSpeaking ? 'speaking-pulse border-2 border-white' : 'border-2 border-transparent'}`}>
            <GermanWordDisplay 
              germanWord={currentLearningWord?.german || ''}
              translation={currentLearningWord?.translation || ''}
            />
            {isModelSpeaking && (
              <span className="absolute -bottom-3 px-3 py-1 bg-blue-500 text-white text-xs rounded-full shadow-md">ANAYA Speaking...</span>
            )}
        </div>

        {(isMicrophoneAccessGranted || isConnectingToAI || isStreaming || isMicrophoneRequesting) && (
          <div className="absolute bottom-4 right-4 z-20 w-24 h-24 rounded-full overflow-hidden shadow-xl bg-gray-900 flex items-center justify-center border-2 border-gray-600">
            <UserAudioInput
              stream={mediaStreamRef.current} 
              className="w-full h-full"
            />
          </div>
        )}
      </div>

      <div className="lg:w-2/3 flex flex-col p-4 space-y-4 bg-white relative">
        <h2 className="text-2xl font-bold text-gray-800 mb-4 text-center">Live Audio Lesson</h2>

        <div className="flex-grow flex flex-col">
          <TranscriptionDisplay
            history={chatHistory}
            currentInputTranscription={currentInputTranscription}
            currentOutputTranscription={currentOutputTranscription}
          />
        </div>

        {(!isStreaming && !isConnectingToAI && !isMicrophoneAccessGranted) && (
          <div className="mt-4 text-center">
            {microphoneError && (
              <p className="text-red-600 text-sm mb-2" role="alert">{microphoneError}</p>
            )}

            {isCheckingApiKey ? (
              <button
                disabled
                className="w-full py-3 px-6 rounded-lg text-lg font-semibold bg-gray-300 text-white cursor-not-allowed"
              >
                Checking API Key...
              </button>
            ) : !isApiKeySelected ? (
              <div>
                <button
                  onClick={handleSelectApiKey}
                  className="w-full py-3 px-6 rounded-lg text-lg font-semibold bg-orange-500 hover:bg-orange-600 text-white transition-colors duration-200"
                  aria-label="Set up Gemini API Key"
                >
                  Setup Gemini API Key
                </button>
                <p className="text-xs text-gray-500 mt-2">
                  To begin your lesson, you must first select a Gemini API key.
                  <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline ml-1">
                    Learn about billing
                  </a>.
                </p>
              </div>
            ) : (
              <button
                onClick={handleStartAudioCall}
                disabled={isLoadingApp || isConnectingToAI || isMicrophoneRequesting} 
                className={`w-full py-3 px-6 rounded-lg text-lg font-semibold transition-colors duration-200
                  ${isLoadingApp || isConnectingToAI || isMicrophoneRequesting ? 'bg-blue-300 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 text-white'}`}
                aria-label="Start audio lesson"
              >
                {isLoadingApp ? 'Loading App...' : (isMicrophoneRequesting ? 'Requesting Microphone...' : (isConnectingToAI ? 'Connecting...' : 'Start Audio Lesson'))}
              </button>
            )}
          </div>
        )}

        {(isMicrophoneAccessGranted || isConnectingToAI || isStreaming || isMicrophoneRequesting) && (
          <Controls
            isStreaming={isStreaming}
            onStop={stopConversation}
            isLoading={isLoadingApp || isConnectingToAI || isMicrophoneRequesting} 
          />
        )}
      </div>
    </div>
  );
};


// LessonSelection.tsx
interface LessonSelectionProps {
  isLoading: boolean;
  selectedLanguage: string;
  onLanguageChange: (language: string) => void;
  selectedGermanLevel: string;
  onGermanLevelChange: (level: string) => void;
  selectedLessonId: string | null;
  selectedSubTopicId: string | null;
  onLessonClick: (lessonId: string, lessonTitle: string, lessonDescription: string) => void;
  onSubTopicChange: (subTopicId: string | null, subTopicTitle: string | null, subTopicDescription: string | null) => void;
  onStartLesson: (lessonId: string, lessonTitle: string, lessonDescription: string, subTopicId: string | null, subTopicTitle: string | null, subTopicDescription: string | null) => void;
  globalError: string | null;
  onClearError: () => void;
}

const LessonSelection: React.FC<LessonSelectionProps> = ({
  isLoading,
  selectedLanguage,
  onLanguageChange,
  selectedGermanLevel,
  onGermanLevelChange,
  selectedLessonId,
  selectedSubTopicId,
  onLessonClick,
  onSubTopicChange,
  onStartLesson,
  globalError,
  onClearError,
}) => {
  const [isNavigatingToLessonPage, setIsNavigatingToLessonPage] = useState<boolean>(false);
  const currentLessons: Lesson[] = GERMAN_LESSONS_BY_LEVEL.get(selectedGermanLevel) || [];

  const currentSelectedLesson = selectedLessonId ? currentLessons.find(l => l.id === selectedLessonId) : null;
  const currentSelectedSubTopic = selectedSubTopicId && currentSelectedLesson?.subTopics
    ? currentSelectedLesson.subTopics.find(st => st.id === selectedSubTopicId)
    : null;

  useEffect(() => {
    if (
      selectedLessonId &&
      !selectedSubTopicId &&
      currentSelectedLesson?.subTopics &&
      currentSelectedLesson.subTopics.length > 0
    ) {
      const firstSubTopic = currentSelectedLesson.subTopics[0];
      onSubTopicChange(firstSubTopic.id, firstSubTopic.title, firstSubTopic.description);
    } else if (selectedLessonId && selectedSubTopicId && !currentSelectedSubTopic) {
      onSubTopicChange(null, null, null);
    }
  }, [selectedLessonId, selectedSubTopicId, currentSelectedLesson, currentSelectedSubTopic, onSubTopicChange]);


  const handleStartLessonClick = () => {
    if (!selectedLessonId || !currentSelectedLesson) {
      console.error("No lesson selected to start.");
      return;
    }
    setIsNavigatingToLessonPage(true);
    setTimeout(() => {
      onStartLesson(
        currentSelectedLesson.id,
        currentSelectedLesson.title,
        currentSelectedLesson.description,
        currentSelectedSubTopic?.id || null,
        currentSelectedSubTopic?.title || null,
        currentSelectedSubTopic?.description || null
      );
      setIsNavigatingToLessonPage(false);
    }, 500);
  };

  const selectOrCardDisabled = isLoading || isNavigatingToLessonPage;
  const startLessonButtonDisabled = isLoading || isNavigatingToLessonPage || !selectedLessonId;

  return (
    <div className="flex flex-col p-4 bg-white rounded-lg shadow-lg h-full">
      <div className="flex-shrink-0 pb-4 space-y-4">
        <h2 className="text-2xl font-bold text-gray-800 text-center">Choose Your Lesson</h2>

        {globalError && (
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-md relative" role="alert">
            <p className="font-bold">Error</p>
            <p className="text-sm">{globalError}</p>
            <button onClick={onClearError} className="absolute top-0 bottom-0 right-0 px-4 py-3" aria-label="Dismiss">
              <svg className="fill-current h-6 w-6 text-red-500" role="button" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><title>Close</title><path d="M14.348 14.849a1.2 1.2 0 0 1-1.697 0L10 11.819l-2.651 3.029a1.2 1.2 0 1 1-1.697-1.697l2.758-3.15-2.759-3.152a1.2 1.2 0 1 1 1.697-1.697L10 8.183l2.651-3.031a1.2 1.2 0 1 1 1.697 1.697l-2.758 3.152 2.758 3.15a1.2 1.2 0 0 1 0 1.698z"/></svg>
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="language-select" className="block text-sm font-medium text-gray-700 mb-1">
              Explanation Language:
            </label>
            <select
              id="language-select"
              value={selectedLanguage}
              onChange={(e) => onLanguageChange(e.target.value)}
              disabled={selectOrCardDisabled}
              aria-disabled={selectOrCardDisabled}
              className={`mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md shadow-sm bg-white
                ${selectOrCardDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
              aria-label="Select explanation language"
            >
              {AVAILABLE_LANGUAGES.map((lang) => (
                <option key={lang} value={lang}>
                  {lang}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="german-level-select" className="block text-sm font-medium text-gray-700 mb-1">
              German Level:
            </label>
            <select
              id="german-level-select"
              value={selectedGermanLevel}
              onChange={(e) => onGermanLevelChange(e.target.value)}
              disabled={selectOrCardDisabled}
              aria-disabled={selectOrCardDisabled}
              className={`mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md shadow-sm bg-white
                ${selectOrCardDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
              aria-label="Select German learning level"
            >
              {AVAILABLE_GERMAN_LEVELS.map((level) => (
                <option key={level} value={level}>
                  {level}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="flex-grow overflow-y-auto border-t border-gray-200 py-4">
        <h3 className="text-xl font-semibold text-gray-800 mb-4 px-2">Lessons for {selectedGermanLevel}:</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 px-2">
          {currentLessons.map((lesson) => {
            return (
              <div
                key={lesson.id}
                className={`bg-blue-50 border rounded-lg p-4 flex flex-col justify-between shadow-sm hover:shadow-md transition-shadow duration-200 relative
                  ${selectedLessonId === lesson.id ? 'border-blue-600 ring-2 ring-blue-500' : 'border-blue-200'}
                  ${selectOrCardDisabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
                onClick={selectOrCardDisabled ? undefined : () => onLessonClick(lesson.id, lesson.title, lesson.description)}
                role="button"
                tabIndex={selectOrCardDisabled ? -1 : 0}
                aria-pressed={selectedLessonId === lesson.id}
                aria-disabled={selectOrCardDisabled}
              >
                <div>
                  <h4 className="font-bold text-lg text-blue-800 mb-1">{lesson.title}</h4>
                  <p className="text-gray-700 text-sm mb-3">{lesson.description}</p>
                  
                  {lesson.subTopics && lesson.subTopics.length > 0 && selectedLessonId === lesson.id && (
                    <div className="mt-2">
                      <label htmlFor={`subtopic-select-${lesson.id}`} className="block text-xs font-medium text-gray-600 mb-1">
                        Start from Topic:
                      </label>
                      <select
                        id={`subtopic-select-${lesson.id}`}
                        value={selectedSubTopicId || ''}
                        onClick={(e) => e.stopPropagation()}
                        onChange={(e) => {
                          const subTopic = lesson.subTopics?.find(st => st.id === e.target.value);
                          onSubTopicChange(subTopic?.id || null, subTopic?.title || null, subTopic?.description || null);
                        }}
                        disabled={selectOrCardDisabled}
                        aria-disabled={selectOrCardDisabled}
                        className={`mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md shadow-sm bg-white
                          ${selectOrCardDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                        aria-label={`Select sub-topic for ${lesson.title}`}
                      >
                        {lesson.subTopics.map((subTopic) => (
                          <option key={subTopic.id} value={subTopic.id}>
                            {subTopic.title}
                          </option>
                        ))}
                      </select>
                      {selectedSubTopicId && currentSelectedSubTopic && selectedLessonId === lesson.id && (
                          <p className="text-xs text-gray-500 mt-1">
                            <span className="font-semibold">Current:</span> {currentSelectedSubTopic.description}
                          </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
          {currentLessons.length === 0 && (
            <p className="text-gray-600 text-center col-span-full">No lessons available for this level yet. Check back soon!</p>
          )}
        </div>
      </div>

      <div className="flex-shrink-0 pt-6 border-t border-gray-200">
        <div className="flex flex-col space-y-4">
          <button
            onClick={handleStartLessonClick}
            disabled={startLessonButtonDisabled}
            aria-disabled={startLessonButtonDisabled}
            className={`w-full py-3 px-6 rounded-lg text-white font-semibold transition-colors duration-200
              ${startLessonButtonDisabled ? 'bg-blue-300 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}
            aria-label="Start selected lesson"
          >
            {isNavigatingToLessonPage ? 'Loading Lesson...' : 'Start Selected Lesson'}
          </button>
        </div>
      </div>
    </div>
  );
};
// --- END OF INLINED COMPONENTS ---


// --- START OF APP COMPONENT ---
type Page = 'lessonSelection' | 'lessonPage';

const LS_LANGUAGE = 'germanTutor_language';
const LS_GERMAN_LEVEL = 'germanTutor_germanLevel';
const LS_LESSON_ID = 'germanTutor_lessonId';
const LS_LESSON_TITLE = 'germanTutor_lessonTitle';
const LS_LESSON_DESCRIPTION = 'germanTutor_lessonDescription';
const LS_SUBTOPIC_ID = 'germanTutor_subTopicId';
const LS_SUBTOPIC_TITLE = 'germanTutor_subTopicTitle';
const LS_SUBTOPIC_DESCRIPTION = 'germanTutor_subTopicDescription';

const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<Page>('lessonSelection');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [globalError, setGlobalError] = useState<string | null>(null);

  const [selectedLanguage, setSelectedLanguage] = useState<string>(
    localStorage.getItem(LS_LANGUAGE) || AVAILABLE_LANGUAGES[0]
  );
  const [selectedGermanLevel, setSelectedGermanLevel] = useState<string>(
    localStorage.getItem(LS_GERMAN_LEVEL) || AVAILABLE_GERMAN_LEVELS[0]
  );
  const [selectedLessonId, setSelectedLessonId] = useState<string | null>(
    localStorage.getItem(LS_LESSON_ID)
  );
  const [selectedLessonTitle, setSelectedLessonTitle] = useState<string | null>(
    localStorage.getItem(LS_LESSON_TITLE)
  );
  const [selectedLessonDescription, setSelectedLessonDescription] = useState<string | null>(
    localStorage.getItem(LS_LESSON_DESCRIPTION)
  );
  const [selectedSubTopicId, setSelectedSubTopicId] = useState<string | null>(
    localStorage.getItem(LS_SUBTOPIC_ID)
  );
  const [selectedSubTopicTitle, setSelectedSubTopicTitle] = useState<string | null>(
    localStorage.getItem(LS_SUBTOPIC_TITLE)
  );
  const [selectedSubTopicDescription, setSelectedSubTopicDescription] = useState<string | null>(
    localStorage.getItem(LS_SUBTOPIC_DESCRIPTION)
  );

  const clearErrors = useCallback(() => {
    setGlobalError(null);
  }, []);

  const saveTimeoutRef = useRef<number | null>(null);
  useEffect(() => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(() => {
      localStorage.setItem(LS_LANGUAGE, selectedLanguage);
      localStorage.setItem(LS_GERMAN_LEVEL, selectedGermanLevel);

      if (selectedLessonId) localStorage.setItem(LS_LESSON_ID, selectedLessonId); else localStorage.removeItem(LS_LESSON_ID);
      if (selectedLessonTitle) localStorage.setItem(LS_LESSON_TITLE, selectedLessonTitle); else localStorage.removeItem(LS_LESSON_TITLE);
      if (selectedLessonDescription) localStorage.setItem(LS_LESSON_DESCRIPTION, selectedLessonDescription); else localStorage.removeItem(LS_LESSON_DESCRIPTION);
      if (selectedSubTopicId) localStorage.setItem(LS_SUBTOPIC_ID, selectedSubTopicId); else localStorage.removeItem(LS_SUBTOPIC_ID);
      if (selectedSubTopicTitle) localStorage.setItem(LS_SUBTOPIC_TITLE, selectedSubTopicTitle); else localStorage.removeItem(LS_SUBTOPIC_TITLE);
      if (selectedSubTopicDescription) localStorage.setItem(LS_SUBTOPIC_DESCRIPTION, selectedSubTopicDescription); else localStorage.removeItem(LS_SUBTOPIC_DESCRIPTION);
      
    }, 300) as unknown as number;

    return () => { if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current); };
  }, [
    selectedLanguage, selectedGermanLevel, selectedLessonId, selectedLessonTitle,
    selectedLessonDescription, selectedSubTopicId, selectedSubTopicTitle,
    selectedSubTopicDescription,
  ]);

  const handleLanguageChange = useCallback((language: string) => { clearErrors(); setSelectedLanguage(language); setSelectedLessonId(null); setSelectedSubTopicId(null); }, [clearErrors]);
  const handleGermanLevelChange = useCallback((level: string) => { clearErrors(); setSelectedGermanLevel(level); setSelectedLessonId(null); setSelectedSubTopicId(null); }, [clearErrors]);
  const handleLessonClick = useCallback((lessonId: string, lessonTitle: string, lessonDescription: string) => { clearErrors(); setSelectedLessonId(lessonId); setSelectedLessonTitle(lessonTitle); setSelectedLessonDescription(lessonDescription); setSelectedSubTopicId(null); setSelectedSubTopicTitle(null); setSelectedSubTopicDescription(null); }, [clearErrors]);
  const handleSubTopicChange = useCallback((subTopicId: string | null, subTopicTitle: string | null, subTopicDescription: string | null) => { setSelectedSubTopicId(subTopicId); setSelectedSubTopicTitle(subTopicTitle); setSelectedSubTopicDescription(subTopicDescription); }, []);

  const handleStartLesson = useCallback((...args: any[]) => {
    clearErrors();
    const [lessonId, lessonTitle, lessonDescription, subTopicId, subTopicTitle, subTopicDescription] = args;
    
    setSelectedLessonId(lessonId); 
    setSelectedLessonTitle(lessonTitle); 
    setSelectedLessonDescription(lessonDescription);
    setSelectedSubTopicId(subTopicId); 
    setSelectedSubTopicTitle(subTopicTitle); 
    setSelectedSubTopicDescription(subTopicDescription);
    setCurrentPage('lessonPage');
  }, [clearErrors]);

  const handleStopLesson = useCallback((errorMessage?: string) => {
    if (errorMessage) {
      setGlobalError(errorMessage);
    }
    setCurrentPage('lessonSelection');
  }, []);

  return (
    <div className="relative flex flex-col lg:flex-row h-full w-full max-w-6xl mx-auto bg-gray-100 rounded-xl shadow-2xl p-4">
      {currentPage === 'lessonSelection' ? (
        <div className="flex flex-col lg:flex-row h-full w-full">
          <div className="lg:w-1/2 p-4 flex flex-col items-center justify-center bg-gray-800 relative text-white">
            <h1 className="text-3xl font-bold mb-6 text-center" aria-live="polite">German Language Tutor</h1>
            <p className="text-xl md:text-2xl font-semibold mb-2 text-center">Your personal German teacher</p>
            <p className="text-lg md:text-xl text-blue-300 text-center mb-4">(explaining in {selectedLanguage})</p>
            <p className="text-gray-300 text-sm text-center">ANAYA is ready to help you learn!</p>
          </div>
          <div className="lg:w-1/2 flex flex-col bg-white h-full">
            <LessonSelection
              isLoading={isLoading}
              selectedLanguage={selectedLanguage}
              onLanguageChange={handleLanguageChange}
              selectedGermanLevel={selectedGermanLevel}
              onGermanLevelChange={handleGermanLevelChange}
              selectedLessonId={selectedLessonId}
              selectedSubTopicId={selectedSubTopicId}
              onLessonClick={handleLessonClick}
              onSubTopicChange={handleSubTopicChange}
              onStartLesson={handleStartLesson}
              globalError={globalError}
              onClearError={clearErrors}
            />
          </div>
        </div>
      ) : (
        <LessonPage
          selectedLanguage={selectedLanguage}
          selectedGermanLevel={selectedGermanLevel}
          selectedLessonTitle={selectedLessonTitle}
          selectedLessonDescription={selectedLessonDescription}
          selectedSubTopicTitle={selectedSubTopicTitle}
          selectedSubTopicDescription={selectedSubTopicDescription}
          onStopLesson={handleStopLesson}
          isLoadingApp={isLoading}
        />
      )}
    </div>
  );
};
// --- END OF APP COMPONENT ---

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
