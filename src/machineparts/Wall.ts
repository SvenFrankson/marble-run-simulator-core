namespace MarbleRunSimulatorCore {
    export class Wall extends MachinePart {
        constructor(machine: Machine, prop: IMachinePartProp) {
            super(machine, prop);

            this.setTemplate(this.machine.templateManager.getTemplate(Wall.PropToPartName(prop)));
            this.generateWires();
        }

        public static PropToPartName(prop: IMachinePartProp): string {
            let partName = "wall_" + prop.l.toFixed(0) + "." + prop.h.toFixed(0);
            return partName;
        }

        public static GenerateTemplate(l: number, h: number): MachinePartTemplate {
            let template = new MachinePartTemplate();

            template.partName = "wall_" + l.toFixed(0) + "." + h.toFixed(0);
            template.angleSmoothSteps = 100;
            template.maxAngle = (0.8 * Math.PI) / 2;
            template.minTurnRadius = 0.12;

            template.l = l;
            template.minL = 3;
            template.h = h;
            template.minH = 3;

            template.yExtendable = true;
            template.lExtendableOnZ = true;

            let r = tileWidth;
            let rY = template.h * tileHeight * 0.45;
            let depthStart = 0;
            let depthEnd = tileSize * template.l;

            template.trackTemplates[0] = new TrackTemplate(template);
            template.trackTemplates[0].trackpoints = [new TrackPoint(template.trackTemplates[0], new BABYLON.Vector3(- tileSize * 0.5, 0, 0), Tools.V3Dir(90))];

            for (let n = 0; n <= 8; n++) {
                let f = n / 8;
                let cosa = Math.cos(2 * Math.PI * f);
                let sina = Math.sin(Math.PI * f);

                template.trackTemplates[0].trackpoints.push(new TrackPoint(template.trackTemplates[0], new BABYLON.Vector3(-(1 - sina) * r + r, (1 - cosa) * rY, Nabu.Easing.easeInOutSine(Nabu.Easing.easeInOutSine(f)) * (depthEnd - depthStart) + depthStart), undefined, n === 4 ? Tools.V3Dir(Math.PI) : undefined));
            }

            template.trackTemplates[0].trackpoints.push(new TrackPoint(template.trackTemplates[0], new BABYLON.Vector3(- tileSize * 0.5, 0, depthEnd), Tools.V3Dir(-90)));

            let points = template.trackTemplates[0].trackpoints.map((tp) => {
                return tp.position.clone();
            });
            let f = 3;
            for (let n = 0; n < 1; n++) {
                let smoothedPoints = [...points].map((p) => {
                    return p.clone();
                });
                for (let i = 1; i < smoothedPoints.length - 1; i++) {
                    smoothedPoints[i]
                        .copyFrom(points[i - 1])
                        .addInPlace(points[i].scale(f))
                        .addInPlace(points[i + 1])
                        .scaleInPlace(1 / (2 + f));
                }
                points = smoothedPoints;
            }

            for (let i = 0; i < points.length; i++) {
                template.trackTemplates[0].trackpoints[i].position.copyFrom(points[i]);
            }

            template.initialize();

            return template;
        }
    }
}
