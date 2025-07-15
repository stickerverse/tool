
'use server';

import { removeBackground, type RemoveBackgroundInput } from '@/ai/flows/remove-background';
import { cropImage, type CropImageInput } from '@/ai/flows/crop-image';
import { generateQrCode, type GenerateQrCodeInput } from '@/ai/flows/generate-qr-code';
import { generateClipart as generateClipartFlow, type GenerateClipartInput } from '@/ai/flows/generate-clipart';
import { addBorderToImage, type AddBorderInput } from '@/ai/flows/add-border';
import { z } from 'zod';

export async function removeImageBackground(
  input: RemoveBackgroundInput
): Promise<{ removedBackgroundDataUri: string } | { error: string }> {
  try {
    const RemoveBackgroundInputSchema = z.object({
        photoDataUri: z.string().min(1, "Image data URI cannot be empty."),
    });
    
    const validatedInput = RemoveBackgroundInputSchema.parse(input);
    const result = await removeBackground(validatedInput);
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

export async function generateClipart(
  input: GenerateClipartInput
): Promise<{ imageDataUri: string } | { error: string }> {
  try {
    const GenerateClipartInputSchema = z.object({
      prompt: z.string().min(1, 'Prompt cannot be empty.'),
    });

    const validatedInput = GenerateClipartInputSchema.parse(input);
    const result = await generateClipartFlow(validatedInput);
    return result;
  } catch (e) {
    console.error(e);
    const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred.';
    return { error: `Failed to generate clipart: ${errorMessage}` };
  }
}

export async function addBorder(
  input: AddBorderInput
): Promise<{ borderedImageDataUri: string } | { error: string }> {
  try {
    const AddBorderInputSchema = z.object({
        photoDataUri: z.string().min(1, "Image data URI cannot be empty."),
        borderColor: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Invalid hex color format."),
        borderWidth: z.number().min(1).max(20),
    });

    const validatedInput = AddBorderInputSchema.parse(input);
    const result = await addBorderToImage(validatedInput);
    return result;
  } catch (e) {
    console.error(e);
    const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred.';
    return { error: `Failed to add border: ${errorMessage}` };
  }
}
