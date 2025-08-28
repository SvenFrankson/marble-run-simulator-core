namespace MarbleRunSimulatorCore {
    export class Ladder extends MachinePart {
        constructor(machine: Machine, prop: IMachinePartProp) {
            super(machine, prop);

            this.setColorCount(1);

            this.setTemplate(this.machine.templateManager.getTemplate(Ladder.PropToPartName(prop)));
            this.generateWires();
        }

        public static PropToPartName(prop: IMachinePartProp): string {
            let partName = "ladder_" + prop.l.toFixed(0) + "." + prop.h.toFixed(0);
            return partName;
        }

        public static GenerateTemplate(l: number, h: number): MachinePartTemplate {
            let template = new MachinePartTemplate();

            template.partName = "ladder_" + l.toFixed(0) + "." + h.toFixed(0);
            template.l = l;
            template.h = h;
            template.n = h;

            template.lExtendableOnX = true;
            template.minLAbsolute = 1;
            template.minL = -32;
            template.maxL = 32;
            template.hExtendableOnY = true;
            template.minH = 1;
            template.downwardYExtendable = true;

            template.nExtendable = true;

            let x0 = - tileSize * 0.5;
            let x1 = - tileSize * 0.5 + l * tileSize;
            let wallD = 0.005;
            let hole = 0.02;
            let drop = 0.005;
            
            let count: number;
            if (h % 2 === 0) {
                count = h - 1;
            }
            else {
                count = h - 2;
            }
            let dy = h * tileSize / (count + 1);

            template.trackTemplates[0] = new TrackTemplate(template);
            template.trackTemplates[0].trackpoints = [
                new TrackPoint(template.trackTemplates[0], new BABYLON.Vector3(x0, 0, 0), Tools.V3Dir(90)),
                new TrackPoint(template.trackTemplates[0], new BABYLON.Vector3(x1 - wallD - hole, - drop, 0), Tools.V3Dir(90)),
            ];
            template.trackTemplates[1] = new TrackTemplate(template);
            template.trackTemplates[1].trackpoints = [
                new TrackPoint(template.trackTemplates[1], new BABYLON.Vector3(x0 + wallD, - h * tileHeight + drop, 0), Tools.V3Dir(92)),
                new TrackPoint(template.trackTemplates[1], new BABYLON.Vector3(x1, - h * tileHeight, 0), Tools.V3Dir(90)),
            ];
            template.trackTemplates[2] = new TrackTemplate(template);
            template.trackTemplates[2].trackpoints = [
                new TrackPoint(template.trackTemplates[2], new BABYLON.Vector3(x0 + wallD, - tileHeight * 0.5, 0), Tools.V3Dir(180), Tools.V3Dir(90)),
                new TrackPoint(template.trackTemplates[2], new BABYLON.Vector3(x0 + wallD, - h * tileHeight, 0), Tools.V3Dir(180), Tools.V3Dir(90)),
            ];

            template.trackTemplates[3] = new TrackTemplate(template);
            template.trackTemplates[3].trackpoints = [
                new TrackPoint(template.trackTemplates[3], new BABYLON.Vector3(x1 - wallD, tileHeight * 0.5, 0), Tools.V3Dir(180), Tools.V3Dir(-90)),
                new TrackPoint(template.trackTemplates[3], new BABYLON.Vector3(x1 - wallD, - h * tileHeight + tileHeight, 0), Tools.V3Dir(180), Tools.V3Dir(-90)),
            ];

            for (let n = 0; n < count; n++) {
                if (n % 2 === 0) {
                    let trackTemplate = new TrackTemplate(template);
                    trackTemplate.trackpoints = [
                        new TrackPoint(trackTemplate, new BABYLON.Vector3(x1 - wallD, 0 - dy * (n + 1), 0), Tools.V3Dir(- 90)),
                        new TrackPoint(trackTemplate, new BABYLON.Vector3(x0 + wallD + hole, 0 - dy * (n + 1) - drop, 0), Tools.V3Dir(- 90)),
                    ];
                    template.trackTemplates.push(trackTemplate);
                }
                else {
                    let trackTemplate = new TrackTemplate(template);
                    trackTemplate.trackpoints = [
                        new TrackPoint(trackTemplate, new BABYLON.Vector3(x0 + wallD, 0 - dy * (n + 1), 0), Tools.V3Dir(90)),
                        new TrackPoint(trackTemplate, new BABYLON.Vector3(x1 - wallD - hole, 0 - dy * (n + 1) - drop, 0), Tools.V3Dir(90)),
                    ];
                    template.trackTemplates.push(trackTemplate);
                }
            }

            template.initialize();

            return template;
        }
    }
}
