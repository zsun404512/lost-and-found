@commit-9d052e6
Feature: Items API with authentication
  As an authenticated user
  I want item operations to be protected by JWT
  So that only authorized users can create and manage items

  Background:
    Given the system is running
    And the user database contains a user with email "user@example.com" and password "StrongPass1!"
    And I have obtained a valid JWT for "user@example.com" via "/api/auth/login"

  Scenario: Creating an item without a token is rejected
    Given I do not send an "Authorization" header
    And I prepare an item payload:
      | title       | Lost Backpack   |
      | type        | lost            |
      | description | Black backpack |
      | location    | Campus library |
      | date        | 2025-11-01     |
    When I send a POST request to "/api/items" with this payload
    Then the response status should be 401
    And the response JSON "message" should be "Not authorized, no token"

  Scenario: Creating an item with an invalid token is rejected
    Given I set the "Authorization" header to "Bearer INVALID.TOKEN.VALUE"
    And I prepare an item payload:
      | title       | Lost Backpack   |
      | type        | lost            |
      | description | Black backpack |
      | location    | Campus library |
      | date        | 2025-11-01     |
    When I send a POST request to "/api/items" with this payload
    Then the response status should be 401
    And the response JSON "message" should be "Not authorized, token failed"

  Scenario: Creating an item with a valid token succeeds and links it to the user
    Given I set the "Authorization" header to "Bearer <valid_token_for_user@example.com>"
    And I prepare an item payload:
      | title       | Lost Backpack   |
      | type        | lost            |
      | description | Black backpack |
      | location    | Campus library |
      | date        | 2025-11-01     |
    When I send a POST request to "/api/items" with this payload
    Then the response status should be 201
    And the response JSON "title" should be "Lost Backpack"
    And the response JSON "type" should be "lost"
    And the response JSON should contain a non-empty "user"
    And the "user" field of the created item should equal the "userId" in the JWT payload

  Scenario: Only the item owner can delete an item
    Given I set the "Authorization" header to "Bearer <valid_token_for_user@example.com>"
    And there is an existing item created by "user@example.com" with title "Owner Item"
    And I remember the ID of this item as "ownerItemId"
    And the user database also contains a user with email "other@example.com" and password "StrongPass2!"
    And I have obtained a valid JWT for "other@example.com" via "/api/auth/login"
    And I set the "Authorization" header to "Bearer <valid_token_for_other@example.com>"
    When I send a DELETE request to "/api/items/{ownerItemId}"
    Then the response status should be 401
    And the response JSON "message" should be "User not authorized"

  Scenario: Only the item owner can update an item
    Given I set the "Authorization" header to "Bearer <valid_token_for_user@example.com>"
    And there is an existing item created by "user@example.com" with title "Editable Item"
    And I remember the ID of this item as "editableItemId"
    And the user database also contains a user with email "other@example.com" and password "StrongPass2!"
    And I have obtained a valid JWT for "other@example.com" via "/api/auth/login"
    And I set the "Authorization" header to "Bearer <valid_token_for_other@example.com>"
    And I prepare an item update payload:
      | title | Hacked Title |
    When I send a PUT request to "/api/items/{editableItemId}" with this payload
    Then the response status should be 401
    And the response JSON "message" should be "User not authorized"

  Scenario: Only the item owner can toggle resolved status
    Given I set the "Authorization" header to "Bearer <valid_token_for_user@example.com>"
    And there is an existing item created by "user@example.com" with title "Toggle Item" and status "open"
    And I remember the ID of this item as "toggleItemId"
    And the user database also contains a user with email "other@example.com" and password "StrongPass2!"
    And I have obtained a valid JWT for "other@example.com" via "/api/auth/login"
    And I set the "Authorization" header to "Bearer <valid_token_for_other@example.com>"
    When I send a PUT request to "/api/items/{toggleItemId}/toggle-resolve"
    Then the response status should be 401
    And the response JSON "message" should be "User not authorized"
