import { FastifyInstance } from "fastify";
import { knex } from "../database";
import { z } from 'zod';
import { randomUUID } from "node:crypto";
import { checkSessionIdExists } from "../middleware/check-session-id-exists";

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


    app.get('/me', { preHandler: [checkSessionIdExists] }, async (request) => {
        const userId = request.userId

        const user = await knex('users')
            .where({ id: userId })
            .first()

        return { user }
    })


    app.get('/metrics', { preHandler: [checkSessionIdExists] }, async (request, reply) => {

        const userId = request.userId

        const countTotalMeals = await knex('meals')
            .where({ user_id: userId })
            .count('id as total')
            .first()

        const countTotalInDiet = await knex('meals')
            .where({ user_id: userId, is_diet: true })
            .count('id as total')
            .first()

        const countTotalOutDiet = await knex('meals')
            .where({ user_id: userId, is_diet: false })
            .count('id as total')
            .first()

        const meals  = await knex('meals')
            .where({ user_id: userId })
            .orderBy('date', 'asc')
            .select()

        let currentStreak: number = 0
        let bestStreak: number = 0

        meals.forEach(meal => {
            if (meal.is_diet) {
                currentStreak++
                bestStreak = Math.max(bestStreak, currentStreak)
            } else {
                currentStreak = 0
            }
        })

        return { 
            countTotalMeals: Number(countTotalMeals?.total), 
            countTotalInDiet: Number(countTotalInDiet?.total), 
            countTotalOutDiet: Number(countTotalOutDiet?.total), 
            bestStreak }

    })
}