import type { JSONSchema } from '@/components/jsonjoy/types/jsonSchema'
import type { FewShotExample } from '@/components/extractors/FewShotExamples'

export interface ExtractorFormData {
  // Basic Information
  name: string
  thumbnailUrl?: string
  description: string

  // Field Schema
  schema: JSONSchema

  // Advanced Options
  systemPrompt: string
  fewShotExamples: FewShotExample[]

  // Extraction Settings - Consensus Voting
  consensusEnabled: boolean
  confidenceThreshold: number
  conflictResolution: 'majority' | 'highest_confidence' | 'human_review' | 'conservative'

  // Extraction Settings - Citation Tracking
  citationEnabled: boolean
  citationIncludePdfPage: boolean
  citationIncludeBbox: boolean
  citationIncludeParagraphId: boolean

  // Extraction Settings - Model Parameters
  contextWindow: string
  defaultModel: string
}

export const defaultExtractorFormValues: ExtractorFormData = {
  name: 'Standard Invoice Processor',
  thumbnailUrl: '',
  description: 'Extracts total, date, vendor address, and line items from standard PDF invoices.',
  schema: {
    type: 'object',
    properties: {
      'Vendor Name': {
        type: 'string',
        description: 'The name of the vendor',
      },
      'Total Amount': {
        type: 'number',
        description: 'The total amount of the invoice',
      },
      'Invoice Date': {
        type: 'string',
        format: 'date',
        description: 'The date of the invoice',
      },
    },
    required: ['Vendor Name', 'Total Amount'],
  },
  systemPrompt:
    'You are an expert accountant specializing in data extraction from financial documents. Your goal is to accurately identify and extract the Vendor Name, Total Amount, and Invoice Date from the provided invoice text. Ensure dates are formatted as YYYY-MM-DD and currency symbols are removed from the Total Amount. If a field is ambiguous, mark it as null.',
  fewShotExamples: [
    {
      id: '1',
      name: 'Example 1',
      sources: [],
      output: '{\n  "vendor_name": "Burger King",\n  "total_amount": 15.00,\n  "invoice_date": "2023-04-12"\n}',
    },
  ],
  consensusEnabled: false,
  confidenceThreshold: 85,
  conflictResolution: 'majority',
  citationEnabled: false,
  citationIncludePdfPage: false,
  citationIncludeBbox: false,
  citationIncludeParagraphId: false,
  contextWindow: '128k',
  defaultModel: 'gpt-4o',
}
