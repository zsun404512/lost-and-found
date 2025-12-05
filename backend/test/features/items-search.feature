@items-search
Feature: Items search on /api/items
  As a user of the API
  I want to search items by text
  So that I can quickly find relevant posts

  Background:
    Given the system is running
    And there are items in the system with different status and type

  Scenario: Search returns only items matching the seeded slug
    When I search for the seeded slug on "/api/items"
    Then the response status should be 200
    And every item in the response JSON title or description should contain the seeded slug

# prompt
# great! now please generate me tests for the search features
# make sure that the tests are in the same format as @items-filter.feature 
# keep note of the error messages that I just sent, and write tests that validate the
# expected behavior of files in @backend/src