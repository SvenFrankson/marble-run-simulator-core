namespace MarbleRunSimulatorCore {
    export class Start extends MachinePart {
        constructor(machine: Machine, prop: IMachinePartProp) {
            super(machine, prop);

            this.setTemplate(this.machine.templateManager.getTemplate(Start.PropToPartName(prop)));
            this.generateWires();
        }

        public static PropToPartName(prop: IMachinePartProp): string {
            return "start";
        }

        public static GenerateTemplate(mirrorX?: boolean): MachinePartTemplate {
            let template = new MachinePartTemplate();

            template.partName = "start";
            template.h = 0;

            template.mirrorX = mirrorX;

            template.xMirrorable = true;

            template.trackTemplates[0] = new TrackTemplate(template);
            template.trackTemplates[0].trackpoints = [
                new TrackPoint(template.trackTemplates[0], new BABYLON.Vector3(- tileWidth * 0.5, 0.008, 0), Tools.V3Dir(110)),
                new TrackPoint(template.trackTemplates[0], new BABYLON.Vector3(tileWidth * 0.5, 0, 0), Tools.V3Dir(90))
            ];
            template.trackTemplates[0].drawStartTip = true;

            if (mirrorX) {
                template.mirrorXTrackPointsInPlace();
            }

            template.initialize();

            return template;
        }
    }
}
