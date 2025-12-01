Feature: User registration (signup)
  As a new user
  I want to register with my email and password
  So that I can log in and use the application

  Background:
    Given the system is running
    And the user database is empty

  Scenario: Successful signup with valid email and strong password
    Given I provide an email "user@example.com"
    And I provide a password "StrongPass1!"
    When I send a POST request to "/api/auth/register" with this email and password
    Then the response status should be 201
    And the response JSON "message" should be "User registered successfully"
    And the response JSON should contain a non-empty "_id"
    And the response JSON "email" should be "user@example.com"
    And the user "user@example.com" should exist in the database
    And the stored password for "user@example.com" should not equal "StrongPass1!"
    And the stored password for "user@example.com" should be a bcrypt hash

  Scenario: Signup fails when email is missing
    Given I provide no email
    And I provide a password "StrongPass1!"
    When I send a POST request to "/api/auth/register" with this email and password
    Then the response status should be 400
    And the response JSON "message" should be "Please provide email and password"

  Scenario: Signup fails when password is missing
    Given I provide an email "user@example.com"
    And I provide no password
    When I send a POST request to "/api/auth/register" with this email and password
    Then the response status should be 400
    And the response JSON "message" should be "Please provide email and password"

  Scenario Outline: Signup fails when email and/or password fields are empty strings
    Given I provide an email "<email>"
    And I provide a password "<password>"
    When I send a POST request to "/api/auth/register" with this email and password
    Then the response status should be 400
    And the response JSON "message" should be "Please provide email and password"

    Examples:
      | email            | password      |
      |                  | StrongPass1!  |
      | user@example.com |               |
      |                  |               |

  Scenario: Signup fails when user already exists
    Given a user already exists in the database with email "existing@example.com" and password "StrongPass1!"
    And I provide an email "existing@example.com"
    And I provide a password "AnotherPass2!"
    When I send a POST request to "/api/auth/register" with this email and password
    Then the response status should be 400
    And the response JSON "message" should be "User already exists"

  Scenario: Signup fails when password is shorter than 8 characters
    Given I provide an email "shortpass@example.com"
    And I provide a password "short7"
    When I send a POST request to "/api/auth/register" with this email and password
    Then the response status should be 400 or 500 depending on validation behavior
    And the response JSON "message" should indicate invalid user data or validation error

  Scenario: Signup succeeds with password exactly 8 characters
    Given I provide an email "minlength@example.com"
    And I provide a password "MinLen8!"
    When I send a POST request to "/api/auth/register" with this email and password
    Then the response status should be 201
    And the response JSON "message" should be "User registered successfully"

  Scenario: Email is stored in lowercase
    Given I provide an email "CaseSensitive@Example.COM"
    And I provide a password "StrongPass1!"
    When I send a POST request to "/api/auth/register" with this email and password
    Then the response status should be 201
    And the response JSON "email" should be "casesensitive@example.com"
    And the user in the database should have email "casesensitive@example.com"

  Scenario: Signup fails when another user registers with same email in different case
    Given a user already exists in the database with email "casesensitive@example.com" and password "StrongPass1!"
    And I provide an email "CaseSensitive@Example.COM"
    And I provide a password "AnotherPass2!"
    When I send a POST request to "/api/auth/register" with this email and password
    Then the response status should be 400
    And the response JSON "message" should be "User already exists"

  Scenario: Signup fails with server error when database is unavailable
    Given the database is unavailable
    And I provide an email "user@example.com"
    And I provide a password "StrongPass1!"
    When I send a POST request to "/api/auth/register" with this email and password
    Then the response status should be 500
    And the response JSON "message" should be "Server Error"
