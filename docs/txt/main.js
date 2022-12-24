window.onload = main;

function main() {

	const imgcanvas = document.querySelector( '#a' );
	const img2d = imgcanvas.getContext( '2d' );
	img2d.fillStyle = 'blue';
	img2d.fillRect( 0, 0, 640, 480 );

	const b = document.querySelector( '#b' );
	const b2d = b.getContext( '2d' );
	b2d.fillStyle = 'red';
	b2d.fillRect( 0, 0, 640, 480 );

	const fileupload = document.querySelector( '#fileupload' );
	const uploadBtn = document.querySelector( '#upload-button' );
	uploadBtn.addEventListener( 'click', event => {
		let formData = new FormData();
		formData.append("file", fileupload.files[0]);
		await fetch('/upload.php', {
				method: "POST",
				body: formData
		});

		if ( event.key === 'Enter' ) {

			var img = document.createElement( 'img' );
			img.crossOrigin = 'anonymous';
			img.onload = () => {

				//	// console.log( img.width, img.height, imgcanvas.width, imgcanvas.height );
				img2d.drawImage( img, 0, 0, img.width, img.height, 0, 0, imgcanvas.width, imgcanvas.height );
				const dataURL = imgcanvas.toDataURL();
				console.log( dataURL );
				//	// const imgData = img2d.getImageData( 0, 0, imgcanvas.width, imgcanvas.height );
				//	// for ( let i = 0; i < imgData.data.length; i += 4 ) {

				//	//	let count = imgData.data[ i ] + imgData.data[ i + 1 ] + imgData.data[ i + 2 ];
				//	//	let colour = 0;
				//	//	if ( count > 510 ) colour = 255;
				//	//	else if ( count > 255 ) colour = 127.5;

				//	//	imgData.data[ i ] = colour;
				//	//	imgData.data[ i + 1 ] = colour;
				//	//	imgData.data[ i + 2 ] = colour;
				//	//	imgData.data[ i + 3 ] = 255;

				//	// }

				//	// img2d.putImageData( imgData, 0, 0 );

			};

			img.src = imgsrc.value;

		}

	} );

}

async function getBase64FromUrl( url ) {

	const data = await fetch( url );
	const blob = await data.blob();
	return new Promise( ( resolve ) => {

	  const reader = new FileReader();
	  reader.readAsDataURL( blob );
	  reader.onloadend = () => {

			const base64data = reader.result;
			resolve( base64data );

		};

	} );

}
