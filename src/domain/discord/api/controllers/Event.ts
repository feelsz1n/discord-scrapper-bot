import { dirname, importx } from '@discordx/importer'

import { join } from 'node:path'

const eventsDir = join(
  dirname(import.meta.url),
  '..',
  '..',
  'events',
  '**',
  '*.event.{ts,js}'
)

await importx(eventsDir)
