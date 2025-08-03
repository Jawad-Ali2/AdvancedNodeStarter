const puppeteer = require('puppeteer');
const userFactory = require('../factories/userFactory');
const sessionFactory = require('../factories/sessionFactory');

class Page {
    static async build() {
        const browser = await puppeteer.launch({ headless: true });

        const pupPage = await browser.newPage();
        const page = new Page(pupPage);

        return new Proxy(page, {
            get: function (target, property) {
                return page[property] || browser[property] || pupPage[property];
            }
        })
    }

    constructor(page) {
        this.page = page;
    }

    async loginUser() {
        const user = await userFactory();

        const { session, sig } = sessionFactory(user);

        await this.page.setCookie({
            name: 'session',
            value: session,
        });
        await this.page.setCookie({
            name: 'session.sig',
            value: sig,
        });
        await this.page.goto('http://localhost:3000/blogs');

        await this.page.waitFor('a[href="/auth/logout"]');
    }

    async getSelectorText(selector) {
        return await this.page.$eval(selector, el => el.innerHTML);
    }

    get(path) {
        return this.page.evaluate(async (_path) => {
            const res = await fetch(_path, {
                credentials: 'same-origin',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            return await res.json();
        }, path);
    }

    post(path, data) {
        return this.page.evaluate(async (_path, _data) => {
            const res = await fetch(_path, {
                method: 'POST',
                credentials: 'same-origin',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ title: _data.title, content: _data.content })
            });
            return await res.json();
        }, path, data);
    }

    execRequests(actions) {
        return Promise.all(actions.map(({ method, path, data }) => {
            return this[method](path, data);
        }));
    }
}

module.exports = Page;