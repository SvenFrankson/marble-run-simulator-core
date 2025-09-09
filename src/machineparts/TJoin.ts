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

            let dirJoin = Tools.V3Dir(-120);
            let nJoin = Tools.V3Dir(-30);
            let pEnd = new BABYLON.Vector3(0.01, -tileHeight * 0.3, 0);

            template.trackTemplates[0] = new TrackTemplate(template);
            template.trackTemplates[0].trackpoints = [
                new TrackPoint(template.trackTemplates[0], new BABYLON.Vector3(-tileWidth * 0.5, 0, 0), dir),
                new TrackPoint(template.trackTemplates[0], new BABYLON.Vector3(tileWidth * 0.2, -tileHeight, 0), dir),
                new TrackPoint(template.trackTemplates[0], new BABYLON.Vector3(tileWidth * 0.5, -tileHeight, 0), dir),
            ];

            template.trackTemplates[1] = new TrackTemplate(template);
            template.trackTemplates[1].colorIndex = 1;
            template.trackTemplates[1].trackpoints = [
                new TrackPoint(template.trackTemplates[1], new BABYLON.Vector3(tileWidth * 0.5, 0, 0), dir.scale(-1)),
                new TrackPoint(template.trackTemplates[1], pEnd, dirJoin)
            ];

            template.trackTemplates[2] = new TrackTemplate(template);
            template.trackTemplates[2].colorIndex = 2;
            template.trackTemplates[2].trackpoints = [
                new TrackPoint(template.trackTemplates[2], new BABYLON.Vector3(-tileWidth * 0.25, 0.008, 0), Tools.V3Dir(135), BABYLON.Vector3.Down()),
                new TrackPoint(template.trackTemplates[2], new BABYLON.Vector3(tileWidth * 0.25, 0.008, 0), Tools.V3Dir(50), BABYLON.Vector3.Down()),
            ];
            template.trackTemplates[2].drawStartTip = true;
            template.trackTemplates[2].drawEndTip = true;
            template.trackTemplates[2].noMiniatureRender = true;

            template.initialize();

            return template;
        }
    }
}
