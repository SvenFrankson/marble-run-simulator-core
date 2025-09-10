namespace MarbleRunSimulatorCore {
    export class TeardropTurn extends MachinePart {

        constructor(machine: Machine, prop: IMachinePartProp) {
            super(machine, prop);
            this.setColorCount(1);

            this.setTemplate(this.machine.templateManager.getTemplate(TeardropTurn.PropToPartName(prop)));

            this.generateWires();
        }
        

        public static PropToPartName(prop: IMachinePartProp): string {
            return "teardropTurn_" + prop.h.toFixed(0);
        }

        public static GenerateTemplate(h: number): MachinePartTemplate {
            let template = new MachinePartTemplate();

            template.partName = "teardropTurn_" + h.toFixed(0);
            template.h = h;
            template.hExtendableOnY = true;
            template.maxH = 8;
            template.minH = 1;

            let r = 2 * tileSize;
            let r2 = r / Math.SQRT2;
            let cX = 3 * tileSize;

            template.maxAngle = Math.PI / 6;
            template.defaultAngle = Math.PI / 8;

            template.trackTemplates[0] = new TrackTemplate(template);
            template.trackTemplates[0].colorIndex = 0;
            template.trackTemplates[0].trackpoints = [
                new TrackPoint(template.trackTemplates[0], new BABYLON.Vector3(- tileSize * 0.5, 0, 0), Tools.V3Dir(90)),
                new TrackPoint(template.trackTemplates[0], new BABYLON.Vector3(cX, tileHeight * 0.5, r), (new BABYLON.Vector3(1, 0.1, 0)).normalize()),
                new TrackPoint(template.trackTemplates[0], new BABYLON.Vector3(cX + r2, tileHeight * 0.5, r2)),
                new TrackPoint(template.trackTemplates[0], new BABYLON.Vector3(cX + r, tileHeight * 0.5, 0)),
                new TrackPoint(template.trackTemplates[0], new BABYLON.Vector3(cX + r2, tileHeight * 0.5, -r2)),
                new TrackPoint(template.trackTemplates[0], new BABYLON.Vector3(cX, tileHeight * 0.5, -r), (new BABYLON.Vector3(-1, 0.1, 0)).normalize())
            ];

            for (let h = 1; h < template.h; h++) {
                template.trackTemplates[0].trackpoints.push(new TrackPoint(template.trackTemplates[0], new BABYLON.Vector3(cX - r2, tileHeight * 0.5, -r2)));
                template.trackTemplates[0].trackpoints.push(new TrackPoint(template.trackTemplates[0], new BABYLON.Vector3(cX - r, tileHeight * 0.5, 0)));
                template.trackTemplates[0].trackpoints.push(new TrackPoint(template.trackTemplates[0], new BABYLON.Vector3(cX - r2, tileHeight * 0.5, r2)));
                template.trackTemplates[0].trackpoints.push(new TrackPoint(template.trackTemplates[0], new BABYLON.Vector3(cX, tileHeight * 0.5, r)));
                template.trackTemplates[0].trackpoints.push(new TrackPoint(template.trackTemplates[0], new BABYLON.Vector3(cX + r2, tileHeight * 0.5, r2)));
                template.trackTemplates[0].trackpoints.push(new TrackPoint(template.trackTemplates[0], new BABYLON.Vector3(cX + r, tileHeight * 0.5, 0)));
                template.trackTemplates[0].trackpoints.push(new TrackPoint(template.trackTemplates[0], new BABYLON.Vector3(cX + r2, tileHeight * 0.5, - r2)));
                template.trackTemplates[0].trackpoints.push(new TrackPoint(template.trackTemplates[0], new BABYLON.Vector3(cX, tileHeight * 0.5, - r), (new BABYLON.Vector3(-1, 0.1, 0)).normalize()));
            }

            //template.trackTemplates[0].trackpoints.push(new TrackPoint(template.trackTemplates[0], new BABYLON.Vector3(cX - r2, tileHeight * 0.5, -r2), new BABYLON.Vector3(- 1, 0, 1).normalize()));
            template.trackTemplates[0].trackpoints.push(new TrackPoint(template.trackTemplates[0], new BABYLON.Vector3(- tileSize * 0.5, tileHeight, 0), Tools.V3Dir(- 90)));
            template.trackTemplates[0].onNormalEvaluated = (n) => {
                n.copyFromFloats(0, 1, 0);
            };

            let hermite = (x: number) => {
                let y = (3 * Math.pow(2 * x, 2) - Math.pow(2 * x, 3)) / 4;
                return y;
            }
            let summedLength = [0];
            let trackpoints = template.trackTemplates[0].trackpoints;
            for (let n = 1; n < trackpoints.length; n++) {
                summedLength[n] = summedLength[n - 1] + BABYLON.Vector3.Distance(trackpoints[n].position, trackpoints[n - 1].position);
            }
            let totalLength = summedLength[summedLength.length - 1];

            for (let n = 0; n < template.trackTemplates[0].trackpoints.length; n++) {
                let f = summedLength[n] / totalLength;
                if (template.h <= 2) {
                    f = hermite(f);
                }
                template.trackTemplates[0].trackpoints[n].position.y = f * template.h * tileHeight;
            }

            template.initialize();

            return template;
        }
    }
}
