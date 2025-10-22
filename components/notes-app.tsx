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
  Trash2, // Icône pour la corbeille et suppression permanente
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
  Settings, Edit, Trash, Save, Ban, // Icônes gestion tags
  RotateCcw, // Icône pour restaurer
  AlertTriangle // Icône pour confirmation
} from "lucide-react"
import { format, formatDistanceToNow } from "date-fns" // Ajout de formatDistanceToNow
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
  deleted_at: string | null // Ajout de deleted_at
}

// ... (TAG_COLORS, exportNotesToPDF, handleLogin, handleLogout, fetcher) ...

export function NotesApp() {
  const [currentUser, setCurrentUser] = useState<string | null>(null)
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [newNoteContent, setNewNoteContent] = useState("")
  const [newNoteTags, setNewNoteTags] = useState<string[]>([])
  const [newTagInput, setNewTagInput] = useState("")
  const [showCalendar, setShowCalendar] = useState(false)
  const [editingNoteId, setEditingNoteId] = useState<number | null>(null)
  const [editContent, setEditContent] = useState("")
  const [editTags, setEditTags] = useState<string[]>([])
  const [editTagInput, setEditTagInput] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedTag, setSelectedTag] = useState<string | null>(null)
  const [showArchived, setShowArchived] = useState(false)
  const [sortBy, setSortBy] = useState<"date" | "updated" | "alpha">("date")
  const [viewMode, setViewMode] = useState<"grid" | "list">("list")
  const { theme, setTheme } = useTheme()
  const [showTagManager, setShowTagManager] = useState(false)
  const [renamingTag, setRenamingTag] = useState<string | null>(null)
  const [newTagName, setNewTagName] = useState("")
  const [showDeleted, setShowDeleted] = useState(false)


  const apiUrl = useMemo(() => {
    const params = new URLSearchParams()
    if (searchQuery) params.append("search", searchQuery)
    if (selectedTag) params.append("tag", selectedTag)
    if (showArchived && !showDeleted) params.append("showArchived", "true")
    if (showDeleted) params.append("showDeleted", "true")
    params.append("sortBy", sortBy)
    return `/api/notes?${params}`
  }, [searchQuery, selectedTag, showArchived, sortBy, showDeleted])

  const { data: notes, error, isLoading, mutate } = useSWR<Note[]>(apiUrl, fetcher, {
      refreshInterval: 5000,
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
      fallbackData: [],
    })

  const safeNotes = notes || []

  const notesForSelectedDate = useMemo(() => {
    const selectedDateStr = format(selectedDate, "yyyy-MM-dd")
    if (!showDeleted) {
       return safeNotes.filter((note) => note.date === selectedDateStr)
    }
    return safeNotes;
  }, [safeNotes, selectedDate, showDeleted])

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

  const deleteNote = async (id: number) => { // Soft delete
    try {
      mutate( safeNotes.filter((note) => note.id !== id), false )
      const response = await fetch(`/api/notes/${id}`, { method: "DELETE" })
      if (!response.ok) { console.error("Failed to soft delete note"); mutate() }
      else { mutate() }
    } catch (error) { console.error("[v0] Error soft deleting note:", error); mutate() }
  }

  const togglePin = async (note: Note) => {
    try {
      mutate( safeNotes.map((n) => (n.id === note.id ? { ...n, is_pinned: !n.is_pinned } : n)), false )
      const response = await fetch(`/api/notes/${note.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ is_pinned: !note.is_pinned }), })
      if (!response.ok) mutate(); else mutate()
    } catch (error) { console.error("[v0] Error toggling pin:", error); mutate() }
  }

  const toggleArchive = async (note: Note) => {
    try {
      mutate( safeNotes.map((n) => (n.id === note.id ? { ...n, is_archived: !n.is_archived } : n)), false )
      const response = await fetch(`/api/notes/${note.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ is_archived: !note.is_archived }), })
      if (!response.ok) mutate(); else mutate()
    } catch (error) { console.error("[v0] Error toggling archive:", error); mutate() }
  }

  const restoreNote = async (id: number) => {
    try {
        mutate( safeNotes.filter((note) => note.id !== id), false )
        const response = await fetch(`/api/notes/${id}/restore`, { method: "POST" }) // Assuming route exists
        if (!response.ok) { console.error("Failed to restore note"); mutate() }
        else { mutate() }
    } catch (error) { console.error("[v0] Error restoring note:", error); mutate() }
  }

  const deletePermanently = async (id: number) => {
    if (window.confirm("Supprimer définitivement cette note ? Cette action est irréversible.")) {
      try { // <<<< CORRECTION: Ajout du bloc try ici
          mutate( safeNotes.filter((note) => note.id !== id), false )
          const response = await fetch(`/api/notes/${id}?permanent=true`, { method: "DELETE" }) // Assuming API handles query param
           if (!response.ok) {
              console.error("Failed to permanently delete note")
              mutate()
          } else {
              mutate()
          }
      } catch (error) { // <<<< CORRECTION: Fin du bloc try, début du catch
          console.error("[v0] Error permanently deleting note:", error)
          mutate()
      } // <<<< CORRECTION: Accolade fermante pour le catch ajoutée ici
    } // Accolade fermante pour le if(window.confirm)
  }

  const startEditing = (note: Note) => { /* ... */ }
  const saveEdit = async (id: number) => { /* ... */ }
  const cancelEdit = () => { /* ... */ }
  const toggleTag = (tag: string, isEditing = false) => { /* ... */ }
  const addCustomTag = (isEditing = false) => { /* ... */ }
  const getTagColor = (tag: string) => { /* ... */ }

  const allTagsForCurrentUser = useMemo(() => { /* ... */ }, [safeNotes, currentUser])
  const pinnedNotesForCurrentUser = safeNotes.filter(/* ... */)
  const activeNotesCountForCurrentUser = safeNotes.filter(/* ... */).length

  const handleRenameTag = async (oldName: string) => { /* ... (avec appel API simulé ou réel) ... */ }
  const handleDeleteTag = async (tagName: string) => { /* ... (avec appel API simulé ou réel) ... */ }

  if (isLoading) { return ( <div className="min-h-screen bg-background flex items-center justify-center"><p className="text-muted-foreground">Chargement...</p></div> ) }
  if (error) { return ( <div className="min-h-screen bg-background flex items-center justify-center"><p className="text-destructive">Erreur lors du chargement des notes</p></div> ) }
  if (!currentUser) { return <Login onLogin={(user: string) => handleLogin(user, setCurrentUser)} /> }

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-7xl px-4 py-8 md:py-12">
        {/* Header */}
        <header className="mb-8 flex items-center justify-between">
            {/* ... Contenu du Header ... */}
            <Button variant="outline" size="icon" onClick={() => exportNotesToPDF(notesForSelectedDate, selectedDate)} title="Exporter en PDF (cette date)"> <Download className="h-4 w-4" /> </Button>
        </header>

        {/* Search and Filters */}
        <div className="mb-6 flex flex-wrap gap-3">
             {/* ... Input Search, Select Sort, Button View Mode ... */}
            <Button variant={showArchived ? "default" : "outline"} onClick={() => { setShowArchived(!showArchived); setShowDeleted(false); }} disabled={showDeleted}> <Archive className="mr-2 h-4 w-4" /> Archivées </Button>
            <Button variant={showDeleted ? "destructive" : "outline"} onClick={() => { setShowDeleted(!showDeleted); setShowArchived(false); }}> <Trash className="mr-2 h-4 w-4" /> Corbeille </Button>
        </div>

        {/* Section Gestion des Tags (conditionnelle) */}
        { !showDeleted && ( <div className="mb-6"> {/* ... Contenu Gestion Tags ... */} </div> )}

        <div className="grid gap-8 lg:grid-cols-[320px_1fr]">
          {/* Sidebar */}
          <aside className="space-y-6"> {/* ... Contenu Sidebar ... */} </aside>

          {/* Main Content */}
          <main className="space-y-6">
            {/* Header (Date ou Corbeille) */}
            <div className="border-b border-border pb-4"> {/* ... Contenu Header ... */} </div>

            {/* New Note Form (conditionnel) */}
            { !showDeleted && ( <Card className="p-6"> {/* ... Formulaire Nouvelle Note ... */} </Card> )}

            {/* Notes List / Corbeille List */}
            <div className={viewMode === "grid" && !showDeleted ? "grid gap-4 md:grid-cols-2" : "space-y-4"}>
              {notesForSelectedDate.length === 0 ? (
                <Card className="p-12 text-center"> {/* ... Message Vide ... */} </Card>
              ) : (
                notesForSelectedDate.map((note) => (
                  <Card key={note.id} className={`p-6 transition-shadow ${ showDeleted ? 'opacity-70 hover:opacity-100' : 'hover:shadow-md' } ${note.is_pinned && !showDeleted ? "ring-2 ring-primary" : ""}`}>
                    {editingNoteId === note.id && !showDeleted ? (
                       <div className="space-y-4"> {/* ... Formulaire Edit en place ... */} </div>
                    ) : (
                      <div>
                        <div className="mb-3 flex items-start justify-between gap-4">
                          <div className="flex-1">
                             {/* ... Affichage Tags, Contenu ... */}
                             <p className="mt-3 text-xs text-muted-foreground">
                               {/* ... Affichage Auteur ... */}
                               {showDeleted && note.deleted_at ? (<>Supprimée {formatDistanceToNow(new Date(note.deleted_at), { locale: fr, addSuffix: true })}</>)
                               : (<>Créée: {format(new Date(note.created_at), "HH:mm", { locale: fr })} • Modifiée: {format(new Date(note.updated_at), "HH:mm", { locale: fr })}</>)}
                            </p>
                          </div>
                          {/* Boutons d'action conditionnels */}
                          {showDeleted ? (
                            <div className="flex gap-1">
                              <Button variant="ghost" size="icon" onClick={() => restoreNote(note.id)} title="Restaurer"> <RotateCcw className="h-4 w-4 text-green-600" /> </Button>
                              <Button variant="ghost" size="icon" onClick={() => deletePermanently(note.id)} title="Supprimer définitivement"> <Trash2 className="h-4 w-4 text-destructive" /> </Button>
                            </div>
                          ) : (
                            <div className="flex gap-1">
                               {/* ... Boutons Pin, Archive, Edit, Delete (soft) ... */}
                               <Button variant="ghost" size="icon" onClick={() => deleteNote(note.id)} title="Mettre à la corbeille"> <Trash className="h-4 w-4 text-destructive" /> </Button>
                            </div>
                          )}
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
} // <<<<< FIN DU COMPOSANT NotesApp