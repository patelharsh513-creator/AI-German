import React, { useState, useCallback, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom/client';
import { v4 as uuidv4 } from 'uuid';
import { GoogleGenAI, Modality } from '@google/genai';

// --- TYPES (from types.ts) ---
const MessageRole = {
  USER: 'user',
  MODEL: 'model',
  INFO: 'info',
  ERROR: 'error',
};

// --- CONSTANTS (from constants.ts) ---
const GEMINI_LIVE_MODEL = 'gemini-2.5-flash-native-audio-preview-09-2025';
const AUDIO_INPUT_SAMPLE_RATE = 16000;
const AUDIO_OUTPUT_SAMPLE_RATE = 24000;
const AUDIO_CHANNELS = 1;
const AUDIO_BUFFER_SIZE = 4096;
const AVAILABLE_LANGUAGES = [
  'English', 'Gujarati', 'Hindi', 'Marathi', 'Bengali', 'Tamil', 'Telugu', 'Kannada', 'Malayalam',
  'Punjabi', 'Odia', 'Assamese', 'Urdu', 'Nepali', 'French', 'Spanish', 'Italian', 'Portuguese',
  'Russian', 'Chinese (Mandarin)', 'Japanese', 'Korean', 'Arabic', 'Turkish', 'Vietnamese',
  'Thai', 'Indonesian', 'German',
];
const AVAILABLE_GERMAN_LEVELS = ['A1 Beginner', 'A2 Elementary', 'B1 Intermediate', 'B2 Upper Intermediate', 'C1 Advanced', 'C2 Proficiency'];
const GERMAN_LESSONS_BY_LEVEL = new Map([
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
  ]],
  ['A2 Elementary', [
    { id: 'a2-l1', title: 'Lesson 1: Past Tense (Perfekt)', description: 'Form and use the present perfect tense.', subTopics: [{ id: 'a2-l1-st1', title: 'Haben vs. Sein im Perfekt', description: 'When to use "haben" or "sein" with past participles.' }] },
    { id: 'a2-l2', title: 'Lesson 2: Dative Case', description: 'Understand and use the dative case with prepositions.', subTopics: [{ id: 'a2-l2-st1', title: 'Dative Prepositions', description: 'Mit, nach, von, zu.' }] },
  ]],
]);
const getSystemInstruction = (
  explanationLanguage,
  germanLevel,
  selectedLessonTitle,
  selectedLessonDescription, 
  selectedSubTopicTitle,
  selectedSubTopicDescription
) => {
  let initialInstruction = '';
  if (selectedLessonTitle && selectedSubTopicTitle) {
    initialInstruction = `Your current focus is on the sub-topic "${selectedSubTopicTitle}" from "${selectedLessonTitle}". Start by focusing on this specific sub-topic. If the student has been here before, try to review or build upon previous concepts related to this sub-topic.`;
  } else if (selectedLessonTitle) {
    initialInstruction = `Your current lesson is "${selectedLessonTitle}". Focus the conversation and teaching on topics related to this lesson.`;
  } else {
    switch (germanLevel) {
      case 'A1 Beginner': initialInstruction = `You are teaching German at a beginner (A1) level. Focus on fundamental grammar, vocabulary, and simple conversational phrases.`; break;
      case 'A2 Elementary': initialInstruction = `You are teaching German at an elementary (A2) level. Focus on expanding vocabulary, more complex sentence structures, and everyday situations.`; break;
      default: initialInstruction = `You are teaching German.`;
    }
  }
  return `You are a friendly, patient, and encouraging German language teacher named ANAYA.
  Your goal is to teach the user German, tailoring the content to a ${germanLevel} level.
  All your explanations and instructions should be delivered clearly and concisely in ${explanationLanguage}.
  When providing German words or phrases, always follow them with their ${explanationLanguage} meaning in parentheses, like this: Hallo (Hello).
  ${initialInstruction}
  Start by greeting the student in ${explanationLanguage} and asking if they are ready to start this specific part of the lesson, or if they have any questions from a previous session.`;
};
const LIVE_SESSION_BASE_CONFIG = {
  responseModalities: [Modality.AUDIO],
  outputAudioTranscription: {},
  inputAudioTranscription: {},
  speechConfig: {
    voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } },
  },
};

// --- GEMINI SERVICE (from services/geminiService.ts) ---
let currentSession = null;
let inputAudioContext = null;
let scriptProcessor = null;
let mediaStreamSource = null;
let outputAudioContext = null;
let outputNode = null;
let nextStartTime = 0;
const audioSources = new Set();

function encode(bytes) {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function decode(base64) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

async function decodeAudioData(data, ctx, sampleRate, numChannels) {
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

function createBlob(data) {
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

async function initLiveSession(
  stream,
  callbacks,
  explanationLanguage,
  germanLevel,
  selectedLessonTitle,
  selectedLessonDescription,
  selectedSubTopicTitle,
  selectedSubTopicDescription
) {
  if (!process.env.API_KEY) {
    const errorMsg = "An API Key must be set when running in a browser";
    console.error(errorMsg);
    callbacks.onError(new ErrorEvent('APIKeyError', { message: errorMsg }));
    return;
  }
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  inputAudioContext = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: AUDIO_INPUT_SAMPLE_RATE });
  outputAudioContext = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: AUDIO_OUTPUT_SAMPLE_RATE });
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
        mediaStreamSource = inputAudioContext.createMediaStreamSource(new MediaStream([audioTrack]));
        scriptProcessor = inputAudioContext.createScriptProcessor(AUDIO_BUFFER_SIZE, AUDIO_CHANNELS, AUDIO_CHANNELS);
        scriptProcessor.onaudioprocess = (audioProcessingEvent) => {
          const inputData = audioProcessingEvent.inputBuffer.getChannelData(0);
          const pcmBlob = createBlob(inputData);
          sessionPromise.then((session) => {
            session.sendRealtimeInput({ media: pcmBlob });
          });
        };
        mediaStreamSource.connect(scriptProcessor);
        scriptProcessor.connect(inputAudioContext.destination);
      },
      onmessage: async (message) => {
        await callbacks.onMessage(message);
        const base64EncodedAudioString = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
        if (base64EncodedAudioString) {
          callbacks.onModelSpeaking(true);
          nextStartTime = Math.max(nextStartTime, outputAudioContext.currentTime);
          try {
            const audioBuffer = await decodeAudioData(
              decode(base64EncodedAudioString),
              outputAudioContext,
              AUDIO_OUTPUT_SAMPLE_RATE,
              AUDIO_CHANNELS,
            );
            const source = outputAudioContext.createBufferSource();
            source.buffer = audioBuffer;
            source.connect(outputNode);
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
      onerror: (e) => {
        console.error('Gemini Live Error:', e);
        let errorMessage = e.message;
        if (e.message.includes("invalid argument") || e.message.includes("API key not valid")) {
            errorMessage = `The API key was rejected by the Gemini service. It might be invalid, unauthorized, or require billing setup. More info: ai.google.dev/gemini-api/docs/billing`;
        }
        callbacks.onError(new ErrorEvent('GeminiLiveAPIError', { message: errorMessage }));
      },
      onclose: (e) => {
        console.debug('Gemini Live Session Closed:', e);
        callbacks.onClose(e);
      },
    },
    config: liveSessionConfig,
  });
  currentSession = await sessionPromise;
}

function stopLiveSession() {
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

// --- COMPONENTS ---

const GermanWordDisplay = ({ germanWord, translation }) => {
  if (!germanWord) {
    return (
        React.createElement('div', { className: "flex flex-col items-center justify-center h-full" },
            React.createElement('svg', { xmlns: "http://www.w3.org/2000/svg", className: "h-16 w-16 text-blue-300", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", strokeWidth: "1.5" },
              React.createElement('path', { strokeLinecap: "round", strokeLinejoin: "round", d: "M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" })
            ),
            React.createElement('p', { className: "text-gray-400 text-sm mt-2" }, "ANAYA, your AI Tutor")
        )
    );
  }
  return (
    React.createElement('div', { className: "text-center p-3 transition-opacity duration-300 ease-in-out opacity-100 h-full flex flex-col justify-center" },
      React.createElement('p', { className: "text-3xl font-bold text-white mb-2", 'aria-live': "polite" }, germanWord),
      React.createElement('p', { className: "text-lg text-blue-200" }, translation)
    )
  );
};

const UserAudioInput = ({ stream, className }) => {
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
    React.createElement('div', { className: `relative w-full h-auto bg-gray-800 rounded-full overflow-hidden shadow-xl aspect-square flex items-center justify-center ${className}` },
      isMicrophoneActive ? (
        React.createElement('svg', { className: "w-1/2 h-1/2 text-green-400 animate-pulse", fill: "currentColor", viewBox: "0 0 20 20", xmlns: "http://www.w3.org/2000/svg" },
          React.createElement('path', { fillRule: "evenodd", d: "M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0c0 2.757-1.724 5.143-4 6.172V19a1 1 0 102 0v-1a1 1 0 102 0v2a1 1 0 01-1 1h-7a1 1 0 01-1-1v-2a1 1 0 102 0v1a1 1 0 102 0v-4.069z", clipRule: "evenodd" })
        )
      ) : (
        React.createElement('svg', { className: "w-1/2 h-1/2 text-gray-400", fill: "currentColor", viewBox: "0 0 20 20", xmlns: "http://www.w3.org/2000/svg" },
          React.createElement('path', { fillRule: "evenodd", d: "M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0c0 2.757-1.724 5.143-4 6.172V19a1 1 0 102 0v-1a1 1 0 102 0v2a1 1 0 01-1 1h-7a1 1 0 01-1-1v-2a1 1 0 102 0v1a1 1 0 102 0v-4.069z", clipRule: "evenodd" }),
          React.createElement('path', { fillRule: "evenodd", d: "M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zM5 8a1 1 0 011-1h1a1 1 0 110 2H6a1 1 0 01-1-1zm10 0a1 1 0 011-1h1a1 1 0 110 2h-1a1 1 0 01-1-1z", clipRule: "evenodd" })
        )
      ),
      React.createElement('div', { className: "absolute inset-0 flex items-center justify-center bg-black bg-opacity-70 text-white text-lg font-semibold pointer-events-none" },
        isMicrophoneActive ? (
          React.createElement('span', { className: "text-green-400" }, "Microphone Active")
        ) : (
          React.createElement('span', { className: "text-gray-400" }, "Microphone Off")
        )
      )
    )
  );
};

const TranscriptionDisplay = ({ history, currentInputTranscription, currentOutputTranscription }) => {
  const messagesEndRef = useRef(null);
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  useEffect(() => {
    scrollToBottom();
  }, [history, currentInputTranscription, currentOutputTranscription]);
  const getRoleClass = (role) => {
    switch (role) {
      case MessageRole.USER: return 'bg-blue-100 text-blue-800 self-end rounded-br-none';
      case MessageRole.MODEL: return 'bg-green-100 text-green-800 self-start rounded-bl-none';
      case MessageRole.INFO: return 'bg-gray-100 text-gray-600 text-sm text-center';
      case MessageRole.ERROR: return 'bg-red-100 text-red-800 text-sm text-center';
      default: return '';
    }
  };
  return (
    React.createElement('div', { className: "flex flex-col flex-grow p-4 overflow-y-auto bg-white rounded-lg shadow-inner border border-gray-200" },
      React.createElement('div', { className: "flex flex-col space-y-3" },
        history.map((msg) => (
          React.createElement('div', { key: msg.id, className: `p-3 max-w-[80%] break-words rounded-lg shadow-sm ${getRoleClass(msg.role)}` },
            msg.text
          )
        )),
        currentInputTranscription && (
          React.createElement('div', { className: "p-3 max-w-[80%] break-words rounded-lg shadow-sm bg-blue-50 text-blue-700 self-end rounded-br-none" },
            currentInputTranscription
          )
        ),
        currentOutputTranscription && (
          React.createElement('div', { className: "p-3 max-w-[80%] break-words rounded-lg shadow-sm bg-green-50 text-green-700 self-start rounded-bl-none" },
            currentOutputTranscription
          )
        ),
        React.createElement('div', { ref: messagesEndRef })
      )
    )
  );
};

const Controls = ({ isStreaming, onStop, isLoading }) => {
  return (
    React.createElement('div', { className: "flex flex-col space-y-4 p-4 bg-white rounded-lg shadow-lg sticky bottom-0 z-10 w-full" },
      React.createElement('div', { className: "flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4" },
        React.createElement('button', {
          onClick: onStop,
          disabled: isLoading || !isStreaming,
          className: `flex-grow py-3 px-6 rounded-lg text-lg font-semibold transition-colors duration-200
            ${isLoading || !isStreaming
              ? 'bg-red-300 text-white cursor-not-allowed'
              : 'bg-red-600 hover:bg-red-700 text-white'}`,
          'aria-label': 'Stop conversation',
        }, "Stop Conversation")
      )
    )
  );
};

const LessonPage = ({
  selectedLanguage,
  selectedGermanLevel,
  selectedLessonTitle,
  selectedLessonDescription,
  selectedSubTopicTitle,
  selectedSubTopicDescription,
  onStopLesson,
  isLoadingApp,
}) => {
  const [isStreaming, setIsStreaming] = useState(false);
  const [isMicrophoneAccessGranted, setIsMicrophoneAccessGranted] = useState(false);
  const [isConnectingToAI, setIsConnectingToAI] = useState(false);
  const [isMicrophoneRequesting, setIsMicrophoneRequesting] = useState(false);
  const [isModelSpeaking, setIsModelSpeaking] = useState(false);
  const [microphoneError, setMicrophoneError] = useState(null);
  const [chatHistory, setChatHistory] = useState([]);
  const [currentInputTranscription, setCurrentInputTranscription] = useState('');
  const [currentOutputTranscription, setCurrentOutputTranscription] = useState('');
  const [currentLearningWord, setCurrentLearningWord] = useState(null);
  const mediaStreamRef = useRef(null);
  const lastEventWasError = useRef(false);
  const currentInputTranscriptionRef = useRef('');
  currentInputTranscriptionRef.current = currentInputTranscription;
  const currentOutputTranscriptionRef = useRef('');
  currentOutputTranscriptionRef.current = currentOutputTranscription;

  const handleLiveMessage = useCallback(async (message) => {
    if (message.serverContent?.outputTranscription) {
      const newText = message.serverContent.outputTranscription.text;
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
      setCurrentInputTranscription(prev => prev + message.serverContent.inputTranscription.text);
    }
    if (message.serverContent?.turnComplete) {
      const fullInputTranscription = currentInputTranscriptionRef.current;
      const fullOutputTranscription = currentOutputTranscriptionRef.current;
      if (fullInputTranscription) {
        setChatHistory(prev => [...prev, { id: uuidv4(), role: MessageRole.USER, text: fullInputTranscription }]);
      }
      if (fullOutputTranscription) {
        setChatHistory(prev => [...prev, { id: uuidv4(), role: MessageRole.MODEL, text: fullOutputTranscription }]);
      }
      setCurrentInputTranscription('');
      setCurrentOutputTranscription('');
      setCurrentLearningWord(null);
    }
  }, []);

  const handleLiveError = useCallback((error) => {
    lastEventWasError.current = true;
    console.error("Live session error:", error);
    onStopLesson(error.message);
  }, [onStopLesson]);

  const handleLiveClose = useCallback((event) => {
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

  const handleModelSpeaking = useCallback((speaking) => {
    setIsModelSpeaking(speaking);
  }, []);

  const liveSessionCallbacks = {
    onMessage: handleLiveMessage,
    onError: handleLiveError,
    onClose: handleLiveClose,
    onOpen: handleLiveOpen,
    onModelSpeaking: handleModelSpeaking,
  };

  const startAILiveSession = useCallback(async (stream) => {
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
      handleLiveError(new ErrorEvent('initError', { message: error.message }));
    }
  }, [isConnectingToAI, isStreaming, liveSessionCallbacks, selectedLanguage, selectedGermanLevel, selectedLessonTitle, selectedLessonDescription, selectedSubTopicTitle, selectedSubTopicDescription]);

  const stopConversation = useCallback(() => {
    console.debug("Stopping conversation...");
    onStopLesson();
  }, [onStopLesson]);

  const handleMicrophoneStreamReady = useCallback((stream) => {
    console.debug("Microphone stream is ready.");
    mediaStreamRef.current = stream;
    setIsMicrophoneAccessGranted(true);
    setMicrophoneError(null);
    setChatHistory(prev => [...prev, { id: uuidv4(), role: MessageRole.INFO, text: 'Microphone is ready.' }]);
    startAILiveSession(stream);
  }, [startAILiveSession]);

  const handleMicrophoneStreamError = useCallback((error) => {
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
      handleMicrophoneStreamError(error);
    }
  };

  return (
    React.createElement('div', { className: "flex flex-col lg:flex-row h-full w-full bg-gray-100" },
      React.createElement('div', { className: "lg:w-1/3 p-4 flex flex-col items-center justify-center bg-gray-800 relative text-white min-h-[250px] lg:min-h-full" },
        React.createElement('h1', { className: "text-xl font-bold mb-4 text-center" }, "German Lesson:"),
        React.createElement('h2', { className: "text-2xl font-semibold mb-2 text-center text-blue-300", 'aria-live': "polite" }, selectedLessonTitle || 'No Lesson Selected'),
        selectedSubTopicTitle && React.createElement('p', { className: "text-md text-gray-300 text-center mb-4" },
          React.createElement('span', { className: "font-medium" }, "Current Topic:"), ` ${selectedSubTopicTitle}`
        ),
        React.createElement('p', { className: "text-xl md:text-2xl font-semibold mb-2 text-center" }, "Your personal German teacher"),
        React.createElement('p', { className: "text-lg md:text-xl text-blue-300 text-center mb-4" }, `(explaining in ${selectedLanguage})`),
        React.createElement('div', { className: `relative w-full max-w-sm p-4 h-40 bg-gray-700 rounded-lg shadow-lg flex flex-col items-center justify-center transition-all duration-300 ease-out ${isModelSpeaking ? 'speaking-pulse border-2 border-white' : 'border-2 border-transparent'}` },
          React.createElement(GermanWordDisplay, { germanWord: currentLearningWord?.german || '', translation: currentLearningWord?.translation || '' }),
          isModelSpeaking && React.createElement('span', { className: "absolute -bottom-3 px-3 py-1 bg-blue-500 text-white text-xs rounded-full shadow-md animate-bounce-slow" }, "ANAYA Speaking...")
        ),
        (isMicrophoneAccessGranted || isConnectingToAI || isStreaming || isMicrophoneRequesting) && React.createElement('div', { className: "absolute bottom-4 right-4 z-20 w-24 h-24 rounded-full overflow-hidden shadow-xl bg-gray-900 flex items-center justify-center border-2 border-gray-600" },
          React.createElement(UserAudioInput, { stream: mediaStreamRef.current, className: "w-full h-full" })
        )
      ),
      React.createElement('div', { className: "lg:w-2/3 flex flex-col p-4 space-y-4 bg-white relative" },
        React.createElement('h2', { className: "text-2xl font-bold text-gray-800 mb-4 text-center" }, "Live Audio Lesson"),
        React.createElement('div', { className: "flex-grow flex flex-col" },
          React.createElement(TranscriptionDisplay, { history: chatHistory, currentInputTranscription, currentOutputTranscription })
        ),
        (!isStreaming && !isConnectingToAI && !isMicrophoneAccessGranted) && React.createElement('div', { className: "mt-4 text-center" },
          microphoneError && React.createElement('p', { className: "text-red-600 text-sm mb-2", role: "alert" }, microphoneError),
          React.createElement('button', {
            onClick: handleStartAudioCall,
            disabled: isLoadingApp || isConnectingToAI || isMicrophoneRequesting,
            className: `w-full py-3 px-6 rounded-lg text-lg font-semibold transition-colors duration-200 ${isLoadingApp || isConnectingToAI || isMicrophoneRequesting ? 'bg-blue-300 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 text-white'}`,
            'aria-label': "Start audio lesson",
          }, isLoadingApp ? 'Loading App...' : (isMicrophoneRequesting ? 'Requesting Microphone...' : (isConnectingToAI ? 'Connecting...' : 'Start Audio Lesson')))
        ),
        (isMicrophoneAccessGranted || isConnectingToAI || isStreaming || isMicrophoneRequesting) && React.createElement(Controls, { isStreaming, onStop: stopConversation, isLoading: isLoadingApp || isConnectingToAI || isMicrophoneRequesting })
      )
    )
  );
};

const LessonSelection = ({
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
  const [isNavigatingToLessonPage, setIsNavigatingToLessonPage] = useState(false);
  const currentLessons = GERMAN_LESSONS_BY_LEVEL.get(selectedGermanLevel) || [];
  const currentSelectedLesson = selectedLessonId ? currentLessons.find(l => l.id === selectedLessonId) : null;
  const currentSelectedSubTopic = selectedSubTopicId && currentSelectedLesson?.subTopics ? currentSelectedLesson.subTopics.find(st => st.id === selectedSubTopicId) : null;

  useEffect(() => {
    if (selectedLessonId && !selectedSubTopicId && currentSelectedLesson?.subTopics && currentSelectedLesson.subTopics.length > 0) {
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
    React.createElement('div', { className: "flex flex-col p-4 bg-white rounded-lg shadow-lg h-full" },
      React.createElement('div', { className: "flex-shrink-0 pb-4 space-y-4" },
        React.createElement('h2', { className: "text-2xl font-bold text-gray-800 text-center" }, "Choose Your Lesson"),
        globalError && React.createElement('div', { className: "bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-md relative", role: "alert" },
          React.createElement('p', { className: "font-bold" }, "Error"),
          React.createElement('p', { className: "text-sm" }, globalError),
          React.createElement('button', { onClick: onClearError, className: "absolute top-0 bottom-0 right-0 px-4 py-3", 'aria-label': "Dismiss" },
            React.createElement('svg', { className: "fill-current h-6 w-6 text-red-500", role: "button", xmlns: "http://www.w3.org/2000/svg", viewBox: "0 0 20 20" }, React.createElement('title', null, "Close"), React.createElement('path', { d: "M14.348 14.849a1.2 1.2 0 0 1-1.697 0L10 11.819l-2.651 3.029a1.2 1.2 0 1 1-1.697-1.697l2.758-3.15-2.759-3.152a1.2 1.2 0 1 1 1.697-1.697L10 8.183l2.651-3.031a1.2 1.2 0 1 1 1.697 1.697l-2.758 3.152 2.758 3.15a1.2 1.2 0 0 1 0 1.698z" }))
          )
        ),
        React.createElement('div', { className: "grid grid-cols-1 sm:grid-cols-2 gap-4" },
          React.createElement('div', null,
            React.createElement('label', { htmlFor: "language-select", className: "block text-sm font-medium text-gray-700 mb-1" }, "Explanation Language:"),
            React.createElement('select', { id: "language-select", value: selectedLanguage, onChange: (e) => onLanguageChange(e.target.value), disabled: selectOrCardDisabled, 'aria-disabled': selectOrCardDisabled, className: `mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md shadow-sm bg-white ${selectOrCardDisabled ? 'opacity-50 cursor-not-allowed' : ''}`, 'aria-label': "Select explanation language" },
              AVAILABLE_LANGUAGES.map((lang) => React.createElement('option', { key: lang, value: lang }, lang))
            )
          ),
          React.createElement('div', null,
            React.createElement('label', { htmlFor: "german-level-select", className: "block text-sm font-medium text-gray-700 mb-1" }, "German Level:"),
            React.createElement('select', { id: "german-level-select", value: selectedGermanLevel, onChange: (e) => onGermanLevelChange(e.target.value), disabled: selectOrCardDisabled, 'aria-disabled': selectOrCardDisabled, className: `mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md shadow-sm bg-white ${selectOrCardDisabled ? 'opacity-50 cursor-not-allowed' : ''}`, 'aria-label': "Select German learning level" },
              AVAILABLE_GERMAN_LEVELS.map((level) => React.createElement('option', { key: level, value: level }, level))
            )
          )
        )
      ),
      React.createElement('div', { className: "flex-grow overflow-y-auto border-t border-gray-200 py-4" },
        React.createElement('h3', { className: "text-xl font-semibold text-gray-800 mb-4 px-2" }, `Lessons for ${selectedGermanLevel}:`),
        React.createElement('div', { className: "grid grid-cols-1 md:grid-cols-2 gap-4 px-2" },
          currentLessons.map((lesson) => {
            return (
              React.createElement('div', { key: lesson.id, className: `bg-blue-50 border rounded-lg p-4 flex flex-col justify-between shadow-sm hover:shadow-md transition-shadow duration-200 relative ${selectedLessonId === lesson.id ? 'border-blue-600 ring-2 ring-blue-500' : 'border-blue-200'} ${selectOrCardDisabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`, onClick: selectOrCardDisabled ? undefined : () => onLessonClick(lesson.id, lesson.title, lesson.description), role: "button", tabIndex: selectOrCardDisabled ? -1 : 0, 'aria-pressed': selectedLessonId === lesson.id, 'aria-disabled': selectOrCardDisabled },
                React.createElement('div', null,
                  React.createElement('h4', { className: "font-bold text-lg text-blue-800 mb-1" }, lesson.title),
                  React.createElement('p', { className: "text-gray-700 text-sm mb-3" }, lesson.description),
                  lesson.subTopics && lesson.subTopics.length > 0 && selectedLessonId === lesson.id && (
                    React.createElement('div', { className: "mt-2" },
                      React.createElement('label', { htmlFor: `subtopic-select-${lesson.id}`, className: "block text-xs font-medium text-gray-600 mb-1" }, "Start from Topic:"),
                      React.createElement('select', { id: `subtopic-select-${lesson.id}`, value: selectedSubTopicId || '', onClick: (e) => e.stopPropagation(), onChange: (e) => { const subTopic = lesson.subTopics?.find(st => st.id === e.target.value); onSubTopicChange(subTopic?.id || null, subTopic?.title || null, subTopic?.description || null); }, disabled: selectOrCardDisabled, 'aria-disabled': selectOrCardDisabled, className: `mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md shadow-sm bg-white ${selectOrCardDisabled ? 'opacity-50 cursor-not-allowed' : ''}`, 'aria-label': `Select sub-topic for ${lesson.title}` },
                        lesson.subTopics.map((subTopic) => React.createElement('option', { key: subTopic.id, value: subTopic.id }, subTopic.title))
                      ),
                      selectedSubTopicId && currentSelectedSubTopic && selectedLessonId === lesson.id && (
                        React.createElement('p', { className: "text-xs text-gray-500 mt-1" }, React.createElement('span', { className: "font-semibold" }, "Current:"), ` ${currentSelectedSubTopic.description}`)
                      )
                    )
                  )
                )
              )
            );
          }),
          currentLessons.length === 0 && (
            React.createElement('p', { className: "text-gray-600 text-center col-span-full" }, "No lessons available for this level yet. Check back soon!")
          )
        )
      ),
      React.createElement('div', { className: "flex-shrink-0 pt-6 border-t border-gray-200" },
        React.createElement('div', { className: "flex flex-col space-y-4" },
          React.createElement('button', { onClick: handleStartLessonClick, disabled: startLessonButtonDisabled, 'aria-disabled': startLessonButtonDisabled, className: `w-full py-3 px-6 rounded-lg text-white font-semibold transition-colors duration-200 ${startLessonButtonDisabled ? 'bg-blue-300 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`, 'aria-label': "Start selected lesson" },
            isNavigatingToLessonPage ? 'Loading Lesson...' : 'Start Selected Lesson'
          )
        )
      )
    )
  );
};

const App = () => {
  const [currentPage, setCurrentPage] = useState('lessonSelection');
  const [isLoading, setIsLoading] = useState(false);
  const [globalError, setGlobalError] = useState(null);
  const [selectedLanguage, setSelectedLanguage] = useState(localStorage.getItem('germanTutor_language') || AVAILABLE_LANGUAGES[1]);
  const [selectedGermanLevel, setSelectedGermanLevel] = useState(localStorage.getItem('germanTutor_germanLevel') || AVAILABLE_GERMAN_LEVELS[0]);
  const [selectedLessonId, setSelectedLessonId] = useState(localStorage.getItem('germanTutor_lessonId'));
  const [selectedLessonTitle, setSelectedLessonTitle] = useState(localStorage.getItem('germanTutor_lessonTitle'));
  const [selectedLessonDescription, setSelectedLessonDescription] = useState(localStorage.getItem('germanTutor_lessonDescription'));
  const [selectedSubTopicId, setSelectedSubTopicId] = useState(localStorage.getItem('germanTutor_subTopicId'));
  const [selectedSubTopicTitle, setSelectedSubTopicTitle] = useState(localStorage.getItem('germanTutor_subTopicTitle'));
  const [selectedSubTopicDescription, setSelectedSubTopicDescription] = useState(localStorage.getItem('germanTutor_subTopicDescription'));

  const saveTimeoutRef = useRef(null);

  const clearErrors = useCallback(() => {
    setGlobalError(null);
  }, []);

  useEffect(() => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    saveTimeoutRef.current = setTimeout(() => {
      localStorage.setItem('germanTutor_language', selectedLanguage);
      localStorage.setItem('germanTutor_germanLevel', selectedGermanLevel);
      if (selectedLessonId) localStorage.setItem('germanTutor_lessonId', selectedLessonId); else localStorage.removeItem('germanTutor_lessonId');
      if (selectedLessonTitle) localStorage.setItem('germanTutor_lessonTitle', selectedLessonTitle); else localStorage.removeItem('germanTutor_lessonTitle');
      if (selectedLessonDescription) localStorage.setItem('germanTutor_lessonDescription', selectedLessonDescription); else localStorage.removeItem('germanTutor_lessonDescription');
      if (selectedSubTopicId) localStorage.setItem('germanTutor_subTopicId', selectedSubTopicId); else localStorage.removeItem('germanTutor_subTopicId');
      if (selectedSubTopicTitle) localStorage.setItem('germanTutor_subTopicTitle', selectedSubTopicTitle); else localStorage.removeItem('germanTutor_subTopicTitle');
      if (selectedSubTopicDescription) localStorage.setItem('germanTutor_subTopicDescription', selectedSubTopicDescription); else localStorage.removeItem('germanTutor_subTopicDescription');
      console.debug("Saved selections to localStorage.");
    }, 300);
    return () => { if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current); };
  }, [
    selectedLanguage, selectedGermanLevel, selectedLessonId, selectedLessonTitle,
    selectedLessonDescription, selectedSubTopicId, selectedSubTopicTitle,
    selectedSubTopicDescription,
  ]);

  const handleLanguageChange = useCallback((language) => { clearErrors(); setSelectedLanguage(language); setSelectedLessonId(null); setSelectedSubTopicId(null); }, [clearErrors]);
  const handleGermanLevelChange = useCallback((level) => { clearErrors(); setSelectedGermanLevel(level); setSelectedLessonId(null); setSelectedSubTopicId(null); }, [clearErrors]);
  const handleLessonClick = useCallback((lessonId, lessonTitle, lessonDescription) => { clearErrors(); setSelectedLessonId(lessonId); setSelectedLessonTitle(lessonTitle); setSelectedLessonDescription(lessonDescription); setSelectedSubTopicId(null); setSelectedSubTopicTitle(null); setSelectedSubTopicDescription(null); }, [clearErrors]);
  const handleSubTopicChange = useCallback((subTopicId, subTopicTitle, subTopicDescription) => { setSelectedSubTopicId(subTopicId); setSelectedSubTopicTitle(subTopicTitle); setSelectedSubTopicDescription(subTopicDescription); }, []);
  const handleStartLesson = useCallback((...args) => {
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
  const handleStopLesson = useCallback((errorMessage) => {
    if (errorMessage) {
      setGlobalError(errorMessage);
    }
    setCurrentPage('lessonSelection');
  }, []);

  return (
    React.createElement('div', { className: "relative flex flex-col lg:flex-row h-full w-full max-w-6xl mx-auto bg-gray-100 rounded-xl shadow-2xl p-4" },
      currentPage === 'lessonSelection' ? (
        React.createElement('div', { className: "flex flex-col lg:flex-row h-full w-full" },
          React.createElement('div', { className: "lg:w-1/2 p-4 flex flex-col items-center justify-center bg-gray-800 relative text-white" },
            React.createElement('h1', { className: "text-3xl font-bold mb-6 text-center", 'aria-live': "polite" }, "German Language Tutor"),
            React.createElement('p', { className: "text-xl md:text-2xl font-semibold mb-2 text-center" }, "Your personal German teacher"),
            React.createElement('p', { className: "text-lg md:text-xl text-blue-300 text-center mb-4" }, `(explaining in ${selectedLanguage})`),
            React.createElement('p', { className: "text-gray-300 text-sm text-center" }, "ANAYA is ready to help you learn!")
          ),
          React.createElement('div', { className: "lg:w-1/2 flex flex-col bg-white h-full" },
            React.createElement(LessonSelection, {
              isLoading,
              selectedLanguage,
              onLanguageChange: handleLanguageChange,
              selectedGermanLevel,
              onGermanLevelChange: handleGermanLevelChange,
              selectedLessonId,
              selectedSubTopicId,
              onLessonClick,
              onSubTopicChange: handleSubTopicChange,
              onStartLesson: handleStartLesson,
              globalError,
              onClearError: clearErrors,
            })
          )
        )
      ) : (
        React.createElement(LessonPage, { 
          selectedLanguage,
          selectedGermanLevel,
          selectedLessonTitle,
          selectedLessonDescription,
          selectedSubTopicTitle,
          selectedSubTopicDescription,
          onStopLesson: handleStopLesson,
          isLoadingApp: isLoading,
        })
      )
    )
  );
};

// --- RENDER APP (from index.tsx) ---
const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}
const root = ReactDOM.createRoot(rootElement);
root.render(
  React.createElement(React.StrictMode, null, React.createElement(App))
);
