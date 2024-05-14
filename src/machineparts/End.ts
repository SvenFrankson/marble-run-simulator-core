namespace MarbleRunSimulatorCore {
    export class End extends MachinePart {
        constructor(machine: Machine, prop: IMachinePartProp) {
            super(machine, prop);

            let partName = "end";
            this.setTemplate(this.machine.templateManager.getTemplate(partName, prop.mirrorX));
            this.generateWires();
        }

        public static GenerateTemplate(mirrorX?: boolean): MachinePartTemplate {
            let template = new MachinePartTemplate();

            template.partName = "end";
            template.w = 2;

            template.mirrorX = mirrorX;

            template.xMirrorable = true;

            let x0 = tileWidth * 0.3;
            let y0 = -1.4 * tileHeight;
            let w = tileWidth * 0.6;
            let r = 0.01;
            template.trackTemplates[0] = new TrackTemplate(template);
            template.trackTemplates[0].trackpoints = [new TrackPoint(template.trackTemplates[0], new BABYLON.Vector3(-tileWidth * 0.5, 0, 0), Tools.V3Dir(90)), new TrackPoint(template.trackTemplates[0], new BABYLON.Vector3(-tileWidth * 0.2 + tileWidth * 0.5, -0.01, 0), Tools.V3Dir(120))];

            template.trackTemplates[1] = new TrackTemplate(template);
            template.trackTemplates[1].colorIndex = 1;
            template.trackTemplates[1].trackpoints = [
                new TrackPoint(template.trackTemplates[1], new BABYLON.Vector3(x0 - w + tileWidth * 0.5, y0 + 1.6 * r, 0), Tools.V3Dir(180), Tools.V3Dir(90)),
                new TrackPoint(template.trackTemplates[1], new BABYLON.Vector3(x0 - w + tileWidth * 0.5, y0 + r, 0), Tools.V3Dir(180)),
                new TrackPoint(template.trackTemplates[1], new BABYLON.Vector3(x0 - w + r + tileWidth * 0.5, y0, 0), Tools.V3Dir(90)),
                new TrackPoint(template.trackTemplates[1], new BABYLON.Vector3(x0 - 0.012 + tileWidth * 0.5, y0, 0), Tools.V3Dir(90)),
                new TrackPoint(template.trackTemplates[1], new BABYLON.Vector3(x0 - 0.001 + tileWidth * 0.5, y0 - 0.005, 0), Tools.V3Dir(90)),
                new TrackPoint(template.trackTemplates[1], new BABYLON.Vector3(x0 + tileWidth * 0.5, y0 - 0.005, 0), Tools.V3Dir(90)),
                new TrackPoint(template.trackTemplates[1], new BABYLON.Vector3(x0 + 0.001 + tileWidth * 0.5, y0 - 0.005, 0), Tools.V3Dir(90)),
                new TrackPoint(template.trackTemplates[1], new BABYLON.Vector3(x0 + 0.012 + tileWidth * 0.5, y0, 0), Tools.V3Dir(90)),
                new TrackPoint(template.trackTemplates[1], new BABYLON.Vector3(x0 + w - r + tileWidth * 0.5, y0, 0), Tools.V3Dir(90)),
                new TrackPoint(template.trackTemplates[1], new BABYLON.Vector3(x0 + w + tileWidth * 0.5, y0 + r, 0), Tools.V3Dir(0)),
                new TrackPoint(template.trackTemplates[1], new BABYLON.Vector3(x0 + w + tileWidth * 0.5, y0 + 1.6 * r, 0), Tools.V3Dir(0), Tools.V3Dir(-90)),
            ];
            template.trackTemplates[1].drawStartTip = true;
            template.trackTemplates[1].drawEndTip = true;

            if (mirrorX) {
                template.mirrorXTrackPointsInPlace();
            }

            template.initialize();

            return template;
        }
    }
}
