import axios from 'axios';
import { faker } from '@faker-js/faker';
import { generate } from 'generate-password';
import dotenv from 'dotenv';

dotenv.config();

if(! ('MAIL_API_URL' in process.env ) ) {
    throw new Error(`Could not find the endpoint to create email address & password`);
}

let TOKEN = '';

/**
 * Returns a random integer between min and max (both inclusive)
 * 
 * Both numbers are considered absoulte by the `Math.abs(x) => x` method.
 * If the parameters are not passed properly, the same is interchanged.
 * 
 * @example
 * 
 * randomNumber(10, 20) // Returns say 12 (always a positive whole number)
 * 
 * @param min The lowest possible integer
 * @param max The highest possible integer
 * @returns A number between the min & max, which is a +ve whole number.
 */
const randomNumber = (min: number = 0, max: number = 9) : number => Math.round(Math.random() * (Math.max(Math.abs(max), Math.abs(min)) - Math.min(Math.abs(max), Math.abs(min)) ) + Math.min( Math.abs(max) , Math.abs(min)))


/**
 * This is api base, which is also an axios reference.
 */
export const api = axios.create({
    baseURL: process.env.MAIL_API_URL,
    timeout: 4000,
    validateStatus: (status: number) : boolean => {
        // Suppresses all exceptions...
        return true;
    }
});

/**
 * Set an incepter before every request.
 * If the username & password is set, the token is saved.
 */
api.interceptors.request.use( (config : any) => {
    if(TOKEN.length > 0) {
        config.headers.common["Authorization"] = `Bearer ${TOKEN}`;
    }
    return config;
})

type error = {
    title: string;
    description: string;
}

type response = {
    success: boolean;
    status: number;
}

type errorResponse = error & response;

type id = {
    id: string;
}

type user = {
    address: string;
    password: string;
}

type userConfig = {
    username?: string
} & id;

type register = ( userConfig & response ) | errorResponse;

type _register = ( userConfig & user & response );

type login = errorResponse | ( id & {
    token: string;
} & response )

type registerOpts = {
    firstName?: string;
    lastName?: string
}

type errorProp = {
    "hydra:title": string;
    "hydra:description": string;
}

type errorStatus = {
    status: number;
}

export enum genderTypes { 
    MALE = 'male',
    FEMALE = 'female',
}

type gender = genderTypes | undefined;

type nameType = { 
    firstName: string;
    lastName: string;
    fullName?: string
};

/**
 * Describes the error response. 
 * This helps the response on all methods to be of the same type.
 * 
 * @param param0 Parameter is of the `type` errorProp
 *                  
 * @param param1 Input of the type `errorStatus`. Denotes the "status code" of the response
 * @returns The `errorResponse` type.
 */
const getError = ( { "hydra:title": title, "hydra:description": description }: errorProp, { status } : errorStatus ) : errorResponse => {

    return {
        success: false,
        title,
        description,
        status
    };
}

/**
 * Get the name of a person.
 * @param gender The gender of the person. Can be either `male` or `female` or `undefined`
 * @returns Returns the object of type `nameType`
 * 
 */
export const getName = (gender: gender = undefined ) : nameType => {
    
    const data : any = {
        firstName: faker.name.firstName(gender),
        lastName: faker.name.lastName(gender),
    }

    data['fullName'] = (`${data['firstName'] ?? ""} ${data['lastName']}`).trim();


    return data;
}

/**
 * Get the registration data of a user and use the same to register on instagram
 * 
 * **warning**: If you use the *mail.gw* as provider, the email is valid only for 10 minutes.
 * 
 * @param provider The provider (or domain) which ends with `@`.
 * @param options Should contain first name and/or last name or none or both.
 * @param genUsername Flag to generate an username.
 * @returns A Promise containing the details of the user & response.
 */
export const _register = async (provider: string | undefined, options: registerOpts | null = null, genUsername: boolean = false) : Promise<_register> => {
    
    // Generating a username from the provided first name and/or last name (or none at all).
    // See faker.js documentation.
    const username = genUsername ? faker.internet.userName(options?.firstName ?? undefined, options?.lastName ?? undefined) : "";
    
    // Generating an emailAddress
    const address = faker.internet.email(options?.firstName ?? undefined, options?.lastName, provider ?? undefined);
    
    const password = generate({
        length: randomNumber(18, 10),
        numbers: true,
        symbols: true,
        lowercase: true,
        uppercase: true,
        strict: true,
        exclude: '`~()_=+/.,<>?{}[];:"\'\\' //#?!@$%^&*-
    })
    
    const response = await register({address, password});

    if(response.success == true) {
        const resp : any = {
            ...response,
            username,
            address,
            password
        };

        if(!genUsername) delete resp['username'];

        return resp;
    }

    const resp : any = {
        ...response
    };

    return resp;
}

/**
 * Method to register the user with email address & password
 * 
 * @param param0 The basic email address and password as an object.
 * @returns The details of the user as a reponse.
 */
export const register = async ( { address, password } : user) : Promise<register> => {
    const response = await api.post('/accounts', {
        address,
        password
    });

    if(response.status == 200 || response.status == 201) {
        const { id, status = response.status, success = true } = response.data;

        return {
            success,
            status,
            id
        }
    }

    const error: errorResponse = getError( { ...response.data }, { ...response });
    
    return error;
};

/**
 * Login to the mail server with address & password. 
 * 
 * @param param0 The basic email address and password as an object.
 * @returns The promise resulting in the login to mail with a bearer token.
 */
export const login = async ( { address, password } : user ) : Promise<login> => {
    const response = await api.post("/token", {
        address,
        password
    });

    if(response.status == 200){
        const { id, token, status = response.status, success = true } = response.data;
        return {
            id,
            token,
            status,
            success,
        };
    }

    const error: errorResponse = getError( { ...response.data }, { ...response });

    return error;
};