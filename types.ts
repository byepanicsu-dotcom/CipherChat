export interface Attachment {
  type: 'image' | 'video' | 'file';
  url: string;
  mimeType?: string;
  data?: string; // base64 for API
  fileName?: string;
  fileSize?: string;
}

export interface UserProfile {
  username: string;
  avatarUrl: string; // can be blob url or remote url
}

export interface Contact {
    id: string; // Peer ID
    name: string;
    addedAt: number;
}

export interface Message {
  id: string;
  text: string;
  sender: 'user' | 'ai' | 'system';
  timestamp: Date;
  isEncrypted?: boolean;
  senderProfile?: UserProfile;
  attachments?: Attachment[];
}

export interface AppConfig {
  username: string;
  theme: 'dark' | 'light'; 
}

export interface PrivacyTool {
  name: string;
  description: string;
  pros: string[];
  cons: string[];
  website: string;
  icon: string;
}

export enum NavView {
  CHAT = 'CHAT',
  TOOLS = 'TOOLS',
  ENCRYPTION = 'ENCRYPTION',
  PROFILE = 'PROFILE'
}