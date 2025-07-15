
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
    // Step 0: Extract the Base64 data and MIME type from the data URI.
    const parts = input.photoDataUri.match(/^data:(image\/\w+);base64,(.*)$/);
    if (!parts) {
      throw new Error('Invalid photoDataUri format.');
    }
    const mimeType = parts[1]; // e.g., "image/png"
    const originalImageBase64 = parts[2];

    // Step 1: Use the AI to generate a PRECISE black and white mask.
    const response = await ai.generate({
      prompt: [
        {text: `TASK: Generate a binary segmentation mask.
      INPUT: An image.
      OUTPUT: A pure black and white mask image.
      RULES:
      1.  The primary subject MUST be solid white (#FFFFFF).
      2.  The background MUST be solid black (#000000).
      3.  The output MUST be only the image. NO text, NO explanations, NO additional content.
      4.  The mask must be precise.`},
        {media: {data: originalImageBase64, mimeType: mimeType}},
      ],
      model: 'googleai/gemini-1.5-flash-latest',
      
      output: {
        format: 'media',
        mimeType: 'image/png' // We want the mask as a PNG
      },

      config: {
        safetySettings: [
            {
              category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
              threshold: 'BLOCK_NONE',
            },
            {
              category: 'HARM_CATEGORY_HARASSMENT',
              threshold: 'BLOCK_NONE',
            },
            {
                category: 'HARM_CATEGORY_HATE_SPEECH',
                threshold: 'BLOCK_NONE',
            },
            {
                category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
                threshold: 'BLOCK_NONE',
            },
        ],
      }
    });

    const media = response.media;
    const finishReason = response.finishReason;

    if (!media?.data) {
      const textResponse = response.text;
      throw new Error(`AI failed to generate a valid segmentation mask. Finish Reason: ${finishReason}. AI Text Response: "${textResponse}"`);
    }
    const maskBase64 = media.data;
    
    // Step 2: Use Sharp to apply the mask.
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
