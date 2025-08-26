import { useEffect, useMemo, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { destinationFormSchema, DestinationFormValues } from '../models/destination.model'
import { 
  useCreateDestination, 
  useUpdateDestination, 
  useGetParadasHomologadas,
  useGetDestinationForEdit 
} from '@/features/destinations'
import { MultiSelect } from '@/components/ui/multi-select'

interface DestinationMutateDrawerProps {
  open: boolean;
  onClose: () => void;
  initialData?: DestinationFormValues & { id?: string };
  isUpdate?: boolean;
  onSuccess?: () => void;
}

export function DestinationMutateDrawer({ open, onClose, initialData, isUpdate, onSuccess }: DestinationMutateDrawerProps) {
  const form = useForm<DestinationFormValues>({
    resolver: zodResolver(destinationFormSchema),
    defaultValues: initialData || { nombre: '', paradasHomologadasIds: [] },
  });

  // Hooks para mutaciones y datos
  const createDestination = useCreateDestination();
  const updateDestination = useUpdateDestination();
  const { data: paradasOptions, isLoading: loadingParadas } = useGetParadasHomologadas();
  
  // Hook para obtener destino cuando se está editando
  const { 
    data: destinationForEdit, 
    isLoading: loadingDestination 
  } = useGetDestinationForEdit(initialData?.id || '', isUpdate && open);

  // Ref para controlar si ya se hizo reset del formulario
  const hasResetForm = useRef(false);

  // Memoizar las opciones de paradas para evitar recálculos innecesarios
  const paradaOptions = useMemo(() => {
    if (!paradasOptions) return [];

    if (isUpdate && destinationForEdit) {
      // Modo edición: combinar paradas ya seleccionadas con todas las disponibles
      const paradasSeleccionadasOptions = (destinationForEdit.paradasHomologadas || []).map((p: { id: string; nombre: string }) => ({ 
        value: p.id, 
        label: p.nombre 
      }));

      const todasLasOpciones = paradasOptions.map((p: { id: string; descripcion: string }) => ({ 
        value: p.id, 
        label: p.descripcion 
      }));

      // Crear lista final evitando duplicados
      return [
        ...paradasSeleccionadasOptions,
        ...todasLasOpciones.filter((opt: { value: string; label: string }) => 
          !paradasSeleccionadasOptions.some(sel => sel.value === opt.value)
        )
      ];
    } else {
      // Modo creación: usar solo las opciones disponibles
      return paradasOptions.map((p: { id: string; descripcion: string }) => ({ 
        value: p.id, 
        label: p.descripcion 
      }));
    }
  }, [paradasOptions, isUpdate, destinationForEdit]);

  // Efecto para actualizar el formulario cuando se abre en modo edición
  useEffect(() => {
    if (!open) return;

    if (isUpdate && destinationForEdit && !hasResetForm.current) {
      // Modo edición: cargar datos del destino
      const paradasHomologadasIds = (destinationForEdit.paradasHomologadas || [])
        .map((p: { id: string }) => p.id);
      
      const formData = { 
        nombre: destinationForEdit.nombre, 
        paradasHomologadasIds 
      };
      
      form.reset(formData);
      hasResetForm.current = true;
    } else if (!isUpdate && !hasResetForm.current) {
      // Modo creación: resetear formulario
      form.reset(initialData || { nombre: '', paradasHomologadasIds: [] });
      hasResetForm.current = true;
    }
  }, [open, isUpdate, destinationForEdit, form, initialData]);

  // Efecto adicional para manejar cambios en destinationForEdit después del reset inicial
  useEffect(() => {
    if (open && isUpdate && destinationForEdit && hasResetForm.current) {
      // Solo actualizar si ya se hizo el reset inicial y los datos han cambiado
      const currentValues = form.getValues();
      const newParadasHomologadasIds = (destinationForEdit.paradasHomologadas || [])
        .map((p: { id: string }) => p.id);
      
      if (currentValues.nombre !== destinationForEdit.nombre || 
          JSON.stringify(currentValues.paradasHomologadasIds) !== JSON.stringify(newParadasHomologadasIds)) {
        
        form.setValue('nombre', destinationForEdit.nombre);
        form.setValue('paradasHomologadasIds', newParadasHomologadasIds);
      }
    }
  }, [destinationForEdit, open, isUpdate, form]);

  // Resetear el flag cuando se cierra el modal
  useEffect(() => {
    if (!open) {
      hasResetForm.current = false;
    }
  }, [open]);

  const onSubmit = async (data: DestinationFormValues) => {
    if (isUpdate && initialData?.id) {
      updateDestination.mutate(
        { id: initialData.id, data },
        {
          onSuccess: () => {
            onSuccess?.();
            onClose();
          },
        }
      );
    } else {
      createDestination.mutate(data, {
        onSuccess: () => {
          onSuccess?.();
          onClose();
        },
      });
    }
  };

  const isLoading = createDestination.isPending || updateDestination.isPending;
  const isLoadingData = loadingParadas || (isUpdate && loadingDestination);

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="flex flex-col w-[90vw] max-w-[600px] sm:w-[600px]">
        <SheetHeader className="text-left pb-6 flex-shrink-0">
          <SheetTitle className="text-xl font-semibold">
            {isUpdate ? 'Editar Destino' : 'Crear Nuevo Destino'}
          </SheetTitle>
          <SheetDescription className="text-base text-muted-foreground">
            {isUpdate 
              ? 'Modifica la información del destino existente.'
              : 'Completa la información para crear un nuevo destino.'
            }
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto pr-2">
          {isUpdate && loadingDestination ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center space-y-3">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent mx-auto"></div>
                <p className="text-sm text-muted-foreground">Cargando datos del destino...</p>
              </div>
            </div>
          ) : (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="nombre"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium">Nombre del Destino</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Ej: Asunción Terminal" 
                          {...field} 
                          disabled={isLoading}
                          className="w-full"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="paradasHomologadasIds"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium">Paradas Homologadas</FormLabel>
                      <FormControl>
                        <MultiSelect
                          options={paradaOptions}
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          placeholder={isLoadingData ? "Cargando paradas..." : "Selecciona las paradas..."}
                          maxCount={10}
                        />
                      </FormControl>
                      {isLoadingData && (
                        <p className="text-xs text-muted-foreground">
                          Cargando opciones de paradas...
                        </p>
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </form>
            </Form>
          )}
        </div>

        <SheetFooter className="pt-6 border-t flex-shrink-0">
          <div className="flex gap-3 w-full">
            <SheetClose asChild>
              <Button type="button" variant="outline" disabled={isLoading || (isUpdate && loadingDestination)} className="flex-1">
                Cancelar
              </Button>
            </SheetClose>
            <Button 
              type="submit" 
              disabled={isLoading || isLoadingData || (isUpdate && loadingDestination)}
              onClick={form.handleSubmit(onSubmit)}
              className="flex-1"
            >
              {isLoading ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent mr-2" />
                  {isUpdate ? 'Actualizando...' : 'Creando...'}
                </>
              ) : (
                <>
                  {isUpdate ? 'Actualizar' : 'Crear'}
                </>
              )}
            </Button>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
