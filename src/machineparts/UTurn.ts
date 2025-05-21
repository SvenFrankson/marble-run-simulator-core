namespace MarbleRunSimulatorCore {
    export class UTurn extends MachinePart {
        constructor(machine: Machine, prop: IMachinePartProp) {
            super(machine, prop);
            
            this.setTemplate(this.machine.templateManager.getTemplate(UTurn.PropToPartName(prop)));
            this.generateWires();
        }

        public static PropToPartName(prop: IMachinePartProp): string {
            let partName = (prop.pipeVersion ? "pipe" : "") + (prop.woodVersion ? "wood" : "") + "uturn_" + prop.l.toFixed(0) + "." + prop.h.toFixed(0);
            if (!prop.pipeVersion && !prop.woodVersion) {
                partName += "." + prop.s.toFixed(0);
            }
            return partName;
        }

        public static GenerateTemplate(l: number, h: number, s: number, pipeVersion?: boolean, woodVersion?: boolean): MachinePartTemplate {
            let template = new MachinePartTemplate();

            template.partName = (pipeVersion ? "pipe" : "") + (woodVersion ? "wood" : "") + "uturn_" + l.toFixed(0) + "." + h.toFixed(0);
            if (!pipeVersion && !woodVersion) {
                template.partName += "." + s.toFixed(0)
            }

            template.l = l;
            template.h = h;
            template.s = s;

            template.lExtendableOnZ = true;
            template.hExtendableOnY = true;
            if (!pipeVersion) {
                template.sExtendable = true;
            }
            template.minH = -32;
            template.maxH = 32;
            template.minD = 2;

            let dir = new BABYLON.Vector3(1, 0, 0);
            dir.normalize();
            let n = new BABYLON.Vector3(0, 1, 0);
            n.normalize();

            let dZ = 0;

            let r = tileSize * l * 0.5;
            let r2 = r / Math.SQRT2;

            template.trackTemplates[0] = new TrackTemplate(template);
            template.trackTemplates[0].isPipe = pipeVersion;
            template.trackTemplates[0].isWood = woodVersion;
            template.trackTemplates[0].trackpoints = []
            template.trackTemplates[0].trackpoints.push(
                new TrackPoint(template.trackTemplates[0], new BABYLON.Vector3(-tileSize * 0.5 + 0, 0, dZ), new BABYLON.Vector3(1, 0, 0)),
                new TrackPoint(template.trackTemplates[0], new BABYLON.Vector3(-tileSize * 0.5 + r2, 0, r - r2)),
                new TrackPoint(template.trackTemplates[0], new BABYLON.Vector3(-tileSize * 0.5 + r, 0, r)),
                new TrackPoint(template.trackTemplates[0], new BABYLON.Vector3(-tileSize * 0.5 + r2, 0, r + r2)),
                new TrackPoint(template.trackTemplates[0], new BABYLON.Vector3(-tileSize * 0.5 + 0, 0, 2 * r - dZ), new BABYLON.Vector3(- 1, 0, 0))
            );
            template.defaultAngle = Math.PI / 4 / 4 * template.s;
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
                template.trackTemplates[0].trackpoints[n].position.y = f * template.h * tileHeight;
            }

            template.initialize();

            return template;
        }
    }
}
