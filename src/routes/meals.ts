import { FastifyInstance } from "fastify";
import { knex } from '../database';
import { z } from 'zod';
import { randomUUID } from "node:crypto";
import { checkSessionIdExists } from "../middleware/check-session-id-exists";
import { request } from "node:http";
import { error } from "node:console";

export async function mealsRoutes(app: FastifyInstance) {

    //create meal
    app.post('/', { preHandler: [checkSessionIdExists] }, async (request, reply) => {
        const createMealBodySchema = z.object({
            name: z.string(),
            description: z.string(),
            date: z.string(),
            isDiet: z.boolean(),

        })

        const { name, description, date, isDiet } = createMealBodySchema.parse(request.body)
        const userId = request.userId

        await knex('meals').insert({
            id: randomUUID(),
            user_id: userId,
            name,
            description,
            date,
            is_diet: isDiet,
            created_at: new Date().toISOString(),
        })

        return reply.status(201).send()
    })

    //list all
    app.get('/', { preHandler: [checkSessionIdExists] }, async (request) => {

        const userId = request.userId

        const meals = await knex('meals')
            .where({ user_id: userId })
            .orderBy('date', 'desc')
            .select()

        return { meals }
    })

    //get a specific meal
    app.get('/:id', { preHandler: [checkSessionIdExists] }, async (request, reply) => {
        const getMealParamsSchema = z.object({
            id: z.string().uuid()
        })

        const { id } = getMealParamsSchema.parse(request.params)
        const userId = request.userId

        const meal = await knex('meals')
            .where({
                id,
                user_id: userId,
            })
            .first()

        if (!meal) {
            return reply.status(404).send({ error: 'Meal not found' })
        }

        return { meal }
    })

    //update meal
    app.put('/:id', { preHandler: [checkSessionIdExists]}, async(request, reply) => {
        const updateMealParamsSchema = z.object({
            id: z.string().uuid()
        })

        const updateMealBodySchema = z.object({
            name: z.string(),
            description: z.string(),
            date: z.string(),
            isDiet: z.boolean()
        })

        const { id } = updateMealParamsSchema.parse(request.params)
        const { name, description, date, isDiet} = updateMealBodySchema.parse(request.body)
        const userId = request.userId

        const meal = await knex('meals')
            .where({id, user_id: userId})
            .first()

        if(!meal){
            return reply.status(404).send({error: 'Meal not found'})
        }

        await knex('meals')
            .where({ id })
            .update({
                name,
                description,
                date,
                is_diet: isDiet,
            })
        
        return reply.status(204).send()
    })

    //delete a meal
    app.delete('/:id', { preHandler: [checkSessionIdExists]}, async (request, reply) => {
        const deleteMealParamsSchema = z.object({
            id: z.string().uuid()
        })

        const { id } = deleteMealParamsSchema.parse(request.params)
        const userId = request.userId

        const meal = await knex('meals')
            .where({ id, user_id: userId})
            .first()

        if(!meal){
            return reply.status(404).send({error: 'Meal not found'})
        }

        await knex('meals')
            .where({ id })
            .delete()

        return reply.status(204).send()
    })

}