"use client"

import type React from "react"
import { useState, useMemo } from "react"
import useSWR from "swr"
import { Calendar } from "@/components/ui/calendar"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Plus,
  Trash2,
  CalendarIcon,
  Edit2,
  Check,
  X,
  Search,
  Pin,
  Archive,
  Download,
  Moon,
  Sun,
  Grid3x3,
  List,
  Tag,
  LogOut,
} from "lucide-react"
import { format } from "date-fns"
import { fr } from "date-fns/locale"
import { useTheme } from "next-themes"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Login } from "@/components/login"

interface Note {
  id: number
  date: string
  content: string
  created_at: string
  updated_at: string
  is_pinned: boolean
  is_archived: boolean
  tags: string[]
  author: string | null // Added author field
}

const TAG_COLORS = [
  "bg-blue-500/10 text-blue-700 dark:text-blue-300",
  "bg-green-500/10 text-green-700 dark:text-green-300",
  "bg-purple-500/10 text-purple-700 dark:text-purple-300",
  "bg-red-500/10 text-red-700 dark:text-red-300",
  "bg-orange-500/10 text-orange-700 dark:text-orange-300",
  "bg-pink-500/10 text-pink-700 dark:text-pink-300",
  "bg-yellow-500/10 text-yellow-700 dark:text-yellow-300",
  "bg-cyan-500/10 text-cyan-700 dark:text-cyan-300",
]

const exportNotes = () => {
  // Implement export functionality here
  console.log("Exporting notes...")
}

const handleLogin = (user: string, setCurrentUser: React.Dispatch<React.SetStateAction<string | null>>) => {
  // Implement login functionality here
  localStorage.setItem("enculator_user", user)
  setCurrentUser(user)
}

const handleLogout = (setCurrentUser: React.Dispatch<React.SetStateAction<string | null>>) => {
  // Implement logout functionality here
  localStorage.removeItem("enculator_user")
  setCurrentUser(null)
}

const fetcher = async (url: string) => {
  const res = await fetch(url)
  if (!res.ok) {
    const error = new Error("An error occurred while fetching the data.")
    throw error
  }
  return res.json()
}

export function NotesApp() {
  const [currentUser, setCurrentUser] = useState<string | null>(null)
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [newNoteContent, setNewNoteContent] = useState("")
  const [newNoteTags, setNewNoteTags] = useState<string[]>([])
  const [newTagInput, setNewTagInput] = useState("")
  const [editTagInput, setEditTagInput] = useState("")
  const [showCalendar, setShowCalendar] = useState(false)
  const [editingNoteId, setEditingNoteId] = useState<number | null>(null)
  const [editContent, setEditContent] = useState("")
  const [editTags, setEditTags] = useState<string[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedTag, setSelectedTag] = useState<string | null>(null)
  const [showArchived, setShowArchived] = useState(false)
  const [sortBy, setSortBy] = useState<"date" | "updated" | "alpha">("date")
  const [viewMode, setViewMode] = useState<"grid" | "list">("list")
  const { theme, setTheme } = useTheme()

  const apiUrl = useMemo(() => {
    const params = new URLSearchParams()
    if (searchQuery) params.append("search", searchQuery)
    if (selectedTag) params.append("tag", selectedTag)
    if (showArchived) params.append("showArchived", "true")
    params.append("sortBy", sortBy)
    return `/api/notes?${params}`
  }, [searchQuery, selectedTag, showArchived, sortBy])

  const {
    data: notes,
    error,
    isLoading,
    mutate,
  } = useSWR<Note[]>(apiUrl, fetcher, {
    refreshInterval: 5000, // Refresh every 5 seconds
    revalidateOnFocus: true, // Revalidate when window regains focus
    revalidateOnReconnect: true, // Revalidate when reconnecting
    fallbackData: [],
  })

  const safeNotes = notes || []

  const notesForSelectedDate = useMemo(() => {
    const selectedDateStr = format(selectedDate, "yyyy-MM-dd")
    return safeNotes.filter((note) => note.date === selectedDateStr)
  }, [safeNotes, selectedDate])

  const addNote = async () => {
    if (newNoteContent.trim()) {
      try {
        const year = selectedDate.getFullYear()
        const month = String(selectedDate.getMonth() + 1).padStart(2, "0")
        const day = String(selectedDate.getDate()).padStart(2, "0")
        const dateToSend = `${year}-${month}-${day}`

        const response = await fetch("/api/notes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            content: newNoteContent,
            date: dateToSend,
            tags: newNoteTags,
            author: currentUser,
          }),
        })

        if (response.ok) {
          const newNote = await response.json()
          mutate([newNote, ...safeNotes], false)
          setNewNoteContent("")
          setNewNoteTags([])
          mutate()
        }
      } catch (error) {
        console.error("[v0] Error creating note:", error)
      }
    }
  }

  const deleteNote = async (id: number) => {
    try {
      mutate(
        safeNotes.filter((note) => note.id !== id),
        false,
      )
      const response = await fetch(`/api/notes/${id}`, { method: "DELETE" })
      if (response.ok) {
        mutate()
      } else {
        mutate()
      }
    } catch (error) {
      console.error("[v0] Error deleting note:", error)
      mutate()
    }
  }

  const togglePin = async (note: Note) => {
    try {
      mutate(
        safeNotes.map((n) => (n.id === note.id ? { ...n, is_pinned: !n.is_pinned } : n)),
        false,
      )

      const response = await fetch(`/api/notes/${note.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: note.content,
          is_pinned: !note.is_pinned,
          tags: note.tags,
          is_archived: note.is_archived,
        }),
      })

      if (response.ok) {
        mutate()
      } else {
        mutate()
      }
    } catch (error) {
      console.error("[v0] Error toggling pin:", error)
      mutate()
    }
  }

  const toggleArchive = async (note: Note) => {
    try {
      mutate(
        safeNotes.map((n) => (n.id === note.id ? { ...n, is_archived: !n.is_archived } : n)),
        false,
      )

      const response = await fetch(`/api/notes/${note.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: note.content,
          is_archived: !note.is_archived,
          tags: note.tags,
          is_pinned: note.is_pinned,
        }),
      })

      if (response.ok) {
        mutate()
      } else {
        mutate()
      }
    } catch (error) {
      console.error("[v0] Error toggling archive:", error)
      mutate()
    }
  }

  const startEditing = (note: Note) => {
    setEditingNoteId(note.id)
    setEditContent(note.content)
    setEditTags(note.tags || [])
  }

  const saveEdit = async (id: number) => {
    if (editContent.trim()) {
      try {
        const response = await fetch(`/api/notes/${id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            content: editContent,
            tags: editTags,
          }),
        })

        if (response.ok) {
          const updatedNote = await response.json()
          mutate(
            safeNotes.map((note) => (note.id === id ? updatedNote : note)),
            false,
          )
          setEditingNoteId(null)
          setEditContent("")
          setEditTags([])
          mutate()
        }
      } catch (error) {
        console.error("[v0] Error updating note:", error)
      }
    }
  }

  const cancelEdit = () => {
    setEditingNoteId(null)
    setEditContent("")
    setEditTags([])
  }

  const toggleTag = (tag: string, isEditing = false) => {
    if (isEditing) {
      setEditTags((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]))
    } else {
      setNewNoteTags((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]))
    }
  }

  const addCustomTag = (isEditing = false) => {
    const input = isEditing ? editTagInput : newTagInput
    const trimmedTag = input.trim()

    if (trimmedTag && trimmedTag.length > 0) {
      if (isEditing) {
        if (!editTags.includes(trimmedTag)) {
          setEditTags([...editTags, trimmedTag])
        }
        setEditTagInput("")
      } else {
        if (!newNoteTags.includes(trimmedTag)) {
          setNewNoteTags([...newNoteTags, trimmedTag])
        }
        setNewTagInput("")
      }
    }
  }

  const getTagColor = (tag: string) => {
    const allTags = Array.from(new Set(safeNotes.flatMap((n) => n.tags || [])))
    const index = allTags.indexOf(tag)
    return TAG_COLORS[index % TAG_COLORS.length]
  }

  const allTags = useMemo(() => {
    const tagSet = new Set<string>()
    safeNotes.forEach((note) => note.tags?.forEach((tag) => tagSet.add(tag)))
    return Array.from(tagSet)
  }, [safeNotes])

  const pinnedNotes = safeNotes.filter((n) => n.is_pinned && !n.is_archived)

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Chargement...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-destructive">Erreur lors du chargement des notes</p>
      </div>
    )
  }

  if (!currentUser) {
    return <Login onLogin={(user: string) => handleLogin(user, setCurrentUser)} />
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-7xl px-4 py-8 md:py-12">
        {/* Header */}
        <header className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <img
              src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/logo-xgc1KdmrfZYaDZ9oO0LNC3ZMWfG4a7.png"
              alt="Enculator Logo"
              className="h-16 w-16 object-contain"
            />
            <div>
              <h1 className="text-4xl font-bold tracking-tight text-foreground md:text-5xl">Enculator</h1>
              <p className="mt-2 text-lg text-muted-foreground">
                Connecté en tant que <span className="font-medium text-foreground">{currentUser}</span>
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="icon" onClick={() => handleLogout(setCurrentUser)} title="Se déconnecter">
              <LogOut className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>
              {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
            <Button variant="outline" size="icon" onClick={exportNotes}>
              <Download className="h-4 w-4" />
            </Button>
          </div>
        </header>

        {/* Search and Filters */}
        <div className="mb-6 flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Rechercher dans les notes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={sortBy} onValueChange={(v: any) => setSortBy(v)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="date">Par date</SelectItem>
              <SelectItem value="updated">Dernière modif.</SelectItem>
              <SelectItem value="alpha">Alphabétique</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon" onClick={() => setViewMode(viewMode === "grid" ? "list" : "grid")}>
            {viewMode === "grid" ? <List className="h-4 w-4" /> : <Grid3x3 className="h-4 w-4" />}
          </Button>
          <Button variant={showArchived ? "default" : "outline"} onClick={() => setShowArchived(!showArchived)}>
            <Archive className="mr-2 h-4 w-4" />
            Archivées
          </Button>
        </div>

        {/* Tags Filter */}
        {allTags.length > 0 && (
          <div className="mb-6 flex flex-wrap gap-2">
            <Button
              variant={selectedTag === null ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedTag(null)}
            >
              Tous
            </Button>
            {allTags.map((tag) => (
              <Button
                key={tag}
                variant={selectedTag === tag ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedTag(selectedTag === tag ? null : tag)}
              >
                <Tag className="mr-1 h-3 w-3" />
                {tag}
              </Button>
            ))}
          </div>
        )}

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
                  modifiers={{ hasNotes: allTags }}
                  modifiersStyles={{ hasNotes: { fontWeight: "bold", textDecoration: "underline" } }}
                />
              </div>
            </Card>

            <Card className="hidden p-6 lg:block">
              <h3 className="mb-3 text-sm font-medium uppercase tracking-wide text-muted-foreground">Statistiques</h3>
              <div className="space-y-3">
                <div>
                  <p className="text-2xl font-bold text-foreground">{safeNotes.filter((n) => !n.is_archived).length}</p>
                  <p className="text-sm text-muted-foreground">Notes actives</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{pinnedNotes.length}</p>
                  <p className="text-sm text-muted-foreground">Notes épinglées</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{allTags.length}</p>
                  <p className="text-sm text-muted-foreground">Tags uniques</p>
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
              <div className="mb-4 space-y-3">
                <div className="flex gap-2">
                  <Input
                    placeholder="Ajouter un tag personnalisé..."
                    value={newTagInput}
                    onChange={(e) => setNewTagInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault()
                        addCustomTag(false)
                      }
                    }}
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => addCustomTag(false)}
                    disabled={!newTagInput.trim()}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                {newNoteTags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {newNoteTags.map((tag) => (
                      <Badge
                        key={tag}
                        variant="default"
                        className={`cursor-pointer ${getTagColor(tag)}`}
                        onClick={() => toggleTag(tag)}
                      >
                        {tag}
                        <X className="ml-1 h-3 w-3" />
                      </Badge>
                    ))}
                  </div>
                )}
                {allTags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    <p className="w-full text-xs text-muted-foreground">Tags existants :</p>
                    {allTags.map((tag) => (
                      <Badge
                        key={tag}
                        variant={newNoteTags.includes(tag) ? "default" : "outline"}
                        className={`cursor-pointer ${newNoteTags.includes(tag) ? getTagColor(tag) : ""}`}
                        onClick={() => toggleTag(tag)}
                      >
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex justify-end">
                <Button onClick={addNote} disabled={!newNoteContent.trim()}>
                  <Plus className="mr-2 h-4 w-4" />
                  Ajouter la note
                </Button>
              </div>
            </Card>

            {/* Notes List */}
            <div className={viewMode === "grid" ? "grid gap-4 md:grid-cols-2" : "space-y-4"}>
              {notesForSelectedDate.length === 0 ? (
                <Card className="p-12 text-center">
                  <p className="text-muted-foreground">Aucune note pour cette date.</p>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Commencez à écrire pour créer votre première note.
                  </p>
                </Card>
              ) : (
                notesForSelectedDate.map((note) => (
                  <Card
                    key={note.id}
                    className={`p-6 transition-shadow hover:shadow-md ${note.is_pinned ? "ring-2 ring-primary" : ""}`}
                  >
                    {editingNoteId === note.id ? (
                      <div className="space-y-4">
                        <Textarea
                          value={editContent}
                          onChange={(e) => setEditContent(e.target.value)}
                          className="min-h-[120px] resize-none"
                          autoFocus
                        />
                        <div className="space-y-3">
                          <div className="flex gap-2">
                            <Input
                              placeholder="Ajouter un tag personnalisé..."
                              value={editTagInput}
                              onChange={(e) => setEditTagInput(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  e.preventDefault()
                                  addCustomTag(true)
                                }
                              }}
                              className="flex-1"
                            />
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => addCustomTag(true)}
                              disabled={!editTagInput.trim()}
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                          </div>
                          {editTags.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                              {editTags.map((tag) => (
                                <Badge
                                  key={tag}
                                  variant="default"
                                  className={`cursor-pointer ${getTagColor(tag)}`}
                                  onClick={() => toggleTag(tag, true)}
                                >
                                  {tag}
                                  <X className="ml-1 h-3 w-3" />
                                </Badge>
                              ))}
                            </div>
                          )}
                          {allTags.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                              <p className="w-full text-xs text-muted-foreground">Tags existants :</p>
                              {allTags.map((tag) => (
                                <Badge
                                  key={tag}
                                  variant={editTags.includes(tag) ? "default" : "outline"}
                                  className={`cursor-pointer ${editTags.includes(tag) ? getTagColor(tag) : ""}`}
                                  onClick={() => toggleTag(tag, true)}
                                >
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
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
                      <div>
                        <div className="mb-3 flex items-start justify-between gap-4">
                          <div className="flex-1">
                            {note.tags && note.tags.length > 0 && (
                              <div className="mb-2 flex flex-wrap gap-1">
                                {note.tags.map((tag) => (
                                  <Badge key={tag} variant="secondary" className={getTagColor(tag)}>
                                    {tag}
                                  </Badge>
                                ))}
                              </div>
                            )}
                            <p className="whitespace-pre-wrap text-foreground leading-relaxed">{note.content}</p>
                            <p className="mt-3 text-xs text-muted-foreground">
                              {note.author && <span className="font-medium">{note.author}</span>}
                              {note.author && " • "}
                              Créée: {format(new Date(note.created_at), "HH:mm", { locale: fr })} • Modifiée:{" "}
                              {format(new Date(note.updated_at), "HH:mm", { locale: fr })}
                            </p>
                          </div>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => togglePin(note)}
                              title={note.is_pinned ? "Désépingler" : "Épingler"}
                            >
                              <Pin className={`h-4 w-4 ${note.is_pinned ? "fill-current" : ""}`} />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => toggleArchive(note)}
                              title={note.is_archived ? "Désarchiver" : "Archiver"}
                            >
                              <Archive className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => startEditing(note)} title="Éditer">
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => deleteNote(note.id)} title="Supprimer">
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
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
