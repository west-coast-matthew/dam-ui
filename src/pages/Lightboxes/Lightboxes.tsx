import { useParams } from 'react-router'
import { LightboxManagerPanel } from '../../components/Lightbox'
import { PageHeader } from '../../layout/PageHeader'

/** Lightboxes of a catalog in the current workspace; /lightboxes/:lightboxId opens one. */
export function Lightboxes() {
  const { lightboxId } = useParams()
  return (
    <>
      <PageHeader
        title="Lightboxes"
        description="Collect sets of assets, put them in order, browse them as a slideshow and download them."
      />
      <LightboxManagerPanel lightboxId={lightboxId ?? null} />
    </>
  )
}
