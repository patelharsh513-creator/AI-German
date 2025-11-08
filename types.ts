import { LiveServerMessage, FunctionCall } from '@google/genai';

export enum MessageRole {
  USER = 'user',
  MODEL = 'model',
  INFO = 'info',
  ERROR = 'error',
}

export interface ChatMessage {
  id: string;
  role: MessageRole;
  text?: string;
  audio?: HTMLAudioElement;
  toolCalls?: FunctionCall[];
}

export interface LiveSessionCallbacks {
  onMessage: (message: LiveServerMessage) => Promise<void>;
  onError: (error: ErrorEvent) => void;
  onClose: (event: CloseEvent) => void;
  onOpen: () => void;
  onModelSpeaking: (speaking: boolean) => void; // Added for visual feedback
}

export interface StreamData {
  media: { data: string; mimeType: string };
}

export interface SubTopic {
  id: string;
  title: string;
  description: string;
}

export interface Lesson {
  id: string;
  title: string;
  description: string;
  subTopics?: SubTopic[]; // Lessons can now have sub-topics
}
