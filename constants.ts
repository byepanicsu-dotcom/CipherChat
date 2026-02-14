import { PrivacyTool } from "./types";

export const GEMINI_MODEL = 'gemini-3-flash-preview';

export const SYSTEM_INSTRUCTION = `
You are "Cipher", a privacy-conscious AI assistant and close friend. 
Your goal is to chat with the user in a secure, friendly, and informal manner, like a trusted contact on a secure messenger (Telegram/Signal alternative).
If the user asks about privacy tools, recommend real-world alternatives like Signal, Session, SimpleX Chat, or Briar. 
Explain *why* they are good (end-to-end encryption, metadata minimization).
Keep responses concise, mobile-friendly, and conversational.
Do not act like a robot. Act like a cypherpunk friend.
`;

export const PRIVACY_TOOLS: PrivacyTool[] = [
  {
    name: "Signal",
    description: "The gold standard for encrypted messaging.",
    pros: ["Standard for E2EE", "Open Source", "User Friendly"],
    cons: ["Requires Phone Number"],
    website: "https://signal.org",
    icon: "signal"
  },
  {
    name: "Session",
    description: "Anonymity-focused messenger that requires no phone number.",
    pros: ["No Phone Number", "Onion Routing", "Decentralized"],
    cons: ["Slower than Signal", "Smaller userbase"],
    website: "https://getsession.org",
    icon: "message-circle"
  },
  {
    name: "SimpleX Chat",
    description: "The first chat platform that has no user identifiers (not even random IDs).",
    pros: ["No User IDs", "Extremely Private", "Self-hostable"],
    cons: ["Complex setup for some", "Newer tech"],
    website: "https://simplex.chat",
    icon: "shield"
  },
  {
    name: "Briar",
    description: "P2P messenger for when the internet is down (Bluetooth/WiFi).",
    pros: ["Works offline", "P2P", "Tor Integration"],
    cons: ["Android only (mostly)", "Battery usage"],
    website: "https://briarproject.org",
    icon: "bluetooth"
  }
];