import { dirname, importx } from '@discordx/importer'

import { join } from 'node:path'

const eventsDir = join(
  dirname(import.meta.url),
  '..',
  '..',
  'commands',
  '**',
  '*.command.{ts,js}'
)
await importx(eventsDir)
