// ArtNet4 Discovery Process
const ArtPoll = require("./../packets/artPoll")
const Network = require("./../services/network")

const Events = require("events");
var SubscriptionListener = new Events.EventEmitter();
var DiscoveryListener = new Events.EventEmitter(); 

var devices = {};
var deviceFingerprints = [];

// Subscriptions
var subscriptions = {
    keys : []
};

function AddSubscription(portAddress,fingerprint,IPv4Address) {
    SubscriptionListener.emit("subscriptionAdded",{
        device : devices[fingerprint],
        portAddress : portAddress
    });
    if (!subscriptions.keys.includes(portAddress)) {
        subscriptions.keys.push(portAddress)
        subscriptions[portAddress] = {
            IPv4Addresses : [],
            subscribers : [],
        }
    }
    
    // Add the IP to the IPv4 Addresses, and the Fingerprint to the subscribers 
    if (!subscriptions[portAddress].IPv4Addresses.includes(IPv4Address)) {
        subscriptions[portAddress].IPv4Addresses.push(IPv4Address);
        subscriptions[portAddress].subscribers.push([fingerprint]);
    }
    else {

        let index = subscriptions[portAddress].IPv4Addresses.indexOf(IPv4Address);

        // The IP already exists, add the device fingerprint if it doesn't already
        if (!subscriptions[portAddress].subscribers[index].includes(fingerprint)) {


            subscriptions[portAddress].subscribers[index].push(fingerprint)
        }
    }

    SubscriptionListener.emit("subscriptionChange",{
        subscriptions : subscriptions
    })
}

function RemoveSubscription(portAddress,fingerprint,IPv4Address) {

    SubscriptionListener.emit("subscriptionRemoved",{
        device : devices[fingerprint],
        portAddress : portAddress
    });

    let IPv4Index = subscriptions[portAddress].IPv4Addresses.indexOf(IPv4Address);

    let fingerprintIndex = subscriptions[portAddress].subscribers[IPv4Index].indexOf(fingerprint);

    if (fingerprintIndex > -1) {

        subscriptions[portAddress].subscribers[IPv4Index].splice(fingerprintIndex,1);
        
        // If there are no subscribers using that IP, remove the index
        if (subscriptions[portAddress].subscribers[IPv4Index].length < 1) {
            subscriptions[portAddress].subscribers.splice(IPv4Index,1);
            subscriptions[portAddress].IPv4Addresses.splice(IPv4Index,1);
        }

        // If there are no IPs for that universe, remove the universe
        if (subscriptions[portAddress].IPv4Addresses.length < 1) {
            subscriptions.keys.splice(subscriptions.keys.indexOf(portAddress),1);
            delete subscriptions[portAddress];
        }
    }

    SubscriptionListener.emit("subscriptionChange",{
        subscriptions : subscriptions
    })

}

ArtPoll.Send(Network)
setInterval(function(){


    for (let deviceNumber = deviceFingerprints.length - 1; deviceNumber > -1; deviceNumber--) {

        let device = devices[deviceFingerprints[deviceNumber]];

        if (device.pollAge < 1) {
            // Remove

            device.subscriptions.forEach(function(uni) {
                RemoveSubscription(uni,device.fingerprint,device.network.IPv4Address)
            })

            DiscoveryListener.emit("deviceLost",{
                device : device
            })

            deviceFingerprints.splice(deviceFingerprints.indexOf(deviceFingerprints[deviceNumber]),1);
            delete device;
        }
        else {
            device.pollAge -= 1;

            if (device.pollAge < 1) {
                DiscoveryListener.emit("devicePotentialLoss",{
                    device : device
                })
            }
        }
    }

    ArtPoll.Send(Network)

},2000);

// Send ArtPoll
// Cull Entries that are too large
Network.Backplane.on("artPollReply",function(device){

    let oldSubscriptions = [];
    let newSubscriptions = device.subscriptions;
    let oldIPv4Address = "";
    if (deviceFingerprints.includes(device.fingerprint)) {
        oldIPv4Address = devices[device.fingerprint].network.IPv4Address;
        oldSubscriptions = devices[device.fingerprint].subscriptions;

        if (devices[device.fingerprint].pollAge == 0) {

            DiscoveryListener.emit("deviceRecovered",{
                device : device
            })
        }
    }
    else {

        DiscoveryListener.emit("deviceFound",{
            device : device
        });
        deviceFingerprints.push(device.fingerprint);
    }

    if (oldIPv4Address != "" && oldIPv4Address != device.network.IPv4Address) {

        DiscoveryListener.emit("IPv4AddressChange",{
            device : device,
            outdatedIPv4Address : oldIPv4Address
        });
            
        // All current subscriptions must now be removed
        devices[device.fingerprint].subscriptions.forEach(function(uni){
            RemoveSubscription(uni,device.fingerprint,oldIPv4Address);
        })
        
        // All current subscriptions must now be added
        devices[device.fingerprint].subscriptions.forEach(function(uni){
            AddSubscription(uni,device.fingerprint,device.network.IPv4Address);
        })
    }

    var removalRequests = oldSubscriptions.filter(uni => !newSubscriptions.includes(uni))
    var additionRequests = newSubscriptions.filter(uni => !oldSubscriptions.includes(uni))


    devices[device.fingerprint] = device;
    devices[device.fingerprint].pollAge = 2;

    additionRequests.forEach(function(uni) {

        AddSubscription(uni,device.fingerprint,device.network.IPv4Address);
    })

    removalRequests.forEach(function(uni) {
        RemoveSubscription(uni,device.fingerprint,device.network.IPv4Address);
    })
})

module.exports.DiscoveryListener = DiscoveryListener;
module.exports.SubscriptionListener = SubscriptionListener;