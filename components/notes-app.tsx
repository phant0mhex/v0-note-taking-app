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

// --- CORRECTION: fetcher DÉPLACÉ EN DEHORS DU COMPOSANT ---
const fetcher = async (url: string) => {
  const res = await fetch(url)
  if (!res.ok) {
    const error = new Error("An error occurred while fetching the data.")
    throw error
  }
  return res.json()
}
// --- FIN CORRECTION ---

const exportNotesToPDF = (notesToExport: Note[], selectedDate: Date) => {
  // ... (contenu de la fonction exportNotesToPDF) ...
}

const handleLogin = (user: string, setCurrentUser: React.Dispatch<React.SetStateAction<string | null>>) => {
  // ... (contenu de la fonction handleLogin) ...
}

const handleLogout = (setCurrentUser: React.Dispatch<React.SetStateAction<string | null>>) => {
  // ... (contenu de la fonction handleLogout) ...
}


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
    // ... (contenu de apiUrl useMemo) ...
  }, [searchQuery, selectedTag, showArchived, sortBy, showDeleted])

  const { data: notes, error, isLoading, mutate } = useSWR<Note[]>(apiUrl, fetcher, { // fetcher est maintenant défini
      // ... (options SWR) ...
    })

  const safeNotes = notes || []

  const notesForSelectedDate = useMemo(() => {
    // ... (contenu de notesForSelectedDate useMemo) ...
  }, [safeNotes, selectedDate, showDeleted])

  // ... (TOUTES les autres fonctions du composant : addNote, deleteNote, togglePin, etc.) ...
  // --- Assurez-vous que toutes les fonctions sont bien à l'intérieur de NotesApp ---
  const addNote = async () => { /* ... */ }
  const deleteNote = async (id: number) => { /* ... */ }
  const togglePin = async (note: Note) => { /* ... */ }
  const toggleArchive = async (note: Note) => { /* ... */ }
  const restoreNote = async (id: number) => { /* ... */ }
  const deletePermanently = async (id: number) => { /* ... */ }
  const startEditing = (note: Note) => { /* ... */ }
  const saveEdit = async (id: number) => { /* ... */ }
  const cancelEdit = () => { /* ... */ }
  const toggleTag = (tag: string, isEditing = false) => { /* ... */ }
  const addCustomTag = (isEditing = false) => { /* ... */ }
  const getTagColor = (tag: string) => { /* ... */ }
  const handleRenameTag = async (oldName: string) => { /* ... */ }
  const handleDeleteTag = async (tagName: string) => { /* ... */ }


  const allTagsForCurrentUser = useMemo(() => { /* ... */ }, [safeNotes, currentUser])
  const pinnedNotesForCurrentUser = safeNotes.filter(/* ... */)
  const activeNotesCountForCurrentUser = safeNotes.filter(/* ... */).length

  if (isLoading) { /* ... */ }
  if (error) { /* ... */ }
  if (!currentUser) { /* ... */ }

  return (
    <div className="min-h-screen bg-background">
      {/* ... (tout le JSX du composant) ... */}
    </div>
  )
}