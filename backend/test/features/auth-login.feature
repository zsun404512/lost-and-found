@wip
Feature: User login (authentication)
  As a registered user
  I want to log in with my email and password
  So that I can obtain a JWT token to access protected resources

  Background:
    Given the system is running
    And the user database contains a user with email "user@example.com" and password "StrongPass1!"

  Scenario: Successful login with correct email and password
    Given I provide a login email "user@example.com"
    And I provide a login password "StrongPass1!"
    When I send a POST request to "/api/auth/login" with this email and password
    Then the response status should be 200
    And the response JSON "message" should be "Login successful"
    And the response JSON "email" should be "user@example.com"
    And the response JSON should contain a non-empty "token"
    And the token should be a valid JWT signed with the server secret
    And the token payload should contain the user's "_id" and "email" "user@example.com"
    And the token "exp" claim should be approximately 1 hour in the future

  Scenario: Login fails when email is missing
    Given I provide no login email
    And I provide a login password "StrongPass1!"
    When I send a POST request to "/api/auth/login" with this email and password
    Then the response status should be 400
    And the response JSON "message" should be "Please provide email and password"

  Scenario: Login fails when password is missing
    Given I provide a login email "user@example.com"
    And I provide no login password
    When I send a POST request to "/api/auth/login" with this email and password
    Then the response status should be 400
    And the response JSON "message" should be "Please provide email and password"

  Scenario Outline: Login fails with empty email and/or password strings
    Given I provide a login email "<email>"
    And I provide a login password "<password>"
    When I send a POST request to "/api/auth/login" with this email and password
    Then the response status should be 400
    And the response JSON "message" should be "Please provide email and password"

    Examples:
      | email              | password       |
      | ""                 | "StrongPass1!" |
      | "user@example.com" | ""             |
      | ""                 | ""             |

  Scenario: Login fails when user does not exist
    Given I provide a login email "unknown@example.com"
    And I provide a login password "AnyPass1!"
    When I send a POST request to "/api/auth/login" with this email and password
    Then the response status should be 401
    And the response JSON "message" should be "Invalid credentials"

  Scenario: Login fails when password is incorrect
    Given I provide a login email "user@example.com"
    And I provide a login password "WrongPass!"
    When I send a POST request to "/api/auth/login" with this email and password
    Then the response status should be 401
    And the response JSON "message" should be "Invalid credentials"

  Scenario: Login behavior when email case does not match stored lowercase form
    Given the user in the database has email "user@example.com"
    And I provide a login email "User@Example.COM"
    And I provide a login password "StrongPass1!"
    When I send a POST request to "/api/auth/login" with this email and password
    Then the behavior should be defined depending on whether the system normalizes login emails
    And the response status and message should match the chosen behavior

  Scenario: Login fails with server error when database is unavailable
    Given the database is unavailable
    And I provide a login email "user@example.com"
    And I provide a login password "StrongPass1!"
    When I send a POST request to "/api/auth/login" with this email and password
    Then the response status should be 500
    And the response JSON "message" should be "Server Error"
