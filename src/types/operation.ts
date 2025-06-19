export interface FileOperation {
  id: string
  type: 'read' | 'create' | 'move' | 'delete' | 'analyze'
  sourcePath?: string
  targetPath: string
  status: 'pending' | 'in_progress' | 'completed' | 'failed'
  metadata: FileMetadata
}

export interface FileMetadata {
  size: number
  type: string
  subject?: string
  topics: string[]
  difficulty?: 'beginner' | 'intermediate' | 'advanced'
  lastModified: Date
}