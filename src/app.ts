import { knex } from './database'
import { env } from './env/index'
import { userRoutes } from "./routes/users";
import Fastify from 'fastify'
import cookie from '@fastify/cookie'
import { mealsRoutes } from './routes/meals';
import { ZodError } from 'zod';

export const app = Fastify();

app.register(cookie)
app.register(userRoutes, {
    prefix: 'users',
})
app.register(mealsRoutes, {
    prefix: 'meals',
})

app.setErrorHandler((error, request, reply) => {
  if (error instanceof ZodError) {
    return reply.status(400).send({
      message: 'Validation error',
      issues: error.format(),
    })
  }

  return reply.status(500).send({
    message: 'Internal server error',
  })
})