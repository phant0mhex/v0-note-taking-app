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
  // ... (états existants) ...
  const [showTagManager, setShowTagManager] = useState(false)
  const [renamingTag, setRenamingTag] = useState<string | null>(null)
  const [newTagName, setNewTagName] = useState("")

  // --- Nouvel état pour la corbeille ---
  const [showDeleted, setShowDeleted] = useState(false)
  // --- Fin état corbeille ---

  // Adapte l'API URL pour inclure showDeleted
  const apiUrl = useMemo(() => {
    const params = new URLSearchParams()
    if (searchQuery) params.append("search", searchQuery)
    if (selectedTag) params.append("tag", selectedTag)
    // Ne pas appliquer le filtre 'archived' si on est dans la corbeille
    if (showArchived && !showDeleted) params.append("showArchived", "true")
    if (showDeleted) params.append("showDeleted", "true") // Ajout du paramètre
    params.append("sortBy", sortBy)
    return `/api/notes?${params}`
  }, [searchQuery, selectedTag, showArchived, sortBy, showDeleted]) // Ajout de showDeleted aux dépendances

  const { data: notes, error, isLoading, mutate } = useSWR<Note[]>(apiUrl, fetcher, {
      refreshInterval: 5000,
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
      fallbackData: [],
    })

  const safeNotes = notes || []

  // notesForSelectedDate affiche maintenant soit les notes actives/archivées, soit la corbeille
  const notesForSelectedDate = useMemo(() => {
    const selectedDateStr = format(selectedDate, "yyyy-MM-dd")
    // Le filtrage deleted/active est fait par l'API via le paramètre showDeleted
    // On filtre juste par date ici si on n'est PAS en mode corbeille
    if (!showDeleted) {
       return safeNotes.filter((note) => note.date === selectedDateStr)
    }
    // Si on est en mode corbeille, on affiche toutes les notes retournées par l'API (qui a déjà filtré deleted_at != NULL)
    return safeNotes;
  }, [safeNotes, selectedDate, showDeleted]) // Ajout de showDeleted

  // ... (addNote, togglePin, toggleArchive) ...

  // MODIFIE deleteNote pour appeler le soft delete
  const deleteNote = async (id: number) => {
    try {
      mutate( safeNotes.filter((note) => note.id !== id), false ) // Optimistic update
      // Appel à l'API DELETE standard (qui fait le soft delete maintenant)
      const response = await fetch(`/api/notes/${id}`, { method: "DELETE" })
      if (!response.ok) {
         console.error("Failed to soft delete note")
         mutate() // Revert
      } else {
         mutate() // Revalidate
      }
    } catch (error) {
      console.error("[v0] Error soft deleting note:", error)
      mutate() // Revert
    }
  }

  // --- Nouvelles fonctions pour la corbeille ---
  const restoreNote = async (id: number) => {
    try {
        mutate( safeNotes.filter((note) => note.id !== id), false ) // Optimistic update (remove from trash view)
        // Appel à la nouvelle route de restauration (utilisant POST)
        const response = await fetch(`/api/notes/${id}/restore`, { method: "POST" })
        if (!response.ok) {
            console.error("Failed to restore note")
            mutate() // Revert
        } else {
            mutate() // Revalidate
        }
    } catch (error) {
        console.error("[v0] Error restoring note:", error)
        mutate() // Revert
    }
  }

  const deletePermanently = async (id: number) => {
    if (window.confirm("Supprimer définitivement cette note ? Cette action est irréversible.")) {
        try {
            mutate( safeNotes.filter((note) => note.id !== id), false ) // Optimistic update
            // Appel à l'API DELETE avec le paramètre 'permanent'
            const response = await fetch(`/api/notes/${id}?permanent=true`, { method: "DELETE" })
             if (!response.ok) {
                console.error("Failed to permanently delete note")
                mutate() // Revert
            } else {
                mutate() // Revalidate
            }
        } catch (error) {
            console.error("[v0] Error permanently deleting note:", error)
            mutate() // Revert
        }
    }
  }
  // --- Fin fonctions corbeille ---


  // ... (startEditing, saveEdit, cancelEdit) ...
  // ... (toggleTag, addCustomTag, getTagColor) ...
  // ... (allTagsForCurrentUser, pinnedNotesForCurrentUser, activeNotesCountForCurrentUser) ...
  // ... (handleRenameTag, handleDeleteTag - gestion tags) ...

  // ... (if isLoading, if error, if !currentUser) ...

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-7xl px-4 py-8 md:py-12">
        {/* ... (Header - Export utilise toujours notesForSelectedDate) ... */}

        {/* Search and Filters */}
        <div className="mb-6 flex flex-wrap gap-3">
          {/* ... (Search Input, Sort Select, View Mode Button) ... */}

          {/* --- Modification des boutons Archive/Corbeille --- */}
          <Button
            variant={showArchived ? "default" : "outline"}
            onClick={() => { setShowArchived(!showArchived); setShowDeleted(false); }} // Désactive la corbeille si on active les archives
            disabled={showDeleted} // Désactive si on est dans la corbeille
          >
            <Archive className="mr-2 h-4 w-4" /> Archivées
          </Button>
          <Button
            variant={showDeleted ? "destructive" : "outline"} // Style différent pour la corbeille
            onClick={() => { setShowDeleted(!showDeleted); setShowArchived(false); }} // Désactive les archives si on active la corbeille
          >
            <Trash className="mr-2 h-4 w-4" /> Corbeille
          </Button>
          {/* --- Fin modification --- */}
        </div>

        {/* ... (Section Gestion des Tags - Conditionnelle sur !showDeleted) ... */}
        { !showDeleted && (
            <div className="mb-6">
                {/* Boutons Filtres Tags */}
                {allTagsForCurrentUser.length > 0 && ( /* ... */ )}
                {/* Carte de Gestion des Tags (conditionnelle) */}
                {showTagManager && allTagsForCurrentUser.length > 0 && ( /* ... */ )}
                {showTagManager && allTagsForCurrentUser.length === 0 && ( /* ... */ )}
            </div>
        )}


        <div className="grid gap-8 lg:grid-cols-[320px_1fr]">
          {/* Sidebar - Masquée si on est dans la corbeille ? Ou adaptée ? Pour l'instant on la laisse */}
          <aside className="space-y-6">
            {/* ... (Calendar Card - Peut-être désactiver la sélection si showDeleted ?) ... */}
            {/* ... (Stats Card - Pourrait afficher le nombre d'éléments dans la corbeille si showDeleted) ... */}
          </aside>

          {/* Main Content */}
          <main className="space-y-6">
            {/* Date Header / Corbeille Header */}
            <div className="border-b border-border pb-4">
              {showDeleted ? (
                 <>
                  <h2 className="text-2xl font-bold text-destructive">Corbeille</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {notesForSelectedDate.length} {notesForSelectedDate.length !== 1 ? "notes supprimées" : "note supprimée"}
                  </p>
                 </>
              ) : (
                <>
                  <h2 className="text-2xl font-bold text-foreground">
                    {format(selectedDate, "EEEE d MMMM yyyy", { locale: fr })}
                  </h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {notesForSelectedDate.length} {notesForSelectedDate.length !== 1 ? "notes" : "note"}
                  </p>
                </>
              )}
            </div>

            {/* New Note Form - Masqué si on est dans la corbeille */}
            { !showDeleted && (
                <Card className="p-6"> /* ... (Formulaire Nouvelle Note) ... */ </Card>
            )}

            {/* Notes List / Corbeille List */}
            <div className={viewMode === "grid" && !showDeleted ? "grid gap-4 md:grid-cols-2" : "space-y-4"}>
              {notesForSelectedDate.length === 0 ? (
                <Card className="p-12 text-center">
                  <p className="text-muted-foreground">
                    {showDeleted ? "La corbeille est vide." : "Aucune note pour cette date."}
                  </p>
                  { !showDeleted && <p className="mt-2 text-sm text-muted-foreground">Commencez à écrire...</p> }
                </Card>
              ) : (
                notesForSelectedDate.map((note) => (
                  <Card key={note.id} className={`p-6 transition-shadow ${ showDeleted ? 'opacity-70 hover:opacity-100' : 'hover:shadow-md' } ${note.is_pinned && !showDeleted ? "ring-2 ring-primary" : ""}`}>
                    {editingNoteId === note.id && !showDeleted ? (
                      /* ... (Formulaire d'édition en place) ... */
                       <div className="space-y-4">
                         {/* ... Textarea, Inputs Tags, Buttons Save/Cancel ... */}
                       </div>
                    ) : (
                      <div>
                        <div className="mb-3 flex items-start justify-between gap-4">
                          <div className="flex-1">
                            {/* ... (Affichage Tags, Contenu) ... */}
                            <p className="whitespace-pre-wrap text-foreground leading-relaxed">{note.content}</p>
                            <p className="mt-3 text-xs text-muted-foreground">
                               {note.author && <span className="font-medium">{note.author}</span>}
                               {note.author && " • "}
                                {/* --- Affichage différent si dans la corbeille --- */}
                                {showDeleted && note.deleted_at ? (
                                    <>Supprimée {formatDistanceToNow(new Date(note.deleted_at), { locale: fr, addSuffix: true })}</>
                                ) : (
                                    <>Créée: {format(new Date(note.created_at), "HH:mm", { locale: fr })} • Modifiée:{" "} {format(new Date(note.updated_at), "HH:mm", { locale: fr })}</>
                                )}
                                {/* --- Fin affichage différent --- */}
                            </p>
                          </div>
                          {/* --- Boutons d'action différents dans la corbeille --- */}
                          {showDeleted ? (
                            <div className="flex gap-1">
                              <Button variant="ghost" size="icon" onClick={() => restoreNote(note.id)} title="Restaurer">
                                <RotateCcw className="h-4 w-4 text-green-600" />
                              </Button>
                              <Button variant="ghost" size="icon" onClick={() => deletePermanently(note.id)} title="Supprimer définitivement">
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
                          ) : (
                            <div className="flex gap-1">
                              {/* ... (Boutons Pin, Archive, Edit, Delete (soft)) ... */}
                              <Button variant="ghost" size="icon" onClick={() => togglePin(note)} title={note.is_pinned ? "Désépingler" : "Épingler"}> <Pin className={`h-4 w-4 ${note.is_pinned ? "fill-current" : ""}`} /> </Button>
                              <Button variant="ghost" size="icon" onClick={() => toggleArchive(note)} title={note.is_archived ? "Désarchiver" : "Archiver"}> <Archive className="h-4 w-4" /> </Button>
                              <Button variant="ghost" size="icon" onClick={() => startEditing(note)} title="Éditer"> <Edit2 className="h-4 w-4" /> </Button>
                              <Button variant="ghost" size="icon" onClick={() => deleteNote(note.id)} title="Mettre à la corbeille"> <Trash className="h-4 w-4 text-destructive" /> </Button> {/* Changé l'icône pour la corbeille simple */}
                            </div>
                          )}
                          {/* --- Fin boutons d'action --- */}
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