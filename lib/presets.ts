export interface LightingPreset {
  name: string;
  prompt: string;
  description: string;
}

export const lightingPresets: Record<string, LightingPreset> = {
  none: {
    name: "None",
    prompt: "",
    description: "No lighting preset applied"
  },
  studio: {
    name: "Studio",
    prompt: "professional studio lighting, clean minimalist cyclorama background, softbox fill, 8k resolution, sharp focus, commercial photography aesthetic",
    description: "Clean professional studio setup"
  },
  outdoor: {
    name: "Outdoor/Natural",
    prompt: "natural golden hour sunlight, soft lens flare, outdoor lifestyle setting, realistic depth of field, 35mm lens style",
    description: "Natural outdoor lighting"
  },
  ecommerce: {
    name: "E-commerce",
    prompt: "pure white background, high-contrast rim lighting to define edges, product-focused, shadow-less background, sharp details",
    description: "Clean white background for product shots"
  },
  moody: {
    name: "Moody/Dramatic",
    prompt: "dramatic low-key lighting, deep shadows, high contrast, cinematic mood, selective focus, artistic lighting",
    description: "Dramatic mood lighting"
  }
};




