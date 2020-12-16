	var gameInstance = UnityLoader.instantiate("unityContainer", "Build/HCN_Beta.json", {onProgress: UnityProgress});
	// More API functions here:
   // https://github.com/googlecreativelab/teachablemachine-community/tree/master/libraries/pose

    // the link to your model provided by Teachable Machine export panel
   	//const checkpoint = 'https://drive.google.com/drive/folders/1xigTe0ZXQGkxBaQUgzBUJk7xvcxDMxd9?usp=sharing/my_model/'
    //const checkpoint = 'https://github.com/dobl94/HCN/edit/main/HCN_Beta/my_model'
    const checkpoint = './my_model/'
    let model, webcam, ctx, labelContainer, maxPredictions;

    async function init() {
        const modelURL = checkpoint + "model.json";
        const metadataURL = checkpoint + "metadata.json";
		
		model = await tmPose.load(modelURL, metadataURL);
		// load the model and metadata
        // Refer to tmImage.loadFromFiles() in the API to support files from a file picker
        // Note: the pose library adds a tmPose object to your window (window.tmPose)
	    maxPredictions = model.getTotalClasses();

        // Convenience function to setup a webcam
        const size = 200;
        const flip = true; // whether to flip the webcam
        
		webcam = new tmPose.Webcam(size, size, flip); // width, height, flip
        
		await webcam.setup(); // request access to the webcam
        await webcam.play();	
        window.requestAnimationFrame(loop);

        // append/get elements to the DOM
        const canvas = document.getElementById("canvas");
        canvas.width = size; canvas.height = size;
        ctx = canvas.getContext("2d");
        labelContainer = document.getElementById("label-container");
        for (let i = 0; i < maxPredictions; i++) { // and class labels
           labelContainer.appendChild(document.createElement("div"));
        }
		
    }

    async function loop(timestamp) {
        webcam.update(); // update the webcam frame
        await predict();
        window.requestAnimationFrame(loop);
    }
    var status = "Walk"
    var count = 10
    async function predict() {
        // Prediction #1: run input through posenet
        // estimatePose can take in an image, video or canvas html element
        const { pose, posenetOutput } = await model.estimatePose(webcam.canvas);
        // Prediction 2: run input through teachable machine classification model
        const prediction = await model.predict(posenetOutput);
	if(prediction[0].probability.toFixed(2)==1.00){
	    if(status=="Jump"){
		count--
	    }
		status = "Walk"
	}else if(prediction[1].probability.toFixed(2)==1.00){
	    status = "Squat"
	}else if(prediction[2].probability.toFixed(2)==1.00){
 	    status = "Jump"
	}else if(prediction[3].probability.toFixed(2)==1.00){
	    status = "Bend"
	}
	
        for (let i = 0; i < maxPredictions; i++) {
            const classPrediction =
                prediction[i].className + ": " + prediction[i].probability.toFixed(2);
            labelContainer.childNodes[i].innerHTML = classPrediction;
	    
        }
	// finally draw the poses
        drawPose(pose);
	move(prediction);
        
    }

    function drawPose(pose) {
        if (webcam.canvas) {
            ctx.drawImage(webcam.canvas, 0, 0);
            // draw the keypoints and skeleton
            if (pose) {
                const minPartConfidence = 0.5;
                tmPose.drawKeypoints(pose.keypoints, minPartConfidence, ctx);
                tmPose.drawSkeleton(pose.keypoints, minPartConfidence, ctx);
            }
        }
    }
    
    function move(prediction){
       
        let codeV = "";
	let codeH = "";
	let codeB = "";
	let codeC = "";
	
	    if(labelContainer.childNodes[0].innerHTML== "Walk: 1.00" ){
	       	codeH="right";
	       console.log("right pressed");
	    }
	    else if(labelContainer.childNodes[1].innerHTML== "Squat: 1.00" ){
	       	codeV="down";
	       console.log("down pressed");
	    }
	    else if(labelContainer.childNodes[2].innerHTML== "Jump: 1.00" ){
	       	codeV="up";
	        if(count==0){
		    codeC="finish";
		}
	       console.log("up pressed");
	    }
	    else if(labelContainer.childNodes[3].innerHTML== "Bend: 1.00" ){
	    	codeB="left";
		console.log("left pressed");
	    }
	    else{
	    	codeV="";
		codeH="";
		codeB="";
		codeC="";
	    }
	if(gameInstance != null){
	    gameInstance.SendMessage("sanuy","setV", codeV);
	    gameInstance.SendMessage("sanuy","setH", codeH);
	    gameInstance.SendMessage("sanuy","setB", codeB);
	    gameInstance.SendMessage("downcounter","setC", codeC);
	    gameInstance.SendMessage("sanuy","setC", codeC);
	}
    }
