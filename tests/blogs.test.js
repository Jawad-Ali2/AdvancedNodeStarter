const { request } = require("express");
const Page = require("./helpers/page");
const mongoose = require("mongoose");

beforeEach(async () => {
    const page = await Page.build();
    await page.goto('http://localhost:3000');
    global.page = page;
});

afterEach(async () => {
    await page.close();
    global.page = null;
});

afterAll(async () => {
    await mongoose.disconnect();
});



describe('When Logged in', () => {
    beforeEach(async () => {
        await page.loginUser();
        await page.click('a[href="/blogs/new"]');
    });

    test('can see the blog create form', async () => {
        const title = await page.getSelectorText('.title>label');
        const content = await page.getSelectorText('.content>label');
        const cancelButton = await page.getSelectorText('form>a[href="/blogs"]');
        const nextButton = await page.getSelectorText('button[type="submit"]>span');


        expect(title).toBe('Blog Title');
        expect(content).toBe('Content');
        expect(cancelButton).toBe('Cancel');
        expect(nextButton).toBe('Next');
    });


    describe('And using invalid inputs', () => {
        beforeEach(async () => {
            page.waitFor('button[type="submit"]>span');
            await page.click('button[type="submit"]>span');
        });

        test('can see input field errors', async () => {
            const titleError = await page.getSelectorText('.title .red-text');
            const contentError = await page.getSelectorText('.content .red-text');
            expect(titleError).toEqual('You must provide a value');
            expect(contentError).toEqual('You must provide a value');
        });
    });


    describe('And using valid inputs', () => {
        const randomTitle = `Blog Title ${Math.floor(Math.random() * 1000)}`;
        const randomContent = `This is the content of the blog post. Random number: ${Math.floor(Math.random() * 1000)}`;
        beforeEach(async () => {
            await page.type('input[name="title"]', randomTitle);
            await page.type('input[name="content"]', randomContent);
            await page.click('button[type="submit"]>span');
        });

        test('can see the review page', async () => {
            await page.waitFor('h5');
            const title = await page.getSelectorText('h5');
            expect(title).toEqual('Please confirm your entries');
        });

        test('can see the blog on my blogs page after submitting', async () => {
            await page.waitFor('h5');
            await page.click('button.green');

            await page.waitFor('.card-title');
            const title = await page.getSelectorText('.card-title');
            const desc = await page.getSelectorText('.card-content>p');
            expect(title).toBe(randomTitle);
            expect(desc).toBe(randomContent);
        });

    });

});


describe('When Not Logged in', () => {
    const actions = [
        {
            method: 'get',
            path: '/api/blogs',
        },
        {
            method: 'post',
            path: '/api/blogs',
            data: { title: 'Test Blog', content: 'This is a test blog.' }
        }
    ]

    test('Blogs related actions are prohibited', async () => {
        const results = await page.execRequests(actions);

        results.every(result => {
            expect(result).toEqual({ error: 'You must log in!' });
        });
    });
});