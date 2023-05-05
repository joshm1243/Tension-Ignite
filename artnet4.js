const express = require("express")
const Discovery = require("./processes/discovery")
const Network = require("./services/network")
const DMXOutput = require("./processes/dmxoutput")

DMXOutput.Setup({
    Network : Network
})

function SetChannel(network,universe,channelArray) {

    network = network || 0
    universe = universe || 0
    channelArray = channelArray || []

    DMXOutput.SetChannel(network,universe,channelArray)
}

app = express()
app.use(express.json())
app.listen(3002)
 
app.post("/api/channels/set", (req, res) => {


    let network = req.body.network;
    let universe = req.body.universe;
    let channelArray = req.body.channelArray;

    SetChannel(0,0,channelArray)

    res.status(200).send()
})

module.exports.SetChannel = SetChannel;
module.exports.DiscoveryListener = Discovery.DiscoveryListener;
module.exports.SubscriptionListener = Discovery.SubscriptionListener;