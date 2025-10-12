import { sql } from "@/lib/db"
import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const date = searchParams.get("date")

    if (date) {
      // Get notes for a specific date
      const notes = await sql`
        SELECT id, content, date, created_at, updated_at
        FROM notes
        WHERE date = ${date}
        ORDER BY created_at DESC
      `
      return NextResponse.json(notes)
    } else {
      // Get all notes
      const notes = await sql`
        SELECT id, content, date, created_at, updated_at
        FROM notes
        ORDER BY date DESC, created_at DESC
      `
      return NextResponse.json(notes)
    }
  } catch (error) {
    console.error("[v0] Error fetching notes:", error)
    return NextResponse.json({ error: "Failed to fetch notes" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { content, date } = body

    if (!content || !date) {
      return NextResponse.json({ error: "Content and date are required" }, { status: 400 })
    }

    const result = await sql`
      INSERT INTO notes (content, date)
      VALUES (${content}, ${date})
      RETURNING id, content, date, created_at, updated_at
    `

    return NextResponse.json(result[0], { status: 201 })
  } catch (error) {
    console.error("[v0] Error creating note:", error)
    return NextResponse.json({ error: "Failed to create note" }, { status: 500 })
  }
}
