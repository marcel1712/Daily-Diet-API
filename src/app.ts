import fastify from "fastify";

export const app = fastify()

app.get('/test', () => {
    return 'test'
})