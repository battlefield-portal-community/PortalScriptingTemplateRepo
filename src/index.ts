import * as modlib from 'modlib';

let init = false;

function helloWorld(): void {
	// you can view these logs at 
	// %LOCALAPPDATA%\Temp\Battlefieldâ„¢ 6
	console.log("Hello World")
}


export function OngoingGlobal() {
	if (!init) {
		helloWorld();
	}
	init = true;
}

