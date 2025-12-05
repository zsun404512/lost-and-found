@messages-happy
Feature: Messaging happy path on /api/messages
  As two users of the system
  I want to create a conversation and exchange messages
  So that we can communicate securely

  Background:
    Given the system is running
    And there are two messaging users in the system

  Scenario: Two users create a conversation and exchange messages
    When the first messaging user creates a conversation with the second user
    And the first messaging user sends a message "Hello from A to B"
    And the second messaging user sends a message "Reply from B to A"
    And the first messaging user fetches the messages for that conversation
    Then the response status should be 200
    And the response JSON should contain 2 messages with bodies "Hello from A to B" and "Reply from B to A" in order

# prompt
# let's do some tests on messaging between users now
# create a simple scenario where users A and B message each other
# validate that the first user creates a conversation with the second user
# validate that the second user can fetch the messages for that conversation
# validate that the second user can send a message to the first user
# validate that the first user can fetch the messages for that conversation
# ensure that the response status is a success (200)
