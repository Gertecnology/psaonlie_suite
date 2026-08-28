import * as React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './select'

/**
 * Un formulario que se rellena con lo que responde el backend.
 *
 * El valor no está en el primer render: llega después, igual que en cualquier
 * pantalla de edición del panel.
 */
function FormularioQueSeRellenaDespues({
  onValueChange,
}: {
  onValueChange: (valor: string) => void
}) {
  const [valor, setValor] = React.useState('')

  React.useEffect(() => {
    const id = setTimeout(() => setValor('F'), 10)
    return () => clearTimeout(id)
  }, [])

  return (
    <form>
      <Select
        value={valor}
        onValueChange={(elegido) => {
          setValor(elegido)
          onValueChange(elegido)
        }}
      >
        <SelectTrigger aria-label='Sexo'>
          <SelectValue placeholder='Seleccioná el sexo' />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value='M'>Masculino</SelectItem>
          <SelectItem value='F'>Femenino</SelectItem>
          <SelectItem value='O'>Otro</SelectItem>
        </SelectContent>
      </Select>
    </form>
  )
}

/**
 * El desplegable dentro de un formulario.
 *
 * Radix monta un `<select>` oculto para que el control participe del formulario
 * nativo, y le avisa a la pantalla de todo cambio que ese select reporte. Como
 * el select oculto sólo conoce las opciones ya registradas, un valor que llega
 * antes que ellas volvía como `''` y borraba lo que se acababa de cargar.
 */
describe('el desplegable dentro de un formulario', () => {
  it('conserva el valor que llega después del primer render', async () => {
    const avisar = vi.fn()

    render(<FormularioQueSeRellenaDespues onValueChange={avisar} />)

    // El `<select>` oculto de Radix es el que reporta los cambios al formulario.
    await waitFor(() => {
      const oculto = document.querySelector('select')
      expect(oculto).not.toBeNull()
      expect(oculto).toHaveValue('F')
    })

    expect(avisar).not.toHaveBeenCalledWith('')
  })

  it('sigue avisando de lo que la persona elige', async () => {
    const avisar = vi.fn()

    render(
      <form>
        <Select value='M' onValueChange={avisar}>
          <SelectTrigger aria-label='Sexo'>
            <SelectValue placeholder='Seleccioná el sexo' />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='M'>Masculino</SelectItem>
            <SelectItem value='F'>Femenino</SelectItem>
          </SelectContent>
        </Select>
      </form>
    )

    await waitFor(() =>
      expect(document.querySelector('select')).toHaveValue('M')
    )

    const oculto = document.querySelector('select')!
    const asignar = Object.getOwnPropertyDescriptor(
      window.HTMLSelectElement.prototype,
      'value'
    )!.set!
    asignar.call(oculto, 'F')
    oculto.dispatchEvent(new Event('change', { bubbles: true }))

    await waitFor(() => expect(avisar).toHaveBeenCalledWith('F'))
  })

  it('deja limpiar el valor cuando la pantalla no controla ninguno', async () => {
    const avisar = vi.fn()

    render(
      <form>
        <Select onValueChange={avisar}>
          <SelectTrigger aria-label='Sexo'>
            <SelectValue placeholder='Seleccioná el sexo' />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='M'>Masculino</SelectItem>
          </SelectContent>
        </Select>
      </form>
    )

    const oculto = await waitFor(() => {
      const encontrado = document.querySelector('select')
      expect(encontrado).not.toBeNull()
      return encontrado!
    })

    const asignar = Object.getOwnPropertyDescriptor(
      window.HTMLSelectElement.prototype,
      'value'
    )!.set!
    asignar.call(oculto, '')
    oculto.dispatchEvent(new Event('change', { bubbles: true }))

    await waitFor(() => expect(avisar).toHaveBeenCalledWith(''))
  })

  it('muestra la opción cargada como elegida al abrirlo', async () => {
    render(<FormularioQueSeRellenaDespues onValueChange={vi.fn()} />)

    await waitFor(() =>
      expect(document.querySelector('select')).toHaveValue('F')
    )

    screen.getByLabelText('Sexo').click()

    await waitFor(() =>
      expect(screen.getByRole('option', { name: 'Femenino' })).toHaveAttribute(
        'data-state',
        'checked'
      )
    )
  })
})
