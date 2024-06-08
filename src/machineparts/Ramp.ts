namespace MarbleRunSimulatorCore {
    export abstract class MachinePartWithOriginDestination extends MachinePart {
        
        public abstract recreateFromOriginDestination(origin: Nabu.IJK, dest: Nabu.IJK, machine: Machine): MachinePartWithOriginDestination;

        public getOrigin(): Nabu.IJK {
            let i = this.i;
            let j: number;
            if (this.mirrorX) {
                j = this.j + this.h;
            } else {
                j = this.j;
            }
            let k: number;
            if (this.mirrorZ) {
                if (this.mirrorX) {
                    k = this.k;
                } else {
                    k = this.k + this.d - 1;
                }
            } else {
                if (this.mirrorX) {
                    k = this.k + this.d - 1;
                } else {
                    k = this.k;
                }
            }
            return {
                i: i,
                j: j,
                k: k,
            };
        }

        public getDestination(): Nabu.IJK {
            let i = this.i + this.w;
            let j: number;
            if (!this.mirrorX) {
                j = this.j + this.h;
            } else {
                j = this.j;
            }
            let k: number;
            if (this.mirrorZ) {
                if (this.mirrorX) {
                    k = this.k + this.d - 1;
                } else {
                    k = this.k;
                }
            } else {
                if (this.mirrorX) {
                    k = this.k;
                } else {
                    k = this.k + this.d - 1;
                }
            }
            return {
                i: i,
                j: j,
                k: k,
            };
        }
    }

    export class Ramp extends MachinePartWithOriginDestination {
        constructor(machine: Machine, prop: IMachinePartProp) {
            super(machine, prop);

            let partName = "ramp-" + prop.w.toFixed(0) + "." + prop.h.toFixed(0) + "." + prop.d.toFixed(0);
            this.setTemplate(this.machine.templateManager.getTemplate(partName, prop.mirrorX, prop.mirrorZ));
            this.generateWires();
        }

        public static GenerateTemplate(w: number = 1, h: number = 1, d: number = 1, mirrorX?: boolean, mirrorZ?: boolean): MachinePartTemplate {
            let template = new MachinePartTemplate();

            template.partName = "ramp-" + w.toFixed(0) + "." + h.toFixed(0) + "." + d.toFixed(0);

            template.w = w;
            template.h = h;
            template.d = d;
            template.xExtendable = true;
            template.yExtendable = true;
            template.zExtendable = true;
            template.mirrorX = mirrorX;
            template.mirrorZ = mirrorZ;

            let dir = new BABYLON.Vector3(1, 0, 0);
            dir.normalize();
            let n = new BABYLON.Vector3(0, 1, 0);
            n.normalize();

            let xCenter = (- tileWidth * 0.5 + tileWidth * (template.w - 0.5)) * 0.5;
            let zCenter = (0 - tileDepth * (template.d - 1)) * 0.5;
            let widthInM = tileWidth * template.w;
            let depthInM = tileDepth * (template.d - 1);
            let radius = Math.min(widthInM, depthInM) * 0.5; 
            let r2 = radius / Math.SQRT2 * 1.0;
            let r12 = radius - r2;

            template.trackTemplates[0] = new TrackTemplate(template);
            if (radius === 0 || widthInM > depthInM * 1.5) {
                template.trackTemplates[0].trackpoints = [
                    new TrackPoint(template.trackTemplates[0], new BABYLON.Vector3(-tileWidth * 0.5, 0, 0), dir),
                    new TrackPoint(template.trackTemplates[0], new BABYLON.Vector3(tileWidth * (template.w - 0.5), -tileHeight * template.h, -tileDepth * (template.d - 1)), dir)
                ];
            }
            else {
                if (widthInM > depthInM) {
                    template.trackTemplates[0].trackpoints = [
                        new TrackPoint(template.trackTemplates[0], new BABYLON.Vector3(-tileWidth * 0.5, 0, 0), dir),
                        new TrackPoint(template.trackTemplates[0], new BABYLON.Vector3(xCenter - radius, 0, 0), dir),
                        new TrackPoint(template.trackTemplates[0], new BABYLON.Vector3(xCenter - r12, 0, zCenter + r2)),
                        new TrackPoint(template.trackTemplates[0], new BABYLON.Vector3(xCenter, 0, zCenter), new BABYLON.Vector3(0, 0, -1)),
                        new TrackPoint(template.trackTemplates[0], new BABYLON.Vector3(xCenter + r12, 0, zCenter - r2)),
                        new TrackPoint(template.trackTemplates[0], new BABYLON.Vector3(xCenter + radius, 0, -tileDepth * (template.d - 1)), dir),
                        new TrackPoint(template.trackTemplates[0], new BABYLON.Vector3(tileWidth * (template.w - 0.5), -tileHeight * template.h, -tileDepth * (template.d - 1)), dir),
                    ];
                }
                else if (widthInM < depthInM) {
                    template.trackTemplates[0].trackpoints = [
                        new TrackPoint(template.trackTemplates[0], new BABYLON.Vector3(-tileWidth * 0.5, 0, 0), dir),
                        new TrackPoint(template.trackTemplates[0], new BABYLON.Vector3(-tileWidth * 0.5 + r2, 0, -r12)),
                        new TrackPoint(template.trackTemplates[0], new BABYLON.Vector3(xCenter, 0, - radius), new BABYLON.Vector3(0, 0, -1)),
                        new TrackPoint(template.trackTemplates[0], new BABYLON.Vector3(xCenter, 0, -tileDepth * (template.d - 1) + radius), new BABYLON.Vector3(0, 0, -1)),
                        new TrackPoint(template.trackTemplates[0], new BABYLON.Vector3(tileWidth * (template.w - 0.5) - r2, 0, -tileDepth * (template.d - 1) + r12)),
                        new TrackPoint(template.trackTemplates[0], new BABYLON.Vector3(tileWidth * (template.w - 0.5), -tileHeight * template.h, -tileDepth * (template.d - 1)), dir),
                    ];
                }
                else {
                    template.trackTemplates[0].trackpoints = [
                        new TrackPoint(template.trackTemplates[0], new BABYLON.Vector3(-tileWidth * 0.5, 0, 0), dir),
                        new TrackPoint(template.trackTemplates[0], new BABYLON.Vector3(-tileWidth * 0.5 + r2, 0, -r12)),
                        new TrackPoint(template.trackTemplates[0], new BABYLON.Vector3(xCenter, 0, zCenter), new BABYLON.Vector3(0, 0, -1)),
                        new TrackPoint(template.trackTemplates[0], new BABYLON.Vector3(tileWidth * (template.w - 0.5) - r2, 0, -tileDepth * (template.d - 1) + r12)),
                        new TrackPoint(template.trackTemplates[0], new BABYLON.Vector3(tileWidth * (template.w - 0.5), -tileHeight * template.h, -tileDepth * (template.d - 1)), dir),
                    ];
                }

                let tmpDir = new BABYLON.Vector3(widthInM * 0.5, 0, 0);
                let tmpStart = template.trackTemplates[0].trackpoints[0].position.clone();
                let tmpEnd = template.trackTemplates[0].trackpoints[template.trackTemplates[0].trackpoints.length - 1].position.clone();
                tmpStart.z = 0;
                tmpEnd.z = 0;
                for (let n = 1; n < template.trackTemplates[0].trackpoints.length - 1; n++) {
                    let trackpoint = template.trackTemplates[0].trackpoints[n];
                    let dx = (trackpoint.position.x - (-tileWidth * 0.5)) / widthInM;

                    let tmpPoint = BABYLON.Vector3.Hermite(tmpStart, tmpDir, tmpEnd, tmpDir, dx);
                    trackpoint.position.y = tmpPoint.y;
                }
            }

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
            if (origin.i > dest.i) {
                let tmp = origin;
                origin = dest;
                dest = tmp;
            }
            let i = Math.min(origin.i, dest.i);
            let j = Math.min(origin.j, dest.j);
            let k = Math.min(origin.k, dest.k);
            let w = dest.i - origin.i;
            let h = Math.abs(dest.j - origin.j);
            let d = Math.abs(dest.k - origin.k) + 1;
            let mirrorX = dest.j < origin.j;
            let mirrorZ = false;
            if (mirrorX) {
                if (origin.k < dest.k) {
                    mirrorZ = true;
                }
            } else {
                if (origin.k > dest.k) {
                    mirrorZ = true;
                }
            }
            if (!this.getIsNaNOrValidWHD(w, h, d)) {
                return undefined;
            }
            return new Ramp(machine, {
                i: i,
                j: j,
                k: k,
                w: w,
                h: h,
                d: d,
                c: this.colors,
                mirrorX: mirrorX,
                mirrorZ: mirrorZ,
            });
        }
    }
}
