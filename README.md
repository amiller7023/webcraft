# WebCraft
A MineCraft style browser game created using WebGL.
The game supports the following advanced features.

# Transparency

The game includes transparent clouds at the top of
the world as well as glass blocks to allow for
windows or other types of designs players may want
in their creations.

# Collision Detection

The game performs 3D collision detection to allow for
the player to remain within the world and interact with
newly spawned or deleted blocks. 

# Scene Picking

The game implements scene picking through use of a second
rendering pass that stores color values for every block in
the color buffer. We convert our screen coordinates of the
location we click on to a location in the viewport of the
second rendering pass to find the block corresponding to 
the player's mouse click. We use this to allow for players
to destroy and create blocks in the world and make their own
unique creations.

# How to Play

The game controlls are very simple. The move around in the
world, the arrow keys on the keyboard can be used as well as
the WASD keys. To look around in the scene, hold down shift 
and move the mouse in the direction you wish to move. To create
a block, right click on one of the blocks in the world and a new
block will be added above it. To remove a block, left click on
the block you wish to destroy and it will be removed from the 
world. The blocks you place will start out as just a standard 
grass block, but once you destroy a block you will begin placing
blocks of that type.

# How to Run

The game can be run by opening the index.html file in Firefox, or
by running the included host.bat or host.command scripts and 
connecting to localhost:8000 in any web browser of your choosing.
The game has been tested on Windows and Mac and Linux devices in the 
Firefox and Google Chrome browsers.
