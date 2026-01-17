import { config } from 'dotenv' //read .env file and put the variables in process.env
import { z } from 'zod' //verify the types and format of the variables

//decide which file use
if(process.env.NODE_ENV === 'test'){
    config({ path: '.env.test'})
}else{
    config()
}

//creating the schema format
const envSchema = z.object({
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    DATABASE_URL: z.string(),
    PORT: z.coerce.number().default(3333)
})

//real validation of variables, dont crash 
const _env = envSchema.safeParse(process.env)

//error handling
if(_env.success === false){
    console.error('Invalid enviorment variables', _env.error.format())
    throw new Error('Invalid enviorment variable')
}

export const env = _env.data