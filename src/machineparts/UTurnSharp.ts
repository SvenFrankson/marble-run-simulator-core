namespace MarbleRunSimulatorCore {
    export class UTurnSharp extends MachinePart {
        constructor(machine: Machine, prop: IMachinePartProp) {
            super(machine, prop);

            let partName = "uturnsharp";
            this.setTemplate(this.machine.templateManager.getTemplate(partName, prop.mirrorX));

            for (let i = this.colors.length; i < 2; i++) {
                this.colors[i] = 0;
            }

            this.generateWires();
        }

        public static GenerateTemplate(mirrorX?: boolean): MachinePartTemplate {
            let template = new MachinePartTemplate();

            template.partName = "uturnsharp";
            template.w = 1;
            template.h = 1;

            template.mirrorX = mirrorX;
            template.xMirrorable = true;

            let dir = new BABYLON.Vector3(1, 0, 0);
            dir.normalize();
            let n = new BABYLON.Vector3(0, 1, 0);
            n.normalize();

            let endAngle = 120;
            let dirJoin = Tools.V3Dir(endAngle);
            let nJoin = Tools.V3Dir(endAngle - 90);
            let pEnd = new BABYLON.Vector3(- 0.01, -tileHeight * 0.3, 0);

            template.trackTemplates[0] = new TrackTemplate(template);
            template.trackTemplates[0].colorIndex = 0;
            template.trackTemplates[0].trackpoints = [
                new TrackPoint(template.trackTemplates[0], new BABYLON.Vector3(- tileWidth * 0.5, 0, 0), dir),
                new TrackPoint(template.trackTemplates[0], pEnd, dirJoin)
            ];

            template.trackTemplates[1] = new TrackTemplate(template);
            template.trackTemplates[1].colorIndex = 1;
            template.trackTemplates[1].trackpoints = [
                new TrackPoint(template.trackTemplates[1], new BABYLON.Vector3(- tileWidth * 0.4, 0.014, 0), Tools.V3Dir(90), Tools.V3Dir(180)),
            ];

            let a0 = (endAngle - 90) / 180 * Math.PI;
            for (let a = 0; a <= 4; a++) {
                let f = a / 4;
                let angle = a0 * (1 - f) + Math.PI * f;
                let r = 0.014 * (1 - f) + tileHeight * 0.7 * f;
                let cosa = Math.cos(angle);
                let sina = Math.sin(angle);

                let p = pEnd.clone();
                p.x += sina * r;
                p.y += cosa * r;

                template.trackTemplates[1].trackpoints.push(
                    new TrackPoint(template.trackTemplates[1], p)
                )
            }

            template.trackTemplates[1].trackpoints.push(
                new TrackPoint(template.trackTemplates[1], new BABYLON.Vector3(- tileWidth * 0.5, -tileHeight * template.h, 0), dir.scale(-1), new BABYLON.Vector3(0, 1, 0))
            )
            template.trackTemplates[1].drawStartTip = true;

            if (mirrorX) {
                template.mirrorXTrackPointsInPlace();
            }

            template.initialize();

            return template;
        }
    }
}
