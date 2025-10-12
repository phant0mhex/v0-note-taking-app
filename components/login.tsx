"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { User } from "lucide-react"

const USERS = ["Thomas", "Rodrigue", "Nicolas"]

interface LoginProps {
  onLogin: (username: string) => void
}

export function Login({ onLogin }: LoginProps) {
  const [selectedUser, setSelectedUser] = useState<string>("")

  const handleLogin = () => {
    if (selectedUser) {
      onLogin(selectedUser)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <img
              src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/logo-xgc1KdmrfZYaDZ9oO0LNC3ZMWfG4a7.png"
              alt="Enculator Logo"
              className="h-20 w-20 object-contain"
            />
          </div>
          <CardTitle className="text-3xl font-light">Enculator</CardTitle>
          <CardDescription>Sélectionnez votre profil pour continuer</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3">
            {USERS.map((user) => (
              <Button
                key={user}
                variant={selectedUser === user ? "default" : "outline"}
                className="w-full justify-start gap-3 h-14 text-lg"
                onClick={() => setSelectedUser(user)}
              >
                <User className="h-5 w-5" />
                {user}
              </Button>
            ))}
          </div>
          <Button className="w-full h-12 text-base" onClick={handleLogin} disabled={!selectedUser}>
            Se connecter
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
