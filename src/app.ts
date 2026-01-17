import fastify from "fastify";
import { env } from '../.env'

export const app = fastify()

app.get('/test', () => {
    return 'test'
})