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

  Scenario: Default items request shows only open items
    Given there are items in the system with different status and type
    When I send a GET request to "/api/items"
    Then the response status should be 200
    And every item in the response JSON should have status "open"

# initial prompt
# assume that you are a high end quality assurance software engineer, with specialty in automated tests that test the system
# I need some tests that go along with the cucumber testing framework
# the tests should follow the other tests in @backend/test/features
# the test should verify that the items are filtered correctly
# create a few different scenarios, including
# different statuses
# different types
# different combinations of statuses and types
# different combinations of statuses and types and other parameters
# the tests should be written in a way that is easy to read and understand
# for all of these tests, leave a framework in the corresponding .cjs files with todos so that I can fill in the code myself and write tests