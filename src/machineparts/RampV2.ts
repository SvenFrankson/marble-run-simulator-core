namespace MarbleRunSimulatorCore {
    
    export class RampV2 extends MachinePart {
        constructor(machine: Machine, prop: IMachinePartProp) {
            super(machine, prop);
            
            this.setTemplate(this.machine.templateManager.getTemplate(RampV2.PropToPartName(prop)));
            this.generateWires();
        }

        public static PropToPartName(prop: IMachinePartProp): string {
            return (prop.pipeVersion ? "pipe" : "") + (prop.woodVersion ? "wood" : "") + "rampv2_" + prop.l.toFixed(0) + "." + prop.h.toFixed(0) + "." + prop.d.toFixed(0);
        }

        public static GenerateTemplate(l: number, h: number, d: number, pipeVersion?: boolean, woodVersion?: boolean): MachinePartTemplate {
            let template = new MachinePartTemplate();

            template.partName = (pipeVersion ? "pipe" : "") + (woodVersion ? "wood" : "") + "rampv2_" + l.toFixed(0) + "." + h.toFixed(0) + "." + d.toFixed(0);

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
            template.trackTemplates[0].isPipe = pipeVersion;
            template.trackTemplates[0].isWood = woodVersion;

            template.trackTemplates[0].trackpoints = [
                new TrackPoint(template.trackTemplates[0], new BABYLON.Vector3(- tileSize * 0.5, 0, 0), dir),
                new TrackPoint(template.trackTemplates[0], new BABYLON.Vector3(tileSize * template.l - tileSize * 0.5, tileSize * template.h, tileSize * template.d), dir)
            ];

            template.maxAngle = Math.PI / 4 / 2 * template.s;

            template.initialize();

            return template;
        }
    }
}
