import path from 'node:path';
import './env.mjs'
import { sleep } from './index.mjs';
import { getName, _register, genderTypes } from './user.mjs';
import { ElementHandle } from 'puppeteer';
import puppeteer from 'puppeteer-extra';
import AdblockerPlugin from 'puppeteer-extra-plugin-adblocker';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';

// Anonymize the User Agent when lauching the browser...
const AnonymizePlugin = await import("puppeteer-extra-plugin-anonymize-ua");

// Additional Check
if( 'EXECUTABLE_PATH' in process.env && process.env.executablePath?.length == 0 ) {
    delete process.env['EXECUTABLE_PATH'];
}

// Fixed bug where `puppeteer-core` does not lauch without an executable
if( ! ( 'EXECUTABLE_PATH' in process.env ) ) {
    // code spillitng technique..
    // Commonly used in React.js so that Vite like builders can easily tree-shake & split code.
    const tmp = await import('puppeteer');
    const executablePath = tmp.executablePath();
    
    const { default: chalk } = await import("chalk");

    if( executablePath.length == 0 || path.resolve(executablePath) !== executablePath ) {
        // 😞 Could not find the path
        throw new Error(`Sorry we could not find a valid executable path for the browser instance. Set an enviroment variable poiting to a valid executable path: 
            ${chalk.bold("EXECUTABLE_PATH")}=${chalk.red.italic('usr/path/to/executable')}
        `);
    }
    
    console.warn(`Sorry executable path of the browser was not found. We are using the default ${chalk.bold.italic(executablePath)} for the rest of the operation. If you want to override the feature please set an enviroment variable:
        ${chalk.bold("EXECUTABLE_PATH")}=${chalk.red.italic('usr/path/to/executable')}
    `)

    process.env['EXECUTABLE_PATH'] = executablePath;
}

if (! ( 'headless' in process.env ) ){
    // So this is headless...
    process.env['headless'] = 'false'
}

const headless = process.env.HEADLESS === 'true' ? true : false
const executablePath = process.env.EXECUTABLE_PATH;

puppeteer.use(StealthPlugin());
puppeteer.use(AnonymizePlugin.default());
puppeteer.use(AdblockerPlugin({ blockTrackers: true }));

const browser = await puppeteer.launch( 
    {
        executablePath,
        headless,
		defaultViewport: null,
		ignoreDefaultArgs: ['--disable-extensions'],
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--use-fake-ui-for-media-stream', '--start-maximized', ], 
    }
);

const context = browser.defaultBrowserContext();

// Override the permission for notifications...
await context.overridePermissions(
    "https://instagram.com/", ["notifications"]
);


// Start a new browser tab
const page = await browser.newPage();

// Sign up

await Promise.all([
    page.goto('https://www.instagram.com/accounts/emailsignup/', {
        waitUntil: 'domcontentloaded',
    }),
    page.waitForNetworkIdle()
]);

type element = {
    selector: string,
    entry: string,
    handle: ElementHandle | undefined | null,
};

const selector = (selector: string, key: string, value: ElementHandle | undefined | null ) => {
    return {
        selector,
        entry: key,
        handle: value,
    };
}


const elements: element[] = await Promise.all([
    page.waitForSelector('input[name="username"]', {
        visible: true
    })
    .then( e => selector('input[name="username"]', 'username', e))
    .catch( () => selector( 'input[name="username"]', 'username', undefined )),
    
    page.waitForSelector('input[name="fullName"]', {
        visible: true
    })
    .then( e => selector('input[name="fullName"]', 'fullName', e))
    .catch( () => selector( 'input[name="fullName"]', 'fullName', undefined )),
    
    page.waitForSelector('input[name="emailOrPhone"]', {
        visible: true
    })
    .then( e => selector('input[name="emailOrPhone"]', 'address', e))
    .catch( () => selector( 'input[name="emailOrPhone"]', 'address', undefined )),
    
    page.waitForSelector('input[type="password"]', {
        visible: true
    })
    .then( e => selector('input[type="password"]', 'password', e))
    .catch( (e) => {
        console.error(e);
        return selector( 'input[type="password"]', 'password', undefined )
    })
]).then( values => values.filter( (value) => typeof value.handle !== 'undefined' ));

const { firstName, lastName, fullName ="" } = getName(genderTypes.MALE);
const { address = "", password = "", username = "", success} = await _register(process.env?.GW_DOMAIN ?? process.env?.TM_DOMAIN ?? undefined, {
    firstName,
    lastName
}, true);

const user: any = {
    fullName,
    address,
    password,
    username,
};

const [ a, b, c, d ] = elements;

await a.handle?.click({
    button: 'left'
});

await page.type(a.selector, user[a.entry], {
    delay: 100
});

await page.screenshot({path: './images/1.png'});

await sleep();

await b.handle?.click({
    button: 'left'
});

await page.type(b.selector, user[b.entry], {
    delay: 100
});

await page.screenshot({path: './images/2.png'});

await sleep();

await c.handle?.click({
    button: 'left'
});

await page.type(c.selector, user[c.entry], {
    delay: 100
})

await page.screenshot({path: './images/3.png'});

await sleep();

await d.handle?.click({
    button: 'left'
});

await page.type(d.selector, user[d.entry], {
    delay: 100
})

await page.screenshot({path: './images/4.png'});

await sleep();

console.log("✨ Check all screenshots");

await sleep(30 * 1000);

await page.screenshot({path: './images/full_page.png'});

await page.close();

await browser.close();

console.log("Thank you! 😊");