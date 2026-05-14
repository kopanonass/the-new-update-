import { pgTable, text, timestamp, serial } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  uid: text('uid').unique().notNull(), // local ID
  name: text('name').notNull(),
  surname: text('surname').notNull(),
  idNumber: text('id_number').notNull(),
  studentNumber: text('student_number').notNull(),
  email: text('email').notNull().unique(),
  password: text('password').notNull(), // Hashed
  emailVerified: text('email_verified').default('false').notNull(), // As string 'true'/'false' for simplicity or boolean
  avatarUrl: text('avatar_url'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const chats = pgTable('chats', {
  id: text('id').primaryKey(), // We can use UUID or custom IDs
  userId: text('user_id').references(() => users.uid).notNull(),
  title: text('title').notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const messages = pgTable('messages', {
  id: serial('id').primaryKey(),
  chatId: text('chat_id').references(() => chats.id).notNull(),
  role: text('role').notNull(), // 'user' or 'model'
  content: text('content').notNull(),
  image: text('image'),
  action: text('action'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
