import { knex } from './database'
import { env } from './env/index'
import { userRoutes } from "./routes/users";
import Fastify from 'fastify'
import cookie from '@fastify/cookie'
import { mealsRoutes } from './routes/meals';

export const app = Fastify();

app.register(cookie)
app.register(userRoutes, {
    prefix: 'users',
})
app.register(mealsRoutes, {
    prefix: 'meals',
})