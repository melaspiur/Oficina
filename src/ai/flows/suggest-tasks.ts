// This file uses server-side code.
'use server';

/**
 * @fileOverview This file defines a Genkit flow for suggesting tasks to the user.
 *
 * - suggestTasks - A function that suggests tasks based on user preferences and schedule.
 * - SuggestTasksInput - The input type for the suggestTasks function.
 * - SuggestTasksOutput - The return type for the suggestTasks function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestTasksInputSchema = z.object({
  userPreferences: z
    .string()
    .describe('The user preferences for tasks, such as interests and skills.'),
  userSchedule: z
    .string()
    .describe(
      'The user schedule, including available time slots and upcoming meetings.'
    ),
});
export type SuggestTasksInput = z.infer<typeof SuggestTasksInputSchema>;

const SuggestTasksOutputSchema = z.object({
  suggestedTasks: z
    .array(z.string())
    .describe('A list of suggested tasks the user can do now.'),
});
export type SuggestTasksOutput = z.infer<typeof SuggestTasksOutputSchema>;

export async function suggestTasks(input: SuggestTasksInput): Promise<SuggestTasksOutput> {
  return suggestTasksFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestTasksPrompt',
  input: {schema: SuggestTasksInputSchema},
  output: {schema: SuggestTasksOutputSchema},
  prompt: `You are a personal assistant helping the user to be more productive.

You will suggest tasks to the user that they can do now, based on their preferences and schedule.

User Preferences: {{{userPreferences}}}
User Schedule: {{{userSchedule}}}

Tasks:`,
});

const suggestTasksFlow = ai.defineFlow(
  {
    name: 'suggestTasksFlow',
    inputSchema: SuggestTasksInputSchema,
    outputSchema: SuggestTasksOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
