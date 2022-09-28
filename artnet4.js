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

module.exports.SetChannel = SetChannel;
module.exports.DiscoveryListener = Discovery.DiscoveryListener;
module.exports.SubscriptionListener = Discovery.SubscriptionListener;