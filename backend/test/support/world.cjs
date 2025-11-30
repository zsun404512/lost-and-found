const supertest = require('supertest');
const { setWorldConstructor } = require('@cucumber/cucumber');

class ApiWorld {
  constructor() {
    const baseUrl = process.env.API_BASE_URL || 'http://localhost:4000';
    this.request = supertest(baseUrl);
    this.response = null;
    this.headers = {};
    this.body = {};
    this.context = {};
  }
}

setWorldConstructor(ApiWorld);
