import ContentSection from '../components/content-section'
import { AppearanceForm } from './appearance-form'

export default function SettingsAppearance() {
  return (
    <ContentSection
      title='Apariencia'
      desc='Personalizá la apariencia del panel: tipografía y tema claro u oscuro.'
    >
      <AppearanceForm />
    </ContentSection>
  )
}
