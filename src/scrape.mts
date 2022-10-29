import puppeteer from 'puppeteer-extra';
import AdblockerPlugin from 'puppeteer-extra-plugin-adblocker';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import dotenv from 'dotenv';
import { sleep } from './index.mjs';
import { getName, _register, genderTypes } from './user.mjs';
import { ElementHandle } from 'puppeteer';

dotenv.config();

const AnonymizePlugin = await import("puppeteer-extra-plugin-anonymize-ua");

if (! ( 'headless' in process.env ) ){
    // So this is headless...
    process.env['headless'] = 'false'
}

const headless = process.env.HEADLESS === 'true' ? true : false

puppeteer.use(StealthPlugin());
puppeteer.use(AnonymizePlugin.default());
puppeteer.use(AdblockerPlugin({ blockTrackers: true }));

const browser = await puppeteer.launch( 
    { 
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
    console.log(
        {
            selector,
            entry: key,
            handle: value,
        } 
    );
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

console.log(elements);

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