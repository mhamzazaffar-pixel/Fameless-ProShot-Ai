export interface GeneratedImage {
  id: string;
  url: string;
  prompt: string;
  timestamp: number;
}

export enum HeadshotStyle {
  CORPORATE = 'Corporate Grey',
  STARTUP = 'Modern Startup',
  OUTDOOR = 'Outdoor Natural',
  STUDIO = 'Studio Dark',
  CREATIVE = 'Creative Color',
  CUSTOM = 'Custom Edit',
  FACE_SWAP = 'Face Swap'
}

export interface StyleOption {
  id: HeadshotStyle;
  label: string;
  description: string;
  promptSuffix: string;
  icon: string;
}