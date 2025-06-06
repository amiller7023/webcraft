let dt = 0.0;
let rotation = 0.0;

let world_len = 20;
let world_width = 20;
let world_height = 100;
let ground_height = 2;
let world = Create3DArray(world_len, world_width, world_height);

let cameraPos = Vec.of(world_len, ground_height*2 + 2, 20);
let camera = Mat4.identity().times(
    Mat4.translation(cameraPos));

let is_player_falling = false;
let is_played_over = false;

let whiteTex = null;

let program = null;

var curr_time;
let sfx_begin_time = 0;

let blockType = null;
let terminal_vel = -1;

main();

function main() {
    let canvas = document.querySelector("#canvas");
    gl = canvas.getContext("webgl");
    if (!gl) {
        alert("Failed to initialize WebGL.");
        return;
    }

    //Make sky a light blue.
    gl.clearColor(0.65, 0.8, 1.0, 1.0);
    gl.clearDepth(1.0);
    gl.enable(gl.DEPTH_TEST);
    gl.enable(gl.CULL_FACE);
    gl.enable(gl.BLEND);
    gl.depthFunc(gl.LEQUAL);

    //Enable transparency
    gl.blendFunc( gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA );

    let vertSource = `
        attribute vec4 v_position;
        attribute vec2 v_texCoords;
        attribute vec4 v_color;

        uniform mat4 u_modelView;
        uniform mat4 u_camera;
        uniform mat4 u_projection;

        varying highp vec2 f_texCoords;
        varying highp vec4 f_color;

        void main() {
            gl_Position = u_projection * u_camera * u_modelView * v_position;
            f_texCoords = v_texCoords;
            f_color = v_color;
        }
    `;
    let fragSource = `
    	precision highp float;

        varying vec2 f_texCoords;
        varying vec4 f_color;

        uniform sampler2D u_sampler;

        void main() {
            vec4 color = texture2D(u_sampler, f_texCoords) * vec4(f_color.rgb, 1.0);
            if (color.a < 0.1) discard;
            gl_FragColor = vec4(color.rgb, color.a);
        }
    `;

    let programId = loadShaders(vertSource, fragSource);
    program = {
        id: programId,
        attribLocs: {
            position: gl.getAttribLocation(programId, "v_position"),
            texCoords: gl.getAttribLocation(programId, "v_texCoords"),
            color: gl.getAttribLocation(programId, "v_color")
        },
        uniformLocs: {
            projection: gl.getUniformLocation(programId, "u_projection"),
            camera: gl.getUniformLocation(programId, "u_camera"),
            modelView: gl.getUniformLocation(programId, "u_modelView"),
            sampler: gl.getUniformLocation(programId, "u_sampler")
        }
    };

	let bufs = initBuffers();
    blocks = {
        grass: {
            buffers: bufs,
            texture: loadTexture("assets/texture/grass.jpg"),
            model_transform: Mat4.identity()
        },
        snowy_ground: {
            buffers: bufs,
            texture: loadTexture("assets/texture/snowy_ground.jpg"),
            model_transform: Mat4.identity()
        },
        bricks: {
        	buffers: bufs,
        	texture: loadTexture("assets/texture/bricks.png"),
        	model_transform: Mat4.identity()
        },
        stone: {
        	buffers: bufs,
        	texture: loadTexture("assets/texture/stone.png"),
        	model_transform: Mat4.identity()
        },
        sand: {
        	buffers: bufs,
        	texture: loadTexture("assets/texture/sand.png"),
        	model_transform: Mat4.identity()
        },
        snow: {
        	buffers: bufs,
        	texture: loadTexture("assets/texture/snow.png"),
        	model_transform: Mat4.identity()
        },
        pumpkin: {
        	buffers: bufs,
        	texture: loadTexture("assets/texture/pumpkin.png"),
        	model_transform: Mat4.identity()
        },
        glass: {
        	buffers: bufs,
        	texture: loadTexture("assets/texture/glass.png"),
        	model_transform: Mat4.identity()
        },
        wood: {
            buffers: bufs,
        	texture: loadTexture("assets/texture/wood.png"),
        	model_transform: Mat4.identity()
        },
        tree: {
        	buffers: bufs,
        	texture: loadTexture("assets/texture/tree.png"),
        	model_transform: Mat4.identity()
        },
        tnt: {
        	buffers: bufs,
        	texture: loadTexture("assets/texture/tnt.png"),
        	model_transform: Mat4.identity()
        },
        unbreakable: {
        	buffers: bufs,
        	texture: loadTexture("assets/texture/unbreakable.png"),
        	model_transform: Mat4.identity()
        },
        coal: {
        	buffers: bufs,
        	texture: loadTexture("assets/texture/coal.png"),
        	model_transform: Mat4.identity()
        },
        copper_ore: {
        	buffers: bufs,
        	texture: loadTexture("assets/texture/copper_ore.png"),
        	model_transform: Mat4.identity()
        },
        diamond_ore: {
        	buffers: bufs,
        	texture: loadTexture("assets/texture/diamond_ore.png"),
        	model_transform: Mat4.identity()
        },
        gold_ore: {
        	buffers: bufs,
        	texture: loadTexture("assets/texture/gold_ore.png"),
        	model_transform: Mat4.identity()
        },
        ruby_ore: {
        	buffers: bufs,
        	texture: loadTexture("assets/texture/ruby_ore.png"),
        	model_transform: Mat4.identity()
        },
        cloud: {
        	buffers: bufs,
        	texture: loadTexture("assets/texture/cloud.png"),
        	model_transform: Mat4.identity()
        },

        empty: {
            //Has nothing
        }
    };
    blockType = blocks.grass;

    gl.useProgram(program.id);

    whiteTex = gl.createTexture();
	gl.activeTexture(gl.TEXTURE0);
	gl.bindTexture(gl.TEXTURE_2D, whiteTex);
	let white = new Uint8Array([255, 255, 255, 255]);
	gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, white);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
	gl.uniform1i(program.uniformLocs.sampler, 0 );

    this.sounds = {
        background: new Audio('assets/sound/background/forest.ogg'),
        step_grass: new Audio('assets/sound/step/grass4.ogg'),
        break_grass: new Audio('assets/sound/break/grass.ogg'),
        place_grass: new Audio('assets/sound/place/grass.ogg'),

        step_glass: new Audio('assets/sound/step/glass.ogg'),
        break_glass: new Audio('assets/sound/break/glass.ogg'),
        place_glass: new Audio('assets/sound/place/glass.ogg'),

        step_snow: new Audio('assets/sound/step/snow2.ogg'),
        break_snow: new Audio('assets/sound/break/snow.ogg'),
        place_snow: new Audio('assets/sound/place/snow.ogg'),

        step_sand: new Audio('assets/sound/step/sand2.ogg'),
        break_sand: new Audio('assets/sound/break/sand.ogg'),
        place_sand: new Audio('assets/sound/place/sand.ogg'),

        step_stone: new Audio('assets/sound/step/stone4.ogg'),
        break_stone: new Audio('assets/sound/break/stone.ogg'),
        place_stone: new Audio('assets/sound/place/stone.ogg'),

        step_wood: new Audio('assets/sound/step/wood2.ogg'),
        break_wood: new Audio('assets/sound/break/wood.ogg'),
        place_wood: new Audio('assets/sound/place/wood.ogg'),

        break_tnt: new Audio('assets/sound/break/tnt.ogg'),

        hurt: new Audio('assets/sound/hurt.ogg')
    }

    create_world(blocks);

	document.addEventListener('contextmenu', event => event.preventDefault()); // disable right-click
    document.addEventListener("keydown", process_down);
    document.addEventListener("keyup", process_up);
    document.onmousedown = pick; // also calls handle_click
    document.onmousemove = handle_mouse;

    document.body.requestPointerLock || document.body.mozRequestPointerLock ||
    document.body.webkitRequestPointerLock;

    //Main Game loop.
    var then = 0;
    function update(now) {

        //Update time.
        now *= 0.001; // ms -> s
        dt = now - then;
        then = now;
        curr_time = now;

        process_input();

        set_camera();

        //Draw to the screen.
        render(program, dt, blocks);

        //Draw clouds last since they are transparent
        //Clouds don't have collision so they don't go in world array
        draw_clouds();

        update_input_manager();
        requestAnimationFrame(update);
    }
    requestAnimationFrame(update);
}

function draw_clouds() {

    drawBlock(program, Mat4.identity().times(
        Mat4.translation([12, 0, 0])).times(
        Mat4.translation([0, 0, 6])).times(
        Mat4.translation([0, 40, 0])).times(
        Mat4.scale([6,1,12])), blocks.cloud);

    drawBlock(program, Mat4.identity().times(
        Mat4.translation([0, 0, 0])).times(
        Mat4.translation([0, 0, 30])).times(
        Mat4.translation([0, 26, 0])).times(
        Mat4.scale([8,1,5])), blocks.cloud);

    drawBlock(program, Mat4.identity().times(
        Mat4.translation([30, 0, 0])).times(
        Mat4.translation([0, 0, 15])).times(
        Mat4.translation([0, 30, 0])).times(
        Mat4.scale([3,1,9])), blocks.cloud);

    drawBlock(program, Mat4.identity().times(
        Mat4.translation([38, 0, 0])).times(
        Mat4.translation([0, 0, 25])).times(
        Mat4.translation([0, 22, 0])).times(
        Mat4.scale([3,1,9])), blocks.cloud);

    drawBlock(program, Mat4.identity().times(
        Mat4.translation([17, 0, 0])).times(
        Mat4.translation([0, 0, 38])).times(
        Mat4.translation([0, 30, 0])).times(
        Mat4.scale([4,1,16])), blocks.cloud);
}

function pick(e) {
    let fbo = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);

    let tex = gl.createTexture();
	gl.bindTexture(gl.TEXTURE_2D, tex);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
	gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 512, 512, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);

    let rbo = gl.createRenderbuffer();
    gl.bindRenderbuffer(gl.RENDERBUFFER, rbo);
    gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, 512, 512);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
    gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT,
                               gl.RENDERBUFFER, rbo);

	gl.bindTexture(gl.TEXTURE_2D, whiteTex);
    gl.viewport(0, 0, 512, 512);
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    for (let x = 0; x < world_len; x++) {
        for (let y = 0; y < world_width; y++) {
            for (let z = 0; z < world_height; z++) {
                if (world[x][y][z] != blocks.empty) {
                    drawPickBlock(Mat4.identity().times(
                                      Mat4.translation([2*y, 0, 0])).times(
                                      Mat4.translation([0, 0, 2*x])).times(
                                      Mat4.translation([0, 2*z, 0])),
                                  world[x][y][z], getColor(x, y, z));
                }
            }
        }
    }

    let pixel = new Uint8Array(4);
    let mx = e.clientX;
    let my = e.clientY;

    gl.readPixels(mx/gl.canvas.clientWidth * 512, (1-my/gl.canvas.clientHeight) * 512, 1, 1,
                  gl.RGBA, gl.UNSIGNED_BYTE, pixel);

    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.clearColor(0.65, 0.8, 1.0, 1.0);
    gl.viewport(0, 0, 1080, 720);

    gl.deleteRenderbuffer(rbo);
    gl.deleteFramebuffer(fbo);

    if (e.which == 1) {
        //Determine which block sound for breaking
        switch (world[pixel[0]][pixel[1]][pixel[2]]) {   
            case blocks.grass:
            case blocks.snowy_ground:
                play_sound("break_grass");
                break;
            case blocks.snow:
                play_sound("break_snow");
                break;
            case blocks.stone:
            case blocks.ruby_ore:
            case blocks.diamond_ore:
            case blocks.gold_ore:
            case blocks.copper_ore:
            case blocks.coal:
            case blocks.bricks:
                play_sound("break_stone");
                break;
            case blocks.sand:
                play_sound("break_sand");
                break;
            case blocks.glass:
                play_sound("break_glass");
                break;
            case blocks.wood:
            case blocks.tree:
            case blocks.pumpkin:
                play_sound("break_wood");
                break;
            case blocks.tnt:
                play_sound("break_tnt");
                for (var i = pixel[0] - 1; i < pixel[0] + 2; i++) {
                    for (var j = pixel[1] - 1; j < pixel[1] + 2; j++) {
                        for (var k = pixel[2] - 1; k < pixel[2] + 2; k++) {
                            if (valid_block(i, j, k) != blocks.empty && valid_block(i, j, k) != blocks.unbreakable) {
                                world[i][j][k] = blocks.empty;
                            }
                        }
                    }
                }
                blockType = blocks.tnt;
                return;
            case blocks.unbreakable:
                //Exit function so we don't remove this one.
                return
        }

		blockType = world[pixel[0]][pixel[1]][pixel[2]];
        world[pixel[0]][pixel[1]][pixel[2]] = blocks.empty;

    } else if (e.which == 3) {

        //Determine which block sound for making
        switch (blockType) {
            case blocks.grass:
            case blocks.snowy_ground:
                play_sound("place_grass");
                break;
            case blocks.snow:
                play_sound("place_snow");
                break;
            case blocks.stone:
            case blocks.ruby_ore:
            case blocks.diamond_ore:
            case blocks.gold_ore:
            case blocks.copper_ore:
            case blocks.coal:
            case blocks.bricks:
                play_sound("place_stone");
                break;
            case blocks.sand:
                play_sound("place_sand");
                break;
            case blocks.glass:
                play_sound("place_glass");
                break;
            case blocks.wood:
            case blocks.tree:
            case blocks.pumpkin:
            case blocks.tnt:
            case blocks.unbreakable:
                play_sound("place_wood");
                break;
        }
        if (world[pixel[0]][pixel[1]][pixel[2]+1] == blocks.empty)
        	world[pixel[0]][pixel[1]][pixel[2]+1] = blockType;
    }
}

function drawPickBlock(transform, block, color) {
    gl.bindTexture(gl.TEXTURE_2D, whiteTex);

    gl.bindBuffer(gl.ARRAY_BUFFER, block.buffers.position);
    gl.vertexAttribPointer(program.attribLocs.position,
                           3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(program.attribLocs.position);

    gl.bindBuffer(gl.ARRAY_BUFFER, block.buffers.texCoords);
    gl.vertexAttribPointer(program.attribLocs.texCoords,
                           2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(program.attribLocs.texCoords);

    gl.bindBuffer(gl.ARRAY_BUFFER, color);
    gl.vertexAttribPointer(program.attribLocs.color,
                           4, gl.FLOAT, true, 0, 0);
    gl.enableVertexAttribArray(program.attribLocs.color);

    gl.uniformMatrix4fv(program.uniformLocs.modelView, false,
                        Mat.flatten_2D_to_1D(transform.transposed()));

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, block.buffers.indices);
    gl.drawElements(gl.TRIANGLES, 36, gl.UNSIGNED_SHORT, 0);
}

function getColor(x, y, z) {
	let colorBuf = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, colorBuf);
	let r = x/255;
	let g = y/255;
	let b = z/255;
	let a = 1.0;

	let color = [];
	for (let i = 0; i < 36; i++) {
		color.push(r, g, b, 1);
	}
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(color),
                  gl.STATIC_DRAW);
    return colorBuf;
}

function play_sound(name, volume = 1){

    if (curr_time - sfx_begin_time > 0.3) {
        this.sounds[ name ].currentTime = 0;
        this.sounds[ name ].volume = Math.min(Math.max(volume, 0), 1);;
        this.sounds[ name ].play();

        sfx_begin_time = curr_time;
    }
}


function create_world(blocks) {

	for ( var x = 0; x < world_len; x++ ) {
		for ( var y = 0; y < world_width; y++ ) {
			for ( var z = 0; z < world_height; z++ ) {
                if (z < ground_height) {
                    if (z == 0)
                        world[x][y][z] = blocks.unbreakable;
                    else
                        world[x][y][z] = blocks.grass;
                }
                else
                    world[x][y][z] = blocks.empty;
			}
		}
    }
    for (var x = 0; x < 18; x++){
        world[x][8][2] = blocks.pumpkin;
        world[x][7][3] = blocks.snowy_ground;
        world[x][6][4] = blocks.sand;
        world[x][5][5] = blocks.glass;
        world[x][4][6] = blocks.gold_ore;
        world[x][3][7] = blocks.tnt;
        world[x][2][8] = blocks.wood;
        world[x][1][9] = blocks.bricks;
        
    }

    //Showcase all kinds of blocks
    world[1][19][2] = blocks.snowy_ground;
    world[3][19][2] = blocks.sand;
    world[5][19][2] = blocks.snow;
    world[7][19][2] = blocks.copper_ore;
    world[9][19][2] = blocks.gold_ore;
    world[11][19][2] = blocks.diamond_ore;
    world[13][19][2] = blocks.ruby_ore;
    world[15][19][2] = blocks.stone;
    world[17][19][2] = blocks.pumpkin;
    world[19][19][2] = blocks.wood;
    world[1][17][2] = blocks.tree;
    world[3][17][2] = blocks.coal;
    world[5][17][2] = blocks.tnt;
    world[7][17][2] = blocks.bricks;
    world[9][17][2] = blocks.glass;
}

function set_camera() {

    camera = Mat4.identity().times(
        Mat4.rotation(Pitch , [1, 0, 0])).times(
        Mat4.rotation(Yaw,    [0, 1, 0])).times(
        Mat4.rotation(0,      [0, 0, 1])).times(
        Mat4.translation(Vec.of(-cameraPos[0], -cameraPos[1], -cameraPos[2])));
}

function valid_block(x,y,z) {
    if ( x < 0 || y < 0 || z < 0 || x > world_len - 1 || y > world_width - 1 || z > world_height - 1 )
        return blocks.empty;
	return world[x][y][z];
}

function check_collision_rect_to_line(line, rect)
{
	if ( line.y != null )
		return rect.y > line.y - rect.size/2 && rect.y < line.y + rect.size/2 && rect.x > line.x1 - rect.size/2 && rect.x < line.x2 + rect.size/2;
	else
		return rect.x > line.x - rect.size/2 && rect.x < line.x + rect.size/2 && rect.y > line.y1 - rect.size/2 && rect.y < line.y2 + rect.size/2;
}


function check_collision_rect_to_rect(r1, r2)
{
	if ( r2.x1 > r1.x1 && r2.x1 < r1.x2 && r2.y1 > r1.y1 && r2.y1 < r1.y2 ) return true;
	if ( r2.x2 > r1.x1 && r2.x2 < r1.x2 && r2.y1 > r1.y1 && r2.y1 < r1.y2 ) return true;
	if ( r2.x2 > r1.x1 && r2.x2 < r1.x2 && r2.y2 > r1.y1 && r2.y2 < r1.y2 ) return true;
	if ( r2.x1 > r1.x1 && r2.x1 < r1.x2 && r2.y2 > r1.y1 && r2.y2 < r1.y2 ) return true;
	return false;
}

function handle_collision(pos, x, y, z) {

    let box_x = Math.floor(pos[0] / 2);
    let box_y = Math.floor(pos[2] / 2);
    let box_z = Math.floor(pos[1] / 2);

    var player_box = { x: x + pos[0], y: y + pos[2], size: 2 };

    collision_grid = [];

    //Collect 3x3 grid of boxes surrounding player
    for (var i = box_x - 1; i <= box_x + 1; i++) {
        for (var j = box_y - 1; j <= box_y + 1; j++) {
            for (var k = box_z - 1; k <= box_z + 1; k++) {
                if (valid_block(j,i,k) != blocks.empty) {
                    if (valid_block(j,i-1,k) == blocks.empty)
                        collision_grid.push( { x: 2*i, dir: -1, y1: 2*j, y2: 2*j + 2 } );
                    if (valid_block(j,i+1,k) == blocks.empty)
                        collision_grid.push( { x: 2*i + 2, dir: 1, y1: 2*j, y2: 2*j + 2 } );
                    if (valid_block(j-1,i,k) == blocks.empty)
                        collision_grid.push( { y: 2*j, dir: -1, x1: 2*i, x2: 2*i + 2 } );
                    if (valid_block(j+1,i,k) == blocks.empty)
                        collision_grid.push( { y: 2*j + 2, dir: 1, x1: 2*i, x2: 2*i + 2 } );
                }
            }
        }
    }

    //Handle XY Collisions
    for (var i in collision_grid) {
        var side = collision_grid[i];

		if ( check_collision_rect_to_line( side, player_box ) )
		{
			if ( side.x != null && x * side.dir < 0 ) {
				x = 0;
			} else if ( side.y != null && y * side.dir < 0 ) {
				y = 0;
			}
		}
    }

    //Z collisions
    collision_grid = [];
    let bottom = Math.floor((pos[1] + z - 2)/2);
    let top = Math.floor((pos[1] + z + 2) / 2);

    var player_bounding_box = { x1: pos[0] + x - 1, y1: pos[2] + y - 1, x2: pos[0] + x + 1, y2: pos[2] + y + 1 };

    //Collect all boxes at the feet and height of player in 3x3 grid.
    for (var i = box_x - 1; i <= box_x + 1; i++) {
        for (var j = box_y - 1; j < box_y + 1; j++) {
            if ( valid_block( j, i, bottom ) != blocks.empty )
                collision_grid.push( { z: 2*bottom, dir: 1, x1: 2*i, y1: 2*j, x2: 2*i + 2, y2: 2*j + 2 } );
			if ( valid_block( j, i, top ) != blocks.empty )
                collision_grid.push( { z: top*2 + 2, dir: -1, x1: 2*i, y1: 2*j, x2: 2*i + 2, y2: 2*j + 2 } );
        }
    }

    //Handle Z Collisions
    is_player_falling = true;
    for (var i in collision_grid) {
        var cube_bounding_box = collision_grid[i];

        if ( check_collision_rect_to_rect(cube_bounding_box, player_bounding_box) && z * cube_bounding_box.dir < 0 )
		{
			if ( z <= 0 ) {
                if (z == terminal_vel) {
                    play_sound("hurt");
                }
                z = 0;
                is_player_falling = false;
                z_vel = 0;
			} else {
                z = 0;
                z_vel = 0;
			}

			break;
		}
    }

    //Handle Edge of world collisions
    if (player_box.x < 0 || player_box.x >= 2*world_len - 2){
        x = 0;
    }
    if (player_box.y < 0 || player_box.y >= 2*world_width - 2) {
        y = 0;
    }

    return Vec.of(x, z, y);
}

let z_vel = 0;

function process_input() {

    let speed = 25.0 * dt / 2;
    let x_vel = 0;
    let y_vel = 0;

    //Handle falling
    if (is_player_falling) {
        z_vel -= 0.1;
        //Prevent player from clipping through ground at high speeds
        if (z_vel < terminal_vel) {
            z_vel = terminal_vel;
        }
    }

    //Handle jump
    if (is_down(" ") && !is_player_falling) {
        z_vel = 0.75;
        is_player_falling = true;
    }

    //Player movement
    if (is_down("arrowright") || is_down("d")) {
        x_vel += speed * Math.cos(Yaw);
        y_vel += speed * Math.sin(Yaw);
    }
    if (is_down("arrowleft") || is_down("a")) {
        x_vel -= speed * Math.cos(Yaw);
        y_vel -= speed * Math.sin(Yaw);
    }
    if (is_down("arrowup") || is_down("w")) {
        x_vel -= speed * Math.cos(Math.PI / 2 + Yaw);
        y_vel -= speed * Math.sin(Math.PI / 2 - Yaw);
    }
    if (is_down("arrowdown") || is_down("s")) {
        x_vel += speed * Math.cos(Math.PI / 2 + Yaw);
        y_vel += speed * Math.sin(Math.PI / 2 - Yaw);
    }

    let move = handle_collision(cameraPos, x_vel, y_vel, z_vel);
    let cur_block = valid_block(Math.floor(Math.floor(cameraPos[2])/2),
                                Math.floor(Math.floor(cameraPos[0])/2), 
                                Math.floor(Math.floor(cameraPos[1])/2-2));

    if (move[0] != 0 || move[2] != 0) {
        switch (cur_block){
        	case blocks.grass:
                play_sound("step_grass");
                break;
            case blocks.snow:
            case blocks.snowy_ground:
                play_sound("step_snow");
                break;
            case blocks.glass:
            case blocks.stone:
            case blocks.ruby_ore:
            case blocks.diamond_ore:
            case blocks.gold_ore:
            case blocks.copper_ore:
            case blocks.coal:
            case blocks.bricks:
            case blocks.unbreakable:
                play_sound("step_stone");
                break;
            case blocks.sand:
                play_sound("step_sand");
                break;
            case blocks.wood:
            case blocks.tree:
            case blocks.pumpkin:
            case blocks.tnt:
                play_sound("step_wood");
                break;
        }
    }
    cameraPos = cameraPos.plus(move);
}

function initBuffers() {
    let positionBuf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuf);

    const positions = [
        // Front face
        -1.0, -1.0,  1.0,
         1.0, -1.0,  1.0,
         1.0,  1.0,  1.0,
        -1.0,  1.0,  1.0,

        // Back face
        -1.0, -1.0, -1.0,
        -1.0,  1.0, -1.0,
         1.0,  1.0, -1.0,
         1.0, -1.0, -1.0,

        // Top face
        -1.0,  1.0, -1.0,
        -1.0,  1.0,  1.0,
         1.0,  1.0,  1.0,
         1.0,  1.0, -1.0,

        // Bottom face
        -1.0, -1.0, -1.0,
         1.0, -1.0, -1.0,
         1.0, -1.0,  1.0,
        -1.0, -1.0,  1.0,

        // Right face
         1.0, -1.0, -1.0,
         1.0,  1.0, -1.0,
         1.0,  1.0,  1.0,
         1.0, -1.0,  1.0,

        // Left face
        -1.0, -1.0, -1.0,
        -1.0, -1.0,  1.0,
        -1.0,  1.0,  1.0,
        -1.0,  1.0, -1.0
    ];
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions),
                  gl.STATIC_DRAW);

    let indexBuf = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuf);

    let indices = [
         0,  1,  2,   0,  2,  3, // front
         4,  5,  6,   4,  6,  7, // back
         8,  9, 10,   8, 10, 11, // top
        12, 13, 14,  12, 14, 15, // bottom
        16, 17, 18,  16, 18, 19, // right
        20, 21, 22,  20, 22, 23  // left
    ];
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices),
                  gl.STATIC_DRAW);

    let texCoordBuf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuf);

    let texCoords = [
        // Front
        0.0,  1.0,
        0.5,  1.0,
        0.5,  0.5,
        0.0,  0.5,
        // Back
        0.5,  1.0,
        0.5,  0.5,
        0.0,  0.5,
        0.0,  1.0,
        // Top
        0.5,  0.5,
        1.0,  0.5,
        1.0,  1.0,
        0.5,  1.0,
        // Bottom
        0.0,  0.0,
        0.5,  0.0,
        0.5,  0.5,
        0.0,  0.5,
        // Right
        0.5,  1.0,
        0.5,  0.5,
        0.0,  0.5,
        0.0,  1.0,
        // Left
        0.0,  1.0,
        0.5,  1.0,
        0.5,  0.5,
        0.0,  0.5,
    ];
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(texCoords),
                  gl.STATIC_DRAW);

    let colorBuf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, colorBuf);
    let color = [];
    for (let i = 0; i < 4*36; i++) {
    	color.push(1.0);
    }
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(color),
                  gl.STATIC_DRAW);

    return {
        position: positionBuf,
        texCoords: texCoordBuf,
        indices: indexBuf,
        color: colorBuf
    };
}

function render(program, dt, blocks) {
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    let fov = 45 * Math.PI / 180;
    let aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
    let zNear = 0.1;
    let zFar = 100.0;

    let projection = Mat4.identity().times(
        Mat4.perspective(fov, aspect, zNear, zFar));

    gl.useProgram(program.id);

    gl.uniformMatrix4fv(program.uniformLocs.projection, false,
                        Mat.flatten_2D_to_1D(projection.transposed()));
    gl.uniformMatrix4fv(program.uniformLocs.camera, false,
                        Mat.flatten_2D_to_1D(camera.transposed()));

    for (let i = 0; i < world_len; i++) {
        for (let j = 0; j < world_width; j++) {
            for (let k = 0; k < world_height; k++) {
                if (world[i][j][k] != blocks.empty) {
                    drawBlock(program, Mat4.identity().times(
                        Mat4.translation([2*j, 0, 0])).times(
                        Mat4.translation([0, 0, 2*i])).times(
                        Mat4.translation([0, 2*k, 0])), world[i][j][k]);
                }
            }
        }
    }
}

function drawBlock(program, transform, block) {
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, block.texture);
    gl.uniform1i(program.uniformLocs.sampler, 0);

    gl.bindBuffer(gl.ARRAY_BUFFER, block.buffers.position);
    gl.vertexAttribPointer(program.attribLocs.position,
                           3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(program.attribLocs.position);

    gl.bindBuffer(gl.ARRAY_BUFFER, block.buffers.texCoords);
    gl.vertexAttribPointer(program.attribLocs.texCoords,
                           2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(program.attribLocs.texCoords);

    gl.bindBuffer(gl.ARRAY_BUFFER, block.buffers.color);
    gl.vertexAttribPointer(program.attribLocs.color,
                           4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(program.attribLocs.color);

    gl.uniformMatrix4fv(program.uniformLocs.modelView, false,
                        Mat.flatten_2D_to_1D(transform.transposed()));

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, block.buffers.indices);
    gl.drawElements(gl.TRIANGLES, 36, gl.UNSIGNED_SHORT, 0);
}
