import { create } from 'zustand';
import { DestinationFormValues } from '../models/destination.model';

interface DestinationDialogState {
  open: boolean;
  isOpen: boolean;
  isUpdate: boolean;
  data?: DestinationFormValues & { id?: string };
  openDialog: (mode: 'create' | 'edit', data?: DestinationFormValues & { id?: string }) => void;
  close: () => void;
  closeDialog: () => void;
}

export const useDestinationDialog = create<DestinationDialogState>((set) => ({
  open: false,
  isOpen: false,
  isUpdate: false,
  data: undefined,
  openDialog: (mode, data) => set({ open: true, isOpen: true, isUpdate: mode === 'edit', data }),
  close: () => set({ open: false, isOpen: false, data: undefined }),
  closeDialog: () => set({ open: false, isOpen: false, data: undefined }),
}));

interface DestinationDeleteDialogState {
  open: boolean;
  isOpen: boolean;
  id?: string;
  openDialog: (id: string) => void;
  close: () => void;
  closeDialog: () => void;
}

export const useDestinationDeleteDialog = create<DestinationDeleteDialogState>((set) => ({
  open: false,
  isOpen: false,
  id: undefined,
  openDialog: (id) => set({ open: true, isOpen: true, id }),
  close: () => set({ open: false, isOpen: false, id: undefined }),
  closeDialog: () => set({ open: false, isOpen: false, id: undefined }),
})); 