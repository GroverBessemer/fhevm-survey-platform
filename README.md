# FHEVM Survey Platform

A blockchain-based privacy-preserving survey dApp built with FHEVM and Next.js. This platform enables encrypted voting where all responses are stored on-chain as `euint32` encrypted integers. Participants submit answers through client-side FHE encryption, and homomorphic operations compute encrypted vote tallies without exposing individual responses.

## 🎯 Key Features

- **🔒 Fully Encrypted Voting**: All survey responses are encrypted on-chain using FHEVM's `euint32` types
- **📊 Homomorphic Operations**: Vote counts are computed using `FHE.add` without decrypting individual answers
- **👥 Privacy-Preserving**: Only authorized survey creators can decrypt aggregated statistics
- **✅ Access Control**: ACL permissions ensure only authorized parties can access encrypted data
- **🎨 Interactive UI**: Beautiful, responsive interface with encrypted result visualizations
- **🔧 Dual Mode**: Supports Mock mode for local Hardhat testing and real Relayer SDK for Sepolia testnet

## 🏗️ Project Structure

```
├── survey-frontend/           # Next.js 15 frontend application
│   ├── app/                   # App Router pages
│   ├── components/            # React components
│   ├── hooks/                 # Custom React hooks
│   ├── fhevm/                 # FHEVM integration layer
│   ├── scripts/               # Build and deployment scripts
│   └── abi/                    # Contract ABIs and addresses
│
├── fhevm-hardhat-template/    # Smart contract development
│   ├── contracts/             # Solidity contracts
│   ├── deploy/                # Deployment scripts
│   ├── test/                  # Contract tests
│   └── tasks/                 # Hardhat custom tasks
│
└── SURVEY_REQUIREMENTS.md     # Detailed requirements document
```

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ 
- MetaMask or other Web3 wallet
- Hardhat (for local testing)

### Installation

```bash
# Clone the repository
git clone https://github.com/GroverBessemer/fhevm-survey-platform.git
cd fhevm-survey-platform

# Install dependencies for contracts
cd fhevm-hardhat-template
npm install

# Install dependencies for frontend
cd ../survey-frontend
npm install
```

### Local Development

**Terminal 1: Start Hardhat Node**
```bash
cd fhevm-hardhat-template
npx hardhat node
```

**Terminal 2: Deploy Contracts**
```bash
cd fhevm-hardhat-template
npx hardhat deploy --network localhost
```

**Terminal 3: Start Frontend**
```bash
cd survey-frontend
npm run dev:mock
```

The application will be available at `http://localhost:3000`

## 📱 Usage

### Creating a Survey

1. Connect your MetaMask wallet
2. Navigate to "Create Survey"
3. Fill in survey details:
   - Title and description
   - Start and end times
   - Maximum participants
   - Privacy level
4. Add questions:
   - Single Choice
   - Multiple Choice
   - Rating (1-10)
   - Likert Scale (1-5)
5. Submit to deploy the survey contract

### Participating in a Survey

1. Browse available surveys
2. Select a survey to view details
3. Click "Participate"
4. Submit encrypted answers
5. Answers are encrypted using FHEVM before on-chain storage

### Viewing Results (Creator Only)

1. Navigate to "My Surveys"
2. Select a survey
3. Click "View Results"
4. Click "Decrypt Results" (requires creator authorization)
5. View decrypted statistics and visualizations

## 🔐 FHEVM Architecture

### Encryption Flow

1. **Client-Side Encryption**: User answers are encrypted using FHEVM's `createEncryptedInput`
2. **On-Chain Storage**: Encrypted values stored as `euint32` in contract state
3. **Homomorphic Operations**: Vote counts computed using `FHE.add` without decryption
4. **Access Control**: Permissions managed via ACL using `FHE.allow` and `FHE.allowThis`

### Decryption Flow

1. **Authorization**: Creator calls `allowResultsDecryption` to grant access
2. **Signature Creation**: Decryption signature generated via `FhevmDecryptionSignature.loadOrSign`
3. **Batch Decryption**: All option counts decrypted at once using `userDecrypt`
4. **Result Visualization**: Decrypted values displayed with charts and percentages

## 🧪 Testing

### Contract Tests

```bash
cd fhevm-hardhat-template
npx hardhat test
```

### Frontend Build

```bash
cd survey-frontend
npm run build
```

## 📚 Technology Stack

- **Frontend**: Next.js 15, React, TypeScript, Tailwind CSS
- **Blockchain**: Ethereum, Hardhat
- **Encryption**: FHEVM, Homomorphic Encryption
- **Wallet**: MetaMask, Ethers.js v6
- **Dual Mode**: 
  - Mock: `@fhevm/mock-utils` for local testing
  - Real: `@zama-fhe/relayer-sdk` for testnet deployment

## 🔑 Smart Contracts

### SurveyFactory

Factory contract for deploying new survey instances.

**Key Functions:**
- `createSurvey(...)` - Deploy a new survey contract
- `getSurveys()` - Get all surveys
- `getMySurveys()` - Get surveys created by caller
- `getMyParticipations()` - Get surveys participated by caller
- `recordParticipation()` - Record participant address

### Survey

Individual survey contract managing encrypted votes.

**Key Functions:**
- `submitAnswers(...)` - Submit encrypted answers
- `getQuestion(index)` - Get question details
- `getOptionCount(...)` - Get encrypted vote count for an option
- `surveyInfo` - Survey metadata (encrypted participant count)
- `allowResultsDecryption()` - Grant decryption permission

## 🌐 Deployment

### Sepolia Testnet

1. Configure environment variables:
```bash
SEPOLIA_PRIVATE_KEY=0x...
INFURA_API_KEY=...
```

2. Deploy contracts:
```bash
cd fhevm-hardhat-template
npx hardhat deploy --network sepolia
```

3. Update frontend config in `survey-frontend/.env.local`:
```bash
NEXT_PUBLIC_NETWORK=sepolia
NEXT_PUBLIC_CHAIN_ID=11155111
```

4. Start frontend:
```bash
cd survey-frontend
npm run dev
```

## ⚠️ Important Notes

- **Local Mode**: Use `npm run dev:mock` for local development with Mock FHEVM
- **Testnet Mode**: Use `npm run dev` for Sepolia with real Relayer SDK
- **Creator Authority**: Only survey creators can decrypt aggregated results
- **Privacy Level**: Three privacy levels available (Creator Only, Public After End, Participants Can View)
- **Encrypted Storage**: All vote counts stored as encrypted `euint32` on-chain

## 📝 License

MIT

## 👥 Author

GroverBessemer

---

Built with ❤️ using FHEVM and Next.js

