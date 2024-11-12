import { ClientDiscord } from '@/domain/discord/api/client/client-discord'
import '@/domain/discord/api/controllers/Event'
import '@/domain/discord/api/controllers/Command'

const client = new ClientDiscord()

client.sync()

export default client
