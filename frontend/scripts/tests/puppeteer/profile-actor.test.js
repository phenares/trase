import puppeteer from 'puppeteer';

import mocks from '../mocks';

let page;
let browser;
const baseUrl = 'http://0.0.0.0:8081';

const openBrowser = visible =>
  visible && {
    headless: false,
    slowMo: 80,
    args: [`--window-size=1920,1080`]
  };

beforeAll(async () => {
  browser = await puppeteer.launch(openBrowser(false));
  page = await browser.newPage();
  await page.setRequestInterception(true);
  page.on('request', interceptedRequest => {
    const url = interceptedRequest
      .url()
      .replace('https:', '')
      .replace('http:', '');

    if (url in mocks) {
      setTimeout(
        () =>
          interceptedRequest.respond({
            status: 200,
            contentType: 'application/json',
            headers: {
              'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify(mocks[url])
          }),
        300
      );
    } else {
      interceptedRequest.continue();
    }
  });
});

afterAll(() => {
  browser.close();
});

describe('Profile Root search', () => {
  test(
    'search for bunge and click importer result',
    async () => {
      const nodeName = 'bunge';
      const nodeType = 'importer';
      const profileType = 'actor';

      expect.assertions(1);

      await page.goto(`${baseUrl}/profiles`);
      await page.waitForSelector('[data-test=profile-search]');
      await page.click('[data-test=search-input-desktop]');
      await page.type('[data-test=search-input-desktop]', nodeName);
      await page.waitForSelector(`[data-test=search-result-${nodeType}-${nodeName}]`);
      await page.click(`[data-test=search-result-${nodeType}-${nodeName}]`);

      expect(page.url().startsWith(`${baseUrl}/profile-${profileType}`)).toBe(true);
    },
    30000
  );
});

describe('Profile actor', () => {
  test(
    'All 5 widget sections attempt to load',
    async () => {
      expect.assertions(1);
      // await page.goto(`${baseUrl}/profile-actor?lang=en&nodeId=441&contextId=1&year=2015`);
      await page.waitForSelector('[data-test=loading-section]');
      const loadingSections = await page.$$('[data-test=loading-section]');
      expect(loadingSections.length).toBe(5);
    },
    30000
  );

  test(
    'Summary widget loads successfully',
    async () => {
      expect.assertions(3);
      await page.waitForSelector('[data-test=actor-summary]');
      const titleGroup = await page.$eval(
        '[data-test=title-group]',
        group => group.children.length
      );
      const companyName = await page.$eval(
        '[data-test=title-group-el-0]',
        title => title.textContent
      );
      const countryName = await page.$eval(
        '[data-test=title-group-el-1]',
        title => title.textContent
      );

      expect(titleGroup).toBe(4);
      expect(companyName.toLowerCase()).toMatch('bunge');
      expect(countryName.toLowerCase()).toMatch('brazil');
    },
    30000
  );

  test(
    'Top destination countries chart loads successfully',
    async () => {
      expect.assertions(2);
      await page.waitForSelector('[data-test=top-destination-countries]');
      const chartTitle = await page.$eval(
        '[data-test=top-destination-countries-chart-title]',
        el => el.textContent
      );
      const chartLines = await page.$$(
        '[data-test=top-destination-countries-chart-d3-line-points]'
      );

      expect(chartTitle.toLowerCase()).toMatch(
        'top destination countries of soy imported by bunge in 2015'
      );
      expect(chartLines.length).toBe(5);
    },
    30000
  );
});
