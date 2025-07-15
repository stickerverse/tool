
'use server';
/**
 * @fileOverview An AI agent that removes the background from an image.
 *
 * - removeBackground - A function that handles the background removal process.
 * - RemoveBackgroundInput - The input type for the removeBackground function.
 * - RemoveBackgroundOutput - The return type for the removeBackground function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
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
  async input => {
    // STEP 1: Generate the segmentation mask using Gemini Vision
    const {media: maskMedia, finishReason: maskFinishReason} = await ai.generate({
      model: 'googleai/gemini-1.5-flash-latest',
      prompt: [
        {text: `**Do not generate a new image.** You must only edit the provided image. Analyze the following image and identify the main subject(s). Generate a precise, black and white segmentation mask. The subject(s) should be solid white. The background should be solid black. Do not add any other text, explanation, or formatting. The output must be the image mask only.`},
        {media: {url: input.photoDataUri}}
      ],
      config: { 
        responseModalities: ['IMAGE'],
        safetySettings: [
          {
            category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
            threshold: 'BLOCK_ONLY_HIGH',
          },
        ],
      },
    });

    const maskBase64 = maskMedia?.url?.split(';base64,').pop();

    if (!maskBase64) {
      throw new Error(`Failed to generate a valid segmentation mask from the AI model. Finish Reason: ${maskFinishReason}`);
    }

    // STEP 2: Apply the mask to the original image using Sharp
    const originalImageBase64 = input.photoDataUri.split(';base64,').pop();
    if (!originalImageBase64) {
      throw new Error('Invalid input image data URI.');
    }
    
    try {
      const originalImageBuffer = Buffer.from(originalImageBase64, 'base64');
      const maskImageBuffer = Buffer.from(maskBase64, 'base64');

      const finalImageBuffer = await sharp(originalImageBuffer)
        .composite([
          {
            input: maskImageBuffer,
            blend: 'dest-in',
          },
        ])
        .toFormat('png')
        .toBuffer();

      const finalImageDataUri = `data:image/png;base64,${finalImageBuffer.toString('base64')}`;

      return { removedBackgroundDataUri: finalImageDataUri };
    } catch (error) {
      console.error('Error during image processing with Sharp:', error);
      throw new Error('Failed to apply the mask to the original image.');
    }
  }
);
