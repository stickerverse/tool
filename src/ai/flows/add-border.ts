
'use server';
/**
 * @fileOverview A utility that adds a border to an image with a transparent background.
 *
 * - addBorderToImage - A function that handles adding a border to an image.
 * - AddBorderInput - The input type for the addBorderToImage function.
 * - AddBorderOutput - The return type for the addBorderToImage function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'zod';
import sharp from 'sharp';


const AddBorderInputSchema = z.object({
  photoDataUri: z
    .string()
    .describe(
      "A base64 data URI of the transparent PNG image to which a border will be added. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
    borderColor: z.string().describe("The color of the border as a hex code, e.g., #FFFFFF."),
    borderWidth: z.number().min(1).max(50).describe("The width of the border in pixels."),
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
    const { photoDataUri, borderColor, borderWidth } = input;
    
    // This flow uses Sharp directly, no AI needed!
    const imageBase64 = photoDataUri.split(',')[1];
    const imageBuffer = Buffer.from(imageBase64, 'base64');

    // Use sharp.extend() to add a border around the image.
    const borderedImageBuffer = await sharp(imageBuffer)
        .extend({
            top: borderWidth,
            bottom: borderWidth,
            left: borderWidth,
            right: borderWidth,
            background: borderColor,
        })
        .toFormat('png')
        .toBuffer();

    const borderedImageDataUri = `data:image/png;base64,${borderedImageBuffer.toString('base64')}`;

    return { borderedImageDataUri };
  }
);
