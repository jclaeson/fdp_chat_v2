import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, jsonb, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const conversations = pgTable("conversations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const messages = pgTable("messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  conversationId: varchar("conversation_id").notNull(),
  role: varchar("role", { length: 20 }).notNull(), // 'user' | 'assistant'
  content: text("content").notNull(),
  sources: jsonb("sources").$type<string[]>(),
  modelUsed: varchar("model_used", { length: 50 }), // 'openai' | 'ollama-rag'
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const scraperRuns = pgTable("scraper_runs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  status: varchar("status", { length: 20 }).notNull(), // 'running' | 'completed' | 'failed'
  documentsFound: integer("documents_found"),
  chunksCreated: integer("chunks_created"),
  startedAt: timestamp("started_at").defaultNow().notNull(),
  completedAt: timestamp("completed_at"),
  errorMessage: text("error_message"),
});

export const systemSettings = pgTable("system_settings", {
  key: varchar("key").primaryKey(),
  value: jsonb("value").notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Insert Schemas
export const insertConversationSchema = createInsertSchema(conversations).omit({
  id: true,
  createdAt: true,
});

export const insertMessageSchema = createInsertSchema(messages).omit({
  id: true,
  createdAt: true,
});

export const insertScraperRunSchema = createInsertSchema(scraperRuns).omit({
  id: true,
  startedAt: true,
});

export const insertSystemSettingSchema = createInsertSchema(systemSettings).omit({
  updatedAt: true,
});

// Types
export type InsertConversation = z.infer<typeof insertConversationSchema>;
export type Conversation = typeof conversations.$inferSelect;

export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type Message = typeof messages.$inferSelect;

export type InsertScraperRun = z.infer<typeof insertScraperRunSchema>;
export type ScraperRun = typeof scraperRuns.$inferSelect;

export type InsertSystemSetting = z.infer<typeof insertSystemSettingSchema>;
export type SystemSetting = typeof systemSettings.$inferSelect;
