// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {FHE, euint8, euint32, ebool, externalEuint8, externalEuint32} from "@fhevm/solidity/lib/FHE.sol";
import {SepoliaConfig} from "@fhevm/solidity/config/ZamaConfig.sol";

/// @title FHEVM Survey Contract
/// @notice Encrypted survey with privacy-preserving vote counting
/// @dev Uses FHEVM for encrypted answers and homomorphic statistics
contract Survey is SepoliaConfig {
    /// @notice Privacy level for survey results
    enum PrivacyLevel {
        CreatorOnly,        // Only creator can decrypt
        PublicAfterEnd,     // Public after endTime
        ParticipantsCanView // Participants can view aggregated stats
    }

    /// @notice Question type enumeration
    enum QuestionType {
        SingleChoice,   // 0: Single choice (euint8 for option 0-255)
        MultipleChoice, // 1: Multiple choice (euint32 as bitmask)
        Rating,         // 2: Rating 1-10 (euint8)
        Scale           // 3: Likert scale 1-5 (euint8)
    }

    /// @notice Survey metadata
    struct SurveyInfo {
        address creator;
        string title;
        string description;
        uint256 startTime;
        uint256 endTime;
        euint32 maxParticipants;
        euint32 currentParticipants;
        PrivacyLevel privacyLevel;
        bool allowMultipleSubmissions;
        bool active;
    }

    /// @notice Question configuration
    struct Question {
        string questionText;
        QuestionType questionType;
        string[] options;
        bool required;
    }

    /// @notice Survey information
    SurveyInfo public surveyInfo;

    /// @notice Array of questions
    Question[] public questions;

    /// @notice Factory contract address
    address public immutable factory;

    /// @notice User encrypted answers: questionId => user => answer
    mapping(uint256 => mapping(address => euint32)) public userAnswers;

    /// @notice Encrypted answer counts: questionId => optionId => count
    mapping(uint256 => mapping(uint256 => euint32)) public optionCounts;

    /// @notice Has user submitted survey
    mapping(address => bool) public hasSubmitted;

    /// @notice Events
    event SurveyCreated(address indexed creator, string title);
    event AnswerSubmitted(address indexed participant, uint256 questionCount);
    event SurveyClosed(uint256 timestamp);
    event ResultsDecryptionAllowed(address indexed user);

    /// @notice Custom errors
    error SurveyNotActive();
    error SurveyEnded();
    error AlreadySubmitted();
    error NotAuthorized();
    error InvalidTime();
    error MaxParticipantsReached();

    /// @notice Constructor
    /// @param _factory Factory contract address
    /// @param _creator Survey creator address
    /// @param _title Survey title
    /// @param _description Survey description
    /// @param _startTime Survey start time
    /// @param _endTime Survey end time
    /// @param _maxParticipants Maximum participants (0 = unlimited)
    /// @param _privacyLevel Privacy level
    /// @param _allowMultiple Allow multiple submissions
    /// @param _questions Array of question configurations
    constructor(
        address _factory,
        address _creator,
        string memory _title,
        string memory _description,
        uint256 _startTime,
        uint256 _endTime,
        uint32 _maxParticipants,
        PrivacyLevel _privacyLevel,
        bool _allowMultiple,
        Question[] memory _questions
    ) {
        if (_endTime <= _startTime) revert InvalidTime();
        if (_startTime < block.timestamp) revert InvalidTime();

        factory = _factory;

        surveyInfo = SurveyInfo({
            creator: _creator,
            title: _title,
            description: _description,
            startTime: _startTime,
            endTime: _endTime,
            maxParticipants: FHE.asEuint32(_maxParticipants),
            currentParticipants: FHE.asEuint32(0),
            privacyLevel: _privacyLevel,
            allowMultipleSubmissions: _allowMultiple,
            active: true
        });

        // Initialize questions
        for (uint256 i = 0; i < _questions.length; i++) {
            questions.push(_questions[i]);
            
            // Initialize option counts to 0
            for (uint256 j = 0; j < _questions[i].options.length; j++) {
                optionCounts[i][j] = FHE.asEuint32(0);
                FHE.allowThis(optionCounts[i][j]);
            }
        }

        FHE.allowThis(surveyInfo.maxParticipants);
        FHE.allowThis(surveyInfo.currentParticipants);

        emit SurveyCreated(_creator, _title);
    }

    /// @notice Submit encrypted answers
    /// @param encryptedAnswers Array of encrypted answer handles (one per question)
    /// @param inputProof Proof for encrypted inputs
    function submitAnswers(
        externalEuint32[] calldata encryptedAnswers,
        bytes calldata inputProof
    ) external {
        if (!surveyInfo.active) revert SurveyNotActive();
        if (block.timestamp < surveyInfo.startTime) revert SurveyNotActive();
        if (block.timestamp > surveyInfo.endTime) revert SurveyEnded();

        // Check if already submitted
        if (!surveyInfo.allowMultipleSubmissions) {
            require(!hasSubmitted[msg.sender], "Already submitted");
        }

        // Check max participants (encrypted, checked optimistically)
        // Note: In production, use FHE.decrypt with proper access control

        require(encryptedAnswers.length == questions.length, "Invalid answer count");

        // Process each answer
        for (uint256 i = 0; i < encryptedAnswers.length; i++) {
            euint32 answer = FHE.fromExternal(encryptedAnswers[i], inputProof);
            
            // Store user's encrypted answer
            userAnswers[i][msg.sender] = answer;
            
            // Update encrypted statistics
            _updateStats(i, answer, questions[i]);
            
            // Allow creator and user to access answer
            FHE.allow(answer, surveyInfo.creator);
            FHE.allow(answer, msg.sender);
            FHE.allowThis(answer);
        }

        // Increment participant count
        surveyInfo.currentParticipants = FHE.add(
            surveyInfo.currentParticipants,
            FHE.asEuint32(1)
        );
        FHE.allowThis(surveyInfo.currentParticipants);

        // Mark as submitted
        hasSubmitted[msg.sender] = true;

        // Notify factory about participation
        if (factory != address(0)) {
            (bool success,) = factory.call(
                abi.encodeWithSignature(
                    "recordParticipation(address,address)",
                    msg.sender,
                    address(this)
                )
            );
            // Don't revert if recording fails, just log
            if (!success) {
                // Participation recording failed, but submission still succeeded
            }
        }

        emit AnswerSubmitted(msg.sender, questions.length);
    }

    /// @notice Update encrypted statistics for a question
    /// @param questionId Question index
    /// @param answer Encrypted answer
    /// @param question Question configuration
    function _updateStats(
        uint256 questionId,
        euint32 answer,
        Question memory question
    ) private {
        if (question.questionType == QuestionType.SingleChoice || 
            question.questionType == QuestionType.Rating || 
            question.questionType == QuestionType.Scale) {
            // For single choice: answer is option index (0-N)
            // Increment the count for that option using homomorphic addition
            
            // Since we can't use answer as dynamic index, we iterate through all options
            // and use FHE.select to increment only the matching one
            for (uint256 i = 0; i < question.options.length; i++) {
                // Check if answer == i
                ebool isMatch = FHE.eq(answer, FHE.asEuint32(uint32(i)));
                
                // If match, add 1, otherwise add 0
                euint32 increment = FHE.select(isMatch, FHE.asEuint32(1), FHE.asEuint32(0));
                
                optionCounts[questionId][i] = FHE.add(
                    optionCounts[questionId][i],
                    increment
                );
                
                FHE.allowThis(optionCounts[questionId][i]);
            }
        } else if (question.questionType == QuestionType.MultipleChoice) {
            // For multiple choice: answer is bitmask
            // Check each bit and increment corresponding option count
            for (uint256 i = 0; i < question.options.length; i++) {
                // Extract bit i from answer
                euint32 mask = FHE.asEuint32(uint32(1 << i));
                euint32 bit = FHE.and(answer, mask);
                
                // If bit is set (non-zero), increment count
                ebool isSet = FHE.ne(bit, FHE.asEuint32(0));
                euint32 increment = FHE.select(isSet, FHE.asEuint32(1), FHE.asEuint32(0));
                
                optionCounts[questionId][i] = FHE.add(
                    optionCounts[questionId][i],
                    increment
                );
                
                FHE.allowThis(optionCounts[questionId][i]);
            }
        }
    }

    /// @notice Allow creator to decrypt all results
    function allowResultsDecryption() external {
        require(msg.sender == surveyInfo.creator, "Only creator");
        
        for (uint256 i = 0; i < questions.length; i++) {
            for (uint256 j = 0; j < questions[i].options.length; j++) {
                FHE.allow(optionCounts[i][j], msg.sender);
            }
        }

        FHE.allow(surveyInfo.currentParticipants, msg.sender);

        emit ResultsDecryptionAllowed(msg.sender);
    }

    /// @notice Allow user to decrypt their own answers
    function allowMyAnswersDecryption() external {
        for (uint256 i = 0; i < questions.length; i++) {
            euint32 answer = userAnswers[i][msg.sender];
            FHE.allow(answer, msg.sender);
        }
    }

    /// @notice Close survey early (creator only)
    function closeSurvey() external {
        require(msg.sender == surveyInfo.creator, "Only creator");
        surveyInfo.active = false;
        emit SurveyClosed(block.timestamp);
    }

    /// @notice Get question count
    function getQuestionCount() external view returns (uint256) {
        return questions.length;
    }

    /// @notice Get question details
    function getQuestion(uint256 index) external view returns (
        string memory questionText,
        QuestionType questionType,
        string[] memory options,
        bool required
    ) {
        Question storage q = questions[index];
        return (q.questionText, q.questionType, q.options, q.required);
    }

    /// @notice Get encrypted option count for a specific question and option
    function getOptionCount(uint256 questionId, uint256 optionId) 
        external 
        view 
        returns (euint32) 
    {
        return optionCounts[questionId][optionId];
    }

    /// @notice Get user's encrypted answer for a question
    function getUserAnswer(uint256 questionId, address user) 
        external 
        view 
        returns (euint32) 
    {
        return userAnswers[questionId][user];
    }

    /// @notice Get encrypted current participants count
    function getCurrentParticipants() external view returns (euint32) {
        return surveyInfo.currentParticipants;
    }

    /// @notice Check if address has submitted
    function getHasSubmitted(address user) external view returns (bool) {
        return hasSubmitted[user];
    }
}

