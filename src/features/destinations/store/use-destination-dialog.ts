import { create } from 'zustand';
import { DestinationFormValues } from '../models/destination.model';

interface DestinationDialogState {
  open: boolean;
  isUpdate: boolean;
  data?: DestinationFormValues & { id?: string };
  openDialog: (mode: 'create' | 'edit', data?: DestinationFormValues & { id?: string }) => void;
  close: () => void;
}

export const useDestinationDialog = create<DestinationDialogState>((set) => ({
  open: false,
  isUpdate: false,
  data: undefined,
  openDialog: (mode, data) => set({ open: true, isUpdate: mode === 'edit', data }),
  close: () => set({ open: false, data: undefined }),
}));

interface DestinationDeleteDialogState {
  open: boolean;
  id?: string;
  openDialog: (id: string) => void;
  close: () => void;
}

export const useDestinationDeleteDialog = create<DestinationDeleteDialogState>((set) => ({
  open: false,
  id: undefined,
  openDialog: (id) => set({ open: true, id }),
  close: () => set({ open: false, id: undefined }),
})); 