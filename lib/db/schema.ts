import { pgTable, uuid, varchar, timestamp, boolean } from 'drizzle-orm/pg-core'

export const users = pgTable('users', {
  userID: uuid('user_id').primaryKey().defaultRandom(),
  firstName: varchar('first_name', { length: 255 }).notNull(),
  lastName: varchar('last_name', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  password: varchar('password', { length: 255 }).notNull(),
  created: timestamp('created').defaultNow().notNull(),
  lastUpdated: timestamp('last_updated').defaultNow().notNull(),
  phoneNumber: varchar('phone_number', { length: 20 }),
  validated: boolean('validated').default(false).notNull(),
})
