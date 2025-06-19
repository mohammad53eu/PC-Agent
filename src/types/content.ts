export interface GeneratedContent {
  id: string
  type: 'exam' | 'readme' | 'Chapter' | 'other'
  subject: string
  difficulty: string
  content: string
  filePath: string
}

export interface CourseStructure {
  title: string
  description: string
  chapters?: Chapter[]
  exams?: Exam[]
  readme?: Readme[]
  others?: Other[]
  prerequisites: string[]
  estimatedDuration: string
}

export interface Chapter {
  id: string
  title: string
  description: string           
}

export interface Exercise {
  title: string
  description: string
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  solution?: string
  hints: string[]
}

export interface Project {
  title: string
  description: string
  requirements: string[]
  estimatedTime: string
  deliverables: string[]
}

export interface Exam {
  id: string
  title: string
  description: string
}

export interface Readme {
  id: string
  title: string
  description: string
}

export interface Other {
  id: string
  title: string
  description: string
}
