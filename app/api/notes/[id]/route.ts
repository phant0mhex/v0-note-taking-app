import { sql } from "@/lib/db"
import { type NextRequest, NextResponse } from "next/server"

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await request.json()
    const { content, tags, is_pinned, is_archived } = body

    if (!content) {
      return NextResponse.json({ error: "Content is required" }, { status: 400 })
    }

    let updateFields = sql`content = ${content}, updated_at = CURRENT_TIMESTAMP`

    if (tags !== undefined) {
      updateFields = sql`${updateFields}, tags = ${tags}`
    }

    if (is_pinned !== undefined) {
      updateFields = sql`${updateFields}, is_pinned = ${is_pinned}`
    }

    if (is_archived !== undefined) {
      updateFields = sql`${updateFields}, is_archived = ${is_archived}`
    }

    const result = await sql`
      UPDATE notes 
      SET ${updateFields}
      WHERE id = ${id}
      RETURNING id, content, date::text as date, created_at, updated_at, is_pinned, is_archived, tags, author
    `

    if (result.length === 0) {
      return NextResponse.json({ error: "Note not found" }, { status: 404 })
    }

    const note = result[0]
    const serializedNote = {
      id: note.id,
      content: note.content,
      date: note.date,
      created_at: note.created_at instanceof Date ? note.created_at.toISOString() : note.created_at,
      updated_at: note.updated_at instanceof Date ? note.updated_at.toISOString() : note.updated_at,
      is_pinned: note.is_pinned ?? false,
      is_archived: note.is_archived ?? false,
      tags: Array.isArray(note.tags) ? note.tags : [],
      author: note.author || null,
    }

    return NextResponse.json(serializedNote)
  } catch (error) {
    console.error("[v0] Error updating note:", error)
    return NextResponse.json({ error: "Failed to update note" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params

    const result = await sql`
      DELETE FROM notes
      WHERE id = ${id}
      RETURNING id
    `

    if (result.length === 0) {
      return NextResponse.json({ error: "Note not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Error deleting note:", error)
    return NextResponse.json({ error: "Failed to delete note" }, { status: 500 })
  }
}
