const ArtDMX = require("../packets/artDmx");
const Discovery = require("./discovery");

const sampleRate = 30;
const pushTimeout = 3000;

var Network;
function Setup(options) {
    Network = options.Network;
}

var portAddressMap = { keys : [] };
var subscriptions = { keys : [] };

// 
Discovery.SubscriptionListener.on("subscriptionChange", function(msg){

    subscriptions = msg.subscriptions;
    subscriptions.keys.forEach(function(portAddress) {
        
        if (!portAddressMap.keys.includes(portAddress)) {
            portAddressMap[portAddress] = {
                channels : new Array(512).fill(0),
                maxChannel : 0,
                changeFlag : false,
                lastSend : pushTimeout,
            }

            portAddressMap.keys.push(portAddress);
        }
    })

    portAddressMap.keys.forEach(function(portAddress) {
        if (!subscriptions.keys.includes(portAddress)) {
            delete portAddressMap[portAddress]
            portAddressMap.keys.splice(portAddressMap.keys.indexOf(portAddress),1);
        }
    })
})

let portAddress;
function SetChannel(network,universe,channelSegments) {

    portAddress = (network << 8) + universe;

    if (portAddressMap.keys.includes(portAddress)) {
        channelSegments.forEach(function(channelSegment) {   
            portAddressMap[portAddress].channels[channelSegment[0] - 1] = channelSegment[1];

            if (channelSegment[0] > portAddressMap[portAddress].maxChannel) {
                portAddressMap[portAddress].maxChannel = channelSegment[0];
            }
            portAddressMap[portAddress].changeFlag = true;    
        })
    }
    // else {

    //     channelSegments.forEach(function(channelSegment) {     
    //         console.log("## (" + portAddress + ") Set " + channelSegment[0] + " to " + channelSegment[1])
    //     })
    // }
}

// Channel Sampling Service (COS)
// Samples the channel table once every 30ms and sends the output to the ArtDMX method
let maxChannel;
let channelData;
setInterval(function(){

    portAddressMap.keys.forEach(function(portAddressNumber) {
        portAddress = portAddressMap[portAddressNumber];

        if (portAddress.changeFlag || portAddress.lastSend >= pushTimeout) {

            if (portAddress.lastSend >= pushTimeout) {
                maxChannel = 512;
            }
            else if (portAddress.maxChannel % 2) {
                maxChannel = portAddress.maxChannel += 1;
            }
            else {
                maxChannel = portAddress.maxChannel;
            }

            channelData = portAddress.channels.slice(0,maxChannel);

            if (subscriptions.keys.includes(portAddressNumber)) {
                subscriptions[portAddressNumber].IPv4Addresses.forEach(function(IPv4Address) {
                    ArtDMX.Send(Network,IPv4Address,portAddressNumber,channelData);
                })
            }

            portAddress.maxChannel = 0;
            portAddress.changeFlag = false;
            portAddress.lastSend = 0;
        }

        else {
            portAddress.lastSend += sampleRate;
        }
    })

},sampleRate)

module.exports.Setup = Setup;
module.exports.SetChannel = SetChannel;