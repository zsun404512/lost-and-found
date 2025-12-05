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

# prompt
# the tests are working well
# I need a few more tests to validate the expected behavior of files in @backend/src
# make sure that the tests are in the same format as @items-filter.feature
# the tests that you should write now should correspond with showing items 
# make sure to try to fetch both items that are existing and non existent
