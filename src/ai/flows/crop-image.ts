
'use server';
/**
 * @fileOverview An AI agent that crops an image based on a shape.
 *
 * - cropImage - A function that handles the image cropping process.
 * - CropImageInput - The input type for the cropImage function.
 * - CropImageOutput - The return type for the cropImage function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const CropImageInputSchema = z.object({
  photoDataUri: z
    .string()
    .describe(
      "A photo of an image to be cropped, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  shape: z.enum(['star', 'circle', 'heart', 'square']).describe('The shape to crop the image into.'),
});
export type CropImageInput = z.infer<typeof CropImageInputSchema>;

const CropImageOutputSchema = z.object({
  croppedImageDataUri: z
    .string()
    .describe(
      'A data URI of the cropped image, that must include a MIME type and use Base64 encoding. Expected format: data:<mimetype>;base64,<encoded_data>.'
    ),
});
export type CropImageOutput = z.infer<typeof CropImageOutputSchema>;

export async function cropImage(input: CropImageInput): Promise<CropImageOutput> {
  return cropImageFlow(input);
}

const cropImageFlow = ai.defineFlow(
  {
    name: 'cropImageFlow',
    inputSchema: CropImageInputSchema,
    outputSchema: CropImageOutputSchema,
  },
  async (input) => {
    const {media, finishReason} = await ai.generate({
      prompt: [
        {media: {url: input.photoDataUri}},
        {text: `**Do not generate a new image.** You must only edit the provided image. Crop this image into a ${input.shape} shape. The object in the image should be centered within the shape. The final image should have a transparent background.`},
      ],
      model: 'googleai/gemini-2.0-flash-preview-image-generation',
      config: {
        responseModalities: ['TEXT', 'IMAGE'],
      },
    });

    if (!media?.url) {
        throw new Error(`The AI model did not return an image. Finish Reason: ${finishReason}`);
    }

    return {croppedImageDataUri: media.url};
  }
);
