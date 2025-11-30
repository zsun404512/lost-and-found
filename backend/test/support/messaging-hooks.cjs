const path = require('path');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const { BeforeAll, AfterAll, Before, After } = require('@cucumber/cucumber');

let connected = false;
let User;
let Conversation;
let Message;

BeforeAll(async function () {
  // Load environment variables from the project root .env if present.
});

Before({ tags: '@messaging' }, async function () {
  this.dbSnapshot = null;
});

After({ tags: '@messaging' }, async function (scenario) {
  const status = scenario && scenario.result && scenario.result.status;
  if (status !== 'PASSED') {
    // Leave any data in place for failed scenarios to aid debugging.
    return;
  }
});

AfterAll(async function () {
});

