import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useEffect } from 'react';
import { useCreateWorkflows } from '@/api/endpoints/workflows/workflows';
import { toast } from 'sonner';

export const Route = createFileRoute('/autoruns/new')({
	component: NewWorkflowRedirect,
});

function NewWorkflowRedirect() {
	const navigate = useNavigate();
	const createWorkflow = useCreateWorkflows();

	useEffect(() => {
		// Automatically create a new workflow and redirect to builder
		const create = async () => {
			try {
				const workflow = await createWorkflow.mutateAsync({
					data: {
						name: 'New Workflow',
						definition: {
							nodes: [],
							connections: [],
						},
					},
				});

				navigate({ to: '/autoruns/builder/$id', params: { id: workflow.id } });
			} catch (error) {
				toast.error('Failed to create workflow');
				navigate({ to: '/autoruns' });
			}
		};

		create();
	}, [createWorkflow, navigate]);

	return (
		<div className="fixed inset-0 bg-cream flex items-center justify-center">
			<div className="text-center">
				<div className="animate-spin w-16 h-16 border-4 border-black border-t-transparent rounded-full mx-auto mb-4" />
				<p className="font-display font-bold uppercase text-lg">
					Creating workflow...
				</p>
			</div>
		</div>
	);
}
