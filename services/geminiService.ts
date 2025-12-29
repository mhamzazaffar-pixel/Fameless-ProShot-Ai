import { GoogleGenAI } from "@google/genai";

// Initialize the client
// The API key is guaranteed to be in process.env.API_KEY per instructions.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const IMAGE_MODEL_NAME = 'gemini-2.5-flash-image';
const TEXT_MODEL_NAME = 'gemini-3-flash-preview';

/**
 * Generates a creative random prompt for image editing based on specific photo features.
 */
export const generateRandomEditPrompt = async (): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: TEXT_MODEL_NAME,
      contents: `Generate a single short, natural language instruction for editing a photo. 
      The instruction MUST be based on a random combination of 1 to 3 of these specific features:
      Crop, Straighten, Brightness, Contrast, Exposure, Shadows, Highlights, White Balance, Sharpness, Clarity, Vibrance, Saturation, Retouch, Blemish, Smooth, Blur, Background, Vignette, Resize.

      Examples:
      - "Increase brightness and add a vignette."
      - "Smooth the skin and blur the background."
      - "Crop closer to the face and increase clarity."
      - "Fix the white balance to be warmer and sharpen details."
      - "Retouch blemishes and slightly increase saturation."
      
      Return ONLY the instruction text, no quotes.`,
    });
    return response.text?.trim() || "Enhance brightness and contrast.";
  } catch (error) {
    console.error("Gemini Random Prompt Error:", error);
    return "Improve lighting and smooth skin.";
  }
};

/**
 * Generates/Edits an image based on an input image and a text prompt.
 * 
 * @param imageBase64 The base64 string of the source image (without data:image/... prefix)
 * @param prompt The text instruction for the edit/generation
 * @param mimeType The mime type of the input image
 * @param referenceImageBase64 (Optional) Base64 string of a reference style/pose image
 * @param referenceMimeType (Optional) Mime type of the reference image
 * @returns The base64 string of the generated image (without prefix)
 */
export const generateEditedImage = async (
  imageBase64: string,
  prompt: string,
  mimeType: string = 'image/jpeg',
  referenceImageBase64?: string,
  referenceMimeType?: string
): Promise<string> => {
  try {
    const parts: any[] = [
      {
        inlineData: {
          mimeType: mimeType,
          data: imageBase64
        }
      }
    ];

    // If a reference image is provided, add it to the parts
    // The order is important: Input Face Image, Reference Style Image, Text Prompt
    if (referenceImageBase64 && referenceMimeType) {
      parts.push({
        inlineData: {
          mimeType: referenceMimeType,
          data: referenceImageBase64
        }
      });
    }

    parts.push({ text: prompt });

    const response = await ai.models.generateContent({
      model: IMAGE_MODEL_NAME,
      contents: {
        parts: parts
      }
    });

    // Iterate through parts to find the image
    const responseParts = response.candidates?.[0]?.content?.parts;
    
    if (!responseParts) {
      throw new Error("No content generated");
    }

    for (const part of responseParts) {
      if (part.inlineData && part.inlineData.data) {
        return part.inlineData.data;
      }
    }

    // If no image found, check for text to provide a better error
    const textPart = responseParts.find(p => p.text);
    if (textPart) {
      throw new Error(`Model returned text instead of image: ${textPart.text}`);
    }

    throw new Error("Model response did not contain an image.");

  } catch (error) {
    console.error("Gemini Image Generation Error:", error);
    throw error;
  }
};