namespace MarbleRunSimulatorCore {
    export class UTurn extends MachinePartWithOriginDestination {
        constructor(machine: Machine, prop: IMachinePartProp) {
            super(machine, prop);
            
            let partName = (prop.pipeVersion ? "pipe" : "") + (prop.woodVersion ? "wood" : "") + "uturn-" + prop.h.toFixed(0) + "." + prop.d.toFixed(0);
            if (!prop.pipeVersion && !prop.woodVersion) {
                partName += "." + prop.s.toFixed(0);
            }
            this.setTemplate(this.machine.templateManager.getTemplate(partName, prop.mirrorX, prop.mirrorZ));
            this.generateWires();
        }

        public static GenerateTemplate(h: number, d: number, s: number, mirrorX?: boolean, mirrorZ?: boolean, pipeVersion?: boolean, woodVersion?: boolean): MachinePartTemplate {
            let template = new MachinePartTemplate();
            template.getWidthForDepth = (argD) => {
                if (argD >= 8) {
                    return argD - 2;
                }
                return argD - 1;
            }

            template.partName = (pipeVersion ? "pipe" : "") + (woodVersion ? "wood" : "") + "uturn-" + h.toFixed(0) + "." + d.toFixed(0);
            if (!pipeVersion && !woodVersion) {
                template.partName += "." + s.toFixed(0)
            }
            template.angleSmoothSteps = 50;

            template.w = template.getWidthForDepth(d);
            template.h = h;
            template.d = d;
            template.s = s;
            template.mirrorX = mirrorX; 
            template.mirrorZ = mirrorZ;

            template.yExtendable = true;
            template.zExtendable = true;
            if (!pipeVersion) {
                template.sExtendable = true;
            }
            template.minD = 2;
            template.xMirrorable = true;
            template.zMirrorable = true;

            let dir = new BABYLON.Vector3(1, 0, 0);
            dir.normalize();
            let n = new BABYLON.Vector3(0, 1, 0);
            n.normalize();

            let r = tileDepth * (d - 1) * 0.5;
            let x0 = -tileWidth * 0.5 + (2 * Math.PI * r) / 6;
            let r2 = r / Math.SQRT2;
            template.trackTemplates[0] = new TrackTemplate(template);
            template.trackTemplates[0].isPipe = pipeVersion;
            template.trackTemplates[0].isWood = woodVersion;
            template.trackTemplates[0].trackpoints = [
                new TrackPoint(template.trackTemplates[0], new BABYLON.Vector3(-tileWidth * 0.5, 0, 0), new BABYLON.Vector3(1, 0, 0)),
                new TrackPoint(template.trackTemplates[0], new BABYLON.Vector3(x0 + 0, 0, 0)),
                new TrackPoint(template.trackTemplates[0], new BABYLON.Vector3(x0 + r2, 0, -r + r2)),
                new TrackPoint(template.trackTemplates[0], new BABYLON.Vector3(x0 + r, 0, -r)),
                new TrackPoint(template.trackTemplates[0], new BABYLON.Vector3(x0 + r2, 0, -r - r2)),
                new TrackPoint(template.trackTemplates[0], new BABYLON.Vector3(x0 + 0, 0, -2 * r)),
                new TrackPoint(template.trackTemplates[0], new BABYLON.Vector3(-tileWidth * 0.5, 0, -2 * r), new BABYLON.Vector3(-1, 0, 0)),
            ];
            template.maxAngle = Math.PI / 4 / 2 * template.s;

            let hermite = (x: number) => {
                return (3 * Math.pow(2 * x, 2) - Math.pow(2 * x, 3)) / 4;
            }
            let summedLength = [0];
            let trackpoints = template.trackTemplates[0].trackpoints;
            for (let n = 1; n < trackpoints.length; n++) {
                summedLength[n] = summedLength[n - 1] + BABYLON.Vector3.Distance(trackpoints[n].position, trackpoints[n - 1].position);
            }
            let totalLength = summedLength[summedLength.length - 1];

            for (let n = 0; n < template.trackTemplates[0].trackpoints.length; n++) {
                let f = summedLength[n] / totalLength;
                f = hermite(f);
                template.trackTemplates[0].trackpoints[n].position.y = - f * template.h * tileHeight;
            }

            let tp1 = trackpoints[1];
            let dir1 = trackpoints[2].position.subtract(trackpoints[1].position);
            dir1.normalize();
            let a = Mummu.AngleFromToAround(dir1, BABYLON.Axis.X, BABYLON.Axis.Y);
            Mummu.RotateInPlace(dir1, BABYLON.Axis.Y, a);
            tp1.setDir(dir1);

            let tp2 = trackpoints[trackpoints.length - 2];
            let dir2 = trackpoints[trackpoints.length - 2].position.subtract(trackpoints[trackpoints.length - 3].position);
            dir2.normalize();
            a = Mummu.AngleFromToAround(dir2, BABYLON.Axis.X.scale(-1), BABYLON.Axis.Y);
            Mummu.RotateInPlace(dir2, BABYLON.Axis.Y, a);
            tp2.setDir(dir2);

            if (mirrorX) {
                template.mirrorXTrackPointsInPlace();
            }
            if (mirrorZ) {
                template.mirrorZTrackPointsInPlace();
            }

            template.initialize();

            return template;
        }

        public recreateFromOriginDestination(origin: Nabu.IJK, dest: Nabu.IJK, machine: Machine): Ramp {
            let j = Math.min(origin.j, dest.j);
            let k = Math.min(origin.k, dest.k);
            let h = Math.abs(dest.j - origin.j);
            h = Nabu.MinMax(h, this.minH, this.maxH);
            let d = Math.abs(dest.k - origin.k) + 1;
            d = Nabu.MinMax(d, this.minD, this.maxD);
            let mirrorX = this.mirrorX;
            let mirrorZ = false;
            if (origin.j > dest.j) {
                mirrorZ = true;
            }
            let i = Math.min(origin.i, dest.i);
            if (this.mirrorX) {
                i -= this.template.getWidthForDepth(d);
            }
            if (!this.getIsNaNOrValidWHD(undefined, h, d)) {
                return undefined;
            }
            return new UTurn(machine, {
                i: i,
                j: j,
                k: k,
                h: h,
                d: d,
                s: this.s,
                c: this.colors,
                mirrorX: mirrorX,
                mirrorZ: mirrorZ,
                pipeVersion: this.tracks[0].template.isPipe,
                woodVersion: this.tracks[0].template.isWood
            });
        }

        public getOrigin(): Nabu.IJK {
            let i: number;
            if (this.mirrorX) {
                i = this.i + this.w;
            } else {
                i = this.i;
            }

            let j: number;
            if (this.mirrorZ) {
                j = this.j + this.h;
            } else {
                j = this.j;
            }

            let k = this.k;
            return {
                i: i,
                j: j,
                k: k,
            };
        }

        public getDestination(): Nabu.IJK {
            let i: number;
            if (this.mirrorX) {
                i = this.i + this.w;
            } else {
                i = this.i;
            }

            let j: number;
            if (this.mirrorZ) {
                j = this.j;
            } else {
                j = this.j + this.h;
            }

            let k = this.k + this.d - 1;
            return {
                i: i,
                j: j,
                k: k,
            };
        }
    }
}
