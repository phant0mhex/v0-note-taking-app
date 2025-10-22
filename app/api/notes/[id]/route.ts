// app/api/notes/[id]/route.ts
import { sql } from "@/lib/db"
import { type NextRequest, NextResponse } from "next/server"

interface RouteParams {
  params: {
    id: string
  }
}

// Helper pour sérialiser la note (sans deleted_at)
function serializeNote(note: any) {
  return {
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
}

// GET /api/notes/[id] - Récupérer une note spécifique
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const id = parseInt(params.id, 10)
    if (isNaN(id)) {
      return NextResponse.json({ error: "Invalid ID format" }, { status: 400 })
    }

    const result = await sql`
      SELECT id, content, date::text as date, created_at, updated_at, is_pinned, is_archived, tags, author
      FROM notes
      WHERE id = ${id}
    `

    if (result.length === 0) {
      return NextResponse.json({ error: "Note not found" }, { status: 404 })
    }

    return NextResponse.json(serializeNote(result[0]))
  } catch (error) {
    console.error("[v0] Error fetching note:", error)
    return NextResponse.json({ error: "Failed to fetch note" }, { status: 500 })
  }
}

// PUT /api/notes/[id] - Mettre à jour une note
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const id = parseInt(params.id, 10)
    if (isNaN(id)) {
      return NextResponse.json({ error: "Invalid ID format" }, { status: 400 })
    }
    
    // 1. Récupérer la note actuelle
    const currentResult = await sql`SELECT * FROM notes WHERE id = ${id}`
    if (currentResult.length === 0) {
      return NextResponse.json({ error: "Note not found" }, { status: 404 })
    }
    const currentNote = currentResult[0]
    
    // 2. Récupérer le corps de la requête
    const body = await request.json()

    // 3. Fusionner les modifications (le body priorise)
    const updatedNote = {
      content: body.content ?? currentNote.content,
      tags: body.tags ?? currentNote.tags,
      is_pinned: body.is_pinned ?? currentNote.is_pinned,
      is_archived: body.is_archived ?? currentNote.is_archived,
    }

    // 4. Exécuter la mise à jour
    const result = await sql`
      UPDATE notes
      SET
        content = ${updatedNote.content},
        tags = ${updatedNote.tags},
        is_pinned = ${updatedNote.is_pinned},
        is_archived = ${updatedNote.is_archived},
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ${id}
      RETURNING id, content, date::text as date, created_at, updated_at, is_pinned, is_archived, tags, author
    `

    return NextResponse.json(serializeNote(result[0]))

  } catch (error) {
    console.error("[v0] Error updating note:", error) 
    return NextResponse.json({ error: "Failed to update note" }, { status: 500 })
  }
}

// DELETE /api/notes/[id] - Supprimer une note (Hard Delete)
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const id = parseInt(params.id, 10)
    if (isNaN(id)) {
      return NextResponse.json({ error: "Invalid ID format" }, { status: 400 })
    }
    
    // Suppression définitive
    const result = await sql`
      DELETE FROM notes
      WHERE id = ${id}
      RETURNING id
    `
    
    if (result.length === 0) {
      return NextResponse.json({ error: "Note not found" }, { status: 404 })
    }

    return NextResponse.json({ message: "Note deleted successfully" }, { status: 200 })

  } catch (error) {
    console.error("[v0] Error deleting note:", error)
    return NextResponse.json({ error: "Failed to delete note" }, { status: 500 })
  }
}