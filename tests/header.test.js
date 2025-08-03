const mongoose = require('mongoose');
const Page = require('./helpers/page');

// test('header component renders correctly', () => {
//   // Test implementation goes here
// });

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

test('The header has correct text', async () => {
  const text = await page.getSelectorText('a.brand-logo');
  expect(text).toBe('Blogster');

});

test('clicking login to start oauth flow', async () => {
  await page.click('.right a');

  expect(await page.url()).toMatch(/accounts\.google\.com/);
});

test('When signed in, shows logout button', async () => {
  await page.loginUser();

  const text = await page.getSelectorText('a[href="/auth/logout"]');
  expect(text).toEqual('Logout');
});