import type { ExtractorFormData } from '@/types/extractor'

/**
 * Mock API service for extractor operations
 * This simulates backend API calls with realistic delays and responses
 */

export interface ExtractorResponse {
  id: string
  createdAt: string
  updatedAt: string
  data: ExtractorFormData
}

/**
 * Simulates creating a new extractor
 * @param data - Extractor form data
 * @returns Promise with created extractor response
 */
export async function createExtractor(data: ExtractorFormData): Promise<ExtractorResponse> {
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 1500))

  // Mock successful response
  const response: ExtractorResponse = {
    id: `extractor_${Date.now()}`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    data,
  }

  // Log the submission for debugging
  console.log('📤 Extractor Created:', response)

  return response
}

/**
 * Simulates updating an existing extractor
 * @param id - Extractor ID
 * @param data - Updated extractor form data
 * @returns Promise with updated extractor response
 */
export async function updateExtractor(
  id: string,
  data: ExtractorFormData
): Promise<ExtractorResponse> {
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 1500))

  // Mock successful response
  const response: ExtractorResponse = {
    id,
    createdAt: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
    updatedAt: new Date().toISOString(),
    data,
  }

  // Log the submission for debugging
  console.log('📤 Extractor Updated:', response)

  return response
}

/**
 * Simulates testing a extractor with sample data
 * @param data - Extractor form data
 * @returns Promise with test results
 */
export async function testExtractor(data: ExtractorFormData): Promise<{
  success: boolean
  extractedData: Record<string, unknown>
  processingTime: number
}> {
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 2000))

  // Mock test results
  const result = {
    success: true,
    extractedData: {
      vendor_name: 'Acme Corporation',
      total_amount: 1250.5,
      invoice_date: '2024-01-15',
    },
    processingTime: 1.8,
  }

  console.log('🧪 Extractor Test Result:', result)

  return result
}
