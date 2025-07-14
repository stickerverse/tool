
'use server';
/**
 * @fileOverview An AI agent that generates clipart from a text prompt.
 *
 * - generateClipart - A function that handles the clipart generation.
 * - GenerateClipartInput - The input type for the generateClipart function.
 * - GenerateClipartOutput - The return type for the generateClipart function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateClipartInputSchema = z.object({
  prompt: z.string().describe('The text prompt to generate clipart from.'),
});
export type GenerateClipartInput = z.infer<typeof GenerateClipartInputSchema>;

const GenerateClipartOutputSchema = z.object({
  imageDataUri: z
    .string()
    .describe(
      'A data URI of the generated image, that must include a MIME type and use Base64 encoding. Expected format: data:<mimetype>;base64,<encoded_data>.'
    ),
});
export type GenerateClipartOutput = z.infer<typeof GenerateClipartOutputSchema>;

export async function generateClipart(input: GenerateClipartInput): Promise<GenerateClipartOutput> {
  return generateClipartFlow(input);
}

const generateClipartFlow = ai.defineFlow(
  {
    name: 'generateClipartFlow',
    inputSchema: GenerateClipartInputSchema,
    outputSchema: GenerateClipartOutputSchema,
  },
  async (input) => {
    const {media} = await ai.generate({
      prompt: [
        {text: `Generate a high-quality, simple clipart image of a ${input.prompt}. The image should have a transparent background and be suitable for a sticker.`},
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
