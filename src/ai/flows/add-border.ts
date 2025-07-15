
'use server';
/**
 * @fileOverview An AI agent that adds a sticker-style border to an image that already has a transparent background.
 *
 * - addBorderToImage - A function that handles adding a border to an image.
 * - AddBorderInput - The input type for the addBorderToImage function.
 * - AddBorderOutput - The return type for the addBorderToImage function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AddBorderInputSchema = z.object({
  photoDataUri: z
    .string()
    .describe(
      "A photo of an image with a transparent background to which a border will be added, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
    borderColor: z.string().describe("The color of the border as a hex code, e.g., #FFFFFF."),
    borderWidth: z.number().min(1).max(20).describe("The width of the border in pixels."),
});
export type AddBorderInput = z.infer<typeof AddBorderInputSchema>;

const AddBorderOutputSchema = z.object({
  borderedImageDataUri: z
    .string()
    .describe(
      'A data URI of the image with the border, that must include a MIME type and use Base64 encoding. Expected format: data:<mimetype>;base64,<encoded_data>.'
    ),
});
export type AddBorderOutput = z.infer<typeof AddBorderOutputSchema>;

export async function addBorderToImage(input: AddBorderInput): Promise<AddBorderOutput> {
  return addBorderFlow(input);
}

const addBorderFlow = ai.defineFlow(
  {
    name: 'addBorderFlow',
    inputSchema: AddBorderInputSchema,
    outputSchema: AddBorderOutputSchema,
  },
  async (input) => {
    const {media, finishReason} = await ai.generate({
      prompt: [
        {media: {url: input.photoDataUri}},
        {text: `Add a solid, sticker-style border that follows the exact contour of the subject in the provided image. The image already has a transparent background. The border should be ${input.borderWidth} pixels wide and have the color ${input.borderColor}. The final output must be a PNG image with only the subject and its new border visible on a transparent background.`},
      ],
      model: 'googleai/gemini-2.0-flash-preview-image-generation',
      config: {
        responseModalities: ['TEXT', 'IMAGE'],
        safetySettings: [
          {
            category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
            threshold: 'BLOCK_ONLY_HIGH',
          },
        ],
      },
    });

    if (!media?.url) {
      throw new Error(`The AI model failed to generate an image. Finish Reason: ${finishReason}`);
    }

    return {borderedImageDataUri: media.url};
  }
);
