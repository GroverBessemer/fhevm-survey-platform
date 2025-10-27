import { expect } from "chai";
import { ethers, deployments } from "hardhat";
import { Contract, Signer } from "ethers";
import { createInstances, FhevmInstances } from "../test/utils/instance";
import type { Signers } from "../test/utils/signers";
import { FhevmInstance } from "../test/utils/types";

describe("SurveyFactory", function () {
  let factory: Contract;
  let alice: SignerWithAddress;
  let bob: SignerWithAddress;
  let charlie: SignerWithAddress;
  let instances: FhevmInstances;
  let contractAddress: string;

  beforeEach(async function () {
    await deployments.fixture(["SurveyFactory"]);
    
    const signers = await ethers.getSigners();
    alice = signers[0];
    bob = signers[1];
    charlie = signers[2];

    factory = await ethers.getContract("SurveyFactory");
    contractAddress = await factory.getAddress();

    instances = await createInstances(signers, ethers, factory);
  });

  describe("Survey Creation", function () {
    it("should create a new survey", async function () {
      const title = "Customer Satisfaction Survey";
      const metadataURI = "ipfs://QmTest123";
      const startTime = Math.floor(Date.now() / 1000) + 60; // 1 minute from now
      const endTime = startTime + 86400; // 1 day later
      const maxParticipants = 100;

      const questions = [
        {
          questionType: 0, // SingleChoice
          optionCount: 4,
          required: true,
        },
        {
          questionType: 2, // Rating
          optionCount: 5,
          required: true,
        },
      ];

      const tx = await factory.createSurvey(
        title,
        metadataURI,
        startTime,
        endTime,
        maxParticipants,
        0, // PrivacyLevel.CreatorOnly
        false, // allowMultiple
        questions
      );

      const receipt = await tx.wait();
      const event = receipt.logs.find((log: any) => {
        try {
          return factory.interface.parseLog(log)?.name === "SurveyCreated";
        } catch {
          return false;
        }
      });

      expect(event).to.not.be.undefined;
      
      const surveyCount = await factory.getSurveyCount();
      expect(surveyCount).to.equal(1);
    });

    it("should track surveys by creator", async function () {
      const title = "Survey 1";
      const metadataURI = "ipfs://QmTest";
      const startTime = Math.floor(Date.now() / 1000) + 60;
      const endTime = startTime + 86400;

      const questions = [{
        questionType: 0,
        optionCount: 3,
        required: true,
      }];

      await factory.connect(alice).createSurvey(
        title,
        metadataURI,
        startTime,
        endTime,
        50,
        0,
        false,
        questions
      );

      await factory.connect(alice).createSurvey(
        "Survey 2",
        metadataURI,
        startTime,
        endTime,
        50,
        0,
        false,
        questions
      );

      const aliceSurveys = await factory.getSurveysByCreator(alice.address);
      expect(aliceSurveys.length).to.equal(2);
    });

    it("should support pagination", async function () {
      const metadataURI = "ipfs://QmTest";
      const startTime = Math.floor(Date.now() / 1000) + 60;
      const endTime = startTime + 86400;
      const questions = [{
        questionType: 0,
        optionCount: 3,
        required: true,
      }];

      // Create 5 surveys
      for (let i = 0; i < 5; i++) {
        await factory.createSurvey(
          `Survey ${i}`,
          metadataURI,
          startTime,
          endTime,
          50,
          0,
          false,
          questions
        );
      }

      const page1 = await factory.getSurveysPaginated(0, 2);
      expect(page1.length).to.equal(2);

      const page2 = await factory.getSurveysPaginated(2, 2);
      expect(page2.length).to.equal(2);

      const page3 = await factory.getSurveysPaginated(4, 2);
      expect(page3.length).to.equal(1);
    });
  });
});

