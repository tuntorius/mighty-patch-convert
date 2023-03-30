const convertButton = document.querySelector('button[type="submit"]');
const saveButton = document.querySelector('.download');
const resultDiv = document.querySelector('.result');
const qrDiv = document.getElementById("qr");

const fileInput = document.getElementById('file-input');
const fileInputLabel = document.querySelector('.file-input-label');
const fileDropZone = document.querySelector('.file-drop-zone');

const deviceName = document.getElementById('devtype');
const qrPatchName = document.querySelector('.qr_name');

const qrOutput = document.getElementById("qr_output");
const patchOutput = document.getElementById("patch_output");

const qrHeader = "nux://MightyAmp:";

let qrFileName = "";
let patchData;

qrOutput.style.display = "none";
patchOutput.style.display = "none";
saveButton.addEventListener('click', (event) => {
	event.preventDefault();

	html2canvas(resultDiv).then(canvas => {
		// Convert the canvas to a PNG image
		const dataURL = canvas.toDataURL('image/png');

		// Call the saveQR function with the data URL as an argument
		saveQR(dataURL);
	});
});

// Show the file input field when the "choose file" label is clicked
fileInputLabel.addEventListener('click', (event) => {
  event.preventDefault();
  fileInput.click();
});

fileInput.addEventListener('change', function(event) {
  handleFiles(event.target.files);
});

// Handle file selection when a file is dropped onto the drop zone
fileDropZone.addEventListener('dragover', (event) => {
  event.preventDefault();
  fileDropZone.classList.add('valid-drop');
});

fileDropZone.addEventListener('dragleave', (event) => {
  event.preventDefault();
  fileDropZone.classList.remove('valid-drop');
});

fileDropZone.addEventListener('drop', (event) => {
  event.preventDefault();
  fileDropZone.classList.remove('valid-drop');
  handleFiles(event.dataTransfer.files);
});

document.addEventListener('dragover', function(event) {
  // Prevent the default behavior which would load the file in the browser
  event.preventDefault();
});

document.addEventListener('drop', function(event) {
  // Prevent the default behavior which would load the file in the browser
  event.preventDefault();
});

function handleFiles(collection) {
	if (collection.length === 0) {
    alert('Please select a file');
    return;
  }
  
  //TODO: handle multiple files in the future?
  if (collection.length > 1) {
    alert('Please select a single file');
    return;
  }
  
  const file = collection[0];
  
  const fileName = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
  
  if (file.name.match(/\.(jpg|jpeg|png)$/)) {
	  // Update the file name display
	  fileInputLabel.textContent = file.name;
	  openQRFile(file);
	  return;
  }
  else if (file.name.match(/\.(mppropatch|mspatch)$/)) {
	  // Update the file name display
	  fileInputLabel.textContent = file.name;
	  
	  openPatchFile(file, fileName);
	  return;
  }
  alert('Please select a QR code image or a mppropatch/mspatch file');
}

function openPatchFile(file, outName) {
  const reader = new FileReader();
  reader.readAsArrayBuffer(file);
  
  reader.onload = (event) => {
    const arrayBuffer = event.target.result;
	const bytes = new Uint8Array(arrayBuffer);
	const subArray = bytes.subarray(4, 4+113);
	const header = new Uint8Array([0x0f, 0x01]); // create a new typed array with header bytes
	const result = new Uint8Array(header.length + subArray.length); // create a new typed array to hold the result
	result.set(header); // set the header bytes at the beginning of the result array
	result.set(subArray, header.length); // set the sub array after the header bytes in the result array
	
	//for (var i=104;i<result.length;i++)
	//	result[i]=0;
	
    const base64Content = btoa(String.fromCharCode(...result));
    const qrContent = `${qrHeader}${base64Content}`;
	
	deviceName.innerText = "Mighty Plug Pro/Mighty Space";
	qrPatchName.innerText = outName;
	qrDiv.innerHTML = "";
    new QRCode(qrDiv, qrContent);
	qrFileName = outName;
	patchOutput.style.display = "none";
	qrOutput.style.display = "block";
    // Do something with the file content, e.g. send it to the server for processing
    //resultDiv.innerHTML = `<h2>Result:</h2><p>${qrContent}</p><a href="#" class="download">Download</a>`;
  };
};

function saveQR(dataURL) {
  // Create a link to download the image
  const link = document.createElement('a');
  link.download = qrFileName;
  link.href = dataURL;
  
  // Click the link to trigger the download
  link.click();
}

function openQRFile(file)
{
	QrScanner.scanImage(file)
		.then(result => {
			if (!result.startsWith(qrHeader))
				alert("Not a Mighty Amp QR File!");
			patchOutput.style.display = "block";
			qrOutput.style.display = "none";
			
			
			const desiredLength = 8404;
			const b64Data = result.substring(qrHeader.length);
			const binaryString = atob(b64Data); // decode base64 string to binary string
			const bytes = new Uint8Array(binaryString.length);
			
			for (let i = 0; i < binaryString.length; i++) {
			  bytes[i] = binaryString.charCodeAt(i);
			}

			// Remove first two bytes and prepend with four 0x00 bytes
			const finalArray = new Uint8Array(desiredLength);
			finalArray.set(bytes.subarray(2), 4);
			patchData = finalArray;
		})
		.catch(error => {
			alert('No QR code found.');
			patchOutput.style.display = "none";
			qrOutput.style.display = "none";
		});
		return;
}

function saveMppro() {
	savePatch(patchData, "mppropatch");
}

function saveMspace() {
	savePatch(patchData, "mspatch");
}

function savePatch(byteArray, extension)
{
	// create binary blob from modified bytes
	const blob = new Blob([byteArray], { type: 'application/octet-stream' });

	// create URL for blob
	const url = URL.createObjectURL(blob);

	// create link element and trigger download
	const link = document.createElement('a');
	link.download = `preset1.${extension}`;
	link.href = url;
	document.body.appendChild(link);
	link.click();

	// clean up URL after download
	URL.revokeObjectURL(url);
}