namespace MarbleRunSimulatorCore {
    export class TJoin extends MachinePart {
        constructor(machine: Machine, prop: IMachinePartProp) {
            super(machine, prop);
            this.setColorCount(3);

            this.setTemplate(this.machine.templateManager.getTemplate(TJoin.PropToPartName(prop)));

            this.generateWires();
        }

        public static PropToPartName(prop: IMachinePartProp): string {
            return "tjoin";
        }

        public static GenerateTemplate(): MachinePartTemplate {
            let template = new MachinePartTemplate();

            template.partName = "tjoin";

            template.maxAngle = 0;

            let dir = new BABYLON.Vector3(1, 0, 0);
            dir.normalize();
            let n = new BABYLON.Vector3(0, 1, 0);
            n.normalize();

            template.maxAngle = 0;

            template.trackTemplates[0] = new TrackTemplate(template);
            template.trackTemplates[0].trackpoints = [
                new TrackPoint(template.trackTemplates[0], new BABYLON.Vector3(-tileWidth * 0.5, 0, 0), Tools.V3Dir(90)),
                new TrackPoint(template.trackTemplates[0], new BABYLON.Vector3(- 0.011, -tileHeight * 0.3, 0), Tools.V3Dir(120))
            ];

            template.trackTemplates[1] = new TrackTemplate(template);
            template.trackTemplates[1].colorIndex = 1;
            template.trackTemplates[1].trackpoints = [
                new TrackPoint(template.trackTemplates[1], new BABYLON.Vector3(tileWidth * 0.5, 0, 0), Tools.V3Dir(-90)),
                new TrackPoint(template.trackTemplates[1], new BABYLON.Vector3(0.011, -tileHeight * 0.3, 0), Tools.V3Dir(-120))
            ];

            template.trackTemplates[2] = new TrackTemplate(template);
            template.trackTemplates[2].colorIndex = 2;
            template.trackTemplates[2].trackpoints = [
                new TrackPoint(template.trackTemplates[2], new BABYLON.Vector3(0, 0, tileSize * 0.5), new BABYLON.Vector3(0, -1, 0), new BABYLON.Vector3(0, 0, -1)),
                new TrackPoint(template.trackTemplates[2], new BABYLON.Vector3(0, - tileHeight, - tileWidth * 0.5), new BABYLON.Vector3(0, 0, -1))
            ];

            template.trackTemplates[3] = new TrackTemplate(template);
            template.trackTemplates[3].colorIndex = 3;
            template.trackTemplates[3].trackpoints = [
                new TrackPoint(template.trackTemplates[3], new BABYLON.Vector3(-tileWidth * 0.25, 0.011, 0), Tools.V3Dir(135), BABYLON.Vector3.Down()),
                new TrackPoint(template.trackTemplates[3], new BABYLON.Vector3(tileWidth * 0.25, 0.011, 0), Tools.V3Dir(45), BABYLON.Vector3.Down()),
            ];
            template.trackTemplates[3].drawStartTip = true;
            template.trackTemplates[3].drawEndTip = true;
            template.trackTemplates[3].noMiniatureRender = true;

            template.initialize();

            return template;

            return template;
        }
    }
}
