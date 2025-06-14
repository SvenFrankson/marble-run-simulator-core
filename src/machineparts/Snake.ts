namespace MarbleRunSimulatorCore {
    export class Snake extends MachinePart {
        constructor(machine: Machine, prop: IMachinePartProp) {
            super(machine, prop);

            prop.l = Math.max(prop.l, 2);

            this.setTemplate(this.machine.templateManager.getTemplate(Snake.PropToPartName(prop)));
            this.generateWires();
        }

        public static PropToPartName(prop: IMachinePartProp): string {
            let partName = "snake_" + prop.l.toFixed(0) + "." + prop.s.toFixed(0);
            return partName;
        }

        public static GenerateTemplate(l: number, s: number): MachinePartTemplate {
            let template = new MachinePartTemplate();

            template.partName = "snake_" + l.toFixed(0) + "." + s.toFixed(0);
            template.angleSmoothSteps = 40;

            template.l = l;
            template.h = 0;
            template.d = 3;
            template.s = s;

            template.lExtendableOnX = true;
            template.minL = 5;
            template.sExtendable = true;

            let dir = new BABYLON.Vector3(1, 0, 0);
            dir.normalize();
            let n = new BABYLON.Vector3(0, 1, 0);
            n.normalize();

            let count = template.l - 3;
            if (count % 2 === 1) {
                count--;
            }
            let length = tileSize * template.l;
            let r = length / count;
            let r2 = r / Math.SQRT2 * 1.0;
            let r12 = r - r2;
            let z0 = 0;

            template.trackTemplates[0] = new TrackTemplate(template);

            let start = new BABYLON.Vector3(-tileSize * 0.5, 0, z0);
            let end = new BABYLON.Vector3(tileSize * (template.l - 0.5), 0, z0);

            template.trackTemplates[0].trackpoints = [new TrackPoint(template.trackTemplates[0], start, dir, undefined, undefined, 1)];
            for (let i = 1; i < count; i++) {
                let x = - tileSize * 0.5 + i * r;
                if (i === 1) {
                    let z = z0 - r;
                    template.trackTemplates[0].trackpoints.push(new TrackPoint(template.trackTemplates[0], new BABYLON.Vector3(x - r12, 0, z + r2), new BABYLON.Vector3(1, 0, - 1)));
                    template.trackTemplates[0].trackpoints.push(new TrackPoint(template.trackTemplates[0], new BABYLON.Vector3(x, 0, z), new BABYLON.Vector3(0, 0, - 1)));
                    template.trackTemplates[0].trackpoints.push(new TrackPoint(template.trackTemplates[0], new BABYLON.Vector3(x + r12, 0, z - r2), new BABYLON.Vector3(1, 0, - 1)));
                }
                else if (i === count - 1) {
                    if (Math.floor(i / 2) % 2 === 0) {
                        let z = z0 + r;
                        template.trackTemplates[0].trackpoints.push(new TrackPoint(template.trackTemplates[0], new BABYLON.Vector3(x, 0, z), new BABYLON.Vector3(0, 0, - 1)));
                        template.trackTemplates[0].trackpoints.push(new TrackPoint(template.trackTemplates[0], new BABYLON.Vector3(x + r12, 0, z - r2), new BABYLON.Vector3(1, 0, - 1)));
                    }
                    else {
                        let z = z0 - r;
                        template.trackTemplates[0].trackpoints.push(new TrackPoint(template.trackTemplates[0], new BABYLON.Vector3(x, 0, z), new BABYLON.Vector3(0, 0, 1)));
                        template.trackTemplates[0].trackpoints.push(new TrackPoint(template.trackTemplates[0], new BABYLON.Vector3(x + r12, 0, z + r2), new BABYLON.Vector3(1, 0, 1)));
                    }
                }
                else if (i % 2 === 0) {
                    if (Math.floor(i / 2) % 2 === 0) {
                        let z = z0 + 2 * r;
                        template.trackTemplates[0].trackpoints.push(new TrackPoint(template.trackTemplates[0], new BABYLON.Vector3(x, 0, z), new BABYLON.Vector3(1, 0, 0)));
                        template.trackTemplates[0].trackpoints.push(new TrackPoint(template.trackTemplates[0], new BABYLON.Vector3(x + r2, 0, z - r12), new BABYLON.Vector3(1, 0, -1)));
                    }
                    else {
                        let z = z0 - 2 * r;
                        template.trackTemplates[0].trackpoints.push(new TrackPoint(template.trackTemplates[0], new BABYLON.Vector3(x, 0, z), new BABYLON.Vector3(1, 0, 0)));
                        template.trackTemplates[0].trackpoints.push(new TrackPoint(template.trackTemplates[0], new BABYLON.Vector3(x + r2, 0, z + r12), new BABYLON.Vector3(1, 0, 1)));
                    }
                }
                else {
                    if (Math.floor(i / 2) % 2 === 0) {
                        let z = z0 + r;
                        template.trackTemplates[0].trackpoints.push(new TrackPoint(template.trackTemplates[0], new BABYLON.Vector3(x, 0, z), new BABYLON.Vector3(0, 0, - 1)));
                        z = z0 - r;
                        template.trackTemplates[0].trackpoints.push(new TrackPoint(template.trackTemplates[0], new BABYLON.Vector3(x, 0, z), new BABYLON.Vector3(0, 0, - 1)));
                        template.trackTemplates[0].trackpoints.push(new TrackPoint(template.trackTemplates[0], new BABYLON.Vector3(x + r12, 0, z - r2), new BABYLON.Vector3(1, 0, - 1)));
                    }
                    else {
                        let z = z0 - r;
                        template.trackTemplates[0].trackpoints.push(new TrackPoint(template.trackTemplates[0], new BABYLON.Vector3(x, 0, z), new BABYLON.Vector3(0, 0, 1)));
                        z = z0 + r;
                        template.trackTemplates[0].trackpoints.push(new TrackPoint(template.trackTemplates[0], new BABYLON.Vector3(x, 0, z), new BABYLON.Vector3(0, 0, 1)));
                        template.trackTemplates[0].trackpoints.push(new TrackPoint(template.trackTemplates[0], new BABYLON.Vector3(x + r12, 0, z + r2), new BABYLON.Vector3(1, 0, 1)));
                    }
                }
            }
            template.trackTemplates[0].trackpoints.push(new TrackPoint(template.trackTemplates[0], end, dir, undefined, 1));
            template.maxAngle = Math.PI / 4 / 2 * template.s;

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
                l: w,
                h: h,
                d: d,
                c: this.colors,
                mirrorX: mirrorX,
                mirrorZ: mirrorZ,
            });
        }
    }
}
