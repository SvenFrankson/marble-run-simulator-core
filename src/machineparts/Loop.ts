/// <reference path="../machine/MachinePart.ts"/>

namespace MarbleRunSimulatorCore {
    export class Loop extends MachinePart {
        constructor(machine: Machine, prop: IMachinePartProp) {
            super(machine, prop);

            if (!isFinite(prop.n)) {
                prop.n = 1;
            }
            prop.n = Math.min(prop.n, 2 * Math.abs(prop.d));

            let partName = "loop_" + prop.l.toFixed(0) + "." + prop.d.toFixed(0) + "." + prop.n.toFixed(0);
            this.setTemplate(this.machine.templateManager.getTemplate(partName, prop.mirrorX, prop.mirrorZ));
            this.generateWires();
        }

        public static GenerateTemplate(l: number, d: number, n: number, mirrorZ: boolean): MachinePartTemplate {
            let template = new MachinePartTemplate();

            template.partName = "loop_" + l.toFixed(0) + "." + d.toFixed(0) + "." + n.toFixed(0);

            template.l = l;
            template.h = 4;
            template.d = d;
            template.n = n;
            template.mirrorZ = mirrorZ;

            template.lExtendableOnX = true;
            template.minL = 6;
            template.dExtendableOnZ = true;
            template.minD = -32;
            template.maxD = 32;
            template.minDAbsolute = 1;
            template.nExtendable = true;
            template.zMirrorable = true;

            template.trackTemplates[0] = new TrackTemplate(template);
            template.trackTemplates[0].onNormalEvaluated = (n) => {
                n.z = 0;
                n.normalize();
            };
            template.trackTemplates[0].trackpoints = [new TrackPoint(template.trackTemplates[0], new BABYLON.Vector3(- tileSize * 0.5, 0, 0), Tools.V3Dir(90))];

            let loopsCount = n;
            let xStart = - tileSize * 0.5;
            let xEnd = - tileSize * 0.5 + tileSize * template.l;
            let r = tileWidth * 0.7;
            let depthStart = 0;
            let depthEnd = tileSize * template.d;

            for (let nLoop = 0; nLoop < loopsCount; nLoop++) {
                for (let n = 0; n <= 8; n++) {
                    if (n < 8 || xStart != xEnd || nLoop === loopsCount - 1) {
                        let f = (n + 8 * nLoop) / (8 * loopsCount);
                        let a = (2 * Math.PI * n) / 8;
                        let cosa = Math.cos(a);
                        let sina = Math.sin(a);
        
                        let fx = 0.5;
                        if (loopsCount > 1) {
                            fx = nLoop / (loopsCount - 1);
                        }
                        let x = (1 - fx) * xStart + fx * xEnd;
                        template.trackTemplates[0].trackpoints.push(new TrackPoint(template.trackTemplates[0], new BABYLON.Vector3(sina * r + x, r * 1 - cosa * r, f * (depthEnd - depthStart) + depthStart)));
                    }
                }
            }

            template.trackTemplates[0].trackpoints.push(new TrackPoint(template.trackTemplates[0], new BABYLON.Vector3(tileSize * template.l - tileSize * 0.5, 0, depthEnd), Tools.V3Dir(90)));

            let points = template.trackTemplates[0].trackpoints.map((tp) => {
                return tp.position.clone();
            });
            let f = 3;
            for (let n = 0; n < 2; n++) {
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

            if (mirrorZ) {
                template.mirrorZTrackPointsInPlace();
            }

            template.initialize();

            return template;
        }
    }
}
