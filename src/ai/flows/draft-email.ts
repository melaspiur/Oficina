// This file is machine-generated - edit with care!
'use server';
/**
 * @fileOverview A flow for generating email drafts based on a topic, recipient, and context.
 *
 * - draftEmail - A function that handles the email draft generation process.
 * - DraftEmailInput - The input type for the draftEmail function.
 * - DraftEmailOutput - The return type for the draftEmail function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const DraftEmailInputSchema = z.object({
  topic: z.string().describe('The topic of the email.'),
  recipient: z.string().describe('The recipient of the email.'),
  context: z.string().describe('The context or main content of the email.'),
});
export type DraftEmailInput = z.infer<typeof DraftEmailInputSchema>;

const DraftEmailOutputSchema = z.object({
  emailDraft: z.string().describe('The generated email draft.'),
});
export type DraftEmailOutput = z.infer<typeof DraftEmailOutputSchema>;

export async function draftEmail(input: DraftEmailInput): Promise<DraftEmailOutput> {
  return draftEmailFlow(input);
}

const prompt = ai.definePrompt({
  name: 'draftEmailPrompt',
  input: {schema: DraftEmailInputSchema},
  output: {schema: DraftEmailOutputSchema},
  prompt: `You are an AI email assistant. Your task is to generate an email draft based on the provided topic, recipient, and context.

  Topic: {{{topic}}}
  Recipient: {{{recipient}}}
  Context: {{{context}}}

  Please generate a complete email draft that is ready to be sent.
  `, // Ensure the prompt is properly formatted and includes all necessary information.
});

const draftEmailFlow = ai.defineFlow(
  {
    name: 'draftEmailFlow',
    inputSchema: DraftEmailInputSchema,
    outputSchema: DraftEmailOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
