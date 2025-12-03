const { When, Then } = require('@cucumber/cucumber');
const { expect } = require('chai');

When('I search for the seeded slug on {string}', async function (basePath) {
    const slug = this.context && this.context.slug;
    expect(slug, 'Expected a seeded slug in context').to.exist;

    const params = new URLSearchParams({ search: slug, status: 'all' });
    const path = `${basePath}?${params.toString()}`;
    const res = await this.request.get(path);
    this.response = res;
});

Then(
    'every item in the response JSON title or description should contain the seeded slug',
    function () {
        const res = this.response;
        expect(res, 'response not set').to.exist;
        const items = res.body;
        expect(items, 'response body should be an array').to.be.an('array');
        expect(items.length, 'expected at least one item in search results').to.be.greaterThan(0);
        const slug = this.context && this.context.slug;
        expect(slug, 'Expected a seeded slug in context').to.exist;
        for (const item of items) {
            const title = item.title || '';
            const description = item.description || '';
            const combined = `${title} ${description}`;
            expect(combined.includes(slug), `Expected item "${title}" to contain slug "${slug}" in title or description`).to.be.true;
        }
    }
);