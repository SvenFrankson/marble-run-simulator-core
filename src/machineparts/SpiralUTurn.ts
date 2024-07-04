/// <reference path="../machine/MachinePart.ts"/>

namespace MarbleRunSimulatorCore {
    export class SpiralUTurn extends MachinePart {
        constructor(machine: Machine, prop: IMachinePartProp) {
            super(machine, prop);

            prop.d = Nabu.MinMax(prop.d, 2, 3);

            let partName = "spiralUTurn-" + prop.h.toFixed(0) + "." + prop.d.toFixed(0);
            this.setTemplate(this.machine.templateManager.getTemplate(partName, prop.mirrorX, prop.mirrorZ));
            this.generateWires();
        }

        public static GenerateTemplate(h: number, d: number, mirrorX: boolean, mirrorZ: boolean): MachinePartTemplate {
            let template = new MachinePartTemplate();
            template.getWidthForDepth = (d: number) => {
                if (d < 3) {
                    return d;
                }
                return d - 1;
            }

            template.partName = "spiralUTurn-" + h.toFixed(0) + "." + d.toFixed(0);
            template.angleSmoothSteps = 200;

            template.w = template.getWidthForDepth(d);
            template.h = h;
            template.d = d;
            template.n = h;
            template.mirrorX = mirrorX;
            template.mirrorZ = mirrorZ;

            template.yExtendable = true;
            template.zExtendable = true;
            template.xMirrorable = true;
            template.zMirrorable = true;

            template.trackTemplates[0] = new TrackTemplate(template);
            //template.trackTemplates[0].preferedStartBank = - Math.PI / 10 * (template.mirrorX ? - 1 : 1);
            //template.trackTemplates[0].preferedEndBank = - Math.PI / 10 * (template.mirrorX ? - 1 : 1);
            template.trackTemplates[0].onNormalEvaluated = (n) => {
                n.copyFromFloats(0, 1, 0);
            };
            template.trackTemplates[0].trackpoints = [new TrackPoint(template.trackTemplates[0], new BABYLON.Vector3(-tileWidth * 0.5, 0, 0), Tools.V3Dir(90))];

            let nSpirals = template.n - 1;
            let depthInM = (template.d - 1) * tileDepth;
            let r = depthInM * 0.5;
            let heightStart = 0 - 0.003;
            let heightEnd = - tileHeight * template.h + 0.003;
            let x = - tileWidth * 0.5 + r + 0.025;

            for (let nS = 0; nS <= nSpirals; nS++) {

                let nV0 = 0;
                if (nS >= 1) {
                    nV0 = 1;
                }
                let nVMax = 8;
                if (nS === nSpirals) {
                    nVMax = 4;
                }   
                for (let nV = nV0; nV <= nVMax; nV++) {
                    let f = ((nS * 8) + nV) / ((nSpirals + 0.5) * 8);
                    let a = (2 * Math.PI * nV) / 8;
                    let cosa = Math.cos(a);
                    let sina = Math.sin(a);
                    
                    template.trackTemplates[0].trackpoints.push(
                        new TrackPoint(template.trackTemplates[0], new BABYLON.Vector3(x + sina * r, f * (heightEnd - heightStart) + heightStart, - r + cosa * r))
                    );
                }
            }

            template.trackTemplates[0].trackpoints.push(new TrackPoint(template.trackTemplates[0], new BABYLON.Vector3(-tileWidth * 0.5, - tileHeight * template.h, - tileDepth * (template.d - 1)), Tools.V3Dir(- 90)));

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
