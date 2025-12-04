namespace MarbleRunSimulatorCore {

    // Caution, order is important. Do not rearrange.
    export var TrackNames = [
        "ramp",
        "wave",
        "snake",
        "join",
        "flatjoin",
        "split",
        "uturn",
        "wall",
        "uturnsharp",
        "loop",
        "spiral",
        "elevator",
        "stairway",
        "screw",
        "start",
        "end",
        "jumper",
        "gravitywell",
        "shooter",
        "controlerLegacy",
        "screen",
        "speeder",
        "forwardSplit",
        "spiralUTurn",
        "piperamp",
        "pipeuturn",
        "steamelevator",
        "sort",
        "spawner",
        "woodramp",
        "wooduturn",
        "uturnv2",
        "curb",
        "rampv2",
        "multiJoin",
        "trikeSkull",
        "controler",
        "ladder",
        "teardropTurn",
        "tsplit",
        "tjoin",
        "cross2d",
        "bitsplit",
        "dropside",
        "dropback",
        "pipecurb",
        "pipeuturnsharp",
        "pipeloop",
        "pipeunderloop",
        "coil",
        "blackboard",
        "diamond",
        "bumper",
        "endbasket",
        "box"
    ];

    export interface IMachinePartProp {
        fullPartName?: string;
        i?: number;
        j?: number;
        k?: number;
        r?: number;
        l?: number;
        h?: number;
        d?: number;
        n?: number;
        s?: number;
        c?: number[];
        mirrorX?: boolean;
        mirrorZ?: boolean;
        pipeVersion?: boolean;
        woodVersion?: boolean;
    }

    export class MachinePartFactory {
        constructor(public machine: Machine) {}

        public createTrackWHDN(trackname: string, props?: IMachinePartProp): MachinePart {
            if (!props) {
                props = {};
            }
            props.fullPartName = trackname; // hacky but work

            trackname = trackname.split("_")[0];

            return this.createTrack(trackname, props);
        }

        public createTrack(partName: string, prop: IMachinePartProp): MachinePart {
            if (partName.indexOf("_X") != -1) {
                prop.mirrorX = true;
                partName = partName.replace("_X", "");
            }
            if (partName.indexOf("_Z") != -1) {
                prop.mirrorZ = true;
                partName = partName.replace("_Z", "");
            }

            if (partName === "ramp" || partName.startsWith("ramp_")) {
                let argStr = partName.split("_")[1];
                if (argStr) {
                    let w = parseInt(argStr.split(".")[0]);
                    let h = parseInt(argStr.split(".")[1]);
                    let d = parseInt(argStr.split(".")[2]);
                    let s = parseInt(argStr.split(".")[3]);
                    prop.l = w;
                    prop.h = h;
                    prop.d = d;
                    if (isFinite(s)) {
                        prop.s = s;
                    }
                }
                if (isNaN(prop.s)) {
                    prop.s = TrackSpeed.Medium;
                }
                return new Ramp(this.machine, prop);
            }
            if (partName === "rampv2" || partName.startsWith("rampv2_")) {
                let argStr = partName.split("_")[1];
                if (argStr) {
                    let w = parseInt(argStr.split(".")[0]);
                    let h = parseInt(argStr.split(".")[1]);
                    let d = parseInt(argStr.split(".")[2]);
                    prop.l = w;
                    prop.h = h;
                    prop.d = d;
                }
                return new Ramp(this.machine, prop);
            }
            if (partName === "piperamp" || partName.startsWith("piperamp_")) {
                let argStr = partName.split("_")[1];
                if (argStr) {
                    let w = parseInt(argStr.split(".")[0]);
                    let h = parseInt(argStr.split(".")[1]);
                    let d = parseInt(argStr.split(".")[2]);
                    prop.l = w;
                    prop.h = h;
                    prop.d = d;
                }
                prop.pipeVersion = true;
                return new Ramp(this.machine, prop);
            }
            if (partName === "woodramp" || partName.startsWith("woodramp_")) {
                let argStr = partName.split("_")[1];
                if (argStr) {
                    let w = parseInt(argStr.split(".")[0]);
                    let h = parseInt(argStr.split(".")[1]);
                    let d = parseInt(argStr.split(".")[2]);
                    prop.l = w;
                    prop.h = h;
                    prop.d = d;
                }
                prop.woodVersion = true;
                return new Ramp(this.machine, prop);
            }
            if (partName === "wave" || partName.startsWith("wave_")) {
                let argStr = partName.split("_")[1];
                if (argStr) {
                    let w = parseInt(argStr.split(".")[0]);
                    let h = parseInt(argStr.split(".")[1]);
                    let d = parseInt(argStr.split(".")[2]);
                    prop.l = w;
                    prop.h = h;
                    prop.d = d;
                }
                return new Wave(this.machine, prop);
            }
            if (partName === "snake" || partName.startsWith("snake_")) {
                let argStr = partName.split("_")[1];
                if (argStr) {
                    let w = parseInt(argStr.split(".")[0]);
                    let s = parseInt(argStr.split(".")[1]);
                    prop.l = w;
                    if (isFinite(s)) {
                        prop.s = s;
                    }
                }
                return new Snake(this.machine, prop);
            }
            if (partName === "curb" || partName.startsWith("curb_")) {
                let argStr = partName.split("_")[1];
                if (argStr) {
                    let l = parseInt(argStr.split(".")[0]);
                    let h = parseInt(argStr.split(".")[1]);
                    let s = parseInt(argStr.split(".")[2]);
                    prop.l = l;
                    prop.h = h;
                    if (isFinite(s)) {
                        prop.s = s;
                    }
                }
                if (isNaN(prop.s)) {
                    prop.s = TrackSpeed.Medium;
                }
                return new Curb(this.machine, prop);
            }
            if (partName === "pipecurb" || partName.startsWith("pipecurb_")) {
                let argStr = partName.split("_")[1];
                if (argStr) {
                    let l = parseInt(argStr.split(".")[0]);
                    let h = parseInt(argStr.split(".")[1]);
                    prop.l = l;
                    prop.h = h;
                }
                prop.pipeVersion = true;
                return new Curb(this.machine, prop);
            }
            if (partName === "uturn" || partName.startsWith("uturn_")) {
                let argStr = partName.split("_")[1];
                if (argStr) {
                    let l = parseInt(argStr.split(".")[0]);
                    let h = parseInt(argStr.split(".")[1]);
                    let s = parseInt(argStr.split(".")[2]);
                    prop.l = l;
                    prop.h = h;
                    if (isFinite(s)) {
                        prop.s = s;
                    }
                }
                if (isNaN(prop.s)) {
                    prop.s = TrackSpeed.Medium;
                }
                return new UTurn(this.machine, prop);
            }
            if (partName === "uturnv2" || partName.startsWith("uturnv2_")) {
                let argStr = partName.split("_")[1];
                if (argStr) {
                    let l = parseInt(argStr.split(".")[0]);
                    let h = parseInt(argStr.split(".")[1]);
                    let s = parseInt(argStr.split(".")[2]);
                    prop.l = l;
                    prop.h = h;
                    if (isFinite(s)) {
                        prop.s = s;
                    }
                }
                if (isNaN(prop.s)) {
                    prop.s = TrackSpeed.Medium;
                }
                return new UTurnV2(this.machine, prop);
            }
            if (partName === "pipeuturn" || partName.startsWith("pipeuturn_")) {
                let argStr = partName.split("_")[1];
                if (argStr) {
                    let l = parseInt(argStr.split(".")[0]);
                    let h = parseInt(argStr.split(".")[1]);
                    prop.l = l;
                    prop.h = h;
                }
                prop.pipeVersion = true;
                return new UTurn(this.machine, prop);
            }
            if (partName === "wooduturn" || partName.startsWith("wooduturn_")) {
                let argStr = partName.split("_")[1];
                if (argStr) {
                    let l = parseInt(argStr.split(".")[0]);
                    let h = parseInt(argStr.split(".")[1]);
                    prop.l = l;
                    prop.h = h;
                }
                prop.woodVersion = true;
                return new UTurn(this.machine, prop);
            }
            if (partName === "wall" || partName.startsWith("wall_")) {
                let argStr = partName.split("_")[1];
                if (argStr) {
                    let l = parseInt(argStr.split(".")[0]);
                    let h = parseInt(argStr.split(".")[1]);
                    prop.l = l;
                    prop.h = h;
                }
                return new Wall(this.machine, prop);
            }
            if (partName === "uturnsharp" || partName.startsWith("uturnsharp_")) {
                let argStr = partName.split("_")[1];
                if (argStr) {
                    let h = parseInt(argStr.split(".")[0]);
                    prop.h = h;
                }
                return new UTurnSharp(this.machine, prop);
            }
            if (partName === "pipeuturnsharp" || partName.startsWith("pipeuturnsharp_")) {
                let argStr = partName.split("_")[1];
                if (argStr) {
                    let h = parseInt(argStr.split(".")[0]);
                    prop.h = h;
                }
                prop.pipeVersion = true;
                return new UTurnSharp(this.machine, prop);
            }
            if (partName === "start") {
                return new Start(this.machine, prop);
            }
            if (partName === "end") {
                return new End(this.machine, prop);
            }
            if (partName === "endbasket") {
                return new EndBasket(this.machine, prop);
            }
            if (partName === "blackboard" || partName.startsWith("blackboard_")) {
                let argStr = partName.split("_")[1];
                if (argStr) {
                    let l = parseInt(argStr.split(".")[0]);
                    prop.l = l;
                    let h = parseInt(argStr.split(".")[1]);
                    prop.h = h;
                    let n = parseInt(argStr.split(".")[2]);
                    prop.n = n;
                }
                return new BlackBoard(this.machine, prop);
            }
            if (partName === "jumper" || partName.startsWith("jumper_")) {
                let argStr = partName.split("_")[1];
                if (argStr) {
                    let n = parseInt(argStr.split(".")[0]);
                    prop.n = n;
                }
                return new Jumper(this.machine, prop);
            }
            if (partName === "gravitywell") {
                return new GravityWell(this.machine, prop);
            }
            if (partName === "loop" || partName.startsWith("loop_")) {
                let argStr = partName.split("_")[1];
                if (argStr) {
                    let w = parseInt(argStr.split(".")[0]);
                    let d = parseInt(argStr.split(".")[1]);
                    let n = parseInt(argStr.split(".")[2]);
                    prop.l = w;
                    prop.d = d;
                    prop.n = n;
                }
                return new Loop(this.machine, prop);
            }
            if (partName === "pipeloop" || partName.startsWith("pipeloop_")) {
                let argStr = partName.split("_")[1];
                if (argStr) {
                    let w = parseInt(argStr.split(".")[0]);
                    let d = parseInt(argStr.split(".")[1]);
                    let n = parseInt(argStr.split(".")[2]);
                    prop.l = w;
                    prop.d = d;
                    prop.n = n;
                }
                prop.pipeVersion = true;
                return new Loop(this.machine, prop);
            }
            if (partName === "pipeunderloop" || partName.startsWith("pipeunderloop_")) {
                let argStr = partName.split("_")[1];
                if (argStr) {
                    let w = parseInt(argStr.split(".")[0]);
                    let d = parseInt(argStr.split(".")[1]);
                    let n = parseInt(argStr.split(".")[2]);
                    prop.l = w;
                    prop.d = d;
                    prop.n = n;
                }
                prop.pipeVersion = true;
                return new Loop(this.machine, prop, true);
            }
            if (partName === "spiral" || partName.startsWith("spiral_")) {
                let argStr = partName.split("_")[1];
                if (argStr) {
                    let w = parseInt(argStr.split(".")[0]);
                    let h = parseInt(argStr.split(".")[1]);
                    prop.l = w;
                    prop.h = h;
                }
                return new Spiral(this.machine, prop);
            }
            if (partName === "spiralUTurn" || partName.startsWith("spiralUTurn_")) {
                let argStr = partName.split("_")[1];
                if (argStr) {
                    let l = parseInt(argStr.split(".")[0]);
                    let h = parseInt(argStr.split(".")[1]);
                    prop.l = l;
                    prop.h = h;
                }
                return new SpiralUTurn(this.machine, prop);
            }
            if (partName === "coil" || partName.startsWith("coil_")) {
                let argStr = partName.split("_")[1];
                if (argStr) {
                    let w = parseInt(argStr.split(".")[0]);
                    let h = parseInt(argStr.split(".")[1]);
                    prop.l = w;
                    prop.h = h;
                }
                return new Coil(this.machine, prop);
            }
            if (partName === "join") {
                return new Join(this.machine, prop);
            }
            if (partName === "flatjoin") {
                return new FlatJoin(this.machine, prop);
            }
            if (partName === "multiJoin" || partName.startsWith("multiJoin_")) {
                let argStr = partName.split("_")[1];
                if (argStr) {
                    let l = parseInt(argStr.split(".")[0]);
                    prop.l = l;
                }
                return new MultiJoin(this.machine, prop);
            }
            if (partName === "split") {
                return new Split(this.machine, prop);
            }
            if (partName === "forwardSplit") {
                return new ForwardSplit(this.machine, prop);
            }
            if (partName === "sort") {
                return new Sort(this.machine, prop);
            }
            if (partName === "controlerLegacy") {
                return new Controler_Legacy(this.machine, prop);
            }
            if (partName === "controler") {
                return new Controler(this.machine, prop);
            }
            if (partName === "spawner") {
                return new Spawner(this.machine, prop);
            }
            if (partName === "elevator" || partName.startsWith("elevator_")) {
                let argStr = partName.split("_")[1];
                if (argStr) {
                    let h = parseInt(argStr);
                    prop.h = h;
                }
                return new Elevator(this.machine, prop);
            }
            if (partName === "steamelevator" || partName.startsWith("steamelevator_")) {
                let argStr = partName.split("_")[1];
                if (argStr) {
                    let h = parseInt(argStr);
                    prop.h = h;
                }
                return new SteamElevator(this.machine, prop);
            }
            if (partName === "shooter" || partName.startsWith("shooter_")) {
                let argStr = partName.split("_")[1];
                if (argStr) {
                    let h = parseInt(argStr.split(".")[0]);
                    let n = parseInt(argStr.split(".")[1]);
                    prop.h = h;
                    prop.n = n;
                }
                return new Shooter(this.machine, prop);
            }
            if (partName === "stairway" || partName.startsWith("stairway_")) {
                let argStr = partName.split("_")[1];
                if (argStr) {
                    let w = parseInt(argStr.split(".")[0]);
                    let h = parseInt(argStr.split(".")[1]);
                    prop.l = w;
                    prop.h = h;
                }
                return new Stairway(this.machine, prop);
            }
            if (partName === "screw" || partName.startsWith("screw_")) {
                let argStr = partName.split("_")[1];
                if (argStr) {
                    let w = parseInt(argStr.split(".")[0]);
                    let h = parseInt(argStr.split(".")[1]);
                    prop.l = w;
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
            if (partName === "speeder" || partName.startsWith("speeder_")) {
                let argStr = partName.split("_")[1];
                if (argStr) {
                    let l = parseInt(argStr.split(".")[0]);
                    prop.l = l;
                }
                return new Speeder(this.machine, prop);
            }
            if (partName === "trikeSkull") {
                return new TrikeSkull(this.machine, prop);
            }
            if (partName === "ladder" || partName.startsWith("ladder_")) {
                let argStr = partName.split("_")[1];
                if (argStr) {
                    let l = parseInt(argStr.split(".")[0]);
                    let h = parseInt(argStr.split(".")[1]);
                    prop.l = l;
                    prop.h = h;
                }
                return new Ladder(this.machine, prop);
            }
            if (partName === "teardropTurn" || partName.startsWith("teardropTurn_")) {
                let argStr = partName.split("_")[1];
                if (argStr) {
                    let h = parseInt(argStr.split(".")[0]);
                    prop.h = h;
                }
                return new TeardropTurn(this.machine, prop);
            }
            if (partName === "tsplit") {
                return new TSplit(this.machine, prop);
            }
            if (partName === "tjoin") {
                return new TJoin(this.machine, prop);
            }
            if (partName === "cross2d") {
                return new Cross2D(this.machine, prop);
            }
            if (partName === "bitsplit") {
                return new BitSplit(this.machine, prop);
            }
            if (partName === "dropside" || partName.startsWith("dropside_")) {
                let argStr = partName.split("_")[1];
                if (argStr) {
                    let h = parseInt(argStr.split(".")[0]);
                    prop.h = h;
                }
                return new DropSide(this.machine, prop);
            }
            if (partName === "dropback" || partName.startsWith("dropback_")) {
                let argStr = partName.split("_")[1];
                if (argStr) {
                    let h = parseInt(argStr.split(".")[0]);
                    prop.h = h;
                }
                return new DropBack(this.machine, prop);
            }
            if (partName === "diamond" || partName.startsWith("diamond_")) {
                let argStr = partName.split("_")[1];
                if (argStr) {
                    let l = parseInt(argStr.split(".")[0]);
                    prop.l = l;
                }
                return new Diamond(this.machine, prop);
            }
            if (partName === "box" || partName.startsWith("box_")) {
                let argStr = partName.split("_")[1];
                if (argStr) {
                    let l = parseInt(argStr.split(".")[0]);
                    prop.l = l;
                    let h = parseInt(argStr.split(".")[1]);
                    prop.h = h;
                }
                return new Box(this.machine, prop);
            }
            if (partName === "bumper" || partName.startsWith("bumper_")) {
                let argStr = partName.split("_")[1];
                if (argStr) {
                    let l = parseInt(argStr.split(".")[0]);
                    prop.l = l;
                }
                return new Bumper(this.machine, prop);
            }
        }

        public createTrackBaseName(baseName: string, prop: IMachinePartProp): MachinePart {
            if (isNaN(prop.s)) {
                prop.s = TrackSpeed.Medium;
            }
            
            if (baseName === "ramp") {
                return new Ramp(this.machine, prop);
            }
            if (baseName === "rampv2") {
                return new Ramp(this.machine, prop);
            }
            if (baseName === "piperamp") {
                prop.pipeVersion = true;
                return new Ramp(this.machine, prop);
            }
            if (baseName === "woodramp") {
                prop.woodVersion = true;
                return new Ramp(this.machine, prop);
            }
            if (baseName === "wave") {
                return new Wave(this.machine, prop);
            }
            if (baseName === "snake") {
                return new Snake(this.machine, prop);
            }
            if (baseName === "curb") {
                return new Curb(this.machine, prop);
            }
            if (baseName === "pipecurb") {
                return new Curb(this.machine, prop);
            }
            if (baseName === "uturn") {
                return new UTurn(this.machine, prop);
            }
            if (baseName === "pipeuturn") {
                prop.pipeVersion = true;
                return new UTurn(this.machine, prop);
            }
            if (baseName === "wooduturn") {
                prop.woodVersion = true;
                return new UTurn(this.machine, prop);
            }
            if (baseName === "wall") {
                return new Wall(this.machine, prop);
            }
            if (baseName === "uturnsharp") {
                return new UTurnSharp(this.machine, prop);
            }
            if (baseName === "pipeuturnsharp") {
                prop.pipeVersion = true;
                return new UTurnSharp(this.machine, prop);
            }
            if (baseName === "start") {
                return new Start(this.machine, prop);
            }
            if (baseName === "end") {
                return new End(this.machine, prop);
            }
            if (baseName === "endbasket") {
                return new EndBasket(this.machine, prop);
            }
            if (baseName === "blackboard") {
                return new BlackBoard(this.machine, prop);
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
            if (baseName === "pipeloop") {
                prop.pipeVersion = true;
                return new Loop(this.machine, prop);
            }
            if (baseName === "pipeunderloop") {
                prop.pipeVersion = true;
                return new Loop(this.machine, prop, true);
            }
            if (baseName === "spiral") {
                return new Spiral(this.machine, prop);
            }
            if (baseName === "spiralUTurn") {
                return new SpiralUTurn(this.machine, prop);
            }
            if (baseName === "coil") {
                return new Coil(this.machine, prop);
            }
            if (baseName === "join") {
                return new Join(this.machine, prop);
            }
            if (baseName === "multiJoin") {
                return new MultiJoin(this.machine, prop);
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
            if (baseName === "sort") {
                return new Sort(this.machine, prop);
            }
            if (baseName === "controlerLegacy") {
                return new Controler_Legacy(this.machine, prop);
            }
            if (baseName === "controler") {
                return new Controler(this.machine, prop);
            }
            if (baseName === "spawner") {
                return new Spawner(this.machine, prop);
            }
            if (baseName === "elevator") {
                return new Elevator(this.machine, prop);
            }
            if (baseName === "steamelevator") {
                return new SteamElevator(this.machine, prop);
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
            if (baseName === "trikeSkull") {
                return new TrikeSkull(this.machine, prop);
            }
            if (baseName === "ladder") {
                return new Ladder(this.machine, prop);
            }
            if (baseName === "teardropTurn") {
                return new TeardropTurn(this.machine, prop);
            }
            if (baseName === "tsplit") {
                return new TSplit(this.machine, prop);
            }
            if (baseName === "tjoin") {
                return new TJoin(this.machine, prop);
            }
            if (baseName === "cross2d") {
                return new Cross2D(this.machine, prop);
            }
            if (baseName === "bitsplit") {
                return new BitSplit(this.machine, prop);
            }
            if (baseName === "dropside") {
                return new DropSide(this.machine, prop);
            }
            if (baseName === "dropback") {
                return new DropBack(this.machine, prop);
            }
            if (baseName === "diamond") {
                return new Diamond(this.machine, prop);
            }
            if (baseName === "box") {
                return new Box(this.machine, prop);
            }
            if (baseName === "bumper") {
                return new Bumper(this.machine, prop);
            }
        }
    }
}
