"use client"

import { useState, useMemo, useEffect } from "react"
import { Calendar } from "@/components/ui/calendar"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Plus, Trash2, CalendarIcon, Edit2, Check, X } from "lucide-react"
import { format, isSameDay } from "date-fns"
import { fr } from "date-fns/locale"

interface Note {
  id: number
  date: string
  content: string
  created_at: string
  updated_at: string
}

export function NotesApp() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [notes, setNotes] = useState<Note[]>([])
  const [newNoteContent, setNewNoteContent] = useState("")
  const [showCalendar, setShowCalendar] = useState(false)
  const [editingNoteId, setEditingNoteId] = useState<number | null>(null)
  const [editContent, setEditContent] = useState("")
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchNotes()
  }, [])

  const fetchNotes = async () => {
    try {
      setIsLoading(true)
      const response = await fetch("/api/notes")
      if (response.ok) {
        const data = await response.json()
        setNotes(data)
      }
    } catch (error) {
      console.error("[v0] Error fetching notes:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const notesForSelectedDate = useMemo(() => {
    return notes.filter((note) => isSameDay(new Date(note.date), selectedDate))
  }, [notes, selectedDate])

  const addNote = async () => {
    if (newNoteContent.trim()) {
      try {
        const response = await fetch("/api/notes", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            content: newNoteContent,
            date: format(selectedDate, "yyyy-MM-dd"),
          }),
        })

        if (response.ok) {
          const newNote = await response.json()
          setNotes([...notes, newNote])
          setNewNoteContent("")
        }
      } catch (error) {
        console.error("[v0] Error creating note:", error)
      }
    }
  }

  const deleteNote = async (id: number) => {
    try {
      const response = await fetch(`/api/notes/${id}`, {
        method: "DELETE",
      })

      if (response.ok) {
        setNotes(notes.filter((note) => note.id !== id))
      }
    } catch (error) {
      console.error("[v0] Error deleting note:", error)
    }
  }

  const startEditing = (note: Note) => {
    setEditingNoteId(note.id)
    setEditContent(note.content)
  }

  const saveEdit = async (id: number) => {
    if (editContent.trim()) {
      try {
        const response = await fetch(`/api/notes/${id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            content: editContent,
          }),
        })

        if (response.ok) {
          const updatedNote = await response.json()
          setNotes(notes.map((note) => (note.id === id ? updatedNote : note)))
          setEditingNoteId(null)
          setEditContent("")
        }
      } catch (error) {
        console.error("[v0] Error updating note:", error)
      }
    }
  }

  const cancelEdit = () => {
    setEditingNoteId(null)
    setEditContent("")
  }

  const datesWithNotes = useMemo(() => {
    return notes.map((note) => new Date(note.date))
  }, [notes])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Chargement...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-6xl px-4 py-8 md:py-12">
        {/* Header */}
        <header className="mb-12">
          <h1 className="text-4xl font-bold tracking-tight text-foreground md:text-5xl">Enculator</h1>
          <p className="mt-2 text-lg text-muted-foreground">Votre journal quotidien</p>
        </header>

        <div className="grid gap-8 lg:grid-cols-[320px_1fr]">
          {/* Sidebar - Calendar */}
          <aside className="space-y-6">
            <Card className="p-6">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-sm font-medium uppercase tracking-wide text-muted-foreground">Calendrier</h2>
                <Button
                  variant="ghost"
                  size="icon"
                  className="lg:hidden"
                  onClick={() => setShowCalendar(!showCalendar)}
                >
                  <CalendarIcon className="h-4 w-4" />
                </Button>
              </div>
              <div className={showCalendar ? "block" : "hidden lg:block"}>
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => date && setSelectedDate(date)}
                  locale={fr}
                  className="rounded-md"
                  modifiers={{
                    hasNotes: datesWithNotes,
                  }}
                  modifiersStyles={{
                    hasNotes: {
                      fontWeight: "bold",
                      textDecoration: "underline",
                    },
                  }}
                />
              </div>
            </Card>

            <Card className="hidden p-6 lg:block">
              <h3 className="mb-3 text-sm font-medium uppercase tracking-wide text-muted-foreground">Statistiques</h3>
              <div className="space-y-3">
                <div>
                  <p className="text-2xl font-bold text-foreground">{notes.length}</p>
                  <p className="text-sm text-muted-foreground">Notes totales</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{notesForSelectedDate.length}</p>
                  <p className="text-sm text-muted-foreground">Notes aujourd'hui</p>
                </div>
              </div>
            </Card>
          </aside>

          {/* Main Content */}
          <main className="space-y-6">
            {/* Date Header */}
            <div className="border-b border-border pb-4">
              <h2 className="text-2xl font-bold text-foreground">
                {format(selectedDate, "EEEE d MMMM yyyy", { locale: fr })}
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {notesForSelectedDate.length} {notesForSelectedDate.length > 1 ? "notes" : "note"}
              </p>
            </div>

            {/* New Note Form */}
            <Card className="p-6">
              <h3 className="mb-4 text-sm font-medium uppercase tracking-wide text-muted-foreground">Nouvelle note</h3>
              <Textarea
                placeholder="Écrivez votre note ici..."
                value={newNoteContent}
                onChange={(e) => setNewNoteContent(e.target.value)}
                className="mb-4 min-h-[120px] resize-none"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                    addNote()
                  }
                }}
              />
              <div className="flex justify-end">
                <Button onClick={addNote} disabled={!newNoteContent.trim()}>
                  <Plus className="mr-2 h-4 w-4" />
                  Ajouter la note
                </Button>
              </div>
            </Card>

            {/* Notes List */}
            <div className="space-y-4">
              {notesForSelectedDate.length === 0 ? (
                <Card className="p-12 text-center">
                  <p className="text-muted-foreground">Aucune note pour cette date.</p>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Commencez à écrire pour créer votre première note.
                  </p>
                </Card>
              ) : (
                notesForSelectedDate.map((note) => (
                  <Card key={note.id} className="p-6 transition-shadow hover:shadow-md">
                    {editingNoteId === note.id ? (
                      <div className="space-y-4">
                        <Textarea
                          value={editContent}
                          onChange={(e) => setEditContent(e.target.value)}
                          className="min-h-[120px] resize-none"
                          autoFocus
                        />
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="sm" onClick={cancelEdit}>
                            <X className="mr-2 h-4 w-4" />
                            Annuler
                          </Button>
                          <Button size="sm" onClick={() => saveEdit(note.id)} disabled={!editContent.trim()}>
                            <Check className="mr-2 h-4 w-4" />
                            Enregistrer
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <p className="whitespace-pre-wrap text-foreground leading-relaxed">{note.content}</p>
                          <p className="mt-3 text-xs text-muted-foreground">
                            {format(new Date(note.created_at), "HH:mm", { locale: fr })}
                          </p>
                        </div>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon" onClick={() => startEditing(note)} title="Éditer">
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => deleteNote(note.id)} title="Supprimer">
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </Card>
                ))
              )}
            </div>
          </main>
        </div>
      </div>
    </div>
  )
}
