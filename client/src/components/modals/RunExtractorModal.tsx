import NiceModal, { useModal } from "@ebay/nice-modal-react";
import { Dialog } from "@/components/retroui/Dialog";
import { RunExtractorForm } from "@/components/RunExtractorForm";

interface RunExtractorModalProps {
  extractorName?: string;
  extractorId?: string;
}

export const RunExtractorModal = NiceModal.create(
  ({
    extractorName: propName,
    extractorId: propId,
  }: RunExtractorModalProps) => {
    const modal = useModal();

    return (
      <Dialog
        open={modal.visible}
        onOpenChange={(open) => !open && modal.hide()}
      >
        <Dialog.Content
          className="max-w-4xl p-0 border-4 border-black bg-white shadow-hard-lg"
          size="auto"
        >
          <RunExtractorForm
            extractorId={propId}
            extractorName={propName}
            onSuccess={() => {
              modal.resolve("success");
              modal.hide();
            }}
            onClose={() => modal.hide()}
            formClassName="flex flex-col h-full max-h-[90vh]"
            renderHeader={(headerContent) => (
              <Dialog.Header
                asChild
                className="flex items-center justify-between px-6 py-5 border-b-4 border-black bg-white shrink-0"
              >
                {headerContent}
              </Dialog.Header>
            )}
            renderFooter={(footerContent) => (
              <Dialog.Footer
                position="static"
                className="p-6 border-t-4 border-black bg-gray-50 shrink-0 flex flex-col gap-4"
              >
                {footerContent}
              </Dialog.Footer>
            )}
          />
        </Dialog.Content>
      </Dialog>
    );
  },
);
