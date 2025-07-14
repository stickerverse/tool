'use server';
/**
 * @fileOverview An AI agent that generates an image from text.
 *
 * - generateTextImage - A function that handles the text-to-image generation.
 * - GenerateTextImageInput - The input type for the generateTextImage function.
 * - GenerateTextImageOutput - The return type for the generateTextImage function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateTextImageInputSchema = z.object({
  text: z.string().describe('The text to render in the image.'),
});
export type GenerateTextImageInput = z.infer<typeof GenerateTextImageInputSchema>;

const GenerateTextImageOutputSchema = z.object({
  imageDataUri: z
    .string()
    .describe(
      'A data URI of the generated image, that must include a MIME type and use Base64 encoding. Expected format: data:<mimetype>;base64,<encoded_data>.'
    ),
});
export type GenerateTextImageOutput = z.infer<typeof GenerateTextImageOutputSchema>;

export async function generateTextImage(input: GenerateTextImageInput): Promise<GenerateTextImageOutput> {
  return generateTextImageFlow(input);
}

const generateTextImageFlow = ai.defineFlow(
  {
    name: 'generateTextImageFlow',
    inputSchema: GenerateTextImageInputSchema,
    outputSchema: GenerateTextImageOutputSchema,
  },
  async (input) => {
    const {media} = await ai.generate({
      prompt: [
        {text: `Generate a high-resolution image of the text "${input.text}". The text should be white with a transparent background. The text should be clearly readable.`},
      ],
      model: 'googleai/gemini-2.0-flash-preview-image-generation',
      config: {
        responseModalities: ['TEXT', 'IMAGE'],
      },
    });

    if (!media?.url) {
        throw new Error("The AI model did not return an image.");
    }

    return {imageDataUri: media.url};
  }
);
