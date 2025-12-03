@items-show
Feature: Fetch a single item by id
  As a user of the API
  I want to retrieve a specific item by its id
  So that I can see its full details

  Background:
    Given the system is running
    And there are items in the system with different status and type

  Scenario: Fetch an existing open lost item by id
    When I fetch the seeded open lost item by id
    Then the response status should be 200
    And the response JSON should represent the seeded open lost item

  Scenario: Fetching a non-existent item returns 404
    When I send a GET request to "/api/items/000000000000000000000000"
    Then the response status should be 404
