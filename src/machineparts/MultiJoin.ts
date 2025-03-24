/// <reference path="../machine/MachinePart.ts"/>

namespace MarbleRunSimulatorCore {
    export class MultiJoin extends MachinePart {
        constructor(machine: Machine, prop: IMachinePartProp) {
            super(machine, prop);

            this.setTemplate(this.machine.templateManager.getTemplate(MultiJoin.PropToPartName(prop)));
            this.generateWires();
        }

        public static PropToPartName(prop: IMachinePartProp): string {
            return "multiJoin_" + prop.l.toFixed(0);
        }

        public static GenerateTemplate(l: number, mirrorX: boolean): MachinePartTemplate {
            let template = new MachinePartTemplate();

            template.partName = "multiJoin_" + l.toFixed(0);

            template.l = l;
            template.lExtendableOnX = true;
            template.mirrorX = mirrorX;

            let xLeft = - tileSize * 1.5;
            let xRight = tileSize * l + 0.01;
            let trackLength = xRight - xLeft;

            template.trackTemplates[0] = new TrackTemplate(template);
            template.trackTemplates[0].trackpoints = [
                new TrackPoint(
                    template.trackTemplates[0],
                    new BABYLON.Vector3(xLeft, 0, 0),
                    Tools.V3Dir(90)
                )
            ];
            template.trackTemplates[0].trackpoints.push(
                new TrackPoint(
                    template.trackTemplates[0],
                    new BABYLON.Vector3(xRight, 0.7 * tileHeight, 0),
                    Tools.V3Dir(90 - Math.atan(tileHeight / (trackLength / 2)) / Math.PI * 180)
                )
            );
            template.trackTemplates[0].drawEndTip = true;

            template.trackTemplates[1] = new TrackTemplate(template);
            template.trackTemplates[1].trackpoints = [
                new TrackPoint(
                    template.trackTemplates[1],
                    new BABYLON.Vector3(xLeft, 0 + 0.01, - 0.01),
                    Tools.V3Dir(90),
                    new BABYLON.Vector3(0, 0, 1)
                )
            ];
            template.trackTemplates[1].trackpoints.push(
                new TrackPoint(
                    template.trackTemplates[1],
                    new BABYLON.Vector3(xRight, 0.7 * tileHeight + 0.01, - 0.01),
                    Tools.V3Dir(90 - Math.atan(tileHeight / (trackLength / 2)) / Math.PI * 180),
                    new BABYLON.Vector3(0, 0, 1)
                )
            );
            template.trackTemplates[1].drawStartTip = true;
            template.trackTemplates[1].drawEndTip = true;
            template.trackTemplates[1].forcedAngle = 0;
            template.trackTemplates[1].onNormalEvaluated = (n) => {
                n.copyFromFloats(0, 0, 1);
            }

            let p0 = template.trackTemplates[0].trackpoints[0].position;
            let p1 = template.trackTemplates[0].trackpoints[1].position;
            let dist = BABYLON.Vector3.Distance(p0, p1);
            let t0 = template.trackTemplates[0].trackpoints[0].dir.scale(dist);
            let t1 = template.trackTemplates[0].trackpoints[1].dir.scale(dist);

            for (let i = 0; i < l; i++) {
                template.trackTemplates[2 + i] = new TrackTemplate(template);
                let x = tileSize + i * tileSize;
                let z = tileSize * 2.5;

                let f = (x - xLeft) / (trackLength);
                let pos = BABYLON.Vector3.Hermite(
                    p0,
                    t0,
                    p1,
                    t1,
                    f
                )

                let tmpPoint = new BABYLON.Vector3(x, tileHeight, z * 0.3 + 0.009 * 0.7);

                let exitPoint = new BABYLON.Vector3(x, pos.y + 0.004, 0.009);

                template.trackTemplates[2 + i].trackpoints = [
                    new TrackPoint(
                        template.trackTemplates[2 + i],
                        new BABYLON.Vector3(x, tileHeight, z),
                        new BABYLON.Vector3(0, 0, -1)
                    ),
                    new TrackPoint(
                        template.trackTemplates[2 + i],
                        exitPoint,
                        exitPoint.subtract(tmpPoint).normalize()
                    )
                ];
            }
            
            if (mirrorX) {
                template.mirrorXTrackPointsInPlace();
            }

            template.initialize();

            return template;
        }
    }
}
