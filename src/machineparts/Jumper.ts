namespace MarbleRunSimulatorCore {
    export class Jumper extends MachinePart {
        constructor(machine: Machine, prop: IMachinePartProp) {
            super(machine, prop);

            this.setTemplate(this.machine.templateManager.getTemplate(Jumper.PropToPartName(prop)));
            this.generateWires();
        }

        public static PropToPartName(prop: IMachinePartProp): string {
            let partName = "jumper_" + prop.n.toFixed(0);
            return partName;
        }

        public static GenerateTemplate(n: number): MachinePartTemplate {
            let template = new MachinePartTemplate();

            template.partName = "jumper_" + n.toFixed(0);
            template.l = 2;
            template.h = 2;
            template.n = n;

            template.nExtendable = true;

            if (n < 9) {
                let d = 2.5 * tileHeight;
                let aDeg = template.n * 10;
                let aRad = (aDeg / 180) * Math.PI;
    
                let xEnd = tileWidth * 0.5 + Math.cos(aRad) * d;
                let yEnd = -tileHeight * template.h + Math.sin(aRad) * d;
    
                template.trackTemplates[0] = new TrackTemplate(template);
                template.trackTemplates[0].trackpoints = [new TrackPoint(template.trackTemplates[0], new BABYLON.Vector3(-tileWidth * 0.5, -tileHeight * template.h, 0), Tools.V3Dir(90)), new TrackPoint(template.trackTemplates[0], new BABYLON.Vector3(xEnd, yEnd, 0), Tools.V3Dir(90 - aDeg))];
            }
            else {
                let d = 2.5 * tileHeight - 0.02;

                template.trackTemplates[0] = new TrackTemplate(template);
                template.trackTemplates[0].trackpoints = [
                    new TrackPoint(template.trackTemplates[0], new BABYLON.Vector3(-tileWidth * 0.5, -tileHeight * template.h, 0), Tools.V3Dir(90)),
                    new TrackPoint(template.trackTemplates[0], new BABYLON.Vector3(-tileWidth * 0.5 + 0.02, -tileHeight * template.h, 0), Tools.V3Dir(90)),
                    new TrackPoint(template.trackTemplates[0], new BABYLON.Vector3(-tileWidth * 0.5 + 0.02 + d * Math.SQRT2 / 2, tileHeight * 0.5 - 0.02 - d * Math.SQRT2 / 2, 0)),
                    new TrackPoint(template.trackTemplates[0], new BABYLON.Vector3(tileWidth * 0.5, tileHeight * 0.5 - 0.01, 0), Tools.V3Dir(0)),
                    new TrackPoint(template.trackTemplates[0], new BABYLON.Vector3(tileWidth * 0.5, tileHeight * 0.5, 0), Tools.V3Dir(0), Tools.V3Dir(-90))
                ];
            }

            template.initialize();

            return template;
        }
    }
}
