
'use server';

import { removeBackground, type RemoveBackgroundInput } from '@/ai/flows/remove-background';

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
