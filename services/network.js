const Datagram = require("dgram");
const Events = require("events")
const Backplane = new Events.EventEmitter()

const ArtPollReply = require("./../packets/artpollreply")

var broadcastSocket = Datagram.createSocket({type: "udp4", reuseAddr: true});
var unicastSocket = Datagram.createSocket({type : "udp4", reuseAddr: true})

broadcastSocket.bind(6454,function(){ broadcastSocket.setBroadcast(true); })

function SendBroadcast(buffer) {
    broadcastSocket.send(buffer, 0, buffer.length, 6454, "255.255.255.255");
}

function SendUnicast(buffer,unicastIPv4) {
    unicastSocket.send(buffer,0,buffer.length,6454,unicastIPv4)
}

broadcastSocket.on("message",function(buffer,info){
    if (buffer[8] == 0 && buffer[9] == 33) {
        let artPollReply = ArtPollReply.Recieve(buffer)
        Backplane.emit("artPollReply",artPollReply,info)
    }
})

module.exports.SendBroadcast = SendBroadcast;
module.exports.SendUnicast = SendUnicast;
module.exports.Backplane = Backplane;