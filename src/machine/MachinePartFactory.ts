namespace MarbleRunSimulatorCore {
    export var TrackNames = [
        "ramp-1.1.1",
        "wave-2.1.1",
        "snake-2.1.1",
        "join",
        "flatjoin",
        "split",
        "uturn-0.2",
        "wall-3.3",
        "uturnsharp-1",
        "loop-2.2.1",
        "spiral-1.2",
        "elevator-4",
        "stairway-2.4",
        "screw-2.2",
        "start",
        "end",
        "jumper-1",
        "gravitywell",
        "shooter-8",
        "controler",
        "screen",
        "speeder",
        "forwardSplit",
        "spiralUTurn-3.2",
    ];

    export interface IMachinePartProp {
        fullPartName?: string;
        i?: number;
        j?: number;
        k?: number;
        w?: number;
        h?: number;
        d?: number;
        n?: number;
        c?: number[];
        mirrorX?: boolean;
        mirrorZ?: boolean;
    }

    export class MachinePartFactory {
        constructor(public machine: Machine) {}

        public createTrackWHDN(trackname: string, props?: IMachinePartProp): MachinePart {
            if (!props) {
                props = {};
            }
            props.fullPartName = trackname; // hacky but work

            trackname = trackname.split("-")[0];

            console.log("createTrackWHDN " + trackname)
            return this.createTrack(trackname, props);
        }

        public createTrack(partName: string, prop: IMachinePartProp): MachinePart {
            if (partName.indexOf("_X") != -1) {
                prop.mirrorX = true;
                partName = partName.replace("_X", "");
            }
            if (partName.indexOf("_Z") != -1) {
                prop.mirrorX = true;
                partName = partName.replace("_Z", "");
            }

            if (partName === "ramp" || partName.startsWith("ramp-")) {
                let argStr = partName.split("-")[1];
                if (argStr) {
                    let w = parseInt(argStr.split(".")[0]);
                    let h = parseInt(argStr.split(".")[1]);
                    let d = parseInt(argStr.split(".")[2]);
                    prop.w = w;
                    prop.h = h;
                    prop.d = d;
                }
                return new Ramp(this.machine, prop);
            }
            if (partName === "wave" || partName.startsWith("wave-")) {
                let argStr = partName.split("-")[1];
                if (argStr) {
                    let w = parseInt(argStr.split(".")[0]);
                    let h = parseInt(argStr.split(".")[1]);
                    let d = parseInt(argStr.split(".")[2]);
                    prop.w = w;
                    prop.h = h;
                    prop.d = d;
                }
                return new Wave(this.machine, prop);
            }
            if (partName === "snake" || partName.startsWith("snake-")) {
                let argStr = partName.split("-")[1];
                if (argStr) {
                    let w = parseInt(argStr.split(".")[0]);
                    prop.w = w;
                }
                return new Snake(this.machine, prop);
            }
            if (partName === "uturn" || partName.startsWith("uturn-")) {
                let argStr = partName.split("-")[1];
                if (argStr) {
                    let h = parseInt(argStr.split(".")[0]);
                    let d = parseInt(argStr.split(".")[1]);
                    prop.h = h;
                    prop.d = d;
                }
                return new UTurn(this.machine, prop);
            }
            if (partName === "wall" || partName.startsWith("wall-")) {
                let argStr = partName.split("-")[1];
                if (argStr) {
                    let h = parseInt(argStr.split(".")[0]);
                    let d = parseInt(argStr.split(".")[1]);
                    prop.h = h;
                    prop.d = d;
                }
                return new Wall(this.machine, prop);
            }
            if (partName === "uturnsharp" || partName.startsWith("uturnsharp-")) {
                let argStr = partName.split("-")[1];
                if (argStr) {
                    let h = parseInt(argStr.split(".")[0]);
                    prop.h = h;
                }
                return new UTurnSharp(this.machine, prop);
            }
            if (partName === "start") {
                return new Start(this.machine, prop);
            }
            if (partName === "end") {
                return new End(this.machine, prop);
            }
            if (partName === "jumper" || partName.startsWith("jumper-")) {
                let argStr = partName.split("-")[1];
                if (argStr) {
                    let n = parseInt(argStr.split(".")[0]);
                    prop.n = n;
                }
                return new Jumper(this.machine, prop);
            }
            if (partName === "gravitywell") {
                return new GravityWell(this.machine, prop);
            }
            if (partName === "loop" || partName.startsWith("loop-")) {
                let argStr = partName.split("-")[1];
                if (argStr) {
                    let w = parseInt(argStr.split(".")[0]);
                    let d = parseInt(argStr.split(".")[1]);
                    let n = parseInt(argStr.split(".")[2]);
                    prop.w = w;
                    prop.d = d;
                    prop.n = n;
                }
                return new Loop(this.machine, prop);
            }
            if (partName === "spiral" || partName.startsWith("spiral-")) {
                let argStr = partName.split("-")[1];
                if (argStr) {
                    let w = parseInt(argStr.split(".")[0]);
                    let h = parseInt(argStr.split(".")[1]);
                    prop.w = w;
                    prop.h = h;
                }
                return new Spiral(this.machine, prop);
            }
            if (partName === "spiralUTurn" || partName.startsWith("spiralUTurn-")) {
                let argStr = partName.split("-")[1];
                if (argStr) {
                    let h = parseInt(argStr.split(".")[0]);
                    let d = parseInt(argStr.split(".")[1]);
                    prop.h = h;
                    prop.d = d;
                }
                return new SpiralUTurn(this.machine, prop);
            }
            if (partName === "join") {
                return new Join(this.machine, prop);
            }
            if (partName === "flatjoin") {
                return new FlatJoin(this.machine, prop);
            }
            if (partName === "split") {
                return new Split(this.machine, prop);
            }
            if (partName === "forwardSplit") {
                return new ForwardSplit(this.machine, prop);
            }
            if (partName === "controler") {
                return new Controler(this.machine, prop);
            }
            if (partName === "elevator" || partName.startsWith("elevator-")) {
                let argStr = partName.split("-")[1];
                if (argStr) {
                    let h = parseInt(argStr);
                    prop.h = h;
                }
                return new Elevator(this.machine, prop);
            }
            if (partName === "shooter" || partName.startsWith("shooter-")) {
                let argStr = partName.split("-")[1];
                if (argStr) {
                    let h = parseInt(argStr.split(".")[0]);
                    let n = parseInt(argStr.split(".")[1]);
                    prop.h = h;
                    prop.n = n;
                }
                return new Shooter(this.machine, prop);
            }
            if (partName === "stairway" || partName.startsWith("stairway-")) {
                let argStr = partName.split("-")[1];
                if (argStr) {
                    let w = parseInt(argStr.split(".")[0]);
                    let h = parseInt(argStr.split(".")[1]);
                    prop.w = w;
                    prop.h = h;
                }
                return new Stairway(this.machine, prop);
            }
            if (partName === "screw" || partName.startsWith("screw-")) {
                let argStr = partName.split("-")[1];
                if (argStr) {
                    let w = parseInt(argStr.split(".")[0]);
                    let h = parseInt(argStr.split(".")[1]);
                    prop.w = w;
                    prop.h = h;
                }
                return new Screw(this.machine, prop);
            }
            if (partName === "quarter") {
                return new QuarterNote(this.machine, prop);
            }
            if (partName === "double") {
                return new DoubleNote(this.machine, prop);
            }
            if (partName === "screen") {
                return new Screen(this.machine, prop);
            }
            if (partName === "speeder") {
                return new Speeder(this.machine, prop);
            }
        }

        public createTrackBaseName(baseName: string, prop: IMachinePartProp): MachinePart {
            if (baseName === "ramp") {
                return new Ramp(this.machine, prop);
            }
            if (baseName === "wave") {
                return new Wave(this.machine, prop);
            }
            if (baseName === "snake") {
                return new Snake(this.machine, prop);
            }
            if (baseName === "uturn") {
                return new UTurn(this.machine, prop);
            }
            if (baseName === "wall") {
                return new Wall(this.machine, prop);
            }
            if (baseName === "uturnsharp") {
                return new UTurnSharp(this.machine, prop);
            }
            if (baseName === "start") {
                return new Start(this.machine, prop);
            }
            if (baseName === "end") {
                return new End(this.machine, prop);
            }
            if (baseName === "jumper") {
                return new Jumper(this.machine, prop);
            }
            if (baseName === "gravitywell") {
                return new GravityWell(this.machine, prop);
            }
            if (baseName === "loop") {
                return new Loop(this.machine, prop);
            }
            if (baseName === "spiral") {
                return new Spiral(this.machine, prop);
            }
            if (baseName === "spiralUTurn") {
                return new SpiralUTurn(this.machine, prop);
            }
            if (baseName === "join") {
                return new Join(this.machine, prop);
            }
            if (baseName === "flatjoin") {
                return new FlatJoin(this.machine, prop);
            }
            if (baseName === "split") {
                return new Split(this.machine, prop);
            }
            if (baseName === "forwardSplit") {
                return new ForwardSplit(this.machine, prop);
            }
            if (baseName === "controler") {
                return new Controler(this.machine, prop);
            }
            if (baseName === "elevator") {
                return new Elevator(this.machine, prop);
            }
            if (baseName === "shooter") {
                return new Shooter(this.machine, prop);
            }
            if (baseName === "stairway") {
                return new Stairway(this.machine, prop);
            }
            if (baseName === "screw") {
                return new Screw(this.machine, prop);
            }
            if (baseName === "quarter") {
                return new QuarterNote(this.machine, prop);
            }
            if (baseName === "double") {
                return new DoubleNote(this.machine, prop);
            }
            if (baseName === "screen") {
                return new Screen(this.machine, prop);
            }
            if (baseName === "speeder") {
                return new Speeder(this.machine, prop);
            }
        }
    }
}
