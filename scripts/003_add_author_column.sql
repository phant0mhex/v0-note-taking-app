-- Ajouter la colonne author pour identifier l'auteur de chaque note
ALTER TABLE notes ADD COLUMN IF NOT EXISTS author VARCHAR(50);

-- Créer un index pour améliorer les performances de recherche par auteur
CREATE INDEX IF NOT EXISTS idx_notes_author ON notes(author);
