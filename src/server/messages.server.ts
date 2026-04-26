/**
 * Messages inbox storage. Lives in the PRIVATE R2 bucket — never exposed
 * via the public CDN domain. Read/write through server functions only.
 */
import { privateBucket, readJsonFrom, writeJsonTo } from "./r2.server";

export const MESSAGES_KEY = "inbox/messages.json";

export type Message = {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  subject?: string | null;
  message: string;
  is_read: boolean;
  is_replied: boolean;
  created_at: string; // ISO
};

export async function readMessages(): Promise<Message[]> {
  const data = await readJsonFrom<Message[]>(privateBucket(), MESSAGES_KEY);
  return Array.isArray(data) ? data : [];
}

export async function writeMessages(list: Message[]): Promise<void> {
  await writeJsonTo(privateBucket(), MESSAGES_KEY, list);
}
