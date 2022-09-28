// Sends ArtDMX Packets
// Is not concerned about state or continuous delivery of DMX

function ConvertDecToBin(decimal) {
    let binaryText = decimal.toString(2);
    return "0000000000000000".substring(binaryText.length) + binaryText;
}

function ConvertBinToDec(binary) {
    return parseInt(binary, 2)
}


var ArtDMXHeader = [65, 114, 116, 45, 78, 101, 116, 0, 0, 80, 0, 14, 0, 0];

function Send(Network,IPv4Address,portAddress,channelData) {

    var binaryPortAddress = ConvertDecToBin(portAddress)
    var netSW = ConvertBinToDec(binaryPortAddress.substring(0,9))
    var subSW = ConvertBinToDec(binaryPortAddress.substring(9))

    var ArtDMXArray = ArtDMXHeader;

    // () Network Subswitch
    // :Byte 14:
    ArtDMXArray[14] = subSW;

    // () Universe Subswitch
    // :Byte 15:
    ArtDMXArray[15] = netSW;

    // () Length
    // :Bytes 16-17:
    let length = channelData.length;
    if (length % 2) { length += 1; }
    ArtDMXArray[16] = (length >> 8) & 0xff;
    ArtDMXArray[17] = (length & 0xff);

    ArtDMXArray = ArtDMXArray.concat(channelData)
    ArtDMXBuffer = Buffer.from(ArtDMXArray)

    Network.SendUnicast(ArtDMXBuffer,IPv4Address)
}


module.exports.Send = Send;