@wip
Feature: Accessing protected resources with JWT
  As an authenticated user
  I want to use my JWT to access protected endpoints
  So that my data remains secure

  Background:
    Given the system is running
    And the user database contains a user with email "user@example.com" and password "StrongPass1!"
    And I have obtained a valid JWT for "user@example.com" via "/api/auth/login"

  Scenario: Access protected endpoint with valid token
    Given I set the "Authorization" header to "Bearer <valid_token>"
    When I send a GET request to "/api/protected-example"
    Then the response status should be 200
    And the request should have "req.user.email" equal to "user@example.com"

  Scenario: Access protected endpoint with missing token
    Given I do not send an "Authorization" header
    When I send a GET request to "/api/protected-example"
    Then the response status should be 401
    And the response JSON "message" should be "Not authorized, no token"

  Scenario: Access protected endpoint with invalid token
    Given I set the "Authorization" header to "Bearer INVALID.TOKEN.VALUE"
    When I send a GET request to "/api/protected-example"
    Then the response status should be 401
    And the response JSON "message" should be "Not authorized, token failed"

  Scenario: Access protected endpoint with expired token
    Given I have a JWT for "user@example.com" that is already expired
    And I set the "Authorization" header to "Bearer <expired_token>"
    When I send a GET request to "/api/protected-example"
    Then the response status should be 401
    And the response JSON "message" should be "Session expired. Please log in again."

  @commit-bcc77b5
  Scenario: Access protected endpoint with malformed token string
    Given I set the "Authorization" header to "Bearer this.is.not.a.jwt"
    When I send a GET request to "/api/protected-example"
    Then the response status should be 401
    And the response JSON "message" should be "Not authorized, token failed"
