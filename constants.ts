import { HeadshotStyle, StyleOption } from './types';

export const HEADSHOT_STYLES: StyleOption[] = [
  {
    id: HeadshotStyle.CORPORATE,
    label: "Corporate",
    description: "Professional grey backdrop, suit/business attire, soft studio lighting.",
    promptSuffix: "Transform this person into a professional corporate headshot. Grey studio background, business attire, high quality, photorealistic, sharp focus.",
    icon: "🏢"
  },
  {
    id: HeadshotStyle.STARTUP,
    label: "Tech / Startup",
    description: "Modern office bokeh, smart casual, approachable and bright.",
    promptSuffix: "Transform this person into a modern tech worker headshot. Blurred modern open-plan office background, smart casual clothing, bright friendly lighting.",
    icon: "💻"
  },
  {
    id: HeadshotStyle.OUTDOOR,
    label: "Outdoor",
    description: "Natural light, park or city background, relaxed professional.",
    promptSuffix: "Transform this person into a professional outdoor headshot. Soft natural lighting, blurred nature or city background, relaxed but professional look.",
    icon: "🌳"
  },
  {
    id: HeadshotStyle.STUDIO,
    label: "Dark Studio",
    description: "Dramatic lighting, black or dark textured background.",
    promptSuffix: "Transform this person into a dramatic studio headshot. Black or dark textured background, rim lighting, high contrast, professional portrait.",
    icon: "📸"
  }
];