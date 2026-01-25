import { createFileRoute } from '@tanstack/react-router'
import { ExtractionSettings } from '@/components/pipelines/ExtractionSettings'
import { useForm } from 'react-hook-form'
import type { PipelineFormData } from '@/types/pipeline'
import { defaultPipelineFormValues } from '@/types/pipeline'
import { Button } from '@/components/retroui/Button'
import { toast } from 'sonner'

export const Route = createFileRoute('/settings/extraction')({
  component: RouteComponent,
})

function RouteComponent() {
  // Initialize form with default values for global settings
  const { control, handleSubmit, formState: { isDirty } } = useForm<PipelineFormData>({
    defaultValues: defaultPipelineFormValues,
  })

  const onSubmit = async (data: PipelineFormData) => {
    // Mock save global settings
    console.log('💾 Saving global extraction settings:', data)
    toast.success('Global extraction settings saved!')
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 mb-24">
        <div className="xl:col-span-8 flex flex-col gap-6">
          <ExtractionSettings showHeader={true} control={control} />

          {/* Save button */}
          <div className="flex justify-end">
            <Button type="submit" disabled={!isDirty}>
              <span className="material-symbols-outlined text-[18px] filled mr-2">save</span>
              Save Global Settings
            </Button>
          </div>
        </div>
        <div className="xl:col-span-4 flex flex-col gap-6">
          <div className="sticky top-24">
            <div className="bg-gray-800 text-white xdark:bg-white xdark:text-text-main rounded-xl p-6 shadow-neubrutal mb-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-lg">Extraction Health</h3>
                <span className="material-symbols-outlined">ecg_heart</span>
              </div>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-xs font-mono opacity-80 mb-1">
                    <span>Success Rate</span>
                    <span>98.2%</span>
                  </div>
                  <div className="w-full bg-white/20 xdark:bg-black/10 rounded-full h-2">
                    <div
                      className="bg-primary h-2 rounded-full"
                      style={{ width: '98%' }}
                    />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-xs font-mono opacity-80 mb-1">
                    <span>Token Usage</span>
                    <span>1.2M / 2M</span>
                  </div>
                  <div className="w-full bg-white/20 xdark:bg-black/10 rounded-full h-2">
                    <div
                      className="bg-primary h-2 rounded-full"
                      style={{ width: '60%' }}
                    />
                  </div>
                </div>
              </div>
              <div className="mt-6 pt-4 border-t border-white/20 xdark:border-black/10">
                <p className="text-xs opacity-70">Last optimized: 2 mins ago</p>
              </div>
            </div>
            <div className="bg-[#f0f9ff] xdark:bg-blue-900/20 border border-blue-200 xdark:border-blue-800 rounded-xl p-5">
              <div className="flex gap-3">
                <span className="material-symbols-outlined text-blue-600 xdark:text-blue-400">
                  lightbulb
                </span>
                <div>
                  <h4 className="font-bold text-sm text-blue-900 xdark:text-blue-100">
                    Did you know?
                  </h4>
                  <p className="text-xs text-blue-800 xdark:text-blue-200 mt-1 leading-relaxed">
                    Increasing the confidence threshold above 90% may result in more
                    documents being flagged for manual review but significantly
                    reduces hallucination risk.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </form>
  )
}
