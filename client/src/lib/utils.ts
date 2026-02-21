import { ErrorModalProps, IError } from "@/types/common";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function showErrorModal(props: ErrorModalProps) {
  // NiceModal.show(CONSTANTS.MODAL_IDS.ERROR_MODAL, props);
}

export function parseErrorMessage(error: IError | any) {
  return (
    error?.data?.response?.description || error?.data?.message || error?.message
  );
}
