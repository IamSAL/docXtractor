import type { PipelineFormData } from '@/types/pipeline'

/**
 * Mock API service for pipeline operations
 * This simulates backend API calls with realistic delays and responses
 */

export interface PipelineResponse {
  id: string
  createdAt: string
  updatedAt: string
  data: PipelineFormData
}

/**
 * Simulates creating a new pipeline
 * @param data - Pipeline form data
 * @returns Promise with created pipeline response
 */
export async function createPipeline(data: PipelineFormData): Promise<PipelineResponse> {
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 1500))

  // Mock successful response
  const response: PipelineResponse = {
    id: `pipeline_${Date.now()}`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    data,
  }

  // Log the submission for debugging
  console.log('📤 Pipeline Created:', response)

  return response
}

/**
 * Simulates updating an existing pipeline
 * @param id - Pipeline ID
 * @param data - Updated pipeline form data
 * @returns Promise with updated pipeline response
 */
export async function updatePipeline(
  id: string,
  data: PipelineFormData
): Promise<PipelineResponse> {
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 1500))

  // Mock successful response
  const response: PipelineResponse = {
    id,
    createdAt: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
    updatedAt: new Date().toISOString(),
    data,
  }

  // Log the submission for debugging
  console.log('📤 Pipeline Updated:', response)

  return response
}

/**
 * Simulates testing a pipeline with sample data
 * @param data - Pipeline form data
 * @returns Promise with test results
 */
export async function testPipeline(data: PipelineFormData): Promise<{
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

  console.log('🧪 Pipeline Test Result:', result)

  return result
}
