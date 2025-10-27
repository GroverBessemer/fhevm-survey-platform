import { DeployFunction } from "hardhat-deploy/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployer } = await hre.getNamedAccounts();
  const { deploy } = hre.deployments;

  const deployedSurveyFactory = await deploy("SurveyFactory", {
    from: deployer,
    log: true,
    waitConfirmations: hre.network.name === "sepolia" ? 6 : 1,
  });

  console.log(`SurveyFactory contract: `, deployedSurveyFactory.address);
};
export default func;
func.id = "deploy_surveyFactory"; // id required to prevent reexecution
func.tags = ["SurveyFactory"];

