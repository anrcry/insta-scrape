import chalk from "chalk";
import inquirer from 'inquirer';
import { createSpinner, Spinner } from 'nanospinner';

import { register, _register } from "./user.mjs";

import dotenv from "dotenv";

dotenv.config();

export const sleep = (ms = 1000) : Promise<any> => new Promise((r) => setTimeout(r, ms));

export const REGEX_PASSWORD : RegExp = /^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[#?!@$%^&*-]).{8,}$/

/* 
 * @link https://regexr.com/2rhq7
 */
const REGEX_EMAIL : RegExp = /[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?/

enum action {
    SIGN_UP = 1,
    LOGIN = 2
};

type signUp = {
    email: string;
    full_name: string;
    name: string;
    password: string;
}

type signIn = {
    username: string | number;
    password: string;
}

type hello = {
    user_choice: action;
    data: signUp | signIn;
}

const hello = async function() : Promise<hello> {
    const { default: chalkAnimation } = await import("chalk-animation");
    
    const welcomeText = "Welcome to Insta Bot! \n";

    const welcome = chalkAnimation.rainbow(welcomeText);
    
    await sleep();
    welcome.stop();

    console.log(`${chalk.black.bgWhiteBright("WARNING")}
If you are using a CLI which ${chalk.red.bold.underline("does not support")} emoji(s) then some characters may be ${chalk.red.bold.underline("unreadable")}!\n`);

    await sleep();

    console.log(`${chalk.white.bgBlue('README!')}
    ➡  I am able to ${chalk.bold(`register or login`)} to Instagram from this CLI.
    ➡  You will be given the many choices & asked to fill some info along the way.
    ➡  If you follow correctly we should be able to just get things right.
    `);

    await sleep();

    // await hello();
    const ls = await multipleChoiceList({
        message: "Do you want to Login or Signup?",
        choices: [
            "Login",
            "Signup"
        ]
    }, true, {
        text: "Processing your choice.",
        color: 'red',
        callback: (arg : Spinner, answer: string) => arg.stop({ text: `We will proceed to ${chalk.bgBlue.white.bold.underline(answer)}.`,  mark: "✅"})
    });


    const isSignup = ls === 'Signup';

    if(ls !== 'Signup' && ls !== 'Login'){
        throw new Error(`Sorry the choice ${ls} is invalid`);
    }

    if(isSignup) {

        const questions = [
            {
                name: 'choice',
                type: 'confirm',
                message: 'Would you like the email address & username to be auto-generated?',
                default: 'y'
            },
            { 
                name: 'email',
                type: 'input',
                message: `Enter a ${chalk.underline(`valid email address`)}.`,
                validate: function(value: any) {
                    if(REGEX_EMAIL.test(value)) {
                        return true;
                    }
    
                    return `Email address can be only be of form ${chalk.italic.blue('example@example.com')}`;
                },
                when: function(val: any){
                    return !val.choice
                }
            },
            { 
                name: 'name',
                type: 'input',
                message: `Enter a ${chalk.underline(`valid username`)}.`,
                validate: function(value: string) {
                    if(value.length !== 0) {
                        return true;
                    }
    
                    return `Username cannot be empty`;
                },
                when: function(val: any){
                    return !val.choice
                }
            },
            { 
                name: 'full_name',
                type: 'input',
                message: `Enter the user's ${chalk.underline(`full name`)}.`,
                validate: function(value: string) {
                    if(value.length !== 0) {
                        return true;
                    }
    
                    return `Name of user cannot be empty`;
                }
            },
        ];

        const user = await inquirer.prompt(questions);
        
        if(user.choice == true) {
            // We need to autogenerate email...
            user.email = "dined18031@cebaike.com";
            user.name = "dined18031";
        }

        const password = await inputPassword();
        
        if('choice' in user) delete user.choice;

        return {
            user_choice: (isSignup ? 1 : 2),
            data: {
                ...user,
                password
            }
        };  
    }

    return {
        user_choice: 2,
        data: {
            username: "",
            password: ""
        }
    };

}

type multipleChoiceListProps = {
    choices: any[];
    message: string;
};


/*
 * Just a learning code 🙂
 */

// enum nanospinnerMethods { 
//     stop = 'stop',
//     success = 'success',
//     warn = 'warn',
//     error = 'error'
// };

// type spinnerMarkProps = {
//     [key in nanospinnerMethods]?: {
//         text: string;
//         color?: string;
//         mark?: string;
//     };
// }

type spinnerStopProps = {
    text: string;
    color?:string;
    mark?:string;
}

type spinnerProps = {
    text: string;
    color?: string;
    callback?: spinnerStopProps | ((arg: Spinner, answer: string) => any);
} | null;

const multipleChoiceList = async ({ choices, message } : multipleChoiceListProps, showSpinner: boolean = false, spinnerProps: spinnerProps = null, sleepTimer: number = 2000 ) : Promise<string> => {
    
    const choice = await inquirer?.prompt({
        name: 'question_1',
        type: 'list',
        message,
        choices
    });

    const answer = choice.question_1;

    if(showSpinner && spinnerProps != null){
        const { text, color, callback } = spinnerProps;
        const spinner = createSpinner(text).start({ color });
        await sleep(sleepTimer);
        typeof callback === "function" ? callback(spinner, answer) : spinner.stop(callback);
    }

    return answer;
};

const inputPassword = async () : Promise<string> => {
    console.log(`\n${chalk.white.bgRed('Password Requirements')}
    ➡  Password should be ${chalk.red.underline.bold('atleast 8 characters long')}.
    ➡  Password should contain ${chalk.red.underline.bold('atleast one capital and one small')} letter.
    ➡  Password should contain ${chalk.red.underline.bold('atleast one special character')}.
    `);
    const question = await inquirer.prompt({
        name: 'answer',
        type: 'password',
        message: 'Enter a password:',
        mask: '*',
        validate: function (value) {
            // await sleep();
            if (REGEX_PASSWORD.test(value)) {
                return true;
            }
    
            return `The password should:\n1. contain at least ${chalk.underline("one uppercase and one lowercase")} English letter.\n2. contain at least ${chalk.underline("one digit")} [0 - 9].\n3. contain at least ${chalk.underline("one special character")} [#?!@$%^&*-].\n4. be atleast ${chalk.underline("8 characters")} long.
            `
        }
    });
    
    return question.answer;
}

// const choices = await hello();

// console.info({...choices});

// const r = 

// console.log(r);