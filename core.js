const ArtNet = require("./artnet4")


ArtNet.DiscoveryListener.on("deviceFound",function(device){

    console.log("----------------------------------------------")
    

    ArtNet.SetChannel(0,0,[[1,255]])



})

ArtNet.SubscriptionListener.on("subscriptionChange", function(sub) {
    console.log("Sub Change", sub)
})



// function ColourFade(redChannel,greenChannel,blueChannel) {

//     let fallColour = "red";
//     let redValue = 255;
//     let greenValue = 0;
//     let blueValue = 0;

//     setInterval(function(){

//         ArtNet.SetChannel(0,0,[[redChannel,redValue],[greenChannel,greenValue],[blueChannel,blueValue]]);

//         if (fallColour == "red") {

//             redValue -= 5;
//             greenValue += 5;

                        
//             if (greenValue > 255) {
//                 greenValue = 255;
//             }
            
//             if (redValue < 1) {
//                 redValue = 0;
//                 fallColour = "green";
//             }
//         }

//         else if (fallColour == "green") {

//             greenValue -= 5;
//             blueValue += 5;

            
//             if (blueValue > 255) {
//                 blueValue = 255;
//             }

//             if (greenValue < 1) {
//                 greenValue = 0;
//                 fallColour = "blue";
//             }
//         }

//         else {

//             blueValue -= 5;
//             redValue += 5;

//             if (redValue > 255) {
//                 redValue = 255;
//             }

//             if (blueValue < 1) {
//                 blueValue = 0;
//                 fallColour = "red";
//             }   
//         }

//     },30)

// }


