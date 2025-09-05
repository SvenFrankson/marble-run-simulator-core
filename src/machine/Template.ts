namespace MarbleRunSimulatorCore {

    export enum TrackSpeed {
        Flat = 0,
        Slow = 1,
        Medium = 2,
        Fast = 3
    }

    export var TrackSpeedNames = [
        "Flat",
        "Slow",
        "Medium",
        "Fast"
    ];

    export class TrackTemplate {
        public trackpoints: TrackPoint[] = ([] = []);
        public interpolatedPoints: BABYLON.Vector3[] = [];
        public interpolatedNormals: BABYLON.Vector3[] = [];
        public angles: number[] = [];

        public drawStartTip: boolean = false;
        public drawEndTip: boolean = false;

        public forcedAngle: number;
        public preferedStartBank: number = 0;
        public preferedEndBank: number = 0;
        public cutOutSleeper: (n: number) => boolean;

        public colorIndex: number = 0;
        public isPipe: boolean = false;
        public isWood: boolean = false;
        public get isPipeOrWood(): boolean {
            return this.isPipe || this.isWood;
        }

        public summedLength: number[] = [0];
        public totalLength: number = 0;
        public globalSlope: number = 0;
        public AABBMin: BABYLON.Vector3 = BABYLON.Vector3.Zero();
        public AABBMax: BABYLON.Vector3 = BABYLON.Vector3.Zero();

        public noMiniatureRender: boolean = false;

        constructor(public partTemplate: MachinePartTemplate) {}

        public mirrorXTrackPointsInPlace(): void {
            for (let i = 0; i < this.trackpoints.length; i++) {
                this.trackpoints[i].position.x *= -1;
                this.trackpoints[i].position.x += (this.partTemplate.l - 1) * tileWidth;
                if (this.trackpoints[i].normal) {
                    this.trackpoints[i].normal.x *= -1;
                }
                if (this.trackpoints[i].dir) {
                    this.trackpoints[i].dir.x *= -1;
                }
            }
        }

        public mirrorZTrackPointsInPlace(): void {
            for (let i = 0; i < this.trackpoints.length; i++) {
                this.trackpoints[i].position.z += (this.partTemplate.d - 1) * tileDepth * 0.5;
                this.trackpoints[i].position.z *= -1;
                this.trackpoints[i].position.z -= (this.partTemplate.d - 1) * tileDepth * 0.5;
                if (this.trackpoints[i].normal) {
                    this.trackpoints[i].normal.z *= -1;
                }
                if (this.trackpoints[i].dir) {
                    this.trackpoints[i].dir.z *= -1;
                }
            }
        }

        public onNormalEvaluated: (n: BABYLON.Vector3, p?: BABYLON.Vector3, relativeIndex?: number) => void;
        public initialize(): void {
            if (this.trackpoints[0] && this.trackpoints[this.trackpoints.length - 1]) {
                let start = this.trackpoints[0].position;
                if (Tools.IsWorldPosAConnexion(start)) {
                    this.partTemplate.endPoints.push(start.clone());
                    this.partTemplate.endPointDirections.push(this.trackpoints[0].dir);
                }
                let end = this.trackpoints[this.trackpoints.length - 1].position;
                if (Tools.IsWorldPosAConnexion(end)) {
                    this.partTemplate.endPoints.push(end.clone());
                    this.partTemplate.endPointDirections.push(this.trackpoints[this.trackpoints.length - 1].dir.scale(-1));
                }
            }
            for (let i = 1; i < this.trackpoints.length - 1; i++) {
                let prevTrackPoint = this.trackpoints[i - 1];
                let trackPoint = this.trackpoints[i];
                let nextTrackPoint = this.trackpoints[i + 1];

                if (!trackPoint.fixedDir) {
                    trackPoint.dir.copyFrom(nextTrackPoint.position).subtractInPlace(prevTrackPoint.position).normalize();
                }
                if (!trackPoint.fixedTangentIn) {
                    trackPoint.tangentIn = 1;
                }
                if (!trackPoint.fixedTangentOut) {
                    trackPoint.tangentOut = 1;
                }
            }

            this.trackpoints[0].summedLength = 0;
            for (let i = 0; i < this.trackpoints.length - 1; i++) {
                let trackPoint = this.trackpoints[i];
                let nextTrackPoint = this.trackpoints[i + 1];
                let dist = BABYLON.Vector3.Distance(trackPoint.position, nextTrackPoint.position);
                let tanIn = this.trackpoints[i].dir.scale(dist * trackPoint.tangentOut);
                let tanOut = this.trackpoints[i + 1].dir.scale(dist * nextTrackPoint.tangentIn);
                let count = Math.round(dist / 0.002);
                count = Math.max(0, count);
                this.interpolatedPoints.push(trackPoint.position);
                nextTrackPoint.summedLength = trackPoint.summedLength;
                for (let k = 1; k < count; k++) {
                    let amount = k / count;
                    let point = BABYLON.Vector3.Hermite(trackPoint.position, tanIn, nextTrackPoint.position, tanOut, amount);
                    this.interpolatedPoints.push(point);
                    nextTrackPoint.summedLength += BABYLON.Vector3.Distance(this.interpolatedPoints[this.interpolatedPoints.length - 2], this.interpolatedPoints[this.interpolatedPoints.length - 1]);
                }
                nextTrackPoint.summedLength += BABYLON.Vector3.Distance(nextTrackPoint.position, this.interpolatedPoints[this.interpolatedPoints.length - 1]);
            }

            this.interpolatedPoints.push(this.trackpoints[this.trackpoints.length - 1].position);

            let N = this.interpolatedPoints.length;

            let normalsForward: BABYLON.Vector3[] = [];
            let normalsBackward: BABYLON.Vector3[] = [];
            normalsForward.push(this.trackpoints[0].normal);
            for (let i = 1; i < this.interpolatedPoints.length - 1; i++) {
                let prevNormal = normalsForward[i - 1];
                let point = this.interpolatedPoints[i];
                let nextPoint = this.interpolatedPoints[i + 1];
                let dir = nextPoint.subtract(point).normalize();
                let n = prevNormal;
                let right = BABYLON.Vector3.Cross(n, dir);
                n = BABYLON.Vector3.Cross(dir, right).normalize();
                if (this.onNormalEvaluated) {
                    this.onNormalEvaluated(n, point, i / (this.interpolatedPoints.length - 1));
                }
                normalsForward.push(n);
            }
            normalsForward.push(this.trackpoints[this.trackpoints.length - 1].normal);

            normalsBackward[this.interpolatedPoints.length - 1] = this.trackpoints[this.trackpoints.length - 1].normal;
            for (let i = this.interpolatedPoints.length - 2; i >= 1; i--) {
                let prevNormal = normalsBackward[i + 1];
                let point = this.interpolatedPoints[i];
                let prevPoint = this.interpolatedPoints[i - 1];
                let dir = prevPoint.subtract(point).normalize();
                let n = prevNormal;
                let right = BABYLON.Vector3.Cross(n, dir);
                n = BABYLON.Vector3.Cross(dir, right).normalize();
                if (this.onNormalEvaluated) {
                    this.onNormalEvaluated(n, point, i / (this.interpolatedPoints.length - 1));
                }
                normalsBackward[i] = n;
            }
            normalsBackward[0] = this.trackpoints[0].normal;

            for (let i = 0; i < N; i++) {
                let f = i / (N - 1);
                this.interpolatedNormals[i] = BABYLON.Vector3.Lerp(normalsForward[i], normalsBackward[i], f).normalize();
            }

            this.angles = new Array<number>(N);
            if (isFinite(this.forcedAngle)) {
                this.angles.fill(this.forcedAngle);
            }
            else {
                this.angles.fill(0);
                let maxR = 0;
                let lastSign = 0;
                for (let i = 1; i < N - 1; i++) {
                    let n = this.interpolatedNormals[i];
    
                    let prevPoint = this.interpolatedPoints[i - 1];
                    let point = this.interpolatedPoints[i];
                    let nextPoint = this.interpolatedPoints[i + 1];
    
                    let dirPrev: BABYLON.Vector3 = point.subtract(prevPoint);
                    let dPrev: number = dirPrev.length();
    
                    let dirNext: BABYLON.Vector3 = nextPoint.subtract(point);
                    let dNext: number = dirNext.length();
    
                    let a = Mummu.AngleFromToAround(dirPrev.scale(-1), dirNext, n);
                    if (Math.abs(a) < Math.PI * 0.9999999) {
                        let sign = Math.sign(a);
                        lastSign += sign / 10;
                        lastSign = Nabu.MinMax(lastSign, -1, 1);
    
                        let rPrev = Math.tan(Math.abs(a) / 2) * (dPrev * 0.5);
                        let rNext = Math.tan(Math.abs(a) / 2) * (dNext * 0.5);
                        let r = (rPrev + rNext) * 0.5;
                        maxR = Math.max(r, maxR);
    
                        let f = this.partTemplate.minTurnRadius / r;
                        f = Math.max(Math.min(f, 1), 0);
                        this.angles[i] = Math.max(this.partTemplate.maxAngle * f, this.partTemplate.defaultAngle) * sign;
    
                        if (Math.abs(lastSign) >= 1) {
                            if (i > 0 && this.angles[i - 1] === undefined) {
                                for (let ii = i; ii >= 0; ii--) {
                                    if (this.angles[ii] === undefined) {
                                        this.angles[ii] = this.partTemplate.defaultAngle * lastSign;
                                    }
                                }
                            }
                        }
                    }
                    else {
                        if (Math.abs(lastSign) >= 1) {
                            this.angles[i] = this.partTemplate.defaultAngle * lastSign;
                        }
                        else {
                            this.angles[i] = undefined;
                        }
                    }
                }
            }

            this.angles = this.angles.map(a => {
                if (a === undefined) {
                    return 0;
                }
                return a;
            })

            let tmpAngles = [...this.angles];
            let f = 1;
            for (let n = 0; n < 30; n++) {
                for (let i = 0; i < N; i++) {
                    let aPrev = tmpAngles[i - 1];
                    let a = tmpAngles[i];
                    let point = this.interpolatedPoints[i];
                    let aNext = tmpAngles[i + 1];

                    if (isFinite(aPrev) && isFinite(aNext)) {
                        let prevPoint = this.interpolatedPoints[i - 1];
                        let distPrev = BABYLON.Vector3.Distance(prevPoint, point);

                        let nextPoint = this.interpolatedPoints[i + 1];
                        let distNext = BABYLON.Vector3.Distance(nextPoint, point);

                        let d = distPrev / (distPrev + distNext);

                        tmpAngles[i] = (1 - f) * a + f * ((1 - d) * aPrev + d * aNext);
                    }
                    else if (isFinite(aPrev)) {
                        tmpAngles[i] = (1 - f) * a + f * aPrev;
                    }
                    else if (isFinite(aNext)) {
                        tmpAngles[i] = (1 - f) * a + f * aNext;
                    }
                }
            }
            this.angles = tmpAngles;

            this.angles[0] = this.angles[1];
            this.angles[N - 1] = this.angles[N - 2];

            this.preferedStartBank = this.angles[0];
            this.preferedEndBank = this.angles[this.angles.length - 1];

            this.summedLength = [0];
            this.totalLength = 0;
            for (let i = 0; i < N - 1; i++) {
                let p = this.interpolatedPoints[i];
                let pNext = this.interpolatedPoints[i + 1];
                let dir = pNext.subtract(p);
                let d = dir.length();
                dir.scaleInPlace(1 / d);
                let right = BABYLON.Vector3.Cross(this.interpolatedNormals[i], dir);
                this.interpolatedNormals[i] = BABYLON.Vector3.Cross(dir, right).normalize();
                this.summedLength[i + 1] = this.summedLength[i] + d;
            }
            this.totalLength = this.summedLength[N - 1];

            let dh = this.interpolatedPoints[this.interpolatedPoints.length - 1].y - this.interpolatedPoints[0].y;
            this.globalSlope = (dh / this.totalLength) * 100;
        }
    }

    export class MachinePartTemplate {
        public partName: string = "machine-part-template";

        public l: number = 1;
        public h: number = 1;
        public d: number = 1;
        public n: number = 1;
        public s: number = TrackSpeed.Medium;
        public mirrorX: boolean = false;
        public mirrorZ: boolean = false;
        public angleSmoothSteps: number = 30;
        public defaultAngle: number = 0;
        public maxAngle: number = Math.PI / 4;
        public minTurnRadius: number = 0.06;

        public lExtendableOnX: boolean = false;
        public lExtendableOnXZ: boolean = false;
        public lExtendableOnZ: boolean = false;
        public hExtendableOnY: boolean = false;
        public dExtendableOnZ: boolean = false;

        public xExtendable: boolean = false;
        public yExtendable: boolean = false;
        public downwardYExtendable: boolean = false;
        public zExtendable: boolean = false;
        public nExtendable: boolean = false;
        public sExtendable: boolean = false;
        public minLAbsolute: number = 0;
        public minL: number = 1;
        public maxL: number = 64;
        public minH: number = 0;
        public maxH: number = 35;
        public minDAbsolute: number = 0;
        public minD: number = 0;
        public maxD: number = 64;
        public minN: number = 1;
        public maxN: number = 35;
        public minS: number = 0;
        public maxS: number = 3;
        public xMirrorable: boolean = false;
        public zMirrorable: boolean = false;
        public hasOriginDestinationHandles: boolean = false;
        public getWidthForDepth: (d: number) => number;
        public getWidthForHeight: (h: number) => number;
        public getDepthForWidth: (d: number) => number;

        public trackTemplates: TrackTemplate[] = [];

        public endPoints: BABYLON.Vector3[] = [];
        public endPointDirections: BABYLON.Vector3[] = [];

        public miniatureExtraLines: MiniatureTrack[] = [];
        public miniatureShapes: MiniatureShape[] = [];

        public mirrorXTrackPointsInPlace(): void {
            for (let i = 0; i < this.trackTemplates.length; i++) {
                this.trackTemplates[i].mirrorXTrackPointsInPlace();
            }
        }

        public mirrorZTrackPointsInPlace(): void {
            for (let i = 0; i < this.trackTemplates.length; i++) {
                this.trackTemplates[i].mirrorZTrackPointsInPlace();
            }
        }

        public initialize(): void {
            this.trackTemplates.forEach((trackTemplate) => {
                trackTemplate.initialize();
            });
        }
    }

    export class TemplateManager {
        private _dictionary: Map<string, MachinePartTemplate[]> = new Map<string, MachinePartTemplate[]>();

        constructor(public machine: Machine) {}

        public getTemplate(partName: string, mirrorX?: boolean, mirrorZ?: boolean): MachinePartTemplate {
            let mirrorIndex = (mirrorX ? 0 : 1) + (mirrorZ ? 0 : 2);
            let data: MachinePartTemplate;
            let datas = this._dictionary.get(partName);
            if (datas && datas[mirrorIndex]) {
                data = datas[mirrorIndex];
            } else {
                if (!datas) {
                    datas = [];
                }
                this._dictionary.set(partName, datas);
            }

            if (!data) {
                if (partName.startsWith("curb_")) {
                    let l = parseInt(partName.split("_")[1].split(".")[0]);
                    let h = parseInt(partName.split("_")[1].split(".")[1]);
                    let s = parseInt(partName.split("_")[1].split(".")[2]);
                    if (isNaN(s)) {
                        s = 2;
                    }
                    data = Curb.GenerateTemplate(l, h, s, false, false);
                }
                else if (partName.startsWith("uturn_")) {
                    let l = parseInt(partName.split("_")[1].split(".")[0]);
                    let h = parseInt(partName.split("_")[1].split(".")[1]);
                    let s = parseInt(partName.split("_")[1].split(".")[2]);
                    if (isNaN(s)) {
                        s = 2;
                    }
                    data = UTurn.GenerateTemplate(l, h, s);
                }
                else if (partName.startsWith("pipeuturn_")) {
                    let l = parseInt(partName.split("_")[1].split(".")[0]);
                    let h = parseInt(partName.split("_")[1].split(".")[1]);
                    data = UTurn.GenerateTemplate(l, h, 2, true);
                }
                else if (partName.startsWith("wooduturn_")) {
                    let l = parseInt(partName.split("_")[1].split(".")[0]);
                    let h = parseInt(partName.split("_")[1].split(".")[1]);
                    data = UTurn.GenerateTemplate(l, h, 0, false, true);
                }
                else if (partName.startsWith("wall_")) {
                    let l = parseInt(partName.split("_")[1].split(".")[0]);
                    let h = parseInt(partName.split("_")[1].split(".")[1]);
                    data = Wall.GenerateTemplate(l, h);
                }
                else if (partName.startsWith("uturnsharp")) {
                    let h = parseInt(partName.split("_")[1].split(".")[0]);
                    data = UTurnSharp.GenerateTemplate(h);
                }
                else if (partName.startsWith("ramp_")) {
                    let w = parseInt(partName.split("_")[1].split(".")[0]);
                    let h = parseInt(partName.split("_")[1].split(".")[1]);
                    let d = parseInt(partName.split("_")[1].split(".")[2]);
                    let s = parseInt(partName.split("_")[1].split(".")[3]);
                    if (isNaN(s)) {
                        s = 2;
                    }
                    data = Ramp.GenerateTemplate(w, h, isFinite(d) ? d : 1, s, mirrorX, mirrorZ);
                }
                else if (partName.startsWith("rampv2_")) {
                    let l = parseInt(partName.split("_")[1].split(".")[0]);
                    let h = parseInt(partName.split("_")[1].split(".")[1]);
                    let d = parseInt(partName.split("_")[1].split(".")[2]);
                    data = Ramp.GenerateTemplate(l, h, d, 2, false, false);
                }
                else if (partName.startsWith("piperamp_")) {
                    let w = parseInt(partName.split("_")[1].split(".")[0]);
                    let h = parseInt(partName.split("_")[1].split(".")[1]);
                    let d = parseInt(partName.split("_")[1].split(".")[2]);
                    data = Ramp.GenerateTemplate(w, h, isFinite(d) ? d : 1, 0, true);
                }
                else if (partName.startsWith("woodramp_")) {
                    let w = parseInt(partName.split("_")[1].split(".")[0]);
                    let h = parseInt(partName.split("_")[1].split(".")[1]);
                    let d = parseInt(partName.split("_")[1].split(".")[2]);
                    data = Ramp.GenerateTemplate(w, h, isFinite(d) ? d : 1, 0, false, true);
                }
                else if (partName.startsWith("wave_")) {
                    let w = parseInt(partName.split("_")[1].split(".")[0]);
                    let h = parseInt(partName.split("_")[1].split(".")[1]);
                    let d = parseInt(partName.split("_")[1].split(".")[2]);
                    data = Wave.GenerateTemplate(w, h, isFinite(d) ? d : 0);
                }
                else if (partName.startsWith("snake_")) {
                    let w = parseInt(partName.split("_")[1].split(".")[0]);
                    let s = parseInt(partName.split("_")[1].split(".")[1]);
                    if (isNaN(s)) {
                        s = 2;
                    }
                    data = Snake.GenerateTemplate(w, s);
                }
                else if (partName.startsWith("elevator_")) {
                    let h = parseInt(partName.split("_")[1]);
                    data = Elevator.GenerateTemplate(h);
                }
                else if (partName.startsWith("steamelevator_")) {
                    let h = parseInt(partName.split("_")[1]);
                    data = SteamElevator.GenerateTemplate(h, mirrorX);
                }
                else if (partName.startsWith("shooter_")) {
                    let h = parseInt(partName.split("_")[1].split(".")[0]);
                    let n = parseInt(partName.split("_")[1].split(".")[1]);
                    data = Shooter.GenerateTemplate(h, n);
                }
                else if (partName.startsWith("stairway_")) {
                    let w = parseInt(partName.split("_")[1].split(".")[0]);
                    let h = parseInt(partName.split("_")[1].split(".")[1]);
                    data = Stairway.GenerateTemplate(w, h);
                }
                else if (partName.startsWith("screw_")) {
                    let w = parseInt(partName.split("_")[1].split(".")[0]);
                    let h = parseInt(partName.split("_")[1].split(".")[1]);
                    data = Screw.GenerateTemplate(w, h);
                }
                else if (partName === "split") {
                    data = Split.GenerateTemplate(mirrorZ);
                }
                else if (partName === "forwardSplit") {
                    data = ForwardSplit.GenerateTemplate(mirrorZ);
                }
                else if (partName === "sort") {
                    data = Sort.GenerateTemplate(mirrorX, mirrorZ);
                }
                else if (partName === "controlerLegacy") {
                    data = Controler_Legacy.GenerateTemplate(mirrorX);
                }
                else if (partName === "controler") {
                    data = Controler.GenerateTemplate(mirrorX);
                }
                else if (partName === "spawner") {
                    data = Spawner.GenerateTemplate(mirrorX);
                }
                else if (partName === "flatjoin") {
                    data = FlatJoin.GenerateTemplate();
                }
                else if (partName === "join") {
                    data = Join.GenerateTemplate();
                }
                else if (partName.startsWith("multiJoin_")) {
                    let l = parseInt(partName.split("_")[1].split(".")[0]);
                    data = MultiJoin.GenerateTemplate(l, mirrorX);
                }
                else if (partName.startsWith("loop_")) {
                    let l = parseInt(partName.split("_")[1].split(".")[0]);
                    let d = parseInt(partName.split("_")[1].split(".")[1]);
                    let n = parseInt(partName.split("_")[1].split(".")[2]);
                    data = Loop.GenerateTemplate(l, d, n);
                }
                else if (partName.startsWith("spiral_")) {
                    let l = parseInt(partName.split("_")[1].split(".")[0]);
                    let h = parseInt(partName.split("_")[1].split(".")[1]);
                    data = Spiral.GenerateTemplate(l, h);
                }
                else if (partName.startsWith("spiralUTurn_")) {
                    let l = parseInt(partName.split("_")[1].split(".")[0]);
                    let h = parseInt(partName.split("_")[1].split(".")[1]);
                    data = SpiralUTurn.GenerateTemplate(l, h);
                }
                else if (partName === "quarter") {
                    data = QuarterNote.GenerateTemplate(mirrorX);
                }
                else if (partName === "double") {
                    data = DoubleNote.GenerateTemplate(mirrorX);
                }
                else if (partName === "start") {
                    data = Start.GenerateTemplate();
                }
                else if (partName === "end") {
                    data = End.GenerateTemplate(mirrorX);
                }
                else if (partName.startsWith("jumper_")) {
                    let n = parseInt(partName.split("_")[1].split(".")[0]);
                    data = Jumper.GenerateTemplate(n);
                }
                else if (partName === "gravitywell") {
                    data = GravityWell.GenerateTemplate(mirrorX);
                }
                else if (partName === "screen") {
                    data = Screen.GenerateTemplate();
                }
                else if (partName === "speeder" || partName.startsWith("speeder_")) {
                    let l = 3;
                    if (partName.indexOf("_") != - 1) {
                        let lValue = parseInt(partName.split("_")[1].split(".")[0]);
                        if (isFinite(lValue)) {
                            l = lValue;
                        }
                    }
                    data = Speeder.GenerateTemplate(l);
                }
                else if (partName === "trikeSkull") {
                    data = TrikeSkull.GenerateTemplate();
                }
                else if (partName.startsWith("ladder_")) {
                    let l = parseInt(partName.split("_")[1].split(".")[0]);
                    let h = parseInt(partName.split("_")[1].split(".")[1]);
                    data = Ladder.GenerateTemplate(l, h);
                }
                else if (partName.startsWith("teardropTurn_")) {
                    let h = parseInt(partName.split("_")[1].split(".")[0]);
                    data = TeardropTurn.GenerateTemplate(h);
                }
                datas[mirrorIndex] = data;
            }

            return data;
        }

        public getTemplateByProp(baseName: string, prop: IMachinePartProp): MachinePartTemplate {
            let partName: string = "";

            if (baseName === "curb") {
                partName = Curb.PropToPartName(prop);
            }
            else if (baseName === "uturn") {
                partName = UTurn.PropToPartName(prop);
            }
            else if (baseName === "pipeuturn") {
                partName = UTurn.PropToPartName(prop);
            }
            else if (baseName === "wooduturn") {
                partName = UTurn.PropToPartName(prop);
            }
            else if (baseName === "wall") {
                partName = Wall.PropToPartName(prop);
            }
            else if (baseName === "uturnsharp") {
                partName = UTurnSharp.PropToPartName(prop);
            }
            else if (baseName === "ramp") {
                partName = Ramp.PropToPartName(prop);
            }
            else if (baseName === "rampv2") {
                partName = Ramp.PropToPartName(prop);
            }
            else if (baseName === "piperamp") {
                partName = Ramp.PropToPartName(prop);
            }
            else if (baseName === "woodramp") {
                partName = Ramp.PropToPartName(prop);
            }
            else if (baseName === "wave") {
                partName = Wave.PropToPartName(prop);
            }
            else if (baseName === "snake") {
                partName = Snake.PropToPartName(prop);
            }
            else if (baseName === "elevator") {
                partName = Elevator.PropToPartName(prop);
            }
            else if (baseName === "steamelevator") {
                partName = SteamElevator.PropToPartName(prop);
            }
            else if (baseName === "shooter") {
                partName = Shooter.PropToPartName(prop);
            }
            else if (baseName === "stairway") {
                partName = Stairway.PropToPartName(prop);
            }
            else if (baseName === "screw") {
                partName = Screw.PropToPartName(prop);
            }
            else if (baseName === "split") {
                partName = Split.PropToPartName(prop);
            }
            else if (baseName === "forwardSplit") {
                partName = ForwardSplit.PropToPartName(prop);
            }
            else if (baseName === "sort") {
                partName = Sort.PropToPartName(prop);
            }
            else if (baseName === "controlerLegacy") {
                partName = Controler_Legacy.PropToPartName(prop);
            }
            else if (baseName === "controler") {
                partName = Controler.PropToPartName(prop);
            }
            else if (baseName === "spawner") {
                partName = Spawner.PropToPartName(prop);
            }
            else if (baseName === "flatjoin") {
                partName = FlatJoin.PropToPartName(prop);
            }
            else if (baseName === "join") {
                partName = Join.PropToPartName(prop);
            }
            else if (baseName === "multiJoin") {
                partName = MultiJoin.PropToPartName(prop);
            }
            else if (baseName === "loop") {
                partName = Loop.PropToPartName(prop);
            }
            else if (baseName === "spiral") {
                partName = Spiral.PropToPartName(prop);
            }
            else if (baseName === "spiralUTurn") {
                partName = SpiralUTurn.PropToPartName(prop);
            }
            else if (baseName === "quarter") {
                partName = QuarterNote.PropToPartName(prop);
            }
            else if (baseName === "double") {
                partName = DoubleNote.PropToPartName(prop);
            }
            else if (baseName === "start") {
                partName = Start.PropToPartName(prop);
            }
            else if (baseName === "end") {
                partName = End.PropToPartName(prop);
            }
            else if (baseName === "jumper") {
                partName = Jumper.PropToPartName(prop);
            }
            else if (baseName === "gravitywell") {
                partName = GravityWell.PropToPartName(prop);
            }
            else if (baseName === "screen") {
                partName = Screen.PropToPartName(prop);
            }
            else if (baseName === "speeder") {
                partName = Speeder.PropToPartName(prop);
            }
            else if (baseName === "trikeSkull") {
                partName = TrikeSkull.PropToPartName(prop);
            }
            else if (baseName === "ladder") {
                partName = Ladder.PropToPartName(prop);
            }
            else if (baseName === "teardropTurn") {
                partName = TeardropTurn.PropToPartName(prop);
            }

            if (partName) {
                return this.getTemplate(partName, prop.mirrorX, prop.mirrorZ);
            }
        }
    }
}
