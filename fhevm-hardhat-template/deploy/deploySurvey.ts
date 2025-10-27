import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployer } = await hre.getNamedAccounts();
  const { deploy } = hre.deployments;

  // Deploy SurveyFactory
  const surveyFactory = await deploy("SurveyFactory", {
    from: deployer,
    args: [],
    log: true,
    waitConfirmations: 1,
  });

  console.log(`SurveyFactory deployed at: ${surveyFactory.address}`);
};

export default func;
func.tags = ["SurveyFactory", "Survey"];

