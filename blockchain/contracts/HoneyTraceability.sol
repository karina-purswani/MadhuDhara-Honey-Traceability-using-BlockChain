// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title HoneyTraceability
 * @dev Smart Contract for Honey Chain - KVIC Honey Mission Traceability & Authenticity Ledger.
 * Provides immutable provenance records for honey batches from rural beekeeper hives to end consumers.
 */
contract HoneyTraceability {
    address public immutable owner;

    enum VerificationStatus { VERIFIED, SUSPICIOUS, INVALID }

    struct BatchEvent {
        string eventType;      // e.g. "HIVE_REGISTERED", "HARVESTED", "EXTRACTED", "QUALITY_TESTED"
        string title;
        uint256 timestamp;
        string actor;          // e.g. "Ramesh Patil (Beekeeper)", "KVIC Quality Lab"
        string actorRole;
        string location;
        string detailsHash;    // Keccak-256 hash or IPFS CID of detailed quality parameters
        bool verified;
    }

    struct HoneyBatch {
        string batchNumber;          // e.g. "HC-MH-NAS-2026-00047"
        string hiveId;               // Unique Digital Hive ID e.g. "HC-HIVE-MH-NAS-00123"
        string beekeeperId;          // Registered Beekeeper ID
        string floralSource;         // Floral source e.g. "Multi-Floral Wild Forest"
        string originLocation;       // Village, District, State
        uint256 harvestTimestamp;
        uint256 packagingTimestamp;
        uint256 moistureContentPpm;  // e.g. 1750 = 17.5% moisture
        VerificationStatus status;
        bool exists;
    }

    // Mapping from batchNumber to HoneyBatch
    mapping(string => HoneyBatch) private batches;

    // Mapping from batchNumber to array of BatchEvents
    mapping(string => BatchEvent[]) private batchEvents;

    // Authorized registry agents (KVIC officers, certified testing labs)
    mapping(address => bool) public authorizedAuditors;

    // Events
    event BatchRegistered(
        string indexed batchNumber,
        string indexed hiveId,
        string indexed beekeeperId,
        uint256 timestamp
    );

    event BatchEventAppended(
        string indexed batchNumber,
        string eventType,
        string actor,
        uint256 timestamp
    );

    event BatchStatusUpdated(
        string indexed batchNumber,
        VerificationStatus oldStatus,
        VerificationStatus newStatus
    );

    modifier onlyOwner() {
        require(msg.sender == owner, "Only contract owner can execute");
        _;
    }

    modifier onlyAuthorized() {
        require(msg.sender == owner || authorizedAuditors[msg.sender], "Not authorized");
        _;
    }

    constructor() {
        owner = msg.sender;
        authorizedAuditors[msg.sender] = true;
    }

    function setAuditor(address _auditor, bool _authorized) external onlyOwner {
        authorizedAuditors[_auditor] = _authorized;
    }

    /**
     * @dev Register a new honey batch on the blockchain
     */
    function registerBatch(
        string calldata _batchNumber,
        string calldata _hiveId,
        string calldata _beekeeperId,
        string calldata _floralSource,
        string calldata _originLocation,
        uint256 _harvestTimestamp,
        uint256 _packagingTimestamp,
        uint256 _moistureContentPpm
    ) external onlyAuthorized {
        require(!batches[_batchNumber].exists, "Batch already registered");
        require(bytes(_batchNumber).length > 0, "Invalid batch number");

        batches[_batchNumber] = HoneyBatch({
            batchNumber: _batchNumber,
            hiveId: _hiveId,
            beekeeperId: _beekeeperId,
            floralSource: _floralSource,
            originLocation: _originLocation,
            harvestTimestamp: _harvestTimestamp,
            packagingTimestamp: _packagingTimestamp,
            moistureContentPpm: _moistureContentPpm,
            status: VerificationStatus.VERIFIED,
            exists: true
        });

        // Initialize with creation event
        batchEvents[_batchNumber].push(BatchEvent({
            eventType: "BATCH_REGISTERED",
            title: "Honey Batch Tokenized on Chain",
            timestamp: block.timestamp,
            actor: "Honey Chain Ledger",
            actorRole: "Smart Contract Registry",
            location: _originLocation,
            detailsHash: "0xgenesis",
            verified: true
        }));

        emit BatchRegistered(_batchNumber, _hiveId, _beekeeperId, block.timestamp);
    }

    /**
     * @dev Add a lifecycle step to a honey batch (Extraction, Lab Testing, Packaging, Distribution)
     */
    function addBatchEvent(
        string calldata _batchNumber,
        string calldata _eventType,
        string calldata _title,
        string calldata _actor,
        string calldata _actorRole,
        string calldata _location,
        string calldata _detailsHash
    ) external onlyAuthorized {
        require(batches[_batchNumber].exists, "Batch not found");

        batchEvents[_batchNumber].push(BatchEvent({
            eventType: _eventType,
            title: _title,
            timestamp: block.timestamp,
            actor: _actor,
            actorRole: _actorRole,
            location: _location,
            detailsHash: _detailsHash,
            verified: true
        }));

        emit BatchEventAppended(_batchNumber, _eventType, _actor, block.timestamp);
    }

    /**
     * @dev Query batch information for public consumer verification
     */
    function getBatch(string calldata _batchNumber) external view returns (HoneyBatch memory) {
        require(batches[_batchNumber].exists, "Batch does not exist");
        return batches[_batchNumber];
    }

    /**
     * @dev Retrieve all immutable events for a batch timeline
     */
    function getBatchEvents(string calldata _batchNumber) external view returns (BatchEvent[] memory) {
        require(batches[_batchNumber].exists, "Batch does not exist");
        return batchEvents[_batchNumber];
    }

    /**
     * @dev Verify if a batch is valid and untampered
     */
    function verifyBatch(string calldata _batchNumber) external view returns (
        bool exists,
        VerificationStatus status,
        uint256 eventCount,
        uint256 registeredAt
    ) {
        if (!batches[_batchNumber].exists) {
            return (false, VerificationStatus.INVALID, 0, 0);
        }
        HoneyBatch memory b = batches[_batchNumber];
        return (true, b.status, batchEvents[_batchNumber].length, b.harvestTimestamp);
    }
}
