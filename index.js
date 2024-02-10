const PORT = process.env.PORT ?? 3000
const express = require("express");
const app = express();
const { startStream, types } = require('near-lake-framework');

const lakeConfig = {
    s3BucketName: "near-lake-data-testnet",
    s3RegionName: "eu-central-1",
    startBlockHeight: 157050612,
};

function mapinformationFromFunctionalCall(inputObject) {
    let transformedObject = {};
    if (
      inputObject.executionOutcome &&
      inputObject.executionOutcome.outcome.receiptIds &&
      Array.isArray(inputObject.executionOutcome.outcome.receiptIds)
    ) {
      inputObject.executionOutcome.outcome.receiptIds.forEach((_) => {
        const action = inputObject.receipt.receipt.Action.actions.find(
          (action) => action.FunctionCall
        );
  
        if (action) {
          const parsedAction = action.FunctionCall;
          const args = Buffer.from(parsedAction.args, "base64").toString("utf-8");
  
          let parsedJson = parseArgs(args);
            if(parsedAction.methodName == "create_factory_subaccount_and_deploy_callback"){
                transformedObject = {
                    new_account: parsedJson.account,
                    user_id: parsedJson.user,
                    methodName: parsedAction.methodName,
                  };
            } else {
                transformedObject = {
                    name_group:parsedJson.name,
                    owner: parsedJson.owner,
                    methodName: parsedAction.methodName,
                  };
            }
        }
      });
    }

  return transformedObject;
}
  
  
function parseArgs(args) {
  let parsedJson = {};
  try {
    parsedJson = JSON.parse(args);
  } catch (e) {
    // console.log("Parsing Problem");
  }
  return parsedJson;
}

function tojson(args){
  let new_json = JSON.stringify(args);
  if (new_json){
    return new_json
  } else {
    console.log("Error");
  }
}

function functToLogs(outcome){
  const log = outcome.executionOutcome.outcome.receipt;
  if (log){
   log.forEach((logs) => {
    return logs
    })  
  }
}
  

async function handleStreamerMessage(streamerMessage){
    const relevantOutcomes = streamerMessage.shards
    .flatMap((shard) => shard.receiptExecutionOutcomes)
    .map((outcome) => ({
      receipt: {
        logs: functToLogs(outcome),
        receiverId: outcome.receipt.receiverId,
        status: outcome.executionOutcome.outcome.status.SuccessReceiptId,
      },
      informationFromFunctionalCall: mapinformationFromFunctionalCall(outcome),
    }))
    .filter((relevantOutcome) => {
        return (
          relevantOutcome.receipt.receiverId == "adventurous-pig.testnet"
        );
      });
    //   relevantOutcomes.forEach((outcome) => {
    //     console.log(outcome.receipt.logs);
    // });
    console.log(relevantOutcomes);
}


(async () => {
    await startStream(lakeConfig, handleStreamerMessage);
})();

app.get('/', (req,res) => {
    res.send("This module for search group")
});

app.listen(PORT, () => {
    console.log(`Server run on port ${PORT}`)
});