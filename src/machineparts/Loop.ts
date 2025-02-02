/// <reference path="../machine/MachinePart.ts"/>

namespace MarbleRunSimulatorCore {
    export class Loop extends MachinePart {
        constructor(machine: Machine, prop: IMachinePartProp) {
            super(machine, prop);

            if (!isFinite(prop.n)) {
                prop.n = 1;
            }
            prop.n = Math.min(prop.n, 2 * prop.d);

            let partName = "loop_" + prop.l.toFixed(0) + "." + prop.d.toFixed(0) + "." + prop.n.toFixed(0);
            this.setTemplate(this.machine.templateManager.getTemplate(partName, prop.mirrorX, prop.mirrorZ));
            this.generateWires();
        }

        public static GenerateTemplate(w: number, d: number, n: number, mirrorX: boolean, mirrorZ: boolean): MachinePartTemplate {
            let template = new MachinePartTemplate();

            template.partName = "loop_" + w.toFixed(0) + "." + d.toFixed(0) + "." + n.toFixed(0);
            template.angleSmoothSteps = 20;

            template.l = w;
            template.h = 4;
            template.d = d;
            template.n = n;
            template.mirrorX = mirrorX;
            template.mirrorZ = mirrorZ;

            template.xExtendable = true;
            template.minL = 2;
            template.zExtendable = true;
            template.minD = 2;
            template.nExtendable = true;
            template.xMirrorable = true;
            template.zMirrorable = true;

            template.trackTemplates[0] = new TrackTemplate(template);
            template.trackTemplates[0].onNormalEvaluated = (n) => {
                n.z = 0;
                n.normalize();
            };
            template.trackTemplates[0].trackpoints = [new TrackPoint(template.trackTemplates[0], new BABYLON.Vector3(-tileWidth * 0.5, -template.h * tileHeight, 0), Tools.V3Dir(90))];

            let loopsCount = n;
            let xStart = tileWidth * 0.5;
            let xEnd = tileWidth * 0.5 + tileWidth * (template.l - 2);
            let r = tileWidth * 0.7;
            let depthStart = 0.013;
            let depthEnd = -0.013;
            if (d > 1) {
                depthStart = 0;
                depthEnd = -tileDepth * (template.d - 1);
            }

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
                        template.trackTemplates[0].trackpoints.push(new TrackPoint(template.trackTemplates[0], new BABYLON.Vector3(sina * r + x, r * 1 - cosa * r - template.h * tileHeight, f * (depthEnd - depthStart) + depthStart)));
                    }
                }
            }

            template.trackTemplates[0].trackpoints.push(new TrackPoint(template.trackTemplates[0], new BABYLON.Vector3(tileWidth * (template.l - 0.5), -template.h * tileHeight, -tileDepth * (template.d - 1)), Tools.V3Dir(90)));

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

            if (mirrorX) {
                template.mirrorXTrackPointsInPlace();
            }
            if (mirrorZ) {
                template.mirrorZTrackPointsInPlace();
            }

            template.initialize();

            return template;
        }
    }
}
