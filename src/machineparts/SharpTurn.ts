namespace MarbleRunSimulatorCore {
    export class UTurnSharp extends MachinePart {
        constructor(machine: Machine, prop: IMachinePartProp) {
            super(machine, prop);

            let partName = "uturnsharp";
            this.setTemplate(this.machine.templateManager.getTemplate(partName, prop.mirrorX, prop.mirrorZ));
            this.generateWires();
        }

        public static GenerateTemplate(mirrorX?: boolean, mirrorZ?: boolean): MachinePartTemplate {
            let template = new MachinePartTemplate();

            template.partName = "uturnsharp";
            template.d = 2;
            template.angleSmoothSteps = 50;

            (template.mirrorX = mirrorX), (template.mirrorZ = mirrorZ);

            template.xMirrorable = true;
            template.zMirrorable = true;

            template.trackTemplates[0] = new TrackTemplate(template);
            template.trackTemplates[0].trackpoints = [
                new TrackPoint(template.trackTemplates[0], new BABYLON.Vector3(-0.075, 0, 0), new BABYLON.Vector3(1, 0, 0)),
                new TrackPoint(template.trackTemplates[0], new BABYLON.Vector3(0.0193, -0.0084, 0.0)),
                new TrackPoint(template.trackTemplates[0], new BABYLON.Vector3(0.0518, 0.0057, -0.0046)),
                new TrackPoint(template.trackTemplates[0], new BABYLON.Vector3(0.0638, 0.0181, -0.0256)),
                new TrackPoint(template.trackTemplates[0], new BABYLON.Vector3(0.0586, 0.0099, -0.0448)),
                new TrackPoint(template.trackTemplates[0], new BABYLON.Vector3(0.0454, -0.0086, -0.0519)),
                new TrackPoint(template.trackTemplates[0], new BABYLON.Vector3(0.0262, -0.0253, -0.0454)),
                new TrackPoint(template.trackTemplates[0], new BABYLON.Vector3(-0.0152, -0.0301, 0), new BABYLON.Vector3(-1, 0, 0)),
                new TrackPoint(template.trackTemplates[0], new BABYLON.Vector3(-0.075, -0.03, 0), new BABYLON.Vector3(-1, 0, 0)),
            ];

            if (mirrorX) {
                template.mirrorXTrackPointsInPlace();
            }
            if (mirrorZ) {
                template.mirrorZTrackPointsInPlace();
            }

            template.initialize();

            return template;
        }
    }
}
