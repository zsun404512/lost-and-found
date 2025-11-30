@items-filters
Feature: Items filters on /api/items
  As a user of the API
  I want to filter items by status and type
  So that I only see the posts I care about

  Background:
    Given the system is running

  Scenario: Filter resolved found items
    Given there are items in the system with different status and type
    When I send a GET request to "/api/items?status=resolved&type=found"
    Then the response status should be 200
    And every item in the response JSON should have status "resolved" and type "found"

  Scenario: Filter open lost items
    Given there are items in the system with different status and type
    When I send a GET request to "/api/items?status=open&type=lost"
    Then the response status should be 200
    And every item in the response JSON should have status "open" and type "lost"
    
  Scenario: Filter open found items
    Given there are items in the system with different status and type
    When I send a GET request to "/api/items?status=open&type=found"
    Then the response status should be 200
    And every item in the response JSON should have status "open" and type "found"

