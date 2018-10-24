
function Renderer( id ) {

	var canvas = this.canvas = document.getElementById( id );
	canvas.renderer = this;
	canvas.width = canvas.clientWidth;
	canvas.height = canvas.clientHeight;
	
	// Initialise WebGL
	var gl;
	try
	{
		gl = this.gl = canvas.getContext( "webgl" );
	} catch ( e ) {
		throw "Your browser doesn't support WebGL!";
	}
	
	gl.viewportWidth = canvas.width;
	gl.viewportHeight = canvas.height;
    
    gl.clearColor( 0.62, 0.81, 1.0, 1.0 );
	gl.blendFunc( gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA );
	
}


Renderer.prototype.draw = function() {

    gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT );
}