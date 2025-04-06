namespace MarbleRunSimulatorCore {
    export class Wave extends MachinePartWithOriginDestination {
        constructor(machine: Machine, prop: IMachinePartProp) {
            super(machine, prop);

            this.setTemplate(this.machine.templateManager.getTemplate(Wave.PropToPartName(prop)));
            this.generateWires();
        }

        public static PropToPartName(prop: IMachinePartProp): string {
            let partName = "wave_" + prop.l.toFixed(0) + "." + prop.h.toFixed(0) + "." + prop.d.toFixed(0);
            return partName;
        }

        public static GenerateTemplate(l: number, h: number, d: number): MachinePartTemplate {
            let template = new MachinePartTemplate();

            template.partName = "wave_" + l.toFixed(0) + "." + h.toFixed(0) + "." + d.toFixed(0);

            template.l = l;
            template.h = h;
            template.d = d;
            template.lExtendableOnX = true;
            template.hExtendableOnY = true;
            template.dExtendableOnZ = true;
            template.minH = -32;
            template.maxH = 32;
            template.minD = -32;
            template.maxD = 32;

            let dir = new BABYLON.Vector3(1, 0, 0);
            dir.normalize();
            let n = new BABYLON.Vector3(0, 1, 0);
            n.normalize();

            template.trackTemplates[0] = new TrackTemplate(template);

            let start = new BABYLON.Vector3(- tileSize * 0.5, 0, 0);
            let end = new BABYLON.Vector3(tileSize * (template.l - 0.5), -tileHeight * template.h, - tileSize * template.d);
            let tanVector = dir.scale(BABYLON.Vector3.Distance(start, end));

            template.trackTemplates[0].trackpoints = [new TrackPoint(template.trackTemplates[0], start, dir, undefined, undefined, 1)];
            for (let i = 1; i < (l / 3 + 1); i++) {
                let p1 = BABYLON.Vector3.Hermite(start, tanVector, end, tanVector, i / (l / 3 + 1));
                if (i % 2 === 1) {
                    p1.y -= 0.008;
                } else {
                    p1.y += 0.008;
                }
                template.trackTemplates[0].trackpoints.push(new TrackPoint(template.trackTemplates[0], p1));
            }
            template.trackTemplates[0].trackpoints.push(new TrackPoint(template.trackTemplates[0], end, dir, undefined, 1));

            template.initialize();

            return template;
        }

        public recreateFromOriginDestination(origin: Nabu.IJK, dest: Nabu.IJK, machine: Machine): Wave {
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
            return new Wave(machine, {
                i: i,
                j: j,
                k: k,
                l: w,
                h: h,
                d: d,
                c: this.colors,
                mirrorX: mirrorX,
                mirrorZ: mirrorZ,
                pipeVersion: this.tracks[0].template.isPipe
            });
        }
    }
}
