function download(filename, text) {
	var element = document.createElement('a');
	element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
	element.setAttribute('download', filename);

	element.style.display = 'none';
	document.body.appendChild(element);

	element.click();

	document.body.removeChild(element);
}


function makeMulticam(xmlData) {
	// get highest ref number
	let highestId = 0
	xmlData.querySelectorAll('*').forEach((element) => {
		if (element.id.startsWith('r')) {
			var num = parseInt(element.id.split('r')[1])
			if (num > highestId) {
				highestId = num
			}
		}
	})
	// for each project in the xml
	var multicams = []
	for (let i = 0; i < xmlData.getElementsByTagName('project').length; i++) {
		var spine = xmlData.getElementsByTagName('project')[i].getElementsByTagName('spine')[0]
		// for each clip in the project
		assetClipList = []
		for (let j = 0; j < spine.children.length; j++) {
			var assetClip = spine.children[j]
			if (assetClip.tagName == 'assetClip') {
				assetClipList.push(assetClip)
				var ref = assetClip.getAttribute('ref')
				// find asset in resources and add multicam
				for (let k = 0; k < xmlData.getElementsByTagName('resources')[0].getElementsByTagName('asset').length; k++) {
					var asset = xmlData.getElementsByTagName('resources')[0].getElementsByTagName('asset')[k]
					if (asset.getAttribute('id') == ref) {
						if (multicams.indexOf(ref) == -1) {
							// create media in resources
							var media = xmlData.createElement('media')
							media.setAttribute('id', 'r' + (highestId + 1))
							highestId = highestId + 1
							media.setAttribute('name', asset.getAttribute('name'))
							xmlData.getElementsByTagName('resources')[0].appendChild(media)
							// create multicam in media
							var multicam = xmlData.createElement('multicam')
							multicam.setAttribute('format', asset.getAttribute('format'))
							multicam.setAttribute('tcStart', asset.getAttribute('start'))
							multicam.setAttribute('tcFormat', 'NDF')
							media.appendChild(multicam)
							// create A angle in multicam
							var angle = xmlData.createElement('mc-angle')
							angle.setAttribute('name', 'A')
							angle.setAttribute('angleID', asset.getAttribute('name') + asset.getAttribute('id') + 'A')
							multicam.appendChild(angle)
							// create asset-clip in A angle
							var assetClipinAngle = xmlData.createElement('asset-clip')
							assetClipinAngle.setAttribute('ref', asset.getAttribute('id'))
							assetClipinAngle.setAttribute('offset', '0s')
							assetClipinAngle.setAttribute('name', asset.getAttribute('name'))
							assetClipinAngle.setAttribute('duration', asset.getAttribute('duration'))
							assetClipinAngle.setAttribute('format', asset.getAttribute('format'))
							assetClipinAngle.setAttribute('tcFormat', 'NDF')
							assetClipinAngle.setAttribute('audioRole', 'dialogue')
							angle.appendChild(assetClipinAngle)
							// create B angle in multicam
							var angle = xmlData.createElement('mc-angle')
							angle.setAttribute('name', 'B')
							angle.setAttribute('angleID', asset.getAttribute('name') + asset.getAttribute('id') + 'B')
							multicam.appendChild(angle)
							multicams.push(ref)
						}
						// create mc-clip based on asset-clip
						var mcClip = xmlData.createElement('mc-clip')
						mcClip.setAttribute('ref', 'r' + (highestId))

						mcClip.setAttribute('offset', assetClip.getAttribute('offset'))
						mcClip.setAttribute('name', assetClip.getAttribute('name'))
						mcClip.setAttribute('duration', assetClip.getAttribute('duration'))
						mcClip.setAttribute('start', assetClip.getAttribute('start'))
						spine.appendChild(mcClip)
						mcClip.innerHTML = assetClip.innerHTML
						// add mc-source to mc-clip
						var mcSource = xmlData.createElement('mc-source')
						mcSource.setAttribute('angleID', asset.getAttribute('name') + asset.getAttribute('id') + 'A')
						mcSource.setAttribute('srcEnable', "all")
						mcClip.appendChild(mcSource)

						break
					}
				}

			}

		}
		for (let k = 0; k < assetClipList.length; k++) {
			assetClipList[k].remove()
		}
		// make list of parsererror elements
		var parsererrorList = []
		for (let k = 0; k < xmlData.getElementsByTagName('parsererror').length; k++) {
			parsererrorList.push(xmlData.getElementsByTagName('parsererror')[k])
		}
		// remove parsererror elements
		for (let k = 0; k < parsererrorList.length; k++) {
			parsererrorList[k].remove()
		}


	}

	xmlDataString = new XMLSerializer().serializeToString(xmlData.documentElement);
	console.log(xmlDataString)
	download('made_multicam.fcpxml', xmlDataString)




}

document.querySelectorAll(".drop-zone__input").forEach((inputElement) => {
	const dropZoneElement = inputElement.closest(".drop-zone");


	dropZoneElement.addEventListener("dragover", (e) => {
		e.preventDefault();
		dropZoneElement.classList.add("drop-zone--over");
	});

	["dragleave", "dragend"].forEach((type) => {
		dropZoneElement.addEventListener(type, (e) => {
			dropZoneElement.classList.remove("drop-zone--over");
		});
	});

	dropZoneElement.addEventListener("drop", (e) => {
		e.preventDefault();
		parser = new DOMParser();

		if (e.dataTransfer.files.length) {
			inputElement.files = e.dataTransfer.files;
			var file = e.dataTransfer.files[0]
			let reader = new FileReader();
			reader.readAsText(file);
			reader.onload = function () {
				xmlData = parser.parseFromString(reader.result.split('<!DOCTYPE fcpxml>')[1], "text/xml")
				makeMulticam(xmlData)
			}
		} else {
			var xmlData = parser.parseFromString(e.dataTransfer.getData("text/plain"), "text/xml")
			makeMulticam(xmlData)
		}

		dropZoneElement.classList.remove("drop-zone--over");


	});
});