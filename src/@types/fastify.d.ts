import 'fastify'

//makes .userId work
declare module 'fastify' {
  interface FastifyRequest {
    userId?: string
  }
}