import { useEffect, useState } from 'react'
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
import { createDestination, updateDestination, getAllParadasHomologadas, getDestinationById } from '../services/destination.service'
import { MultiSelect } from '@/components/ui/multi-select'
import { toast } from 'sonner'

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

  const [paradaOptions, setParadaOptions] = useState<{ value: string; label: string }[]>([]);
  const [loadingParadas, setLoadingParadas] = useState(false);
  const [loadingInitial, setLoadingInitial] = useState(false);

  useEffect(() => {
    if (open) {
      if (isUpdate && initialData?.id) {
        setLoadingInitial(true);
        (async () => {
          const data = await getDestinationById(initialData.id || '');
          const paradasHomologadasIds = Array.isArray(data.paradasHomologadas)
            ? data.paradasHomologadas.map((p: { id: string }) => p.id)
            : [];

          // Construir opciones de paradas seleccionadas desde paradasHomologadas
          const paradasSeleccionadasOptions = (data.paradasHomologadas || []).map((p: { id: string; nombre: string }) => ({ value: p.id, label: p.nombre }));
          setLoadingParadas(true);
          const opts = await getAllParadasHomologadas();
          let paradaOptions = opts.map((p: { id: string; descripcion: string }) => ({ value: p.id, label: p.descripcion }));
          // Combinar ambas listas, evitando duplicados
          paradaOptions = [
            ...paradasSeleccionadasOptions,
            ...paradaOptions.filter((opt: { value: string; label: string }) =>
              !paradasSeleccionadasOptions.some((sel: { value: string; label: string }) => sel.value === opt.value)
            )
          ];
          setParadaOptions(paradaOptions);
          form.reset({ nombre: data.nombre, paradasHomologadasIds });
          setLoadingParadas(false);
          setLoadingInitial(false);
        })();
      } else {
        form.reset(initialData || { nombre: '', paradasHomologadasIds: [] });
        setLoadingParadas(true);
        getAllParadasHomologadas()
          .then((opts) => setParadaOptions(opts.map((p: { id: string; descripcion: string }) => ({ value: p.id, label: p.descripcion }))))
          .finally(() => setLoadingParadas(false));
      }
    }
  }, [open, initialData, isUpdate, form]);

  const onSubmit = async (data: DestinationFormValues) => {
    try {
      if (isUpdate && initialData?.id) {
        await updateDestination(initialData.id, data);
        toast.success('Destino editado correctamente');
      } else {
        await createDestination(data);
        toast.success('Destino creado correctamente');
      }
      onSuccess?.();
      onClose();
    } catch (error) {
      toast.error('Error al guardar destino', { description: error instanceof Error ? error.message : String(error) });
    }
  };

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="flex flex-col">
        <SheetHeader className="text-left">
          <SheetTitle>{isUpdate ? 'Editar destino' : 'Crear destino'}</SheetTitle>
          <SheetDescription>
            {isUpdate
              ? 'Edita la información del destino.'
              : 'Añade un nuevo destino con la información necesaria.'}
            Haz click en guardar cuando hayas terminado.
          </SheetDescription>
        </SheetHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex-1 space-y-5 px-4">
            <FormField
              control={form.control}
              name="nombre"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Nombre del destino" />
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
                  <FormLabel>Paradas homologadas</FormLabel>
                  <FormControl>
                    <MultiSelect
                      key={JSON.stringify(paradaOptions) + JSON.stringify(field.value)}
                      options={paradaOptions}
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      placeholder={loadingParadas ? 'Cargando...' : 'Selecciona paradas'}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <SheetFooter>
              <Button type="submit" className="w-full" disabled={loadingInitial}>{isUpdate ? 'Guardar cambios' : 'Crear destino'}</Button>
              <SheetClose asChild>
                <Button type="button" variant="outline" className="w-full mt-2">Cancelar</Button>
              </SheetClose>
            </SheetFooter>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
}
