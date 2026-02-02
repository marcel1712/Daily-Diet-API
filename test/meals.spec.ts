import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest"
import { execSync } from 'node:child_process'
import request from 'supertest'
import { app } from "../src/app"

describe('Meals routes', () => {

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

  it('should create a meal', async () => {
    const createUserResponse = await request(app.server)
      .post('/users')
      .send({
        name: 'Sarah',
        email: 'sarah@email.com'
      })

    const cookies = createUserResponse.get('Set-Cookie')

    const response = await request(app.server)
      .post('/meals')
      .set('Cookie', cookies!)
      .send({
        name: 'Almoço',
        description: 'Arroz e feijão',
        date: '2024-01-18T12:00:00.000Z',
        isDiet: true
      })

    expect(response.status).toBe(201)
  })

  it('should return error when creating meal without authentication', async () => {
    const response = await request(app.server)
      .post('/meals')
      .send({
        name: 'Almoço',
        description: 'Arroz e feijão',
        date: '2024-01-18T12:00:00.000Z',
        isDiet: true
      })

    expect(response.status).toBe(401)
  })

  it('should list all user meals', async () => {
    const createUserResponse = await request(app.server)
      .post('/users')
      .send({
        name: 'Sarah',
        email: 'sarah@email.com'
      })

    const cookies = createUserResponse.get('Set-Cookie')

    // Criar 3 meals
    await request(app.server)
      .post('/meals')
      .set('Cookie', cookies!)
      .send({
        name: 'Café da manhã',
        description: 'Ovos mexidos',
        date: '2024-01-18T08:00:00.000Z',
        isDiet: true
      })

    await request(app.server)
      .post('/meals')
      .set('Cookie', cookies!)
      .send({
        name: 'Almoço',
        description: 'Arroz e feijão',
        date: '2024-01-18T12:00:00.000Z',
        isDiet: true
      })

    await request(app.server)
      .post('/meals')
      .set('Cookie', cookies!)
      .send({
        name: 'Jantar',
        description: 'Pizza',
        date: '2024-01-18T20:00:00.000Z',
        isDiet: false
      })

    // Listar meals
    const listResponse = await request(app.server)
      .get('/meals')
      .set('Cookie', cookies!)

    expect(listResponse.status).toBe(200)
    expect(listResponse.body.meals).toHaveLength(3)
  })

  it('should get a specific meal', async () => {
    const createUserResponse = await request(app.server)
      .post('/users')
      .send({
        name: 'Sarah',
        email: 'sarah@email.com'
      })

    const cookies = createUserResponse.get('Set-Cookie')

    await request(app.server)
      .post('/meals')
      .set('Cookie', cookies!)
      .send({
        name: 'Almoço',
        description: 'Arroz e feijão',
        date: '2024-01-18T12:00:00.000Z',
        isDiet: true
      })

    // Listar para pegar ID
    const listResponse = await request(app.server)
      .get('/meals')
      .set('Cookie', cookies!)

    const mealId = listResponse.body.meals[0].id

    // Buscar meal específica
    const getMealResponse = await request(app.server)
      .get(`/meals/${mealId}`)
      .set('Cookie', cookies!)

    expect(getMealResponse.status).toBe(200)
    expect(getMealResponse.body.meal).toHaveProperty('name', 'Almoço')
  })

  it('should return 404 when meal does not exist', async () => {
    const createUserResponse = await request(app.server)
      .post('/users')
      .send({
        name: 'Sarah',
        email: 'sarah@email.com'
      })

    const cookies = createUserResponse.get('Set-Cookie')

    const response = await request(app.server)
      .get('/meals/00000000-0000-0000-0000-000000000000')
      .set('Cookie', cookies!)

    expect(response.status).toBe(404)
  })

  it('should update a meal', async () => {
    const createUserResponse = await request(app.server)
      .post('/users')
      .send({
        name: 'Sarah',
        email: 'sarah@email.com'
      })

    const cookies = createUserResponse.get('Set-Cookie')

    await request(app.server)
      .post('/meals')
      .set('Cookie', cookies!)
      .send({
        name: 'Almoço',
        description: 'Arroz e feijão',
        date: '2024-01-18T12:00:00.000Z',
        isDiet: true
      })

    const listResponse = await request(app.server)
      .get('/meals')
      .set('Cookie', cookies!)

    const mealId = listResponse.body.meals[0].id

    const updateResponse = await request(app.server)
      .put(`/meals/${mealId}`)
      .set('Cookie', cookies!)
      .send({
        name: 'Almoço atualizado',
        description: 'Arroz, feijão e frango',
        date: '2024-01-18T12:30:00.000Z',
        isDiet: false
      })

    expect(updateResponse.status).toBe(204)

    const getMealResponse = await request(app.server)
      .get(`/meals/${mealId}`)
      .set('Cookie', cookies!)

    expect(getMealResponse.body.meal).toHaveProperty('name', 'Almoço atualizado')
    expect(getMealResponse.body.meal).toHaveProperty('is_diet', 0)
  })

  it('should delete a meal', async () => {
    const createUserResponse = await request(app.server)
      .post('/users')
      .send({
        name: 'Sarah',
        email: 'sarah@email.com'
      })

    const cookies = createUserResponse.get('Set-Cookie')

    await request(app.server)
      .post('/meals')
      .set('Cookie', cookies!)
      .send({
        name: 'Almoço',
        description: 'Arroz e feijão',
        date: '2024-01-18T12:00:00.000Z',
        isDiet: true
      })

    const listResponse = await request(app.server)
      .get('/meals')
      .set('Cookie', cookies!)

    const mealId = listResponse.body.meals[0].id

    const deleteResponse = await request(app.server)
      .delete(`/meals/${mealId}`)
      .set('Cookie', cookies!)

    expect(deleteResponse.status).toBe(204)

    // Verificar se foi deletada
    const getMealResponse = await request(app.server)
      .get(`/meals/${mealId}`)
      .set('Cookie', cookies!)

    expect(getMealResponse.status).toBe(404)
  })

  it('should only show user own meals', async () => {
    const user1Response = await request(app.server)
      .post('/users')
      .send({
        name: 'Sarah',
        email: 'sarah@email.com'
      })

    const user1Cookies = user1Response.get('Set-Cookie')

    const user2Response = await request(app.server)
      .post('/users')
      .send({
        name: 'John',
        email: 'john@email.com'
      })

    const user2Cookies = user2Response.get('Set-Cookie')

    await request(app.server)
      .post('/meals')
      .set('Cookie', user1Cookies!)
      .send({
        name: 'Almoço Sarah',
        description: 'Salada',
        date: '2024-01-18T12:00:00.000Z',
        isDiet: true
      })

    await request(app.server)
      .post('/meals')
      .set('Cookie', user2Cookies!)
      .send({
        name: 'Almoço John',
        description: 'Pizza',
        date: '2024-01-18T12:00:00.000Z',
        isDiet: false
      })

    const user1MealsResponse = await request(app.server)
      .get('/meals')
      .set('Cookie', user1Cookies!)

    expect(user1MealsResponse.body.meals).toHaveLength(1)
    expect(user1MealsResponse.body.meals[0]).toHaveProperty('name', 'Almoço Sarah')

    const user2MealsResponse = await request(app.server)
      .get('/meals')
      .set('Cookie', user2Cookies!)

    expect(user2MealsResponse.body.meals).toHaveLength(1)
    expect(user2MealsResponse.body.meals[0]).toHaveProperty('name', 'Almoço John')
  })

  it('should not access meal from another user', async () => {
    const user1Response = await request(app.server)
      .post('/users')
      .send({
        name: 'Sarah',
        email: 'sarah@email.com'
      })

    const user1Cookies = user1Response.get('Set-Cookie')

    const user2Response = await request(app.server)
      .post('/users')
      .send({
        name: 'John',
        email: 'john@email.com'
      })

    const user2Cookies = user2Response.get('Set-Cookie')

    await request(app.server)
      .post('/meals')
      .set('Cookie', user1Cookies!)
      .send({
        name: 'Almoço Sarah',
        description: 'Salada',
        date: '2024-01-18T12:00:00.000Z',
        isDiet: true
      })

    const user1MealsResponse = await request(app.server)
      .get('/meals')
      .set('Cookie', user1Cookies!)

    const mealId = user1MealsResponse.body.meals[0].id

    const accessResponse = await request(app.server)
      .get(`/meals/${mealId}`)
      .set('Cookie', user2Cookies!)

    expect(accessResponse.status).toBe(404)
  })
})