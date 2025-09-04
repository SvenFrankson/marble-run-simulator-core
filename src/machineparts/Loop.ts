/// <reference path="../machine/MachinePart.ts"/>

namespace MarbleRunSimulatorCore {
    export class Loop extends MachinePart {
        constructor(machine: Machine, prop: IMachinePartProp) {
            super(machine, prop);
            this.setColorCount(1);

            if (!isFinite(prop.n)) {
                prop.n = 1;
            }
            prop.n = Math.min(prop.n, 2 * Math.abs(prop.d));
            prop.n = Math.max(prop.n, 1);

            this.setTemplate(this.machine.templateManager.getTemplate(Loop.PropToPartName(prop)));
            this.generateWires();
        }

        public static PropToPartName(prop: IMachinePartProp): string {
            let partName = "loop_" + prop.l.toFixed(0) + "." + prop.d.toFixed(0) + "." + prop.n.toFixed(0);
            return partName;
        }

        public static GenerateTemplate(l: number, d: number, n: number): MachinePartTemplate {
            let template = new MachinePartTemplate();

            template.partName = "loop_" + l.toFixed(0) + "." + d.toFixed(0) + "." + n.toFixed(0);

            template.l = l;
            template.d = d;
            template.n = n;

            template.lExtendableOnX = true;
            template.minL = 3;
            template.dExtendableOnZ = true;
            template.minD = -32;
            template.maxD = 32;
            template.nExtendable = true;

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
            if (template.d === 0) {
                depthStart = - tileSize * 0.3;
                depthEnd = tileSize * 0.3;
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
                            fx = (nLoop + 1) / (loopsCount + 1);
                        }

                        let x = (1 - fx) * xStart + fx * xEnd;

                        let p = new BABYLON.Vector3(sina * r + x, r * 1 - cosa * r, f * (depthEnd - depthStart) + depthStart);
                        if (template.d === 0) {
                            let c = new BABYLON.Vector3(0.5 * (xStart + xEnd), 0, 0);
                            p.subtractInPlace(c);
                            Mummu.RotateInPlace(p, BABYLON.Axis.Y, Math.PI / 12);
                            p.addInPlace(c);
                        }
                        template.trackTemplates[0].trackpoints.push(new TrackPoint(template.trackTemplates[0], p));
                    }
                }
            }

            template.trackTemplates[0].trackpoints.push(new TrackPoint(template.trackTemplates[0], new BABYLON.Vector3(tileSize * template.l - tileSize * 0.5, 0, tileSize * template.d), Tools.V3Dir(90)));
            
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

            template.initialize();

            return template;
        }
    }
}
