import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { execSync } from 'node:child_process'
import { app } from "../src/app";
import knex from "knex";
import request from 'supertest' //permite utilizarmos requisicoes http sem subir o servidor


describe('Users routes', (response, reply) => {

    beforeAll(async () => {
        await app.ready()
    })

    afterAll(async () => {
        await app.close()
    })

    beforeEach(async () => {
        execSync('npm run knex migrate:rollback --all')
        execSync('npm run knex migrate:latest')
    })

    it('should create a new user', async () => {
        const response = await request(app.server)
            .post('/users')
            .send({
                name: 'Sarah',
                email: 'sarah@email.com'
            })

        expect(response.status).toBe(201)
    })

    it('should set a session cookie when creating user', async () => {
        const response = await request(app.server)
            .post('/users')
            .send({
                name: 'Sarah',
                email: 'sarah@email.com'
            })

        const cookies = response.get('Set-Cookie')

        expect(cookies).toBeDefined()
        expect(cookies).toEqual(
            expect.arrayContaining([
                expect.stringContaining('sessionId')
            ])
        )
    })

    it('should return error when creating user without name', async () => {
        const response = await request(app.server)
            .post('/users')
            .send({
                email: 'sarah@email.com'
                // name está faltando
            })

        expect(response.status).toBe(400)
    })

    it('should return error when creating user without email', async () => {
        const response = await request(app.server)
            .post('/users')
            .send({
                name: 'Sarah'
                // email está faltando
            })

        expect(response.status).toBe(400)
    })

    it('should return error when creating user with invalid email', async () => {
        const response = await request(app.server)
            .post('/users')
            .send({
                name: 'Sarah',
                email: 'invalid-email'
            })

        expect(response.status).toBe(400)
    })

    it('should return error when creating user with existing email', async () => {
        await request(app.server)
            .post('/users')
            .send({
                name: 'Sarah',
                email: 'sarah@email.com'
            })

        const response = await request(app.server)
            .post('/users')
            .send({
                name: 'John',
                email: 'sarah@email.com'
            })

        expect(response.status).toBe(409)
    })

    it('should identified through the cookie between requests', async () => {
        const createUserResponse = await request(app.server)
            .post('/users')
            .send({
                name: 'Sarah',
                email: 'sarah@email.com'
            })

        const cookies = createUserResponse.get('Set-Cookie')

        const profileResponse = await request(app.server)
            .get('/users/me')
            .set('Cookie', cookies)// set cookies

        expect(profileResponse.status).toBe(200)
        expect(profileResponse.body.user).toHaveProperty('name', 'Sarah')
        expect(profileResponse.body.user).toHaveProperty('email', 'sarah@email.com')
    })

    it('should return the user’s metrics', async () => {
        const createUserResponse = await request(app.server)
            .post('/users')
            .send({
                name: 'Sarah',
                email: 'sarah@email.com'
            })

        const cookies = createUserResponse.get('Set-Cookie')

        await request(app.server).post('/meals').set('Cookie', cookies!).send({ name: 'Café', description: 'Pão integral', date: '2024-01-18T08:00:00.000Z', isDiet: true })
        await request(app.server).post('/meals').set('Cookie', cookies!).send({ name: 'Almoço', description: 'Frango e salada', date: '2024-01-18T12:00:00.000Z', isDiet: true })
        await request(app.server).post('/meals').set('Cookie', cookies!).send({ name: 'Lanche', description: 'Frutas', date: '2024-01-18T15:00:00.000Z', isDiet: true })

        const response = await request(app.server).get('/meals').set('Cookie', cookies!)

        expect(response.body.meals).toHaveLength(3)

    })

})