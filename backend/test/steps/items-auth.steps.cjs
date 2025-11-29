const { Given, When, Then } = require('@cucumber/cucumber');
const { expect } = require('chai');

// Reuse jsonField helper from auth steps if needed; redefined here for isolation.
function jsonField(path, obj) {
  const parts = path.split('.');
  return parts.reduce((acc, key) => (acc == null ? acc : acc[key]), obj);
}

Given('I prepare an item payload:', function (dataTable) {
  const rows = dataTable.rowsHash();
  this.body.itemPayload = rows;
});

Given('I prepare an item update payload:', function (dataTable) {
  const rows = dataTable.rowsHash();
  this.body.itemUpdatePayload = rows;
});

When('I send a POST request to {string} with this payload', async function (path) {
  const payload = this.body.itemPayload || {};
  const res = await this.request.post(path).set(this.headers).send(payload);
  this.response = res;
});

When('I send a DELETE request to {string}', async function (path) {
  const resolved = path.replace('{ownerItemId}', this.context.ownerItemId || '');
  const res = await this.request.delete(resolved).set(this.headers);
  this.response = res;
});

When('I send a PUT request to {string} with this payload', async function (path) {
  const resolved = path
    .replace('{editableItemId}', this.context.editableItemId || '')
    .replace('{toggleItemId}', this.context.toggleItemId || '');
  const payload = this.body.itemUpdatePayload || {};
  const res = await this.request.put(resolved).set(this.headers).send(payload);
  this.response = res;
});

Then(
  'the "user" field of the created item should equal the "userId" in the JWT payload',
  function () {
    return 'pending';
  }
);

Then('there is an existing item created by {string} with title {string}', function () {
  return 'pending';
});

Then('I remember the ID of this item as {string}', function () {
  return 'pending';
});

Then('the user database also contains a user with email {string} and password {string}', function () {
  return 'pending';
});
