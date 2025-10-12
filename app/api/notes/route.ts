import { sql } from "@/lib/db"
import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const date = searchParams.get("date")
    const search = searchParams.get("search")
    const tag = searchParams.get("tag")
    const showArchived = searchParams.get("showArchived") === "true"
    const sortBy = searchParams.get("sortBy") || "date"

    let whereConditions = sql`WHERE 1=1`

    if (!showArchived) {
      whereConditions = sql`${whereConditions} AND (is_archived = false OR is_archived IS NULL)`
    }

    if (date) {
      whereConditions = sql`${whereConditions} AND date = ${date}`
    }

    if (search) {
      whereConditions = sql`${whereConditions} AND content ILIKE ${"%" + search + "%"}`
    }

    if (tag) {
      whereConditions = sql`${whereConditions} AND ${tag} = ANY(tags)`
    }

    let orderClause
    if (sortBy === "date") {
      orderClause = sql`ORDER BY is_pinned DESC NULLS LAST, date DESC, created_at DESC`
    } else if (sortBy === "updated") {
      orderClause = sql`ORDER BY is_pinned DESC NULLS LAST, updated_at DESC`
    } else if (sortBy === "alpha") {
      orderClause = sql`ORDER BY is_pinned DESC NULLS LAST, content ASC`
    } else {
      orderClause = sql`ORDER BY is_pinned DESC NULLS LAST, date DESC, created_at DESC`
    }

    const result = await sql`
      SELECT id, content, date::text as date, created_at, updated_at, is_pinned, is_archived, tags, author
      FROM notes
      ${whereConditions}
      ${orderClause}
    `

    const notes = result.map((note: any) => ({
      id: note.id,
      content: note.content,
      date: note.date,
      created_at: note.created_at instanceof Date ? note.created_at.toISOString() : note.created_at,
      updated_at: note.updated_at instanceof Date ? note.updated_at.toISOString() : note.updated_at,
      is_pinned: note.is_pinned ?? false,
      is_archived: note.is_archived ?? false,
      tags: Array.isArray(note.tags) ? note.tags : [],
      author: note.author || null, // Added author to response
    }))

    return NextResponse.json(notes)
  } catch (error) {
    console.error("[v0] Error fetching notes:", error)
    return NextResponse.json({ error: "Failed to fetch notes" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { content, date, tags = [], is_pinned = false, author } = body

    if (!content || !date) {
      return NextResponse.json({ error: "Content and date are required" }, { status: 400 })
    }

    const result = await sql`
      INSERT INTO notes (content, date, tags, is_pinned, is_archived, author)
      VALUES (${content}, ${date}::date, ${tags}, ${is_pinned}, false, ${author})
      RETURNING id, content, date::text as date, created_at, updated_at, is_pinned, is_archived, tags, author
    `

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
      author: note.author || null, // Added author to response
    }

    return NextResponse.json(serializedNote, { status: 201 })
  } catch (error) {
    console.error("[v0] Error creating note:", error)
    return NextResponse.json({ error: "Failed to create note" }, { status: 500 })
  }
}
