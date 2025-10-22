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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog" // Import Dialog components
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
import jsPDF from "jspdf"

interface Note {
  id: number
  date: string
  content: string
  created_at: string
  updated_at: string
  is_pinned: boolean
  is_archived: boolean
  tags: string[]
  author: string | null
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

const exportNotesToPDF = (notesToExport: Note[], selectedDate: Date) => {
  if (notesToExport.length === 0) {
    alert("Aucune note à exporter pour cette date.")
    return
  }

  const doc = new jsPDF()
  const formattedDate = format(selectedDate, "EEEE d MMMM yyyy", { locale: fr })
  const margin = 14
  const maxWidth = doc.internal.pageSize.width - margin * 2
  let y = 22 // Position verticale initiale

  doc.setFontSize(18)
  doc.text(`Notes du ${formattedDate}`, margin, y)
  y += 18

  notesToExport
    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
    .forEach((note) => {
      // Vérifier si on a besoin d'une nouvelle page
      if (y > doc.internal.pageSize.height - 40) {
        doc.addPage()
        y = 20 // Réinitialiser y pour la nouvelle page
      }

      const meta = `Auteur: ${note.author || "Inconnu"}  |  Modifiée: ${format(new Date(note.updated_at), "HH:mm", { locale: fr })}`
      doc.setFontSize(10)
      doc.setTextColor(100) // Gris
      doc.text(meta, margin, y)
      y += 6

      doc.setFontSize(12)
      doc.setTextColor(0) // Noir
      const contentLines = doc.splitTextToSize(note.content, maxWidth)
      doc.text(contentLines, margin, y)
      y += contentLines.length * 7

      if (note.tags && note.tags.length > 0) {
        const tagsStr = `Tags: ${note.tags.join(", ")}`
        doc.setFontSize(9)
        doc.setTextColor(70, 70, 200) // Bleu
        doc.text(tagsStr, margin, y)
        y += 7
      }

      y += 5
      doc.setDrawColor(200) // Ligne de séparation grise
      doc.line(margin, y, maxWidth + margin, y)
      y += 10
    })

  doc.save(`enculator-export-${format(selectedDate, "yyyy-MM-dd")}.pdf`)
}

const handleLogin = (user: string, setCurrentUser: React.Dispatch<React.SetStateAction<string | null>>) => {
  localStorage.setItem("enculator_user", user)
  setCurrentUser(user)
}

const handleLogout = (setCurrentUser: React.Dispatch<React.SetStateAction<string | null>>) => {
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
  const [showCalendar, setShowCalendar] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedTag, setSelectedTag] = useState<string | null>(null)
  const [showArchived, setShowArchived] = useState(false)
  const [sortBy, setSortBy] = useState<"date" | "updated" | "alpha">("date")
  const [viewMode, setViewMode] = useState<"grid" | "list">("list")
  const { theme, setTheme } = useTheme()

  // --- State for Edit Modal ---
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [noteToEditInModal, setNoteToEditInModal] = useState<Note | null>(null)
  const [modalEditContent, setModalEditContent] = useState("")
  const [modalEditTags, setModalEditTags] = useState<string[]>([])
  const [modalEditTagInput, setModalEditTagInput] = useState("")
  // --- End State for Edit Modal ---

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
    refreshInterval: 5000,
    revalidateOnFocus: true,
    revalidateOnReconnect: true,
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
        const dateToSend = format(selectedDate, "yyyy-MM-dd")

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
        mutate() // Revert optimistic update on failure
      }
    } catch (error) {
      console.error("[v0] Error deleting note:", error)
      mutate() // Revert optimistic update on error
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
        body: JSON.stringify({ is_pinned: !note.is_pinned }), // Only send changed field
      })
      if (!response.ok) mutate() // Revert optimistic update on failure
      else mutate() // Revalidate after successful update
    } catch (error) {
      console.error("[v0] Error toggling pin:", error)
      mutate() // Revert optimistic update on error
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
        body: JSON.stringify({ is_archived: !note.is_archived }), // Only send changed field
      })
      if (!response.ok) mutate() // Revert optimistic update on failure
      else mutate() // Revalidate after successful update
    } catch (error) {
      console.error("[v0] Error toggling archive:", error)
      mutate() // Revert optimistic update on error
    }
  }

  // --- Modal Functions ---
  const startEditing = (note: Note) => {
    setNoteToEditInModal(note)
    setModalEditContent(note.content)
    setModalEditTags(note.tags || [])
    setModalEditTagInput("")
    setIsModalOpen(true)
  }

  const saveEdit = async () => {
    if (noteToEditInModal && modalEditContent.trim()) {
      const id = noteToEditInModal.id
      try {
        // Optimistic update
        mutate(
          safeNotes.map((n) =>
            n.id === id ? { ...n, content: modalEditContent, tags: modalEditTags } : n,
          ),
          false,
        )
        const response = await fetch(`/api/notes/${id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            content: modalEditContent,
            tags: modalEditTags,
          }),
        })

        if (response.ok) {
          closeModal()
          mutate() // Revalidate after successful save
        } else {
          console.error("Failed to save edit")
          mutate() // Revert optimistic update on failure
        }
      } catch (error) {
        console.error("[v0] Error updating note:", error)
        mutate() // Revert optimistic update on error
      }
    }
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setNoteToEditInModal(null)
    setModalEditContent("")
    setModalEditTags([])
    setModalEditTagInput("")
  }
  // --- End Modal Functions ---

  const toggleTag = (tag: string, context: "new" | "modal") => {
    if (context === "modal") {
      setModalEditTags((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]))
    } else {
      setNewNoteTags((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]))
    }
  }

  const addCustomTag = (context: "new" | "modal") => {
    const input = context === "modal" ? modalEditTagInput : newTagInput
    const tags = context === "modal" ? modalEditTags : newNoteTags
    const setTags = context === "modal" ? setModalEditTags : setNewNoteTags
    const setInput = context === "modal" ? setModalEditTagInput : setNewTagInput
    const trimmedTag = input.trim()

    if (trimmedTag && trimmedTag.length > 0 && !tags.includes(trimmedTag)) {
      setTags([...tags, trimmedTag])
      setInput("")
    } else if (trimmedTag) {
      setInput("") // Clear input even if tag exists
    }
  }

  const getTagColor = (tag: string) => {
    const allUniqueTags = Array.from(new Set(safeNotes.flatMap((n) => n.tags || [])))
    const index = allUniqueTags.indexOf(tag)
    return TAG_COLORS[index % TAG_COLORS.length]
  }

  const allTagsForCurrentUser = useMemo(() => {
    const tagSet = new Set<string>()
    safeNotes
      .filter((note) => note.author === currentUser)
      .forEach((note) => note.tags?.forEach((tag) => tagSet.add(tag)))
    return Array.from(tagSet)
  }, [safeNotes, currentUser])

  const pinnedNotesForCurrentUser = safeNotes.filter((n) => n.is_pinned && !n.is_archived && n.author === currentUser)
  const activeNotesCountForCurrentUser = safeNotes.filter((n) => !n.is_archived && n.author === currentUser).length

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
              <div className="mt-2 flex items-center gap-2">
                <Badge variant="default" className="bg-primary/10 text-primary hover:bg-primary/20 px-3 py-1 text-sm">
                  <span className="mr-1">👤</span>
                  {currentUser}
                </Badge>
                <span className="text-xs text-muted-foreground">connecté</span>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="icon" onClick={() => handleLogout(setCurrentUser)} title="Se déconnecter">
              <LogOut className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>
              {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => exportNotesToPDF(notesForSelectedDate, selectedDate)}
              title="Exporter en PDF (cette date)"
            >
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

        {/* Tags Filter (pour l'utilisateur courant) */}
        {allTagsForCurrentUser.length > 0 && (
          <div className="mb-6 flex flex-wrap gap-2">
            <Button
              variant={selectedTag === null ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedTag(null)}
            >
              Tous
            </Button>
            {allTagsForCurrentUser.map((tag) => (
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
          {/* Sidebar */}
          <aside className="space-y-6">
            <Card className="p-6">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-sm font-medium uppercase tracking-wide text-muted-foreground">Calendrier</h2>
                <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setShowCalendar(!showCalendar)}>
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
                />
              </div>
            </Card>

            <Card className="hidden p-6 lg:block">
              <h3 className="mb-3 text-sm font-medium uppercase tracking-wide text-muted-foreground">Statistiques (vous)</h3>
              <div className="space-y-3">
                <div>
                  <p className="text-2xl font-bold text-foreground">{activeNotesCountForCurrentUser}</p>
                  <p className="text-sm text-muted-foreground">Notes actives</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{pinnedNotesForCurrentUser.length}</p>
                  <p className="text-sm text-muted-foreground">Notes épinglées</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{allTagsForCurrentUser.length}</p>
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
                onKeyDown={(e) => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) { addNote() } }}
              />
              <div className="mb-4 space-y-3">
                <div className="flex gap-2">
                  <Input
                    placeholder="Ajouter un tag..."
                    value={newTagInput}
                    onChange={(e) => setNewTagInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addCustomTag("new") } }}
                    className="flex-1"
                  />
                  <Button type="button" variant="outline" size="sm" onClick={() => addCustomTag("new")} disabled={!newTagInput.trim()}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                {newNoteTags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {newNoteTags.map((tag) => (
                      <Badge key={tag} variant="default" className={`cursor-pointer ${getTagColor(tag)}`} onClick={() => toggleTag(tag, "new")}>
                        {tag} <X className="ml-1 h-3 w-3" />
                      </Badge>
                    ))}
                  </div>
                )}
                {allTagsForCurrentUser.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    <p className="w-full text-xs text-muted-foreground">Vos tags existants :</p>
                    {allTagsForCurrentUser.map((tag) => (
                      <Badge key={tag} variant={newNoteTags.includes(tag) ? "default" : "outline"} className={`cursor-pointer ${newNoteTags.includes(tag) ? getTagColor(tag) : ""}`} onClick={() => toggleTag(tag, "new")}>
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex justify-end">
                <Button onClick={addNote} disabled={!newNoteContent.trim()}>
                  <Plus className="mr-2 h-4 w-4" /> Ajouter la note
                </Button>
              </div>
            </Card>

            {/* Notes List */}
            <div className={viewMode === "grid" ? "grid gap-4 md:grid-cols-2" : "space-y-4"}>
              {notesForSelectedDate.length === 0 ? (
                <Card className="p-12 text-center">
                  <p className="text-muted-foreground">Aucune note pour cette date.</p>
                </Card>
              ) : (
                notesForSelectedDate.map((note) => (
                  <Card key={note.id} className={`p-6 transition-shadow hover:shadow-md ${note.is_pinned ? "ring-2 ring-primary" : ""}`}>
                    {/* --- Always render display mode --- */}
                    <div>
                      <div className="mb-3 flex items-start justify-between gap-4">
                        <div className="flex-1">
                          {note.tags && note.tags.length > 0 && (
                            <div className="mb-2 flex flex-wrap gap-1">
                              {note.tags.map((tag) => ( <Badge key={tag} variant="secondary" className={getTagColor(tag)}>{tag}</Badge> ))}
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
                          <Button variant="ghost" size="icon" onClick={() => togglePin(note)} title={note.is_pinned ? "Désépingler" : "Épingler"}>
                            <Pin className={`h-4 w-4 ${note.is_pinned ? "fill-current" : ""}`} />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => toggleArchive(note)} title={note.is_archived ? "Désarchiver" : "Archiver"}>
                            <Archive className="h-4 w-4" />
                          </Button>
                          {/* --- Edit button now opens modal --- */}
                          <Button variant="ghost" size="icon" onClick={() => startEditing(note)} title="Éditer">
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => deleteNote(note.id)} title="Supprimer">
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    </div>
                    {/* --- End display mode --- */}
                  </Card>
                ))
              )}
            </div>
          </main>
        </div>
      </div>

      {/* --- Edit Modal --- */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[625px]">
          <DialogHeader>
            <DialogTitle>Éditer la note</DialogTitle>
            <DialogDescription>Modifiez le contenu et les tags de votre note.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <Textarea
              value={modalEditContent}
              onChange={(e) => setModalEditContent(e.target.value)}
              className="min-h-[150px] resize-none"
              autoFocus
            />
            <div className="space-y-3">
              <div className="flex gap-2">
                <Input
                  placeholder="Ajouter un tag..."
                  value={modalEditTagInput}
                  onChange={(e) => setModalEditTagInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addCustomTag("modal") } }}
                  className="flex-1"
                />
                <Button type="button" variant="outline" size="sm" onClick={() => addCustomTag("modal")} disabled={!modalEditTagInput.trim()}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              {modalEditTags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {modalEditTags.map((tag) => (
                    <Badge key={tag} variant="default" className={`cursor-pointer ${getTagColor(tag)}`} onClick={() => toggleTag(tag, "modal")}>
                      {tag} <X className="ml-1 h-3 w-3" />
                    </Badge>
                  ))}
                </div>
              )}
              {allTagsForCurrentUser.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  <p className="w-full text-xs text-muted-foreground">Vos tags existants :</p>
                  {allTagsForCurrentUser.map((tag) => (
                    <Badge key={tag} variant={modalEditTags.includes(tag) ? "default" : "outline"} className={`cursor-pointer ${modalEditTags.includes(tag) ? getTagColor(tag) : ""}`} onClick={() => toggleTag(tag, "modal")}>
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline" onClick={closeModal}> Annuler </Button>
            </DialogClose>
            <Button type="button" onClick={saveEdit} disabled={!modalEditContent.trim()}> Enregistrer </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* --- End Edit Modal --- */}

    </div>
  )
}