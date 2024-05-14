namespace MarbleRunSimulatorCore {
    export class Snake extends MachinePartWithOriginDestination {
        constructor(machine: Machine, prop: IMachinePartProp) {
            super(machine, prop);

            prop.w = Math.max(prop.w, 2);

            let partName = "snake-" + prop.w.toFixed(0) + "." + prop.h.toFixed(0) + "." + prop.d.toFixed(0);
            this.setTemplate(this.machine.templateManager.getTemplate(partName, prop.mirrorX, prop.mirrorZ));
            this.generateWires();
        }

        public static GenerateTemplate(w: number = 1, h: number = 1, d: number = 1, mirrorX?: boolean, mirrorZ?: boolean): MachinePartTemplate {
            let template = new MachinePartTemplate();

            template.partName = "snake-" + w.toFixed(0) + "." + h.toFixed(0) + "." + d.toFixed(0);
            template.angleSmoothSteps = 40;
            template.maxAngle = Math.PI / 7;

            template.w = w;
            template.h = h;
            template.d = d;
            template.mirrorX = mirrorX;
            template.mirrorZ = mirrorZ;

            template.xExtendable = true;
            template.yExtendable = true;
            template.zExtendable = true;
            template.xMirrorable = true;
            template.zMirrorable = true;

            let dir = new BABYLON.Vector3(1, 0, 0);
            dir.normalize();
            let n = new BABYLON.Vector3(0, 1, 0);
            n.normalize();

            let count = 3 * template.w;
            if (count % 2 === 1) {
                count--;
            }
            let l = tileWidth * template.w;
            let r = l / count;
            let r2 = r / Math.SQRT2 * 1.0;
            let r12 = r - r2;

            template.trackTemplates[0] = new TrackTemplate(template);

            let start = new BABYLON.Vector3(-tileWidth * 0.5, 0, 0);
            let end = new BABYLON.Vector3(tileWidth * (template.w - 0.5), 0, 0);
            let tanVector = dir.scale(BABYLON.Vector3.Distance(start, end));

            template.trackTemplates[0].trackpoints = [new TrackPoint(template.trackTemplates[0], start, dir, undefined, undefined, 1)];
            for (let i = 1; i < count; i++) {
                let x = - tileWidth * 0.5 + i * r;
                if (i === 1) {
                    let z = - r;
                    template.trackTemplates[0].trackpoints.push(new TrackPoint(template.trackTemplates[0], new BABYLON.Vector3(x - r12, 0, z + r2), new BABYLON.Vector3(1, 0, - 1)));
                    template.trackTemplates[0].trackpoints.push(new TrackPoint(template.trackTemplates[0], new BABYLON.Vector3(x, 0, z), new BABYLON.Vector3(0, 0, - 1)));
                    template.trackTemplates[0].trackpoints.push(new TrackPoint(template.trackTemplates[0], new BABYLON.Vector3(x + r12, 0, z - r2), new BABYLON.Vector3(1, 0, - 1)));
                }
                else if (i === count - 1) {
                    if (Math.floor(i / 2) % 2 === 0) {
                        let z = r;
                        template.trackTemplates[0].trackpoints.push(new TrackPoint(template.trackTemplates[0], new BABYLON.Vector3(x, 0, z), new BABYLON.Vector3(0, 0, - 1)));
                        template.trackTemplates[0].trackpoints.push(new TrackPoint(template.trackTemplates[0], new BABYLON.Vector3(x + r12, 0, z - r2), new BABYLON.Vector3(1, 0, - 1)));
                    }
                    else {
                        let z = - r;
                        template.trackTemplates[0].trackpoints.push(new TrackPoint(template.trackTemplates[0], new BABYLON.Vector3(x, 0, z), new BABYLON.Vector3(0, 0, 1)));
                        template.trackTemplates[0].trackpoints.push(new TrackPoint(template.trackTemplates[0], new BABYLON.Vector3(x + r12, 0, z + r2), new BABYLON.Vector3(1, 0, 1)));
                    }
                }
                else if (i % 2 === 0) {
                    if (Math.floor(i / 2) % 2 === 0) {
                        let z = 2 * r;
                        template.trackTemplates[0].trackpoints.push(new TrackPoint(template.trackTemplates[0], new BABYLON.Vector3(x, 0, z), new BABYLON.Vector3(1, 0, 0)));
                        template.trackTemplates[0].trackpoints.push(new TrackPoint(template.trackTemplates[0], new BABYLON.Vector3(x + r2, 0, z - r12), new BABYLON.Vector3(1, 0, -1)));
                    }
                    else {
                        let z = - 2 * r;
                        template.trackTemplates[0].trackpoints.push(new TrackPoint(template.trackTemplates[0], new BABYLON.Vector3(x, 0, z), new BABYLON.Vector3(1, 0, 0)));
                        template.trackTemplates[0].trackpoints.push(new TrackPoint(template.trackTemplates[0], new BABYLON.Vector3(x + r2, 0, z + r12), new BABYLON.Vector3(1, 0, 1)));
                    }
                }
                else {
                    if (Math.floor(i / 2) % 2 === 0) {
                        let z = r;
                        template.trackTemplates[0].trackpoints.push(new TrackPoint(template.trackTemplates[0], new BABYLON.Vector3(x, 0, z), new BABYLON.Vector3(0, 0, - 1)));
                        z = - r;
                        template.trackTemplates[0].trackpoints.push(new TrackPoint(template.trackTemplates[0], new BABYLON.Vector3(x, 0, z), new BABYLON.Vector3(0, 0, - 1)));
                        template.trackTemplates[0].trackpoints.push(new TrackPoint(template.trackTemplates[0], new BABYLON.Vector3(x + r12, 0, z - r2), new BABYLON.Vector3(1, 0, - 1)));
                    }
                    else {
                        let z = - r;
                        template.trackTemplates[0].trackpoints.push(new TrackPoint(template.trackTemplates[0], new BABYLON.Vector3(x, 0, z), new BABYLON.Vector3(0, 0, 1)));
                        z = r;
                        template.trackTemplates[0].trackpoints.push(new TrackPoint(template.trackTemplates[0], new BABYLON.Vector3(x, 0, z), new BABYLON.Vector3(0, 0, 1)));
                        template.trackTemplates[0].trackpoints.push(new TrackPoint(template.trackTemplates[0], new BABYLON.Vector3(x + r12, 0, z + r2), new BABYLON.Vector3(1, 0, 1)));
                    }
                }
            }
            template.trackTemplates[0].trackpoints.push(new TrackPoint(template.trackTemplates[0], end, dir, undefined, 1));

            if (mirrorX) {
                template.mirrorXTrackPointsInPlace();
            }
            if (mirrorZ) {
                template.mirrorZTrackPointsInPlace();
            }

            template.initialize();

            return template;
        }

        public recreateFromOriginDestination(origin: Nabu.IJK, dest: Nabu.IJK, machine: Machine): Snake {
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
            return new Snake(machine, {
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
