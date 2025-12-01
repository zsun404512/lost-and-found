const { When, Then } = require('@cucumber/cucumber');
const { expect } = require('chai');

When('I fetch the seeded open lost item by id', async function () {
  const ctx = this.context || {};
  const openLost = ctx.openLost;

  expect(openLost, 'Expected an openLost item in context; did you run the seeding step?').to.exist;
  expect(openLost._id, 'openLost item should have an _id').to.exist;

  const id = String(openLost._id);

  const res = await this.request.get(`/api/items/${id}`);
  this.response = res;
});

Then('the response JSON should represent the seeded open lost item', function () {
  const ctx = this.context || {};
  const openLost = ctx.openLost;

  expect(openLost, 'Expected an openLost item in context').to.exist;

  const res = this.response;
  expect(res, 'response not set').to.exist;

  const body = res.body;
  expect(body, 'response body should be an object').to.be.an('object');

  expect(String(body._id), 'item _id should match the seeded id').to.equal(String(openLost._id));
  expect(body.status, 'status should be open').to.equal('open');
  expect(body.type, 'type should be lost').to.equal('lost');
});
