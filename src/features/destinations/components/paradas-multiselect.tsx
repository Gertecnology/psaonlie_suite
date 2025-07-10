import { useEffect, useState } from 'react';
import { getParadasHomologadasSelector } from '../services/destination.service';
import { X } from 'lucide-react';

interface ParadaOption {
  id: string;
  descripcion: string;
}

interface ParadasMultiselectProps {
  value: string[];
  onChange: (value: string[]) => void;
  label?: string;
  error?: string;
}

export function ParadasMultiselect({ value, onChange, label, error }: ParadasMultiselectProps) {
  const [options, setOptions] = useState<ParadaOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [input, setInput] = useState('');

  useEffect(() => {
    setLoading(true);
    getParadasHomologadasSelector()
      .then(setOptions)
      .finally(() => setLoading(false));
  }, []);

  const selectedOptions = options.filter((opt) => value.includes(opt.id));
  const availableOptions = options.filter((opt) => !value.includes(opt.id) && opt.descripcion.toLowerCase().includes(input.toLowerCase()));

  return (
    <div>
      {label && <label className="block text-sm font-medium mb-1">{label}</label>}
      <div className="flex flex-wrap gap-2 mb-2">
        {selectedOptions.map((opt) => (
          <span key={opt.id} className="inline-flex items-center bg-muted px-2 py-1 rounded text-sm">
            {opt.descripcion}
            <button type="button" className="ml-1 text-muted-foreground hover:text-destructive" onClick={() => onChange(value.filter((id) => id !== opt.id))}>
              <X size={16} />
            </button>
          </span>
        ))}
      </div>
      <input
        type="text"
        className="w-full border rounded px-2 py-1 mb-2"
        placeholder="Buscar parada..."
        value={input}
        onChange={(e) => setInput(e.target.value)}
        disabled={loading}
      />
      <div className="max-h-40 overflow-y-auto border rounded bg-background">
        {loading ? (
          <div className="p-2 text-muted-foreground text-sm">Cargando...</div>
        ) : availableOptions.length === 0 ? (
          <div className="p-2 text-muted-foreground text-sm">No hay opciones</div>
        ) : (
          availableOptions.map((opt) => (
            <button
              key={opt.id}
              type="button"
              className="block w-full text-left px-2 py-1 hover:bg-accent"
              onClick={() => onChange([...value, opt.id])}
              disabled={value.includes(opt.id)}
            >
              {opt.descripcion}
            </button>
          ))
        )}
      </div>
      {error && <div className="text-destructive text-xs mt-1">{error}</div>}
    </div>
  );
} 