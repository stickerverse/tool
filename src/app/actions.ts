
'use server';

import { removeBackground, type RemoveBackgroundInput } from '@/ai/flows/remove-background';
import { cropImage, type CropImageInput } from '@/ai/flows/crop-image';
import { z } from 'zod';


export const CropImageInputSchema = z.object({
  photoDataUri: z
    .string()
    .describe(
      "A photo of an image to be cropped, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  shape: z.enum(['star', 'circle', 'heart', 'square']).describe('The shape to crop the image into.'),
});

export async function removeImageBackground(
  input: RemoveBackgroundInput
): Promise<{ removedBackgroundDataUri: string } | { error: string }> {
  try {
    const result = await removeBackground(input);
    return result;
  } catch (e) {
    console.error(e);
    const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred.';
    return { error: `Failed to remove background: ${errorMessage}` };
  }
}

export async function cropImageToShape(
    input: CropImageInput
  ): Promise<{ croppedImageDataUri: string } | { error: string }> {
    try {
      // We can validate here before calling the flow
      const validatedInput = CropImageInputSchema.parse(input);
      const result = await cropImage(validatedInput);
      return result;
    } catch (e) {
      console.error(e);
      const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred.';
      return { error: `Failed to crop image: ${errorMessage}` };
    }
}
