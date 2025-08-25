'use server';

import { draftEmail, DraftEmailInput } from '@/ai/flows/draft-email';
import { suggestTasks, SuggestTasksInput } from '@/ai/flows/suggest-tasks';

export async function suggestTasksAction(input: SuggestTasksInput) {
  return await suggestTasks(input);
}

export async function draftEmailAction(input: DraftEmailInput) {
  return await draftEmail(input);
}
