import { db } from "../db";
import { 
  conversations, 
  messages, 
  scraperRuns, 
  systemSettings,
  type Conversation,
  type InsertConversation,
  type Message,
  type InsertMessage,
  type ScraperRun,
  type InsertScraperRun,
  type SystemSetting,
  type InsertSystemSetting
} from "@shared/schema";
import { eq, desc } from "drizzle-orm";

export interface IStorage {
  // Conversations
  createConversation(conversation: InsertConversation): Promise<Conversation>;
  getConversation(id: string): Promise<Conversation | undefined>;
  getRecentConversations(limit?: number): Promise<Conversation[]>;
  
  // Messages
  createMessage(message: InsertMessage): Promise<Message>;
  getMessagesByConversation(conversationId: string): Promise<Message[]>;
  
  // Scraper Runs
  createScraperRun(run: InsertScraperRun): Promise<ScraperRun>;
  updateScraperRun(id: string, updates: Partial<ScraperRun>): Promise<ScraperRun | undefined>;
  getLatestScraperRun(): Promise<ScraperRun | undefined>;
  getScraperRuns(limit?: number): Promise<ScraperRun[]>;
  
  // System Settings
  getSetting(key: string): Promise<SystemSetting | undefined>;
  setSetting(setting: InsertSystemSetting): Promise<SystemSetting>;
}

export class DbStorage implements IStorage {
  // Conversations
  async createConversation(conversation: InsertConversation): Promise<Conversation> {
    const [result] = await db.insert(conversations).values(conversation).returning();
    return result;
  }

  async getConversation(id: string): Promise<Conversation | undefined> {
    const [result] = await db.select().from(conversations).where(eq(conversations.id, id));
    return result;
  }

  async getRecentConversations(limit = 10): Promise<Conversation[]> {
    return db.select().from(conversations).orderBy(desc(conversations.createdAt)).limit(limit);
  }

  // Messages
  async createMessage(message: InsertMessage): Promise<Message> {
    const messageData = {
      ...message,
      sources: message.sources as any, // Type assertion for JSONB
    };
    const [result] = await db.insert(messages).values(messageData).returning();
    return result;
  }

  async getMessagesByConversation(conversationId: string): Promise<Message[]> {
    return db.select().from(messages)
      .where(eq(messages.conversationId, conversationId))
      .orderBy(messages.createdAt);
  }

  // Scraper Runs
  async createScraperRun(run: InsertScraperRun): Promise<ScraperRun> {
    const [result] = await db.insert(scraperRuns).values(run).returning();
    return result;
  }

  async updateScraperRun(id: string, updates: Partial<ScraperRun>): Promise<ScraperRun | undefined> {
    const [result] = await db.update(scraperRuns)
      .set(updates)
      .where(eq(scraperRuns.id, id))
      .returning();
    return result;
  }

  async getLatestScraperRun(): Promise<ScraperRun | undefined> {
    const [result] = await db.select().from(scraperRuns).orderBy(desc(scraperRuns.startedAt)).limit(1);
    return result;
  }

  async getScraperRuns(limit = 10): Promise<ScraperRun[]> {
    return db.select().from(scraperRuns).orderBy(desc(scraperRuns.startedAt)).limit(limit);
  }

  // System Settings
  async getSetting(key: string): Promise<SystemSetting | undefined> {
    const [result] = await db.select().from(systemSettings).where(eq(systemSettings.key, key));
    return result;
  }

  async setSetting(setting: InsertSystemSetting): Promise<SystemSetting> {
    const [result] = await db
      .insert(systemSettings)
      .values(setting)
      .onConflictDoUpdate({
        target: systemSettings.key,
        set: { value: setting.value, updatedAt: new Date() }
      })
      .returning();
    return result;
  }
}

export const storage = new DbStorage();
