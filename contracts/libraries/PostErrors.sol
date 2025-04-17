// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

library PostErrors {
    // Core errors
    error EmptyMetadata();
    error InvalidMetadata();
    error InvalidJsonFormat();
    error InvalidParentPost();
    error PostDeleted();
    error NotPostCreator();
    error Unauthorized();
    error InsufficientAccess();

    // Field errors
    error MissingTitleField();
    error MissingContentField();
    error MissingTypeField();
    error EmptyField(string field);

    // Interaction errors
    error AlreadyInteracted();
    error AlreadyReported();
    error InvalidInteractionType();
    error CannotInteractWithOwnPost();

    // Access control errors
    error NotTribeMember(uint status);
    error NotTribeAdmin();
    error InvalidCollectible();
    error InvalidCollectibleContract();

    // Rate limiting errors
    error CooldownActive();
    error BatchCooldownActive();
    error BatchLimitExceeded();

    // Encryption errors
    error InvalidEncryptionKey();
    error InvalidSigner();
    error InvalidSignature();

    // Feed errors
    error InvalidOffset();
    error InvalidLimit();
    error InvalidPagination();

    // Validation errors
    error InvalidPostType();
    error InvalidField();
    error RequiredFieldMissing();
} 