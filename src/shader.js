function loadShaders(vertSource, fragSource) {
    let vertShader = compileShader(gl.VERTEX_SHADER, vertSource);
    let fragShader = compileShader(gl.FRAGMENT_SHADER, fragSource);

    let program = gl.createProgram();
    gl.attachShader(program, vertShader);
    gl.attachShader(program, fragShader);

    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        alert("Failed to link shader program:\n" +
              gl.getProgramInfoLog(program))
        return null;
    }
    return program;
}

function compileShader(type, source) {
    let shader = gl.createShader(type);
    gl.shaderSource(shader, source);

    gl.compileShader(shader, source);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        alert("Failed to compile " +
              (type == gl.VERTEX_SHADER ? "vertex" : "fragment") + " shader:\n"
              + gl.getShaderInfoLog(shader));
        return null;
    }
    return shader;
}
