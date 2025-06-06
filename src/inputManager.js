//Maps for logging keyboard input
let key_map = new Map();
let prev_key_map = new Map();
let Pitch = 0;
let Yaw = 0;
var x;
var y;
var new_pitch;
var new_yaw;
var start_pitch;
var start_yaw;
let first_values_logged = false;

function is_down(key) {

    key = key.toUpperCase();

    if (key_map.get(key) != undefined) {
        return key_map.get(key);
    }

    return false;
}

function was_pressed(key) {

    key = key.toUpperCase();

    if (prev_key_map.get(key) != undefined) {
        return prev_key_map.get(key);
    }

    return false;
}

function is_pressed(key) {
    return (!was_pressed(key) && is_down(key));
}

function update_input_manager() {

    key_map.forEach(function(value, key) {
        prev_key_map.set(key, value);
    });
}

function process_down(event) {

    //Javascript considers lowercase and uppercase keys different events.
    let key = event.key.toUpperCase();
    key_map.set(key, true);

}

function process_up(event) {

    //Javascript considers lowercase and uppercase keys different events.
    let key = event.key.toUpperCase();
    key_map.set(key, false);
}

function limit_angle(angle) {

    if (Math.abs(angle)  > Math.PI / 2) {
        if (angle > 0) {
            return Math.PI / 2;
        } else {
            return -Math.PI / 2;
        }
    } else {
        return angle;
    }
}

function handle_click(e) {
    let mx = e.clientX;
    let my = e.clientY;

    //Left Click
    if (e.which == 1) {
        //Create block at mx my.
    }
    //Right Click
    else if (e.which == 3) {
        //Destroy block at mx my.
    }
}

function handle_mouse(e) {

    if(is_down("shift")) {

        if (!first_values_logged) {

            //log initial mouse coords.
            x = e.clientX;
            y = e.clientY;

            //Set start and new_yaw to original Yaw.
            start_yaw = new_yaw = Yaw;
            start_pitch = new_pitch = Pitch;
            first_values_logged = true;
        }

        new_yaw = start_yaw + (e.clientX - x) / 4;
        new_pitch = start_pitch + (e.clientY - y) / 4;

        Yaw += (new_yaw - Yaw) * 0.001;
        Pitch += (new_pitch - Pitch) * 0.001;

        Pitch = limit_angle(Pitch);
    } else {
        first_values_logged = false;
    }
}
