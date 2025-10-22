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
    const showDeleted = searchParams.get("showDeleted") === "true" // Nouveau paramètre

    let whereConditions = sql`WHERE 1=1`

    // Gérer l'affichage de la corbeille ou des notes actives/archivées
    if (showDeleted) {
      // Afficher uniquement les notes supprimées (deleted_at IS NOT NULL)
      whereConditions = sql`${whereConditions} AND deleted_at IS NOT NULL`
    } else {
      // Exclure les notes supprimées par défaut (deleted_at IS NULL)
      whereConditions = sql`${whereConditions} AND deleted_at IS NULL`
      // Appliquer le filtre 'archived' uniquement si on n'est pas dans la corbeille
      if (!showArchived) {
        whereConditions = sql`${whereConditions} AND (is_archived = false OR is_archived IS NULL)`
      }
    }

    // Appliquer les autres filtres seulement si on n'est pas dans la vue corbeille
    // (ou adapter si tu veux pouvoir filtrer la corbeille aussi)
    if (!showDeleted) {
        if (date) {
          whereConditions = sql`${whereConditions} AND date = ${date}`
        }
        if (tag) {
          whereConditions = sql`${whereConditions} AND ${tag} = ANY(tags)`
        }
    }

     // Le filtre de recherche textuelle peut s'appliquer partout
    if (search) {
      whereConditions = sql`${whereConditions} AND content ILIKE ${"%" + search + "%"}`
    }


    let orderClause
    // Tri différent pour la corbeille (par date de suppression)
    if (showDeleted) {
        orderClause = sql`ORDER BY deleted_at DESC`
    } else if (sortBy === "date") {
      orderClause = sql`ORDER BY is_pinned DESC NULLS LAST, date DESC, created_at DESC`
    } else if (sortBy === "updated") {
      orderClause = sql`ORDER BY is_pinned DESC NULLS LAST, updated_at DESC`
    } else if (sortBy === "alpha") {
      orderClause = sql`ORDER BY is_pinned DESC NULLS LAST, content ASC`
    } else {
      // Tri par défaut pour les vues normales
      orderClause = sql`ORDER BY is_pinned DESC NULLS LAST, date DESC, created_at DESC`
    }

    const result = await sql`
      SELECT id, content, date::text as date, created_at, updated_at, is_pinned, is_archived, tags, author, deleted_at -- Sélectionner deleted_at
      FROM notes
      ${whereConditions}
      ${orderClause}
    `

    // Mapper les résultats en incluant deleted_at
    const notes = result.map((note: any) => ({
      id: note.id,
      content: note.content,
      date: note.date,
      created_at: note.created_at instanceof Date ? note.created_at.toISOString() : note.created_at,
      updated_at: note.updated_at instanceof Date ? note.updated_at.toISOString() : note.updated_at,
      is_pinned: note.is_pinned ?? false,
      is_archived: note.is_archived ?? false,
      tags: Array.isArray(note.tags) ? note.tags : [],
      author: note.author || null,
      deleted_at: note.deleted_at instanceof Date ? note.deleted_at.toISOString() : note.deleted_at, // Inclure deleted_at
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
    // S'assurer que deleted_at n'est pas envoyé ou est ignoré lors de la création
    const { content, date, tags = [], is_pinned = false, author } = body

    if (!content || !date) {
      return NextResponse.json({ error: "Content and date are required" }, { status: 400 })
    }

    // S'assurer que deleted_at est NULL lors de l'insertion
    const result = await sql`
      INSERT INTO notes (content, date, tags, is_pinned, is_archived, author, deleted_at)
      VALUES (${content}, ${date}::date, ${tags}, ${is_pinned}, false, ${author}, NULL)
      RETURNING id, content, date::text as date, created_at, updated_at, is_pinned, is_archived, tags, author, deleted_at -- Inclure deleted_at
    `

    const note = result[0]

    // Mapper la réponse en incluant deleted_at (qui sera null)
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
      deleted_at: note.deleted_at instanceof Date ? note.deleted_at.toISOString() : note.deleted_at, // Inclure deleted_at
    }

    return NextResponse.json(serializedNote, { status: 201 })
  } catch (error) {
    console.error("[v0] Error creating note:", error)
    return NextResponse.json({ error: "Failed to create note" }, { status: 500 })
  }
}