import axios from 'axios'

const api = axios.create({ baseURL: '/api' })

export interface MatchResult {
  filename: string
  score: number
  preview: string
}

export interface SentimentResult {
  text: string
  label: 'POSITIVE' | 'NEGATIVE'
  score: number
}

export const getResumeCount = () =>
  api.get<{ count: number }>('/resumes/count').then((r) => r.data)

export const indexLocalResumes = () =>
  api.post<{ indexed: number }>('/resumes/index-local').then((r) => r.data)

export const uploadResumes = (files: File[]) => {
  const form = new FormData()
  files.forEach((f) => form.append('files', f))
  return api.post<{ indexed: number; errors: string[] }>('/resumes/upload', form).then((r) => r.data)
}

export const matchCandidates = (job_description: string, n_results: number) =>
  api.post<MatchResult[]>('/match', { job_description, n_results }).then((r) => r.data)

export const analyzeSentiment = (feedbacks: string[]) =>
  api.post<SentimentResult[]>('/sentiment', { feedbacks }).then((r) => r.data)
