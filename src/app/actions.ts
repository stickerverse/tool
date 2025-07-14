
'use server';

import { removeBackground, type RemoveBackgroundInput } from '@/ai/flows/remove-background';
import { cropImage, type CropImageInput } from '@/ai/flows/crop-image';
import { generateTextImage, type GenerateTextImageInput } from '@/ai/flows/generate-text-image';
import { generateQrCode, type GenerateQrCodeInput } from '@/ai/flows/generate-qr-code';
import { z } from 'zod';

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
      const CropImageInputSchema = z.object({
        photoDataUri: z
          .string()
          .describe(
            "A photo of an image to be cropped, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
          ),
        shape: z.enum(['star', 'circle', 'heart', 'square']).describe('The shape to crop the image into.'),
      });

      const validatedInput = CropImageInputSchema.parse(input);
      const result = await cropImage(validatedInput);
      return result;
    } catch (e) {
      console.error(e);
      const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred.';
      return { error: `Failed to crop image: ${errorMessage}` };
    }
}

export async function addTextToImage(
  input: GenerateTextImageInput
): Promise<{ imageDataUri: string } | { error: string }> {
  try {
    const GenerateTextImageInputSchema = z.object({
      text: z.string().min(1, 'Text cannot be empty.'),
    });

    const validatedInput = GenerateTextImageInputSchema.parse(input);
    const result = await generateTextImage(validatedInput);
    return result;
  } catch (e) {
    console.error(e);
    const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred.';
    return { error: `Failed to generate text image: ${errorMessage}` };
  }
}

export async function createQrCode(
  input: GenerateQrCodeInput
): Promise<{ imageDataUri: string } | { error: string }> {
  try {
    const GenerateQrCodeInputSchema = z.object({
      text: z.string().min(1, 'Input cannot be empty.'),
    });

    const validatedInput = GenerateQrCodeInputSchema.parse(input);
    const result = await generateQrCode(validatedInput);
    return result;
  } catch (e) {
    console.error(e);
    const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred.';
    return { error: `Failed to generate QR code: ${errorMessage}` };
  }
}
