@messaging
Feature: User-to-user messaging

  Background:
    Given the system is running

  Scenario: Two users can create a conversation and exchange messages
    Given a registered messaging user "Alice"
    And a registered messaging user "Bob"
    When "Alice" creates a conversation with "Bob"
    Then there should be a conversation between "Alice" and "Bob"

    When user "Alice" sends a message "Hello from A to B" in that conversation
    And user "Bob" sends a message "Reply from B to A" in that conversation
    And user "Alice" fetches messages for that conversation
    Then the messaging response should contain messages:
      | body              | sender |
      | Hello from A to B | Alice  |
      | Reply from B to A | Bob    |

    When user "Bob" marks that conversation as read
    And user "Bob" fetches messages for that conversation
    Then all messages in the messaging response should be marked as read by "Bob"

  Scenario: A non-participant cannot access or send messages in a conversation
    Given a registered messaging user "Alice"
    And a registered messaging user "Bob"
    And a registered messaging user "Charlie"
    And "Alice" creates a conversation with "Bob"
    Then there should be a conversation between "Alice" and "Bob"

    When user "Charlie" tries to get that conversation
    Then the messaging response status should be 403 or 404

    When user "Charlie" tries to list messages for that conversation
    Then the messaging response status should be 403 or 404

    When user "Charlie" tries to send a message "Intruding message" in that conversation
    Then the messaging response status should be 403 or 404

    When user "Charlie" tries to mark that conversation as read
    Then the messaging response status should be 403 or 404
