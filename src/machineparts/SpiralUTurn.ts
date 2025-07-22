/// <reference path="../machine/MachinePart.ts"/>

namespace MarbleRunSimulatorCore {
    export class SpiralUTurn extends MachinePart {
        constructor(machine: Machine, prop: IMachinePartProp) {
            super(machine, prop);
            this.setColorCount(1);

            this.setTemplate(this.machine.templateManager.getTemplate(SpiralUTurn.PropToPartName(prop), prop.mirrorX, prop.mirrorZ));
            this.generateWires();
        }

        public static PropToPartName(prop: IMachinePartProp): string {
            return "spiralUTurn_" + prop.l.toFixed(0) + "." + prop.h.toFixed(0);
        }

        public static GenerateTemplate(l: number, h: number): MachinePartTemplate {
            let template = new MachinePartTemplate();

            template.partName = "spiralUTurn_" + l.toFixed(0) + "." + h.toFixed(0);
            template.angleSmoothSteps = 200;

            template.l = l;
            template.h = h;
            template.n = h;

            template.lExtendableOnZ = true;
            template.minLAbsolute = 1;
            template.minL = -32;
            template.maxL = 32;
            template.hExtendableOnY = true;
            template.minH = 1;
            template.downwardYExtendable = true;
            
            template.defaultAngle = Math.PI / 6;
            template.maxAngle = Math.PI / 3;

            template.trackTemplates[0] = new TrackTemplate(template);
            //template.trackTemplates[0].preferedStartBank = - Math.PI / 10 * (template.mirrorX ? - 1 : 1);
            //template.trackTemplates[0].preferedEndBank = - Math.PI / 10 * (template.mirrorX ? - 1 : 1);
            template.trackTemplates[0].onNormalEvaluated = (n) => {
                n.copyFromFloats(0, 1, 0);
            };
            template.trackTemplates[0].trackpoints = [new TrackPoint(template.trackTemplates[0], new BABYLON.Vector3(-tileSize * 0.5, 0, 0), Tools.V3Dir(90))];

            let nSpirals = template.n - 1;
            let depthInM = template.l * tileSize;
            let r = Math.abs(depthInM * 0.5);
            let heightStart = 0 - 0.003;
            let heightEnd = - tileHeight * template.h + 0.003;
            let x = - tileSize * 0.5 + r + 0.025;

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
                    
                    let absZ = r - cosa * (r - Math.sign(template.l) * 0.0008 * template.l);
                    template.trackTemplates[0].trackpoints.push(
                        new TrackPoint(template.trackTemplates[0], new BABYLON.Vector3(x + sina * r, f * (heightEnd - heightStart) + heightStart, Math.sign(template.l) * absZ))
                    );
                }
            }

            template.trackTemplates[0].trackpoints.push(new TrackPoint(template.trackTemplates[0], new BABYLON.Vector3(-tileSize * 0.5, - tileHeight * template.h, tileSize * template.l), Tools.V3Dir(- 90)));

            template.initialize();

            return template;
        }
    }
}
