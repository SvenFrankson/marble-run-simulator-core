namespace MarbleRunSimulatorCore {
    export class UTurnSharp extends MachinePart {
        constructor(machine: Machine, prop: IMachinePartProp) {
            super(machine, prop);

            if (isNaN(prop.h)) {
                prop.h = 1;
            }

            let partName = "uturnsharp-" + prop.h.toFixed(0);
            this.setTemplate(this.machine.templateManager.getTemplate(partName, prop.mirrorX));

            for (let i = this.colors.length; i < 2; i++) {
                this.colors[i] = 0;
            }

            this.generateWires();
        }

        public static GenerateTemplate(h: number, mirrorX?: boolean): MachinePartTemplate {
            let template = new MachinePartTemplate();

            if (isNaN(h)) {
                h = 1;
            }
            template.partName = "uturnsharp-" + h.toFixed(0);
            template.h = h;
            template.w = 1 + Math.floor((template.h + 1) / 5);


            template.yExtendable = true;
            template.mirrorX = mirrorX;
            template.xMirrorable = true;

            let dir = new BABYLON.Vector3(1, 0, 0);
            dir.normalize();
            let n = new BABYLON.Vector3(0, 1, 0);
            n.normalize();

            let dY = 0.014;
            let yIn = 0;
            let yOut = - tileHeight * template.h;

            let cY = (yIn + yOut + dY) * 0.5;
            let rIn = Math.abs(yIn - cY);
            let rOut = Math.abs(yOut - cY);

            let endAngle = 120;
            let dirJoin = Tools.V3Dir(endAngle);
            let nJoin = Tools.V3Dir(endAngle - 90);
            let pEnd = new BABYLON.Vector3(- 0.01, -tileHeight * 0.3, 0);

            template.trackTemplates[0] = new TrackTemplate(template);
            template.trackTemplates[0].colorIndex = 0;
            template.trackTemplates[0].trackpoints = [new TrackPoint(template.trackTemplates[0], new BABYLON.Vector3(- tileWidth * 0.5, yIn, 0), Tools.V3Dir(90), Tools.V3Dir(0))];

            template.trackTemplates[1] = new TrackTemplate(template);
            template.trackTemplates[1].colorIndex = 1;
            template.trackTemplates[1].trackpoints = [];
            template.trackTemplates[1].drawStartTip = true;

            for (let a = 0; a <= 4; a++) {
                let f = a / 4;
                let angle = Math.PI * f;
                let cosa = Math.cos(angle);
                let sina = Math.sin(angle);

                let norm: BABYLON.Vector3;
                let dir: BABYLON.Vector3;
                if (a === 0) {
                    dir = Tools.V3Dir(90);
                    norm = Tools.V3Dir(0);
                }
                if (a === 4) {
                    dir = Tools.V3Dir(-90);
                    norm = Tools.V3Dir(180);
                }

                let p = new BABYLON.Vector3(- tileWidth * 0.5 + dY, cY, 0);
                p.x += sina * rIn;
                p.y += cosa * rIn;
                template.trackTemplates[0].trackpoints.push(new TrackPoint(template.trackTemplates[0], p, dir, norm));

                p = new BABYLON.Vector3(- tileWidth * 0.5 + dY, cY, 0);
                p.x += sina * rOut;
                p.y += cosa * rOut;
                template.trackTemplates[1].trackpoints.push(new TrackPoint(template.trackTemplates[1], p, dir, norm ? norm.scale(-1) : undefined));
            }

            template.trackTemplates[0].trackpoints.push();
            template.trackTemplates[0].drawEndTip = true;
            template.trackTemplates[1].trackpoints.push(new TrackPoint(template.trackTemplates[1], new BABYLON.Vector3(- tileWidth * 0.5, yOut, 0), Tools.V3Dir(- 90), Tools.V3Dir(0)));

            if (mirrorX) {
                template.mirrorXTrackPointsInPlace();
            }

            template.initialize();

            return template;
        }
    }
}
