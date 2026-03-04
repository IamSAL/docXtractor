import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import "jsonjoy-builder/styles.css";
// @ts-ignore
import { type JSONSchema, SchemaVisualEditor } from "jsonjoy-builder";
import { AppLayout } from '@/components/AppLayout';

export const Route = createFileRoute('/demo')({
    component: DemoComponent,
})

function DemoComponent() {
    const [schema, setSchema] = useState<JSONSchema>({
        type: "object",
        properties: {
            name: { type: "string", title: "Name" },
            age: { type: "integer", title: "Age" }
        }
    });

    return (
        <AppLayout>
            <div className="p-8 w-full h-full overflow-y-auto bg-background-light dark:text-white">
                <div className="max-w-6xl mx-auto space-y-6">
                    <div>
                        <h1 className="text-3xl font-black mb-2">JSON Schema Builder</h1>
                        <p className="text-text-secondary-light dark:text-text-secondary-dark">
                            Visual editor for constructing JSON schemas.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-[calc(100vh-200px)]">
                        <div className="lg:col-span-2 flex flex-col h-full bg-white dark:bg-gray-800 rounded-xl border-2 border-black shadow-hard overflow-hidden">
                            <div className="flex-1 overflow-auto p-4 jsonjoy">
                                {/* @ts-ignore */}
                                <SchemaVisualEditor schema={schema} onChange={setSchema} />
                            </div>
                        </div>

                        <div className="bg-gray-900 rounded-xl border-2 border-black shadow-hard overflow-hidden flex flex-col">
                            <div className="bg-black px-4 py-2 flex items-center justify-between">
                                <span className="text-white font-bold font-mono text-sm">schema.json</span>
                                <div className="flex gap-1.5">
                                    <div className="w-2.5 h-2.5 rounded-full bg-red-500"></div>
                                    <div className="w-2.5 h-2.5 rounded-full bg-yellow-500"></div>
                                    <div className="w-2.5 h-2.5 rounded-full bg-green-500"></div>
                                </div>
                            </div>
                            <pre className="p-4 overflow-auto text-xs font-mono text-green-400 flex-1">
                                {JSON.stringify(schema, null, 2)}
                            </pre>
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    )
}
