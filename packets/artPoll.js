// 

const CashedArtPollArray = [65, 114, 116, 45, 78, 101, 116, 0, 0, 32, 0, 14, 22, 16, 0, 0, 0, 0];
var CashedArtPollBuffer = Buffer.from(CashedArtPollArray)

function SetOptions(options) {

    options.requestDiagnostics = options.requestDiagnostics || true
    options.diagnosticsType = options.diagnosticsType || "broadcast"
    options.diagnosticsSendOnChange = options.diagnosticsSendOnChange || true
    options.diagnosticsPriority = options.diagnosticsPriority || "low"

    // (5) ArtPoll Flags
    // :Byte 12:
    var headerFlags = 22;
    if (!options.requestDiagnostics) {
        headerFlags -= 4;
    }

    if (options.diagnosticsType == "unicast") {
        headerFlags -= 8;
    }
    else if (options.diagnosticsType != "broadcast") {

    }

    if (!options.diagnosticsSendOnChange) {
        headerFlags -= 2;
    }

    CashedArtPollArray[12] = headerFlags;

    // (6) ArtPoll Diagnostics Priority
    // :Byte 13:
    var headerDiagnosticsPriority = 0;
    if (options.dignosticsPriority == "low") { headerDiagnosticsPriority = 16; }
    else if (options.diagnosticsPriority == "medium") { headerDiagnosticsPriority = 64; }
    else if (options.diagnosticsPriority == "high") { headerDiagnosticsPriority = 128; }
    else if (options.diagnosticsPriority == "critical") { headerDiagnosticsPriority = 224; }
    else if (options.diagnosticsPriority == "volatile") { headerDiagnosticsPriority = 240; }
    else {

    }

    CashedArtPollArray[13] = headerDiagnosticsPriority;

    // (7,8,9,10) Target Port Address Information - Unused In ArtNet4
    // :Bytes 14-17:
    // These are set to zero in the cashed packet
}

// Send an ArtPoll Package down a provided Network Socket
function Send(Network) {
    Network.SendBroadcast(CashedArtPollBuffer)
}



module.exports.Send = Send;
module.exports.SetOptions = SetOptions;