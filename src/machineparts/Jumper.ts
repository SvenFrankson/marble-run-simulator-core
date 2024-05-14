namespace MarbleRunSimulatorCore {
    export class Jumper extends MachinePart {
        constructor(machine: Machine, prop: IMachinePartProp) {
            super(machine, prop);

            let partName = "jumper-" + prop.n.toFixed(0);
            this.setTemplate(this.machine.templateManager.getTemplate(partName, prop.mirrorX));
            this.generateWires();
        }

        public static GenerateTemplate(n: number, mirrorX?: boolean): MachinePartTemplate {
            let template = new MachinePartTemplate();

            template.partName = "jumper-" + n.toFixed(0);
            template.w = 2;
            template.h = 2;
            template.n = n;

            template.mirrorX = mirrorX;

            template.nExtendable = true;
            template.xMirrorable = true;

            let d = 2.5 * tileHeight;
            let aDeg = template.n * 10;
            let aRad = (aDeg / 180) * Math.PI;

            let xEnd = tileWidth * 0.5 + Math.cos(aRad) * d;
            let yEnd = -tileHeight * template.h + Math.sin(aRad) * d;

            template.trackTemplates[0] = new TrackTemplate(template);
            template.trackTemplates[0].trackpoints = [new TrackPoint(template.trackTemplates[0], new BABYLON.Vector3(-tileWidth * 0.5, -tileHeight * template.h, 0), Tools.V3Dir(90)), new TrackPoint(template.trackTemplates[0], new BABYLON.Vector3(xEnd, yEnd, 0), Tools.V3Dir(90 - aDeg))];

            if (mirrorX) {
                template.mirrorXTrackPointsInPlace();
            }

            template.initialize();

            return template;
        }
    }
}
