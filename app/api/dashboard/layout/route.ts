import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth/session'
import { db } from '@/lib/db'
import { dashboardLayouts, dashboardGridItems } from '@/lib/db/schema'
import { eq, and, inArray } from 'drizzle-orm'
import type { GridItemData, GridItemContent } from '@/types/dashboard.type'

export async function GET(): Promise<NextResponse> {
  try {
    const currentUser = await getCurrentUser()

    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Find user's layout
    const [layout] = await db
      .select()
      .from(dashboardLayouts)
      .where(eq(dashboardLayouts.userId, currentUser.userID))
      .limit(1)

    if (!layout) {
      // Return empty layout for first-time users
      return NextResponse.json({
        layout: null,
        items: [],
      })
    }

    // Fetch all grid items for this layout
    const items = await db
      .select()
      .from(dashboardGridItems)
      .where(eq(dashboardGridItems.layoutId, layout.layoutId))

    // Parse content JSON strings
    const itemsWithParsedContent = items.map((item) => ({
      ...item,
      content: JSON.parse(item.content) as GridItemContent,
    }))

    return NextResponse.json({
      layout: {
        layoutId: layout.layoutId,
        userId: layout.userId,
        createdAt: layout.createdAt,
        updatedAt: layout.updatedAt,
      },
      items: itemsWithParsedContent,
    })
  } catch (error) {
    console.error('Dashboard layout fetch error:', error)
    return NextResponse.json(
      { error: 'An error occurred fetching dashboard layout' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest): Promise<NextResponse> {
  try {
    const currentUser = await getCurrentUser()

    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { items } = body as { items: GridItemData[] }

    if (!Array.isArray(items)) {
      return NextResponse.json(
        { error: 'Invalid request: items must be an array' },
        { status: 400 }
      )
    }

    // Use transaction for atomicity
    const result = await db.transaction(async (tx) => {
      // Find or create layout
      let [layout] = await tx
        .select()
        .from(dashboardLayouts)
        .where(eq(dashboardLayouts.userId, currentUser.userID))
        .limit(1)

      if (!layout) {
        // Create new layout
        const [newLayout] = await tx
          .insert(dashboardLayouts)
          .values({
            userId: currentUser.userID,
          })
          .returning()
        layout = newLayout
      } else {
        // Update existing layout timestamp
        const [updatedLayout] = await tx
          .update(dashboardLayouts)
          .set({
            updatedAt: new Date(),
          })
          .where(eq(dashboardLayouts.layoutId, layout.layoutId))
          .returning()
        layout = updatedLayout
      }

      // Get existing items to determine what to delete
      const existingItems = await tx
        .select()
        .from(dashboardGridItems)
        .where(eq(dashboardGridItems.layoutId, layout.layoutId))

      const existingItemKeys = new Set(existingItems.map((item) => item.itemKey))
      const newItemKeys = new Set(items.map((item) => item.itemKey))

      // Delete items that are no longer in the layout
      const itemsToDelete = existingItems.filter(
        (item) => !newItemKeys.has(item.itemKey)
      )
      if (itemsToDelete.length > 0) {
        const itemIdsToDelete = itemsToDelete.map((item) => item.itemId)
        await tx
          .delete(dashboardGridItems)
          .where(
            and(
              eq(dashboardGridItems.layoutId, layout.layoutId),
              inArray(dashboardGridItems.itemId, itemIdsToDelete)
            )
          )
      }

      // Upsert items (update existing, insert new)
      for (const item of items) {
        const existingItem = existingItems.find((ei) => ei.itemKey === item.itemKey)

        if (existingItem) {
          // Update existing item
          await tx
            .update(dashboardGridItems)
            .set({
              x: item.x,
              y: item.y,
              w: item.w,
              h: item.h,
              static: item.static,
              itemType: item.itemType,
              content: JSON.stringify(item.content),
              updatedAt: new Date(),
            })
            .where(eq(dashboardGridItems.itemId, existingItem.itemId))
        } else {
          // Insert new item
          await tx.insert(dashboardGridItems).values({
            layoutId: layout.layoutId,
            itemKey: item.itemKey,
            x: item.x,
            y: item.y,
            w: item.w,
            h: item.h,
            static: item.static,
            itemType: item.itemType,
            content: JSON.stringify(item.content),
          })
        }
      }

      // Fetch updated items
      const updatedItems = await tx
        .select()
        .from(dashboardGridItems)
        .where(eq(dashboardGridItems.layoutId, layout.layoutId))

      const itemsWithParsedContent = updatedItems.map((item) => ({
        ...item,
        content: JSON.parse(item.content) as GridItemContent,
      }))

      return {
        layout: {
          layoutId: layout.layoutId,
          userId: layout.userId,
          createdAt: layout.createdAt,
          updatedAt: layout.updatedAt,
        },
        items: itemsWithParsedContent,
      }
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error('Dashboard layout save error:', error)
    return NextResponse.json(
      { error: 'An error occurred saving dashboard layout' },
      { status: 500 }
    )
  }
}
