


function ConvertDecToBin(decimal) {
    let binaryText = decimal.toString(2);
    return "00000000".substring(binaryText.length) + binaryText;
}

function ConvertDecToHex(decimal) {
    let hexText = decimal.toString(16);
    return "00".substring(hexText.length) + hexText;
}

function ConvertDecToChar(decimal) {
    return String.fromCharCode(decimal)
}

function ConvertBinToDec(binary) {
    return parseInt(binary, 2)
}

function ConvertDecToText(decimalArray,startPos,endPos,nullTerm=true) {
    let result = { error : false, text : "" };

    // Ensures that the ending position is a null character
    if (decimalArray[endPos] == 0 || !nullTerm) {
        for (let byteNumber = startPos; byteNumber < endPos + 1; byteNumber++) {
            if (decimalArray[byteNumber] > 0) { result.text += String.fromCharCode(decimalArray[byteNumber]); }
            else { break; }
        }
    }
    else { result.error = true; }
    return result;
}

// Recieves a Buffer and converts it to an ArtPollReply JSON object
function Recieve(buffer) {
    
    let replyPacket = buffer.toJSON(buffer).data;

    
    // Ensuring the reply is carrying the Art-Net header
    if (replyPacket[0] == 65 &&
        replyPacket[1] == 114 &&
        replyPacket[2] == 116 &&
        replyPacket[3] == 45 &&
        replyPacket[4] == 78 &&
        replyPacket[5] == 101 &&
        replyPacket[6] == 116 &&
        replyPacket[7] == 0 &&
        replyPacket[8] == 0 &&
        replyPacket[9] == 33) {


                
        let device = {

            macros : [],
            remotes : [],
            rdm : {},
            ports : [],
            network : {},
            configuration : {},
            subscriptions : []
        }

        // (3) Network.IPv4Address
        device.network.IPv4Address = replyPacket[10] + ".";
        device.network.IPv4Address += replyPacket[11] + ".";
        device.network.IPv4Address += replyPacket[12] + ".";
        device.network.IPv4Address += replyPacket[13];

        // (4) Network.PortNumber
        device.network.portNumber = replyPacket[14];
        device.network.portNumber += replyPacket[15] << 8;

        // (5,6) Device.Version Number
        device.versionNumber = replyPacket[16] << 8;
        device.versionNumber += replyPacket[17];

        // (7) Device.netSwitch
        device.netSwitch = replyPacket[18];


        // (8) Device.subSwitch
        device.subSwitch = replyPacket[19];


        // (9,10) Device.OEMCode
        device.oemCode = replyPacket[20].toString(16);
        device.oemCode += replyPacket[21].toString(16);

        // (11) Configuration.Ubea.Version
        device.configuration.ubea = {}
        device.configuration.ubea.version = replyPacket[22];

        // (12 bits 7,6) Device.IncicatorState
        let field12Bits = replyPacket[23].toString(2)
        if (field12Bits.substring(0,2) == "00") { device.indicatorState = "unknown"; }
        else if (field12Bits.substring(0,2) == "01") { device.indicatorState = "locate"; }
        else if (field12Bits.substring(0,2) == "10") { device.indicatorState = "mute"; }
        else { device.indicatorState = "Normal"; }

        // (12 bits 4,5) Configuration.PAPAValue
        if (field12Bits.substring(2,4) == "01") {device.configuration.PAPAValue = "front-panel"; }
        else if (field12Bits.substring(2,4) == "10") {device.configuration.PAPAValue = "network"; }
        else { device.configuration.PAPAValue = "Unknown"; }

        // (12 bit 2) Configuration.BootLocation
        device.configuration.bootLocation = (field12Bits[5] == "0") ? "flash" : "ROM";

        // (12 bit 1) Rdm.Supported
        device.rdm.supported = (field12Bits[6] == "0")

        // (12 bit 0) Configuration.ubea.present
        device.configuration.ubea.present = (field12Bits[7] == "0") 

        // (13,14) Device.ESTACode
        // :Bytes 24-25:
        device.ESTACode = replyPacket[24].toString(16);
        device.ESTACode += replyPacket[25].toString(16);

        // (15) Device.ShortName
        // :Bytes 26-43:
        let convertResult = ConvertDecToText(replyPacket,26,43)
        if (!convertResult.error) {
            device.shortName = convertResult.text
        }
        else {

        }

        // (16) Device.LongName
        // :Bytes 44-107:
        convertResult = ConvertDecToText(replyPacket,44,107)
        if (!convertResult.error) {
            device.longName = convertResult.text
        }
        else {

        }

        // (17) Device.report
        // :Bytes 108-171:
        device.report = {}

        // The report field must start with '#'
        if (replyPacket[108] == 0) {

            // The first character is not '#'
            // Therefore there is no report implemented
            device.report.code = "";
            device.report.sequence = 0;
            device.report.status = "";
        }

        else if (replyPacket[108] == 35) {

            // The first character is '#'
            // Therefore there is a report implemented

            // Device.Report.Code
            // :Bytes 109-112:
            device.report.code = ConvertDecToChar(replyPacket[109])
            device.report.code += ConvertDecToChar(replyPacket[110])
            device.report.code += ConvertDecToChar(replyPacket[111])
            device.report.code += ConvertDecToChar(replyPacket[112])

            // Device.Report.Sequence
            // :Bytes 113-120:
            // Must be formatted ' [yyyy] '
            if (replyPacket[113] == 32 && 
                replyPacket[114] == 91 &&
                replyPacket[119] == 93 &&
                replyPacket[120] == 32) {

                device.report.sequence = ConvertDecToChar(replyPacket[115])
                device.report.sequence += ConvertDecToChar(replyPacket[116])
                device.report.sequence += ConvertDecToChar(replyPacket[117])
                device.report.sequence += ConvertDecToChar(replyPacket[118])
            }

            else {
                // INVALID
            }

            // Device.Report.Text
            // :Bytes 121-171:
            convertResult = ConvertDecToText(replyPacket,121,171,false)
            if (!convertResult.error) {
                device.report.text = convertResult.text
            }
            else {
                
            }
        }
        
        else {

        }

        // (18,19) Device.NumberOfPorts
        // :Bytes 172-173:
        device.numberOfPorts = replyPacket[172] << 8;
        device.numberOfPorts += replyPacket[173];

        let field20Bits;
        let field21Bits;
        let field22Bits;
        let field23Bits;

        // (20) Ports
        var port, universeSubscription;
        for (let portNumber = 0; portNumber < device.numberOfPorts; portNumber++) {

            port = {
                portID : portNumber,
                input : {},
                output : {}
            }

            universeSubscription = {}

            // (20) Port.Info
            // :Bytes 174-177
            field20Bits = ConvertDecToBin(replyPacket[174 + portNumber]);

            // (20) Port.Output.CanOutputArtNet
            // :bit 7:
            port.output.canOutputArtNet = (field20Bits[0] == "1")

            // (20) Port.Output.CanOutputArtNet
            // :bit 6:
            port.input.canInputArtNet = (field20Bits[1] == "1")

            // (20) Port.PortType
            // :bits 5-0:
            if (field20Bits.substring(2) == "000000") { port.portType = "DMX512"; }
            else if (field20Bits.substring(2) == "000001") { port.portType = "MIDI"; }
            else if (field20Bits.substring(2) == "000010") { port.portType = "Avab"; }
            else if (field20Bits.substring(2) == "000011") { port.portType = "Colortran CMX"; }    
            else if (field20Bits.substring(2) == "000100") { port.portType = "ADB 62.5"; }
            else if (field20Bits.substring(2) == "000101") { port.portType = "Art-Net"; }    
            else if (field20Bits.substring(2) == "000110") { port.portType = "DALI"; }
            else { portInfoData.portType = "Unknown"; }
        

            // (21) Port.Input
            // :Bytes 178-181:
            field21Bits = ConvertDecToBin(replyPacket[178 + portNumber]);
        
            // (21) Port.Input.DataRecieved
            // :bit 7:
            port.input.dataRecieved = (field21Bits[0] == "1")

            // (21) Port.Input.DataIncludesDMX512TestPackets
            // :bit 6:
            port.input.dataIncludesDMX512TestPackets = (field21Bits[1] == "1")

            // (21) Port.Input.DataIncludesDMX512TextSIPS
            // :bit 5:
            port.input.dataIncludesDMX512SIPS = (field21Bits[2] == "1")

            // (21) Port.Input.DataIncludesDMX512TextPackets
            // :bit 4:
            port.input.dataIncludesDMX512TextPackets = (field21Bits[3] == "1")

            // (21) Port.Input.Disabled
            // :bit 3:
            port.input.disabled = (field21Bits[4] == "1")

            // (21) Port.Input.ErrorsDetected
            // :bit 2:
            port.input.errorsDetected = (field21Bits[5] == "1")
        
            
            // (22) Port.Output
            // :Bytes 182-185:
            field22Bits = ConvertDecToBin(replyPacket[182 + portNumber]);

            // (22) Port.Output.DataTransmitted
            // :bit 7:
            port.output.outputDataTransmitted = (field22Bits[0] == "1")

            // (22) Port.Output.DataIncludesDMX512TestPackets
            // :bit 6:
            port.output.outputIncludesDMX512TestPackets = (field22Bits[1] == "1")

            // (22) Port.Output.OutputIncludesDMX512SIPS
            // :bit 5:
            port.output.outputIncludesDMX512SIPS = (field22Bits[2] == "1")

            // (22) Port.Output.OutputIncludesDMX512TextPackets
            // :bit 4:
            port.output.outputIncludesDMX512TextPackets = (field22Bits[3] == "1")

            // (22) Port.Output.OutputMergingArtNetData
            // :bit 3:
            port.output.outputMergingArtNetData = (field22Bits[4] == "1")

            // (22) Port.Output.OutputDMXShortDetected
            // :bit 2:
            port.output.outputDMXShortDetected = (field22Bits[5] == "1")

            // (22) Port.Output.OutputMergeModeLTP
            // :bit 1:
            port.output.outputMergeModeLTP = (field22Bits[6] == "1")

            // (22) Port.Output.OutputListenProtocol
            // :bit 0:
            port.output.outputListenProtocol = (field22Bits[7] == "1")
        

            // (23) Port.SwIn
            // :bytes 186-189:
            field23Bits = ConvertDecToBin(replyPacket[186 + portNumber])
            let field23LowNibble = field23Bits.substring(4)
            let SwInValue = ConvertBinToDec(field23LowNibble)
            port.input.subswitch = SwInValue
        

            // (24) Port.SwOut
            // :bytes 190-193:
            field24Bits = ConvertDecToBin(replyPacket[190 + portNumber])
            let field24LowNibble = field24Bits.substring(4)
            let SwOutValue = ConvertBinToDec(field24LowNibble)
            port.output.subswitch = SwOutValue

            device.subscriptions.push((device.netSwitch << 8) + ((device.subSwitch << 4) + SwOutValue))

            device.ports.push(port)
        }

        // (25) Device.SACNPriority
        // :Byte 194:
        device.sACNPriority = replyPacket[194];
        
        // (26) Macros
        // :Byte 195:
        let field26Bits = ConvertDecToBin(replyPacket[195]);
        for (let bitPos = 0; bitPos < 8; bitPos++) {
            if (field26Bits[bitPos] == "1") { device.macros.push(true); }
            else { device.macros.push(false); }
        }

        // (27) Remotes
        // :Byte 196:
        let field27Bits = ConvertDecToBin(replyPacket[196]);
        for (let bitPos = 0; bitPos < 8; bitPos++) {
            if (field27Bits[bitPos] == "1") { device.remotes.push(true); }
            else { device.remotes.push(false); }
        }

        // (28) Unused
        // :Byte 197:               

        // (29) Unused
        // :Byte 198:   

        // (30) Unused
        // :Byte 199:

        // (31) Device.Type
        // :Byte 200:
        if (replyPacket[200] == 0) { device.type = "stNode"; }
        else if (replyPacket[200] == 1) { device.type = "stController"; }
        else if (replyPacket[200] == 2) { device.type = "stMedia"; }
        else if (replyPacket[200] == 3) { device.type = "stRoute"; }
        else if (replyPacket[200] == 4) { device.type = "stBackup"; }
        else if (replyPacket[200] == 5) { device.type = "stConfig"; }
        else if (replyPacket[200] == 7) { device.type = "stVisualiser"; }
        else { device.type = "Unknown"; }

        // (32,33,34,35,36,37) MAC Address
        // :Bytes 201-206:
        if (replyPacket[201] == 0) {
            device.network.MACAddress = "00:00:00:00:00:00"
        }
        else {
            device.network.MACAddress = ConvertDecToHex(replyPacket[201]) + ":"
            device.network.MACAddress += ConvertDecToHex(replyPacket[202]) + ":"
            device.network.MACAddress += ConvertDecToHex(replyPacket[203]) + ":"
            device.network.MACAddress += ConvertDecToHex(replyPacket[204]) + ":"
            device.network.MACAddress += ConvertDecToHex(replyPacket[205]) + ":"
            device.network.MACAddress += ConvertDecToHex(replyPacket[206])
        }

        // (38) RootDeviceIPv4
        // :Bytes 207-210:
        device.rootDeviceIPv4 = replyPacket[207] + ".";
        device.rootDeviceIPv4 += replyPacket[208] + ".";
        device.rootDeviceIPv4 += replyPacket[209] + ".";
        device.rootDeviceIPv4 += replyPacket[210];

        // (39) RootDeviceDistance
        // :Bytes 211:
        device.rootDeviceDistance = replyPacket[211];

        // (40) Device
        // :Bytes 212:
        let field40Bits = ConvertDecToBin(replyPacket[212]);
        device.supports = {};

        // (40) RDM.supportsArtCommand
        // :Bit 0:
        device.rdm.supportsArtCommand = (field40Bits[0] == "1")

        // (40) Supports.SwitchingOutputStyleUsingArtCommand
        // :Bit 1:
        device.supports.switchingOutputStyleUsingArtCommand = (field40Bits[1] == "1")

        // (40) Squawking
        // :Bit 2:
        device.squawking = (field40Bits[2] == "1")

        // (40) Supports.CanUse15BitPortAddress
        // :Bit 3:
        device.supports.canUse15BitPortAddress = (field40Bits[3] == "1")

        // (40) Supports.SwitchingArtNetSACN
        // :Bit 4:
        device.supports.switchingArtNetSACN = (field40Bits[4] == "1")

        // (40) Network.SupportsDHCP
        // :Bit 5:
        device.network.supportsDHCP = (field40Bits[5] == "1")

        // (40) Network.CurrentlyUsingDHCP
        // :Bit 6:
        device.network.currentlyUsingDHCP = (field40Bits[6] == "1")

        // (40) Supports.WebBasedConfiguration
        // :Bit 7:
        device.supports.webBasedConfiguration = (field40Bits[7] == "1")

        // (41) RDM.Disabled 
        // :Bit 7:
        let field41Bits = ConvertDecToBin(replyPacket[213]);
        device.rdm.disabled = (field41Bits[0] == "1")

        // (41) OutputStyle 
        // :Bit 6:
        device.outputStyle = (field40Bits[1] == "1") ? "continuous" : "delta";

        // (42) FailsafeState
        // :Bit 7-6:
        let field42Bits = ConvertDecToBin(replyPacket[214]);
        let failsafeState = field42Bits.substring(0,2)
        if (failsafeState == "00") { device.failsafeState = "hold"; }
        else if (failsafeState == "01") { device.failsafeState = "zero"; }
        else if (failsafeState == "10") { device.failsafeState = "full"; }
        else if (failsafeState == "11") { device.failsafeState = "scene"; }

        // (42) SupportsFailover
        // :Bit 5:
        device.supports.failover = (field42Bits[2] == "1")

        // (42) Supports.LLRP
        // :Bit 4:
        device.supports.LLRP = (field42Bits[3] == "1")

        // (42) Supports.SwitchingPortsBetweenInputOutput
        // :Bit 3:
        device.supports.switchingPortsBetweenInputOutput = (field42Bits[4] == "1")

        // (43,44,45,46,47,48)
        // :Bytes 215-220:
        device.defaultResponderUID = ConvertDecToHex(replyPacket[215]) + ":"
        device.defaultResponderUID += ConvertDecToHex(replyPacket[216]) + ":"
        device.defaultResponderUID += ConvertDecToHex(replyPacket[217]) + ":"
        device.defaultResponderUID += ConvertDecToHex(replyPacket[218]) + ":"
        device.defaultResponderUID += ConvertDecToHex(replyPacket[219]) + ":"
        device.defaultResponderUID += ConvertDecToHex(replyPacket[220])

        // Creating the device footprint
        device.fingerprint = device.network.MACAddress + "/" + device.shortName + "/";
        
        return device;
    }
}

module.exports.Recieve = Recieve;