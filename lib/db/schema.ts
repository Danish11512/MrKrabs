import { pgTable, uuid, varchar, timestamp, boolean, integer, text, index } from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'

export const users = pgTable('users', {
  userID: uuid('user_id').primaryKey().defaultRandom(),
  firstName: varchar('first_name', { length: 255 }).notNull(),
  lastName: varchar('last_name', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  password: varchar('password', { length: 255 }).notNull(),
  created: timestamp('created').defaultNow().notNull(),
  lastUpdated: timestamp('last_updated').defaultNow().notNull(),
  phoneNumber: varchar('phone_number', { length: 20 }),
})

export const dashboardLayouts = pgTable('dashboard_layouts', {
  layoutId: uuid('layout_id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.userID, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  userIdIdx: index('dashboard_layouts_user_id_idx').on(table.userId),
}))

export const dashboardGridItems = pgTable('dashboard_grid_items', {
  itemId: uuid('item_id').primaryKey().defaultRandom(),
  layoutId: uuid('layout_id').notNull().references(() => dashboardLayouts.layoutId, { onDelete: 'cascade' }),
  itemKey: varchar('item_key', { length: 255 }).notNull(),
  x: integer('x').notNull(),
  y: integer('y').notNull(),
  w: integer('w').notNull(),
  h: integer('h').notNull(),
  static: boolean('static').notNull().default(false),
  itemType: varchar('item_type', { length: 255 }).notNull(),
  content: text('content').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  layoutIdIdx: index('dashboard_grid_items_layout_id_idx').on(table.layoutId),
}))

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  dashboardLayouts: many(dashboardLayouts),
}))

export const dashboardLayoutsRelations = relations(dashboardLayouts, ({ one, many }) => ({
  user: one(users, {
    fields: [dashboardLayouts.userId],
    references: [users.userID],
  }),
  gridItems: many(dashboardGridItems),
}))

export const dashboardGridItemsRelations = relations(dashboardGridItems, ({ one }) => ({
  layout: one(dashboardLayouts, {
    fields: [dashboardGridItems.layoutId],
    references: [dashboardLayouts.layoutId],
  }),
}))
