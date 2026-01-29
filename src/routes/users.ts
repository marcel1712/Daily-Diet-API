import { FastifyInstance } from "fastify";
import { knex } from "../database";
import { z } from 'zod';
import { randomUUID } from "node:crypto";


export async function userRoutes(app: FastifyInstance) {

    app.addHook('preHandler', async (request, reply) => {
        console.log(`[${request.method}] ${request.url}`)
    })

    app.post('/', async (request, reply) => {

        const createUserBodySchema = z.object({
            name: z.string(),
            email: z.string().email(),
        })

        const { name, email } = createUserBodySchema.parse(request.body)

        const sessionId = randomUUID()

        await knex('users').insert({
            id: randomUUID(),
            name,
            email,
            session_id: sessionId,
            created_at: new Date().toISOString()
        })

        reply.setCookie('sessionId', sessionId, {
            path: '/',
            maxAge: 60 * 60 * 24 * 7 //7 dias
        })

        return reply.status(201).send()
    })

    app.get('/', {}, async (request) => {

        const user = await knex('users')
            .select()

        return { user }

    })

    app.get('/:id', {}, async(request) => {

        const getUserParamsSchema = z.object({
            id: z.string().uuid(),
        })

        const { id } = getUserParamsSchema.parse(request.params)

        const user = await knex('users')
            .where({
                id
            })
            .first()

        return { user }
    })
}