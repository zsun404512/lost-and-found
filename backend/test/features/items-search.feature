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