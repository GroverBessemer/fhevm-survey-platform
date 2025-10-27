// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "./Survey.sol";

/// @title Survey Factory
/// @notice Factory contract for creating and managing surveys
contract SurveyFactory {
    /// @notice Array of all created surveys
    address[] public surveys;

    /// @notice Mapping from creator to their survey addresses
    mapping(address => address[]) public creatorSurveys;

    /// @notice Mapping from participant to surveys they participated in
    mapping(address => address[]) public participantSurveys;

    /// @notice Events
    event SurveyCreated(
        address indexed surveyAddress,
        address indexed creator,
        string title,
        uint256 indexed surveyId
    );

    /// @notice Create a new survey
    /// @param title Survey title
    /// @param description Survey description
    /// @param startTime Survey start time
    /// @param endTime Survey end time
    /// @param maxParticipants Maximum participants (0 = unlimited)
    /// @param privacyLevel Privacy level
    /// @param allowMultiple Allow multiple submissions
    /// @param questions Array of question configurations
    /// @return surveyAddress Address of the newly created survey
    function createSurvey(
        string memory title,
        string memory description,
        uint256 startTime,
        uint256 endTime,
        uint32 maxParticipants,
        Survey.PrivacyLevel privacyLevel,
        bool allowMultiple,
        Survey.Question[] memory questions
    ) external returns (address surveyAddress) {
        Survey newSurvey = new Survey(
            address(this),  // Pass factory address
            msg.sender,     // Pass creator address
            title,
            description,
            startTime,
            endTime,
            maxParticipants,
            privacyLevel,
            allowMultiple,
            questions
        );

        surveyAddress = address(newSurvey);
        surveys.push(surveyAddress);
        creatorSurveys[msg.sender].push(surveyAddress);

        uint256 surveyId = surveys.length - 1;
        emit SurveyCreated(surveyAddress, msg.sender, title, surveyId);

        return surveyAddress;
    }

    /// @notice Get total survey count
    function getSurveyCount() external view returns (uint256) {
        return surveys.length;
    }

    /// @notice Get surveys by creator
    /// @param creator Creator address
    /// @return Array of survey addresses
    function getSurveysByCreator(address creator) 
        external 
        view 
        returns (address[] memory) 
    {
        return creatorSurveys[creator];
    }

    /// @notice Get surveys by participant
    /// @param participant Participant address
    /// @return Array of survey addresses
    function getSurveysByParticipant(address participant) 
        external 
        view 
        returns (address[] memory) 
    {
        return participantSurveys[participant];
    }

    /// @notice Record participation (called externally after submission)
    /// @param participant Participant address
    /// @param surveyAddress Survey address
    function recordParticipation(address participant, address surveyAddress) 
        external 
    {
        // Verify caller is a valid survey
        bool isValid = false;
        for (uint256 i = 0; i < surveys.length; i++) {
            if (surveys[i] == msg.sender) {
                isValid = true;
                break;
            }
        }
        require(isValid, "Caller must be a registered survey");

        // Add to participant's surveys if not already present
        address[] storage participatedSurveys = participantSurveys[participant];
        bool alreadyRecorded = false;
        for (uint256 i = 0; i < participatedSurveys.length; i++) {
            if (participatedSurveys[i] == surveyAddress) {
                alreadyRecorded = true;
                break;
            }
        }

        if (!alreadyRecorded) {
            participantSurveys[participant].push(surveyAddress);
        }
    }

    /// @notice Get paginated surveys
    /// @param offset Starting index
    /// @param limit Number of surveys to return
    /// @return Array of survey addresses
    function getSurveysPaginated(uint256 offset, uint256 limit) 
        external 
        view 
        returns (address[] memory) 
    {
        uint256 total = surveys.length;
        if (offset >= total) {
            return new address[](0);
        }

        uint256 end = offset + limit;
        if (end > total) {
            end = total;
        }

        uint256 resultLength = end - offset;
        address[] memory result = new address[](resultLength);

        for (uint256 i = 0; i < resultLength; i++) {
            result[i] = surveys[offset + i];
        }

        return result;
    }
}

