import type { Agreement } from "@/lib/types/agreement.types"

// Helper para simular delay
export const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

export const agreementsMock: Agreement[] = [
  {
    id: "1",
    name: "Service Agreement 2024",
    documentUrl: "https://example.com/documents/service-agreement-2024.pdf",
    createdAt: "2024-01-15T10:00:00Z",
    updatedAt: "2024-01-15T10:00:00Z",
  },
  {
    id: "2",
    name: "Business Partnership Agreement",
    documentUrl: "https://example.com/documents/partnership-agreement.pdf",
    createdAt: "2024-02-01T14:30:00Z",
    updatedAt: "2024-02-01T14:30:00Z",
  },
  {
    id: "3",
    name: "Non-Disclosure Agreement (NDA)",
    documentUrl: "https://example.com/documents/nda.pdf",
    createdAt: "2024-03-10T09:15:00Z",
    updatedAt: "2024-03-10T09:15:00Z",
  },
  {
    id: "4",
    name: "Employment Contract Template",
    documentUrl: "https://example.com/documents/employment-contract.pdf",
    createdAt: "2024-04-05T11:45:00Z",
    updatedAt: "2024-04-05T11:45:00Z",
  },
  {
    id: "5",
    name: "Data Processing Agreement",
    documentUrl: "https://example.com/documents/dpa.pdf",
    createdAt: "2024-05-20T16:20:00Z",
    updatedAt: "2024-05-20T16:20:00Z",
  },
]
