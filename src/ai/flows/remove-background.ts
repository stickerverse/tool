
'use server';
/**
 * @fileOverview An AI agent that removes the background from an image.
 *
 * - removeBackground - A function that handles the background removal process.
 * - RemoveBackgroundInput - The input type for the removeBackground function.
 * - RemoveBackgroundOutput - The return type for the removeBackground function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'zod';
import sharp from 'sharp';

const RemoveBackgroundInputSchema = z.object({
  photoDataUri: z
    .string()
    .describe(
      "A photo of an image whose background will be removed, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type RemoveBackgroundInput = z.infer<typeof RemoveBackgroundInputSchema>;

const RemoveBackgroundOutputSchema = z.object({
  removedBackgroundDataUri: z
    .string()
    .describe(
      'A data URI of the image with the background removed, that must include a MIME type and use Base64 encoding. Expected format: data:<mimetype>;base64,<encoded_data>.'
    ),
});
export type RemoveBackgroundOutput = z.infer<typeof RemoveBackgroundOutputSchema>;

export async function removeBackground(input: RemoveBackgroundInput): Promise<RemoveBackgroundOutput> {
  return removeBackgroundFlow(input);
}

const removeBackgroundFlow = ai.defineFlow(
  {
    name: 'removeBackgroundFlow',
    inputSchema: RemoveBackgroundInputSchema,
    outputSchema: RemoveBackgroundOutputSchema,
  },
  async (input) => {
    // Step 1: Use the AI to generate a PRECISE black and white mask.
    const {media, finishReason} = await ai.generate({
      prompt: `Technical Task: Generate a binary segmentation mask. The output MUST be a non-creative, technical mask image with only two colors.
- The primary subject's pixels MUST be solid white (RGB 255, 255, 255).
- All other pixels MUST be solid black (RGB 0, 0, 0).
- DO NOT add any other colors or effects.`,
      model: 'googleai/gemini-1.5-flash-latest',
      input: [
        {media: {url: input.photoDataUri}},
      ],
      config: {
        responseModalities: ['IMAGE', 'TEXT'],
      },
    });

    if (!media?.url) {
      throw new Error(`AI failed to generate a valid segmentation mask. Finish Reason: ${finishReason}`);
    }
    const maskBase64 = media.url.split(',')[1];
    
    // Step 2: Use Sharp to apply the mask.
    const originalImageBase64 = input.photoDataUri.split(',')[1];
    const originalImageBuffer = Buffer.from(originalImageBase64, 'base64');
    const maskImageBuffer = Buffer.from(maskBase64, 'base64');

    const finalImageBuffer = await sharp(originalImageBuffer)
        .composite([{ input: maskImageBuffer, blend: 'dest-in' }])
        .toFormat('png')
        .toBuffer();

    const finalImageDataUri = `data:image/png;base64,${finalImageBuffer.toString('base64')}`;

    return { removedBackgroundDataUri: finalImageDataUri };
  }
);
